// ===================================================
// ECOPULSE 2026 - pages/ParticipatePage.tsx
// Participación Ciudadana y Reporte de Quemas
// ===================================================
import { useState } from 'react';
import { Users, Send, MapPin, Radio, ShieldCheck } from 'lucide-react';

const ParticipatePage = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [comuna, setComuna] = useState('Comuna 3');
  const [type, setType] = useState('quema');
  const [desc, setDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !desc) return;

    const newReport = {
      id: Date.now(),
      name,
      comuna,
      type,
      desc,
      date: new Date().toLocaleDateString(),
    };

    setReports([newReport, ...reports]);
    setName('');
    setDesc('');
    alert('Reporte ciudadano recibido. Se visualizará localmente para la demostración.');
  };

  return (
    <div className="p-5 pt-4 space-y-4 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Users className="text-tangara" />
            Participación Ciudadana
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Sé parte activa del cambio. Reporta anomalías ambientales e infórmate sobre cómo instalar tu propio nodo sensor.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Formulario de Reportes */}
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Send size={16} className="text-tangara" />
            Formulario de Alerta Ciudadana
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tu Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. María Pérez"
                  className="w-full text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 p-2.5 rounded-xl outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Comuna del Suceso</label>
                <select
                  value={comuna}
                  onChange={e => setComuna(e.target.value)}
                  className="w-full text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 p-2.5 rounded-xl outline-none"
                >
                  <option value="Comuna 2">Comuna 2 (Norte)</option>
                  <option value="Comuna 3">Comuna 3 (San Antonio)</option>
                  <option value="Comuna 17">Comuna 17 (El Ingenio)</option>
                  <option value="Comuna 21">Comuna 21 (Desepaz)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipo de Incidente</label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="incident"
                    checked={type === 'quema'}
                    onChange={() => setType('quema')}
                    className="accent-tangara"
                  />
                  Quema de Residuos
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="incident"
                    checked={type === 'humo'}
                    onChange={() => setType('humo')}
                    className="accent-tangara"
                  />
                  Humo Industrial / Vehicular
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Descripción del Incidente</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Describe brevemente lo observado..."
                rows={3}
                className="w-full text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 p-2.5 rounded-xl outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-tangara hover:bg-tangara-dark font-bold text-white text-xs py-2.5 rounded-xl shadow-sm transition"
            >
              Enviar Alerta
            </button>
          </form>
        </div>

        {/* Cómo fabricar tu sensor */}
        <div className="card p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Radio size={16} className="text-tangara" />
              Construye tu propio Sensor Ciudadano
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Tángara es código abierto. Puedes fabricar una estación de monitoreo para tu casa con componentes electrónicos estándar:
            </p>
            <ul className="text-xs text-gray-500 list-disc list-inside space-y-1 pt-1">
              <li>Microcontrolador ESP32 o TTGO (Transmite vía Wi-Fi).</li>
              <li>Sensor óptico de material particulado <strong>PMS5003</strong>.</li>
              <li>Sensor de temperatura y humedad relativa <strong>SHT31</strong>.</li>
            </ul>
          </div>

          <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-xs text-sky-800 space-y-1">
            <span className="font-bold flex items-center gap-1">
              <ShieldCheck size={14} />
              Únete a la Red
            </span>
            <p className="text-[10px] leading-relaxed">
              Una vez ensamblado, descarga el firmware de PlatformIO e introduce tu API Key ciudadana en el archivo de configuración. El mapa registrará tu nodo al instante.
            </p>
          </div>
        </div>
      </div>

      {/* Reportes de la comunidad */}
      {reports.length > 0 && (
        <div className="card p-5 space-y-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1">
            <MapPin size={14} className="text-tangara" />
            Alertas Ciudadanas en Curso (Demostración)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reports.map(r => (
              <div key={r.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-800">{r.name} - {r.comuna}</span>
                  <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    {r.type}
                  </span>
                </div>
                <p className="text-gray-600">{r.desc}</p>
                <p className="text-[9px] text-gray-400 mt-2">Reportado el {r.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipatePage;
