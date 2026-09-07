// ===================================================
// ECOPULSE 2026 - components/layout/Layout.tsx
// Cascade única: TopBar sticky + HomePage en scroll continuo.
// ===================================================
import { useState } from 'react';
import FooterBar from './FooterBar';
import EcopulseChat from '../chat/EcopulseChat';
import FloatingChatButton from '../chat/FloatingChatButton';
import HomePage from '../../pages/HomePage';
import type { PageId } from '../../types';

const Layout = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

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
    <div className="min-h-screen w-full flex flex-col bg-[#F2E8D5]">
      <main className="flex-1 w-full">
        <HomePage />
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

      <FloatingChatButton isOpen={isChatOpen} onToggle={() => setIsChatOpen(p => !p)} />
    </div>
  );
};

export default Layout;

