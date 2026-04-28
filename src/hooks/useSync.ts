import { useEffect, useCallback, useState } from 'react';
import { db } from '../db/db';
import streetposApi from '../api/axiosConfig';

export const useSync = (currentUserId: string | null | undefined) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const syncCatalog = useCallback(async () => {
    if (!navigator.onLine || !currentUserId) return;
    
    try {
      const response = await streetposApi.get('/Products');
      const productsWithUser = response.data.map((p: any) => ({
        ...p,
        userId: currentUserId
      }));

      await db.products.where('userId').equals(currentUserId).delete();
      await db.products.bulkPut(productsWithUser);
      
    } catch (error) {
      console.error('Error al descargar el catálogo:', error);
    }
  }, [currentUserId]);

  const syncSales = useCallback(async () => {
    if (!navigator.onLine || !currentUserId) return;

    try {
      const pendingSales = await db.offlineSales
        .where('sincronizado').equals(0)
        .filter(sale => sale.userId === currentUserId)
        .toArray();
      
      if (pendingSales.length === 0) return;

      setPendingCount(pendingSales.length);
      setIsSyncing(true);
      setSyncSuccess(false);

      // 🚨 FIX MAESTRO: Solo celebraremos si subimos ventas reales
      let ventasExitosas = 0;

      for (const sale of pendingSales) {
        try {
          const payload = {
            userId: sale.userId,
            metodoPago: sale.metodoPago,
            notas: sale.notas,
            items: sale.items
          };

          // Intentamos enviar a C#
          await streetposApi.post('/Sales', payload);
          
          // Solo borramos de IndexedDB si C# dice que TODO BIEN
          await db.offlineSales.delete(sale.localId);
          ventasExitosas++;
          setPendingCount(prev => prev - 1);
          
        } catch (err: any) {
          // Si falla (por CORS o 500), NO lo borra y NO suma éxito
          console.error(`❌ Venta retenida (${sale.localId}). Error de conexión con C#.`);
        }
      }

      setIsSyncing(false);
      
      // 🚨 Solo dispara la animación de éxito si realmente guardó algo
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
  }, [currentUserId]);

  const syncAll = useCallback(() => {
    syncCatalog();
    syncSales();
  }, [syncCatalog, syncSales]);

  useEffect(() => {
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