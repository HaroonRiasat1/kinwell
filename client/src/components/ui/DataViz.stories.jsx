import { PARENTS, MONTHS, BAND } from '@kinwell/shared';
import { Card } from './Card.jsx';
import { ProgressRing } from './ProgressRing.jsx';
import { Sparkline } from './Sparkline.jsx';
import { TrendChart } from './TrendChart.jsx';

const marker = (name, key = 'ammi') => {
  const m = PARENTS[key].markers.find((x) => x.name === name);
  return { ...m, months: MONTHS, band: BAND[name] };
};

export default { title: 'Components/Data viz', tags: ['autodocs'] };

export const Ring = { args: { done: 3, total: 6 }, render: (a) => <ProgressRing {...a} /> };
export const Sparklines = {
  render: () => (
    <div className="grid-fill" style={{ maxWidth: 760 }}>
      {['Fasting blood sugar', 'Vitamin D', 'Vitamin B12'].map((n) => {
        const m = marker(n);
        return (
          <Card key={n} pad={16} gap={8}>
            <strong>{n}</strong>
            <Sparkline series={m.series} status={m.status} label={m.trend} />
          </Card>
        );
      })}
    </div>
  ),
};
export const LabTrend = {
  argTypes: { name: { control: 'select', options: PARENTS.ammi.markers.map((m) => m.name) } },
  args: { name: 'Fasting blood sugar' },
  render: ({ name }) => (
    <Card style={{ maxWidth: 760 }}>
      <TrendChart marker={marker(name)} who="Ammi's results" />
    </Card>
  ),
};
