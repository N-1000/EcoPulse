// ===================================================
// TANGARA 2026 - pages/HomePage.tsx
// Página principal: hero + dashboard analítico + noticias.
// Aquí se agregan/quitan/reordenan los widgets del dashboard.
// ===================================================
import HeroBanner from '../components/dashboard/HeroBanner';
import MapaComunas from '../components/dashboard/MapaComunas';
import TendenciaSemana from '../components/dashboard/TendenciaSemana';
import ContaminantesGrid from '../components/dashboard/ContaminantesGrid';
import PronosticoCard from '../components/dashboard/PronosticoCard';
import HistoricoMensual from '../components/dashboard/HistoricoMensual';
import NoticiasSection from '../components/dashboard/NoticiasSection';

interface HomePageProps {
  /** Navega a la vista "Explorar mapa". */
  onExploreMap: () => void;
}

const HomePage = ({ onExploreMap }: HomePageProps) => (
  <div className="p-5 pt-4 space-y-4">
    <HeroBanner onExploreMap={onExploreMap} />

    {/* Grid 2 columnas: mapa + tendencia */}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <MapaComunas onExploreMap={onExploreMap} />
      <TendenciaSemana />
    </div>

    {/* Contaminantes full width */}
    <ContaminantesGrid />

    {/* Grid 2 columnas: pronóstico + histórico */}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <PronosticoCard />
      <HistoricoMensual />
    </div>

    {/* Noticias */}
    <NoticiasSection />
  </div>
);

export default HomePage;
