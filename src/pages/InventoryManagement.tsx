import React, { useState, useEffect } from 'react';
import streetposApi from '../api/axiosConfig'; // 🚨 IMPORTAMOS TU AXIOS CONFIGURADO
import type { Inventory, UpsertInventoryDto } from '../types/inventory';
import type { Branch } from '../types/branch';
import type { Product } from '../types/product'; 

export const InventoryManagement = () => {
  // Datos maestros
  const [branches, setBranches] = useState<Branch[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  
  // Estado principal de la vista
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del Modal (Ajuste de Stock)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [formData, setFormData] = useState<UpsertInventoryDto>({
    productId: '',
    stockActual: 0,
    stockMinimo: 0
  });

  // ==========================================
  // 1. CARGA INICIAL: SUCURSALES Y CATÁLOGO
  // ==========================================
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // 🚨 USAMOS streetposApi CON Promise.all PARA MAYOR VELOCIDAD
        const [resBranches, resCatalog] = await Promise.all([
          streetposApi.get('/Branches'),
          streetposApi.get('/Products')
        ]);
        
        setBranches(resBranches.data);
        setCatalog(resCatalog.data);

        // Auto-seleccionar la primera sucursal si existe
        if (resBranches.data.length > 0) {
          setSelectedBranchId(resBranches.data[0].id);
        }
      } catch (err) {
        console.error("Error cargando datos base", err);
        setError("No se pudieron cargar las sucursales o el catálogo.");
      }
    };
    fetchInitialData();
  }, []);

  // ==========================================
  // 2. CARGAR INVENTARIO CUANDO CAMBIA LA SUCURSAL
  // ==========================================
  useEffect(() => {
    if (!selectedBranchId) return;

    const fetchInventory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 🚨 USAMOS streetposApi
        const response = await streetposApi.get(`/Inventory/branch/${selectedBranchId}`);
        setInventory(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar el inventario de esta sucursal');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, [selectedBranchId]);

  // ==========================================
  // MANEJO DEL MODAL
  // ==========================================
  const openModal = (item?: Inventory) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        productId: item.productId,
        stockActual: item.stockActual,
        stockMinimo: item.stockMinimo
      });
    } else {
      setEditingItem(null);
      setFormData({ productId: '', stockActual: 0, stockMinimo: 5 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('stock') ? Number(value) : value
    }));
  };

  // ==========================================
  // GUARDAR AJUSTE DE STOCK (UPSERT)
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId || !formData.productId) {
      setError("Faltan datos por seleccionar");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 🚨 USAMOS streetposApi
      await streetposApi.post(`/Inventory/branch/${selectedBranchId}/upsert`, formData);

      closeModal();
      
      // Recargar inventario para ver los cambios
      const resRefresh = await streetposApi.get(`/Inventory/branch/${selectedBranchId}`);
      setInventory(resRefresh.data);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el inventario');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar el catálogo para no mostrar en el select productos que YA están en la tabla
  const availableProducts = catalog.filter(p => !inventory.some(i => i.productId === p.id));

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen relative">
      
      {/* Cabecera y Selector de Sucursal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Control de Inventario</h1>
            <p className="mt-1 text-sm text-gray-500">Ajusta las existencias físicas por ubicación.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <label className="text-sm font-bold text-gray-600 pl-2 whitespace-nowrap">Sucursal:</label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="w-full md:w-56 p-2 bg-gray-50 border border-gray-200 text-blue-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold cursor-pointer"
          >
            <option value="" disabled>Seleccione...</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>

          <button 
            onClick={() => openModal()}
            disabled={!selectedBranchId}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm whitespace-nowrap active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            Añadir Producto
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-6 border border-rose-200 font-bold flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {/* Tabla de Inventario */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-50">
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Cód / SKU</th>
                <th className="px-6 py-4 text-center">Stock Actual</th>
                <th className="px-6 py-4 text-center">Alerta Mín.</th>
                <th className="px-6 py-4">Última Act.</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!selectedBranchId ? (
                <tr><td colSpan={6} className="p-12 text-center text-gray-500 font-medium">👈 Por favor, selecciona una sucursal arriba para ver su inventario.</td></tr>
              ) : isLoading ? (
                <tr><td colSpan={6} className="p-12 text-center text-gray-500 font-bold flex items-center justify-center gap-2"><svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Cargando inventario...</td></tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    <p className="font-bold text-gray-500">No hay productos asignados a esta sucursal.</p>
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-900">{item.productName}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-700">{item.productCode || 'N/A'}</div>
                      <div className="text-[10px] text-gray-400">{item.productSKU || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-4 py-1.5 rounded-lg font-black text-sm border ${item.stockActual <= item.stockMinimo ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {item.stockActual} uds
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500 font-bold">{item.stockMinimo}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                      {new Date(item.ultimaActualizacion).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openModal(item)}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 active:scale-95"
                      >
                        Ajustar Stock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Ajuste (Upsert) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Ajustar Stock' : 'Añadir Producto'}
                </h2>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-full p-1.5 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Selector de Producto */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Seleccionar Producto</label>
                {editingItem ? (
                  <div className="w-full p-3.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-800 font-bold">
                    {editingItem.productName}
                  </div>
                ) : (
                  <select
                    name="productId"
                    required
                    value={formData.productId}
                    onChange={handleInputChange}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 cursor-pointer"
                  >
                    <option value="" disabled>-- Selecciona del catálogo --</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Stock Físico</label>
                  <input 
                    type="number" 
                    name="stockActual" 
                    required 
                    min="0"
                    value={formData.stockActual} 
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xl font-black text-center text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Alerta Mínima</label>
                  <input 
                    type="number" 
                    name="stockMinimo" 
                    required 
                    min="0"
                    value={formData.stockMinimo} 
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-xl font-black text-center text-rose-600"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:bg-blue-400"
                >
                  {isLoading ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};