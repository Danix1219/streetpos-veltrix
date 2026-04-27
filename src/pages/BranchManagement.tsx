import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import type { Branch, CreateBranchDto, UpdateBranchDto } from '../types/branch';

export const BranchManagement = () => {
  const { token } = useContext(AuthContext); // Extraemos el JWT del contexto
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Estados del Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefonoContacto: '',
    estaActiva: true
  });

  // URL Base de tu API (ajusta según tu entorno)
  const API_URL = 'https://streetpos.bsite.net/api/Branches'; 

  // ==========================================
  // CARGAR SUCURSALES (GET)
  // ==========================================
  const fetchBranches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al cargar las sucursales');
      const data = await response.json();
      setBranches(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // ==========================================
  // MANEJO DEL FORMULARIO Y MODAL
  // ==========================================
  const openModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        nombre: branch.nombre,
        direccion: branch.direccion || '',
        telefonoContacto: branch.telefonoContacto || '',
        estaActiva: branch.estaActiva
      });
    } else {
      setEditingBranch(null);
      setFormData({ nombre: '', direccion: '', telefonoContacto: '', estaActiva: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ==========================================
  // GUARDAR SUCURSAL (POST / PUT)
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (editingBranch) {
        // ACTUALIZAR (PUT)
        const updateDto: UpdateBranchDto = { ...formData };
        const response = await fetch(`${API_URL}/${editingBranch.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateDto)
        });
        if (!response.ok) throw new Error('Error al actualizar la sucursal');
      } else {
        // CREAR NUEVA (POST)
        const createDto: CreateBranchDto = { 
          nombre: formData.nombre,
          direccion: formData.direccion,
          telefonoContacto: formData.telefonoContacto
        };
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(createDto)
        });
        if (!response.ok) throw new Error('Error al crear la sucursal');
      }

      closeModal();
      fetchBranches(); // Recargamos la tabla
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Sucursales</h1>
          <p className="text-sm text-gray-500">Administra las ubicaciones físicas de tu negocio.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          + Nueva Sucursal
        </button>
      </div>

      {/* Alertas de Error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">
          {error}
        </div>
      )}

      {/* Tabla de Sucursales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Nombre</th>
                <th className="p-4 font-semibold">Dirección</th>
                <th className="p-4 font-semibold">Contacto</th>
                <th className="p-4 font-semibold text-center">Estado</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && branches.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Cargando sucursales...</td></tr>
              ) : branches.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay sucursales registradas.</td></tr>
              ) : (
                branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{branch.nombre}</td>
                    <td className="p-4 text-gray-600 truncate max-w-xs">{branch.direccion || '-'}</td>
                    <td className="p-4 text-gray-600">{branch.telefonoContacto || '-'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${branch.estaActiva ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {branch.estaActiva ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => openModal(branch)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Sucursal *</label>
                <input 
                  type="text" 
                  name="nombre" 
                  required 
                  value={formData.nombre} 
                  onChange={handleInputChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ej. Sucursal Norte"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input 
                  type="text" 
                  name="direccion" 
                  value={formData.direccion} 
                  onChange={handleInputChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Calle, Número, Colonia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de Contacto</label>
                <input 
                  type="text" 
                  name="telefonoContacto" 
                  value={formData.telefonoContacto} 
                  onChange={handleInputChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ej. 55 1234 5678"
                />
              </div>

              {/* El switch de Activo/Inactivo solo tiene sentido al editar */}
              {editingBranch && (
                <div className="flex items-center mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <input 
                    type="checkbox" 
                    name="estaActiva" 
                    id="estaActiva"
                    checked={formData.estaActiva} 
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="estaActiva" className="ml-2 block text-sm font-medium text-gray-900 cursor-pointer">
                    Sucursal Activa (Operativa)
                  </label>
                </div>
              )}

              <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Guardando...' : 'Guardar Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};