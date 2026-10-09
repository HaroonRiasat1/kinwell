import { useState } from 'react';
import { Toggle } from './Toggle.jsx';

export default { title: 'Components/Toggle', component: Toggle, tags: ['autodocs'] };

export const Reminder = {
  render: () => {
    const [on, setOn] = useState(true);
    return (
      <div className="row">
        <Toggle checked={on} onChange={setOn} label="Morning reminder" />
        <span>{on ? 'Phone reminder at 9:00 am' : 'Reminder off'}</span>
      </div>
    );
  },
};
