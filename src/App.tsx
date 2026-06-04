import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { queryClient } from './lib/queryClient';
import SuperAdminLoginPage from './pages/super-admin/LoginPage';
import SuperAdminDashboardPage from './pages/super-admin/DashboardPage';
import SuperAdminCompaniesPage from './pages/super-admin/CompaniesPage';
import SuperAdminCompanyDetailPage from './pages/super-admin/CompanyDetailPage';
import SuperAdminAuditLogsPage from './pages/super-admin/AuditLogsPage';
import { SuperAdminLayout } from './components/super-admin/Layout';
import { RequireSuperAuth } from './components/super-admin/RequireAuth';
import TenantLoginPage from './pages/tenant/LoginPage';
import TenantDashboardPage from './pages/tenant/DashboardPage';
import HandoffPage from './pages/tenant/HandoffPage';
import { TenantLayout } from './components/tenant/Layout';
import { RequireTenantAuth } from './components/tenant/RequireAuth';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public-on-this-domain routes */}
          <Route path="/login" element={<TenantLoginPage />} />
          <Route path="/auth/handoff" element={<HandoffPage />} />
          <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />

          {/* Tenant app (the actual EMS for company users) */}
          <Route element={<RequireTenantAuth />}>
            <Route element={<TenantLayout />}>
              <Route path="/" element={<TenantDashboardPage />} />
            </Route>
          </Route>

          {/* Super admin dashboard (you, the SaaS owner) */}
          <Route path="/super-admin" element={<RequireSuperAuth />}>
            <Route element={<SuperAdminLayout />}>
              <Route index element={<SuperAdminDashboardPage />} />
              <Route path="companies" element={<SuperAdminCompaniesPage />} />
              <Route path="companies/:id" element={<SuperAdminCompanyDetailPage />} />
              <Route path="audit" element={<SuperAdminAuditLogsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
