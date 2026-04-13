import React, { useState, useEffect } from 'react';
import streetposApi from '../api/axiosConfig';
import type { Product } from '../types/product';
import type { Category } from '../types/category'; // Reutilizamos el tipo que ya tenías

export const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado alineado con tu payload del POST de Swagger
  const [formData, setFormData] = useState({
    nombre: '',
    precioCompra: 0,
    precioVenta: 0,
    categoriaId: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Cargamos productos Y categorías al mismo tiempo
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        streetposApi.get('/Products'),
        streetposApi.get('/Categories')
      ]);
      
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (err: any) {
      setError('Error al cargar los datos del catálogo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({ 
      ...formData, 
      // Parseamos a número los precios para que no mande strings al backend
      [name]: type === 'number' ? Number(value) : value 
    });
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({ 
      nombre: product.nombre, 
      precioCompra: product.precioCompra || 0,
      precioVenta: product.precioVenta || 0,
      categoriaId: product.categoriaId || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ nombre: '', precioCompra: 0, precioVenta: 0, categoriaId: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación rápida: Que haya seleccionado una categoría
    if (!formData.categoriaId) {
      alert("Por favor selecciona una categoría válida.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await streetposApi.put(`/Products/${editingId}`, formData);
        alert('Producto actualizado');
      } else {
        await streetposApi.post('/Products', formData);
        alert('Producto registrado');
      }
      cancelEdit();
      // Recargamos solo los productos
      const response = await streetposApi.get('/Products');
      setProducts(response.data);
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || 'Fallo en la operación'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await streetposApi.delete(`/Products/${id}`);
      const response = await streetposApi.get('/Products');
      setProducts(response.data);
    } catch (err: any) {
      alert('Error al eliminar el producto');
    }
  };

  // Función de ayuda para mostrar el nombre de la categoría en la tabla en lugar del ID
  const getCategoryName = (id: string) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.nombre : 'Sin Categoría';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Productos</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Lado Izquierdo: Formulario */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200 h-fit">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                <input 
                  type="text" 
                  name="nombre" 
                  required 
                  value={formData.nombre} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  placeholder="Ej. Coca Cola 600ml"
                />
              </div>

              {/* Select de Categorías */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select 
                  name="categoriaId" 
                  required
                  value={formData.categoriaId} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="" disabled>-- Selecciona una categoría --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Compra</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input 
                      type="number" 
                      name="precioCompra" 
                      min="0"
                      step="0.01"
                      required
                      value={formData.precioCompra} 
                      onChange={handleInputChange} 
                      className="w-full pl-7 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input 
                      type="number" 
                      name="precioVenta" 
                      min="0"
                      step="0.01"
                      required
                      value={formData.precioVenta} 
                      onChange={handleInputChange} 
                      className="w-full pl-7 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4 pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
                  {editingId ? 'Actualizar Producto' : 'Guardar Producto'}
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
              <h2 className="text-lg font-semibold">Listado de Productos</h2>
              <span className="text-sm text-gray-500">{products.length} registrados</span>
            </div>
            
            {error && <p className="text-red-500 mb-4">{error}</p>}
            
            {loading ? (
              <p className="text-gray-500">Cargando inventario...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="py-2 text-gray-600 font-medium">Producto</th>
                      <th className="py-2 text-gray-600 font-medium">Categoría</th>
                      <th className="py-2 text-gray-600 font-medium text-right">Compra</th>
                      <th className="py-2 text-gray-600 font-medium text-right">Venta</th>
                      <th className="py-2 text-right text-gray-600 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(prod => (
                      <tr key={prod.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-800">{prod.nombre}</td>
                        <td className="py-3">
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            {getCategoryName(prod.categoriaId)}
                          </span>
                        </td>
                        <td className="py-3 text-right text-gray-600">${prod.precioCompra.toFixed(2)}</td>
                        <td className="py-3 text-right font-medium text-blue-600">${prod.precioVenta.toFixed(2)}</td>
                        <td className="py-3 text-right space-x-3">
                          <button onClick={() => startEdit(prod)} className="text-blue-600 hover:underline text-sm">Editar</button>
                          <button onClick={() => handleDelete(prod.id)} className="text-red-600 hover:underline text-sm">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          No hay productos registrados. Selecciona una categoría y crea tu primer producto.
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