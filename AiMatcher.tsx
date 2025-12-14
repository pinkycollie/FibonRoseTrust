
import React, { useState, useCallback, useMemo } from 'react';
import type { Professional } from '../types';
import { findMatchingProfessionals } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { Dossier } from './Dossier';
import { ProfessionalDetail } from './ProfessionalDetail';
import { MultiSelectFilter } from './MultiSelectFilter';

const ALL_SIGN_LANGUAGES = [
  'Albanian Sign Language', 'American Sign Language (ASL)', 'Angolan Sign Language', 'Argentine Sign Language', 'Austrian Sign Language', 'Azerbaijani Sign Language', 
  'Bangla Sign Language', 'Belarusian Sign Language', 'Bolivian Sign Language', 'Bosnian Sign Language', 'Brazilian Sign Language (LIBRAS)', 'British Sign Language (BSL)',
  'Bulgarian Sign Language', 'Chilean Sign Language', 'Colombian Sign Language', 'Costa Rican Sign Language', 'Croatian Sign Language', 'Cypriot Sign Language',
  'Czech Sign Language', 'Danish Sign Language', 'Dutch Sign Language', 'Ecuadorian Sign Language', 'Estonian Sign Language', 'Finnish Sign Language', 
  'Flemish Sign Language', 'French Sign Language (LSF)', 'Georgian Sign Language', 'German Sign Language (DGS)', 'Greek Sign Language', 'Guatemalan Sign Language',
  'Hungarian Sign Language', 'Icelandic Sign Language', 'Indian Sign Language', 'Indonesian Sign Language', 'Irish Sign Language', 'Israeli Sign Language',
  'Italian Sign Language (LIS)', 'Japanese Sign Language (JSL)', 'Kenyan Sign Language', 'Korean Sign Language', 'Kosovar Sign Language', 'Latvian Sign Language', 
  'Lithuanian Sign Language', 'Luxembourgish Sign Language', 'Maltese Sign Language', 'Mexican Sign Language', 'Moldovan Sign Language', 'Moroccan Sign Language', 
  'New Zealand Sign Language', 'Norwegian Sign Language', 'Pidgin Signed English (PSE)', 'Polish Sign Language', 'Portuguese Sign Language', 'Romanian Sign Language',
  'Russian Sign Language', 'Salvadoran Sign Language', 'Serbian Sign Language', 'Slovak Sign Language', 'Slovenian Sign Language', 'South African Sign Language',
  'Spanish Sign Language (LSE)', 'Swedish Sign Language', 'Swiss German Sign Language', 'Turkish Sign Language', 'Ugandan Sign Language', 'Ukrainian Sign Language',
  'Uruguayan Sign Language', 'Uzbek Sign Language', 'Venezuelan Sign Language', 'Zimbabwean Sign Language'
].sort();

const PROFESSIONAL_CATEGORIES = [
  'Academia & Research',
  'Communication Access',
  'Finance & Business',
  'Healthcare',
  'Legal Services',
  'Technology',
].sort();

interface AiMatcherProps {
  onSelectLanguage: (languageName: string) => void;
}

export const AiMatcher: React.FC<AiMatcherProps> = ({ onSelectLanguage }) => {
  const [query, setQuery] = useState<string>('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    location: '',
    isDeaf: false,
    knowsSignLanguage: false,
    trustScoreRange: [85, 100] as [number, number],
    signLanguages: [] as string[],
    categories: [] as string[],
  });
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  const exampleQueries = [
    "ASL interpreter for a tech conference in Austin, TX.",
    "A deaf-aware therapist specializing in family counseling.",
    "Financial advisor experienced with deaf clients.",
    "Legal aid for a disability rights case."
  ];

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setError('Please describe the professional you are looking for.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setProfessionals([]);

    try {
      const results = await findMatchingProfessionals(query, activeFilters);
      setProfessionals(results);
    } catch (err) {
      console.error(err);
      setError('An error occurred while matching professionals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [query, activeFilters]);

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
    // Reset filters for a clean example search
    setActiveFilters({
        location: '',
        isDeaf: false,
        knowsSignLanguage: false,
        trustScoreRange: [85, 100],
        signLanguages: [],
        categories: [],
    });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setActiveFilters(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'trustScoreRange') {
        const minScore = parseInt(value, 10);
        setActiveFilters(prev => ({ ...prev, trustScoreRange: [minScore, 100] }));
    } else {
        setActiveFilters(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleMultiSelectChange = (name: string, selected: string[]) => {
    setActiveFilters(prev => ({ ...prev, [name]: selected }));
  };


  const filteredProfessionals = useMemo(() => {
    return professionals.filter(prof => {
      const { location, isDeaf, knowsSignLanguage, trustScoreRange, signLanguages, categories } = activeFilters;
      const [minTrustScore] = trustScoreRange;
      if (prof.trustScore < minTrustScore) return false;
      if (isDeaf && !prof.isDeaf) return false;
      if (knowsSignLanguage && prof.signLanguages.length === 0) return false;
      if (location && !prof.location.toLowerCase().includes(location.toLowerCase().trim())) return false;
      if (signLanguages.length > 0 && !signLanguages.some(lang => prof.signLanguages.includes(lang))) return false;
      if (categories.length > 0 && !categories.includes(prof.category)) return false;
      return true;
    });
  }, [professionals, activeFilters]);


  return (
    <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 md:p-8 shadow-2xl shadow-cyan-500/10">
      <div className="flex items-center gap-3 mb-4">
        <SparklesIcon className="w-8 h-8 text-cyan-400" />
        <h2 className="text-2xl font-bold text-white">Intelligent Professional Matching</h2>
      </div>
      <p className="text-slate-400 mb-6">
        Describe your needs, and our AI will find verified professionals tailored for you.
      </p>

      <div className="flex flex-col md:flex-row gap-2">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., 'I need a sign language interpreter for a medical appointment who specializes in cardiology...'"
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none transition-shadow text-slate-200 placeholder-slate-500 resize-none"
          rows={2}
          disabled={isLoading}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full md:w-auto px-6 py-3 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
        >
          {isLoading ? (
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : 'Find Professional'}
        </button>
      </div>

      <div className="mt-4 text-sm text-slate-400 flex flex-wrap gap-x-3 gap-y-2 items-center">
        <span>Try an example:</span>
        {exampleQueries.map((ex) => (
            <button 
              key={ex} 
              onClick={() => handleExampleClick(ex)}
              className="px-2 py-1 bg-slate-700 rounded-md hover:bg-slate-600 hover:scale-105 transform transition-all duration-200"
            >
              {ex}
            </button>
        ))}
      </div>

      {error && <p className="mt-6 text-center text-red-400 bg-red-900/30 p-3 rounded-lg">{error}</p>}
      
      <div className="my-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                  <label htmlFor="cat-filter" className="block text-sm font-medium text-slate-300 mb-1">Professional Category</label>
                  <MultiSelectFilter
                    id="cat-filter"
                    options={PROFESSIONAL_CATEGORIES}
                    selectedOptions={activeFilters.categories}
                    onChange={(selected) => handleMultiSelectChange('categories', selected)}
                    placeholder="Filter by category"
                  />
              </div>
              <div>
                  <label htmlFor="loc-filter" className="block text-sm font-medium text-slate-300 mb-1">Location</label>
                  <input type="text" id="loc-filter" name="location" value={activeFilters.location} onChange={handleFilterChange} placeholder="e.g., Austin, TX" className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none transition-shadow text-slate-200 placeholder-slate-500" />
              </div>
              <div className="md:col-span-2">
                  <label htmlFor="sign-lang-filter" className="block text-sm font-medium text-slate-300 mb-1">Sign Languages</label>
                  <MultiSelectFilter
                    id="sign-lang-filter"
                    options={ALL_SIGN_LANGUAGES}
                    selectedOptions={activeFilters.signLanguages}
                    onChange={(selected) => handleMultiSelectChange('signLanguages', selected)}
                    placeholder="Select one or more languages"
                  />
              </div>
               <div className="md:col-span-2">
                  <label htmlFor="trust-score-filter" className="block text-sm font-medium text-slate-300 mb-1">
                    Min Trust Score: <span className="font-bold text-emerald-400">{activeFilters.trustScoreRange[0]}</span>
                  </label>
                  <input 
                      type="range" 
                      id="trust-score-filter" 
                      name="trustScoreRange" 
                      min="70" 
                      max="100" 
                      value={activeFilters.trustScoreRange[0]} 
                      onChange={handleFilterChange}
                  />
              </div>
              <div className="flex items-center gap-4 md:col-span-2">
                  <label className="flex items-center cursor-pointer">
                      <input type="checkbox" name="isDeaf" checked={activeFilters.isDeaf} onChange={handleFilterChange} className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-rose-500 focus:ring-rose-500 accent-rose-500" />
                      <span className="ml-2 text-sm text-slate-300">Deaf Professional</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                      <input type="checkbox" name="knowsSignLanguage" checked={activeFilters.knowsSignLanguage} onChange={handleFilterChange} className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-rose-500 focus:ring-rose-500 accent-rose-500" />
                      <span className="ml-2 text-sm text-slate-300">Knows Sign Language</span>
                  </label>
              </div>
          </div>
      </div>

      <Dossier
        isLoading={isLoading}
        professionals={professionals}
        filteredProfessionals={filteredProfessionals}
        onSelectProfessional={setSelectedProfessional}
        onSelectLanguage={onSelectLanguage}
      />

      {selectedProfessional && (
        <ProfessionalDetail 
          professional={selectedProfessional}
          onClose={() => setSelectedProfessional(null)}
          onSelectLanguage={onSelectLanguage}
        />
      )}
    </section>
  );
};
