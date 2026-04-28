import { createContext, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. Agregamos el "id" a la interfaz
interface AuthContextType {
  id: string | null;      // 🚨 NUEVO: Fundamental para IndexedDB y ventas
  token: string | null;
  nombre: string | null;
  rol: string | null;
  login: (id: string, token: string, nombre: string, rol: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 2. Agregamos el estado para el ID
  const [id, setId] = useState<string | null>(() => localStorage.getItem('userId'));
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [nombre, setNombre] = useState<string | null>(() => localStorage.getItem('nombre'));
  const [rol, setRol] = useState<string | null>(() => localStorage.getItem('rol'));
  
  const navigate = useNavigate();

  // 3. Actualizamos la función login para recibir el ID
  const login = (newId: string, newToken: string, newNombre: string, newRol: string) => {
    localStorage.setItem('userId', newId);
    localStorage.setItem('token', newToken);
    localStorage.setItem('nombre', newNombre);
    localStorage.setItem('rol', newRol);
    
    setId(newId);
    setToken(newToken);
    setNombre(newNombre);
    setRol(newRol);
    
    navigate('/'); 
  };

  const logout = () => {
    localStorage.clear(); // Esto borra todo de golpe (es más seguro)
    setId(null);
    setToken(null);
    setNombre(null);
    setRol(null);
    
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ id, token, nombre, rol, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};