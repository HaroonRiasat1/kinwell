// Copies the OCR engine (Tesseract worker, WebAssembly core, English model) into public/ocr
// so the browser loads it from our own domain. Runs before dev, build and Storybook.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const out = fileURLToPath(new URL('../public/ocr/', import.meta.url));
const pkg = (name) => dirname(require.resolve(`${name}/package.json`));

const files = [
  [join(pkg('tesseract.js'), 'dist/worker.min.js'), 'worker.min.js'],
  ...['tesseract-core-lstm.wasm', 'tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm', 'tesseract-core-simd-lstm.wasm.js'].map((f) => [join(pkg('tesseract.js-core'), f), `core/${f}`]),
  [join(pkg('@tesseract.js-data/eng'), '4.0.0_best_int/eng.traineddata.gz'), 'lang/eng.traineddata.gz'],
];

for (const [from, to] of files) {
  const dest = join(out, to);
  mkdirSync(dirname(dest), { recursive: true });
  if (!existsSync(dest)) cpSync(from, dest);
}
console.log(`[ocr] engine files ready in public/ocr (${files.length} files)`);
