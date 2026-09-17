import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { UserManagement } from './pages/Users/UserManagement.js';
import { BackupsPage } from './pages/Backups/BackupsPage.js';
import { RevisionsPage } from './pages/Revisions/RevisionsPage.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        Verifying authenticated session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
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
            <Route path="pages" element={<PageList />} />
            <Route path="pages/:slug" element={<PageEdit />} />
            <Route path="posts" element={<PostList />} />
            <Route path="posts/:slug" element={<PostEdit />} />
            <Route path="products" element={<ProductList />} />
            <Route path="products/:slug" element={<ProductEdit />} />
            <Route path="categories" element={<CategoryList />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="navigation" element={<NavigationManager />} />
            <Route path="settings" element={<SiteSettingsPage />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="backups" element={<BackupsPage />} />
            <Route path="revisions" element={<RevisionsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
