import React, { useRef } from 'react';
import { localDb } from '../localDb';
import { Database, Download, Upload, ShieldCheck, HelpCircle } from 'lucide-react';

export default function Settings() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    localDb.exportData();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (localDb.importData(content)) {
        alert('Datos importados correctamente. La página se recargará.');
        window.location.reload();
      } else {
        alert('Error al importar los datos. Asegúrate de que el archivo sea un backup válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12">
      <div className="border-l-[6px] border-slate-900 pl-5">
        <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter italic">Configuración</h1>
        <p className="text-emerald-600 text-lg font-bold uppercase tracking-widest">Gestión de Datos y App</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Backup Card */}
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3 mb-6">
            <Database className="text-emerald-600" size={32} />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Copia de Seguridad</h2>
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase mb-8 leading-relaxed">
            Tus datos se guardan solo en este navegador. Si borras el historial o cambias de PC, podrías perderlos.
            Usa estas herramientas para mover tus datos.
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={handleExport}
              className="w-full bg-slate-900 text-white py-4 font-black uppercase italic tracking-tighter flex items-center justify-center gap-3 hover:bg-emerald-600 transition-colors"
            >
              <Download size={20} /> RESPALDAR DATOS (EXPORTAR)
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white border-2 border-slate-900 text-slate-900 py-4 font-black uppercase italic tracking-tighter flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors"
            >
              <Upload size={20} /> RESTAURAR DATOS (IMPORTAR)
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImport} 
              accept=".json" 
              className="hidden" 
            />
          </div>
        </div>

        {/* Shortcut & Offline Card */}
        <div className="bg-emerald-900 text-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="text-emerald-400" size={32} />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Acceso Directo</h2>
          </div>
          <p className="text-xs text-emerald-100/60 font-bold uppercase mb-8 leading-relaxed">
            Puedes instalar esta aplicación en tu computadora para usarla como un programa normal, incluso sin internet.
          </p>

          <div className="space-y-4 border-t border-emerald-800 pt-6">
            <h4 className="font-black uppercase text-[10px] tracking-widest text-emerald-400">Cómo crear el acceso directo:</h4>
            <div className="bg-emerald-950 p-4 border-2 border-emerald-800 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white px-2 py-0.5 bg-emerald-800 inline-block">MÉTODO 1: INSTALACIÓN PWA (RECOMENDADO)</p>
                <p className="text-[10px] font-medium leading-relaxed text-emerald-100">
                  En Google Chrome o Microsoft Edge, busca el ícono de <b>"Instalar"</b> (una computadora con una flecha) en la barra de direcciones (arriba a la derecha). Esto creará un ícono en tu escritorio.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white px-2 py-0.5 bg-slate-800 inline-block">MÉTODO 2: MARCADOR DE ESCRITORIO</p>
                <p className="text-[10px] font-medium leading-relaxed text-emerald-100">
                  Arrastra el candado (o ícono de info) que está a la izquierda de la URL directamente a tu escritorio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border-4 border-dashed border-slate-300 p-8 flex items-start gap-4">
        <HelpCircle className="text-slate-400 shrink-0" size={24} />
        <div>
          <h3 className="font-black uppercase text-xs text-slate-600 mb-1">¿Cómo descargar la página completa?</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase leading-loose">
            Para usar LT Gestión fuera de este entorno: <br/>
            1. Ve al menú de ajustes (engranaje) de AI Studio y selecciona <b>"Export to ZIP"</b>.<br/>
            2. Descomprime en tu PC e instala <a href="https://nodejs.org/" target="_blank" className="text-emerald-600 underline">Node.js</a>.<br/>
            3. En una terminal en esa carpeta, ejecuta: <code className="bg-slate-200 px-1">npm install</code> y <code className="bg-slate-200 px-1">npm run build</code>.<br/>
            4. La aplicación lista estará en la carpeta <b>dist</b>. Para verla correctamente, debes servirla con un servidor local (como la extensión "Live Server" de VS Code) o subirla a la web.
          </p>
        </div>
      </div>
    </div>
  );
}
