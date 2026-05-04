import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import streetposApi from '../api/axiosConfig';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // ESTADO PARA ANIMACIÓN INICIAL (Igual que en el Login)
  const [isMounted, setIsMounted] = useState(false);
  const hasAttempted = useRef(false);

  useEffect(() => {
    // Activa la animación de entrada suave al montar el componente
    setTimeout(() => setIsMounted(true), 100);

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    // 🚨 ARREGLO: Limpieza silenciosa en vez de llamar a logout() 
    // Así evitamos que el Router nos mande al Login de golpe.
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    sessionStorage.clear();

    const verifyAccount = async () => {
      if (!token || !email) {
        setError('El enlace de verificación es inválido o está incompleto.');
        setLoading(false);
        return;
      }

      try {
        await streetposApi.get('/Auth/verify-email', {
          params: { token, email }
        });
        
        // 🎨 TRUCO UX: Forzamos que la animación de carga se vea 2.5 segundos
        setTimeout(() => {
          setSuccess(true);
          setLoading(false);
        }, 2500);

      } catch (err: any) {
        setTimeout(() => {
          setError(err.response?.data?.message || 'No se pudo verificar la cuenta. El enlace podría haber expirado.');
          setLoading(false);
        }, 2000);
      }
    };

    verifyAccount();
  }, [token, email]);

  return (
    <div className="min-h-screen flex bg-white font-sans relative">
      
      {/* Sombra divisoria (Aplicada desde el Login) */}
      <div className="absolute left-1/2 xl:left-5/12 2xl:left-1/3 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-black/5 z-20 pointer-events-none hidden lg:block -translate-x-full"></div>

      {/* --- LADO IZQUIERDO (Lógica intacta, contenedor adaptado) --- */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 2xl:w-1/3 lg:px-20 xl:px-24 relative z-30 bg-white shadow-[10px_0_30px_rgba(0,0,0,0.05)]">
        <div className={`mx-auto w-full max-w-sm lg:w-96 text-center transition-all duration-1000 transform ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Verificación de Cuenta</h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">Validando tu acceso a StreetPOS</p>
          </div>

          {loading ? (
            // ==========================================
            // LA FAMOSA ANIMACIÓN DE CARGA
            // ==========================================
            <div className="p-8 flex flex-col items-center justify-center animate-fade-in">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <svg className="animate-spin h-14 w-14 text-blue-600 relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-gray-800 font-extrabold text-lg tracking-tight">Procesando validación...</p>
              <p className="text-sm text-gray-400 mt-1.5 font-medium">Autenticando credenciales para <span className="text-blue-600">{email}</span></p>
            </div>
          ) : success ? (
            // PANTALLA DE ÉXITO VERDE
            <div className="p-8 bg-emerald-50 rounded-2xl border border-emerald-100 text-center animate-scale-up">
              <div className="w-16 h-16 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-5 animate-bounce-short">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-black text-emerald-900 mb-2 tracking-tight">¡Cuenta Verificada!</h3>
              <p className="text-sm text-emerald-700 mb-8 font-medium">Tu correo ha sido confirmado con éxito. Ya puedes acceder a todas las funciones del sistema.</p>
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          ) : (
            // PANTALLA DE ERROR ROJA
            <div className="p-8 bg-rose-50 rounded-2xl border border-rose-100 text-center animate-scale-up">
              <div className="w-16 h-16 bg-rose-500 text-white shadow-lg shadow-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <h3 className="text-xl font-black text-rose-900 mb-2 tracking-tight">Verificación fallida</h3>
              <p className="text-sm text-rose-700 mb-8 font-medium">{error}</p>
              <Link to="/login" className="w-full inline-block py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                Volver al inicio
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* --- LADO DERECHO: Banner Branding (Ajustado idéntico al Login) --- */}
      <div className="hidden lg:block relative w-0 flex-1 z-10 overflow-hidden bg-blue-900">
        
        {/* Efectos de fondo Aurora */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-[blob_7s_infinite]"></div>
          <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-[blob_7s_infinite_2s]"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-blue-800 rounded-full mix-blend-multiply filter blur-[120px] opacity-80 animate-[blob_7s_infinite_4s]"></div>
        </div>

        {/* Contenedor Principal Ajustado*/}
        <div className="absolute inset-0 flex items-center justify-center p-12 xl:p-16">
          <div className="w-full max-w-5xl flex flex-row items-center justify-between gap-10 xl:gap-16">
              
             {/* Textos - Con la misma tipografía, tamaño y animación*/}
             <div className={`flex-1 text-left z-10 transition-all duration-1000 transform delay-300 ${isMounted ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
                 <h1 className="text-[4rem] xl:text-[5.5rem] font-black text-white tracking-tighter mb-6 leading-[1.05] drop-shadow-xl">
                     Entorno<br/>Seguro.
                 </h1>
                 <p className="text-lg xl:text-xl text-blue-100/90 font-medium leading-relaxed max-w-md">
                     Verificamos cada acceso para mantener la integridad y privacidad de la información de tu empresa.
                 </p>
             </div>

            {/* Contenedor de la Mascota (Rusty) - Exactamente el mismo del Login */}
<div className="flex-1 flex justify-center lg:justify-end items-center relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="relative group animate-float flex flex-col items-center">
                     
                     {/* Etiqueta de Estado - Posición ajustada para no tapar a Rusty */}
                   <div className="absolute top-0 -left-12 xl:top-4 xl:-left-32 2xl:-left-40 group-hover:-translate-y-2 transition-transform duration-500 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl px-5 py-3 xl:px-6 xl:py-4 flex items-center gap-3 xl:gap-4 z-20">
                        <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
                            <div className="w-2 h-2 xl:w-2.5 xl:h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm leading-tight">Acceso Protegido</p>
                            <p className="text-blue-200 text-[10px] xl:text-xs font-medium">Cifrado de extremo a extremo</p>
                        </div>
                    </div>
                     
                     {/* Imagen de Rusty */}
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

      {/* ESTILOS DE ANIMACIÓN */}
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