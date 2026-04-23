import { useState, useContext, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha'; // <-- Librería importada
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
  
  // ESTADO PARA RECAPTCHA
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

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

    // Validación del Captcha en el frontend
    if (!captchaToken) {
      setError('Por favor, verifica que no eres un robot.');
      return;
    }

    setLoading(true);

    try {
      // Nota: Puedes enviar captchaToken al backend si tu API lo requiere para validarlo
      const response = await streetposApi.post('/Auth/login', { email, password, recaptchaToken: captchaToken });
      
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
    // Reseteamos el token si cambian de vista
    setCaptchaToken(null);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans relative">
      
      {/* Sombra divisoria */}
      <div className="absolute left-1/2 xl:left-5/12 2xl:left-1/3 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-black/5 z-20 pointer-events-none hidden lg:block -translate-x-full"></div>

      {/* --- LADO IZQUIERDO: Formulario --- */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 2xl:w-1/3 lg:px-20 xl:px-24 relative z-30 bg-white shadow-[10px_0_30px_rgba(0,0,0,0.05)]">
        <div className={`mx-auto w-full max-w-sm lg:w-96 relative transition-all duration-1000 transform ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          
          <div className="transition-all duration-500">
            {/* App Badge Logo */}
            <div className="mb-8 inline-block">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 flex items-center justify-center p-3 hover:scale-105 transition-transform duration-500 cursor-default">
                <img 
                  src="/LogoPerfil.jpeg" 
                  alt="Veltrix Solutions" 
                  className="w-full h-full object-contain" 
                />
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-4">
              {view === 'login' ? 'Bienvenido de nuevo' : view === 'forgot' ? 'Recuperar acceso' : 'Seguridad de Cuenta'}
            </h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              {view === 'login' ? 'Ingresa a tu espacio de trabajo en StreetPOS' 
               : view === 'forgot' ? 'Ingresa tu correo y te enviaremos las instrucciones.'
               : 'Para continuar, debes establecer una contraseña privada.'}
            </p>
          </div>

          <div className="mt-8">
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
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700">Correo Corporativo</label>
                    <span className={`text-[10px] font-bold transition-colors ${email.length >= 100 ? 'text-rose-500' : 'text-gray-400'}`}>
                      {email.length}/100
                    </span>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                    </div>
                    <input type="email" required maxLength={100} value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all sm:text-sm font-medium hover:border-gray-300" placeholder="admin@streetpos.com" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700">Contraseña</label>
                    <span className={`text-[10px] font-bold transition-colors ${password.length >= 64 ? 'text-rose-500' : 'text-gray-400'}`}>
                      {password.length}/64
                    </span>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <input type={showPassword ? "text" : "password"} required maxLength={64} value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all sm:text-sm font-medium hover:border-gray-300" placeholder="••••••••" />
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

                {/* --- INTEGRACIÓN DE RECAPTCHA --- */}
                <div className="flex justify-center w-full pt-2 pb-1">
                  <div className="transform scale-95 sm:scale-100 origin-center transition-transform">
                    <ReCAPTCHA
                      sitekey="6Ldy4MUsAAAAAMcFL3FQNdKWBbhMvrk-y69O5lj4"
                      onChange={(token) => setCaptchaToken(token)}
                      onExpired={() => setCaptchaToken(null)}
                    />
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
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700">Correo Corporativo</label>
                    <span className={`text-[10px] font-bold transition-colors ${email.length >= 100 ? 'text-rose-500' : 'text-gray-400'}`}>
                      {email.length}/100
                    </span>
                  </div>
                  <input type="email" required maxLength={100} value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none" placeholder="admin@streetpos.com" />
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

            {/* VISTA 3: FORZAR CAMBIO DE CONTRASEÑA */}
            {view === 'force-change' && (
              <form onSubmit={handleForceChangePassword} className="space-y-6 animate-fade-in">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700">Nueva Contraseña</label>
                    <span className={`text-[10px] font-bold transition-colors ${newPassword.length >= 64 ? 'text-rose-500' : 'text-gray-400'}`}>
                      {newPassword.length}/64
                    </span>
                  </div>
                  <input 
                    type="password" 
                    required 
                    maxLength={64}
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all sm:text-sm font-medium hover:border-gray-300" 
                    placeholder="Mínimo 6 caracteres" 
                    minLength={6}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700">Confirmar Contraseña</label>
                    <span className={`text-[10px] font-bold transition-colors ${confirmPassword.length >= 64 ? 'text-rose-500' : 'text-gray-400'}`}>
                      {confirmPassword.length}/64
                    </span>
                  </div>
                  <input 
                    type="password" 
                    required 
                    maxLength={64}
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all sm:text-sm font-medium hover:border-gray-300" 
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

      {/* --- LADO DERECHO: Banner Branding con Rusty --- */}
      <div className="hidden lg:block relative w-0 flex-1 z-10 overflow-hidden bg-blue-900">
        
        {/* Efectos de fondo Aurora */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-[blob_7s_infinite]"></div>
          <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-[blob_7s_infinite_2s]"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-blue-800 rounded-full mix-blend-multiply filter blur-[120px] opacity-80 animate-[blob_7s_infinite_4s]"></div>
        </div>

        {/* Contenedor Principal (Flex Row para alinear Texto Izquierda y Mascota Derecha) */}
        <div className="absolute inset-0 flex items-center justify-center p-16">
          <div className="w-full max-w-6xl flex flex-row items-center justify-between gap-16">
              
             {/* Textos - Alineados a la izquierda */}
             <div className={`flex-1 text-left transition-all duration-1000 transform delay-300 ${isMounted ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
                 <h1 className="text-[4rem] xl:text-[6rem] font-black text-white tracking-tighter mb-8 leading-none drop-shadow-xl">
                     StreetPOS.
                 </h1>
                 <p className="text-2xl text-blue-100 font-medium leading-relaxed max-w-xl">
                     Acelera tus ventas, controla tu inventario y domina el crecimiento de tu negocio en tiempo real.
                 </p>
                 
                 {/* Insignias de confianza corporativas (Opcional, pero da mucho valor) */}
                 <div className="mt-12 flex gap-6 items-center">
                    <div className="flex flex-col gap-1 border-l-2 border-blue-400/30 pl-4">
                        <span className="text-3xl font-black text-white">99.9%</span>
                        <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Uptime Garantizado</span>
                    </div>
                    <div className="flex flex-col gap-1 border-l-2 border-blue-400/30 pl-4">
                        <span className="text-3xl font-black text-white">24/7</span>
                        <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Sincronización</span>
                    </div>
                 </div>
             </div>

            {/* Contenedor de la Mascota - A la derecha */}
            <div className="flex-1 flex justify-end items-center relative animate-fade-in-up delay-1000">
                <div className="relative group animate-float flex flex-col items-center">
                     
                     {/* Etiqueta de Estado Moderno (Reemplaza el globo de cómic) */}
                    <div className="absolute -top-10 -left-12 xl:-left-20 group-hover:scale-105 transition-transform duration-500 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-4 z-20">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm leading-tight">Sistema Operativo</p>
                            <p className="text-blue-200 text-xs font-medium">Listo para procesar cobros</p>
                        </div>
                    </div>
                     
                     {/* Imagen de Rusty (PNG transparente) */}
                    <img 
                        src="/Rusty.png" 
                        alt="Rusty, the StreetPOS mascot" 
                        className="w-[320px] xl:w-[400px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500 delay-100" 
                    />
                </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

    </div>
  );
};