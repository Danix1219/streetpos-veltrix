import Dexie, { type Table } from 'dexie';

// 1. Estructura EXACTA de los productos según tu POST /api/Products
export interface LocalProduct {
  id: string; // El ID real de la base de datos (se usa para identificar el producto localmente)
  nombre: string;
  precioCompra: number;
  precioVenta: number;
  categoriaId: string;
  stockActual: number;
  stockMinimo: number;
}

// 2. Estructura EXACTA de los items de la venta según tu POST /api/Sales
export interface SaleItem {
  productId: string;
  cantidad: number;
}

// 3. Estructura de la venta combinando control local + Payload exacto de tu API
export interface OfflineSale {
  // --- Campos de control local (solo para IndexedDB) ---
  localId: string;       // Un ID temporal (ej. UUID) generado en frontend
  sincronizado: number;  // 0 (Falso) o 1 (Verdadero). IndexedDB filtra mejor los números.
  fechaLocal: Date;      // Para mostrar al cajero a qué hora hizo la venta offline

  // --- Campos EXACTOS que pide tu API (POST /api/Sales) ---
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
    
    // Declaramos las tablas y las columnas por las que vamos a hacer "búsquedas" rápidas
    this.version(1).stores({
      products: 'id', // Buscamos productos principalmente por su ID
      offlineSales: 'localId, sincronizado' // Buscamos ventas por su ID temporal o por estado de sincronización
    });
  }
}

export const db = new StreetPOSDatabase();