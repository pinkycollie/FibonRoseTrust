
import React from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface LanguageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  languageName: string | null;
  info: string | null;
  isLoading: boolean;
}

export const LanguageInfoModal: React.FC<LanguageInfoModalProps> = ({ isOpen, onClose, languageName, info, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg m-4 shadow-2xl shadow-cyan-500/20 flex flex-col"
        onClick={e => e.stopPropagation()}
        aria-labelledby="language-info-title"
      >
        <header className="p-4 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-cyan-400" />
            <h2 id="language-info-title" className="text-lg font-bold text-white">About {languageName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            aria-label="Close language information"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6 min-h-[150px] flex items-center justify-center">
          {isLoading ? (
            <div className="text-center" aria-live="polite">
              <svg className="animate-spin mx-auto h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-3 text-slate-400">Fetching information with AI...</p>
            </div>
          ) : (
            <p className="text-slate-300 leading-relaxed">{info}</p>
          )}
        </div>
      </div>
    </div>
  );
};
