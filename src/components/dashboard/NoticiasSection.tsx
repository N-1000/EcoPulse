// ===================================================
// ECOPULSE 2026 - components/dashboard/NoticiasSection.tsx
// Sección de Actualidad Ambiental en Vivo para Santiago de Cali.
// Conectada en tiempo real al agregador de noticias (CVC, DAGMA, El País, etc.)
// Acceso directo a cada artículo original sin popups ni paneles redundantes.
// ===================================================
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  Clock,
  ShieldCheck,
  Flame,
  Trees,
  Cpu,
} from 'lucide-react';
import { fetchLiveNews } from '../../services/api';
import type { NewsItem } from '../../types';

const CATEGORY_TABS = [
  { id: 'TODAS',     label: 'Todas' },
  { id: 'COMUNIDAD', label: 'Comunidad y Parques', icon: Trees },
  { id: 'PROGRESO',  label: 'Avances y Red',       icon: ShieldCheck },
  { id: 'CIENCIA',   label: 'Ciencia y Monitoreo', icon: Cpu },
  { id: 'ALERTA',    label: 'Alertas y Emisiones', icon: Flame },
];

const categoryStyle: Record<string, { badge: string; border: string }> = {
  'COMUNIDAD': { badge: 'bg-[#E8F5EE] text-[#2D6A4F]', border: 'border-[#2D6A4F]/20' },
  'PROGRESO':  { badge: 'bg-[#EAF2FF] text-[#2563EB]', border: 'border-[#2563EB]/20' },
  'ALERTA':    { badge: 'bg-[#FFF1F0] text-[#E11D48]', border: 'border-[#E11D48]/20' },
  'CIENCIA':   { badge: 'bg-[#F3E8FF] text-[#7E22CE]', border: 'border-[#7E22CE]/20' },
  'CLIMA':     { badge: 'bg-[#FEF3C7] text-[#D97706]', border: 'border-[#D97706]/20' },
};

const NoticiasSection = () => {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [visibleCount, setVisibleCount] = useState<number>(6);

  const loadNews = useCallback(() => {
    setIsRefreshing(true);
    fetchLiveNews()
      .then(items => {
        if (items && items.length > 0) {
          setNewsList(items);
          setLastUpdated(new Date());
        }
        setLoading(false);
        setIsRefreshing(false);
      })
      .catch(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  }, []);

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 900000);
    return () => clearInterval(interval);
  }, [loadNews]);

  const filteredNews = useMemo(() => {
    if (selectedCategory === 'TODAS') return newsList;
    return newsList.filter(item => item.category === selectedCategory);
  }, [newsList, selectedCategory]);

  useEffect(() => {
    setVisibleCount(6);
  }, [selectedCategory]);

  const displayedNews = useMemo(() => {
    return filteredNews.slice(0, visibleCount);
  }, [filteredNews, visibleCount]);

  return (
    <section className="w-full">
      {/* ── Encabezado de Sección ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D6A4F] bg-[#2D6A4F]/10 px-3.5 py-1 rounded-full inline-block mb-2">
            Actualidad en Vivo
          </span>
          <h2
            className="text-2xl sm:text-3xl font-bold text-[#1A1A18] tracking-tight"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Noticias y Gestión Ambiental de Cali
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-[#8C8C86] hidden sm:inline-flex items-center gap-1">
            <Clock size={12} />
            Sincronizado {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
          </span>

          <button
            onClick={loadNews}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#DDD5C4] hover:bg-[#FAF7F2] text-[#1A1A18] text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[#2D6A4F]' : ''} />
            <span>{isRefreshing ? 'Actualizando...' : 'Actualizar noticias'}</span>
          </button>
        </div>
      </div>

      {/* ── Filtros por Categoría ── */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`
              px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5
              ${selectedCategory === tab.id
                ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm'
                : 'bg-white/80 text-[#6B6B67] border-[#DDD5C4] hover:bg-white hover:text-[#1A1A18]'
              }
            `}
          >
            {tab.icon && <tab.icon size={13} />}
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${selectedCategory === tab.id ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>
              {tab.id === 'TODAS' ? newsList.length : newsList.filter(n => n.category === tab.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Grid de Tarjetas de Noticias ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-[#DDD5C4] animate-pulse h-64 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-4 bg-stone-200 rounded-md w-1/3" />
                <div className="h-6 bg-stone-200 rounded-md w-full" />
                <div className="h-4 bg-stone-100 rounded-md w-full" />
                <div className="h-4 bg-stone-100 rounded-md w-2/3" />
              </div>
              <div className="h-4 bg-stone-200 rounded-md w-1/4" />
            </div>
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#DDD5C4]">
          <Newspaper size={36} className="mx-auto text-[#8C8C86] mb-3" />
          <h4 className="text-base font-bold text-[#1A1A18]">No hay noticias en esta categoría</h4>
          <p className="text-xs text-[#6B6B67] mt-1">Prueba seleccionando otra pestaña de actualidad.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedNews.map(item => {
              const style = categoryStyle[item.category] || categoryStyle['COMUNIDAD'];
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    bg-white rounded-3xl p-6 flex flex-col justify-between border ${style.border} shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-[#2D6A4F]/40 transition-all duration-300 group relative block cursor-pointer
                  `}
                >
                  <div>
                    {/* Header: Badge de Categoría + Tiempo relativo */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${style.badge}`}>
                        {item.category}
                      </span>
                      <span className="text-[11px] text-[#8C8C86] font-semibold flex items-center gap-1">
                        <Clock size={12} />
                        {item.timeAgo}{item.dateFormatted ? ` · ${item.dateFormatted}` : ''}
                      </span>
                    </div>

                    {/* Título */}
                    <h4 className="text-base sm:text-lg font-bold text-[#1A1A18] group-hover:text-[#2D6A4F] transition-colors leading-snug mb-3">
                      {item.title}
                    </h4>

                    {/* Resumen */}
                    <p className="text-xs sm:text-sm text-[#6B6B67] leading-relaxed line-clamp-3 mb-6">
                      {item.summary}
                    </p>
                  </div>

                  {/* Footer de Tarjeta con Enlace Directo */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#F2E8D5]">
                    <span className="text-xs font-bold text-[#4A4A46] bg-[#FAF7F2] px-2.5 py-1 rounded-lg">
                      {item.source}
                    </span>
                    <span className="text-xs font-bold text-[#2D6A4F] flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                      <span>Leer en {item.source}</span>
                      <ExternalLink size={13} />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>

          {/* ── Controles de Paginación / Ver Más ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-8 pt-4 border-t border-[#DDD5C4]/60">
            <span className="text-xs font-semibold text-[#8C8C86]">
              Mostrando <strong className="text-[#1A1A18]">{displayedNews.length}</strong> de <strong className="text-[#1A1A18]">{filteredNews.length}</strong> noticias de Cali
            </span>

            <div className="flex items-center gap-2">
              {filteredNews.length > visibleCount && (
                <button
                  onClick={() => setVisibleCount(prev => prev + 6)}
                  className="px-5 py-2.5 rounded-2xl bg-[#2D6A4F] hover:bg-[#1E4D38] text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <span>Cargar más noticias (+{Math.min(6, filteredNews.length - visibleCount)})</span>
                </button>
              )}

              {filteredNews.length > visibleCount && (
                <button
                  onClick={() => setVisibleCount(filteredNews.length)}
                  className="px-4 py-2.5 rounded-2xl bg-white border border-[#DDD5C4] hover:bg-[#FAF7F2] text-[#1A1A18] text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  Ver todas ({filteredNews.length})
                </button>
              )}

              {visibleCount > 6 && (
                <button
                  onClick={() => setVisibleCount(6)}
                  className="px-4 py-2.5 rounded-2xl bg-[#F2E8D5] hover:bg-[#E8E0D0] text-[#1A1A18] text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Mostrar menos
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default NoticiasSection;
