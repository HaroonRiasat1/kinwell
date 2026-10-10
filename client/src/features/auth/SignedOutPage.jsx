import { useSearchParams } from 'react-router-dom';
import { BrandMark } from '../../components/layout/index.js';
import { Button, Card, Icon } from '../../components/ui/index.js';

export default function SignedOutPage() {
  const [params] = useSearchParams();
  const parent = params.get('as') === 'parent';
  return (
    <div className="kw-backdrop" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
      <Card pad={36} style={{ maxWidth: 480, alignItems: 'flex-start' }}>
        <BrandMark to="/login" />
        <span className="kw-icon-tile" style={{ background: 'var(--kw-normal-bg)', color: 'var(--kw-normal)' }}>
          <Icon name="checkCircle" size={26} />
        </span>
        <h1 style={{ fontSize: 34, fontWeight: 800 }}>You've signed out</h1>
        <p className="muted">
          {parent ? 'To sign in again, ask your family for a new code.' : "Your family's information is safe. Sign in again whenever you're ready."}
        </p>
        <Button size="lg" to={parent ? '/login?as=parent' : '/login'} iconRight="arrowRight">
          Sign in again
        </Button>
      </Card>
    </div>
  );
}
