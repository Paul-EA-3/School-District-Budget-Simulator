import React from 'react';
import { Scenario } from '../types';

interface ScenarioCardProps {
  scenario: Scenario;
  onSelect: () => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onSelect }) => {
  const Icon = scenario.icon;
  
  const difficultyColors = {
    Hard: 'bg-red-100 text-red-700',
    Medium: 'bg-blue-100 text-blue-700',
    Expert: 'bg-purple-100 text-purple-700',
  };

  const iconColors = {
    Hard: 'bg-red-100 text-red-600',
    Medium: 'bg-blue-100 text-blue-600',
    Expert: 'bg-purple-100 text-purple-600',
  };

  const difficultyClass = difficultyColors[scenario.difficulty] || difficultyColors.Medium;
  const iconClass = iconColors[scenario.difficulty] || iconColors.Medium;

  return (
    <div 
      onClick={onSelect}
      className="bg-white p-6 rounded-xl shadow-md border border-slate-200 hover:shadow-xl hover:border-blue-500 cursor-pointer transition-all duration-200 group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${iconClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${difficultyClass}`}>
          {scenario.difficulty}
        </span>
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600">{scenario.title}</h3>
      <p className="text-sm text-slate-500 mb-4 line-clamp-3">{scenario.description}</p>
      <div className="text-xs font-mono text-slate-400">
        Starts: ${scenario.initialState.structuralGap < 0 ? '-' : ''}${Math.abs(scenario.initialState.structuralGap / 1000000).toFixed(1)}M Gap
      </div>
    </div>
  );
};

export default ScenarioCard;