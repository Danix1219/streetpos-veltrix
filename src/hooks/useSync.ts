import { useEffect, useCallback, useState } from 'react';
import { db } from '../db/db';
import streetposApi from '../api/axiosConfig';

export const useSync = () => {
  // 🚨 NUEVOS ESTADOS PARA LA UI 🚨
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const syncCatalog = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const response = await streetposApi.get('/Products');
      await db.products.bulkPut(response.data);
    } catch (error) {
      console.error('Error al descargar el catálogo:', error);
    }
  }, []);

  const syncSales = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      const pendingSales = await db.offlineSales.where('sincronizado').equals(0).toArray();
      
      if (pendingSales.length === 0) return;

      // 🚨 AVISAMOS A LA UI QUE EMPEZÓ LA SINCRONIZACIÓN 🚨
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
          
          // Actualizamos el contador en tiempo real
          setPendingCount(prev => prev - 1);
        } catch (err) {
          console.error(`Fallo al sincronizar la venta ${sale.localId}.`);
        }
      }

      // 🚨 AVISAMOS A LA UI QUE TERMINÓ CON ÉXITO 🚨
      setIsSyncing(false);
      setSyncSuccess(true);
      
      // Ocultamos el mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSyncSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error crítico al leer la cola de ventas:', error);
      setIsSyncing(false);
    }
  }, []);

  const syncAll = useCallback(() => {
    syncCatalog();
    syncSales();
  }, [syncCatalog, syncSales]);

  useEffect(() => {
    syncAll();
    window.addEventListener('online', syncAll);
    return () => {
      window.removeEventListener('online', syncAll);
    };
  }, [syncAll]);

  // 🚨 RETORNAMOS LOS ESTADOS PARA QUE EL LAYOUT LOS DIBUJE 🚨
  return { isSyncing, syncSuccess, pendingCount };
};