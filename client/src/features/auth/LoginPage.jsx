import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandMark } from '../../components/layout/index.js';
import { Button, Card, Checkbox, Field, Icon, Segmented } from '../../components/ui/index.js';
import { authApi } from '../../api/endpoints.js';
import { HOME_FOR_ROLE, useOptionalAuth } from '../../context/AuthContext.jsx';

const ROLES = [
  { value: 'family', label: 'Family member', hint: 'See updates about your parents.' },
  { value: 'nutritionist', label: 'Nutritionist', hint: 'Your clients, visits and plans.' },
  { value: 'admin', label: 'Admin', hint: 'Kinwell operations and team.' },
];

function CodeBoxes({ value, onChange }) {
  const refs = useRef([]);
  const digits = value.padEnd(6, ' ').split('');
  const set = (i, d) => {
    const next = digits.slice();
    next[i] = d || ' ';
    onChange(next.join('').replace(/\s+$/, ''));
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  return (
    <div className="row" style={{ '--gap': '8px', flexWrap: 'nowrap' }} role="group" aria-label="6-digit code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className="kw-input"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1}`}
          maxLength={1}
          value={d.trim()}
          onChange={(e) => set(i, e.target.value.replace(/\D/g, '').slice(-1))}
          onKeyDown={(e) => e.key === 'Backspace' && !d.trim() && i > 0 && refs.current[i - 1]?.focus()}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            if (pasted) {
              e.preventDefault();
              onChange(pasted);
            }
          }}
          style={{ width: 56, minHeight: 64, textAlign: 'center', fontSize: 28, fontWeight: 800, padding: 0 }}
        />
      ))}
    </div>
  );
}

function SignInForm({ role, onRole, onSubmit, busy, error, onForgot, onCode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const hint = ROLES.find((r) => r.value === role).hint;
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ email, password, role });
      }}
    >
      <div>
        <h2 style={{ fontSize: 30, fontWeight: 800 }}>Welcome back</h2>
        <p className="muted">{hint}</p>
      </div>
      <Segmented label="I am a" fill items={ROLES} value={role} onChange={onRole} />
      {error && (
        <div role="alert" className="kw-notice kw-notice--attention" style={{ flexDirection: 'row', alignItems: 'center', color: 'var(--kw-attention)', fontWeight: 700, fontSize: 16 }}>
          <Icon name="alert" /> {error}
        </div>
      )}
      <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="Password" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}>
        <Button variant="glass" size="sm" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? 'Hide' : 'Show'}
        </Button>
      </Field>
      <div className="row row--between">
        <Checkbox label="Keep me signed in" defaultChecked />
        <button type="button" className="kw-btn kw-btn--link" onClick={onForgot}>
          Forgot password?
        </button>
      </div>
      <Button type="submit" size="lg" iconRight={busy ? undefined : 'arrowRight'} disabled={busy} block>
        {busy ? 'Signing in…' : 'Sign in'}
      </Button>
      {role === 'family' && (
        <Button variant="glass" block onClick={onCode}>
          Signing in for Ammi or Abbu? Use a text code
        </Button>
      )}
      <p className="text-sm muted" style={{ textAlign: 'center' }}>
        New to Kinwell? <Link to="/onboarding">Set up your family</Link>
      </p>
    </form>
  );
}

function ParentCodeForm({ onDone, onBack }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => (sent ? onDone(await authApi.verifyParentCode(phone, code)) : setSent(await authApi.requestParentCode(phone))));
      }}
    >
      <h2 style={{ fontSize: 30, fontWeight: 800 }}>{sent ? 'Enter the code' : 'Sign in with a code'}</h2>
      <p className="muted">{sent ? `We sent a 6-digit code to ${phone}.` : "Enter your parent's mobile number. We'll text them a code — no password needed."}</p>
      {!sent && <Field label="Mobile number" type="tel" autoComplete="tel" placeholder="+92 300 111 2233" value={phone} onChange={(e) => setPhone(e.target.value)} required />}
      {sent && <CodeBoxes value={code} onChange={setCode} />}
      {sent?.devCode && <p className="kw-field__hint">Development mode: the code is {sent.devCode}.</p>}
      {error && (
        <p role="alert" className="kw-field__error">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" block disabled={busy || (sent && code.length < 6)}>
        {busy ? 'Please wait…' : sent ? 'Sign in' : 'Send code'}
      </Button>
      <Button variant="link" onClick={onBack}>
        Back to email sign in
      </Button>
    </form>
  );
}

function ForgotForm({ onBack }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <div className="stack">
        <h2 style={{ fontSize: 30, fontWeight: 800 }}>Check your email</h2>
        <p className="muted">If {email} has a Kinwell account, a link to reset the password is on its way. It works for 1 hour.</p>
        <Button onClick={onBack}>Back to sign in</Button>
      </div>
    );
  }
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        await authApi.forgot(email).catch(() => {});
        setSent(true);
      }}
    >
      <h2 style={{ fontSize: 30, fontWeight: 800 }}>Reset your password</h2>
      <p className="muted">Enter the email you signed up with and we'll send you a link.</p>
      <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" size="lg" block>
        Send reset link
      </Button>
      <Button variant="link" onClick={onBack}>
        Back to sign in
      </Button>
    </form>
  );
}

export function LoginView({ mode, setMode, role, setRole, onSubmit, onSession, busy, error }) {
  return (
    <div className="kw-backdrop" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 32, padding: 'clamp(20px, 4vw, 48px)', alignItems: 'center' }}>
      <div className="stack" style={{ '--gap': '24px', maxWidth: 560 }}>
        <BrandMark to="/" />
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.08 }}>Know how Mom and Dad are doing, at a glance.</h1>
        <p style={{ fontSize: 20, color: 'var(--kw-ink-2)' }}>
          A nutritionist visits your parents at home. You get clear, plain-language updates wherever you live.
        </p>
        <div className="kw-card hide-mobile" style={{ height: 240, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
          <Icon name="image" size={28} />
          <span className="muted text-sm">Illustration: parents at home, nutritionist visiting</span>
        </div>
      </div>
      <Card pad="clamp(24px, 3vw, 36px)" style={{ maxWidth: 520, width: '100%', justifySelf: 'center' }}>
        {mode === 'signin' && (
          <SignInForm role={role} onRole={setRole} onSubmit={onSubmit} busy={busy} error={error} onForgot={() => setMode('forgot')} onCode={() => setMode('code')} />
        )}
        {mode === 'code' && <ParentCodeForm onDone={onSession} onBack={() => setMode('signin')} />}
        {mode === 'forgot' && <ForgotForm onBack={() => setMode('signin')} />}
      </Card>
    </div>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState('signin');
  const [role, setRole] = useState('family');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const auth = useOptionalAuth();
  const navigate = useNavigate();

  const onSession = (session) => {
    const user = auth.startSession(session);
    navigate(HOME_FOR_ROLE[user.role], { replace: true });
  };
  const onSubmit = async (body) => {
    setBusy(true);
    setError(null);
    try {
      onSession(await authApi.login(body));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return <LoginView mode={mode} setMode={setMode} role={role} setRole={(r) => (setRole(r), setError(null))} onSubmit={onSubmit} onSession={onSession} busy={busy} error={error} />;
}
