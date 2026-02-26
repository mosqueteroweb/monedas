import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Settings } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'text-blue-600' : 'text-gray-400';

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md z-10 sticky top-0">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Catálogo de Monedas</h1>
        </div>
      </header>

      {/* Main Content - Scrollable Area */}
      <main className="flex-1 overflow-y-auto pb-24 p-4 container mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation - Fixed */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-lg z-20 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          <Link to="/" className={`flex flex-col items-center p-2 ${isActive('/')}`}>
            <Home size={24} />
            <span className="text-xs mt-1">Inicio</span>
          </Link>

          <Link to="/add" className="flex flex-col items-center text-blue-600 hover:text-blue-800 transform -translate-y-6 bg-white rounded-full p-3 border border-gray-200 shadow-lg hover:shadow-xl transition-all">
            <PlusCircle size={32} />
          </Link>

          <Link to="/settings" className={`flex flex-col items-center p-2 ${isActive('/settings')}`}>
            <Settings size={24} />
            <span className="text-xs mt-1">Ajustes</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
