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
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDailySales(selectedDate);
  }, [selectedDate]);

  const fetchDailySales = async (date: string) => {
    try {
      setLoading(true);
      setError('');
      const response = await streetposApi.get(`/Sales/daily?date=${date}`);
      setSales(response.data);
    } catch (err: any) {
      setError('Error al cargar el reporte de ventas.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      // Es vital usar responseType: 'blob' para que Axios entienda que recibe un archivo y no un JSON
      const response = await streetposApi.get(`/Sales/daily/download?date=${selectedDate}`, {
        responseType: 'blob' 
      });

      // Magia de React/Navegador para forzar la descarga del archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Corte_Caja_${selectedDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err: any) {
      alert('Error al descargar el PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const totalIngresos = sales.reduce((acc, sale) => acc + sale.total, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Cortes de Caja</h1>
            <p className="mt-1 text-sm text-gray-500">Consulta los ingresos de tu negocio por día y descarga el reporte.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto bg-white p-2 rounded-xl shadow-sm border border-gray-200">
            <span className="text-sm font-bold text-gray-600 pl-2">Fecha:</span>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-medium outline-none transition-all cursor-pointer"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-bold">
            {error}
          </div>
        )}

        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full flex items-start justify-end p-3">
              <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Ingresos del Día</p>
            <h3 className="text-3xl font-black text-gray-900">${totalIngresos.toFixed(2)}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full flex items-start justify-end p-3">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Tickets Emitidos</p>
            <h3 className="text-3xl font-black text-gray-900">{sales.length}</h3>
          </div>
        </div>

        {/* Tabla y Botón PDF */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800">Detalle de Transacciones</h2>
            
            <button 
              onClick={handleDownloadPdf}
              disabled={downloading || sales.length === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md
                ${downloading || sales.length === 0 
                  ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-rose-600/30'
                }`}
            >
              {downloading ? (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              )}
              {downloading ? 'Generando PDF...' : 'Descargar PDF'}
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center text-gray-500 font-bold">Cargando datos...</div>
            ) : sales.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p>No hay ventas registradas en esta fecha.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-white">
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Hora</th>
                    <th className="px-6 py-4">Método de Pago</th>
                    <th className="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sales.map((sale) => {
                    const horaLocal = new Date(sale.fechaVenta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{horaLocal}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider border
                            ${sale.metodoPago === 'Efectivo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : sale.metodoPago === 'Tarjeta' ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                            {sale.metodoPago}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-gray-900">
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