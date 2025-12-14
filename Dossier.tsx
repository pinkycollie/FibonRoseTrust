
import React from 'react';
import type { Professional } from '../types';
import { SkeletonCard } from './SkeletonCard';
import { ProfessionalCard } from './ProfessionalCard';

interface DossierProps {
  isLoading: boolean;
  professionals: Professional[];
  filteredProfessionals: Professional[];
  onSelectProfessional: (professional: Professional) => void;
  onSelectLanguage: (languageName: string) => void;
}

export const Dossier: React.FC<DossierProps> = ({ isLoading, professionals, filteredProfessionals, onSelectProfessional, onSelectLanguage }) => {
  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center text-slate-300 col-span-1">
                Our AI is analyzing your request and finding the best matches...
            </h3>
            <div className="grid grid-cols-1 gap-6">
                {[...Array(3)].map((_, index) => (
                    <SkeletonCard key={index} />
                ))}
            </div>
        </div>
      </div>
    );
  }

  if (professionals.length > 0 && filteredProfessionals.length > 0) {
    return (
      <div className="mt-8 grid grid-cols-1 gap-6 animate-fade-in">
        {filteredProfessionals.map((prof, index) => (
          <ProfessionalCard 
            key={index} 
            professional={prof} 
            onSelectProfessional={onSelectProfessional} 
            onSelectLanguage={onSelectLanguage}
          />
        ))}
      </div>
    );
  }

  if (professionals.length > 0 && filteredProfessionals.length === 0) {
    return (
      <div className="mt-8 text-center py-8 bg-slate-800/50 rounded-lg">
          <p className="font-semibold text-slate-300">No professionals match your filters.</p>
          <p className="text-sm text-slate-400">Try adjusting your filter criteria.</p>
      </div>
    );
  }

  return null; // Render nothing if there are no professionals and not loading
};
