// ===================================================
// TANGARA 2026 - components/layout/Layout.tsx
// Orquestador principal de la aplicación:
// - Sidebar (hamburguesa, animado, responsive)
// - TopBar (buscador + ICA)
// - Enrutado ligero de páginas (sin dependencias externas)
// - Chatbot flotante: el panel empuja el contenido en escritorio
//   y se superpone en móvil; el botón del ave es fijo (bottom-left).
//
// PARA AGREGAR UNA PÁGINA NUEVA:
// 1. Crea src/pages/MiPagina.tsx
// 2. Agrega su caso en renderPage() más abajo.
// ===================================================
import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import TangaraChat from '../chat/TangaraChat';
import FloatingChatButton from '../chat/FloatingChatButton';
import HomePage from '../../pages/HomePage';
import MapPage from '../../pages/MapPage';
import AirQualityPage from '../../pages/AirQualityPage';
import TrendsPage from '../../pages/TrendsPage';
import PredictionsPage from '../../pages/PredictionsPage';
import StatsPage from '../../pages/StatsPage';
import ReportsPage from '../../pages/ReportsPage';
import EducationPage from '../../pages/EducationPage';
import ParticipatePage from '../../pages/ParticipatePage';
import NewsPage from '../../pages/NewsPage';
import AboutPage from '../../pages/AboutPage';
import PlaceholderPage from '../../pages/PlaceholderPage';
import type { PageId } from '../../types';

/** Títulos de las secciones aún no desarrolladas. */
const PLACEHOLDER_TITLES: Partial<Record<PageId, string>> = {
  'calidad-aire': 'Calidad del Aire',
  'tendencias':   'Tendencias',
  'predicciones': 'Predicciones',
  'estadisticas': 'Estadísticas',
  'reportes':     'Reportes',
  'educacion':    'Educación Ambiental',
  'participa':    'Participa',
  'noticias':     'Noticias',
  'sobre':        'Sobre Tangara',
};

const Layout = () => {
  // Sidebar: colapsado (escritorio) / drawer (móvil)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Navegación y chat
  const [activePage, setActivePage] = useState<PageId>('inicio');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleToggleSidebar = () => {
    // En móvil abre el drawer; en escritorio colapsa/expande.
    if (window.innerWidth < 1024) {
      setMobileSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'inicio':
        return <HomePage onExploreMap={() => setActivePage('mapa')} />;
      case 'mapa':
        return <MapPage />;
      case 'calidad-aire':
        return <AirQualityPage />;
      case 'tendencias':
        return <TrendsPage />;
      case 'predicciones':
        return <PredictionsPage />;
      case 'estadisticas':
        return <StatsPage />;
      case 'reportes':
        return <ReportsPage />;
      case 'educacion':
        return <EducationPage />;
      case 'participa':
        return <ParticipatePage />;
      case 'noticias':
        return <NewsPage />;
      case 'sobre':
        return <AboutPage />;
      default:
        return <PlaceholderPage title={PLACEHOLDER_TITLES[activePage] ?? 'Sección'} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden relative bg-gray-200">
      {/* ---- Sidebar ---- */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        activePage={activePage}
        onNavigate={setActivePage}
      />

      {/* ---- Columna central: TopBar + página activa ---- */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onToggleSidebar={handleToggleSidebar} />
        <main className="flex-1 overflow-y-auto min-h-0">
          {renderPage()}
        </main>
      </div>

      {/* ---- Panel del chat ----
          Escritorio: columna que empuja el contenido (ancho animado 0 <-> 370px).
          Móvil: panel fijo superpuesto que desliza desde la derecha. */}
      <div
        className={`
          flex-shrink-0 h-full overflow-hidden bg-white
          transition-all duration-300 ease-in-out
          fixed right-0 top-0 z-50 shadow-2xl
          lg:static lg:z-auto lg:shadow-none lg:border-l lg:border-gray-200
          ${isChatOpen ? 'w-[370px] max-w-[92vw] lg:max-w-none' : 'w-0'}
        `}
        aria-hidden={!isChatOpen}
      >
        <div className="h-full w-[370px] max-w-[92vw] lg:max-w-none">
          <TangaraChat onClose={() => setIsChatOpen(false)} />
        </div>
      </div>

      {/* Backdrop del chat en móvil */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          isChatOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsChatOpen(false)}
        aria-hidden="true"
      />

      {/* ---- Botón flotante del ave (siempre visible) ---- */}
      <FloatingChatButton
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(prev => !prev)}
      />
    </div>
  );
};

export default Layout;
