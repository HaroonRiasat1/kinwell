import LandingPage from './LandingPage.jsx';
import { ExplainerVideo } from './ExplainerVideo.jsx';

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
