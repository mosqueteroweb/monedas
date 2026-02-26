import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import CoinCard from '../components/CoinCard';

export default function Home() {
  const coins = useLiveQuery(() => db.coins.toArray());

  if (!coins) return <div className="p-4 text-center text-gray-500">Cargando catálogo...</div>;

  return (
    <div className="h-full flex flex-col">
      {coins.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center space-y-4">
          <div className="bg-gray-100 rounded-full p-6">
            <PlusCircle size={48} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Tu catálogo está vacío</h2>
          <p className="max-w-xs">Empieza a añadir monedas pulsando el botón + abajo o aquí mismo.</p>
          <Link to="/add" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium shadow-lg transition-transform active:scale-95 flex items-center gap-2">
            <PlusCircle size={20} />
            Añadir Primera Moneda
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 pb-24">
          {coins.map((coin) => (
            <div key={coin.id} className="w-full">
              <CoinCard coin={coin} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
