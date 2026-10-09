import { Button, IconButton } from './Button.jsx';
import { ICON_NAMES } from './Icon.jsx';

export default {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Message', variant: 'primary', size: 'md' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'cta', 'glass', 'link', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    icon: { control: 'select', options: [undefined, ...ICON_NAMES] },
    iconRight: { control: 'select', options: [undefined, ...ICON_NAMES] },
  },
};

export const Playground = {};
export const Primary = { args: { children: 'Read full visit summary' } };
export const CallToAction = { args: { variant: 'cta', icon: 'message', children: 'Message' } };
export const Glass = { args: { variant: 'glass', iconRight: 'arrowRight', children: 'All lab tests' } };
export const InlineLink = { args: { variant: 'link', iconRight: 'arrowRight', children: 'See result' } };
export const Disabled = { args: { disabled: true, children: 'Signing in…' } };

export const AllVariants = {
  render: () => (
    <div className="row">
      <Button>Primary</Button>
      <Button variant="cta">Call to action</Button>
      <Button variant="glass">Secondary</Button>
      <Button variant="link" iconRight="arrowRight">
        Inline
      </Button>
      <Button size="lg" icon="refresh">
        Try again
      </Button>
      <IconButton icon="signOut" label="Sign out" />
    </div>
  ),
};
