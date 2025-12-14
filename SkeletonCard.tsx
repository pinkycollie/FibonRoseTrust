import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start gap-5 animate-pulse">
        <div className="w-20 h-20 rounded-full bg-slate-700 flex-shrink-0"></div>
        <div className="flex-grow w-full">
          <div className="h-6 w-3/5 rounded bg-slate-700"></div>
          <div className="h-4 w-2/5 rounded bg-slate-700 mt-2"></div>
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="h-5 w-20 rounded-full bg-slate-700"></div>
            <div className="h-5 w-24 rounded-full bg-slate-700"></div>
            <div className="h-5 w-16 rounded-full bg-slate-700"></div>
          </div>
        </div>
        <div className="w-24 h-24 rounded-full bg-slate-700 flex-shrink-0"></div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-700 space-y-4 animate-pulse">
        <div className="space-y-2">
            <div className="h-4 w-full rounded bg-slate-700"></div>
            <div className="h-4 w-4/5 rounded bg-slate-700"></div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="h-5 w-1/3 rounded bg-slate-700"></div>
          <div className="h-9 w-28 rounded-lg bg-slate-700"></div>
        </div>
        <div>
          <div className="h-4 w-32 mb-3 rounded bg-slate-700"></div>
          <div className="space-y-2">
            <div className="h-5 w-full rounded bg-slate-700"></div>
            <div className="h-5 w-full rounded bg-slate-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
};