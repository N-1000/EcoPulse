// ===================================================
// ECOPULSE 2026 - components/layout/Layout.tsx
// Cascade única: HomePage en scroll continuo, navegación por anclas.
// ===================================================
import { useEffect, useState } from 'react';
import FooterBar from './FooterBar';
import EcopulseChat from '../chat/EcopulseChat';
import FloatingChatButton from '../chat/FloatingChatButton';
import HomePage from '../../pages/HomePage';
import type { PageId } from '../../types';

// El botón flotante del chat tapaba la píldora de indicadores del Hero en
// viewports bajos (iPhone SE 1g y 2/3: 320x690 y 375x667) -- el Hero es
// min-h-screen y en esos altos su contenido no entra junto con la zona que
// el botón reserva abajo a la derecha. Ningún padding lo resolvía del todo
// sin pelear con el contenido. Se oculta el botón mientras se está arriba
// del todo (antes de scrollear) y aparece apenas el usuario empieza a
// explorar -- deja de competir por el mismo espacio.
const UMBRAL_SCROLL_BOTON_CHAT = 300;

const Layout = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mostrarBotonChat, setMostrarBotonChat] = useState(false);

  useEffect(() => {
    const onScroll = () => setMostrarBotonChat(window.scrollY > UMBRAL_SCROLL_BOTON_CHAT);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavigate = (page: PageId) => {
    const sectionMap: Partial<Record<PageId, string>> = {
      'inicio':       'sec-inicio',
      'mapa':         'sec-mapa',
      'calidad-aire': 'sec-datos',
      'tendencias':   'sec-tendencias',
      'predicciones': 'sec-tendencias',
      'noticias':     'sec-noticias',
      'sobre':        'sec-noticias',
    };
    const id = sectionMap[page];
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-hueso">
      <main className="flex-1 w-full">
        <HomePage onOpenChat={() => setIsChatOpen(true)} />
        <FooterBar onNavigate={handleNavigate} />
      </main>

      {/* Panel del chatbot como drawer flotante (invisible y sin sombra cuando está cerrado) */}
      <div
        className={`fixed right-0 top-0 h-full w-[380px] max-w-[92vw] z-[9998] bg-white transition-all duration-300 ease-in-out transform ${
          isChatOpen
            ? 'translate-x-0 shadow-2xl opacity-100 visible'
            : 'translate-x-full shadow-none opacity-0 invisible pointer-events-none'
        }`}
        aria-hidden={!isChatOpen}
      >
        <div className="h-full w-full">
          <EcopulseChat
            onClose={() => setIsChatOpen(false)}
            currentPage="inicio"
            onNavigate={handleNavigate}
          />
        </div>
      </div>

      {/* Overlay oscuro cuando el chat está abierto */}
      <div
        className={`fixed inset-0 z-[9997] bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          isChatOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsChatOpen(false)}
        aria-hidden="true"
      />

      <FloatingChatButton
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(p => !p)}
        visible={mostrarBotonChat || isChatOpen}
      />
    </div>
  );
};

export default Layout;

