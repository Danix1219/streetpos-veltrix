import type { Product } from './product';

export interface CartItem {
  product: Product;
  cantidad: number;
}

export interface SalePayload {
  userId: string;
  metodoPago: string;
  notas: string;
  items: {
    productId: string;
    cantidad: number;
  }[];
}