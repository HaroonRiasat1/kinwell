import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BrandMark } from '../../components/layout/index.js';
import { Button, Card, Checkbox, Field, Icon, Segmented } from '../../components/ui/index.js';
import { authApi } from '../../api/endpoints.js';
import { HOME_FOR_ROLE, useOptionalAuth } from '../../context/AuthContext.jsx';
import { LanguageSwitcher, errorText, useI18n } from '../../i18n/index.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

const ROLES = [
  { value: 'family', label: 'Family member', hint: 'See updates about your parents.' },
  { value: 'nutritionist', label: 'Nutritionist', hint: 'Your clients, visits and plans.' },
  { value: 'admin', label: 'Admin', hint: 'Kinwell operations and team.' },
];

/**
 * Six-box code entry backed by ONE real input, so fast typing, paste and the
 * phone's one-time-code autofill all land correctly. The boxes are drawn on top.
 */
export function CodeBoxes({ value, onChange, autoFocus = true }) {
  const [focused, setFocused] = useState(false);
  const { t } = useI18n();
  return (
    <label className="kw-ltr" style={{ position: 'relative', display: 'block', maxWidth: 380 }}>
      <span className="sr-only">{t('parentSignIn.codeLabel')}</span>
      <input
        className="kw-codeinput"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        autoFocus={autoFocus}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      />
      <span className="kw-codeboxes" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={`kw-codebox${focused && i === Math.min(value.length, 5) ? ' is-active' : ''}`}>
            {value[i] ?? ''}
          </span>
        ))}
      </span>
    </label>
  );
}

function SignInForm({ role, onRole, onSubmit, busy, error, onForgot, onCode }) {
  const { t } = useI18n();
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
      <Button variant="glass" block icon="phone" onClick={onCode}>
        {t('parentSignIn.entry')}
      </Button>
      <p className="text-sm muted" style={{ textAlign: 'center' }}>
        New to Kinwell? <Link to="/onboarding">Set up your family</Link>
      </p>
    </form>
  );
}

function ParentCodeForm({ initialPhone = '', onDone, onBack }) {
  const { t } = useI18n();
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState('');
  // When we arrive from a family member's link, the phone is known and the code is in hand.
  const [step, setStep] = useState(initialPhone ? { delivery: 'family', fromLink: true } : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setBusy(false);
    }
  };
  const submit = () =>
    run(async () => {
      if (step) return onDone(await authApi.verifyParentCode(phone, code));
      setStep(await authApi.requestParentCode(phone));
    });
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <LanguageSwitcher />
      <h2 style={{ fontSize: 30, fontWeight: 800 }}>{step ? t('parentSignIn.enterCode') : t('parentSignIn.title')}</h2>
      {!step && <p className="muted">{t('parentSignIn.intro')}</p>}
      {!step && (
        <Field label={t('parentSignIn.phoneLabel')} dir="ltr" type="tel" autoComplete="tel" inputMode="tel" placeholder="0300 1234567" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ fontSize: 22, minHeight: 60 }} />
      )}
      {step?.delivery === 'sms' && <p className="muted">{t('parentSignIn.smsSent', { phone })}</p>}
      {step?.delivery === 'family' && (
        <div className="kw-notice kw-notice--normal" style={{ fontSize: 18 }}>
          <strong>{step.fromLink ? t('parentSignIn.fromLink') : t('parentSignIn.askFamily')}</strong>
          {!step.fromLink && <span>{t('parentSignIn.askFamilyHow')}</span>}
        </div>
      )}
      {step && <CodeBoxes value={code} onChange={setCode} />}
      {step?.devCode && <p className="kw-field__hint">{t('parentSignIn.devCode', { code: step.devCode })}</p>}
      {error && (
        <p role="alert" className="kw-field__error">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" block disabled={busy || (step && code.length < 6)}>
        {busy ? t('common.pleaseWait') : step ? t('common.signIn') : t('parentSignIn.continue')}
      </Button>
      {step && !step.fromLink && (
        <Button variant="link" onClick={() => (setStep(null), setCode(''))}>
          {t('parentSignIn.otherNumber')}
        </Button>
      )}
      <Button variant="link" onClick={onBack}>
        {t('parentSignIn.backToEmail')}
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

export function LoginView({ mode, setMode, role, setRole, onSubmit, onSession, busy, error, parentPhone = '' }) {
  const { t } = useI18n();
  return (
    <div className="kw-backdrop" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 32, padding: 'clamp(20px, 4vw, 48px)', alignItems: 'center' }}>
      <div className="stack" style={{ '--gap': '24px', maxWidth: 560 }}>
        <BrandMark to="/" />
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.08 }}>{t('login.headline')}</h1>
        <p style={{ fontSize: 20, color: 'var(--kw-ink-2)' }}>{t('login.intro')}</p>
        <div className="kw-card hide-mobile" style={{ height: 240, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
          <Icon name="image" size={28} />
          <span className="muted text-sm">{t('login.illustration')}</span>
        </div>
      </div>
      <Card pad="clamp(24px, 3vw, 36px)" style={{ maxWidth: 520, width: '100%', justifySelf: 'center' }}>
        {mode === 'signin' && (
          <SignInForm role={role} onRole={setRole} onSubmit={onSubmit} busy={busy} error={error} onForgot={() => setMode('forgot')} onCode={() => setMode('code')} />
        )}
        {mode === 'code' && <ParentCodeForm initialPhone={parentPhone} onDone={onSession} onBack={() => setMode('signin')} />}
        {mode === 'forgot' && <ForgotForm onBack={() => setMode('signin')} />}
      </Card>
    </div>
  );
}

export default function LoginPage() {
  usePageTitle('Sign in');
  // /login?as=parent&phone=… is the link a family member sends with a code.
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('as') === 'parent' ? 'code' : 'signin');
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
  return <LoginView mode={mode} setMode={setMode} role={role} setRole={(r) => (setRole(r), setError(null))} onSubmit={onSubmit} onSession={onSession} busy={busy} error={error} parentPhone={params.get('phone') ?? ''} />;
}
