import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

export default function TWNavbar() {
  return (
    <header className="bg-white/80 backdrop-blur sticky top-0 z-40 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to={ROUTES.HOME} className="flex items-center gap-3 text-slate-900">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">A</div>
          <span className="text-xl font-semibold">Assistly</span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link to={ROUTES.HOME} className="text-slate-700 hover:text-slate-900 px-3 py-2 rounded-md">Home</Link>
          <Link to="/tw-demo" className="text-slate-700 hover:text-slate-900 px-3 py-2 rounded-md">UI Demo</Link>
          <Link to={ROUTES.REQUESTS} className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700">Get Help</Link>
        </nav>
      </div>
    </header>
  );
}
