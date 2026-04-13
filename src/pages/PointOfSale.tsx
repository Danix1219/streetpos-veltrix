import { useState, useEffect, useContext } from 'react';
import streetposApi from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import type { Product } from '../types/product';
import type { Category } from '../types/category'; // <-- Necesitamos importar Category
import type { CartItem, SalePayload } from '../types/sale';

export const PointOfSale = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // <-- Nuevo estado
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // <-- Nuevo estado para el buscador

  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [notas, setNotas] = useState('');

  const { nombre } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, []);

  // --- DESCARGA SIMULTÁNEA DE PRODUCTOS Y CATEGORÍAS ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        streetposApi.get('/Products'),
        streetposApi.get('/Categories')
      ]);
      
      setProducts(productsRes.data);
      
      // Ordenamos las categorías por el campo "orden" si existe
      const sortedCategories = categoriesRes.data.sort((a: Category, b: Category) => (a.orden || 0) - (b.orden || 0));
      setCategories(sortedCategories);
    } catch (err: any) {
      setError('Error al cargar el catálogo y las categorías');
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DEL CARRITO (Se mantiene igual) ---
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
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.precioVenta * item.cantidad), 0);
  };

  // --- ENVÍO A LA API ---
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: SalePayload = {
        // Asumiendo que el backend toma el ID del token, dejamos un string genérico si lo pide el JSON
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
    } catch (err: any) {
      alert('Error al registrar la venta: ' + (err.response?.data?.message || 'Error de conexión'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LÓGICA PARA AGRUPAR PRODUCTOS ---
  // Filtramos primero por el buscador, luego agrupamos
  const filteredProducts = products.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Creamos un mapa de productos por categoría
  const productsByCategory: { [key: string]: Product[] } = {};
  filteredProducts.forEach(product => {
    if (!productsByCategory[product.categoriaId]) {
      productsByCategory[product.categoriaId] = [];
    }
    productsByCategory[product.categoriaId].push(product);
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Terminal de Venta</h1>
            <p className="text-sm text-gray-500">Cajero en turno: <span className="font-semibold">{nombre || 'Usuario'}</span></p>
          </div>
          <div className="text-right">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
              Caja Abierta
            </span>
          </div>
        </div>

        {error && <p className="text-red-500 mb-4 bg-red-50 p-3 rounded">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ==========================================
              LADO IZQUIERDO: CATÁLOGO AGRUPADO
              ========================================== */}
          <div className="lg:col-span-2 flex flex-col h-[calc(100vh-140px)]">
            <div className="bg-white p-4 rounded-t-xl shadow-sm border-b border-gray-100 z-10">
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
                  placeholder="Buscar producto por nombre..." 
                  className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-b-xl shadow-sm flex-1 overflow-y-auto border border-t-0 border-gray-100">
              {loading ? (
                <div className="flex justify-center py-10"><p className="text-gray-500 font-bold">Cargando inventario...</p></div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-10 text-gray-500 font-bold">No se encontraron productos.</div>
              ) : (
                <div className="space-y-8">
                  {/* Iteramos sobre las categorías ordenadas para dibujar los bloques */}
                  {categories.map(category => {
                    const categoryProducts = productsByCategory[category.id];
                    // Si esta categoría no tiene productos (o no coinciden con la búsqueda), no la dibujamos
                    if (!categoryProducts || categoryProducts.length === 0) return null;

                    return (
                      <div key={category.id} className="animate-fade-in">
                        
                        {/* Cabecera de la Categoría con su Color */}
                        <div className="flex items-center gap-3 mb-4 sticky top-0 bg-white/90 backdrop-blur-sm py-2 z-10 border-b border-gray-100">
                          <div 
                            className="w-4 h-4 rounded-full shadow-sm"
                            style={{ backgroundColor: category.colorHex || '#ccc' }}
                          ></div>
                          <h2 className="text-lg font-extrabold text-gray-800 uppercase tracking-wide">
                            {category.nombre}
                          </h2>
                          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {categoryProducts.length}
                          </span>
                        </div>

                        {/* Grid de Productos de esta Categoría */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {categoryProducts.map(product => (
                            <div 
                              key={product.id} 
                              onClick={() => addToCart(product)}
                              className="group relative border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all flex flex-col justify-between h-32 active:scale-95 bg-white overflow-hidden"
                            >
                              {/* Barra lateral de color muy sutil */}
                              <div 
                                className="absolute left-0 top-0 bottom-0 w-1 opacity-50 group-hover:opacity-100 transition-opacity"
                                style={{ backgroundColor: category.colorHex || '#ccc' }}
                              ></div>
                              
                              <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 pl-2">
                                {product.nombre}
                              </h3>
                              <div className="mt-2 text-blue-600 font-black text-lg pl-2">
                                ${product.precioVenta.toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Productos sin categoría asignada (Failsafe) */}
                  {productsByCategory[''] && productsByCategory[''].length > 0 && (
                     <div className="animate-fade-in">
                        <div className="flex items-center gap-3 mb-4 sticky top-0 bg-white/90 backdrop-blur-sm py-2 z-10 border-b border-gray-100">
                          <div className="w-4 h-4 rounded-full bg-gray-300 shadow-sm"></div>
                          <h2 className="text-lg font-extrabold text-gray-800 uppercase tracking-wide">Sin Categoría</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {productsByCategory[''].map(product => (
                            <div key={product.id} onClick={() => addToCart(product)} className="group relative border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all flex flex-col justify-between h-32 active:scale-95 bg-white overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 opacity-50 bg-gray-300"></div>
                              <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 pl-2">{product.nombre}</h3>
                              <div className="mt-2 text-blue-600 font-black text-lg pl-2">${product.precioVenta.toFixed(2)}</div>
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
              LADO DERECHO: TICKET / CARRITO (Se mantiene igual)
              ========================================== */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-140px)]">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl flex justify-between items-center">
              <h2 className="font-bold text-gray-800">Ticket Actual</h2>
              <button onClick={clearCart} className="text-red-500 hover:text-red-700 text-sm font-semibold">
                Vaciar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-16 h-16 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  <p>Agrega productos al ticket</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <div className="flex-1 pr-2">
                      <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.product.nombre}</p>
                      <p className="text-xs text-gray-500">${item.product.precioVenta.toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-gray-100 rounded-lg">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded-l-lg font-bold">-</button>
                        <span className="px-2 text-sm font-bold w-8 text-center">{item.cantidad}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded-r-lg font-bold">+</button>
                      </div>
                      <div className="text-right w-16">
                        <p className="text-sm font-black text-gray-800">${(item.product.precioVenta * item.cantidad).toFixed(2)}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-gray-50/80 border-t border-gray-200 rounded-b-xl">
              <div className="mb-3">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Método de Pago</label>
                <select 
                  value={metodoPago} 
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Tarjeta">💳 Tarjeta de Crédito/Débito</option>
                  <option value="Transferencia">🏦 Transferencia</option>
                </select>
              </div>

              <div className="mb-4">
                <input 
                  type="text" 
                  placeholder="Notas adicionales (opcional)..." 
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 font-bold uppercase tracking-wider">Total a Cobrar</span>
                <span className="text-3xl font-black text-blue-600">${calculateTotal().toFixed(2)}</span>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || isSubmitting}
                className={`w-full py-4 rounded-xl text-lg font-black text-white shadow-lg transition-all 
                  ${cart.length === 0 || isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-600/30'
                  }`}
              >
                {isSubmitting ? 'Procesando Pago...' : 'Confirmar Venta'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};