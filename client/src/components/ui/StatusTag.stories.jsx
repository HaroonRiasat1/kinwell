import { StatusTag } from './StatusTag.jsx';

export default {
  title: 'Components/StatusTag',
  component: StatusTag,
  tags: ['autodocs'],
  args: { status: 'watch', size: 'md' },
  argTypes: { status: { control: 'inline-radio', options: ['normal', 'watch', 'attention'] }, size: { control: 'inline-radio', options: ['md', 'lg'] } },
};

export const Playground = {};
export const Scale = {
  render: () => (
    <div className="row">
      <StatusTag status="normal" />
      <StatusTag status="watch" />
      <StatusTag status="attention" />
      <StatusTag status="watch" size="lg" />
      <StatusTag status="attention" label="Full" />
    </div>
  ),
};
