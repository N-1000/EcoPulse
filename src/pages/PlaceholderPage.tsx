// ===================================================
// TANGARA 2026 - pages/PlaceholderPage.tsx
// Vista temporal para secciones del menú aún no desarrolladas.
// Para crear una vista real: crea src/pages/<Nombre>Page.tsx y
// regístrala en el switch de Layout.tsx.
// ===================================================
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage = ({ title }: PlaceholderPageProps) => (
  <div className="p-5 h-full flex items-center justify-center">
    <div className="card p-10 text-center max-w-md">
      <div className="w-14 h-14 rounded-2xl bg-pastel flex items-center justify-center mx-auto mb-4">
        <Construction size={26} className="text-tangara" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-2">
        Esta sección está en construcción. Muy pronto encontrarás aquí
        más herramientas de inteligencia ambiental para Cali. 🌿
      </p>
    </div>
  </div>
);

export default PlaceholderPage;
