// Guided tours, one per role. Each step points at an element marked data-tour="…" (null = a
// centred card), may move to another page first (`route`), and with `click: true` invites the
// person to tap the highlighted control themselves. A step whose element isn't on screen (for
// example a sidebar button on a phone) is skipped.

export const TOUR_FOR_ROLE = { family: 'family', parent: 'parent', nutritionist: 'nutritionist', admin: 'admin' };

/** Where each tour may start on its own the first time (it waits until the person is there). */
export const TOUR_HOME = {
  family: /^\/family\/[^/]+\/dashboard$/,
  parent: /^\/parent$/,
  nutritionist: /^\/workspace\/today$/,
  admin: /^\/admin\/overview$/,
};

export const TOURS = {
  family: ({ parentId, short = 'your parent' }) => {
    const base = `/family/${parentId}`;
    return [
      { title: 'Welcome to Kinwell', text: 'A one-minute tour of where everything is. Press Next, or tap the highlighted buttons yourself.' },
      { route: `${base}/dashboard`, target: 'glance', title: `How ${short} is doing`, text: 'The overall picture in plain words, updated after every visit and every lab report.' },
      { target: 'today', title: 'Today’s checklist', text: `The tablets and meals ${short} ticks off today. If they tell you on the phone, you can tick one for them.` },
      { target: 'alerts', title: 'Alerts only when needed', text: 'A missed tablet, a rising reading or an overdue test, each with what to do next.' },
      { target: 'nav-labs', click: true, title: 'Lab tests', text: 'Tap Lab tests to see every result with its healthy range and trend.' },
      { route: `${base}/labs`, target: 'add-report', title: 'Add a lab report', text: 'Choose a PDF or take a photo of the report. We read the numbers, you check them, then save.' },
      { target: 'nav-messages', click: true, title: 'Messages', text: 'Tap Messages to talk to the nutritionist and your family in one thread.' },
      { route: `${base}/messages`, target: 'composer', title: 'Write a message', text: 'The nutritionist and everyone in the family see it, and replies arrive here.' },
      { target: 'parent-signin', title: `Help ${short} sign in`, text: `Make a six-digit code for ${short}’s phone so they can tick off their own checklist.` },
      { target: 'tour-help', title: 'See this again any time', text: 'Tap the question mark to replay this tour.' },
    ];
  },

  parent: ({ t }) => [
    { title: t('tour.parent.welcomeTitle'), text: t('tour.parent.welcomeText') },
    { route: '/parent', target: 'task-done', title: t('tour.parent.doneTitle'), text: t('tour.parent.doneText') },
    { target: 'next-visit', title: t('tour.parent.visitTitle'), text: t('tour.parent.visitText') },
    { target: 'call-family', title: t('tour.parent.callTitle'), text: t('tour.parent.callText') },
    { target: 'language', title: t('tour.parent.languageTitle'), text: t('tour.parent.languageText') },
    { target: 'tour-help', title: t('tour.parent.helpTitle'), text: t('tour.parent.helpText') },
  ],

  nutritionist: () => [
    { title: 'Your workspace', text: 'A quick look at where your day happens. Press Next, or tap the highlighted buttons yourself.' },
    { route: '/workspace/today', target: 'today-visits', title: 'Today’s visits', text: 'Your home visits in order, with each client’s status and what to check.' },
    { target: 'start-visit', title: 'Start a visit', text: 'Open the visit when you arrive. Readings are checked and graded as you type, and the family gets your note.' },
    { target: 'nav-clients', click: true, title: 'Clients', text: 'Tap Clients to see everyone you look after, those needing attention first.' },
    { target: 'nav-messages', click: true, title: 'Messages', text: 'Tap Messages for family threads. Those waiting for a reply are marked.' },
    { target: 'tour-help', title: 'See this again any time', text: 'Tap the question mark to replay this tour.' },
  ],

  admin: () => [
    { title: 'Operations', text: 'A quick look at the admin area. Press Next, or tap the highlighted buttons yourself.' },
    { route: '/admin/overview', target: 'overview-stats', title: 'The numbers that matter', text: 'Families, clients, visits this week and open flags at a glance.' },
    { target: 'needs-review', title: 'Needs review', text: 'Flags for the team, most urgent first. Remind the right person, add a note or resolve.' },
    { target: 'queues', title: 'Queues', text: 'Lab reports that couldn’t be read and relatives asking to join a family.' },
    { target: 'nav-families', click: true, title: 'Families', text: 'Tap Families to search, change a nutritionist or resend an invite.' },
    { target: 'nav-accounts', title: 'Accounts', text: 'Reset a password, make a parent sign-in code, or sign someone out everywhere.' },
    { target: 'tour-help', title: 'See this again any time', text: 'Tap the question mark to replay this tour.' },
  ],
};
