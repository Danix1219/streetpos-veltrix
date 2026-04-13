import React, { useState, useContext } from 'react';
import streetposApi from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';

export const Login = () => {
  // Estado para alternar entre vistas
  const [view, setView] = useState<'login' | 'forgot'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); // Nuevo: Para mensajes de éxito
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await streetposApi.post('/Auth/login', { email, password });
      const { token, rol, nombre } = response.data;
      login(token, nombre, rol);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales inválidas o error de red.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      // Ajusta esta ruta según cómo se llame tu endpoint en el backend
      await streetposApi.post('/Auth/forgot-password', { email });
      setSuccessMsg('Si el correo está registrado, te hemos enviado un enlace para restablecer tu contraseña.');
      // Opcional: limpiar el email
      // setEmail(''); 
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar estados al cambiar de vista
  const switchView = (newView: 'login' | 'forgot') => {
    setView(newView);
    setError('');
    setSuccessMsg('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* --- LADO IZQUIERDO: Formulario Clean --- */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 2xl:w-1/3 lg:px-20 xl:px-24 relative overflow-hidden">
        <div className="mx-auto w-full max-w-sm lg:w-96 relative">
          
          {/* Logo y Encabezado Limpio (Se adapta según la vista) */}
          <div className="transition-all duration-500">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 mb-8">
              {view === 'login' ? (
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              )}
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {view === 'login' ? 'Bienvenido de nuevo' : 'Recuperar acceso'}
            </h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              {view === 'login' 
                ? 'Ingresa a tu espacio de trabajo en StreetPOS' 
                : 'Ingresa tu correo y te enviaremos las instrucciones.'}
            </p>
          </div>

          <div className="mt-8">
            {/* Mensajes de Error y Éxito */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start animate-fade-in">
                <svg className="w-5 h-5 text-rose-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-bold text-rose-700">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start animate-fade-in">
                <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-bold text-emerald-700">{successMsg}</span>
              </div>
            )}

            {/* VISTA 1: FORMULARIO DE LOGIN */}
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
                
                {/* Grupo Input Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Correo Corporativo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all sm:text-sm font-medium"
                      placeholder="admin@streetpos.com"
                    />
                  </div>
                </div>

                {/* Grupo Input Contraseña */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all sm:text-sm font-medium"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded cursor-pointer" />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 font-medium cursor-pointer">
                      Mantener sesión
                    </label>
                  </div>
                  <div className="text-sm">
                    <button type="button" onClick={() => switchView('forgot')} className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                      ¿Olvidaste tu clave?
                    </button>
                  </div>
                </div>

                <div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all 
                      ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 active:scale-[0.98]'}`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Verificando...
                      </>
                    ) : 'Acceder'}
                  </button>
                </div>
              </form>
            )}

            {/* VISTA 2: FORMULARIO DE RECUPERAR CONTRASEÑA */}
            {view === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Correo Corporativo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all sm:text-sm font-medium"
                      placeholder="admin@streetpos.com"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all 
                      ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:scale-[0.98]'}`}
                  >
                    {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => switchView('login')}
                    className="w-full py-3.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors flex justify-center items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Volver a iniciar sesión
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Veltrix Solutions &copy; 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- LADO DERECHO: Banner Branding (Solo visible en Desktop) --- */}
      <div className="hidden lg:block relative w-0 flex-1 bg-gray-900">
        <div className="absolute inset-0 h-full w-full bg-blue-600 flex items-center justify-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 p-12 text-center max-w-2xl">
             <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl mb-8">
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
               </svg>
             </div>
             <h2 className="text-4xl font-black text-white tracking-tight mb-4">Gestión empresarial a otro nivel.</h2>
             <p className="text-lg text-blue-100 font-medium">Administra inventario, ventas y sucursales en tiempo real con una interfaz diseñada para la velocidad.</p>
          </div>
        </div>
      </div>

    </div>
  );
};