import React from 'react';

export const ProgressBar: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
  const percentage = totalSteps > 0 ? Math.min(100, (currentStep / totalSteps) * 100) : 0;
  return (
    <div className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-700">Progresso</span>
        <span className="text-sm font-semibold text-accent">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-3 bg-gradient-to-r from-accent to-accent-secondary rounded-full" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};


