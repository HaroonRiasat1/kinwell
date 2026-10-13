import LandingPage from './LandingPage.jsx';
import { ExplainerVideo } from './ExplainerVideo.jsx';
import { McpFilm } from './McpFilm.jsx';

export default { title: 'Screens/Website', component: LandingPage, parameters: { layout: 'fullscreen' } };

export const Home = {};

/** The "See it in action" film on its own. Starts paused here so each chapter can be checked. */
export const Walkthrough = {
  render: () => (
    <div className="lp" style={{ minHeight: 0, padding: 24 }}>
      <ExplainerVideo autoPlay={false} />
    </div>
  ),
};

/** "Kinwell in Claude": the MCP server at work. Starts paused so each chapter can be checked. */
export const ClaudeFilm = {
  render: () => (
    <div className="lp" style={{ minHeight: 0, padding: 24 }}>
      <McpFilm autoPlay={false} />
    </div>
  ),
};
