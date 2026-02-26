import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { ArrowLeft, Trash2, DollarSign, RefreshCw } from 'lucide-react';
import { estimateValue } from '../utils/gemini';

export default function CoinDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const coin = useLiveQuery(() => db.coins.get(Number(id)), [id]);
  const [estimating, setEstimating] = useState(false);

  if (!coin) return <div className="p-4 text-center">Cargando...</div>;

  const handleEstimate = async () => {
    setEstimating(true);
    try {
      const value = await estimateValue(coin);
      await db.coins.update(Number(id), { marketValue: value, valueChecked: true });
    } catch (error) {
      console.error(error);
      alert('Error al estimar valor: ' + error.message);
    } finally {
      setEstimating(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de eliminar esta moneda?')) {
      await db.coins.delete(Number(id));
      navigate('/');
    }
  };

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-xl font-bold text-gray-800 truncate px-2">{coin.denomination}</h2>
        <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
          <Trash2 size={24} />
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 rounded-xl overflow-hidden shadow-sm aspect-square relative">
            <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">Anverso</span>
            {coin.frontImage && <img src={URL.createObjectURL(coin.frontImage)} className="w-full h-full object-contain" alt="Anverso" onLoad={(e) => URL.revokeObjectURL(e.target.src)} />}
          </div>
          <div className="bg-gray-100 rounded-xl overflow-hidden shadow-sm aspect-square relative">
            <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">Reverso</span>
            {coin.backImage && <img src={URL.createObjectURL(coin.backImage)} className="w-full h-full object-contain" alt="Reverso" onLoad={(e) => URL.revokeObjectURL(e.target.src)} />}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs text-gray-500 uppercase font-bold">País</label>
               <div className="text-lg font-medium">{coin.country}</div>
             </div>
             <div>
               <label className="block text-xs text-gray-500 uppercase font-bold">Año</label>
               <div className="text-lg font-medium">{coin.year || 'N/D'}</div>
             </div>
             <div>
               <label className="block text-xs text-gray-500 uppercase font-bold">Denominación</label>
               <div className="text-lg font-medium">{coin.denomination}</div>
             </div>
             <div>
               <label className="block text-xs text-gray-500 uppercase font-bold">Ceca</label>
               <div className="text-lg font-medium">{coin.mintMark || '-'}</div>
             </div>
           </div>

           <div className="pt-6 border-t mt-4">
             <div className="flex justify-between items-center mb-4">
               <span className="text-gray-500 font-medium">Valor Estimado</span>
               <span className="text-3xl font-bold text-green-600">
                 {coin.marketValue !== null ? `${coin.marketValue} €` : '---'}
               </span>
             </div>

             <button
               onClick={handleEstimate}
               disabled={estimating}
               className={`w-full py-3 rounded-xl font-bold text-white shadow-md flex justify-center items-center gap-2 transition-all active:scale-95
                 ${estimating ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}
               `}
             >
               {estimating ? <RefreshCw className="animate-spin" /> : <DollarSign />}
               {coin.marketValue !== null ? 'Re-tasar con IA' : 'Tasar con IA'}
             </button>
             <p className="text-xs text-gray-400 mt-2 text-center">
               Estimación basada en IA comparativa. No es una tasación oficial.
             </p>
           </div>
        </div>
      </div>
    </div>
  );
}
