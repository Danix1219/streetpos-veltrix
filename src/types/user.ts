export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  isEmailVerified: boolean;
  
  // 🚨 NUEVOS CAMPOS: Para saber a qué sucursal pertenece 🚨
  branchId?: string | null;
  branchName?: string;
}

export interface CreateUserDto {
  nombre: string;
  email: string;
  password?: string; 
  rol: string;
  
  // 🚨 NUEVO CAMPO: Para asignarle la sucursal al crearlo 🚨
  branchId?: string | null;
}

export interface UpdateUserDto {
  nombre: string;
  email: string;
  rol: string;
  
  // 🚨 NUEVO CAMPO: Para cambiarlo de sucursal si es necesario 🚨
  branchId?: string | null;
}