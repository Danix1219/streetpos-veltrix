import React, { useContext, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// 🚨 1. IMPORTAMOS NUESTRO HOOK MAESTRO DE SINCRONIZACIÓN 🚨
import { useSync } from '../hooks/useSync';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { rol, nombre, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 🚨 2. DESPERTAMOS EL HOOK EN SEGUNDO PLANO Y EXTRAEMOS SUS ESTADOS 🚨
  const { isSyncing, syncSuccess, pendingCount } = useSync();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Definimos todos los elementos posibles del menú
  const menuItems = [
    {
      title: 'Punto de Venta',
      path: '/pos',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      ),
      allowedRoles: ['Cajero', 'Admin'] 
    },
    {
      title: 'Personal',
      path: '/admin/staff',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      ),
      allowedRoles: ['Admin'] 
    },
    {
      title: 'Categorías',
      path: '/admin/categories',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
      ),
      allowedRoles: ['Admin'] 
    },
    {
      title: 'Productos',
      path: '/admin/products',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
      ),
      allowedRoles: ['Admin'] 
    },
    {
      title: 'Reportes (Cortes)',
      path: '/admin/reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      ),
      allowedRoles: ['Admin'] 
    },
    {
      title: 'Onboarding (Tenants)',
      path: '/admin/tenants',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
      ),
      // 🟢 ESTE ES TU REINO: SOLO Veltrix Solutions entra aquí.
      allowedRoles: ['SuperAdmin'] 
    }
  ];

  // Filtramos el menú para mostrar solo lo que el rol permite
  const allowedMenuItems = menuItems.filter(item => 
    rol && item.allowedRoles.includes(rol)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Botón Hamburguesa para Móviles */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md text-gray-600 hover:text-blue-600"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* ==========================================
          SIDEBAR (Menú Lateral)
          ========================================== */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        {/* Cabecera del Sidebar (Branding) */}
        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          {/* 🚨 CORRECCIÓN: LOGO MÁS GRANDE, BORDES NEÓN Y RESPLANDOR AZUL 🚨 */}
          <div className="mr-3 flex items-center justify-center w-11 h-11 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.15)] relative bg-gradient-to-br from-[#0f172a] to-[#050810] shrink-0 border border-blue-500/30">
            {/* Brillo interno suave para dar volumen */}
            <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-xl pointer-events-none"></div>
            {/* Logo escalado y con resplandor en lugar de sombra oscura */}
            <img 
              src="/streetpos-icon.png" 
              alt="StreetPOS Icon" 
              className="w-7 h-7 object-contain relative z-10 hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" 
            />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none truncate">StreetPOS</h1>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate block">by Veltrix Solutions</span>
          </div>
        </div>

        {/* Info del Usuario Logueado */}
        <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sesión Actual</p>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center mr-3">
              {nombre ? nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{nombre || 'Usuario'}</p>
              <p className="text-[11px] font-semibold text-blue-600">{rol}</p>
            </div>
          </div>
        </div>

        {/* Lista de Navegación */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {allowedMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)} // Cierra el menú en móvil al hacer clic
                className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 font-bold' 
                    : 'text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <div className={`mr-3 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {item.icon}
                </div>
                {item.title}
              </NavLink>
            );
          })}
        </nav>

        {/* Botón de Cerrar Sesión al final del Sidebar */}
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-3 text-sm font-bold text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3-3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Overlay oscuro para móviles cuando el menú está abierto */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* ==========================================
          CONTENIDO PRINCIPAL (Donde se renderizan las páginas)
          ========================================== */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50 h-screen overflow-y-auto relative">
        
        {/* 🚨 3. INDICADOR VISUAL DE SINCRONIZACIÓN GLOBAL 🚨 */}
        {/* Solo se dibuja en pantalla si está sincronizando o si acaba de terminar con éxito */}
        {(isSyncing || syncSuccess) && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in">
            {isSyncing ? (
              // Cápsula Azul: Procesando...
              <div className="bg-blue-600 text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-3 font-bold text-sm">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Subiendo {pendingCount} venta{pendingCount > 1 ? 's' : ''} a la nube...
              </div>
            ) : syncSuccess ? (
              // Cápsula Verde: Éxito
              <div className="bg-emerald-500 text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm animate-bounce-short">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
                ¡Ventas sincronizadas con éxito!
              </div>
            ) : null}
          </div>
        )}

        {/* Aquí se inyectan las páginas como CategoryManagement, PointOfSale, etc. */}
        {children}
      </main>

    </div>
  );
};