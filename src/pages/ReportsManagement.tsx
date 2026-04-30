import { useState, useEffect } from 'react';
import streetposApi from '../api/axiosConfig';

interface Sale {
  id: string;
  fechaVenta: string;
  total: number;
  metodoPago: string;
}

export const ReportsManagement = () => {
  // Por defecto, ponemos la fecha de hoy
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  // Toasts UI
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    fetchDailySales(selectedDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDailySales = async (date: string) => {
    try {
      setLoading(true);
      const response = await streetposApi.get(`/Sales/daily?date=${date}`);
      
      // Si el backend responde con éxito, guardamos los datos (sea un array lleno o vacío)
      setSales(response.data || []);
      
    } catch (err: any) {
      // 🚨 FIX: Si el backend lanza un 404 (No encontrado) u otro error lógico de "lista vacía"
      // simplemente vaciamos la tabla de ventas y evitamos asustar al usuario.
      if (err.response && (err.response.status === 404 || err.response.status === 400)) {
        setSales([]); 
      } else {
        // Solo mostramos el error si de verdad el servidor falló (ej. Error 500 o sin internet)
        showToast('Error de conexión al cargar el reporte.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      showToast('Generando reporte PDF...', 'info');
      
      const response = await streetposApi.get(`/Sales/daily/download?date=${selectedDate}`, {
        responseType: 'blob' 
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Corte_Caja_${selectedDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showToast('Reporte descargado con éxito.', 'success');
      
    } catch (err: any) {
      showToast('Error al generar el documento PDF.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  // Cálculos para las tarjetas de resumen
  const totalIngresos = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalEfectivo = sales.filter(s => s.metodoPago === 'Efectivo').reduce((acc, sale) => acc + sale.total, 0);
  const totalTarjeta = sales.filter(s => s.metodoPago === 'Tarjeta').reduce((acc, sale) => acc + sale.total, 0);
  const totalTransferencia = sales.filter(s => s.metodoPago === 'Transferencia').reduce((acc, sale) => acc + sale.total, 0);

  // 🚨 FUNCIÓN CLAVE PARA EXTRAER LA HORA PURA DEL BACKEND (SIN MODIFICACIONES LOCALES) 🚨
  const formatTimeFromServer = (fechaString: string) => {
    // Si la fecha viene como "2026-04-25T20:30:00", esto extrae solo el "20:30"
    try {
      if (!fechaString) return "--:--";
      const timePart = fechaString.split('T')[1]; 
      if (timePart) {
        return timePart.substring(0, 5); // Retorna HH:mm
      }
      return new Date(fechaString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "--:--";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen relative">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[60] flex items-center p-4 mb-4 text-white rounded-2xl shadow-2xl animate-fade-in 
          ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'}`}>
          <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg mr-3">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            ) : toast.type === 'error' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
          </div>
          <div className="text-sm font-bold pr-2">{toast.message}</div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Cortes de Caja</h1>
              <p className="mt-1 text-sm text-gray-500">Consulta los ingresos de tu negocio por día y valida tus transacciones.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto bg-white p-2 rounded-xl shadow-sm border border-gray-200">
            <span className="text-sm font-bold text-gray-600 pl-2">Fecha Operativa:</span>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-blue-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-bold outline-none transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Tarjetas de Resumen Financiero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Ingresos Totales */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full flex items-start justify-end p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Ingresos</p>
            <h3 className="text-3xl font-black text-blue-600">${totalIngresos.toFixed(2)}</h3>
            <p className="mt-3 text-xs font-bold text-gray-500">{sales.length} Tickets emitidos</p>
          </div>

          {/* Desglose: Efectivo */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-50 rounded-bl-full flex items-start justify-end p-2.5">
              <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">En Efectivo</p>
            <h3 className="text-2xl font-black text-gray-800">${totalEfectivo.toFixed(2)}</h3>
          </div>

          {/* Desglose: Tarjeta */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-purple-50 rounded-bl-full flex items-start justify-end p-2.5">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Por Tarjeta</p>
            <h3 className="text-2xl font-black text-gray-800">${totalTarjeta.toFixed(2)}</h3>
          </div>

          {/* Desglose: Transferencia */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-amber-50 rounded-bl-full flex items-start justify-end p-2.5">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Transferencias</p>
            <h3 className="text-2xl font-black text-gray-800">${totalTransferencia.toFixed(2)}</h3>
          </div>
        </div>

        {/* Tabla y Botón PDF */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800">Detalle de Transacciones Rápidas</h2>
            
            <button 
              onClick={handleDownloadPdf}
              disabled={downloading || sales.length === 0}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md
                ${downloading || sales.length === 0 
                  ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-600/30'
                }`}
            >
              {downloading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              )}
              {downloading ? 'Generando Reporte Contable...' : 'Descargar Reporte Completo (PDF)'}
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center text-gray-500 font-bold">Cargando datos...</div>
            ) : sales.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="font-bold text-gray-500">No hay ventas registradas en esta fecha.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-white">
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Folio Venta</th>
                    <th className="px-6 py-4">Hora (Local)</th>
                    <th className="px-6 py-4 text-center">Método de Pago</th>
                    <th className="px-6 py-4 text-right">Total Cobrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sales.map((sale) => {
                    const horaExacta = formatTimeFromServer(sale.fechaVenta);
                    const folioCorto = sale.id.substring(0, 8).toUpperCase();
                    return (
                      <tr key={sale.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4 text-xs font-mono font-bold text-gray-500">
                          #{folioCorto}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                          {horaExacta} hrs
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase border
                            ${sale.metodoPago === 'Efectivo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : sale.metodoPago === 'Tarjeta' ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {sale.metodoPago}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-gray-900 text-base">
                          ${sale.total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};