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

        {/* Offline Card */}
        <div className="bg-emerald-900 text-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="text-emerald-400" size={32} />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Uso Sin Conexión</h2>
          </div>
          <p className="text-xs text-emerald-100/60 font-bold uppercase mb-8 leading-relaxed">
            Esta aplicación está preparada para funcionar offline (PWA). Una vez instalada o abierta,
            seguirá funcionando aunque no tengas internet.
          </p>

          <div className="space-y-2 border-t border-emerald-800 pt-6">
            <h4 className="font-black uppercase text-[10px] tracking-widest text-emerald-400">Instrucciones Offline:</h4>
            <ul className="text-[10px] font-bold uppercase space-y-2 text-emerald-50">
              <li className="flex gap-2"><span>1.</span> Abre la app desde tu PC descargada.</li>
              <li className="flex gap-2"><span>2.</span> Usa el botón "Instalar" en la barra de direcciones de Chrome/Edge si aparece.</li>
              <li className="flex gap-2"><span>3.</span> Los datos se mantienen persistentes localmente.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border-4 border-dashed border-slate-300 p-8 flex items-start gap-4">
        <HelpCircle className="text-slate-400 shrink-0" size={24} />
        <div>
          <h3 className="font-black uppercase text-xs text-slate-600 mb-1">¿Cómo descargar la página completa?</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase leading-loose">
            Para usar LT Gestión fuera de este entorno: Ve al menú de ajustes (icono de engranaje) de la plataforma AI Studio, 
            selecciona <b>"Export to ZIP"</b>. Descarga el archivo, descomprímelo y abre el proyecto. 
            Necesitarás Node.js instalado para correrlo por primera vez, o simplemente puedes construirlo 
            y guardar la carpeta <b>dist</b>.
          </p>
        </div>
      </div>
    </div>
  );
}
