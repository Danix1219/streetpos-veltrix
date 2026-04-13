import React, { useState, useEffect } from 'react';
import streetposApi from '../api/axiosConfig';
import type { Tenant } from '../types/tenant';

export const TenantManagement = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado alineado con tu payload del POST/PUT de Swagger
  const [formData, setFormData] = useState({
    nombre: '',
    emailContacto: ''
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await streetposApi.get('/Tenants');
      setTenants(response.data);
    } catch (err: any) {
      setError('Error al cargar las empresas (Tenants)');
      console.error(err);
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
      emailContacto: tenant.emailContacto || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ nombre: '', emailContacto: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        await streetposApi.put(`/Tenants/${editingId}`, formData);
        alert('Empresa actualizada correctamente');
      } else {
        await streetposApi.post('/Tenants', formData);
        alert('Empresa registrada correctamente');
      }
      cancelEdit();
      fetchTenants();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || 'Fallo en la operación'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta empresa? Esto podría afectar a todos sus usuarios y datos asociados.')) return;
    try {
      await streetposApi.delete(`/Tenants/${id}`);
      fetchTenants();
    } catch (err: any) {
      alert('Error al eliminar la empresa');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Empresas (Tenants)</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Lado Izquierdo: Formulario */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200 h-fit">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Editar Empresa' : 'Nueva Empresa'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
                <input 
                  type="text" 
                  name="nombre" 
                  required 
                  value={formData.nombre} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  placeholder="Ej. Abarrotes San Juan"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contacto</label>
                <input 
                  type="email" 
                  name="emailContacto" 
                  required
                  value={formData.emailContacto} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  placeholder="contacto@empresa.com"
                />
              </div>

              <div className="flex flex-col gap-2 mt-4 pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
                  {editingId ? 'Actualizar Empresa' : 'Registrar Empresa'}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Lado Derecho: Tabla */}
          <div className="md:col-span-2 bg-white p-6 rounded shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Empresas Registradas</h2>
              <span className="text-sm text-gray-500">{tenants.length} en total</span>
            </div>
            
            {error && <p className="text-red-500 mb-4">{error}</p>}
            
            {loading ? (
              <p className="text-gray-500">Cargando empresas...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="py-2 text-gray-600 font-medium">Nombre</th>
                      <th className="py-2 text-gray-600 font-medium">Email de Contacto</th>
                      <th className="py-2 text-right text-gray-600 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map(tenant => (
                      <tr key={tenant.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-800">{tenant.nombre}</td>
                        <td className="py-3 text-gray-600">{tenant.emailContacto}</td>
                        <td className="py-3 text-right space-x-3">
                          <button onClick={() => startEdit(tenant)} className="text-blue-600 hover:underline text-sm">Editar</button>
                          <button onClick={() => handleDelete(tenant.id)} className="text-red-600 hover:underline text-sm">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                    {tenants.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-gray-500">
                          No hay empresas (Tenants) registradas en el sistema.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};