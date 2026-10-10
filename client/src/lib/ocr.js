// Reads the text of a lab report in the browser, so the file never leaves the device.
// Digital PDFs: read their text directly (fast, exact). Scanned PDFs and photos: OCR with
// Tesseract, served from our own domain (/ocr, copied there by scripts/copy-ocr-assets.mjs).

const MAX_PAGES = 4;
const MAX_SIDE = 2200; // larger photos are scaled down: faster and just as accurate
const MIN_WIDTH = 1600; // small images (screenshots, WhatsApp copies) are enlarged: decimal points survive

/** Groups pdf.js text items into lines by their vertical position, left to right. */
function itemsToLines(items) {
  const rows = new Map();
  for (const it of items) {
    if (!it.str?.trim()) continue;
    const y = Math.round(it.transform[5] / 3) * 3;
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y).push(it);
  }
  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, row]) => row.sort((a, b) => a.transform[4] - b.transform[4]).map((i) => i.str).join('  '))
    .join('\n');
}

async function loadPdf(file) {
  const pdfjs = await import('pdfjs-dist');
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  return pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
}

function scaledCanvas(width, height) {
  const scale = Math.min(Math.max(1, Math.min(2, MIN_WIDTH / width)), MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  return { canvas, scale };
}

async function imageToCanvas(file) {
  const bitmap = await createImageBitmap(file);
  const { canvas } = scaledCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.filter = 'grayscale(1) contrast(1.2)'; // helps with phone photos of paper
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas;
}

async function ocrCanvases(canvases, onProgress) {
  const { createWorker } = await import('tesseract.js');
  let page = 0;
  const worker = await createWorker('eng', 1, {
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr/core',
    langPath: '/ocr/lang',
    workerBlobURL: false, // load the worker from our domain (keeps the security policy strict)
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress?.({ step: 'reading', progress: (page + m.progress) / canvases.length });
      else onProgress?.({ step: 'preparing', progress: 0 });
    },
  });
  try {
    await worker.setParameters({ preserve_interword_spaces: '1' });
    const texts = [];
    for (; page < canvases.length; page++) texts.push((await worker.recognize(canvases[page])).data.text);
    return texts.join('\n');
  } finally {
    await worker.terminate();
  }
}

/**
 * @param {File} file a PDF or an image
 * @param {(p: {step: string, progress: number}) => void} onProgress
 * @returns {Promise<{ text: string, method: 'pdf' | 'ocr', pages: number }>}
 */
export async function extractText(file, onProgress) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!isPdf) {
    if (!file.type.startsWith('image/')) throw new Error('Use a PDF or a photo of the report.');
    onProgress?.({ step: 'preparing', progress: 0 });
    return { text: await ocrCanvases([await imageToCanvas(file)], onProgress), method: 'ocr', pages: 1 };
  }

  onProgress?.({ step: 'opening', progress: 0 });
  const pdf = await loadPdf(file);
  const pages = Math.min(pdf.numPages, MAX_PAGES);
  let text = '';
  for (let i = 1; i <= pages; i++) text += `${itemsToLines((await (await pdf.getPage(i)).getTextContent()).items)}\n`;
  if (text.replace(/\s/g, '').length > 40) return { text, method: 'pdf', pages };

  // A scanned PDF has pictures of pages, not text: render each page and read it.
  const canvases = [];
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const { canvas, scale } = scaledCanvas(viewport.width, viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: page.getViewport({ scale: 2 * scale }) }).promise;
    canvases.push(canvas);
  }
  return { text: await ocrCanvases(canvases, onProgress), method: 'ocr', pages };
}
