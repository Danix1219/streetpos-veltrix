import { useEffect, useState, useContext, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import streetposApi from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext'; 

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { logout } = useContext(AuthContext); 
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    // LIMPIEZA INICIAL: Cerramos cualquier sesión "basura" que haya quedado
    logout();

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
        setSuccess(true);
      } catch (err: any) {
        setError(err.response?.data?.message || 'No se pudo verificar la cuenta. El enlace podría haber expirado.');
      } finally {
        setLoading(false);
      }
    };

    verifyAccount();
  }, [token, email, logout]);

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* --- LADO IZQUIERDO --- */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 2xl:w-1/3 lg:px-20 xl:px-24 relative overflow-hidden">
        <div className="mx-auto w-full max-w-sm lg:w-96 text-center">
          
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Verificación de Cuenta</h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">Validando tu acceso a StreetPOS</p>
          </div>

          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center animate-fade-in">
              <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 font-bold text-lg">Procesando validación...</p>
              <p className="text-sm text-gray-400 mt-1">Por favor no cierres esta ventana.</p>
            </div>
          ) : success ? (
            <div className="p-8 bg-emerald-50 rounded-xl border border-emerald-100 text-center animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-lg font-bold text-emerald-800 mb-2">¡Cuenta Verificada!</h3>
              <p className="text-sm text-emerald-600 mb-6">Tu correo <strong>{email}</strong> ha sido confirmado con éxito. Ya puedes acceder a todas las funciones del sistema.</p>
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          ) : (
            <div className="p-8 bg-rose-50 rounded-xl border border-rose-100 text-center animate-fade-in">
              <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <h3 className="text-lg font-bold text-rose-800 mb-2">Verificación fallida</h3>
              <p className="text-sm text-rose-600 mb-6">{error}</p>
              <Link to="/login" className="w-full inline-block py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                Volver al inicio
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* --- LADO DERECHO --- */}
      <div className="hidden lg:block relative w-0 flex-1 bg-gray-900">
        <div className="absolute inset-0 h-full w-full bg-blue-600 flex items-center justify-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
          <div className="relative z-10 p-12 text-center max-w-2xl">
             <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl mb-8">
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
               </svg>
             </div>
             <h2 className="text-4xl font-black text-white tracking-tight mb-4">Un entorno de trabajo confiable.</h2>
             <p className="text-lg text-blue-100 font-medium">Verificamos cada acceso para mantener la integridad y privacidad de la información de tu empresa.</p>
          </div>
        </div>
      </div>

    </div>
  );
};