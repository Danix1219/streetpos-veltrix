import { useState, useEffect, useContext } from 'react';
import streetposApi from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import type { Product } from '../types/product';
import type { Category } from '../types/category';
import type { CartItem, SalePayload } from '../types/sale';

// 🚨 1. IMPORTAMOS NUESTRA BASE DE DATOS LOCAL 🚨
import { db } from '../db/db';

export const PointOfSale = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [notas, setNotas] = useState('');

  const { nombre } = useContext(AuthContext);

  // ==========================================
  // ESTADOS DE UI/UX (Toasts y Modales)
  // ==========================================
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; action: 'clear' | 'checkout' }>({
    isOpen: false,
    action: 'clear'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000); 
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🚨 2. MODIFICAMOS LA CARGA DE DATOS PARA LEER OFFLINE 🚨
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // A. Cargar productos desde IndexedDB (Rápido y Offline)
      const localProducts = await db.products.toArray();
      setProducts(localProducts);

      // B. Cargar categorías de la API, con respaldo en localStorage
      try {
        const catRes = await streetposApi.get('/Categories');
        const sortedCategories = catRes.data.sort((a: Category, b: Category) => (a.orden || 0) - (b.orden || 0));
        setCategories(sortedCategories);
        // Guardamos copia de seguridad por si luego se va el internet
        localStorage.setItem('streetpos_categories', JSON.stringify(sortedCategories));
      } catch (apiErr) {
        // Si falla (no hay internet), sacamos la copia de seguridad
        const cachedCats = localStorage.getItem('streetpos_categories');
        if (cachedCats) {
          setCategories(JSON.parse(cachedCats));
        } else {
          showToast('Modo offline sin categorías previas', 'info');
        }
      }
      
    } catch (err: any) {
      setError('Error al leer la base de datos local');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.product.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prevCart, { product, cantidad: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const newQuantity = item.cantidad + delta;
          return { ...item, cantidad: newQuantity > 0 ? newQuantity : 1 };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setNotas('');
    setMetodoPago('Efectivo');
    setIsMobileCartOpen(false); 
    setConfirmModal({ isOpen: false, action: 'clear' });
    showToast('Ticket vaciado', 'info');
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.precioVenta * item.cantidad), 0);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);

  // 🚨 3. FUNCIÓN AUXILIAR PARA GUARDAR LA VENTA LOCALMENTE 🚨
  const saveSaleOffline = async (payload: SalePayload) => {
    const offlineSale = {
      localId: crypto.randomUUID(), // Genera un ID temporal único
      sincronizado: 0,
      fechaLocal: new Date(),
      userId: payload.userId,
      metodoPago: payload.metodoPago,
      notas: payload.notas,
      items: payload.items
    };
    
    await db.offlineSales.add(offlineSale);
    showToast('¡Venta guardada en modo local! Se sincronizará pronto.', 'info');
  };

  // 🚨 4. MODIFICAMOS EL CHECKOUT PARA SOPORTAR MODO OFFLINE 🚨
  const handleCheckout = async () => {
    setIsSubmitting(true);
    setConfirmModal({ isOpen: false, action: 'checkout' }); 

    try {
      const payload: SalePayload = {
        userId: "3fa85f64-5717-4562-b3fc-2c963f66afa6", // Esto deberíamos sacarlo del AuthContext en un futuro
        metodoPago: metodoPago,
        notas: notas,
        items: cart.map(item => ({
          productId: item.product.id,
          cantidad: item.cantidad
        }))
      };

      if (navigator.onLine) {
        // Intenta enviarlo a la API real
        try {
          await streetposApi.post('/Sales', payload);
          showToast('¡Venta registrada con éxito!', 'success');
        } catch (apiError) {
          // Si hay internet pero el backend falló, guardamos local
          console.warn("Backend falló, guardando offline...");
          await saveSaleOffline(payload);
        }
      } else {
        // Si de plano no hay WiFi, guardamos local directo
        await saveSaleOffline(payload);
      }
      
      // Limpiamos carrito sin importar si fue online u offline
      setCart([]);
      setNotas('');
      setMetodoPago('Efectivo');
      setIsMobileCartOpen(false); 

    } catch (err: any) {
      showToast('Error crítico al procesar la venta', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  const productsByCategory: { [key: string]: Product[] } = {};
  filteredProducts.forEach(product => {
    if (!productsByCategory[product.categoriaId]) {
      productsByCategory[product.categoriaId] = [];
    }
    productsByCategory[product.categoriaId].push(product);
  });

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen relative overflow-hidden">
      
      {/* ==========================================
          COMPONENTES FLOTANTES (TOAST Y MODAL)
          ========================================== */}
      
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

      {/* MODAL DE CONFIRMACIÓN (Dual: Vaciar o Cobrar) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 text-center">
              <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 
                ${confirmModal.action === 'clear' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                {confirmModal.action === 'clear' ? (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                ) : (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {confirmModal.action === 'clear' ? '¿Vaciar Ticket?' : 'Confirmar Cobro'}
              </h3>
              <p className="text-sm text-gray-500 px-4">
                {confirmModal.action === 'clear' 
                  ? 'Estás a punto de borrar todos los artículos de la venta actual.' 
                  : `Vas a registrar una venta por $${calculateTotal().toFixed(2)} en ${metodoPago}.`}
              </p>
            </div>
            <div className="flex bg-gray-50 p-4 gap-3">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, action: 'clear' })} 
                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-100 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmModal.action === 'clear' ? clearCart : handleCheckout} 
                className={`flex-1 px-4 py-3 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 
                  ${confirmModal.action === 'clear' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'}`}
              >
                {confirmModal.action === 'clear' ? 'Sí, Vaciar' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="max-w-7xl mx-auto">
        
        {/* Cabecera del POS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 sm:mb-6 gap-4">
          <div className="flex items-center gap-3">
            {/* 🚨 ICONO AÑADIDO AQUÍ 🚨 */}
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl hidden sm:block">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Terminal de Venta</h1>
              <p className="text-xs sm:text-sm text-gray-500">Cajero en turno: <span className="font-semibold">{nombre || 'Usuario'}</span></p>
            </div>
          </div>
          <div className="text-right w-full sm:w-auto">
            {/* Indicador de caja visual, ahora nos servirá también para ver si estamos offline */}
            <span className={`px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm border inline-flex ${navigator.onLine ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${navigator.onLine ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              {navigator.onLine ? 'Caja Abierta' : 'Modo Offline'}
            </span>
          </div>
        </div>

        {error && <p className="text-rose-500 mb-4 bg-rose-50 p-3 rounded-xl border border-rose-100 font-bold text-sm">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ==========================================
              LADO IZQUIERDO: CATÁLOGO
              ========================================== */}
          <div className="lg:col-span-2 flex flex-col h-[calc(100vh-120px)] pb-24 lg:pb-0">
            <div className="bg-white p-3 sm:p-4 rounded-t-xl shadow-sm border-b border-gray-100 z-10">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar producto por nombre..." 
                  className="w-full pl-10 pr-3 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium text-gray-700 text-sm transition-all"
                />
              </div>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-b-xl shadow-sm flex-1 overflow-y-auto border border-t-0 border-gray-100">
              {loading ? (
                <div className="flex justify-center py-10"><p className="text-gray-500 font-bold flex items-center gap-2"><svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Cargando inventario...</p></div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-bold">
                  <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  No se encontraron productos.
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  {categories.map(category => {
                    const categoryProducts = productsByCategory[category.id];
                    if (!categoryProducts || categoryProducts.length === 0) return null;

                    return (
                      <div key={category.id} className="animate-fade-in">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 sticky top-0 bg-white/90 backdrop-blur-sm py-2 z-10 border-b border-gray-100">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-sm" style={{ backgroundColor: category.colorHex || '#ccc' }}></div>
                          <h2 className="text-base sm:text-lg font-extrabold text-gray-800 uppercase tracking-wide">
                            {category.nombre}
                          </h2>
                          <span className="text-[10px] sm:text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {categoryProducts.length}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                          {categoryProducts.map(product => (
                            <div 
                              key={product.id} 
                              onClick={() => addToCart(product)}
                              className="group relative border border-gray-200 rounded-xl p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-all flex flex-col justify-between h-24 sm:h-32 active:scale-95 bg-white overflow-hidden select-none"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: category.colorHex || '#ccc' }}></div>
                              <h3 className="font-bold text-gray-800 text-xs sm:text-sm leading-tight line-clamp-2 pl-2">
                                {product.nombre}
                              </h3>
                              <div className="mt-1 sm:mt-2 text-blue-600 font-black text-base sm:text-lg pl-2">
                                ${product.precioVenta.toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {productsByCategory[''] && productsByCategory[''].length > 0 && (
                     <div className="animate-fade-in">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 sticky top-0 bg-white/90 backdrop-blur-sm py-2 z-10 border-b border-gray-100">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gray-300 shadow-sm"></div>
                          <h2 className="text-base sm:text-lg font-extrabold text-gray-800 uppercase tracking-wide">Sin Categoría</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                          {productsByCategory[''].map(product => (
                            <div key={product.id} onClick={() => addToCart(product)} className="group relative border border-gray-200 rounded-xl p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-all flex flex-col justify-between h-24 sm:h-32 active:scale-95 bg-white overflow-hidden select-none">
                              <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 opacity-60 bg-gray-300 group-hover:opacity-100 transition-opacity"></div>
                              <h3 className="font-bold text-gray-800 text-xs sm:text-sm leading-tight line-clamp-2 pl-2">{product.nombre}</h3>
                              <div className="mt-1 sm:mt-2 text-blue-600 font-black text-base sm:text-lg pl-2">${product.precioVenta.toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                     </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ==========================================
              BARRA FLOTANTE MÓVIL (Solo visible en pantallas pequeñas)
              ========================================== */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] z-30 flex justify-between items-center pb-safe">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Total a cobrar</p>
              <p className="text-xl font-black text-blue-600 leading-none">${calculateTotal().toFixed(2)}</p>
            </div>
            <button 
              onClick={() => setIsMobileCartOpen(true)}
              className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Ver Ticket
              {totalItems > 0 && (
                <span className="bg-white text-blue-600 w-5 h-5 flex items-center justify-center rounded-full text-xs font-black ml-1">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* ==========================================
              MODAL TICKET (CARRITO)
              ========================================== */}
          <div className={`
            bg-white flex flex-col transition-all duration-300 overflow-hidden
            ${isMobileCartOpen ? 'fixed inset-0 z-50 h-[100dvh]' : 'hidden lg:flex rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-120px)]'}
          `}>
            
            {/* Cabecera del Ticket */}
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                <h2 className="font-bold text-gray-800 text-base sm:text-lg">Ticket Actual</h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={() => { if(cart.length > 0) setConfirmModal({ isOpen: true, action: 'clear' }) }} 
                  disabled={cart.length === 0}
                  className="text-rose-500 hover:text-rose-700 text-xs sm:text-sm font-bold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  Vaciar
                </button>
                <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden bg-gray-200 text-gray-600 p-1.5 rounded-lg hover:bg-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Lista de Items */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  <p className="text-sm font-bold">El ticket está vacío</p>
                  <p className="text-xs mt-1 text-center">Toca un producto del catálogo para agregarlo.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex justify-between items-center border-b border-gray-100 pb-3 mb-1 animate-scale-up">
                    <div className="flex-1 pr-2 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{item.product.nombre}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 font-medium">${item.product.precioVenta.toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      
                      {/* Control de Cantidad */}
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 font-black transition-colors">-</button>
                        <span className="w-6 sm:w-8 text-xs sm:text-sm font-black text-center text-gray-900">{item.cantidad}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-blue-600 hover:bg-blue-100 font-black transition-colors">+</button>
                      </div>
                      
                      {/* Subtotal e Icono Borrar */}
                      <div className="flex items-center gap-1 sm:gap-2 w-20 sm:w-24 justify-end">
                        <p className="text-xs sm:text-sm font-black text-gray-900">${(item.product.precioVenta * item.cantidad).toFixed(2)}</p>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-gray-300 hover:text-rose-500 p-1 transition-colors" title="Quitar">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Zona de Checkout Inferior */}
            <div className="p-4 sm:p-5 bg-white border-t border-gray-200 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] shrink-0 pb-safe">
              
              {/* Botones de Pago Rápido */}
              <div className="mb-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Método de Pago</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Efectivo', 'Tarjeta', 'Transferencia'].map(metodo => (
                    <button
                      key={metodo}
                      onClick={() => setMetodoPago(metodo)}
                      className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl border-2 transition-all active:scale-95 ${
                        metodoPago === metodo
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {metodo === 'Efectivo' ? '💵 Efe.' : metodo === 'Tarjeta' ? '💳 Tarj.' : '🏦 Trans.'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Notas */}
              <div className="mb-4 relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Nota u observación (Opcional)..." 
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex justify-between items-end mb-4">
                <span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Total Venta</span>
                <span className="text-3xl sm:text-4xl font-black text-blue-600 leading-none">${calculateTotal().toFixed(2)}</span>
              </div>

              <button 
                onClick={() => { if(cart.length > 0) setConfirmModal({ isOpen: true, action: 'checkout' }) }}
                disabled={cart.length === 0 || isSubmitting}
                className={`w-full py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-black text-white shadow-lg transition-all flex items-center justify-center gap-2
                  ${cart.length === 0 || isSubmitting 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-600/30'
                  }`}
              >
                {isSubmitting ? (
                  <><svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Registrando...</>
                ) : (
                  <><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> Confirmar Cobro</>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};