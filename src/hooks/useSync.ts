import { useEffect, useCallback, useState } from 'react';
import { db } from '../db/db';
import streetposApi from '../api/axiosConfig';

// 🚨 EL HOOK AHORA RECIBE EL userId DEL USUARIO LOGUEADO 🚨
export const useSync = (currentUserId: string | null | undefined) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const syncCatalog = useCallback(async () => {
    // Si no hay red o no sabemos quién está logueado, no hacemos nada
    if (!navigator.onLine || !currentUserId) return;
    
    try {
      const response = await streetposApi.get('/Products');
      
      // 1. Etiquetamos cada producto con el ID del usuario actual
      const productsWithUser = response.data.map((p: any) => ({
        ...p,
        userId: currentUserId
      }));

      // 2. Borramos SOLO el catálogo viejo de ESTE usuario 
      // (así mantenemos limpia su porción de la base de datos local)
      await db.products.where('userId').equals(currentUserId).delete();
      
      // 3. Guardamos el nuevo catálogo aislado
      await db.products.bulkPut(productsWithUser);
      
    } catch (error) {
      console.error('Error al descargar el catálogo:', error);
    }
  }, [currentUserId]);

  const syncSales = useCallback(async () => {
    if (!navigator.onLine || !currentUserId) return;

    try {
      // 🚨 SOLO BUSCAMOS VENTAS PENDIENTES DE ESTE USUARIO 🚨
      const pendingSales = await db.offlineSales
        .where('sincronizado').equals(0)
        .filter(sale => sale.userId === currentUserId)
        .toArray();
      
      if (pendingSales.length === 0) return;

      setPendingCount(pendingSales.length);
      setIsSyncing(true);
      setSyncSuccess(false);

      for (const sale of pendingSales) {
        try {
          const payload = {
            userId: sale.userId,
            metodoPago: sale.metodoPago,
            notas: sale.notas,
            items: sale.items
          };

          await streetposApi.post('/Sales', payload);
          await db.offlineSales.delete(sale.localId);
          
          setPendingCount(prev => prev - 1);
        } catch (err) {
          console.error(`Fallo al sincronizar la venta ${sale.localId}.`);
        }
      }

      setIsSyncing(false);
      setSyncSuccess(true);
      
      setTimeout(() => {
        setSyncSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error crítico al leer la cola de ventas:', error);
      setIsSyncing(false);
    }
  }, [currentUserId]);

  const syncAll = useCallback(() => {
    syncCatalog();
    syncSales();
  }, [syncCatalog, syncSales]);

  useEffect(() => {
    // Solo activamos los listeners si hay un usuario logueado
    if (currentUserId) {
      syncAll();
      window.addEventListener('online', syncAll);
    }
    return () => {
      window.removeEventListener('online', syncAll);
    };
  }, [syncAll, currentUserId]);

  return { isSyncing, syncSuccess, pendingCount };
};