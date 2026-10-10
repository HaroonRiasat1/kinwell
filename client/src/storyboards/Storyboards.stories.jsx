import { Storyboard } from './Storyboard.jsx';
import * as S from './screens.jsx';

export default { title: 'Storyboards', component: Storyboard, parameters: { layout: 'fullscreen' } };

export const FamilyCheckIn = {
  name: 'Family: weekly check-in from abroad',
  render: () => (
    <Storyboard
      title="Sana checks on Ammi from London"
      persona="Sana Rahman, daughter and main contact, lives in London. Checks in on her phone between meetings."
      goal="Know in under a minute whether Ammi is okay, and what (if anything) she should do."
      frames={[
        { title: 'Sign in as a family member', caption: 'Role is chosen first so each person lands in the right place.', screen: <S.Login /> },
        { title: 'Dashboard: health at a glance', caption: '“Mostly steady” in plain words, today’s ticks from Lahore, and three alerts.', screen: <S.Dashboard /> },
        { title: 'Follow an alert to the lab trend', caption: 'Vitamin D is low: the chart shows the healthy band and when visits happened.', screen: <S.Labs /> },
        { title: 'See why each meal is on the plan', caption: 'Every dish links back to the result it’s meant to help.', screen: <S.Nutrition /> },
        { title: 'Check supplement safety', caption: 'Interactions with Ammi’s medicines are flagged and explained.', screen: <S.Supplements /> },
        { title: 'Reply to the nutritionist', caption: 'The visit summary arrives as a card in the family thread.', screen: <S.Messages /> },
      ]}
    />
  ),
};

export const RescheduleVisit = {
  name: 'Family: move a home visit',
  render: () => (
    <Storyboard
      title="Bilal moves Abbu’s visit"
      persona="Bilal, son in Dubai. Abbu has a wedding on Monday."
      goal="Request a new time in three steps without a phone call."
      frames={[
        { title: 'Open Visits', caption: 'Next visit, what will happen at it, and past visit summaries.', screen: <S.Visits parentKey="abbu" /> },
        { title: 'Pick a day, a time, review', caption: 'Taken slots are shown but can’t be picked. Times are in Lahore time.', screen: <S.Visits parentKey="abbu" rescheduleOpen /> },
      ]}
    />
  ),
};

export const ParentDay = {
  name: 'Parent: ticking off the day',
  render: () => (
    <Storyboard
      title="Ammi’s day, in her own view"
      persona="Fatima Rahman (Ammi), 72, Lahore. Uses a tablet; prefers large text."
      goal="Tick off vitamins and meals, and call her children with one tap."
      frames={[
        { title: 'Sana makes a sign-in code', caption: 'Until SMS is connected, the family creates the code and sends it on WhatsApp.', screen: <S.ParentSignInHelp /> },
        { title: 'Ammi types the code', caption: 'One field, six big boxes; works with paste and phone autofill.', screen: <S.Login mode="code" /> },
        { title: 'One column, big buttons', caption: '24px text, 64px buttons, one task per card. Sana sees the ticks instantly.', screen: <S.ParentHome />, height: 420 },
      ]}
    />
  ),
};

export const NutritionistVisit = {
  name: 'Nutritionist: a home visit',
  render: () => (
    <Storyboard
      title="Hina’s home visit with Ammi"
      persona="Hina Qureshi, registered dietitian, 18 clients across Model Town and Gulberg. Works on a tablet."
      goal="Record the visit, adjust the plan, and update the family before the next appointment."
      frames={[
        { title: 'Pick today’s client', caption: 'Filter by status; clients who need attention are easy to find.', screen: <S.Clients /> },
        { title: 'Record vitals and observations', caption: 'Large fields with last visit’s values for comparison; chips instead of typing.', screen: <S.VisitForm /> },
        { title: 'Visit saved', caption: 'The family sees the measurements straight away.', screen: <S.VisitForm saved /> },
        { title: 'Build next week’s plan', caption: 'Drag meals and supplements in; link each to a lab result.', screen: <S.PlanBuilder /> },
        { title: 'Send a plain-language update', caption: 'A live preview shows exactly what Sana and Bilal will read.', screen: <S.SendUpdate /> },
      ]}
    />
  ),
};

export const AdminReview = {
  name: 'Admin: morning operations review',
  render: () => (
    <Storyboard
      title="Zara’s morning review"
      persona="Zara Ahmed, operations lead for Lahore."
      goal="Clear the review queue and spot capacity problems early."
      frames={[
        { title: 'Overview and review queue', caption: 'Critical results and unlogged visits first; resolve with one tap.', screen: <S.AdminOverview /> },
        { title: 'Team status', caption: 'Licences due, visits not logged, who is on leave.', screen: <S.AdminTeam /> },
        { title: 'Families', caption: 'Every family, its nutritionist and how recently they were active.', screen: <S.AdminFamilies /> },
      ]}
    />
  ),
};

export const Onboarding = {
  name: 'Onboarding: setting up a family',
  render: () => (
    <Storyboard
      title="Sana sets up Kinwell"
      persona="Sana, before Ammi and Abbu’s first visit."
      goal="Get from nothing to a booked nutritionist in about five minutes."
      frames={[0, 1, 2, 3, 4, 5].map((step) => ({
        title: ['You', 'Parents', 'Invite family', 'Choose a nutritionist', 'Health basics', 'Done'][step],
        caption: [
          'Name, email, password and where you live (for time zones).',
          'Who we’re looking after, and what the family calls them.',
          'Brothers and sisters get view or edit access.',
          'Matched by area, language and next opening.',
          'Conditions and diet, as far as you know.',
          'Straight to the dashboard.',
        ][step],
        screen: <S.Onboarding step={step} />,
      }))}
    />
  ),
};
