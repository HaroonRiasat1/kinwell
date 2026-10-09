import { MemoryRouter } from 'react-router-dom';
import '../src/styles/index.css';

/** @type { import('@storybook/react').Preview } */
export default {
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true }, // the app paints its own warm glass backdrop
    controls: { matchers: { color: /(background|color)$/i } },
    options: { storySort: { order: ['Foundations', 'Components', 'Layout', 'Screens', 'Storyboards'] } },
  },
  decorators: [
    (Story, ctx) => (
      <MemoryRouter initialEntries={[ctx.parameters.route ?? '/']}>
        <div className="kw-backdrop" style={{ minHeight: '100%', padding: ctx.parameters.layout === 'fullscreen' ? 0 : 24 }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};
