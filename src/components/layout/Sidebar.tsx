// ===================================================
// ECOPULSE - components/layout/Sidebar.tsx
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
  // { id: 'predicciones',  label: 'Predicciones',        icon: 'LineChart' },
  { id: 'estadisticas',  label: 'Estadísticas',        icon: 'BarChart2' },
  // { id: 'reportes',      label: 'Reportes',            icon: 'FileText' },
  { id: 'educacion',     label: 'Educación Ambiental', icon: 'Leaf' },
  { id: 'participa',     label: 'Participa',           icon: 'Users' },
  // { id: 'noticias',      label: 'Noticias',            icon: 'Newspaper' },
  { id: 'sobre',         label: 'Sobre EcoPulse',      icon: 'Info' },
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
    {/* Logo / Brand */}
    <div
      className={`flex items-center py-4 flex-shrink-0 ${collapsed ? 'justify-center px-2' : 'px-4'}`}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      {collapsed ? (
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: '#2D6A4F' }}
          title="EcoPulse | Red Ambiental de Cali"
        >
          <span className="sr-only">EcoPulse</span>
          <LeafMini />
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          <span className="text-white font-bold text-base leading-tight tracking-tight">EcoPulse</span>
          <span className="text-[10px] leading-tight" style={{ color: '#A8C5B0' }}>Red Ambiental de Cali</span>
        </div>
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
              transition-all duration-150 group relative overflow-hidden
              ${collapsed ? 'justify-center' : ''}
            `}
            style={{
              color: isActive ? '#ffffff' : '#A8C5B0',
              background: isActive ? '#2D6A4F' : 'transparent',
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
              <NavIcon icon={item.icon} size={17} />
            </span>
            {!collapsed && <span className="truncate text-left">{item.label}</span>}
            {collapsed && (
              <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg"
                style={{ background: '#0F1F17', color: '#E8F0E9', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                {item.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>

    {/* Parte inferior */}
    <div
      className="flex-shrink-0 py-3 px-2 space-y-0.5"
      style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
    >
      <button
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${collapsed ? 'justify-center' : ''}`}
        style={{ color: '#A8C5B0' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
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
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}
        style={{ color: '#A8C5B0' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        title={collapsed ? 'Configuración' : undefined}
        aria-label="Configuración"
      >
        <span className="flex-shrink-0"><Settings size={17} /></span>
        {!collapsed && <span className="truncate">Configuración</span>}
      </button>

      {/* Perfil */}
      <div
        className={`mt-2 mx-1 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all duration-300 group ${collapsed ? 'justify-center p-2' : ''}`}
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.10)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'; }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 group-hover:scale-105 transition-transform"
          style={{
            background: 'linear-gradient(135deg, #2D6A4F, #D05A3F)',
            ringColor: 'rgba(255,255,255,0.2)',
            boxShadow: '0 0 10px rgba(45,106,79,0.5)',
          }}
        >
          CI
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#E8F0E9' }}>Participa</p>
              <p className="text-[10px] truncate" style={{ color: '#A8C5B0' }}>Ciudadano de Cali</p>
            </div>
            <ChevronRight size={14} className="flex-shrink-0" style={{ color: '#A8C5B0' }} />
          </>
        )}
      </div>
    </div>
  </div>
);

/** Mini hoja para el modo colapsado. */
const LeafMini = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
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

const SIDEBAR_BG = '#0F1F17';

const Sidebar = ({ collapsed, mobileOpen, onCloseMobile, activePage, onNavigate }: SidebarProps) => {
  return (
    <>
      {/* --- Escritorio: columna fija con ancho animado --- */}
      <aside
        className="hidden lg:flex flex-col h-full transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden"
        style={{
          width: collapsed ? '64px' : '232px',
          background: SIDEBAR_BG,
        }}
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
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-[260px] shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: SIDEBAR_BG }}
        aria-label="Menú de navegación"
      >
        <button
          onClick={onCloseMobile}
          className="absolute top-4 right-3 p-1.5 rounded-lg z-10 transition-colors"
          style={{ color: '#A8C5B0' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
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
