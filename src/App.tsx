import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { queryClient } from './lib/queryClient';
import SuperAdminLoginPage from './pages/super-admin/LoginPage';
import SuperAdminDashboardPage from './pages/super-admin/DashboardPage';
import SuperAdminCompaniesPage from './pages/super-admin/CompaniesPage';
import SuperAdminCompanyDetailPage from './pages/super-admin/CompanyDetailPage';
import SuperAdminAuditLogsPage from './pages/super-admin/AuditLogsPage';
import SuperAdminChangePasswordPage from './pages/super-admin/ChangePasswordPage';
import { SuperAdminLayout } from './components/super-admin/Layout';
import { RequireSuperAuth } from './components/super-admin/RequireAuth';
import TenantLoginPage from './pages/tenant/LoginPage';
import TenantDashboardPage from './pages/tenant/DashboardPage';
import HandoffPage from './pages/tenant/HandoffPage';
import BranchesPage from './pages/tenant/BranchesPage';
import RegionsPage from './pages/tenant/RegionsPage';
import UsersPage from './pages/tenant/UsersPage';
import RolesPage from './pages/tenant/RolesPage';
import AuditLogsPage from './pages/tenant/AuditLogsPage';
import CategoriesPage from './pages/tenant/CategoriesPage';
import TagsPage from './pages/tenant/TagsPage';
import ExpensesPage from './pages/tenant/ExpensesPage';
import ChangePasswordPage from './pages/tenant/ChangePasswordPage';
import { TenantLayout } from './components/tenant/Layout';
import { RequireTenantAuth } from './components/tenant/RequireAuth';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public-on-this-domain */}
          <Route path="/login" element={<TenantLoginPage />} />
          <Route path="/auth/handoff" element={<HandoffPage />} />
          <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />

          {/* Tenant app */}
          <Route element={<RequireTenantAuth />}>
            <Route element={<TenantLayout />}>
              <Route path="/" element={<TenantDashboardPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/branches" element={<BranchesPage />} />
              <Route path="/regions" element={<RegionsPage />} />
              <Route path="/expense-categories" element={<CategoriesPage />} />
              <Route path="/tags" element={<TagsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/audit" element={<AuditLogsPage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
            </Route>
          </Route>

          {/* Super admin */}
          <Route path="/super-admin" element={<RequireSuperAuth />}>
            <Route element={<SuperAdminLayout />}>
              <Route index element={<SuperAdminDashboardPage />} />
              <Route path="companies" element={<SuperAdminCompaniesPage />} />
              <Route path="companies/:id" element={<SuperAdminCompanyDetailPage />} />
              <Route path="audit" element={<SuperAdminAuditLogsPage />} />
              <Route path="change-password" element={<SuperAdminChangePasswordPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
