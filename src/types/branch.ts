export interface Branch {
  id: string;
  nombre: string;
  direccion?: string;
  telefonoContacto?: string;
  estaActiva: boolean;
  fechaCreacion: string;
}

export interface CreateBranchDto {
  nombre: string;
  direccion?: string;
  telefonoContacto?: string;
}

export interface UpdateBranchDto {
  nombre: string;
  direccion?: string;
  telefonoContacto?: string;
  estaActiva: boolean;
}