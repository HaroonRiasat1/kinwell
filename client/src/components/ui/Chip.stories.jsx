import { useState } from 'react';
import { Chip, ChipGroup } from './Chip.jsx';

export default { title: 'Components/Chip', component: Chip, tags: ['autodocs'], args: { children: 'Needs attention · 2', selected: false } };

export const Playground = {};
export const SingleSelect = {
  render: () => {
    const [v, setV] = useState('All');
    return <ChipGroup label="Filter" options={['All', 'Needs attention', 'Watch', 'Normal']} value={v} onChange={setV} />;
  },
};
export const MultiSelect = {
  render: () => {
    const [v, setV] = useState(['Good appetite', 'A bit tired']);
    return <ChipGroup label="Observations" multiple options={['Good appetite', 'Low appetite', 'A bit tired', 'Good mood', 'Walking daily']} value={v} onChange={setV} />;
  },
};
