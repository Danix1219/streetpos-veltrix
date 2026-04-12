import axios from 'axios';

// 1. Creamos la instancia base de Axios
const streetposApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Toma la URL de tu archivo .env
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Interceptor de Peticiones (Request)
// Esto se ejecuta AUTOMÁTICAMENTE antes de que cualquier petición salga hacia el backend
streetposApi.interceptors.request.use(
  (config) => {
    // Buscamos el token en el almacenamiento local del navegador
    const token = localStorage.getItem('token');

    // Si existe, se lo pegamos a la petición como un Gafete (Bearer)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. (Opcional) Interceptor de Respuestas (Response)
// Útil para cerrar la sesión automáticamente si el token ya expiró
streetposApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Tu sesión ha expirado o no tienes permisos.");
      // Aquí más adelante podríamos forzar un redireccionamiento al Login
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default streetposApi;