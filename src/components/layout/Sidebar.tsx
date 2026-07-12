// ===================================================
// TANGARA 2026 - components/layout/Sidebar.tsx
// Menú lateral de navegación.
// - Escritorio: alterna entre expandido (224px) y riel de iconos (64px)
//   con animación suave de ancho.
// - Móvil: cajón (drawer) deslizante con fondo oscurecido.
// Ambos se controlan con el botón hamburguesa del TopBar.
// ===================================================
import {
  BarChart2, Bell, ChevronRight, FileText, Home, Info, Leaf,
  LineChart, Map, Newspaper, Settings, TrendingUp, Users, Wind, X,
  type LucideIcon,
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo';
import type { NavItem, PageId } from '../../types';

const PRIMARY_NAV: NavItem[] = [
  { id: 'inicio',        label: 'Inicio',              icon: 'Home' },
  { id: 'mapa',          label: 'Mapa de Cali',        icon: 'Map' },
  { id: 'calidad-aire',  label: 'Calidad del Aire',    icon: 'Wind' },
  { id: 'tendencias',    label: 'Tendencias',          icon: 'TrendingUp' },
  { id: 'predicciones',  label: 'Predicciones',        icon: 'LineChart' },
  { id: 'estadisticas',  label: 'Estadísticas',        icon: 'BarChart2' },
  { id: 'reportes',      label: 'Reportes',            icon: 'FileText' },
  { id: 'educacion',     label: 'Educación Ambiental', icon: 'Leaf' },
  { id: 'participa',     label: 'Participa',           icon: 'Users' },
  { id: 'noticias',      label: 'Noticias',            icon: 'Newspaper' },
  { id: 'sobre',         label: 'Sobre Tangara',       icon: 'Info' },
];

const IconMap: Record<string, LucideIcon> = {
  Home, Map, Wind, TrendingUp, LineChart, BarChart2, FileText,
  Settings, Leaf, Users, Bell, Newspaper, Info,
};

const NavIcon = ({ icon, size = 17 }: { icon: string; size?: number }) => {
  const Icon = IconMap[icon];
  return Icon ? <Icon size={size} /> : null;
};

interface SidebarContentProps {
  collapsed: boolean;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

/** Contenido interno del sidebar (compartido entre escritorio y móvil). */
const SidebarContent = ({ collapsed, activePage, onNavigate }: SidebarContentProps) => (
  <div className="flex flex-col h-full">
    {/* Logo */}
    <div className={`flex items-center py-4 border-b border-gray-100 flex-shrink-0 ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
      {collapsed ? (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm bg-tangara" title="Inteligencia Ambiental Urbana">
          <span className="sr-only">Inteligencia Ambiental Urbana</span>
          <BirdMini />
        </div>
      ) : (
        <BrandLogo size="sm" variant="light" />
      )}
    </div>

    {/* Navegación */}
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
      {PRIMARY_NAV.map(item => {
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : undefined}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-150 group relative
              ${isActive ? 'text-white shadow-sm bg-palma' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
              ${collapsed ? 'justify-center' : ''}
            `}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="flex-shrink-0">
              <NavIcon icon={item.icon} size={17} />
            </span>
            {!collapsed && <span className="truncate text-left">{item.label}</span>}
            {collapsed && (
              <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                {item.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>

    {/* Parte inferior */}
    <div className="flex-shrink-0 border-t border-gray-100 py-3 px-2 space-y-0.5">
      <button
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150 group relative ${collapsed ? 'justify-center' : ''}`}
        title={collapsed ? 'Notificaciones' : undefined}
        aria-label="Notificaciones"
      >
        <span className="relative flex-shrink-0">
          <Bell size={17} />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">3</span>
          </span>
        </span>
        {!collapsed && <span className="truncate">Notificaciones</span>}
      </button>

      <button
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}
        title={collapsed ? 'Configuración' : undefined}
        aria-label="Configuración"
      >
        <span className="flex-shrink-0"><Settings size={17} /></span>
        {!collapsed && <span className="truncate">Configuración</span>}
      </button>

      {/* Perfil */}
      <div className={`mt-2 mx-1 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100 ${collapsed ? 'justify-center p-2' : ''}`}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #1E5E4A, #0084B4)' }}
        >
          CI
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">Participa</p>
              <p className="text-[10px] text-gray-400 truncate">Ciudadano de Cali</p>
            </div>
            <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
          </>
        )}
      </div>
    </div>
  </div>
);

/** Mini pájaro para el modo colapsado. */
const BirdMini = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 7h.01" /><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />
    <path d="m20 7 2 .5-2 .5" /><path d="M10 18v3" /><path d="M14 17.75V21" /><path d="M7 18a6 6 0 0 0 3.84-10.61" />
  </svg>
);

interface SidebarProps {
  /** Escritorio: true = riel de iconos. */
  collapsed: boolean;
  /** Móvil: true = drawer visible. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const Sidebar = ({ collapsed, mobileOpen, onCloseMobile, activePage, onNavigate }: SidebarProps) => {
  return (
    <>
      {/* --- Escritorio: columna fija con ancho animado --- */}
      <aside
        className="hidden lg:flex flex-col h-full border-r border-gray-200 bg-white transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden"
        style={{ width: collapsed ? '64px' : '232px' }}
      >
        <SidebarContent collapsed={collapsed} activePage={activePage} onNavigate={onNavigate} />
      </aside>

      {/* --- Móvil: drawer deslizante + backdrop --- */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-[260px] bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menú de navegación"
      >
        <button
          onClick={onCloseMobile}
          className="absolute top-4 right-3 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 z-10"
          aria-label="Cerrar menú"
        >
          <X size={17} />
        </button>
        <SidebarContent
          collapsed={false}
          activePage={activePage}
          onNavigate={(page) => {
            onNavigate(page);
            onCloseMobile();
          }}
        />
      </aside>
    </>
  );
};

export default Sidebar;
