import { useState, useEffect, useContext } from 'react';
import streetposApi from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import type { Product } from '../types/product';
import type { Category } from '../types/category';
import type { CartItem, SalePayload } from '../types/sale';

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        streetposApi.get('/Products'),
        streetposApi.get('/Categories')
      ]);
      
      setProducts(productsRes.data);
      const sortedCategories = categoriesRes.data.sort((a: Category, b: Category) => (a.orden || 0) - (b.orden || 0));
      setCategories(sortedCategories);
    } catch (err: any) {
      setError('Error al cargar el catálogo y las categorías');
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
    if(window.confirm('¿Estás seguro de cancelar esta venta?')) {
      setCart([]);
      setNotas('');
      setMetodoPago('Efectivo');
      setIsMobileCartOpen(false); 
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.precioVenta * item.cantidad), 0);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: SalePayload = {
        userId: "3fa85f64-5717-4562-b3fc-2c963f66afa6", 
        metodoPago: metodoPago,
        notas: notas,
        items: cart.map(item => ({
          productId: item.product.id,
          cantidad: item.cantidad
        }))
      };

      await streetposApi.post('/Sales', payload);
      alert('¡Venta registrada con éxito!');
      
      setCart([]);
      setNotas('');
      setMetodoPago('Efectivo');
      setIsMobileCartOpen(false); 
    } catch (err: any) {
      alert('Error al registrar la venta: ' + (err.response?.data?.message || 'Error de conexión'));
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
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabecera del POS */}
        <div className="flex justify-between items-end mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Terminal de Venta</h1>
            <p className="text-xs sm:text-sm text-gray-500">Cajero en turno: <span className="font-semibold">{nombre || 'Usuario'}</span></p>
          </div>
          <div className="text-right">
            <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-sm font-bold uppercase tracking-wider">
              Caja Abierta
            </span>
          </div>
        </div>

        {error && <p className="text-red-500 mb-4 bg-red-50 p-3 rounded text-sm">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ==========================================
              LADO IZQUIERDO: CATÁLOGO
              ========================================== */}
          <div className="lg:col-span-2 flex flex-col h-[calc(100vh-120px)] pb-24 lg:pb-0">
            <div className="bg-white p-3 sm:p-4 rounded-t-xl shadow-sm border-b border-gray-100 z-10">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar producto..." 
                  className="w-full pl-10 pr-3 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700 text-sm"
                />
              </div>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-b-xl shadow-sm flex-1 overflow-y-auto border border-t-0 border-gray-100">
              {loading ? (
                <div className="flex justify-center py-10"><p className="text-gray-500 font-bold">Cargando inventario...</p></div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-10 text-gray-500 font-bold">No se encontraron productos.</div>
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
                              className="group relative border border-gray-200 rounded-xl p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-all flex flex-col justify-between h-24 sm:h-32 active:scale-95 bg-white overflow-hidden"
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
                            <div key={product.id} onClick={() => addToCart(product)} className="group relative border border-gray-200 rounded-xl p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-all flex flex-col justify-between h-24 sm:h-32 active:scale-95 bg-white overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 opacity-60 bg-gray-300"></div>
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
              MODAL TICKET (CARRITO) - OPTIMIZADO MÓVIL
              ========================================== */}
          <div className={`
            bg-white flex flex-col transition-all duration-300 overflow-hidden
            ${isMobileCartOpen ? 'fixed inset-0 z-50 h-[100dvh]' : 'hidden lg:flex rounded-xl shadow-sm border border-gray-100 h-[calc(100vh-120px)]'}
          `}>
            
            {/* Cabecera del Ticket */}
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-gray-800 text-base sm:text-lg">Ticket Actual</h2>
              <div className="flex items-center gap-2 sm:gap-4">
                <button onClick={clearCart} className="text-red-500 hover:text-red-700 text-xs sm:text-sm font-semibold px-2 py-1 rounded-lg hover:bg-red-50">
                  Vaciar
                </button>
                <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden bg-gray-200 text-gray-600 p-1.5 rounded-lg hover:bg-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Lista de Items */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  <p className="text-sm">Agrega productos al ticket</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <div className="flex-1 pr-2 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{item.product.nombre}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">${item.product.precioVenta.toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <div className="flex items-center bg-gray-100 rounded-lg">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-l-lg font-bold">-</button>
                        <span className="w-5 sm:w-6 text-xs sm:text-sm font-bold text-center">{item.cantidad}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-r-lg font-bold">+</button>
                      </div>
                      <div className="text-right w-14 sm:w-16">
                        <p className="text-xs sm:text-sm font-black text-gray-800">${(item.product.precioVenta * item.cantidad).toFixed(2)}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 p-1">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Zona de Checkout Inferior Compacta */}
            <div className="p-3 sm:p-4 bg-white border-t border-gray-200 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] shrink-0 pb-safe">
              
              {/* Botones de Pago Rápido */}
              <div className="mb-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Método de Pago</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Efectivo', 'Tarjeta', 'Transferencia'].map(metodo => (
                    <button
                      key={metodo}
                      onClick={() => setMetodoPago(metodo)}
                      className={`py-1.5 px-1 text-[11px] sm:text-xs font-bold rounded-lg border transition-all ${
                        metodoPago === metodo
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {metodo === 'Efectivo' ? '💵 Efe.' : metodo === 'Tarjeta' ? '💳 Tarj.' : '🏦 Trans.'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Notas Compacto */}
              <div className="mb-3">
                <input 
                  type="text" 
                  placeholder="Añadir nota (opcional)..." 
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex justify-between items-end mb-3 sm:mb-4">
                <span className="text-gray-600 font-bold uppercase tracking-wider text-[10px] sm:text-xs">Total</span>
                <span className="text-2xl sm:text-3xl font-black text-blue-600 leading-none">${calculateTotal().toFixed(2)}</span>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || isSubmitting}
                className={`w-full py-3 sm:py-4 rounded-xl text-base sm:text-lg font-black text-white shadow-lg transition-all 
                  ${cart.length === 0 || isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-600/30'
                  }`}
              >
                {isSubmitting ? 'Procesando...' : 'Cobrar'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};