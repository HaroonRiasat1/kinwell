import { useState } from 'react';
import { Segmented } from './Segmented.jsx';

export default { title: 'Components/Segmented', component: Segmented, tags: ['autodocs'] };

export const Roles = {
  render: () => {
    const [v, setV] = useState('family');
    return (
      <div style={{ maxWidth: 460 }}>
        <Segmented fill label="I am a" value={v} onChange={setV} items={[{ value: 'family', label: 'Family member' }, { value: 'nutritionist', label: 'Nutritionist' }, { value: 'admin', label: 'Admin' }]} />
      </div>
    );
  },
};
export const ProfileTabs = {
  parameters: { route: '/family/ammi/labs' },
  render: () => <Segmented label="Profile sections" items={['profile', 'labs', 'nutrition', 'supplements', 'visits', 'documents'].map((s) => ({ to: `/family/ammi/${s}`, label: s[0].toUpperCase() + s.slice(1) }))} />,
};
