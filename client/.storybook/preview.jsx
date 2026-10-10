import { MemoryRouter } from 'react-router-dom';
import { I18nProvider, LANGUAGES } from '../src/i18n/index.js';
import '../src/styles/index.css';

/** @type { import('@storybook/react').Preview } */
export default {
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true }, // the app paints its own warm glass backdrop
    controls: { matchers: { color: /(background|color)$/i } },
    options: { storySort: { order: ['Foundations', 'Components', 'Layout', 'Screens', 'Storyboards'] } },
  },
  // Toolbar switch to view any story in another language (and right-to-left for Urdu).
  globalTypes: {
    locale: {
      description: 'Language',
      toolbar: {
        title: 'Language',
        icon: 'globe',
        items: Object.entries(LANGUAGES).map(([value, meta]) => ({ value, title: meta.label })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { locale: 'en' },
  decorators: [
    (Story, ctx) => (
      <I18nProvider key={ctx.globals.locale} initialLanguage={ctx.globals.locale}>
        <MemoryRouter initialEntries={[ctx.parameters.route ?? '/']}>
          <div className="kw-backdrop" style={{ minHeight: '100%', padding: ctx.parameters.layout === 'fullscreen' ? 0 : 24 }}>
            <Story />
          </div>
        </MemoryRouter>
      </I18nProvider>
    ),
  ],
};
