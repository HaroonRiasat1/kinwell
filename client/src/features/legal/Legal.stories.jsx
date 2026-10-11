import { CookieNoticeView } from './CookieNotice.jsx';
import CookiesPage from './CookiesPage.jsx';

export default { title: 'Screens/Website/Cookies', parameters: { layout: 'fullscreen' } };

/** First-visit notice (switch the locale toolbar to Urdu to see it right-to-left). */
export const Notice = { render: () => <div style={{ minHeight: 320 }}><CookieNoticeView onClose={() => {}} /></div> };

/** "What we keep": everything Kinwell stores on a device. */
export const Page = { render: () => <CookiesPage /> };
