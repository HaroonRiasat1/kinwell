import { Icon, ICON_NAMES } from './Icon.jsx';

export default { title: 'Foundations/Icons', component: Icon };

export const All = {
  render: () => (
    <div className="grid-fill" style={{ '--min': '120px' }}>
      {ICON_NAMES.map((n) => (
        <div key={n} className="stack" style={{ '--gap': '6px', alignItems: 'center', padding: 12, borderRadius: 16, background: 'rgba(255,255,255,0.6)' }}>
          <Icon name={n} size={24} />
          <span style={{ fontSize: 13 }}>{n}</span>
        </div>
      ))}
    </div>
  ),
};
