import { Button } from './Button.jsx';
import { Checkbox, Field } from './Field.jsx';

export default { title: 'Components/Field', component: Field, tags: ['autodocs'], args: { label: 'Email', placeholder: 'sana.rahman@gmail.com' } };

export const Text = {};
export const WithHint = { args: { label: 'Create a password', type: 'password', hint: 'At least 8 characters.' } };
export const WithError = { args: { defaultValue: 'sana@', error: 'Enter a valid email address' } };
export const Select = { args: { as: 'select', label: 'Where you live', options: ['London, United Kingdom (GMT+1)', 'Dubai, UAE (GMT+4)'] } };
export const Textarea = { args: { as: 'textarea', label: 'Your note', placeholder: "Write it the way you'd say it" } };
export const PasswordWithToggle = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Field label="Password" type="password" defaultValue="secret-password">
        <Button variant="glass" size="sm">
          Show
        </Button>
      </Field>
    </div>
  ),
};
export const CheckboxField = { render: () => <Checkbox label="Keep me signed in" defaultChecked /> };
