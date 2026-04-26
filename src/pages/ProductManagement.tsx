import React, { useState, useEffect } from 'react';
import streetposApi from '../api/axiosConfig';
import type { Product } from '../types/product';
import type { Category } from '../types/category'; 

// 🚨 IMPORTAMOS LA BASE DE DATOS LOCAL 🚨
import { db } from '../db/db';

export const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // ESTADO PARA EL BUSCADOR INTELIGENTE
  const [searchTerm, setSearchTerm] = useState('');
  
  // ESTADOS DE PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 
  
  // ESTADOS PARA UI/UX (Toasts y Modales)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; prodId: string; prodName: string }>({
    isOpen: false,
    prodId: '',
    prodName: ''
  });

  // ESTADO DEL FORMULARIO CON STOCK
  const [formData, setFormData] = useState({
    nombre: '',
    precioCompra: 0,
    precioVenta: 0,
    categoriaId: '',
    stockActual: 0,
    stockMinimo: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // LECTURA HÍBRIDA (API -> Fallback a IndexedDB)
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      if (navigator.onLine) {
        try {
          const [productsRes, categoriesRes] = await Promise.all([
            streetposApi.get('/Products'),
            streetposApi.get('/Categories')
          ]);
          
          setProducts(productsRes.data);
          setCategories(categoriesRes.data);
          
          localStorage.setItem('streetpos_categories', JSON.stringify(categoriesRes.data));
          await db.products.bulkPut(productsRes.data);
        } catch (apiError) {
          throw new Error('Fallo API, pasando a modo local');
        }
      } else {
        throw new Error('Sin conexión, pasando a modo local');
      }

    } catch (err: any) {
      console.log("Cargando catálogo en modo offline...");
      const localProducts = await db.products.toArray();
      setProducts(localProducts);
      
      const cachedCats = localStorage.getItem('streetpos_categories');
      if (cachedCats) setCategories(JSON.parse(cachedCats));
      
      if (!navigator.onLine) {
         showToast('Trabajando en modo sin conexión', 'info');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // VALIDACIÓN DE MÁXIMO DE CARACTERES PARA NÚMEROS
    if (type === 'number') {
      const maxDigits = (name === 'precioCompra' || name === 'precioVenta') ? 8 : 6;
      if (value.length > maxDigits) return; // Bloquea si excede el límite
    }

    setFormData({ 
      ...formData, 
      [name]: type === 'number' ? Number(value) : value 
    });
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({ 
      nombre: product.nombre, 
      precioCompra: product.precioCompra || 0,
      precioVenta: product.precioVenta || 0,
      categoriaId: product.categoriaId || '',
      stockActual: product.stockActual || 0,
      stockMinimo: product.stockMinimo || 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ nombre: '', precioCompra: 0, precioVenta: 0, categoriaId: '', stockActual: 0, stockMinimo: 0 });
  };

  // GUARDADO/ACTUALIZACIÓN HÍBRIDA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoriaId) {
      showToast("Por favor selecciona una categoría válida.", 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (navigator.onLine) {
        if (editingId) {
          await streetposApi.put(`/Products/${editingId}`, formData);
          showToast('Producto actualizado con éxito');
        } else {
          await streetposApi.post('/Products', formData);
          showToast('Producto registrado en el inventario');
        }
      } else {
        const localProductToSave = {
          ...formData,
          id: editingId || crypto.randomUUID()
        };
        await db.products.put(localProductToSave);
        showToast('Guardado localmente. Se sincronizará al tener red.', 'info');
      }
      
      cancelEdit();
      await fetchInitialData();
      
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Fallo en la operación', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ELIMINACIÓN HÍBRIDA
  const confirmDelete = async () => {
    try {
      if (navigator.onLine) {
        await streetposApi.delete(`/Products/${deleteModal.prodId}`);
        showToast('Producto eliminado correctamente');
      } else {
        await db.products.delete(deleteModal.prodId);
        showToast('Producto eliminado localmente.', 'info');
      }
      
      setDeleteModal({ isOpen: false, prodId: '', prodName: '' });
      await fetchInitialData();
      
      if (currentProducts.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err: any) {
      showToast('Error al eliminar. Puede que ya tenga ventas registradas.', 'error');
    }
  };

  const getCategoryName = (id: string) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.nombre : 'Sin Categoría';
  };

  // LÓGICA DE FILTRADO (BUSCADOR INTELIGENTE)
  const filteredProducts = products.filter(product => 
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // LÓGICA DE PAGINACIÓN ACTUALIZADA
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);


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

      {/* MODAL DE ELIMINACIÓN */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-rose-100 mb-4">
                <svg className="h-10 w-10 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar Producto?</h3>
              <p className="text-sm text-gray-500 px-4">
                Estás a punto de borrar <span className="font-bold text-gray-800">{deleteModal.prodName}</span> del inventario. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex bg-gray-50 p-4 gap-3">
              <button onClick={() => setDeleteModal({ isOpen: false, prodId: '', prodName: '' })} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-100 transition-all">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-3 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}


      <div className="max-w-7xl mx-auto">
        
        {/* Cabecera y Status Offline */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div className="flex items-center gap-3">
            {/* 🚨 ICONO ANTES DEL TÍTULO PRINCIPAL 🚨 */}
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Inventario de Productos</h1>
              <p className="mt-1 text-sm text-gray-500">Gestiona precios, categorías y niveles de stock de tu catálogo.</p>
            </div>
          </div>
          <div className="text-right w-full md:w-auto">
            {/* INDICADOR VISUAL OFFLINE/ONLINE */}
            <span className={`px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm border inline-flex ${navigator.onLine ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${navigator.onLine ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              {navigator.onLine ? 'Conectado' : 'Modo Offline'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* LADO IZQUIERDO: FORMULARIO */}
          <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all duration-300 h-fit ${editingId ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${editingId ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                {editingId ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Actualizar Producto' : 'Registrar Nuevo'}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Nombre (CON MAXLENGTH Y CONTADOR ARRIBA) */}
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Nombre del Producto</label>
                  <span className={`text-[10px] font-bold ${formData.nombre.length >= 100 ? 'text-rose-500' : 'text-gray-400'}`}>
                    {formData.nombre.length} / 100
                  </span>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    name="nombre" 
                    required 
                    maxLength={100} 
                    value={formData.nombre} 
                    onChange={handleInputChange} 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium" 
                    placeholder="Ej. Coca Cola 600ml" 
                  />
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Categoría</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  </div>
                  <select name="categoriaId" required value={formData.categoriaId} onChange={handleInputChange} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer appearance-none font-medium text-gray-700">
                    <option value="" disabled>-- Seleccionar --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
              
              {/* Precios (CON LÍMITE DE DÍGITOS Y CONTADOR ARRIBA) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Costo Unitario</label>
                    <span className={`text-[10px] font-bold ${String(formData.precioCompra === 0 ? '' : formData.precioCompra).length >= 8 ? 'text-rose-500' : 'text-gray-400'}`}>
                      {String(formData.precioCompra === 0 ? '' : formData.precioCompra).length} / 8
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-3 font-bold text-gray-400">$</span>
                    <input 
                      type="number" 
                      name="precioCompra" 
                      min="0" 
                      step="0.01" 
                      required 
                      value={formData.precioCompra === 0 ? '' : formData.precioCompra} 
                      onChange={handleInputChange} 
                      className="w-full pl-7 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium" 
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Precio Público</label>
                    <span className={`text-[10px] font-bold ${String(formData.precioVenta === 0 ? '' : formData.precioVenta).length >= 8 ? 'text-rose-500' : 'text-blue-400'}`}>
                      {String(formData.precioVenta === 0 ? '' : formData.precioVenta).length} / 8
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-3 font-bold text-blue-500">$</span>
                    <input 
                      type="number" 
                      name="precioVenta" 
                      min="0" 
                      step="0.01" 
                      required 
                      value={formData.precioVenta === 0 ? '' : formData.precioVenta} 
                      onChange={handleInputChange} 
                      className="w-full pl-7 p-3 bg-blue-50/50 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50 transition-all font-bold text-blue-700" 
                      placeholder="0.00" 
                    />
                  </div>
                </div>
              </div>

              {/* Inventario (CON LÍMITE DE DÍGITOS Y CONTADOR ARRIBA) */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      Stock Inicial
                    </label>
                    <span className={`text-[10px] font-bold ${String(formData.stockActual === 0 ? '' : formData.stockActual).length >= 6 ? 'text-rose-500' : 'text-gray-400'}`}>
                      {String(formData.stockActual === 0 ? '' : formData.stockActual).length} / 6
                    </span>
                  </div>
                  <input 
                    type="number" 
                    name="stockActual" 
                    min="0" 
                    required 
                    value={formData.stockActual === 0 ? '' : formData.stockActual} 
                    onChange={handleInputChange} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium" 
                    placeholder="Ej. 50" 
                  />
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                      <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Alerta Mínima
                    </label>
                    <span className={`text-[10px] font-bold ${String(formData.stockMinimo === 0 ? '' : formData.stockMinimo).length >= 6 ? 'text-rose-500' : 'text-gray-400'}`}>
                      {String(formData.stockMinimo === 0 ? '' : formData.stockMinimo).length} / 6
                    </span>
                  </div>
                  <input 
                    type="number" 
                    name="stockMinimo" 
                    min="0" 
                    required 
                    value={formData.stockMinimo === 0 ? '' : formData.stockMinimo} 
                    onChange={handleInputChange} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all font-medium" 
                    placeholder="Ej. 10" 
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button type="submit" disabled={isSubmitting} className={`flex-1 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${isSubmitting ? 'bg-gray-400 shadow-none' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'}`}>
                  {editingId ? 'Guardar Cambios' : 'Añadir al Inventario'}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="px-5 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* LADO DERECHO: TABLA Y PAGINACIÓN */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            
            {/* Cabecera con Buscador Inteligente */}
            <div className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-800">Catálogo Activo</h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                  {filteredProducts.length} Registros
                </span>
              </div>
              
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar producto..." 
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-20 text-gray-500 font-bold">Cargando inventario...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col justify-center items-center py-20 text-gray-400 px-4 text-center">
                  <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  <p className="font-medium text-sm">
                    {searchTerm 
                      ? `No se encontraron productos que coincidan con "${searchTerm}"` 
                      : 'Aún no has registrado ningún producto.'
                    }
                  </p>
                </div>
              ) : (
                <table className="min-w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-white">
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4 text-right">Precio</th>
                      <th className="px-6 py-4 text-center">Stock</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentProducts.map(prod => {
                      const isLowStock = prod.stockActual <= prod.stockMinimo;
                      return (
                        <tr key={prod.id} className="hover:bg-gray-50/80 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900 text-sm truncate max-w-[200px] sm:max-w-[250px]" title={prod.nombre}>
                              {prod.nombre}
                            </p>
                            <span className="inline-flex items-center mt-1 bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              <svg className="w-3 h-3 mr-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                              {getCategoryName(prod.categoriaId)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-black text-blue-600">${prod.precioVenta.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 font-medium">Costo: ${prod.precioCompra.toFixed(2)}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className={`inline-flex flex-col items-center px-3 py-1.5 rounded-lg border ${isLowStock ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                              <span className={`text-sm font-black ${isLowStock ? 'text-rose-700' : 'text-emerald-700'}`}>
                                {prod.stockActual} <span className="text-[10px] font-medium opacity-70">uds</span>
                              </span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${isLowStock ? 'text-rose-500' : 'text-emerald-600'}`}>
                                {isLowStock ? '¡Alerta!' : `Mín: ${prod.stockMinimo}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={() => startEdit(prod)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors inline-flex" title="Editar">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => setDeleteModal({ isOpen: true, prodId: prod.id, prodName: prod.nombre })} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex" title="Eliminar">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* PAGINADOR */}
            {filteredProducts.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500">
                  Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredProducts.length)} de {filteredProducts.length}
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => paginate(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => paginate(i + 1)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => paginate(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};