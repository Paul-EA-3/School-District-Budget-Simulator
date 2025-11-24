
import React from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { Card, SelectionState } from '../types';

interface GridCardProps {
  card: Card;
  showWarning?: boolean;
  oneTimeMode?: boolean;
  onMove?: (id: string, dest: SelectionState) => void;
}

const GridCard: React.FC<GridCardProps> = ({ card, showWarning, oneTimeMode, onMove }) => {
  const isCost = card.cost > 0;
  const fiscalCliffWarning = oneTimeMode && card.isRecurring;

  const riskColors = {
    High: 'text-red-700 bg-red-50 border-red-100',
    Medium: 'text-orange-700 bg-orange-50 border-orange-100',
    Low: 'text-slate-600 bg-slate-50 border-slate-100',
  };
  const riskStyle = riskColors[card.riskFactor] || riskColors.Low;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      draggable="true"
      onDragStart={handleDragStart}
      className="bg-white p-3 rounded shadow-sm border border-slate-200 mb-2 hover:shadow-md hover:border-indigo-300 transition-all relative group flex flex-col cursor-grab active:cursor-grabbing select-none hover:z-40"
    >
      <div className="flex justify-between items-start">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${isCost ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {isCost ? 'COST' : 'SAVINGS'}
        </span>
        <span className="text-xs text-slate-400">{card.category}</span>
      </div>
      
      <h5 className="font-bold text-slate-800 text-sm mt-2">{card.title}</h5>
      <div className="text-xs text-slate-500 mt-1">{card.description}</div>
      
      {/* Risk Factor Badge with Tooltip */}
      <div className="mt-2 flex items-center">
         <div className={`text-[10px] px-2 py-1 rounded border flex items-center gap-1 cursor-help relative group/risk ${riskStyle} hover:z-50`}>
            <span className="font-bold">Risk: {card.riskFactor}</span>
            <Info className="w-3 h-3" />
            
            {/* Tooltip - Moved to top-full (below) */}
            <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 text-white text-xs p-2 rounded shadow-xl opacity-0 group-hover/risk:opacity-100 transition-opacity pointer-events-none z-50 leading-tight">
                {card.riskDescription}
                {/* Tooltip Arrow pointing up */}
                <div className="absolute bottom-full left-3 -mb-1 border-4 border-transparent border-b-slate-800"></div>
            </div>
         </div>
      </div>

      <div className="flex justify-between items-center mt-3 border-t border-slate-100 pt-2 mb-2">
        <span className="font-mono text-sm font-bold">
          {isCost ? '-' : '+'}${Math.abs(card.cost).toLocaleString()}
        </span>
      </div>

      {fiscalCliffWarning && (
        <div className="mb-3 bg-yellow-50 border border-yellow-200 p-1.5 rounded flex items-center gap-1 text-[10px] text-yellow-800 font-bold animate-pulse">
          <AlertTriangle className="w-3 h-3" /> FISCAL CLIFF WARNING
        </div>
      )}

      {/* Mobile/Touch Action Buttons */}
      {onMove && (
        <div className="mt-auto pt-2 flex flex-wrap justify-end gap-2 border-t border-slate-100">
            {/* Recurring Button */}
            <button 
                onClick={() => onMove(card.id, 'Fund')}
                className={`flex items-center gap-1 px-2 py-1.5 rounded text-[10px] font-bold border transition-colors ${
                    card.selected === 'Fund' 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                }`}
                title="Fund via Recurring Revenue"
            >
                {card.selected === 'Fund' && <CheckCircle2 className="w-3 h-3" />}
                Recurring
            </button>

            {/* One-Time Button (Only for Costs, not Savings) */}
            {isCost && (
                <button 
                    onClick={() => onMove(card.id, 'OneTime')}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded text-[10px] font-bold border transition-colors ${
                        card.selected === 'OneTime' 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                    }`}
                    title="Fund via One-Time Grants"
                >
                    {card.selected === 'OneTime' && <CheckCircle2 className="w-3 h-3" />}
                    1-Time
                </button>
            )}

            {/* Reject Button */}
            <button 
                onClick={() => onMove(card.id, 'Reject')}
                className={`flex items-center gap-1 px-2 py-1.5 rounded text-[10px] font-bold border transition-colors ${
                    card.selected === 'Reject' 
                    ? 'bg-red-600 text-white border-red-600 shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                }`}
                title="Reject or Cut"
            >
                {card.selected === 'Reject' && <XCircle className="w-3 h-3" />}
                Reject
            </button>
        </div>
      )}
    </div>
  );
};

export default GridCard;
