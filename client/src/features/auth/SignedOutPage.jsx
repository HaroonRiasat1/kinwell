import { useSearchParams } from 'react-router-dom';
import { BrandMark } from '../../components/layout/index.js';
import { Button, Card, Icon } from '../../components/ui/index.js';
import { LanguageSwitcher, useI18n } from '../../i18n/index.js';

export default function SignedOutPage() {
  const [params] = useSearchParams();
  const parent = params.get('as') === 'parent';
  const { t } = useI18n();
  return (
    <div className="kw-backdrop" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
      <Card pad={36} style={{ maxWidth: 480, alignItems: 'flex-start' }}>
        <BrandMark to="/login" />
        <span className="kw-icon-tile" style={{ background: 'var(--kw-normal-bg)', color: 'var(--kw-normal)' }}>
          <Icon name="checkCircle" size={26} />
        </span>
        {parent && <LanguageSwitcher />}
        <h1 style={{ fontSize: 34, fontWeight: 800 }}>{t('signedOut.title')}</h1>
        <p className="muted">
          {parent ? t('signedOut.parentMessage') : t('signedOut.message')}
        </p>
        <Button size="lg" to={parent ? '/login?as=parent' : '/login'} iconRight="arrowRight">
          {t('signedOut.again')}
        </Button>
      </Card>
    </div>
  );
}
