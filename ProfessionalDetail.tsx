
import React from 'react';
import type { Professional } from '../types';
import { VerificationStatus } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { TrustScoreIndicator } from './TrustScoreIndicator';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { DeafIcon } from './icons/DeafIcon';
import { SignLanguageIcon } from './icons/SignLanguageIcon';
import { MailIcon } from './icons/MailIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { LinkIcon } from './icons/LinkIcon';
import { ClockIcon } from './icons/ClockIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';


interface ProfessionalDetailProps {
  professional: Professional;
  onClose: () => void;
  onSelectLanguage: (languageName: string) => void;
}

const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.Verified:
        return <CheckCircleIcon className="w-6 h-6 text-emerald-400 flex-shrink-0" />;
      case VerificationStatus.Pending:
      case VerificationStatus.InProgress:
        return <ClockIcon className="w-6 h-6 text-yellow-400 flex-shrink-0" />;
      case VerificationStatus.Failed:
        return <XCircleIcon className="w-6 h-6 text-red-400 flex-shrink-0" />;
      default:
        return null;
    }
};

export const ProfessionalDetail: React.FC<ProfessionalDetailProps> = ({ professional, onClose, onSelectLanguage }) => {
  const mapQuery = encodeURIComponent(`${professional.name}, ${professional.location}`);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 shadow-2xl shadow-rose-500/20 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 md:p-8 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white">{professional.name}</h2>
              <p className="text-cyan-400 font-medium">{professional.category}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              aria-label="Close professional details"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div className="p-6 md:p-8 space-y-6">
          <section className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <img
              src={professional.avatarUrl}
              alt={professional.name}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-slate-600 object-cover flex-shrink-0"
            />
            <div className="flex-grow">
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {professional.specializations.map((spec, index) => (
                  <span key={index} className="px-2.5 py-1 text-sm bg-slate-700 text-slate-300 rounded-full">
                    {spec}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-col items-center md:items-start gap-3 text-sm">
                {professional.isDeaf && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600/50 text-indigo-300 rounded-full font-medium">
                    <DeafIcon className="w-4 h-4" /> Deaf Professional
                  </span>
                )}
                {professional.signLanguages.length > 0 && (
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                    {/* Fix: Wrap icon in a span to apply the title attribute, which is not supported directly on the SVG component type. */}
                    <span className="flex-shrink-0" title="Knows Sign Language">
                        <SignLanguageIcon className="w-5 h-5 text-sky-300" />
                    </span>
                    {professional.signLanguages.map((lang) => (
                        <button
                            key={lang}
                            onClick={() => onSelectLanguage(lang)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-sky-600/50 text-sky-300 rounded-full font-medium text-sm hover:bg-sky-600/80 transition-colors"
                            title={`Learn more about ${lang}`}
                            aria-label={`Learn more about ${lang}`}
                        >
                          <span>{lang}</span>
                          <InformationCircleIcon className="w-4 h-4 opacity-70" />
                        </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-slate-900/50 p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex-grow">
                <h3 className="font-semibold text-lg text-slate-200">AI Verification Summary</h3>
                <p className="mt-1 text-slate-400">{professional.verificationSummary}</p>
             </div>
             <TrustScoreIndicator score={professional.trustScore} size="large" />
          </section>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            <section className="md:col-span-2">
              <h4 className="text-md font-semibold text-slate-300 mb-3">Verification Details</h4>
              <ul className="space-y-4">
                {professional.verificationChecks.map((check) => (
                  <li key={check.id} className="flex items-start gap-4">
                    <div>{getStatusIcon(check.status)}</div>
                    <div className="flex-grow">
                      <p className="font-semibold text-slate-200">{check.name}</p>
                      <p className="text-sm text-slate-400 mt-0.5">{check.description}</p>
                      {check.verifiedOn && check.status === VerificationStatus.Verified && (
                        <p className="text-xs text-slate-500 mt-1 font-mono">
                          Verified: {new Date(check.verifiedOn).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="text-md font-semibold text-slate-300 mb-3">Contact & Location</h4>
              <div className="space-y-3 text-sm">
                {professional.email && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <MailIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <a href={`mailto:${professional.email}`} className="hover:underline hover:text-rose-400 transition-colors">{professional.email}</a>
                  </div>
                )}
                {professional.phone && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <PhoneIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <span>{professional.phone}</span>
                  </div>
                )}
                 <div className="flex items-center gap-3 text-slate-300">
                    <MapPinIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <span>{professional.location}</span>
                </div>
              </div>
            </section>

            {professional.sources && professional.sources.length > 0 && (
            <section>
              <h4 className="text-md font-semibold text-slate-300 mb-3">Verified Sources</h4>
              <ul className="space-y-2">
                {professional.sources.map((source, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <LinkIcon className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline text-sm" title={source.title}>
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          </div>

        </div>
        <footer className="p-6 text-center border-t border-slate-700 mt-auto sticky bottom-0 bg-slate-800 z-10">
            <a 
                href={mapUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-block px-6 py-2 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-500 transition-all duration-200 transform hover:scale-105"
            >
                View on Map
            </a>
        </footer>
      </div>
    </div>
  );
};
