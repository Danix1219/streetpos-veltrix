import { createContext, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. Definimos qué datos guardaremos de la sesión
interface AuthContextType {
  token: string | null;
  nombre: string | null;
  rol: string | null;
  login: (token: string, nombre: string, rol: string) => void;
  logout: () => void;
}

// 2. Creamos el contexto
export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// 3. Creamos el Proveedor (El componente que envolverá tu App)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
const [nombre, setNombre] = useState<string | null>(() => localStorage.getItem('nombre'));
const [rol, setRol] = useState<string | null>(() => localStorage.getItem('rol'));
  const navigate = useNavigate();

  const login = (newToken: string, newNombre: string, newRol: string) => {
    // Guardamos en LocalStorage para que no se pierda al recargar la página
    localStorage.setItem('token', newToken);
    localStorage.setItem('nombre', newNombre);
    localStorage.setItem('rol', newRol);
    
    // Guardamos en el estado de React
    setToken(newToken);
    setNombre(newNombre);
    setRol(newRol);
    
    navigate('/'); // Lo mandamos a la pantalla principal
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setNombre(null);
    setRol(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ token, nombre, rol, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};