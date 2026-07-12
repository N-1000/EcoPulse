// ===================================================
// TANGARA 2026 - components/dashboard/NoticiasSection.tsx
// Sección de noticias ambientales (parte inferior del dashboard).
// ===================================================
import { ChevronRight, Leaf } from 'lucide-react';
import { news } from '../../mock/airQualityData';
import type { NewsItem } from '../../types';

const categoryStyle: Record<string, string> = {
  'COMUNIDAD': 'bg-blue-100 text-blue-700',
  'PROGRESO':  'bg-green-100 text-green-700',
  'ALERTA':    'bg-red-100 text-red-700',
  'CIENCIA':   'bg-purple-100 text-purple-700',
};

const NewsCard = ({ item }: { item: NewsItem }) => (
  <div className="card card-hover p-4 cursor-pointer">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-slate-200">
        <Leaf size={18} className="text-palma" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryStyle[item.category] ?? 'bg-gray-100 text-gray-600'}`}>
            {item.category}
          </span>
          <span className="text-[10px] text-gray-400">{item.date}</span>
        </div>
        <h4 className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{item.title}</h4>
        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{item.summary}</p>
      </div>
    </div>
  </div>
);

const NoticiasSection = () => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-gray-900">Noticias ambientales</h3>
      <button className="text-xs font-semibold flex items-center gap-1 hover:underline text-tangara">
        Ver todas <ChevronRight size={13} />
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {news.map(item => <NewsCard key={item.id} item={item} />)}
    </div>
  </div>
);

export default NoticiasSection;
