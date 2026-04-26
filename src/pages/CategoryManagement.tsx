import React, { useState, useEffect } from 'react';
import streetposApi from '../api/axiosConfig';
import type { Category } from '../types/category';

export const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 🚨 NUEVO: ESTADO PARA EL BUSCADOR INTELIGENTE 🚨
  const [searchTerm, setSearchTerm] = useState('');
  
  // ESTADOS DE PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // ESTADOS PARA UI/UX (Toasts y Modales)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; catId: string; catName: string }>({
    isOpen: false,
    catId: '',
    catName: ''
  });

  const [formData, setFormData] = useState({
    nombre: '',
    colorHex: '#3B82F6', 
    orden: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await streetposApi.get('/Categories');
      const sortedData = response.data.sort((a: Category, b: Category) => a.orden - b.orden);
      setCategories(sortedData);
    } catch (err: any) {
      setError('Error al cargar las categorías');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'number' ? Number(value) : value 
    });
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({ 
      nombre: category.nombre, 
      colorHex: category.colorHex || '#3B82F6',
      orden: category.orden || 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ nombre: '', colorHex: '#3B82F6', orden: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await streetposApi.put(`/Categories/${editingId}`, formData);
        showToast('Categoría actualizada con éxito');
      } else {
        await streetposApi.post('/Categories', formData);
        showToast('Categoría registrada correctamente');
      }
      cancelEdit();
      fetchCategories();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Fallo en la operación', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await streetposApi.delete(`/Categories/${deleteModal.catId}`);
      showToast('Categoría eliminada del catálogo');
      setDeleteModal({ isOpen: false, catId: '', catName: '' });
      fetchCategories();
      
      // Si se borró el último item de una página, regresar a la anterior
      if (currentCategories.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err: any) {
      showToast('Error al eliminar. Revisa que no tenga productos.', 'error');
    }
  };

  // 🚨 NUEVO: LÓGICA DE FILTRADO (BUSCADOR INTELIGENTE) 🚨
  const filteredCategories = categories.filter(category => 
    category.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // LÓGICA DE PAGINACIÓN ACTUALIZADA
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Reiniciar a la página 1 cada vez que se busca algo
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen relative">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[60] flex items-center p-4 mb-4 text-white rounded-2xl shadow-2xl animate-fade-in ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg mr-3">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar Categoría?</h3>
              <p className="text-sm text-gray-500 px-4">
                Estás a punto de borrar <span className="font-bold text-gray-800">{deleteModal.catName}</span>. 
                Si tiene productos asignados, la operación será cancelada por seguridad.
              </p>
            </div>
            <div className="flex bg-gray-50 p-4 gap-3">
              <button onClick={() => setDeleteModal({ isOpen: false, catId: '', catName: '' })} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-100 transition-all">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-3 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}


      <div className="max-w-7xl mx-auto">
        {/* Cabecera */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            {/* 🚨 ICONO AÑADIDO AQUÍ 🚨 */}
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Gestión de Categorías</h1>
              <p className="mt-1 text-sm text-gray-500">Organiza tu inventario creando secciones visuales para el Punto de Venta.</p>
            </div>
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Actualizar Categoría' : 'Crear Nueva'}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Nombre (CON MAXLENGTH Y CONTADOR) */}
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Nombre Público</label>
                  {/* 🚨 INDICADOR VISUAL: Contador de caracteres para Nombre (Máx 50) 🚨 */}
                  <span className={`text-[10px] font-bold ${formData.nombre.length >= 50 ? 'text-rose-500' : 'text-gray-400'}`}>
                    {formData.nombre.length} / 50
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
                    maxLength={50} // 🚨 LÍMITE AÑADIDO
                    value={formData.nombre} 
                    onChange={handleInputChange} 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium" 
                    placeholder="Ej. Bebidas, Botanas..." 
                  />
                </div>
              </div>

              {/* Grid: Color y Orden */}
              <div className="grid grid-cols-2 gap-4">
                {/* Color Hex */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Color Tinta</label>
                  <div className="flex gap-2 items-center bg-gray-50 border border-gray-200 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                    <input 
                      type="color" 
                      name="colorHex" 
                      value={formData.colorHex} 
                      onChange={handleInputChange} 
                      className="h-9 w-10 p-0 border-0 rounded-lg cursor-pointer bg-transparent"
                    />
                    <input 
                      type="text" 
                      name="colorHex" 
                      value={formData.colorHex} 
                      onChange={handleInputChange} 
                      className="flex-1 w-full bg-transparent text-sm font-mono font-medium text-gray-700 focus:outline-none uppercase"
                    />
                  </div>
                </div>

                {/* Orden */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Posición</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                    </div>
                    <input type="number" name="orden" min="0" required value={formData.orden === 0 && !editingId ? '' : formData.orden} onChange={handleInputChange} className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium" placeholder="Ej. 1" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-2 border-t border-gray-100">
                <button type="submit" disabled={isSubmitting} className={`flex-1 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${isSubmitting ? 'bg-gray-400 shadow-none' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'}`}>
                  {editingId ? 'Guardar Cambios' : 'Registrar Sección'}
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
                <h2 className="text-lg font-bold text-gray-800">Secciones del POS</h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                  {filteredCategories.length} Registros {/* 🚨 Actualizado con data filtrada */}
                </span>
              </div>

              {/* 🚨 CAMPO DE BÚSQUEDA 🚨 */}
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar categoría..." 
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>
            
            {error && <p className="text-rose-500 font-bold p-4 bg-rose-50 m-4 rounded-xl text-sm">{error}</p>}
            
            <div className="flex-1 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-20 text-gray-500 font-bold">Cargando catálogo...</div>
              ) : filteredCategories.length === 0 ? (
                <div className="flex flex-col justify-center items-center py-20 text-gray-400 px-4 text-center">
                  <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  <p className="font-medium text-sm">
                    {searchTerm 
                      ? `No se encontraron categorías con "${searchTerm}"` 
                      : 'Aún no hay categorías registradas.'
                    }
                  </p>
                </div>
              ) : (
                <table className="min-w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-white">
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="px-6 py-4 w-16 text-center">Posición</th>
                      <th className="px-6 py-4">Apariencia / Nombre</th>
                      <th className="px-6 py-4 text-right">Gestión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {/* 🚨 Usando currentCategories (lista filtrada) 🚨 */}
                    {currentCategories.map(cat => (
                      <tr key={cat.id} className="hover:bg-gray-50/80 transition-colors group">
                        
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-black text-xs">
                            {cat.orden}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center" 
                              style={{ backgroundColor: cat.colorHex || '#ccc' }}
                            >
                              <span className="text-white text-xs font-black mix-blend-overlay opacity-50">{cat.nombre.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm truncate max-w-[200px]" title={cat.nombre}>{cat.nombre}</p>
                              <p className="text-[10px] font-mono text-gray-400 uppercase">{cat.colorHex}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => startEdit(cat)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors inline-flex" title="Editar">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => setDeleteModal({ isOpen: true, catId: cat.id, catName: cat.nombre })} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex" title="Eliminar">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* PAGINADOR */}
            {filteredCategories.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500">
                  Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredCategories.length)} de {filteredCategories.length}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i} onClick={() => paginate(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
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