import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AdminLayout } from './components/Layout/AdminLayout.js';
import { Login } from './pages/Login.js';
import { Dashboard } from './pages/Dashboard.js';
import { PageList } from './pages/Pages/PageList.js';
import { PageEdit } from './pages/Pages/PageEdit.js';
import { PostList } from './pages/Posts/PostList.js';
import { PostEdit } from './pages/Posts/PostEdit.js';
import { ProductList } from './pages/Products/ProductList.js';
import { ProductEdit } from './pages/Products/ProductEdit.js';
import { CategoryList } from './pages/Categories/CategoryList.js';
import { MediaLibrary } from './pages/Media/MediaLibrary.js';
import { NavigationManager } from './pages/Navigation/NavigationManager.js';
import { SiteSettingsPage } from './pages/Settings/SiteSettingsPage.js';
import { SeoSettingsPage } from './pages/Settings/SeoSettingsPage.js';
import { UserManagement } from './pages/Users/UserManagement.js';
import { BackupsPage } from './pages/Backups/BackupsPage.js';
import { RevisionsPage } from './pages/Revisions/RevisionsPage.js';
import { TrashPage } from './pages/Trash/TrashPage.js';
import { ThemesPage } from './pages/Themes/ThemesPage.js';
import { SetupWizard } from './pages/Setup/SetupWizard.js';
import { BlueprintStudio } from './pages/Blueprints/BlueprintStudio.js';
import { BlueprintCreate } from './pages/Blueprints/BlueprintCreate.js';
import { FeaturePacksPage } from './pages/Blueprints/FeaturePacksPage.js';
import { DynamicEntryList } from './pages/Blueprints/DynamicEntryList.js';
import { DynamicEntryEdit } from './pages/Blueprints/DynamicEntryEdit.js';
import { DesignSystemPage } from './pages/DesignSystem/DesignSystemPage.js';
import { api } from './api/client.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [checkingSetup, setCheckingSetup] = React.useState(true);
  const [isSetupRequired, setIsSetupRequired] = React.useState(false);

  React.useEffect(() => {
    api.get<{ isSetupRequired: boolean }>('/api/auth/setup-status')
      .then((res) => {
        if (res?.isSetupRequired) {
          setIsSetupRequired(true);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingSetup(false));
  }, []);

  if (loading || checkingSetup) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-3 text-on-surface-variant font-body-sm">
        <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span>Verifying authenticated session...</span>
      </div>
    );
  }

  if (isSetupRequired) {
    return <Navigate to="/setup" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const SmartProductRoute: React.FC = () => {
  return <Navigate to="/blueprints/templates" replace />;
};

const SmartProductEditRoute: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/blueprints/templates/${slug || 'new'}`} replace />;
};

export const App: React.FC = () => {
  const basename = import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : '/admin';

  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="design-system" element={<DesignSystemPage />} />
            <Route path="components-and-tokens" element={<DesignSystemPage />} />
            <Route path="pages" element={<PageList />} />
            <Route path="pages/:slug" element={<PageEdit />} />
            <Route path="posts" element={<PostList />} />
            <Route path="posts/:slug" element={<PostEdit />} />
            <Route path="products" element={<SmartProductRoute />} />
            <Route path="products/:slug" element={<SmartProductEditRoute />} />
            <Route path="templates" element={<Navigate to="/blueprints/templates" replace />} />
            <Route path="templates/:slug" element={<SmartProductEditRoute />} />
            <Route path="categories" element={<CategoryList />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="navigation" element={<NavigationManager />} />
            <Route path="themes" element={<ThemesPage />} />
            <Route path="settings" element={<SiteSettingsPage />} />
            <Route path="settings/seo" element={<SeoSettingsPage />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="backups" element={<BackupsPage />} />
            <Route path="revisions" element={<RevisionsPage />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="blueprints" element={<Navigate to="/blueprints/studio" replace />} />
            <Route path="blueprints/studio" element={<BlueprintStudio />} />
            <Route path="blueprints/new" element={<BlueprintCreate />} />
            <Route path="blueprints/edit/:blueprintSlug" element={<BlueprintCreate />} />
            <Route path="blueprints/feature-packs" element={<FeaturePacksPage />} />
            <Route path="blueprints/:blueprintSlug" element={<DynamicEntryList />} />
            <Route path="blueprints/:blueprintSlug/new" element={<DynamicEntryEdit />} />
            <Route path="blueprints/:blueprintSlug/:entrySlug" element={<DynamicEntryEdit />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
