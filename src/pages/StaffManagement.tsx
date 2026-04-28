import React, { useState, useEffect } from 'react';
import streetposApi from '../api/axiosConfig';
import type { User } from '../types/user';
// 🚨 IMPORTAMOS EL TIPO DE SUCURSAL 🚨
import type { Branch } from '../types/branch';

export const StaffManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  // 🚨 ESTADO PARA ALMACENAR LAS SUCURSALES DISPONIBLES 🚨
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; userId: string; userName: string }>({
    isOpen: false,
    userId: '',
    userName: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // 🚨 AÑADIMOS branchId AL ESTADO DEL FORMULARIO 🚨
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'Cajero',
    branchId: '' 
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 🚨 DESCARGAMOS USUARIOS Y SUCURSALES AL MISMO TIEMPO 🚨
  const fetchInitialData = async () => {
    try {
      const [usersRes, branchesRes] = await Promise.all([
        streetposApi.get('/Users'),
        streetposApi.get('/Branches')
      ]);
      setUsers(usersRes.data);
      setBranches(branchesRes.data);
    } catch (err: any) {
      showToast('Error al cargar la información del sistema', 'error');
    }
  };

  // Función ligera solo para recargar la tabla después de guardar/eliminar
  const fetchUsers = async () => {
    try {
      const response = await streetposApi.get('/Users');
      setUsers(response.data);
    } catch (err: any) {
      showToast('Error al actualizar la tabla', 'error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({ 
      nombre: user.nombre, 
      email: user.email, 
      password: '', 
      rol: user.rol,
      branchId: user.branchId || '' // 🚨 Carga la sucursal actual
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ nombre: '', email: '', password: '', rol: 'Cajero', branchId: '' });
    setShowPassword(false); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 🚨 PREPARAMOS EL PAYLOAD CON LA SUCURSAL 🚨
    const payloadToSave = {
      nombre: formData.nombre,
      email: formData.email,
      rol: formData.rol,
      password: formData.password,
      branchId: formData.branchId === '' ? null : formData.branchId
    };

    try {
      if (editingId) {
        await streetposApi.put(`/Users/${editingId}`, payloadToSave);
        showToast('¡Datos actualizados correctamente!');
      } else {
        await streetposApi.post('/Users', payloadToSave);
        showToast('¡Empleado registrado con éxito!');
      }
      cancelEdit();
      await fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error en la operación', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await streetposApi.delete(`/Users/${deleteModal.userId}`);
      showToast('Empleado eliminado del sistema');
      setDeleteModal({ ...deleteModal, isOpen: false });
      await fetchUsers();
    } catch (err: any) {
      showToast('No se pudo eliminar al empleado', 'error');
    }
  };

  const filteredUsers = users.filter(user => 
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 relative">
      
      {/* --- COMPONENTE TOAST --- */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center p-4 mb-4 text-white rounded-2xl shadow-2xl animate-bounce-short ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg mr-3">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
          <div className="text-sm font-bold mr-2">{toast.message}</div>
        </div>
      )}

      {/* --- MODAL DE ELIMINACIÓN --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-rose-100 mb-4">
                <svg className="h-10 w-10 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar empleado?</h3>
              <p className="text-sm text-gray-500 px-4">Estás a punto de dar de baja a <span className="font-bold text-gray-800">{deleteModal.userName}</span>. Esta acción no se puede revertir.</p>
            </div>
            <div className="flex bg-gray-50 p-4 gap-3">
              <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-100 transition-all">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-3 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Encabezado del Panel */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Gestión de Personal</h1>
            <p className="mt-1 text-sm text-gray-500">Administra los accesos y sucursales de tu equipo de trabajo.</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA: Formulario */}
        <div className={`bg-white p-6 rounded-2xl shadow-sm border h-fit transition-all duration-500 ${editingId ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-200'}`}>
          <div className="flex items-center mb-6">
            <div className={`p-2 rounded-xl mr-3 transition-colors ${editingId ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Actualizar Datos' : 'Nuevo Empleado'}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Nombre */}
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-semibold text-gray-700">Nombre Completo</label>
                <span className={`text-[10px] font-bold ${formData.nombre.length >= 100 ? 'text-rose-500' : 'text-gray-400'}`}>
                  {formData.nombre.length} / 100
                </span>
              </div>
              <input 
                type="text" 
                name="nombre" 
                required 
                maxLength={100}
                value={formData.nombre} 
                onChange={handleInputChange} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="Juan Pérez" 
              />
            </div>
            
            {/* Email */}
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-semibold text-gray-700">Correo Electrónico</label>
                <span className={`text-[10px] font-bold ${formData.email.length >= 100 ? 'text-rose-500' : 'text-gray-400'}`}>
                  {formData.email.length} / 100
                </span>
              </div>
              <input 
                type="email" 
                name="email" 
                required 
                maxLength={100}
                value={formData.email} 
                onChange={handleInputChange} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="ejemplo@streetpos.com" 
              />
            </div>

            {/* Contraseña */}
            {!editingId && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-semibold text-gray-700">Contraseña</label>
                  <span className={`text-[10px] font-bold transition-colors ${formData.password.length >= 64 ? 'text-rose-500' : 'text-gray-400'}`}>
                    {formData.password.length} / 64
                  </span>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    required 
                    maxLength={64}
                    value={formData.password} 
                    onChange={handleInputChange} 
                    className="w-full px-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    placeholder="••••••••" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors">
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 🚨 NUEVO: SUCURSAL 🚨 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Sucursal Asignada</label>
              <select 
                name="branchId" 
                value={formData.branchId} 
                onChange={handleInputChange} 
                required={formData.rol !== 'SuperAdmin'}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="" disabled>-- Selecciona una Sucursal --</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.nombre}</option>
                ))}
              </select>
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Rol en el Sistema</label>
              <select name="rol" value={formData.rol} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer">
                <option value="Cajero">Cajero (Ventas)</option>
                <option value="Admin">Gerente (Admin)</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:bg-blue-400">
                {isSubmitting ? 'Cargando...' : editingId ? 'Guardar Cambios' : 'Registrar'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="px-5 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all">Cancelar</button>
              )}
            </div>
          </form>
        </div>

        {/* COLUMNA DERECHA: Tabla */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-800">Equipo de Trabajo</h2>
              <span className="bg-blue-50 text-blue-700 py-1.5 px-4 rounded-full text-xs font-black uppercase tracking-wider">
                {filteredUsers.length} Registrados
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
                placeholder="Buscar empleado o correo..." 
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col justify-center items-center py-20 text-gray-400 px-4 text-center">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <p className="font-medium text-sm">
                  {searchTerm 
                    ? `No se encontró personal que coincida con "${searchTerm}"` 
                    : 'Aún no hay personal registrado.'
                  }
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Empleado</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Ubicación / Rol</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-blue-50/40 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md transition-transform group-hover:scale-110">
                            {user.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900 truncate max-w-[150px] sm:max-w-[200px]" title={user.nombre}>{user.nombre}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[150px] sm:max-w-[200px]" title={user.email}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {/* 🚨 MOSTRAMOS SUCURSAL Y ROL 🚨 */}
                        <div className="flex flex-col items-start gap-1.5">
                          <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1 border border-gray-200 truncate max-w-[150px]" title={user.branchName || 'Matriz'}>
                            <svg className="w-3 h-3 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            {user.branchName || 'Matriz'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${user.rol === 'SuperAdmin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                            {user.rol}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <button onClick={() => startEdit(user)} className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl transition-all" title="Editar">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        {user.rol !== 'SuperAdmin' && (
                          <button onClick={() => setDeleteModal({ isOpen: true, userId: user.id, userName: user.nombre })} className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Eliminar">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};