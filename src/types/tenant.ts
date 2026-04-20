export interface Tenant {
  id: string;
  nombre: string;           // Nombre de la empresa
  nombreTitular?: string;   // Nombre del dueño (Nuevo)
  emailContacto: string;
  estaActivo: boolean;
  fechaCreacion: string;
}