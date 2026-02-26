import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import AddCoin from './pages/AddCoin';
import Settings from './pages/Settings';
import CoinDetail from './pages/CoinDetail';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="add" element={<AddCoin />} />
          <Route path="settings" element={<Settings />} />
          <Route path="coin/:id" element={<CoinDetail />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
