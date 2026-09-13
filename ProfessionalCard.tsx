
import React from 'react';
import type { Professional } from '../types';
import { VerificationStatus } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { LinkIcon } from './icons/LinkIcon';
import { DeafIcon } from './icons/DeafIcon';
import { SignLanguageIcon } from './icons/SignLanguageIcon';
import { MailIcon } from './icons/MailIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { TrustScoreIndicator } from './TrustScoreIndicator';
import { InformationCircleIcon } from './icons/InformationCircleIcon';

interface ProfessionalCardProps {
  professional: Professional;
  onSelectProfessional: (professional: Professional) => void;
  onSelectLanguage: (languageName: string) => void;
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({ professional, onSelectProfessional, onSelectLanguage }) => {
  const mapQuery = encodeURIComponent(`${professional.name}, ${professional.location}`);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  const verifiedChecks = professional.verificationChecks.filter(
    (c) => c.status === VerificationStatus.Verified
  );

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 transition-all duration-300 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/10 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start gap-5">
        <img 
          src={professional.avatarUrl} 
          alt={professional.name} 
          className="w-20 h-20 rounded-full border-2 border-slate-600 object-cover"
        />
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-white">{professional.name}</h3>
            <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-cyan-400 font-medium">{professional.category}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {professional.specializations.map((spec, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded-full">
                {spec}
              </span>
            ))}
          </div>
           <div className="mt-3 flex flex-col items-start gap-3 text-xs">
            {professional.isDeaf && (
                <span className="flex items-center gap-1 px-2 py-1 bg-indigo-600/50 text-indigo-300 rounded-full font-medium">
                    <DeafIcon className="w-4 h-4" /> Deaf Professional
                </span>
            )}
            {professional.signLanguages.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {/* Fix: Wrap icon in a span to apply the title attribute, which is not supported directly on the SVG component type. */}
                    <span className="flex-shrink-0" title="Knows Sign Language">
                        <SignLanguageIcon className="w-5 h-5 text-sky-300" />
                    </span>
                    {professional.signLanguages.map((lang) => (
                        <button
                            key={lang}
                            onClick={() => onSelectLanguage(lang)}
                            className="flex items-center gap-1 px-2 py-1 bg-sky-600/50 text-sky-300 rounded-full font-medium text-xs hover:bg-sky-600/80 transition-colors"
                            title={`Learn more about ${lang}`}
                            aria-label={`Learn more about ${lang}`}
                        >
                            <span>{lang}</span>
                            <InformationCircleIcon className="w-3.5 h-3.5 opacity-70" />
                        </button>
                    ))}
                </div>
            )}
          </div>
        </div>
        <TrustScoreIndicator score={professional.trustScore} />
      </div>
      <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
        <p className="text-sm text-slate-400 italic">
          <span className="font-semibold text-slate-300 not-italic">AI Verification Summary:</span> {professional.verificationSummary}
        </p>

        {verifiedChecks.length > 0 && (
            <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Key Verifications</h4>
                <ul className="space-y-1.5">
                    {verifiedChecks.slice(0, 2).map((check) => (
                        <li key={check.id} className="flex items-center gap-2 text-sm" title={check.description}>
                            <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span className="text-slate-300">{check.name}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {(professional.email || professional.phone) && (
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2 text-sm">
            {professional.email && (
              <div className="flex items-center gap-2 text-slate-300">
                <MailIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <a href={`mailto:${professional.email}`} className="hover:underline hover:text-rose-400 transition-colors">{professional.email}</a>
              </div>
            )}
            {professional.phone && (
              <div className="flex items-center gap-2 text-slate-300">
                <PhoneIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span>{professional.phone}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
                <MapPinIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span>{professional.location}</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onSelectProfessional(professional)}
                    className="px-3 py-1.5 border border-slate-600 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors duration-200"
                >
                    Full Profile
                </button>
                <a 
                    href={mapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-500 transition-all duration-200 transform hover:scale-105"
                >
                    Map
                </a>
            </div>
        </div>

        {professional.sources && professional.sources.length > 0 && (
            <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Verified Sources</h4>
                <ul className="space-y-2">
                    {professional.sources.map((source, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <LinkIcon className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline text-sm truncate" title={source.title}>
                                {source.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>
    </div>
  );
};
