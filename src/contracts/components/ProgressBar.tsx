import React from 'react';

export const ProgressBar: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
  const percentage = totalSteps > 0 ? Math.min(100, (currentStep / totalSteps) * 100) : 0;
  return (
    <div className="w-full bg-white rounded-2xl p-4 border-2 border-gray-200 shadow mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-700">Progresso</span>
        <span className="text-sm font-semibold text-emerald-600">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};


