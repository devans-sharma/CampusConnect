import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Layouts
import { AppLayout } from './components/layout/AppLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Public & Student Pages
import { HomePage } from './pages/HomePage';
import { BrowseItemsPage } from './pages/BrowseItemsPage';
import { ItemDetailsPage } from './pages/ItemDetailsPage';
import { ReportLostPage } from './pages/ReportLostPage';
import { ReportFoundPage } from './pages/ReportFoundPage';
import { SubmitClaimPage } from './pages/SubmitClaimPage';
import { ClaimVerificationPage } from './pages/ClaimVerificationPage';
import { CollectionTrackingPage } from './pages/CollectionTrackingPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Admin Pages
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminItemsPage } from './pages/AdminItemsPage';
import { AdminClaimsPage } from './pages/AdminClaimsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Standard Application Layout */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="browse" element={<BrowseItemsPage />} />
              <Route path="items/:id" element={<ItemDetailsPage />} />
              
              {/* Authenticated Student Routes */}
              <Route
                path="report-lost"
                element={
                  <ProtectedRoute>
                    <ReportLostPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="report-found"
                element={
                  <ProtectedRoute>
                    <ReportFoundPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="claim/:itemId"
                element={
                  <ProtectedRoute>
                    <SubmitClaimPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="claim-verification/:id"
                element={
                  <ProtectedRoute>
                    <ClaimVerificationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="collection/:id"
                element={
                  <ProtectedRoute>
                    <CollectionTrackingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <StudentDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Authentication Routes */}
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
            </Route>

            {/* Protected Administration Portal Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="items" element={<AdminItemsPage />} />
              <Route path="claims" element={<AdminClaimsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
            </Route>

            {/* 404 Catch All */}
            <Route path="*" element={<AppLayout />}>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
