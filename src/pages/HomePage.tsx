// ===================================================
// ECOPULSE 2026 - pages/HomePage.tsx
// Cascade inmersiva estilo Apple: narrativa editorial,
// recomendaciones de salud ciudadana, bloque de contraste bosque
// y secciones fluidas con scroll reveal.
// ===================================================
import { Activity, ShieldCheck, Wind, TreePine, Sparkles, Navigation } from 'lucide-react';
import HeroBanner from '../components/dashboard/HeroBanner';
import ContaminantesGrid from '../components/dashboard/ContaminantesGrid';
import TendenciaSemana from '../components/dashboard/TendenciaSemana';
import HistoricoMensual from '../components/dashboard/HistoricoMensual';
import PronosticoCard from '../components/dashboard/PronosticoCard';
import NoticiasSection from '../components/dashboard/NoticiasSection';
import PulsoNarrativo from '../components/dashboard/PulsoNarrativo';
import HeatmapHoras from '../components/dashboard/HeatmapHoras';
import SaludPerfiles from '../components/dashboard/SaludPerfiles';
import MapPage from './MapPage';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { useAirQuality } from '../hooks/useAirQuality';

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

const HomePage = () => {
  const { metrics } = useAirQuality();
  const ica = metrics.icaGeneral;
  const isGood = ica <= 50;
  const isModerate = ica > 50 && ica <= 100;

  const lifestyleCards = [
    {
      icon: Activity,
      title: 'Deporte y Ciclismo',
      status: isGood ? 'Condiciones Óptimas' : isModerate ? 'Apto con moderación' : 'Reducir intensidad',
      detail: isGood
        ? 'Excelente momento para trotar por el Bulevar del Río o subir a Cristo Rey.'
        : 'Recomendable entrenar en las primeras horas de la mañana.',
      badgeColor: isGood ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
    },
    {
      icon: ShieldCheck,
      title: 'Población Sensible',
      status: isGood ? 'Ambiente Seguro' : isModerate ? 'Precaución leve' : 'Evitar sobreesfuerzos',
      detail: isGood
        ? 'Niños, adultos mayores y personas con asma pueden realizar actividades con tranquilidad.'
        : 'Personas asmáticas deben portar su inhalador por prevención.',
      badgeColor: isGood ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
    },
    {
      icon: Wind,
      title: 'Ventilación en Hogares',
      status: isGood ? 'Abrir Ventanas' : 'Ventilar por intervalos',
      detail: isGood
        ? 'Aprovecha la brisa de la tarde para renovar el aire interior de tu casa u oficina.'
        : 'Ventila en horarios de menor flujo vehicular.',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      icon: TreePine,
      title: 'Pulmones Verdes',
      status: 'Farallones y Pance',
      detail: 'Los corredores ambientales del sur y oeste de Cali registran la mayor pureza y frescura.',
      badgeColor: 'bg-teal-100 text-teal-800',
    },
  ];

  return (
    <div id="sec-inicio" className="min-h-full flex flex-col bg-[#F2E8D5] overflow-x-hidden font-sans">

      {/* ── HERO EDITORIAL INMERSIVO ── */}
      <HeroBanner onExploreMap={() => scrollToSection('sec-mapa')} />

      {/* ── 1. DATOS EN VIVO & DIAGNÓSTICO CIUDADANO ── */}
      <section id="sec-datos" className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 py-24 border-t border-[#DDD5C4]/60">
        
        {/* Encabezado Editorial */}
        <ScrollReveal direction="down">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D6A4F] bg-[#2D6A4F]/10 px-3.5 py-1 rounded-full inline-block mb-3">
              Métricas en Tiempo Real
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A18] tracking-tight mb-4"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              El pulso del aire, segundo a segundo.
            </h2>
            <p className="text-sm sm:text-base text-[#6B6B67] leading-relaxed">
              Nuestra red captura micropartículas finas, gases y variables bioclimáticas para darte un panorama exacto de la atmósfera en Cali.
            </p>
          </div>
        </ScrollReveal>

        {/* Cuadrícula 2x2 de contaminantes con animación desde 4 extremos y tooltips */}
        <div className="mb-16">
          <ContaminantesGrid />
        </div>

        {/* ── PULSO NARRATIVO EN VIVO ── */}
        <ScrollReveal direction="up" delay={50}>
          <div className="mb-16">
            <PulsoNarrativo />
          </div>
        </ScrollReveal>

        {/* Recomendaciones prácticas de estilo de vida */}
        <ScrollReveal direction="up" delay={100}>
          <div className="bg-[#EAE0CD]/60 rounded-3xl p-6 sm:p-8 border border-[#DDD5C4]">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#2D6A4F]"></span>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1A1A18]">
                Recomendaciones para tu día a día
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {lifestyleCards.map((c, i) => {
                const Icon = c.icon;
                return (
                  <div
                    key={i}
                    className="flex flex-col justify-between p-5 bg-white/80 hover:bg-white rounded-2xl border border-[#DDD5C4] shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
                          <Icon size={18} />
                        </div>
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${c.badgeColor}`}>
                          {c.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#1A1A18] mb-1">
                        {c.title}
                      </h4>
                      <p className="text-[11px] text-[#6B6B67] leading-relaxed">
                        {c.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── 2. BLOQUE DE CONTRASTE BOSQUE: RUTA SALUDABLE & ASISTENTE IA ── */}
      <section className="w-full bg-[#0F1F17] text-white py-24 sm:py-28 relative overflow-hidden">
        {/* Luces sutiles de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2D6A4F]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D05A3F]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Texto de Impacto */}
            <div className="lg:col-span-7">
              <ScrollReveal direction="right">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-[#A8C5B0] text-xs font-semibold uppercase tracking-widest mb-4">
                  <Sparkles size={14} className="text-emerald-400" />
                  Tecnología de Impacto Ciudadano
                </div>

                <h2
                  className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  Muévete por Cali respirando el aire más puro.
                </h2>

                <p className="text-sm sm:text-base text-[#A8C5B0] leading-relaxed mb-8 max-w-xl">
                  Nuestro algoritmo inteligente evalúa los sensores en tiempo real para calcular rutas peatonales y ciclistas con hasta un <strong className="text-white font-semibold">34% menos de exposición</strong> a contaminantes.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => scrollToSection('sec-mapa')}
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#D05A3F] hover:bg-[#B84D34] text-white text-sm font-bold shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <Navigation size={16} />
                    Ver Ruta Saludable en Mapa
                  </button>
                  <span className="text-xs text-[#A8C5B0]/80">
                    O pregúntale directamente al Asistente IA en el botón inferior.
                  </span>
                </div>
              </ScrollReveal>
            </div>

            {/* Tarjetas de Beneficios */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <ScrollReveal direction="left" delay={50}>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="text-2xl font-bold text-white mb-1">22 Comunas</div>
                  <div className="text-xs text-[#A8C5B0]">Malla de datos continua e integrada con la red pública.</div>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="left" delay={150}>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="text-2xl font-bold text-emerald-400 mb-1">&lt; 15 min</div>
                  <div className="text-xs text-[#A8C5B0]">Frecuencia de sincronización directa de los dispositivos físicos.</div>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="left" delay={250}>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="text-2xl font-bold text-[#E5DBC6] mb-1">IA Conversacional</div>
                  <div className="text-xs text-[#A8C5B0]">Diagnósticos ambientales instantáneos en lenguaje natural.</div>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. TENDENCIAS & HISTÓRICO ── */}
      <section id="sec-tendencias" className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 py-24 border-t border-[#DDD5C4]/60">
        <ScrollReveal direction="down">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D6A4F] bg-[#2D6A4F]/10 px-3.5 py-1 rounded-full inline-block mb-3">
              Analítica Temporal
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#1A1A18] tracking-tight mb-3"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Comportamiento y Ciclos Atmosféricos
            </h2>
            <p className="text-sm text-[#6B6B67] leading-relaxed">
              Analiza la evolución de las partículas a lo largo de las horas y los meses para identificar patrones de dispersión.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <ScrollReveal direction="right" delay={50} className="h-full">
            <TendenciaSemana />
          </ScrollReveal>
          <ScrollReveal direction="left" delay={150} className="h-full">
            <HistoricoMensual />
          </ScrollReveal>
        </div>
      </section>

      {/* ── ANÁLISIS PROFUNDO: HEATMAP + PERFILES DE SALUD ── */}
      <section id="sec-analisis" className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 py-24 border-t border-[#DDD5C4]/60">
        <ScrollReveal direction="down">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D6A4F] bg-[#2D6A4F]/10 px-3.5 py-1 rounded-full inline-block mb-3">
              Análisis Profundo
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A18] tracking-tight mb-4"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              La huella del tiempo y las personas.
            </h2>
            <p className="text-sm sm:text-base text-[#6B6B67] leading-relaxed">
              El aire no es igual para todos ni a todas horas. Explora cuándo es más limpio y qué significa para cada grupo.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={50}>
          <div className="mb-16">
            <HeatmapHoras />
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={100}>
          <SaludPerfiles />
        </ScrollReveal>
      </section>

      {/* ── 4. MAPA INTERACTIVO GEOESPACIAL ── */}
      <section id="sec-mapa" className="w-full py-16 border-t border-[#DDD5C4]/60">
        <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 mb-8 text-center">
          <ScrollReveal direction="down">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D6A4F] bg-[#2D6A4F]/10 px-3.5 py-1 rounded-full inline-block mb-3">
              Territorio y Cobertura
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#1A1A18] tracking-tight mb-3"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Mapa Geoespacial de Estaciones
            </h2>
            <p className="text-sm text-[#6B6B67] max-w-xl mx-auto">
              Explora en detalle los nodos de medición, consulta los niveles por barrio y traza tu trayecto saludable.
            </p>
          </ScrollReveal>
        </div>

        <div className="w-full" style={{ height: '720px' }}>
          <MapPage />
        </div>
      </section>

      {/* ── 5. PRONÓSTICO A 3 DÍAS ── */}
      <section id="sec-pronostico" className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 py-24 border-t border-[#DDD5C4]/60">
        <ScrollReveal direction="down">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D6A4F] bg-[#2D6A4F]/10 px-3.5 py-1 rounded-full inline-block mb-3">
              Proyecciones Meteorológicas
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#1A1A18] tracking-tight mb-3"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Pronóstico Atmosférico
            </h2>
            <p className="text-sm text-[#6B6B67] leading-relaxed">
              Condiciones de lluvia, temperatura y radiación estimadas para los próximos tres días en la capital del Valle.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={100}>
          <PronosticoCard />
        </ScrollReveal>
      </section>

      {/* ── 6. NOTICIAS & CULTURA AMBIENTAL ── */}
      <section id="sec-noticias" className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 py-24 border-t border-[#DDD5C4]/60">
        <ScrollReveal direction="up">
          <NoticiasSection />
        </ScrollReveal>
      </section>

    </div>
  );
};

export default HomePage;
