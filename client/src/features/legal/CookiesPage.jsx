import { useNavigate } from 'react-router-dom';
import { BrandMark } from '../../components/layout/index.js';
import { Button, Card } from '../../components/ui/index.js';
import { LanguageSwitcher, useI18n } from '../../i18n/index.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import './legal.css';

const ITEMS = ['signIn', 'lang', 'notice'];

/** Everything Kinwell keeps on a device, in plain words. */
export default function CookiesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  usePageTitle(t('cookies.title'));
  return (
    <div className="kw-backdrop kw-legal">
      <Card pad={32} gap={18} className="kw-legal__card">
        <div className="row row--between">
          <BrandMark to="/" />
          <LanguageSwitcher />
        </div>
        <h1>{t('cookies.title')}</h1>
        <p className="kw-legal__lead">{t('cookies.intro')}</p>
        <dl className="kw-legal__list">
          {ITEMS.map((k) => (
            <div key={k}>
              <dt>{t(`cookies.${k}Name`)}</dt>
              <dd>
                {t(`cookies.${k}Why`)}
                <span className="muted text-sm">
                  {t('cookies.howLong')}: {t(`cookies.${k}Long`)}
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <h2>{t('cookies.fontsTitle')}</h2>
        <p>{t('cookies.fontsText')}</p>
        <p className="muted">{t('cookies.clear')}</p>
        <Button variant="glass" icon="arrowLeft" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} style={{ alignSelf: 'flex-start' }}>
          {t('cookies.back')}
        </Button>
      </Card>
    </div>
  );
}
