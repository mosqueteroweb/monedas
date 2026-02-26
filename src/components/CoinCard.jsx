import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function CoinCard({ coin }) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    let url;
    if (coin.frontImage) {
      url = URL.createObjectURL(coin.frontImage);
      setImageUrl(url);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [coin.frontImage]);

  return (
    <Link to={`/coin/${coin.id}`} className="block h-full group">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full border border-gray-100 transition-all hover:shadow-md hover:-translate-y-1">
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${coin.denomination} ${coin.year}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No img
            </div>
          )}
          <div className="absolute top-0 right-0 m-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
            {coin.year || 'N/D'}
          </div>
        </div>
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-800 text-sm truncate" title={coin.denomination}>
            {coin.denomination || 'Sin denominación'}
          </h3>
          <p className="text-xs text-gray-500 truncate" title={coin.country}>
            {coin.country || 'Desconocido'}
          </p>

          {coin.marketValue ? (
             <div className="mt-auto pt-2 text-green-600 font-bold text-sm">
               ~{coin.marketValue} €
             </div>
          ) : (
            <div className="mt-auto pt-2 text-gray-400 text-xs italic">
              Sin tasar
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
