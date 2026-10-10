import { useRef, useState } from 'react';
import { Button, Card, Field, Icon, IconButton, Kicker, StatusTag, useToast } from '../../components/ui/index.js';
import { parentApi } from '../../api/endpoints.js';
import { extractText } from '../../lib/ocr.js';

const STEP = { opening: 'Opening the file…', preparing: 'Getting the reader ready…', reading: 'Reading the numbers…' };

/** One editable result row in the review table. */
function ResultRow({ row, tests, onChange, onRemove }) {
  const test = tests.find((t) => t.name === row.name);
  return (
    <div className="kw-review-row" style={{ opacity: row.include ? 1 : 0.55 }}>
      <label className="kw-check" style={{ gap: 8 }}>
        <input type="checkbox" checked={row.include} onChange={(e) => onChange({ include: e.target.checked })} aria-label={`Include ${row.name}`} />
      </label>
      <select className="kw-input" aria-label="Test" value={row.name} onChange={(e) => onChange({ name: e.target.value })} style={{ minHeight: 44, fontSize: 15 }}>
        {tests.map((t) => (
          <option key={t.name}>{t.name}</option>
        ))}
      </select>
      <span className="row" style={{ '--gap': '6px', flexWrap: 'nowrap' }}>
        <input
          className="kw-input kw-ltr"
          aria-label={`${row.name} value`}
          inputMode="decimal"
          value={row.value}
          onChange={(e) => onChange({ value: e.target.value })}
          style={{ minHeight: 44, width: 96, fontSize: 16, borderColor: row.confidence === 'check' || row.confidence === 'decimal' || (row.confidence === 'unclear' && !row.value) ? 'var(--kw-watch)' : undefined }}
          placeholder={row.confidence === 'unclear' ? 'Type it' : undefined}
        />
        <span className="muted text-sm">{test?.unit}</span>
      </span>
      <span className="muted" style={{ fontSize: 13 }}>
        {row.confidence === 'decimal' ? `We added a decimal point (read “${row.raw}”): please check` : row.confidence === 'unclear' ? `Couldn't read the number (saw “${row.raw}”): type it from the report` : row.confidence === 'check' ? 'No unit found: please check' : row.from ? `Converted from ${row.raw}` : row.line ? `Read: “${row.line.slice(0, 48)}${row.line.length > 48 ? '…' : ''}”` : 'Typed in'}
      </span>
      <IconButton icon="x" label={`Remove ${row.name}`} size={16} onClick={onRemove} />
    </div>
  );
}

/**
 * Pure view of the upload flow. `state` is one of: idle, reading, review, saving, saved, unreadable, error.
 */
export function ReportUploadView({ state, fileName, progress, step, review, setReview, tests, rawText, saved, error, onPick, onPhoto, onSave, onManual, onSendToTeam, onReset }) {
  if (state === 'review' || state === 'saving') {
    const rows = review.rows;
    const set = (i, patch) => setReview((r) => ({ ...r, rows: r.rows.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
    const chosen = rows.filter((r) => r.include && String(r.value).trim());
    const read = rows.filter((r) => r.line && r.confidence !== 'unclear').length;
    const unclear = rows.filter((r) => r.confidence === 'unclear').length;
    return (
      <Card pad={22} gap={14} aria-labelledby="review-h">
        <div className="row row--between">
          <div>
            <Kicker tone="teal">Check before saving</Kicker>
            <h2 id="review-h" style={{ fontSize: 22, fontWeight: 800 }}>
              {read ? `We found ${read} result${read > 1 ? 's' : ''} in ${fileName}` : rows.length ? `We need your help with ${fileName}` : `Type in the results from ${fileName}`}
            </h2>
            {unclear > 0 && (
              <p className="text-sm strong" style={{ color: '#8a5a12' }}>
                {unclear} more {unclear === 1 ? 'test is' : 'tests are'} on the report, but we couldn't read {unclear === 1 ? 'its number' : 'their numbers'}. Please type {unclear === 1 ? 'it' : 'them'} in.
              </p>
            )}
            <p className="muted text-sm">Compare each number with the report. Fix anything we misread, untick anything that's wrong, and add any we missed.</p>
          </div>
        </div>
        <div className="grid-auto" style={{ '--min': '220px', '--gap': '12px' }}>
          <Field label="Lab" value={review.lab} onChange={(e) => setReview((r) => ({ ...r, lab: e.target.value }))} placeholder="e.g. Chughtai Lab" />
          <Field label="Report date" value={review.date} onChange={(e) => setReview((r) => ({ ...r, date: e.target.value }))} placeholder="e.g. 26 Sep 2026" />
        </div>
        <div className="stack" style={{ '--gap': '8px' }}>
          {rows.map((row, i) => (
            <ResultRow key={i} row={row} tests={tests} onChange={(p) => set(i, p)} onRemove={() => setReview((r) => ({ ...r, rows: r.rows.filter((_, j) => j !== i) }))} />
          ))}
          <Button
            variant="glass"
            size="sm"
            icon="plus"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => setReview((r) => ({ ...r, rows: [...r.rows, { name: tests.find((t) => !r.rows.some((x) => x.name === t.name))?.name ?? tests[0].name, value: '', include: true }] }))}
          >
            Add a result
          </Button>
        </div>
        {rawText && (
          <details>
            <summary className="muted text-sm" style={{ cursor: 'pointer' }}>
              Show the text we read
            </summary>
            <pre className="kw-ltr" style={{ whiteSpace: 'pre-wrap', fontSize: 13, maxHeight: 220, overflow: 'auto', background: 'rgba(255,255,255,0.6)', padding: 12, borderRadius: 12 }}>
              {rawText}
            </pre>
          </details>
        )}
        {error && (
          <p role="alert" className="kw-field__error">
            {error}
          </p>
        )}
        <div className="row">
          <Button onClick={onSave} disabled={state === 'saving' || chosen.length === 0}>
            {state === 'saving' ? 'Saving…' : `Save ${chosen.length} result${chosen.length === 1 ? '' : 's'}`}
          </Button>
          <Button variant="glass" onClick={onReset}>
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      {state === 'saved' && (
        <Card pad={20} role="status" style={{ background: 'rgba(238,247,241,0.9)' }}>
          <div className="row">
            <Icon name="checkCircle" size={22} />
            <span className="strong grow">
              Saved {saved.results.length} result{saved.results.length === 1 ? '' : 's'}. Your nutritionist has been told.
            </span>
            <Button variant="glass" size="sm" onClick={onReset}>
              Add another
            </Button>
          </div>
          <div className="row" style={{ '--gap': '6px' }}>
            {saved.results.map((r) => (
              <StatusTag key={r.name} status={r.status} label={`${r.name} ${r.value} ${r.unit}`} />
            ))}
          </div>
        </Card>
      )}
      {(state === 'unreadable' || state === 'error') && (
        <Card role="alert" variant="danger" pad={20} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <span className="kw-icon-tile kw-icon-tile--attention" style={{ '--size': '48px' }}>
            <Icon name="alert" size={24} />
          </span>
          <div className="grow stack" style={{ '--gap': '4px', minWidth: 240 }}>
            <div className="strong" style={{ color: '#7d2a22' }}>
              {state === 'error' ? `We couldn't open "${fileName}"` : `We couldn't find any results in "${fileName}"`}
            </div>
            <div className="text-sm" style={{ color: 'var(--kw-ink-2)' }}>
              {error ?? 'The photo may be blurry, dark or cut off. Nothing was saved.'} Try a clearer photo in good light with the whole page in view, type the results in, or send it to the Kinwell team to enter for you.
            </div>
          </div>
          <div className="row" style={{ '--gap': '8px' }}>
            <Button icon="camera" onClick={onPhoto}>
              Try another photo
            </Button>
            <Button variant="glass" onClick={onManual}>
              Type results in
            </Button>
            {state === 'unreadable' && (
              <Button variant="glass" onClick={onSendToTeam}>
                Send to the Kinwell team
              </Button>
            )}
          </div>
        </Card>
      )}
      <Card variant="dashed" pad="18px 20px" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="kw-icon-tile">
          <Icon name="upload" size={24} />
        </span>
        <div className="grow" style={{ minWidth: 220 }}>
          <div className="strong">Add a new lab report</div>
          <div className="text-sm muted">A PDF or a clear photo. We read the numbers on this device, you check them, then they're saved.</div>
        </div>
        {state === 'reading' ? (
          <div role="status" aria-live="polite" className="grow stack" style={{ '--gap': '8px', minWidth: 240 }}>
            <div className="text-sm strong">
              {STEP[step] ?? 'Reading…'} {fileName}
            </div>
            <div className="kw-meter">
              <span style={{ width: `${Math.max(5, Math.round((progress ?? 0) * 100))}%`, transition: 'width .3s' }} />
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              The first time can take a little longer while the reader downloads.
            </div>
          </div>
        ) : (
          <div className="row" style={{ '--gap': '10px' }}>
            <Button variant="cta" onClick={onPick}>
              Choose file
            </Button>
            <Button variant="glass" icon="camera" onClick={onPhoto}>
              Take a photo
            </Button>
            <Button variant="link" onClick={onManual}>
              Type results in
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}

/** The upload flow wired to OCR and the API. Calls onSaved after results are stored. */
export function ReportUpload({ parent, tests, onSaved }) {
  const fileInput = useRef(null);
  const photoInput = useRef(null);
  const [s, setS] = useState({ state: 'idle' });
  const toast = useToast();
  const set = (patch) => setS((x) => ({ ...x, ...patch }));

  const read = async (file) => {
    setS({ state: 'reading', fileName: file.name, step: 'opening', progress: 0 });
    try {
      const { text, method } = await extractText(file, ({ step, progress }) => set({ step, progress }));
      const found = await parentApi.readReport(parent.id, text);
      if (!found.results.length) return setS({ state: 'unreadable', fileName: file.name, rawText: text, method });
      setS({
        state: 'review',
        fileName: file.name,
        method,
        rawText: text,
        review: { lab: found.lab ?? '', date: found.date ?? '', rows: found.results.map((r) => ({ ...r, include: true })) },
      });
    } catch (err) {
      setS({ state: 'error', fileName: file.name, error: err.message });
    }
  };
  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) read(file);
  };
  const save = async () => {
    set({ state: 'saving', error: null });
    try {
      const rows = s.review.rows.filter((r) => r.include && String(r.value).trim());
      const saved = await parentApi.saveReport(parent.id, {
        fileName: s.fileName,
        lab: s.review.lab,
        date: s.review.date,
        source: s.method === 'pdf' ? 'pdf' : s.method === 'manual' ? 'manual' : 'ocr',
        results: rows.map((r) => ({ name: r.name, value: r.value })),
      });
      setS({ state: 'saved', saved });
      onSaved?.(saved);
    } catch (err) {
      set({ state: 'review', error: err.message });
    }
  };

  return (
    <>
      <input ref={fileInput} type="file" accept="application/pdf,image/*" hidden onChange={onFile} />
      <input ref={photoInput} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
      <ReportUploadView
        {...s}
        tests={tests}
        setReview={(fn) => setS((x) => ({ ...x, review: typeof fn === 'function' ? fn(x.review) : fn }))}
        onPick={() => fileInput.current?.click()}
        onPhoto={() => photoInput.current?.click()}
        onSave={save}
        onManual={() => setS((x) => ({ state: 'review', method: 'manual', fileName: x.fileName ?? 'Typed-in results', rawText: x.rawText, review: { lab: '', date: '', rows: [] } }))}
        onSendToTeam={async () => {
          await parentApi.reportUnreadable(parent.id, s.fileName, "Couldn't find any results");
          setS({ state: 'idle' });
          toast('Sent. The Kinwell team will type the results in and let you know.');
        }}
        onReset={() => setS({ state: 'idle' })}
      />
    </>
  );
}
