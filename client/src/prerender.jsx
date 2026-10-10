// Server-side entry used only at build time (scripts/prerender.mjs): renders the public homepage
// to HTML so search engines and link previews see the real content without running JavaScript.
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { I18nProvider } from './i18n/index.js';
import { ToastProvider } from './components/ui/index.js';
import LandingPage, { FAQ } from './features/landing/LandingPage.jsx';

export function renderHome() {
  return renderToString(
    <I18nProvider initialLanguage="en">
      <StaticRouter location="/">
        <ToastProvider>
          <LandingPage />
        </ToastProvider>
      </StaticRouter>
    </I18nProvider>,
  );
}

/** schema.org data for search engines, built from the same text the page shows. */
export function structuredData(siteUrl) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${siteUrl}/#org`,
      name: 'Kinwell',
      url: `${siteUrl}/`,
      logo: `${siteUrl}/icon-512.png`,
      description: 'Home nutrition care for parents in Lahore, with plain-language updates for their families abroad.',
      areaServed: { '@type': 'City', name: 'Lahore' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: 'Kinwell',
      url: `${siteUrl}/`,
      publisher: { '@id': `${siteUrl}/#org` },
      inLanguage: 'en',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Home nutrition care for older parents',
      serviceType: 'Home visits by a registered nutritionist',
      provider: { '@id': `${siteUrl}/#org` },
      areaServed: ['Model Town', 'Gulberg', 'DHA', 'Johar Town', 'Cantt'].map((name) => ({ '@type': 'Place', name: `${name}, Lahore` })),
      audience: { '@type': 'Audience', audienceType: 'Families of older adults living in Lahore' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ];
}
