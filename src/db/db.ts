import Dexie, { type Table } from 'dexie';

export interface LocalProduct {
  id: string; 
  nombre: string;
  precioCompra: number;
  precioVenta: number;
  categoriaId: string;
  stockActual: number;
  stockMinimo: number;
  userId: string; // 🚨 NUEVO: Etiqueta estricta de propiedad del usuario 🚨
}

export interface SaleItem {
  productId: string;
  cantidad: number;
}

export interface OfflineSale {
  localId: string;       
  sincronizado: number;  
  fechaLocal: Date;      
  userId: string;        
  metodoPago: string;
  notas: string;
  items: SaleItem[];
}

export class StreetPOSDatabase extends Dexie {
  products!: Table<LocalProduct, string>;
  offlineSales!: Table<OfflineSale, string>;

  constructor() {
    super('StreetPOSLocalDB');
    
    // 🚨 INCREMENTAMOS LA VERSIÓN A 2 Y AGREGAMOS userId A LOS ÍNDICES 🚨
    this.version(2).stores({
      products: 'id, userId', // Permite buscar todos los productos de un usuario específico
      offlineSales: 'localId, sincronizado, userId' 
    });
  }
}

export const db = new StreetPOSDatabase();