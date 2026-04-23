import React, { useState, useEffect } from 'react';
import streetposApi from '../api/axiosConfig';
import type { Tenant } from '../types/tenant';

export const TenantManagement = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // ESTADOS DE PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // ESTADOS DE UI/UX (TOAST Y MODAL)
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; tenant: Tenant | null; action: 'suspend' | 'reactivate' }>({
    isOpen: false,
    tenant: null,
    action: 'suspend'
  });

  const [formData, setFormData] = useState({
    nombre: '',
    nombreTitular: '', 
    emailContacto: '',
    passwordInicial: '' 
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await streetposApi.get('/Tenants');
      setTenants(response.data);
    } catch (err: any) {
      setError('Error al cargar la cartera de clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const startEdit = (tenant: Tenant) => {
    setEditingId(tenant.id);
    setFormData({ 
      nombre: tenant.nombre, 
      nombreTitular: tenant.nombreTitular || '', 
      emailContacto: tenant.emailContacto || '',
      passwordInicial: '' 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ nombre: '', nombreTitular: '', emailContacto: '', passwordInicial: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        const tenantActual = tenants.find(t => t.id === editingId);
        await streetposApi.put(`/Tenants/${editingId}`, {
          nombre: formData.nombre,
          nombreTitular: formData.nombreTitular,
          emailContacto: formData.emailContacto,
          estaActivo: tenantActual?.estaActivo ?? true
        });
        showToast('Empresa actualizada correctamente', 'success');
      } else {
        await streetposApi.post('/Tenants', formData);
        showToast('Empresa y cuenta de Administrador registradas', 'success');
      }
      cancelEdit();
      fetchTenants();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Fallo en la operación', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abre el Modal
  const requestToggleStatus = (tenant: Tenant) => {
    setConfirmModal({
      isOpen: true,
      tenant,
      action: tenant.estaActivo ? 'suspend' : 'reactivate'
    });
  };

  // Ejecuta la acción cuando el usuario confirma en el Modal
  const executeToggleStatus = async () => {
    if (!confirmModal.tenant) return;
    
    try {
      await streetposApi.put(`/Tenants/${confirmModal.tenant.id}`, {
        nombre: confirmModal.tenant.nombre,
        nombreTitular: confirmModal.tenant.nombreTitular,
        emailContacto: confirmModal.tenant.emailContacto,
        estaActivo: !confirmModal.tenant.estaActivo 
      });
      showToast(`Empresa ${confirmModal.action === 'suspend' ? 'suspendida' : 'reactivada'} correctamente`, 'success');
      fetchTenants();
    } catch (err: any) {
      showToast('Error al cambiar el estado de la empresa', 'error');
    } finally {
      setConfirmModal({ isOpen: false, tenant: null, action: 'suspend' });
    }
  };

  // LÓGICA DE PAGINACIÓN
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTenants = tenants.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(tenants.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen relative">
      
      {/* ==========================================
          COMPONENTES FLOTANTES (TOAST Y MODAL)
          ========================================== */}
      
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

      {/* MODAL DE CONFIRMACIÓN */}
      {confirmModal.isOpen && confirmModal.tenant && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 text-center">
              <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${confirmModal.action === 'suspend' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {confirmModal.action === 'suspend' ? (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                ) : (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {confirmModal.action === 'suspend' ? '¿Suspender Cuenta?' : '¿Reactivar Cuenta?'}
              </h3>
              <p className="text-sm text-gray-500 px-4">
                Estás a punto de {confirmModal.action === 'suspend' ? 'bloquear' : 'restaurar'} el acceso al sistema para la empresa <span className="font-bold text-gray-800">{confirmModal.tenant.nombre}</span>. 
                {confirmModal.action === 'suspend' && ' Sus usuarios no podrán iniciar sesión.'}
              </p>
            </div>
            <div className="flex bg-gray-50 p-4 gap-3">
              <button onClick={() => setConfirmModal({ isOpen: false, tenant: null, action: 'suspend' })} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-100 transition-all">Cancelar</button>
              <button onClick={executeToggleStatus} className={`flex-1 px-4 py-3 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 ${confirmModal.action === 'suspend' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'}`}>
                {confirmModal.action === 'suspend' ? 'Sí, Suspender' : 'Sí, Reactivar'}
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="max-w-7xl mx-auto">
        {/* Cabecera */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Onboarding de Clientes</h1>
          <p className="mt-1 text-sm text-gray-500">Da de alta nuevas empresas y controla sus accesos a StreetPOS.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* ==========================================
              LADO IZQUIERDO: FORMULARIO
              ========================================== */}
          <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all duration-300 h-fit ${editingId ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${editingId ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                {editingId ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Actualizar Datos' : 'Registrar Empresa'}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Input: Nombre Empresa */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Nombre Comercial</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <input type="text" name="nombre" required value={formData.nombre} onChange={handleInputChange} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium" placeholder="Ej. Abarrotes San Juan" />
                </div>
              </div>

              {/* Input: Titular */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Nombre del Dueño</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <input type="text" name="nombreTitular" required value={formData.nombreTitular} onChange={handleInputChange} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium" placeholder="Ej. Juan Pérez" />
                </div>
              </div>
              
              {/* Input: Email */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Correo Corporativo</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <input type="email" name="emailContacto" required value={formData.emailContacto} onChange={handleInputChange} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium" placeholder="admin@empresa.com" />
                </div>
              </div>

              {/* Input: Password (Solo al Crear) */}
              {!editingId && (
                <div className="pt-2 border-t border-gray-100">
                  {/* 🚨 ETIQUETA Y CONTADOR 🚨 */}
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Contraseña Temporal</label>
                    <span className={`text-[10px] font-bold transition-colors ${formData.passwordInicial.length >= 64 ? 'text-rose-500' : 'text-gray-400'}`}>
                      {formData.passwordInicial.length}/64
                    </span>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    {/* 🚨 MAXLENGTH AÑADIDO (64) 🚨 */}
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="passwordInicial" 
                      required 
                      maxLength={64}
                      value={formData.passwordInicial} 
                      onChange={handleInputChange} 
                      className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono tracking-wider" 
                      placeholder="Temp2026*" 
                    />
                    {/* Botón Ojito */}
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors">
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 font-bold">Se solicitará cambio al ingresar por primera vez.</p>
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-2">
                <button type="submit" disabled={isSubmitting} className={`flex-1 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${isSubmitting ? 'bg-gray-400 shadow-none' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'}`}>
                  {editingId ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="px-5 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ==========================================
              LADO DERECHO: TABLA Y PAGINACIÓN
              ========================================== */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800">Cartera Activa</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                {tenants.length} Clientes
              </span>
            </div>
            
            {error && <p className="text-rose-500 font-bold p-4 bg-rose-50 m-4 rounded-xl text-sm">{error}</p>}
            
            <div className="flex-1 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-20 text-gray-500 font-bold">Cargando base de datos...</div>
              ) : tenants.length === 0 ? (
                <div className="flex flex-col justify-center items-center py-20 text-gray-400">
                  <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <p>No tienes empresas registradas.</p>
                </div>
              ) : (
                <table className="min-w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-white">
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="px-6 py-4">Empresa / Titular</th>
                      <th className="px-6 py-4">Contacto</th>
                      <th className="px-6 py-4 text-center">Estado</th>
                      <th className="px-6 py-4 text-right">Gestión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentTenants.map(tenant => (
                      <tr key={tenant.id} className={`hover:bg-gray-50/80 transition-colors group ${!tenant.estaActivo ? 'opacity-60' : ''}`}>
                        
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900 text-sm">{tenant.nombre}</p>
                          <p className="text-xs text-gray-500 font-medium flex items-center mt-1">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            {tenant.nombreTitular || 'N/A'}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md inline-block">
                            {tenant.emailContacto}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${tenant.estaActivo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {tenant.estaActivo ? 'Operativo' : 'Suspendido'}
                          </span>
                        </td>

                        {/* ACCIONES: EDITAR Y TOGGLE SWITCH */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => startEdit(tenant)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            
                            {/* TOGGLE SWITCH */}
                            <button 
                              onClick={() => requestToggleStatus(tenant)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${tenant.estaActivo ? 'bg-emerald-500' : 'bg-gray-300'}`}
                              title={tenant.estaActivo ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                            >
                              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${tenant.estaActivo ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ==========================================
                PAGINADOR
                ========================================== */}
            {tenants.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500">
                  Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, tenants.length)} de {tenants.length}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i} onClick={() => paginate(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
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