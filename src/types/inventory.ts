export interface Inventory {
  id: string;
  branchId: string;
  productId: string;
  productName: string;
  productSKU: string;
  productCode: string;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  ultimaActualizacion: string;
}

export interface UpsertInventoryDto {
  productId: string;
  stockActual: number;
  stockMinimo: number;
}