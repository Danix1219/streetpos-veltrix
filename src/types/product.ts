export interface Product {
  id: string;
  nombre: string;
  precioCompra: number;
  precioVenta: number;
  categoriaId: string;
  stockActual: number;
  stockMinimo: number;
}