import { useEffect, useCallback, useState } from 'react';
import { db } from '../db/db';
import streetposApi from '../api/axiosConfig';

// 🚨 AHORA RECIBE EL ID Y EL TOKEN 🚨
export const useSync = (currentUserId: string | null | undefined, token: string | null | undefined) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const syncCatalog = useCallback(async () => {
    if (!navigator.onLine || !currentUserId || !token) return;
    
    try {
      const response = await streetposApi.get('/Products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const productsWithUser = response.data.map((p: any) => ({
        ...p,
        userId: currentUserId
      }));

      await db.products.where('userId').equals(currentUserId).delete();
      await db.products.bulkPut(productsWithUser);
      
    } catch (error) {
      console.error('Error al descargar el catálogo:', error);
    }
  }, [currentUserId, token]);

  const syncSales = useCallback(async () => {
    if (!navigator.onLine || !currentUserId || !token) return;

    try {
      const pendingSales = await db.offlineSales
        .where('sincronizado').equals(0)
        .filter(sale => sale.userId === currentUserId)
        .toArray();
      
      if (pendingSales.length === 0) return;

      setPendingCount(pendingSales.length);
      setIsSyncing(true);
      setSyncSuccess(false);

      let ventasExitosas = 0;

      for (const sale of pendingSales) {
        try {
          const payload = {
            userId: sale.userId,
            metodoPago: sale.metodoPago,
            notas: sale.notas,
            items: sale.items
          };

          // Inyectamos el token al enviar la venta
          await streetposApi.post('/Sales', payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          await db.offlineSales.delete(sale.localId);
          ventasExitosas++;
          setPendingCount(prev => prev - 1);
          
        } catch (err: any) {
          console.error(`❌ Venta retenida (${sale.localId}). Código:`, err.response?.status);
        }
      }

      setIsSyncing(false);
      
      // Solo festeja si realmente subió ventas
      if (ventasExitosas > 0) {
        setSyncSuccess(true);
        setTimeout(() => {
          setSyncSuccess(false);
        }, 3000);
      }

    } catch (error) {
      console.error('Error crítico al leer la cola de ventas:', error);
      setIsSyncing(false);
    }
  }, [currentUserId, token]);

  const syncAll = useCallback(() => {
    syncCatalog();
    syncSales();
  }, [syncCatalog, syncSales]);

  useEffect(() => {
    if (currentUserId && token) {
      syncAll();
      window.addEventListener('online', syncAll);
    }
    return () => {
      window.removeEventListener('online', syncAll);
    };
  }, [syncAll, currentUserId, token]);

  return { isSyncing, syncSuccess, pendingCount };
};