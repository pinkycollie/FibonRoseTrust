import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface MultiSelectFilterProps {
  id: string;
  options: string[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({ id, options, selectedOptions, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionToggle = (option: string) => {
    const newSelectedOptions = selectedOptions.includes(option)
      ? selectedOptions.filter(o => o !== option)
      : [...selectedOptions, option];
    onChange(newSelectedOptions);
  };

  const filteredOptions = useMemo(() => 
    options.filter(option => 
      option.toLowerCase().includes(searchTerm.toLowerCase())
    ), [options, searchTerm]);

  const getButtonLabel = () => {
    if (selectedOptions.length === 0) {
      return placeholder;
    }
    if (selectedOptions.length <= 3) {
      return selectedOptions.join(', ');
    }
    const firstThree = selectedOptions.slice(0, 3).join(', ');
    return `${firstThree}, +${selectedOptions.length - 3} more`;
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between p-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none transition-shadow text-left"
      >
        <span className={`truncate ${selectedOptions.length === 0 ? 'text-slate-400' : 'text-slate-200'}`}>
          {getButtonLabel()}
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-xl max-h-60 flex flex-col">
          <div className="p-2 border-b border-slate-600">
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search languages..."
                    className="w-full p-2 pr-8 bg-slate-800 border border-slate-600 rounded-md focus:ring-1 focus:ring-rose-500 focus:outline-none text-slate-200"
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-white">
                        <XCircleIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
          </div>
          <ul
            tabIndex={-1}
            role="listbox"
            className="overflow-y-auto flex-grow"
          >
            {filteredOptions.map(option => (
              <li
                key={option}
                onClick={() => handleOptionToggle(option)}
                role="option"
                aria-selected={selectedOptions.includes(option)}
                className="px-4 py-2 text-slate-300 cursor-pointer hover:bg-rose-500/10 flex items-center justify-between"
              >
                <span>{option}</span>
                {selectedOptions.includes(option) && (
                    <svg className="w-5 h-5 text-rose-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                )}
              </li>
            ))}
             {filteredOptions.length === 0 && (
                <li className="px-4 py-2 text-slate-500 text-center">No results found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
