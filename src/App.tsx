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

// Componente Layout (El Menú Lateral)
import { Layout } from './components/Layout';

// 1. Guardián de Rutas Estricto (Verifica Token y Rol)
const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles?: string[] }) => {
  const { token, rol } = useContext(AuthContext);

  // Si no hay token, patada inmediata al Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si la ruta exige roles específicos y el usuario no lo tiene, patada al inicio
  if (allowedRoles && rol && !allowedRoles.includes(rol)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// 2. Controlador de Tráfico (Redirige al hacer Login)
const RootRedirect = () => {
  const { token, rol } = useContext(AuthContext);

  if (!token) return <Navigate to="/login" replace />;

  // Redirección Automática según el Rol
  if (rol === 'SuperAdmin') return <Navigate to="/admin/tenants" replace />;
  if (rol === 'Admin') return <Navigate to="/admin/staff" replace />;
  if (rol === 'Cajero') return <Navigate to="/pos" replace />;

  // Failsafe por si algo sale mal
  return <Navigate to="/login" replace />;
};

// 3. Mapeo de Rutas
const AppRoutes = () => {
  const { token } = useContext(AuthContext);

  return (
    <Routes>
      {/* La raíz '/' es la que decide a dónde mandarte */}
      <Route path="/" element={<RootRedirect />} />

      {/* Si el usuario ya está logueado e intenta ir a /login, lo regresamos a su panel */}
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />

      {/* RUTA: Recuperación de contraseña (Accesible sin token) */}
      <Route path="/reset-password" element={token ? <Navigate to="/" replace /> : <ResetPassword />} />
      {/* RUTA: Verificación de correo (Accesible sin token) */}
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* =======================================
          RUTAS DE CAJEROS (Y superiores)
          ======================================= */}
      <Route path="/pos" element={
        <ProtectedRoute allowedRoles={['Cajero', 'Admin', 'SuperAdmin']}>
          {/* Aquí envolvemos la página con el Layout */}
          <Layout>
            <PointOfSale />
          </Layout>
        </ProtectedRoute>
      } />

      {/* =======================================
          RUTAS DE ADMINS (Y superiores)
          ======================================= */}
      <Route path="/admin/staff" element={
        <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
          <Layout>
            <StaffManagement />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/categories" element={
        <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
          <Layout>
            <CategoryManagement />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/products" element={
        <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
          <Layout>
            <ProductManagement />
          </Layout>
        </ProtectedRoute>
      } />

      {/* =======================================
          RUTAS EXCLUSIVAS DEL DUEÑO DEL SAAS
          ======================================= */}
      <Route path="/admin/tenants" element={
        <ProtectedRoute allowedRoles={['SuperAdmin']}>
          <Layout>
            <TenantManagement />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Si el usuario escribe una URL que no existe, lo mandamos al clasificador */}
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