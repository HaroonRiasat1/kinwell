import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BrandMark } from '../../components/layout/index.js';
import { Button, Card, EmptyState, Field, SkeletonCard } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { authApi } from '../../api/endpoints.js';
import { HOME_FOR_ROLE, useOptionalAuth } from '../../context/AuthContext.jsx';

/** Where an invite link lands: create an account and join the family's care team. */
export default function JoinPage() {
  const { token } = useParams();
  const auth = useOptionalAuth();
  const navigate = useNavigate();
  const invite = useApi(() => authApi.invite(token), [token]);
  const [form, setForm] = useState({ name: '', password: '', city: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = auth.startSession(await authApi.acceptInvite({ token, ...form }));
      navigate(HOME_FOR_ROLE[user.role], { replace: true });
    } catch (err) {
      setError(err.details ? Object.values(err.details).flat().join(' ') : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="kw-backdrop" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="stack" style={{ width: 'min(520px, 100%)' }}>
        <BrandMark to="/" />
        {invite.error && (
          <EmptyState title="This invite link doesn't work" action={<Button to="/login">Go to sign in</Button>}>
            It may have been used already or replaced by a newer link. Ask your family to send a new one.
          </EmptyState>
        )}
        {!invite.data && !invite.error && <SkeletonCard />}
        {invite.data && (
          <Card pad={32}>
            <form className="stack" onSubmit={submit}>
              <div>
                <h1 style={{ fontSize: 30, fontWeight: 800 }}>Join the {invite.data.family}</h1>
                <p className="muted">
                  {invite.data.invitedBy} invited you to see updates about your parents{invite.data.access === 'edit' ? ' and help manage their care' : ''}.
                </p>
              </div>
              <Field label="Email" value={invite.data.email} readOnly hint="This is the email the invite was sent to." />
              <Field label="Your name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Field label="Create a password" type="password" autoComplete="new-password" hint="At least 8 characters." value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <Field label="City you live in" placeholder="e.g. Toronto" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              {error && <p role="alert" className="kw-field__error">{error}</p>}
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? 'Creating your account…' : 'Create account and join'}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
