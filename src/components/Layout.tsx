// ===================================================
// TANGARA 2026 - Layout.tsx
// Estructura principal de 3 columnas: Sidebar | Dashboard | Chat
// ===================================================

import { useState } from 'react';
import {
  Menu, X, Home, Map, Wind, TrendingUp, BarChart2,
  FileText, Settings, Leaf, Users, Bell, ChevronRight,
  Newspaper, Info, Bird,
} from 'lucide-react';
import Dashboard from './Dashboard';
import TangaraChat from './TangaraChat';
import type { NavItem } from '../types';

// --------------------------------------------------
// Datos de navegación del sidebar
// --------------------------------------------------
const PRIMARY_NAV: NavItem[] = [
  { id: 'inicio',        label: 'Inicio',             icon: 'Home',       isActive: true },
  { id: 'mapa',          label: 'Mapa de Cali',        icon: 'Map' },
  { id: 'calidad-aire',  label: 'Calidad del Aire',    icon: 'Wind' },
  { id: 'tendencias',    label: 'Tendencias',          icon: 'TrendingUp' },
  { id: 'predicciones',  label: 'Predicciones',        icon: 'BarChart2' },
  { id: 'estadisticas',  label: 'Estadísticas',        icon: 'BarChart2' },
  { id: 'reportes',      label: 'Reportes',            icon: 'FileText' },
  { id: 'educacion',     label: 'Educación Ambiental', icon: 'Leaf' },
  { id: 'participa',     label: 'Participa',           icon: 'Users' },
  { id: 'noticias',      label: 'Noticias',            icon: 'Newspaper' },
  { id: 'sobre',         label: 'Sobre Tangara',       icon: 'Info' },
];

const BOTTOM_NAV: NavItem[] = [
  { id: 'configuracion', label: 'Configuración', icon: 'Settings' },
];

// --------------------------------------------------
// Mapa de iconos de Lucide
// --------------------------------------------------
const IconMap: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Home, Map, Wind, TrendingUp, BarChart2, FileText,
  Settings, Leaf, Users, Bell, Newspaper, Info,
};

const NavIcon = ({ icon, size = 17 }: { icon: string; size?: number }) => {
  const Icon = IconMap[icon];
  return Icon ? <Icon size={size} /> : null;
};

// --------------------------------------------------
// Sidebar
// --------------------------------------------------
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeNav: string;
  onNavChange: (id: string) => void;
}

const Sidebar = ({ collapsed, onToggle, activeNav, onNavChange }: SidebarProps) => {
  return (
    <aside
      className="flex flex-col h-full border-r border-gray-200 bg-white transition-all duration-300 ease-in-out flex-shrink-0"
      style={{ width: collapsed ? '64px' : '220px' }}
    >
      {/* Logo y toggle */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: '#1E5E4A' }}
            >
              <Bird size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-900 leading-tight truncate">Tangara 2026</p>
              <p className="text-[10px] text-gray-400 truncate">Inteligencia Ambiental</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm mx-auto"
            style={{ backgroundColor: '#1E5E4A' }}
          >
            <Bird size={16} className="text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0 ${collapsed ? 'hidden' : ''}`}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <X size={16} />
        </button>
      </div>

      {/* Scroll de navegación */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {PRIMARY_NAV.map(item => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 group relative
                ${isActive
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
              style={isActive ? { backgroundColor: '#1E5E4A' } : {}}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="flex-shrink-0">
                <NavIcon icon={item.icon} size={17} />
              </span>
              {!collapsed && (
                <span className="truncate text-left">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
                  {item.badge}
                </span>
              )}
              {/* Tooltip cuando está colapsado */}
              {collapsed && (
                <span className="
                  absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                  bg-gray-900 text-white whitespace-nowrap opacity-0 group-hover:opacity-100
                  pointer-events-none transition-opacity duration-150 z-50
                  shadow-lg
                ">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Parte inferior */}
      <div className="flex-shrink-0 border-t border-gray-100 py-3 px-2 space-y-0.5">
        {/* Notificaciones */}
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150 group relative"
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
          {collapsed && (
            <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
              Notificaciones
            </span>
          )}
        </button>

        {BOTTOM_NAV.map(item => (
          <button
            key={item.id}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150 group relative"
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
          >
            <span className="flex-shrink-0">
              <NavIcon icon={item.icon} size={17} />
            </span>
            {!collapsed && <span className="truncate">{item.label}</span>}
            {collapsed && (
              <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                {item.label}
              </span>
            )}
          </button>
        ))}

        {/* Perfil de usuario */}
        <div
          className={`
            mt-2 mx-1 rounded-xl p-3 flex items-center gap-3 cursor-pointer
            hover:bg-gray-50 transition-colors border border-gray-100
            ${collapsed ? 'justify-center p-2' : ''}
          `}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #1E5E4A, #0084B4)' }}
          >
            SE
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">Participa</p>
              <p className="text-[10px] text-gray-400 truncate">Nueva adicionado</p>
            </div>
          )}
          {!collapsed && (
            <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
          )}
        </div>
      </div>
    </aside>
  );
};

// --------------------------------------------------
// Botón flotante de toggle cuando el sidebar está colapsado
// --------------------------------------------------
interface FloatingToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

const FloatingToggle = ({ collapsed, onToggle }: FloatingToggleProps) => {
  if (!collapsed) return null;
  return (
    <button
      onClick={onToggle}
      className="absolute top-4 left-[64px] z-30 ml-2 p-2 rounded-xl bg-white shadow-card border border-gray-100 text-gray-500 hover:text-gray-800 hover:shadow-card-hover transition-all"
      aria-label="Expandir menú lateral"
    >
      <Menu size={16} />
    </button>
  );
};

// --------------------------------------------------
// Layout principal
// --------------------------------------------------
const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState('inicio');

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ backgroundColor: '#E5E7EB' }}>
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(prev => !prev)}
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />

      {/* Botón flotante cuando está colapsado */}
      <FloatingToggle
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(false)}
      />

      {/* Columna central: Dashboard */}
      <Dashboard />

      {/* Columna derecha: TangaraChat */}
      <div
        className="flex-shrink-0 flex flex-col overflow-hidden"
        style={{ width: '320px' }}
      >
        <TangaraChat />
      </div>
    </div>
  );
};

export default Layout;
