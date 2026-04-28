import { useContext, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Páginas
import { Login } from './pages/Login';
import { StaffManagement } from './pages/StaffManagement';
import { CategoryManagement } from './pages/CategoryManagement';
import { ProductManagement } from './pages/ProductManagement';
import { TenantManagement } from './pages/TenantManagement';
import { PointOfSale } from './pages/PointOfSale';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { ReportsManagement } from './pages/ReportsManagement';

// 🚨 NUEVAS PÁGINAS IMPORTADAS 🚨
import { BranchManagement } from './pages/BranchManagement';
import { InventoryManagement } from './pages/InventoryManagement';

// Componente Layout
import { Layout } from './components/Layout';

// 1. Guardián de Rutas
const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles?: string[] }) => {
  const { token, rol } = useContext(AuthContext);

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && rol && !allowedRoles.includes(rol)) return <Navigate to="/" replace />;

  return <>{children}</>;
};

// 2. Mapeo de Rutas
const AppRoutes = () => {
  const { token, rol } = useContext(AuthContext);

  // Determinamos a dónde debería ir un usuario logueado
  let redirectPath = '/login';
  if (token) {
      if (rol === 'SuperAdmin') redirectPath = '/admin/tenants';
      else if (rol === 'Admin') redirectPath = '/admin/reports';
      else if (rol === 'Cajero') redirectPath = '/pos';
  }

  return (
    <Routes>
      {/* LA RAÍZ: Si tiene token, lo manda a su panel. Si no, lo manda a /login. */}
      <Route path="/" element={<Navigate to={token ? redirectPath : "/login"} replace />} />

      {/* LOGIN: Si ya tiene token, NO DEBE ESTAR AQUÍ, lo mandamos a su panel. 
        Si no tiene token, se renderiza <Login /> (SIN NINGÚN REDIRECT)
      */}
      <Route path="/login" element={token ? <Navigate to={redirectPath} replace /> : <Login />} />

      {/* RUTAS PÚBLICAS */}
      <Route path="/reset-password" element={token ? <Navigate to="/" replace /> : <ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* =======================================
          RUTAS PROTEGIDAS
          ======================================= */}
      <Route path="/pos" element={
        <ProtectedRoute allowedRoles={['Cajero', 'Admin']}>
          <Layout><PointOfSale /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/staff" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <Layout><StaffManagement /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/categories" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <Layout><CategoryManagement /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/products" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <Layout><ProductManagement /></Layout>
        </ProtectedRoute>
      } />

      {/* 🚨 NUEVA RUTA: GESTIÓN DE SUCURSALES 🚨 */}
      <Route path="/admin/branches" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <Layout><BranchManagement /></Layout>
        </ProtectedRoute>
      } />

      {/* 🚨 NUEVA RUTA: GESTIÓN DE INVENTARIO 🚨 */}
      <Route path="/admin/inventory" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <Layout><InventoryManagement /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/reports" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <Layout><ReportsManagement /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/tenants" element={
        <ProtectedRoute allowedRoles={['SuperAdmin']}>
          <Layout><TenantManagement /></Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;