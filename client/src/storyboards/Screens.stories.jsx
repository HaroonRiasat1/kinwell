import * as S from './screens.jsx';

export default { title: 'Screens', parameters: { layout: 'fullscreen' } };

const parentArg = { argTypes: { parentKey: { control: 'inline-radio', options: ['ammi', 'abbu'] } }, args: { parentKey: 'ammi' } };

export const SignIn = { render: () => <S.Login /> , name: 'Auth / Sign in' };
export const SignInError = { render: () => <S.Login error="That email and password don't match. Check them and try again." />, name: 'Auth / Sign in – wrong password' };
export const SignInLoading = { render: () => <S.Login busy />, name: 'Auth / Sign in – signing in' };
export const ParentCode = { render: () => <S.Login mode="code" />, name: 'Auth / Parent text code' };
export const ForgotPassword = { render: () => <S.Login mode="forgot" />, name: 'Auth / Forgot password' };
export const SignedOut = { render: () => <S.SignedOut />, name: 'Auth / Signed out' };

export const Dashboard = { ...parentArg, render: (a) => <S.Dashboard {...a} />, name: 'Family / Dashboard' };
export const DashboardLoading = { render: () => <S.Dashboard status="loading" />, name: 'Family / Dashboard – loading' };
export const DashboardEmpty = { render: () => <S.Dashboard status="empty" />, name: 'Family / Dashboard – empty' };
export const DashboardError = { render: () => <S.Dashboard status="error" />, name: 'Family / Dashboard – error' };
export const Profile = { ...parentArg, render: (a) => <S.Overview {...a} />, name: 'Family / Profile' };
export const Labs = { ...parentArg, render: (a) => <S.Labs {...a} />, name: 'Family / Lab tests' };
export const LabsReading = { render: () => <S.Labs upload="reading" />, name: 'Family / Lab tests – reading upload' };
export const LabsUploadFailed = { render: () => <S.Labs upload="failed" />, name: 'Family / Lab tests – upload failed' };
export const LabsEmpty = { render: () => <S.Labs empty />, name: 'Family / Lab tests – empty' };
export const Nutrition = { ...parentArg, render: (a) => <S.Nutrition {...a} />, name: 'Family / Nutrition plan' };
export const Supplements = { ...parentArg, render: (a) => <S.Supplements {...a} />, name: 'Family / Supplements' };
export const Visits = { ...parentArg, render: (a) => <S.Visits {...a} />, name: 'Family / Visits' };
export const Reschedule = { render: () => <S.Visits rescheduleOpen />, name: 'Family / Visits – reschedule' };
export const Documents = { ...parentArg, render: (a) => <S.Documents {...a} />, name: 'Family / Documents' };
export const Messages = { ...parentArg, render: (a) => <S.Messages {...a} />, name: 'Family / Messages' };

export const ParentView = { ...parentArg, render: (a) => <S.ParentHome {...a} />, name: 'Parent / Simple view' };

export const Clients = { render: () => <S.Clients />, name: 'Nutritionist / Clients' };
export const VisitForm = { render: () => <S.VisitForm />, name: 'Nutritionist / Start visit' };
export const VisitSaved = { render: () => <S.VisitForm saved />, name: 'Nutritionist / Visit saved' };
export const PlanBuilder = { render: () => <S.PlanBuilder />, name: 'Nutritionist / Plan builder' };
export const SendUpdate = { render: () => <S.SendUpdate />, name: 'Nutritionist / Send update' };

export const AdminOverview = { render: () => <S.AdminOverview />, name: 'Admin / Overview' };
export const AdminTeam = { render: () => <S.AdminTeam />, name: 'Admin / Nutritionists' };
export const AdminFamilies = { render: () => <S.AdminFamilies />, name: 'Admin / Families' };

export const Onboarding = {
  argTypes: { step: { control: { type: 'range', min: 0, max: 5 } } },
  args: { step: 0 },
  render: (a) => <S.Onboarding key={a.step} {...a} />,
  name: 'Onboarding / Steps',
};
