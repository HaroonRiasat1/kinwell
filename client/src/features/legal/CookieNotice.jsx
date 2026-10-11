import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Icon } from '../../components/ui/index.js';
import { useI18n } from '../../i18n/index.js';
import './legal.css';

export const NOTICE_KEY = 'kinwell.notice-seen';

const seen = () => {
  try {
    return localStorage.getItem(NOTICE_KEY) === '1';
  } catch {
    return false;
  }
};

/** The notice itself, without storage: used by the container below and by Storybook. */
export function CookieNoticeView({ onClose, innerRef }) {
  const { t } = useI18n();
  return (
    <section className="kw-cookie" aria-labelledby="cookie-h" ref={innerRef}>
      <span className="kw-cookie__icon" aria-hidden="true">
        <Icon name="lock" size={20} />
      </span>
      <div className="kw-cookie__body">
        <h2 id="cookie-h">{t('cookies.noticeTitle')}</h2>
        <p>{t('cookies.noticeText')}</p>
      </div>
      <div className="kw-cookie__actions">
        <Link to="/cookies" className="kw-cookie__link">
          {t('cookies.learnMore')}
        </Link>
        <Button size="sm" onClick={onClose}>
          {t('cookies.ok')}
        </Button>
      </div>
    </section>
  );
}

/**
 * First-visit notice about cookies and storage. Kinwell sets no cookies and no tracking, so there's
 * nothing to accept or reject: the notice explains what's kept and goes away once read.
 * Shown after mount only, so returning visitors never see it flash.
 */
export function CookieNotice() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => setOpen(!seen()), []);

  // Leave room at the bottom of the page so the notice never hides a button you need to reach.
  useEffect(() => {
    if (!open || !ref.current) return undefined;
    const root = document.documentElement;
    const ro = new ResizeObserver(([e]) => root.style.setProperty('--kw-notice-space', `${Math.ceil(e.target.offsetHeight) + 32}px`));
    ro.observe(ref.current);
    root.classList.add('has-notice');
    return () => {
      ro.disconnect();
      root.classList.remove('has-notice');
      root.style.removeProperty('--kw-notice-space');
    };
  }, [open]);

  if (!open) return null;
  const close = () => {
    try {
      localStorage.setItem(NOTICE_KEY, '1');
    } catch {
      /* private mode: it shows again next visit */
    }
    setOpen(false);
  };
  return <CookieNoticeView onClose={close} innerRef={ref} />;
}
