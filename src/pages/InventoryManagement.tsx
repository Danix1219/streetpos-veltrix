import React, { useState, useEffect } from 'react';
import streetposApi from '../api/axiosConfig'; 
import type { Inventory, UpsertInventoryDto } from '../types/inventory';
import type { Branch } from '../types/branch';
import type { Product } from '../types/product'; 

export const InventoryManagement = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para Búsqueda y Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Bajo Stock' | 'Normal'>('Todos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [formData, setFormData] = useState<UpsertInventoryDto>({
    productId: '',
    stockActual: 0,
    stockMinimo: 0
  });

  // ==========================================
  // 1. CARGA INICIAL
  // ==========================================
  useEffect(() => {
    const fetchInitialData = async () => {
      setError(null);
      
      try {
        const resBranches = await streetposApi.get('/Branches');
        setBranches(resBranches.data);
        if (resBranches.data.length > 0) {
          setSelectedBranchId(resBranches.data[0].id);
        }
      } catch (err: any) {
        setError("Error al cargar sucursales. Revisa la conexión.");
      }

      try {
        const resCatalog = await streetposApi.get('/Products');
        setCatalog(resCatalog.data);
      } catch (err: any) {
        console.error("Fallo crítico en /Products", err);
        setError("El backend devolvió error al pedir los productos.");
      }
    };
    
    fetchInitialData();
  }, []);

  // ==========================================
  // 2. CARGAR INVENTARIO DE SUCURSAL
  // ==========================================
  useEffect(() => {
    if (!selectedBranchId) {
      setInventory([]);
      return;
    }

    const fetchInventory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await streetposApi.get(`/Inventory/branch/${selectedBranchId}`);
        setInventory(response.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setInventory([]); 
        } else {
          setError(err.response?.data?.message || 'Error al cargar el inventario.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, [selectedBranchId]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId || !formData.productId) {
      setError("Por favor selecciona un producto válido.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await streetposApi.post(`/Inventory/branch/${selectedBranchId}/upsert`, formData);
      closeModal();
      
      const resRefresh = await streetposApi.get(`/Inventory/branch/${selectedBranchId}`);
      setInventory(resRefresh.data);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error del servidor al guardar el stock.');
    } finally {
      setIsLoading(false);
    }
  };

  const availableProducts = catalog.filter(p => !inventory.some(i => i.productId === p.id));

  // LÓGICA DE FILTRO Y BÚSQUEDA INTELIGENTE
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.productCode && item.productCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (item.productSKU && item.productSKU.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const isLowStock = item.stockActual <= item.stockMinimo;
    const matchesStatus = filterStatus === 'Todos' || 
                          (filterStatus === 'Bajo Stock' && isLowStock) || 
                          (filterStatus === 'Normal' && !isLowStock);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen relative">
      
      {/* ==========================================
          HEADER COMPACTO Y RESPONSIVO
          ========================================== */}
      <div className="flex flex-col gap-5 mb-8">
        
        {/* Fila 1: Título y Selector de Sucursal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-blue-100 text-blue-600 rounded-xl shadow-sm shrink-0">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">Control de Inventario</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Supervisa y ajusta las existencias físicas.</p>
            </div>
          </div>

          {/* Selector de Sucursal (Estilo Premium/Ghost) */}
          <div className="relative group w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full md:w-64 pl-10 pr-10 py-2.5 sm:py-3 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none font-bold cursor-pointer appearance-none transition-all text-sm"
            >
              <option value="" disabled>Seleccione una sucursal...</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* Fila 2: Buscador y Botón Añadir (Alineados para ahorrar espacio) */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              placeholder="Buscar producto, código o SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-700 shadow-sm transition-all"
            />
          </div>

          {/* Botón de Añadir (Cuadrado en móvil, expandido en PC) */}
          <button 
            onClick={() => openModal()}
            disabled={!selectedBranchId || catalog.length === 0}
            className="h-[46px] w-[46px] sm:w-auto sm:px-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95 shrink-0"
            title="Añadir Producto al Inventario"
          >
            <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">Añadir Producto</span>
          </button>
        </div>

        {/* Fila 3: Filtros Rápidos (Scroll horizontal en móviles) */}
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {['Todos', 'Bajo Stock', 'Normal'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap
                ${filterStatus === status ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 bg-gray-200/30'}
                ${status === 'Bajo Stock' && filterStatus === status ? 'text-rose-600' : ''}`}
            >
              {status === 'Bajo Stock' && <span className={`w-2 h-2 rounded-full ${filterStatus === status ? 'bg-rose-500 animate-pulse' : 'bg-gray-400'}`}></span>}
              {status}
            </button>
          ))}
        </div>

      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-xl mb-6 border border-rose-100 font-bold flex items-center gap-3 animate-fade-in">
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Contador de resultados */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
          {filteredInventory.length} {filteredInventory.length === 1 ? 'Registro' : 'Registros'}
        </p>
      </div>

      {/* ==========================================
          GRID DE INVENTARIO (Tarjetas Optimizadas)
          ========================================== */}
      {!selectedBranchId ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-10 sm:p-16 text-center shadow-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Selecciona una Sucursal</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">Utiliza el selector de arriba para cargar el inventario de una ubicación específica.</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-20 text-gray-500 font-bold text-sm">
          <svg className="animate-spin h-6 w-6 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Sincronizando inventario...
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-10 sm:p-12 text-center shadow-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">No hay productos aquí</h3>
          <p className="text-gray-500 text-xs sm:text-sm">Intenta cambiar los filtros o agrega un producto nuevo al inventario.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredInventory.map(item => {
            const isLowStock = item.stockActual <= item.stockMinimo;
            
            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col group relative
                  ${isLowStock 
                    ? 'border-rose-200 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-900/5' 
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5'}`}
              >
                <div className="p-4 sm:p-5 flex-1 flex flex-col relative z-10">
                  
                  {/* Badges Superiores */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] sm:text-xs font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-md uppercase tracking-wider">
                      {item.productCode || 'N/A'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 
                      ${isLowStock ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                      {isLowStock ? 'Bajo Stock' : 'Normal'}
                    </span>
                  </div>

                  {/* Nombre del Producto */}
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-4 line-clamp-2 min-h-[3rem] leading-snug group-hover:text-blue-700 transition-colors pr-2">
                    {item.productName}
                  </h3>
                  
                  {/* Caja de Estadísticas Compacta */}
                  <div className={`grid grid-cols-2 gap-2 mb-4 p-2.5 sm:p-3 rounded-xl border ${isLowStock ? 'bg-rose-50/40 border-rose-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="text-center">
                      <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Actual</p>
                      <p className={`text-xl sm:text-2xl font-black leading-none ${isLowStock ? 'text-rose-600' : 'text-gray-900'}`}>
                        {item.stockActual}
                      </p>
                    </div>
                    <div className="text-center border-l border-gray-200/60">
                      <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Alerta Mín.</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-500 leading-none">
                        {item.stockMinimo}
                      </p>
                    </div>
                  </div>

                  {/* Botón de Acción */}
                  <button 
                    onClick={() => openModal(item)}
                    className="w-full mt-auto py-2 sm:py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold text-gray-600 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Ajustar
                  </button>

                </div>
                
                {/* Deco inferior */}
                <div className={`h-1 w-full transition-colors ${isLowStock ? 'bg-rose-500 group-hover:bg-rose-600' : 'bg-blue-500 group-hover:bg-blue-600'}`}></div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL FORMULARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            
            <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black bg-blue-100 text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 </div>
                 <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
                   {editingItem ? 'Ajustar Stock' : 'Añadir Producto'}
                 </h2>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 bg-gray-200/50 hover:bg-gray-200 rounded-full p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5">
              
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Seleccionar Producto</label>
                {editingItem ? (
                  <div className="w-full p-3.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-800 font-bold">
                    {editingItem.productName}
                  </div>
                ) : (
                  <div className="relative group">
                    <select
                      name="productId"
                      required
                      value={formData.productId}
                      onChange={handleInputChange}
                      className="w-full pl-4 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 cursor-pointer appearance-none transition-all"
                    >
                      <option value="" disabled>-- Selecciona del catálogo --</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Stock Físico</label>
                  <input 
                    type="number" 
                    name="stockActual" 
                    required 
                    min="0"
                    value={formData.stockActual} 
                    onChange={handleInputChange}
                    className="w-full p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xl sm:text-2xl font-black text-center text-emerald-700 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Alerta Mínima</label>
                  <input 
                    type="number" 
                    name="stockMinimo" 
                    required 
                    min="0"
                    value={formData.stockMinimo} 
                    onChange={handleInputChange}
                    className="w-full p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-xl sm:text-2xl font-black text-center text-rose-600 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 py-3 sm:py-3.5 bg-white border border-gray-200 text-sm text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 py-3 sm:py-3.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-400 disabled:shadow-none"
                >
                  {isLoading ? 'Guardando...' : 'Confirmar Stock'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};