import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, Chip, EmptyState, Icon, Kicker, Skeleton, StatusTag, TrendChart } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { parentApi } from '../../api/endpoints.js';
import { useProfile } from './ProfileLayout.jsx';
import { ReportUpload } from './ReportUpload.jsx';

const FALLBACK_MEANING = { means: 'This is in the healthy range. No change needed.', doing: 'Checking it again at each visit.', you: "Nothing to do. It's going well." };

/** `uploadPanel` is the report upload flow (or a static version of it in Storybook). */
export function LabsView({ parent, data, selected, onSelect, uploadPanel, onAsk }) {
  if (!data.markers.length) {
    return (
      <EmptyState
        kicker="No lab reports yet"
        title={`Add ${parent.short}'s first lab report`}
        action={<div className="stack">{uploadPanel}</div>}
      >
        Once there's a report, you'll see each result here with its healthy range, a trend over time and a plain-language explanation.
      </EmptyState>
    );
  }
  const sel = data.markers.find((m) => m.name === selected) ?? data.markers.find((m) => m.status === 'attention') ?? data.markers[0];
  const mean = sel.meaning?.means ? sel.meaning : FALLBACK_MEANING;
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      {uploadPanel}
      <div className="split">
        <Card pad={20} gap={14}>
          <div className="row row--between row--top" style={{ '--gap': '10px' }}>
            <div>
              <Kicker>Trend · {sel.months?.[0] ?? 'Apr'}–{sel.months?.at(-1) ?? 'Sep'}</Kicker>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{sel.name}</h2>
            </div>
            <StatusTag status={sel.status} />
          </div>
          <div role="group" aria-label="Choose a marker" className="row" style={{ '--gap': '6px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 }}>
            {data.markers.map((m) => (
              <Chip key={m.name} selected={m.name === sel.name} onClick={() => onSelect(m.name)}>
                {m.name}
              </Chip>
            ))}
          </div>
          <TrendChart marker={sel} who={`${parent.short}'s results`} />
        </Card>
        <Card as="aside" pad={20} gap={14}>
          <Kicker>What this means</Kicker>
          <div className="row" style={{ '--gap': '8px', alignItems: 'baseline' }}>
            <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{sel.value}</span>
            <span className="muted" style={{ fontSize: 15 }}>
              {sel.unit} · target {sel.range}
            </span>
          </div>
          <StatusTag status={sel.status} />
          <p className="pretty" style={{ fontSize: 17, lineHeight: 1.55 }}>
            {mean.means}
          </p>
          <div className="kw-plain">
            <strong>In plain words:</strong> {sel.plain}
          </div>
          {[
            ['What your nutritionist is doing', mean.doing],
            ['How you can help', mean.you],
          ].map(([k, v]) => (
            <div key={k} className="stack" style={{ '--gap': '4px', paddingTop: 12, borderTop: '1px solid var(--kw-rule-soft)' }}>
              <Kicker tone="deep">{k}</Kicker>
              <div className="text-sm">{v}</div>
            </div>
          ))}
          <Button variant="glass" style={{ alignSelf: 'flex-start' }} onClick={onAsk}>
            Ask about this
          </Button>
        </Card>
      </div>

      <Card variant="flush">
        <div className="row row--between" style={{ padding: '14px 20px', alignItems: 'baseline' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>All results{data.reports[0] && ` · ${data.reports[0].lab}, ${data.reports[0].date}`}</h2>
          <span className="muted" style={{ fontSize: 15 }}>
            Select a row to see its trend
          </span>
        </div>
        <div role="table" aria-label="Lab results" style={{ '--cols': 'minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr) minmax(0,1.3fr)' }}>
          <div role="row" className="kw-table__head">
            <span role="columnheader">Marker</span>
            <span role="columnheader">Result</span>
            <span role="columnheader" className="hide-mobile">Target</span>
            <span role="columnheader">Status</span>
            <span role="columnheader" className="hide-mobile">Since April</span>
          </div>
          {data.markers.map((r) => (
            <button key={r.name} role="row" type="button" className={`kw-table__row${r.name === sel.name ? ' is-selected' : ''}`} onClick={() => onSelect(r.name)}>
              <span role="cell" style={{ fontWeight: 700 }}>
                {r.name}
              </span>
              <span role="cell">
                <strong>{r.value}</strong> <span className="text-xs muted">{r.unit}</span>
              </span>
              <span role="cell" className="hide-mobile text-sm muted">
                {r.range}
              </span>
              <span role="cell" style={{ display: 'flex' }}>
                <StatusTag status={r.status} />
              </span>
              <span role="cell" className="hide-mobile muted" style={{ fontSize: 15 }}>
                {r.trend}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card pad={20} gap={6}>
        <Kicker as="h2" style={{ marginBottom: 6 }}>
          Report history
        </Kicker>
        {data.reports.map((r) => (
          <div key={r.id ?? r.date} className="row" style={{ '--gap': '14px', padding: '12px 0', borderTop: '1px solid var(--kw-rule-soft)' }}>
            <span className="kw-icon-tile" style={{ '--size': '44px', borderRadius: 14, background: 'rgba(255,255,255,0.8)' }}>
              <Icon name="file" size={20} />
            </span>
            <div className="grow" style={{ minWidth: 180, lineHeight: 1.35 }}>
              <div className="strong">
                {r.lab} · {r.date}
              </div>
              <div className="muted" style={{ fontSize: 15 }}>
                {r.file} · {r.by}
              </div>
            </div>
            <Button variant="glass" size="sm">
              View
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function LabsSkeleton({ parent }) {
  return (
    <div role="status" aria-live="polite" className="stack" style={{ '--gap': '20px' }}>
      <div className="text-sm muted">Loading {parent.short}'s lab results…</div>
      <div className="split">
        {[320, 320].map((h, i) => (
          <Card key={i} style={{ minHeight: h }} gap={14}>
            <Skeleton width="30%" />
            <Skeleton width="60%" height={24} block />
            <Skeleton height={200} block soft />
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function LabsPage() {
  const { parent } = useProfile();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data, error, reload } = useApi(() => parentApi.labs(parent.id), [parent.id]);

  if (error) {
    return (
      <EmptyState title={`We couldn't load ${parent.short}'s lab results`} action={<Button icon="refresh" onClick={reload}>Try again</Button>}>
        This is on our side. {parent.short}'s records are safe.
      </EmptyState>
    );
  }
  if (!data) return <LabsSkeleton parent={parent} />;
  return (
    <LabsView
      parent={parent}
      data={data}
      selected={params.get('marker')}
      onSelect={(name) => setParams({ marker: name }, { replace: true })}
      onAsk={() => navigate(`/family/${parent.id}/messages`)}
      uploadPanel={<ReportUpload parent={parent} tests={data.tests} onSaved={reload} />}
    />
  );
}
