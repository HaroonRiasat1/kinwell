import { Button } from './Button.jsx';
import { Card, Kicker } from './Card.jsx';

export default { title: 'Components/Card', component: Card, tags: ['autodocs'] };

export const Glass = {
  render: () => (
    <Card style={{ maxWidth: 420 }}>
      <Kicker>Health at a glance</Kicker>
      <h2 style={{ fontSize: 28, fontWeight: 800 }}>Mostly steady</h2>
      <p>Blood sugar is lower for the fifth month running.</p>
      <Button style={{ alignSelf: 'flex-start' }}>Read more</Button>
    </Card>
  ),
};
export const Dashed = { render: () => <Card variant="dashed" style={{ maxWidth: 520 }}>Drop a PDF or photo here</Card> };
export const Danger = { render: () => <Card variant="danger" style={{ maxWidth: 520 }}>We couldn't read "IMG_2041.jpg"</Card> };
