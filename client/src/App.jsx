import { Navigate, Route, Routes } from 'react-router-dom';
import { HOME_FOR_ROLE, useAuth } from './context/AuthContext.jsx';
import LoginPage from './features/auth/LoginPage.jsx';
import SignedOutPage from './features/auth/SignedOutPage.jsx';
import { FamilyLayout } from './features/family/FamilyLayout.jsx';
import { ProfileLayout } from './features/family/ProfileLayout.jsx';
import DashboardPage from './features/family/DashboardPage.jsx';
import OverviewPage from './features/family/OverviewPage.jsx';
import LabsPage from './features/family/LabsPage.jsx';
import NutritionPage from './features/family/NutritionPage.jsx';
import SupplementsPage from './features/family/SupplementsPage.jsx';
import VisitsPage from './features/family/VisitsPage.jsx';
import DocumentsPage from './features/family/DocumentsPage.jsx';
import MessagesPage from './features/family/MessagesPage.jsx';
import ParentHomePage from './features/parent/ParentHomePage.jsx';
import { WorkspaceLayout } from './features/workspace/WorkspaceLayout.jsx';
import ClientsPage from './features/workspace/ClientsPage.jsx';
import VisitPage from './features/workspace/VisitPage.jsx';
import PlanBuilderPage from './features/workspace/PlanBuilderPage.jsx';
import SendUpdatePage from './features/workspace/SendUpdatePage.jsx';
import { AdminLayout } from './features/admin/AdminLayout.jsx';
import AdminOverviewPage from './features/admin/AdminOverviewPage.jsx';
import { FamiliesPage, NutritionistsPage } from './features/admin/AdminTablesPage.jsx';
import OnboardingPage from './features/onboarding/OnboardingPage.jsx';
import DesignSystemPage from './features/design-system/DesignSystemPage.jsx';
import LandingPage from './features/landing/LandingPage.jsx';

/** Only lets through signed-in users with one of `roles`; everyone else goes to sign in. */
function RequireRole({ roles, children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={HOME_FOR_ROLE[user.role]} replace />;
  return children;
}

/** Public website for visitors; signed-in users go straight to their area. */
function Home() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return user ? <Navigate to={HOME_FOR_ROLE[user.role]} replace /> : <LandingPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signed-out" element={<SignedOutPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/design-system" element={<DesignSystemPage />} />

      <Route path="/family" element={<RequireRole roles={['family']}><FamilyLayout /></RequireRole>} />
      <Route path="/family/:parentId/simple" element={<RequireRole roles={['family']}><ParentHomePage familyPreview /></RequireRole>} />
      <Route path="/family/:parentId" element={<RequireRole roles={['family']}><FamilyLayout /></RequireRole>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route element={<ProfileLayout />}>
          <Route path="profile" element={<OverviewPage />} />
          <Route path="labs" element={<LabsPage />} />
          <Route path="nutrition" element={<NutritionPage />} />
          <Route path="supplements" element={<SupplementsPage />} />
          <Route path="visits" element={<VisitsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
        </Route>
      </Route>

      <Route path="/parent" element={<RequireRole roles={['parent']}><ParentHomePage /></RequireRole>} />

      <Route path="/workspace" element={<RequireRole roles={['nutritionist']}><WorkspaceLayout /></RequireRole>}>
        <Route index element={<Navigate to="clients" replace />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="visit/:parentId" element={<VisitPage />} />
        <Route path="builder/:parentId" element={<PlanBuilderPage />} />
        <Route path="update/:parentId" element={<SendUpdatePage />} />
      </Route>

      <Route path="/admin" element={<RequireRole roles={['admin']}><AdminLayout /></RequireRole>}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AdminOverviewPage />} />
        <Route path="nutritionists" element={<NutritionistsPage />} />
        <Route path="families" element={<FamiliesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
