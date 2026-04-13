import React, { useState, useEffect } from 'react';
import streetposApi from '../api/axiosConfig';
import type { Category } from '../types/category';

export const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado alineado con tu payload del POST
  const [formData, setFormData] = useState({
    nombre: '',
    colorHex: '#2563EB', // Un color por defecto (azul)
    orden: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await streetposApi.get('/Categories');
      // Ordenamos las categorías por el campo "orden" de menor a mayor al recibirlas
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
      // Si es un número, lo parseamos para no mandar un string al backend
      [name]: type === 'number' ? Number(value) : value 
    });
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({ 
      nombre: category.nombre, 
      colorHex: category.colorHex || '#2563EB',
      orden: category.orden || 0
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ nombre: '', colorHex: '#2563EB', orden: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await streetposApi.put(`/Categories/${editingId}`, formData);
        alert('Categoría actualizada');
      } else {
        await streetposApi.post('/Categories', formData);
        alert('Categoría creada');
      }
      cancelEdit();
      fetchCategories();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || 'Fallo en la operación'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      await streetposApi.delete(`/Categories/${id}`);
      fetchCategories();
    } catch (err: any) {
      alert('Error al eliminar');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Categorías</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Lado Izquierdo: Formulario Básico */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200 h-fit">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  name="nombre" 
                  required 
                  value={formData.nombre} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color (Hexadecimal)</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    name="colorHex" 
                    value={formData.colorHex} 
                    onChange={handleInputChange} 
                    className="h-10 w-10 p-1 border border-gray-300 rounded cursor-pointer"
                  />
                  <input 
                    type="text" 
                    name="colorHex" 
                    value={formData.colorHex} 
                    onChange={handleInputChange} 
                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden de visualización</label>
                <input 
                  type="number" 
                  name="orden" 
                  min="0"
                  required
                  value={formData.orden} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Lado Derecho: Tabla Básica */}
          <div className="md:col-span-2 bg-white p-6 rounded shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Listado de Categorías</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            
            {loading ? (
              <p>Cargando datos...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="py-2 text-gray-600 font-medium w-16">Orden</th>
                      <th className="py-2 text-gray-600 font-medium">Color</th>
                      <th className="py-2 text-gray-600 font-medium">Nombre</th>
                      <th className="py-2 text-right text-gray-600 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(cat => (
                      <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-500">{cat.orden}</td>
                        <td className="py-3">
                          {/* Circulito de color para visualizar el Hex */}
                          <div 
                            className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" 
                            style={{ backgroundColor: cat.colorHex || '#ccc' }}
                            title={cat.colorHex}
                          ></div>
                        </td>
                        <td className="py-3 font-medium text-gray-800">{cat.nombre}</td>
                        <td className="py-3 text-right space-x-3">
                          <button onClick={() => startEdit(cat)} className="text-blue-600 hover:underline text-sm">Editar</button>
                          <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:underline text-sm">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-gray-500">No hay categorías registradas.</td>
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