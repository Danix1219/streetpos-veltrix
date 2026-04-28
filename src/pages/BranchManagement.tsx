import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import type { Branch, CreateBranchDto, UpdateBranchDto } from '../types/branch';

export const BranchManagement = () => {
  const { token } = useContext(AuthContext); 
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para Búsqueda y Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Todas' | 'Activas' | 'Inactivas'>('Todas');

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

  const API_URL = 'https://streetpos.bsite.net/api/Branches'; 

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (editingBranch) {
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
      fetchBranches(); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de Filtro y Búsqueda Inteligente
  const filteredBranches = branches.filter(branch => {
    const matchSearch = branch.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (branch.direccion && branch.direccion.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchStatus = filterStatus === 'Todas' || 
                        (filterStatus === 'Activas' && branch.estaActiva) || 
                        (filterStatus === 'Inactivas' && !branch.estaActiva);
    
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen relative">
      
      {/* ==========================================
          HEADER COMPACTO
          ========================================== */}
      <div className="flex flex-col gap-5 mb-8">
        
        {/* Título */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-blue-100 text-blue-600 rounded-xl shadow-sm shrink-0">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">Gestión de Sucursales</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Administra las ubicaciones físicas y operativas.</p>
          </div>
        </div>

        {/* Buscador y Botón en la misma fila */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              placeholder="Buscar sucursal o dirección..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-700 shadow-sm transition-all"
            />
          </div>

          {/* Botón de Añadir (Cuadrado en móvil, texto en PC) */}
          <button 
            onClick={() => openModal()}
            className="h-[46px] w-[46px] sm:w-auto sm:px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95 shrink-0"
            title="Nueva Sucursal"
          >
            <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">Nueva Sucursal</span>
          </button>
        </div>

        {/* Filtros Rápidos (Scroll horizontal en móviles) */}
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {['Todas', 'Activas', 'Inactivas'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap
                ${filterStatus === status ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 bg-gray-200/30'}`}
            >
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

      {/* Contador */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
          {filteredBranches.length} {filteredBranches.length === 1 ? 'Sucursal' : 'Sucursales'}
        </p>
      </div>

      {/* ==========================================
          GRID DE SUCURSALES (Tarjetas Compactas)
          ========================================== */}
      {isLoading && branches.length === 0 ? (
        <div className="flex justify-center items-center py-20 text-gray-500 font-bold text-sm">
          <svg className="animate-spin h-6 w-6 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Cargando sucursales...
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-10 sm:p-12 text-center shadow-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">No hay sucursales para mostrar</h3>
          <p className="text-gray-500 text-xs sm:text-sm max-w-xs mx-auto">Intenta cambiar los filtros de búsqueda o agrega una nueva sucursal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredBranches.map(branch => (
            <div 
              key={branch.id} 
              className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col group relative
                ${branch.estaActiva 
                  ? 'border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5' 
                  : 'border-gray-200 opacity-80 hover:opacity-100 hover:border-gray-300 hover:shadow-lg'}`}
            >
              <div className="p-4 sm:p-5 flex-1 flex flex-col relative z-10">
                
                {/* Cabecera del Card: Icono + Status */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm
                    ${branch.estaActiva ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border flex items-center gap-1 
                    ${branch.estaActiva ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${branch.estaActiva ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                    {branch.estaActiva ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {/* Título */}
                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-3 truncate group-hover:text-blue-700 transition-colors">
                  {branch.nombre}
                </h3>
                
                {/* Detalles (Apilados y compactos) */}
                <div className="space-y-2 mb-5 flex-1">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-gray-600 line-clamp-2 leading-snug">
                      {branch.direccion || <span className="italic opacity-70">Ubicación no registrada</span>}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-gray-600">
                      {branch.telefonoContacto || <span className="italic opacity-70">Sin teléfono</span>}
                    </span>
                  </div>
                </div>

                {/* Botón de Acción */}
                <button 
                  onClick={() => openModal(branch)}
                  className="w-full mt-auto py-2 sm:py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs sm:text-sm font-bold text-gray-600 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Sucursal
                </button>

              </div>
              
              {/* Deco inferior sutil */}
              <div className={`h-1 w-full transition-colors ${branch.estaActiva ? 'bg-blue-500 group-hover:bg-blue-600' : 'bg-gray-300'}`}></div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORMULARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            
            <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black bg-blue-100 text-blue-600">
                    {editingBranch ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    )}
                 </div>
                 <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
                   {editingBranch ? 'Actualizar Sucursal' : 'Nueva Sucursal'}
                 </h2>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 bg-gray-200/50 hover:bg-gray-200 rounded-full p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5">
              
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Nombre de la Sucursal *</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <input 
                    type="text" 
                    name="nombre" 
                    required 
                    value={formData.nombre} 
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="Ej. Sucursal Norte"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Dirección Física</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    name="direccion" 
                    value={formData.direccion} 
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="Calle, Número, Colonia..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Teléfono de Contacto</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    name="telefonoContacto" 
                    value={formData.telefonoContacto} 
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="Ej. 55 1234 5678"
                  />
                </div>
              </div>

              {editingBranch && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Estado Operativo</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">¿Esta sucursal está funcionando?</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="estaActiva" 
                      checked={formData.estaActiva} 
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              )}

              <div className="pt-4 flex gap-3 mt-6">
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
                  {isLoading ? 'Guardando...' : editingBranch ? 'Guardar Cambios' : 'Añadir Sucursal'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};