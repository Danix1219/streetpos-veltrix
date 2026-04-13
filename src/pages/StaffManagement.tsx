import React, { useState, useEffect } from 'react';
import streetposApi from '../api/axiosConfig';
import type { User } from '../types/user';

export const StaffManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  // Eliminamos 'loading' y 'error' porque no se pintaban en la pantalla
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ESTADOS PARA UI/UX (Modales y Toasts)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; userId: string; userName: string }>({
    isOpen: false,
    userId: '',
    userName: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'Cajero'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    try {
      const response = await streetposApi.get('/Users');
      setUsers(response.data);
    } catch (err: any) {
      // En lugar de usar un estado de error inactivo, disparamos tu Toast rojo
      showToast('Error al cargar el personal', 'error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({ nombre: user.nombre, email: user.email, password: '', rol: user.rol });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ nombre: '', email: '', password: '', rol: 'Cajero' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await streetposApi.put(`/Users/${editingId}`, {
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol
        });
        showToast('¡Datos actualizados correctamente!');
      } else {
        await streetposApi.post('/Users', formData);
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* --- COMPONENTE TOAST (Notificación flotante) --- */}
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

      {/* --- MODAL DE ELIMINACIÓN (Confirmación Custom) --- */}
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestión de Personal</h1>
        <p className="mt-2 text-sm text-gray-500">Administra los accesos y roles de tu equipo de trabajo.</p>
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
              <input type="text" name="nombre" required value={formData.nombre} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Juan Pérez" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Correo Electrónico</label>
              <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="ejemplo@streetpos.com" />
            </div>
            {!editingId && (
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
                <input type="password" name="password" required value={formData.password} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="••••••••" />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Rol</label>
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
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Equipo de Trabajo</h2>
            <span className="bg-blue-50 text-blue-700 py-1.5 px-4 rounded-full text-xs font-black uppercase tracking-wider">{users.length} Registrados</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Empleado</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Rol</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="group hover:bg-blue-50/40 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md transition-transform group-hover:scale-110">
                          {user.nombre.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{user.nombre}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${user.rol === 'SuperAdmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button onClick={() => startEdit(user)} className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                      {user.rol !== 'SuperAdmin' && (
                        <button onClick={() => setDeleteModal({ isOpen: true, userId: user.id, userName: user.nombre })} className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};