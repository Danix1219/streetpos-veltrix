import { useState, useContext, useEffect } from 'react';
import streetposApi from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';

export const Login = () => {
  const [view, setView] = useState<'login' | 'forgot' | 'force-change'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [newPassword, setNewPassword] = useState(''); 
  const [confirmPassword, setConfirmPassword] = useState(''); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); 
  const [loading, setLoading] = useState(false);
  
  // ESTADO PARA ANIMACIÓN INICIAL
  const [isMounted, setIsMounted] = useState(false);

  const { login } = useContext(AuthContext);

  useEffect(() => {
    // Dispara la animación de entrada al cargar el componente
    setTimeout(() => setIsMounted(true), 100);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await streetposApi.post('/Auth/login', { email, password });
      
      // 1. Verificamos la bandera de seguridad
      if (response.data.requirePasswordChange === true) {
        setSuccessMsg('Por tu seguridad, debes establecer una contraseña definitiva.');
        setView('force-change');
        setLoading(false);
        return; 
      }

      // 2. Si no requiere cambio, entra normal
      const { token, rol, nombre } = response.data;
      if (token) {
        login(token, nombre, rol);
      } else {
        setError('El servidor no devolvió un token de acceso válido.');
      }
      
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      if (backendMessage) {
        setError(backendMessage);
      } else {
        setError('No se pudo conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForceChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await streetposApi.post('/Auth/change-initial-password', {
        email: email,
        claveTemporal: password,
        nuevaClave: newPassword
      });

      setSuccessMsg('¡Contraseña actualizada! Iniciando sesión...');
      
      // Iniciamos sesión automáticamente con la nueva clave
      const loginRes = await streetposApi.post('/Auth/login', { 
        email: email, 
        password: newPassword 
      });
      
      const { token, rol, nombre } = loginRes.data;
      login(token, nombre, rol);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar la contraseña.');
      setLoading(false); 
    } 
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await streetposApi.post('/Auth/forgot-password', { email });
      setSuccessMsg('Si el correo está registrado, te hemos enviado un enlace para restablecer tu contraseña.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const switchView = (newView: 'login' | 'forgot') => {
    setView(newView);
    setError('');
    setSuccessMsg('');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex bg-white font-sans relative">
      
      {/* Sombra divisoria (Degradado sutil entre el panel blanco y el azul) */}
      <div className="absolute left-1/2 xl:left-5/12 2xl:left-1/3 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-black/5 z-20 pointer-events-none hidden lg:block -translate-x-full"></div>

      {/* --- LADO IZQUIERDO: Formulario --- */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 2xl:w-1/3 lg:px-20 xl:px-24 relative z-30 bg-white">
        <div className={`mx-auto w-full max-w-sm lg:w-96 relative transition-all duration-1000 transform ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          
          {/* Logo y Encabezado */}
          <div className="transition-all duration-500">
            
            {/* Logo de la empresa como "App Badge" Premium */}
            <div className="mb-8 inline-block">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 flex items-center justify-center p-3 hover:scale-105 transition-transform duration-500 cursor-default">
                <img 
                  src="/LogoPerfil.jpeg" 
                  alt="Veltrix Solutions" 
                  className="w-full h-full object-contain" 
                />
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {view === 'login' ? 'Bienvenido de nuevo' : view === 'forgot' ? 'Recuperar acceso' : 'Seguridad de Cuenta'}
            </h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              {view === 'login' ? 'Ingresa a tu espacio de trabajo en StreetPOS' 
               : view === 'forgot' ? 'Ingresa tu correo y te enviaremos las instrucciones.'
               : 'Para continuar, debes establecer una contraseña privada.'}
            </p>
          </div>

          <div className="mt-8">
            {/* Mensajes de Error y Éxito */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start animate-fade-in">
                <svg className="w-5 h-5 text-rose-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm font-bold text-rose-700">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start animate-fade-in">
                <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm font-bold text-emerald-700">{successMsg}</span>
              </div>
            )}

            {/* VISTA 1: FORMULARIO DE LOGIN */}
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-6 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Correo Corporativo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                    </div>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all sm:text-sm font-medium hover:border-gray-300" placeholder="admin@streetpos.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all sm:text-sm font-medium hover:border-gray-300" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                      {showPassword ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm ml-auto">
                    <button type="button" onClick={() => switchView('forgot')} className="font-bold text-blue-600 hover:text-blue-500 transition-colors">¿Olvidaste tu clave?</button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className={`w-full py-3.5 rounded-xl font-bold text-white transition-all ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 active:scale-[0.98]'}`}>
                  {loading ? 'Verificando...' : 'Acceder'}
                </button>
              </form>
            )}

            {/* VISTA 2: FORMULARIO DE RECUPERAR CONTRASEÑA */}
            {view === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Correo Corporativo</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none" placeholder="admin@streetpos.com" />
                </div>
                <div className="flex flex-col gap-3">
                  <button type="submit" disabled={loading} className={`w-full py-3.5 rounded-xl font-bold text-white transition-all ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 active:scale-[0.98]'}`}>
                    {loading ? 'Enviando...' : 'Enviar Enlace'}
                  </button>
                  <button type="button" onClick={() => switchView('login')} className="w-full py-3.5 text-sm font-bold text-gray-600 hover:text-gray-900 flex justify-center items-center transition-colors">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Volver a iniciar sesión
                  </button>
                </div>
              </form>
            )}

            {/* VISTA 3: FORZAR CAMBIO DE CONTRASEÑA (NUEVO) */}
            {view === 'force-change' && (
              <form onSubmit={handleForceChangePassword} className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nueva Contraseña</label>
                  <input 
                    type="password" 
                    required 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" 
                    placeholder="Mínimo 6 caracteres" 
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Confirmar Contraseña</label>
                  <input 
                    type="password" 
                    required 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" 
                    placeholder="Repite tu nueva contraseña" 
                  />
                </div>
                <button type="submit" disabled={loading} className={`w-full py-3.5 rounded-xl font-bold text-white transition-all ${loading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 active:scale-[0.98]'}`}>
                  {loading ? 'Guardando...' : 'Guardar e Iniciar Sesión'}
                </button>
              </form>
            )}

            <div className={`mt-8 pt-6 border-t border-gray-100 transition-opacity duration-1000 delay-500 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
              <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                Veltrix Solutions &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- LADO DERECHO: Banner Branding --- */}
      <div className="hidden lg:block relative w-0 flex-1 bg-gray-900 z-10 overflow-hidden">
        {/* Capa base azul profundo */}
        <div className="absolute inset-0 h-full w-full bg-[#1e40af] flex items-center justify-center">
          
          {/* Patrón de puntos animado */}
          <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle,#ffffff_1.5px,transparent_1.5px)] bg-[length:24px_24px] animate-[pulse_8s_ease-in-out_infinite]"></div>
          
          {/* Brillo espectacular detrás del icono */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/30 rounded-full blur-[100px] pointer-events-none"></div>

          <div className={`relative z-20 p-12 text-center max-w-2xl transition-all duration-1000 transform delay-300 ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
             
             {/* Ícono central flotante */}
             <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 rounded-[2rem] backdrop-blur-xl border border-white/20 shadow-2xl mb-10 hover:rotate-6 transition-transform duration-500 cursor-default">
               <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
             </div>

             <h2 className="text-[2.75rem] font-black text-white tracking-tight mb-6 leading-tight drop-shadow-sm">
               Gestión empresarial<br/>a otro nivel.
             </h2>
             <p className="text-xl text-blue-100/90 font-medium leading-relaxed max-w-lg mx-auto">
               Administra inventario, ventas y sucursales en tiempo real con una interfaz diseñada para la velocidad.
             </p>
          </div>
        </div>
      </div>

    </div>
  );
};