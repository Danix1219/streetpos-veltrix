import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import streetposApi from '../api/axiosConfig';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 🚨 ESTADOS PARA MOSTRAR/OCULTAR CONTRASEÑA 🚨
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Estados para validar el token y reenviar el enlace
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Estado para la animación inicial
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsMounted(true), 100);

    // 🚨 VALIDACIÓN ANTICIPADA DEL TOKEN 🚨
    const validateToken = async () => {
      if (!token || !email) {
        setError('El enlace de recuperación es inválido o está incompleto.');
        setIsValidatingToken(false);
        return;
      }

      try {
        await streetposApi.get('/Auth/validate-reset-token', {
          params: { token, email }
        });
        setIsValidatingToken(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.');
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token, email]);

  // 🚨 FUNCIÓN PARA REENVIAR EL ENLACE DESDE LA PANTALLA DE ERROR 🚨
  const handleResendLink = async () => {
    setIsResending(true);
    setResendSuccess(false);
    try {
      await streetposApi.post('/Auth/forgot-password', { email });
      setResendSuccess(true);
    } catch (err) {
      // Manejo silencioso por seguridad
      setResendSuccess(true); 
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await streetposApi.post('/Auth/reset-password', {
        email: email,
        token: token,
        newPassword: newPassword
      });
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña. El token podría haber expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans relative">
      
      {/* Sombra divisoria */}
      <div className="absolute left-1/2 xl:left-5/12 2xl:left-1/3 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-black/5 z-20 pointer-events-none hidden lg:block -translate-x-full"></div>

      {/* --- LADO IZQUIERDO: Formulario --- */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 2xl:w-1/3 lg:px-20 xl:px-24 relative z-30 bg-white shadow-[10px_0_30px_rgba(0,0,0,0.05)]">
        <div className={`mx-auto w-full max-w-sm lg:w-96 transition-all duration-1000 transform ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Crear nueva clave</h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">Ingresa tu nueva contraseña para la cuenta <span className="font-bold text-gray-700">{email}</span></p>
          </div>

          {isValidatingToken ? (
             <div className="p-8 flex flex-col items-center justify-center animate-fade-in">
              <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-500 font-medium">Validando enlace seguro...</p>
             </div>
          ) : error ? (
            // 🚨 PANTALLA ROJA CON BOTÓN DE REENVIAR 🚨
            <div className="p-8 bg-rose-50 rounded-2xl border border-rose-100 text-center animate-scale-up">
              <div className="w-16 h-16 bg-rose-500 text-white shadow-lg shadow-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <h3 className="text-xl font-black text-rose-900 mb-2 tracking-tight">Enlace no válido</h3>
              <p className="text-sm text-rose-700 mb-6 font-medium">{error}</p>
              
              {resendSuccess ? (
                <div className="mb-6 p-3 bg-emerald-100/50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold animate-fade-in">
                  ✅ Se ha enviado un nuevo enlace a tu correo.
                </div>
              ) : (
                <button 
                  onClick={handleResendLink}
                  disabled={isResending || !email}
                  className={`w-full mb-3 py-3.5 font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 ${isResending || !email ? 'bg-rose-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'}`}
                >
                  {isResending ? 'Enviando...' : 'Reenviar enlace a mi correo'}
                </button>
              )}

              <Link to="/login" className="w-full inline-block py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : success ? (
            <div className="p-8 bg-emerald-50 rounded-2xl border border-emerald-100 text-center animate-scale-up">
              <div className="w-16 h-16 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-5 animate-bounce-short">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-black text-emerald-900 mb-2 tracking-tight">¡Contraseña actualizada!</h3>
              <p className="text-sm text-emerald-700 mb-8 font-medium">Tu cuenta está segura. Ya puedes iniciar sesión con tus nuevas credenciales.</p>
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-700">Nueva Contraseña</label>
                  <span className={`text-[10px] font-bold transition-colors ${newPassword.length >= 64 ? 'text-rose-500' : 'text-gray-400'}`}>
                    {newPassword.length}/64
                  </span>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  {/* 🚨 INPUT CON OJO INTEGRADO 🚨 */}
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    required 
                    maxLength={64}
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all sm:text-sm font-medium hover:border-gray-300"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                      {showNewPassword ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-700">Confirmar Contraseña</label>
                  <span className={`text-[10px] font-bold transition-colors ${confirmPassword.length >= 64 ? 'text-rose-500' : 'text-gray-400'}`}>
                    {confirmPassword.length}/64
                  </span>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  {/* 🚨 INPUT CON OJO INTEGRADO 🚨 */}
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    required 
                    maxLength={64}
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all sm:text-sm font-medium hover:border-gray-300"
                    placeholder="Repite la contraseña"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                      {showConfirmPassword ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                  </button>
                </div>
              </div>

              <div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg active:scale-[0.98]
                    ${loading ? 'bg-blue-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'}`}
                >
                  {loading ? 'Procesando...' : 'Guardar Nueva Contraseña'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* --- LADO DERECHO: Banner Branding Refinado --- */}
      <div className="hidden lg:block relative w-0 flex-1 z-10 overflow-hidden bg-blue-900">
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-[blob_7s_infinite]"></div>
          <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-[blob_7s_infinite_2s]"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-blue-800 rounded-full mix-blend-multiply filter blur-[120px] opacity-80 animate-[blob_7s_infinite_4s]"></div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-12 xl:p-16">
          <div className="w-full max-w-5xl flex flex-row items-center justify-between gap-10 xl:gap-16">
             <div className={`flex-1 text-left z-10 transition-all duration-1000 transform delay-300 ${isMounted ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
                 <h1 className="text-[4rem] xl:text-[5.5rem] font-black text-white tracking-tighter mb-6 leading-[1.05] drop-shadow-xl">
                     Seguridad<br/>Total.
                 </h1>
                 <p className="text-lg xl:text-xl text-blue-100/90 font-medium leading-relaxed max-w-md">
                     Recupera el acceso a tu cuenta rápidamente mediante nuestro sistema de encriptación segura.
                 </p>
             </div>

            <div className="flex-1 flex justify-center lg:justify-end items-center relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="relative group animate-float flex flex-col items-center">
                    <div className="absolute top-0 -left-12 xl:top-4 xl:-left-32 2xl:-left-40 group-hover:-translate-y-2 transition-transform duration-500 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl px-5 py-3 xl:px-6 xl:py-4 flex items-center gap-3 xl:gap-4 z-20">
                        <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
                            <div className="w-2 h-2 xl:w-2.5 xl:h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm leading-tight">Acceso Protegido</p>
                            <p className="text-blue-200 text-[10px] xl:text-xs font-medium">Cifrado de extremo a extremo</p>
                        </div>
                    </div>
                    <img 
                        src="/Rusty_verify.png" 
                        alt="Rusty, the StreetPOS mascot" 
                        className="w-[300px] xl:w-[380px] 2xl:w-[420px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500 delay-100" 
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
        .animate-scale-up {
          animation: scale-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes scale-up {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};