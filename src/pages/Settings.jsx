import React, { useState, useEffect, useRef } from 'react';
import { Save, Lock, AlertCircle, Download, Upload, Trash2, X, Loader } from 'lucide-react';
import { exportDatabase, importDatabase, clearDatabase } from '../utils/dataUtils';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('');

  // Data management state
  const [showResetModal, setShowResetModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(''); // Progress message
  const fileInputRef = useRef(null);

  useEffect(() => {
    const key = localStorage.getItem('GEMINI_API_KEY');
    if (key) setApiKey(key);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
      setStatus('Clave guardada correctamente.');
      setTimeout(() => setStatus(''), 3000);
    } else {
      localStorage.removeItem('GEMINI_API_KEY');
      setStatus('Clave eliminada.');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleExport = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setProgress('Iniciando exportación...');

    try {
      const result = await exportDatabase((msg) => setProgress(msg));
      setStatus(`Base de datos exportada (${result.count} monedas).`);
    } catch (error) {
      console.error(error);
      setStatus('Error al exportar base de datos.');
    } finally {
      setIsLoading(false);
      setProgress('');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (isLoading) return;
    setIsLoading(true);
    setProgress('Iniciando importación...');

    try {
      const result = await importDatabase(file, (msg) => setProgress(msg));
      setStatus(`Importación completada. Nuevas: ${result.count}. Total: ${result.totalProcessed}.`);
    } catch (error) {
      console.error(error);
      setStatus('Error al importar: ' + error.message);
    } finally {
      setIsLoading(false);
      setProgress('');
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleResetDatabase = async () => {
    if (deleteConfirmation === 'Borrar') {
      setIsLoading(true);
      try {
        await clearDatabase();
        setStatus('Base de datos restablecida correctamente.');
        setShowResetModal(false);
        setDeleteConfirmation('');
      } catch (error) {
        console.error(error);
        setStatus('Error al restablecer base de datos.');
      } finally {
        setIsLoading(false);
        setTimeout(() => setStatus(''), 3000);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <SettingsIcon /> Configuración
      </h2>

      <div className="space-y-8">
        {/* API Key Section */}
        <section className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-start gap-3">
            <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
            <p>
              Tu clave API de Google Gemini se guardará únicamente en el almacenamiento local de tu navegador.
              No se enviará a ningún servidor excepto a Google para procesar las imágenes.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                Google Gemini API Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Pegar API Key aquí..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Obtén tu clave en <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save size={18} />
              Guardar Configuración
            </button>
          </form>
        </section>

        <hr className="border-gray-200" />

        {/* Data Management Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Gestión de Datos</h3>
          <p className="text-sm text-gray-500">
            Exporta tu colección para guardarla o importarla en otro dispositivo.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading && progress.includes('Export') ? <Loader className="animate-spin" size={18} /> : <Download size={18} />}
              Exportar
            </button>

            <button
              onClick={handleImportClick}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading && progress.includes('Import') ? <Loader className="animate-spin" size={18} /> : <Upload size={18} />}
              Importar
            </button>
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".zip"
              className="hidden"
            />
          </div>

          {/* Progress Indicator */}
          {isLoading && progress && (
             <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2 overflow-hidden">
               <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-full"></div>
               <p className="text-xs text-center mt-1 text-gray-500">{progress}</p>
             </div>
          )}

          <div className="pt-2">
             <button
              onClick={() => setShowResetModal(true)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 size={18} />
              Restablecer Base de Datos
            </button>
          </div>
        </section>

        {status && (
          <div className={`mt-4 p-2 text-center rounded text-sm font-medium ${status.includes('error') || status.includes('eliminada') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {status}
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-gray-400">
        v1.0.4 (Gemini 3 Flash Preview)
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <AlertCircle size={20} />
                Confirmar Borrado
              </h3>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setDeleteConfirmation('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600 mb-4 text-sm">
              Esta acción borrará <strong className="text-red-600">TODOS</strong> los datos de la colección de forma permanente. No se puede deshacer.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Escribe <span className="font-mono font-bold">Borrar</span> para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Borrar"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setDeleteConfirmation('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetDatabase}
                disabled={deleteConfirmation !== 'Borrar' || isLoading}
                className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors
                  ${deleteConfirmation === 'Borrar'
                    ? 'bg-red-600 hover:bg-red-700 shadow-md'
                    : 'bg-gray-300 cursor-not-allowed'}`}
              >
                {isLoading ? 'Borrando...' : 'Confirmar Borrado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  )
}
