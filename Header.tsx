
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-500">
            Fibonrose Trust
            </h1>
            <p className="hidden md:block mt-1 text-sm text-slate-400">
            AI-Powered Professional Verification & Trust System
            </p>
        </div>
        <a 
            href="#professional-signup" 
            className="px-4 py-2 border border-rose-500 text-rose-400 font-semibold rounded-lg hover:bg-rose-500/10 transition-colors duration-300 text-sm"
        >
            For Professionals
        </a>
      </div>
    </header>
  );
};