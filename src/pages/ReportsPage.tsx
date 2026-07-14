// ===================================================
// TANGARA 2026 - pages/ReportsPage.tsx
// Generador de Reportes Ambientales
// ===================================================
import { useState } from 'react';
import { FileText, Download, Play, AlertCircle } from 'lucide-react';

const RECENT_REPORTS = [
  { id: 'R-01', name: 'Resumen Mensual - Calidad del Aire Cali (Mayo 2026)', date: '01/06/2026', size: '2.4 MB', format: 'PDF' },
  { id: 'R-02', name: 'Reporte de Outliers y Validación de Sensores (Q1 2026)', date: '15/05/2026', size: '1.8 MB', format: 'PDF' },
  { id: 'R-03', name: 'Serie Histórica de PM2.5 Comunas del Oriente (CSV)', date: '10/05/2026', size: '12.6 MB', format: 'CSV' },
];

const ReportsPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportFormat, setReportFormat] = useState('pdf');
  const [selectedNode, setSelectedNode] = useState('todos');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert('Reporte generado exitosamente. Haz clic en "Descargar" en el listado inferior.');
    }, 2000);
  };

  return (
    <div className="p-5 pt-4 space-y-4 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <FileText className="text-tangara" />
            Reportes Ambientales
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Genera, consulta y descarga informes técnicos en formato PDF o CSV sobre las mediciones históricas en Cali.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Generador de Reportes */}
        <div className="card p-5 lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Configurar Reporte</h3>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selector de Nodos */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nodo / Estación</label>
                <select
                  value={selectedNode}
                  onChange={e => setSelectedNode(e.target.value)}
                  className="w-full text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 p-2.5 rounded-xl outline-none"
                >
                  <option value="todos">Todos los Nodos (Red Completa)</option>
                  <option value="san_antonio">Nodo San Antonio</option>
                  <option value="versalles">Nodo Versalles</option>
                  <option value="ingenio">Nodo El Ingenio</option>
                  <option value="pance">Nodo Pance</option>
                </select>
              </div>

              {/* Selector de Rango */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rango de Tiempo</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    defaultValue="2026-05-01"
                    className="w-full text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 p-2 rounded-xl outline-none"
                  />
                  <input
                    type="date"
                    defaultValue="2026-05-31"
                    className="w-full text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 p-2 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Formato de Descarga */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Formato de Exportación</label>
                <div className="flex gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      checked={reportFormat === 'pdf'}
                      onChange={() => setReportFormat('pdf')}
                      className="accent-tangara"
                    />
                    PDF (Documento Técnico)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      checked={reportFormat === 'csv'}
                      onChange={() => setReportFormat('csv')}
                      className="accent-tangara"
                    />
                    CSV (Datos Brutos)
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className={`w-full font-bold text-white text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition ${
                isGenerating ? 'bg-tangara/50 cursor-wait' : 'bg-tangara hover:bg-tangara-dark shadow-sm'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Procesando 62M de filas en ClickHouse...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Generar y Descargar Reporte
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="card p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
              <AlertCircle size={14} className="text-tangara" />
              Acceso a Datos Abiertos
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Todos los datos de la red Tángara pertenecen a la ciudadanía de Cali. Están cobijados bajo la licencia abierta <strong>CC BY-SA 4.0</strong>, lo que permite su uso libre para investigaciones académicas o reportes comunitarios, siempre que se cite la autoría.
            </p>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider">Capa de Acceso Directo</span>
            <span className="text-[11px] font-semibold text-gray-700 block mt-1">API Endpoint: /api/meta/sample</span>
          </div>
        </div>
      </div>

      {/* Historial de Reportes Generados */}
      <div className="card p-5 space-y-3">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Reportes Recientes en el Repositorio</h3>
        <div className="divide-y divide-gray-100">
          {RECENT_REPORTS.map(r => (
            <div key={r.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 font-bold text-[10px]">
                  {r.format}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{r.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Generado el {r.date} · Tamaño: {r.size}</p>
                </div>
              </div>
              <button className="text-tangara hover:underline font-bold flex items-center gap-1">
                <Download size={13} />
                Descargar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
