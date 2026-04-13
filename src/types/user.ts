export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  isEmailVerified: boolean;
}

export interface CreateUserDto {
  nombre: string;
  email: string;
  password?: string; // Es opcional en el frontend porque la API genera una temporal si no la mandamos
  rol: string;
}