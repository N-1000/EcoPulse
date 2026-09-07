// ===================================================
// ECOPULSE 2026 - pages/NewsPage.tsx
// Novedades y Noticias de Calidad del Aire de Cali
// ===================================================
import { useState, useEffect } from 'react';
import { Newspaper, Search, Filter } from 'lucide-react';
import { fetchLiveNews } from '../services/api';
import type { NewsItem } from '../types';

const NewsPage = () => {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');

  useEffect(() => {
    fetchLiveNews().then(items => {
      if (items) setNewsList(items);
    });
  }, []);

  const filteredNews = newsList.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          n.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todas' || n.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-5 pt-4 space-y-4 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Newspaper className="text-tangara" />
            Noticias y Novedades
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Mantente al día con los eventos comunitarios, avances de reforestación e iniciativas ambientales de Cali.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Buscador */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm flex-1 md:flex-initial">
            <Search size={13} className="text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar noticia..."
              className="text-xs font-semibold text-gray-700 bg-transparent border-none outline-none w-full md:w-32"
            />
          </div>

          {/* Selector de categoría */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm">
            <Filter size={13} className="text-gray-400" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="text-xs font-semibold text-gray-700 bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="todas">Todas las categorías</option>
              <option value="comunidad">Comunidad</option>
              <option value="progreso">Progreso</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Noticias */}
      {filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNews.map(item => (
            <div key={item.id} className="card card-hover p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-tangara/10 text-tangara px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold">{item.date}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 leading-snug hover:text-tangara transition cursor-pointer">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {item.summary}
                </p>
              </div>
              <button className="text-tangara hover:underline text-xs font-bold text-left">
                Leer artículo completo →
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center text-gray-400 text-xs">
          No se encontraron noticias que coincidan con la búsqueda.
        </div>
      )}
    </div>
  );
};

export default NewsPage;
