import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { 
  Cloud, ShieldCheck, BarChart3, Users, Zap, 
  ChevronDown, Smartphone, ChevronLeft, ChevronRight, Store, LayoutDashboard
} from 'lucide-react'; 

export const LandingPage = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // 🚨 ESTADO PARA EL CARRUSEL DE IMÁGENES 🚨
  const [currentImage, setCurrentImage] = useState(0);

  // 🚨 IMÁGENES REALES DEL SISTEMA 🚨
  const demoImages = [
    "/demo-pos.png",        // Pantalla de punto de venta
    "/demo-reportes.png",   // Pantalla de reportes/cortes de caja
    "/demo-categorias.png", // Pantalla de categorías
    "/demo-productos.png",  // Pantalla de productos
    "/demo-inventario.png", // Pantalla de inventario
    "/demo-personal.png",   // Pantalla de personal
    "/demo-sucursal.png",   // Pantalla de sucursales
  ];

  // Reemplaza con tu número de WhatsApp real (código de país + número)
  const whatsappNumber = "525563986246"; 
  const whatsappMessage = encodeURIComponent("Hola, quiero información sobre StreetPOS 🚀");
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Animaciones base
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  // Controles del carrusel
  const nextImage = () => setCurrentImage((prev) => (prev + 1) % demoImages.length);
  const prevImage = () => setCurrentImage((prev) => (prev === 0 ? demoImages.length - 1 : prev - 1));

  // Auto-play del carrusel (cambia de imagen cada 5 segundos)
  useEffect(() => {
    const timer = setInterval(nextImage, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050810] font-sans text-gray-100 overflow-hidden selection:bg-blue-500/30 scroll-smooth">
      
      {/* 🚨 SOLUCIÓN ESTRICTA PARA EVITAR QUE EL TEXTO CREZCA EN APP DESCARGADA (PWA) 🚨 */}
      <style>{`
        html, body {
          -moz-text-size-adjust: none !important;
          -webkit-text-size-adjust: none !important;
          text-size-adjust: none !important;
        }
      `}</style>

      {/* ==========================================
          NAVBAR
      ========================================== */}
      <nav className="fixed top-0 w-full z-50 bg-[#050810]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 🚨 LOGO REAL INTEGRADO 🚨 */}
            <div className="w-10 h-10 bg-[#0a0f1c] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10 p-1.5 overflow-hidden">
              <img src="/streetpos-icon.png" alt="StreetPOS" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">StreetPOS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-300">
            <a href="#solucion" className="hover:text-white transition-colors">Solución</a>
            <a href="#caracteristicas" className="hover:text-white transition-colors">Características</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
          </div>
          {/* Se ajustó el gap de gap-4 a gap-2 para móviles pequeños */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* 🚨 SE ELIMINÓ 'hidden sm:block' PARA QUE APAREZCA EN RESPONSIVE 🚨 */}
            {/* Se ajustó padding y tamaño de texto responsive para asegurar que quepa */}
            <a href="/login" className="text-xs sm:text-sm font-bold text-gray-300 hover:text-white transition-colors whitespace-nowrap px-2 py-1">
              Iniciar Sesión
            </a>
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="px-3 py-2 sm:px-5 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] active:scale-95 whitespace-nowrap">
              Probar Ahora
            </a>
          </div>
        </div>
      </nav>

      {/* ==========================================
          HERO SECTION (AURORA + RUSTY)
      ========================================== */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
          <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          
          <motion.div 
            initial="hidden" animate="visible" variants={staggerContainer}
            className="flex-1 text-center lg:text-left"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              SaaS v1.0 Disponible
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[1.1] mb-6">
              Control total de tu negocio <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">en tiempo real.</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Acelera tus ventas, domina tu inventario por sucursales y toma decisiones inteligentes con el punto de venta en la nube diseñado para escalar.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] active:scale-95 text-center flex items-center justify-center gap-2">
                Empieza hoy con StreetPOS
                <Zap className="w-5 h-5" />
              </a>
              <a href="/login" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all active:scale-95 text-center">
                Ver el sistema
              </a>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
            className="flex-1 relative w-full max-w-lg lg:max-w-none flex justify-center"
          >
            <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="relative z-20">
              
              {/* 🚨 GLOBO IZQUIERDO: SE ESCALÓ A 75% Y SE EMPUJÓ HACIA AFUERA SOLO EN MÓVIL (-left-8, -top-4) 🚨 */}
              <div className="absolute -top-4 -left-8 sm:top-10 sm:-left-12 lg:-left-24 bg-[#0a0f1c]/80 backdrop-blur-xl border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl flex items-center gap-3 sm:gap-4 z-30 scale-75 sm:scale-100 origin-top-left">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Sistema Activo</p>
                  <p className="text-emerald-400 text-xs">Uptime 99.9%</p>
                </div>
              </div>

              {/* 🚨 GLOBO DERECHO: SE ESCALÓ A 75% Y SE EMPUJÓ HACIA AFUERA SOLO EN MÓVIL (-right-8, bottom-4) 🚨 */}
              <div className="absolute bottom-4 -right-8 sm:bottom-20 sm:-right-8 lg:-right-16 bg-[#0a0f1c]/80 backdrop-blur-xl border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl flex items-center gap-3 sm:gap-4 z-30 scale-75 sm:scale-100 origin-bottom-right">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <BarChart3 className="text-blue-400 w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Ventas (Hoy)</p>
                  <p className="text-white font-black text-lg">$14,250.00</p>
                </div>
              </div>

              {/* 🚨 RUSTY: SE REDUJO SU TAMAÑO SOLO EN MÓVILES (w-[240px]) PARA HACER ESPACIO A LOS GLOBOS 🚨 */}
              <img 
                src="/Rusty.png" 
                alt="Rusty StreetPOS" 
                className="w-[240px] sm:w-[350px] lg:w-[450px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-20"
              />
            </motion.div>
            
            <div className="absolute bottom-0 w-64 h-20 bg-blue-600/30 rounded-[100%] filter blur-[50px] -z-10"></div>
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          PROBLEMAS (PAS) / SOLUCIÓN
      ========================================== */}
      <section id="solucion" className="py-24 bg-[#03050a] border-y border-white/5 relative scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">¿Sientes que administras a ciegas?</h2>
            <p className="text-gray-400 text-lg">Los problemas comunes de usar papel, Excel o sistemas obsoletos, <span className="text-blue-400 font-bold">solucionados.</span></p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Descuadres de Caja", desc: "El efectivo no cuadra al final del día y no sabes dónde está la fuga de dinero.", icon: <ShieldCheck className="w-8 h-8 text-rose-400" /> },
              { title: "Inventario Fantasma", desc: "Vendes productos que ya no tienes en bodega o se te caducan por falta de control.", icon: <LayoutDashboard className="w-8 h-8 text-rose-400" /> },
              { title: "Caos Multi-sucursal", desc: "Tienes que llamar a cada tienda para saber cuánto vendieron o qué les falta.", icon: <Store className="w-8 h-8 text-rose-400" /> }
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
                <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          CARACTERÍSTICAS (BENTO GRID)
      ========================================== */}
      <section id="caracteristicas" className="py-32 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-6">Diseñado para la <span className="text-blue-500">Operación Real.</span></h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">StreetPOS centraliza toda tu operación comercial en un entorno multi-tenant altamente seguro.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gradient-to-br from-[#0f172a] to-[#050810] border border-white/10 p-10 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] group-hover:bg-blue-500/20 transition-all"></div>
              <Cloud className="w-10 h-10 text-blue-400 mb-6 relative z-10" />
              <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Arquitectura Cloud Multi-Tenant</h3>
              <p className="text-gray-400 relative z-10 max-w-md">Cada negocio tiene su propio entorno cifrado. Accede desde cualquier dispositivo sin instalar servidores locales.</p>
            </div>
            <div className="bg-[#0f172a]/50 border border-white/10 p-10 rounded-3xl hover:bg-[#0f172a] transition-colors">
              <Store className="w-10 h-10 text-indigo-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Multi-Sucursal</h3>
              <p className="text-gray-400 text-sm">Gestiona inventarios independientes y precios por locación desde una sola cuenta maestra.</p>
            </div>
            <div className="bg-[#0f172a]/50 border border-white/10 p-10 rounded-3xl hover:bg-[#0f172a] transition-colors">
              <Users className="w-10 h-10 text-emerald-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Roles y Permisos</h3>
              <p className="text-gray-400 text-sm">Crea usuarios tipo 'Cajero' o 'Administrador' restringiendo accesos y protegiendo tu información.</p>
            </div>
            <div className="lg:col-span-2 bg-gradient-to-br from-[#0f172a] to-[#050810] border border-white/10 p-10 rounded-3xl relative overflow-hidden group">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-all"></div>
              <BarChart3 className="w-10 h-10 text-blue-400 mb-6 relative z-10" />
              <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Cortes de Caja y Reportes</h3>
              <p className="text-gray-400 relative z-10 max-w-md">Valida transacciones, desglose por métodos de pago (Efectivo, Tarjeta, Transferencia) y exporta contabilidad a PDF al instante.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          CARRUSEL DE DEMO (SaaS Visuals) 
      ========================================== */}
      <section id="demo" className="py-24 bg-[#03050a] relative border-y border-white/5 overflow-hidden scroll-mt-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/20 rounded-[100%] blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-black text-white mb-4">Experiencia de Usuario Premium</h2>
            <p className="text-gray-400 text-lg">Interfaz intuitiva que tus empleados aprenderán a usar en 5 minutos.</p>
          </div>

          <motion.div initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} 
            className="w-full bg-[#0a0f1c] rounded-2xl xl:rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/20 relative group"
          >
            <div className="h-12 bg-[#1e293b] flex items-center px-4 border-b border-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <div className="mx-auto flex-1 flex justify-center">
                <div className="bg-[#0f172a] px-32 py-1 rounded-md text-[10px] text-gray-400 border border-white/5 flex items-center gap-2">
                  <div className="w-3 h-3 overflow-hidden rounded-sm"><img src="/streetpos-icon.png" alt="icon" className="w-full h-full object-contain" /></div> streetpos.app
                </div>
              </div>
            </div>

            <div className="relative w-full h-[250px] sm:h-[400px] md:h-[550px] lg:h-[650px] bg-[#050810] flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentImage}
                  src={demoImages[currentImage]}
                  alt={`Demo vista ${currentImage + 1}`}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full object-contain p-2 md:p-6" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/1200x800/0f172a/ffffff?text=Agrega+tu+imagen+${currentImage + 1}+en+la+carpeta+public`;
                  }}
                />
              </AnimatePresence>

              <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-blue-600 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all border border-white/10 z-20">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-blue-600 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all border border-white/10 z-20">
                <ChevronRight className="w-6 h-6" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full z-20">
                {demoImages.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentImage(i)}
                    className={`w-2 h-2 rounded-full transition-all ${currentImage === i ? 'bg-blue-500 w-6' : 'bg-white/40 hover:bg-white/80'}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          FAQ SECTION
      ========================================== */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-white mb-4">Preguntas Frecuentes</h2>
        </div>
        <div className="space-y-4">
          {[
            { q: "¿Necesito instalar algo en mi computadora?", a: "No. StreetPOS es 100% en la nube (SaaS). Solo necesitas un navegador web y conexión a internet para operar desde cualquier PC, tablet o celular." },
            { q: "¿Puedo manejar varias sucursales con una sola cuenta?", a: "¡Sí! StreetPOS es multi-sucursal. Puedes ver el inventario y las ventas de todas tus tiendas desde un panel central de Administrador." },
            { q: "¿Qué pasa si un empleado intenta borrar una venta?", a: "El sistema cuenta con Roles. Un 'Cajero' solo puede cobrar. Las modificaciones, cortes y reportes están protegidos para el rol de 'Administrador'." },
            { q: "¿Cómo funcionan los cortes de caja?", a: "El sistema registra cada ticket con su hora exacta y método de pago. Al final del día, puedes generar un PDF detallado que cuadra los ingresos con un solo clic." }
          ].map((faq, i) => (
            <div key={i} className="border border-white/10 rounded-2xl bg-[#0f172a]/50 overflow-hidden">
              <button 
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
              >
                <span className="font-bold text-white">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-5 text-gray-400 text-sm">
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ==========================================
          CTA FINAL
      ========================================== */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-12 text-center relative overflow-hidden shadow-2xl shadow-blue-900/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[50px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[50px]"></div>
          
          <h2 className="text-3xl lg:text-5xl font-black text-white mb-6 relative z-10 tracking-tight">Es hora de modernizar tu negocio.</h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto relative z-10">Deja de perder tiempo cuadrando inventarios manuales. Únete a los negocios que ya controlan su operación con StreetPOS.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="px-8 py-4 bg-white text-blue-700 font-black rounded-xl hover:bg-gray-50 transition-transform hover:scale-105 shadow-xl flex items-center justify-center gap-2">
              <Smartphone className="w-5 h-5" />
              Solicitar información por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ==========================================
          FOOTER PROFESIONAL SaaS
      ========================================== */}
      <footer className="border-t border-white/10 bg-[#020308] pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            
            {/* Columna Marca */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                {/* 🚨 LOGO REAL INTEGRADO 🚨 */}
                <div className="w-10 h-10 bg-[#0a0f1c] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10 p-1.5 overflow-hidden">
                  <img src="/streetpos-icon.png" alt="StreetPOS" className="w-full h-full object-contain" />
                </div>
                <span className="text-2xl font-black tracking-tight text-white">StreetPOS.</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm">
                El sistema de punto de venta multi-tenant diseñado para revolucionar el control de inventarios, reportes y ventas de negocios modernos.
              </p>
              {/* Redes Sociales - Solo Facebook e Instagram con SVGs puros */}
              <div className="flex items-center gap-4">
                <a href="https://www.facebook.com/share/1Dcbvavfvp/" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="https://www.instagram.com/veltrix_solutions_?igsh=MXNiaXVsZXdldG5oMA==" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              </div>
            </div>

            {/* Columna Producto */}
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Producto</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href="#caracteristicas" className="hover:text-blue-400 transition-colors">Características</a></li>
                <li><a href="#demo" className="hover:text-blue-400 transition-colors">Demo Interactiva</a></li>
                <li><a href="#solucion" className="hover:text-blue-400 transition-colors">Casos de Uso</a></li>
                <li><a href="/login" className="hover:text-blue-400 transition-colors">Iniciar Sesión</a></li>
              </ul>
            </div>

            {/* Columna Empresa */}
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Empresa</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Partners</a></li>
              </ul>
            </div>

            {/* Columna Legal */}
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Legal</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Términos de Servicio</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Aviso de Privacidad</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Política de Cookies</a></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
              <img src="/LogoPerfil.jpeg" alt="Veltrix Solutions" className="w-6 h-6 rounded-md object-contain bg-white" />
              <span className="text-sm font-bold text-white tracking-widest uppercase">By Veltrix Solutions</span>
            </div>
            <p className="text-gray-500 text-sm font-medium text-center md:text-left">
              &copy; {new Date().getFullYear()} StreetPOS. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};