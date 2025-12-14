
import React from 'react';

interface TrustScoreIndicatorProps {
  score: number;
  size?: 'normal' | 'large';
}

export const TrustScoreIndicator: React.FC<TrustScoreIndicatorProps> = ({ score, size = 'normal' }) => {
    const getScoreColor = () => {
        if (score >= 95) return 'text-emerald-400';
        if (score >= 90) return 'text-blue-400';
        if (score >= 80) return 'text-yellow-400';
        return 'text-orange-400';
    };

    const isLarge = size === 'large';
    
    // Using explicit classes so Tailwind CSS can detect and include them.
    const containerClasses = isLarge ? "w-32 h-32" : "w-24 h-24";
    const radius = isLarge ? 22 : 18;
    const strokeWidth = isLarge ? 4 : 3;
    const textClass = isLarge ? "text-3xl" : "text-2xl";
    const viewBox = isLarge ? "0 0 50 50" : "0 0 40 40";
    const center = isLarge ? 25 : 20;

    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className={`relative ${containerClasses} flex-shrink-0`}>
            <svg className="w-full h-full" viewBox={viewBox}>
                <circle
                    className="text-slate-700"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={center}
                    cy={center}
                />
                <circle
                    className={`${getScoreColor()} transition-all duration-1000 ease-out`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={center}
                    cy={center}
                    transform={`rotate(-90 ${center} ${center})`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`${textClass} font-bold ${getScoreColor()}`}>{score}</span>
                <span className="text-xs text-slate-400">Trust Score</span>
            </div>
        </div>
    );
};
