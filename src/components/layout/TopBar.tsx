// ===================================================
// ECOPULSE - components/layout/TopBar.tsx
// Sticky header: scroll suave a secciones del cascade.
// ===================================================

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

const NAV_ITEMS = [
  { id: 'sec-inicio',     label: 'Inicio' },
  { id: 'sec-datos',      label: 'Datos' },
  { id: 'sec-tendencias', label: 'Tendencias' },
  { id: 'sec-mapa',       label: 'Mapa' },
  { id: 'sec-pronostico', label: 'Pronóstico' },
  { id: 'sec-noticias',   label: 'Noticias' },
];

const TopBar = () => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-3 flex-shrink-0 bg-[#F2E8D5]/95 backdrop-blur-sm border-b border-[#DDD5C4]">
      <h1
        onClick={() => scrollTo('sec-inicio')}
        className="text-lg font-semibold text-[#2A2A28] cursor-pointer tracking-tight select-none"
        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
      >
        EcoPulse: El aire de Cali
      </h1>

      <nav className="flex items-center gap-5">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className="text-sm font-medium text-[#6B6B67] hover:text-[#1A1A18] transition-all duration-200"
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
};

export default TopBar;

