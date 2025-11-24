
import React from 'react';
import { TrendingDown, DollarSign, Users, Info, GraduationCap } from 'lucide-react';
import { GameState, School } from '../types';

interface CockpitProps {
  state: GameState;
  schools: School[];
  compact?: boolean;
}

const Cockpit: React.FC<CockpitProps> = ({ state, schools, compact = false }) => {
  const gapColor = state.structuralGap >= 0 ? 'text-emerald-600' : 'text-red-600';
  const totalExpenses = state.expenditures.personnel + state.expenditures.operations + state.expenditures.fixed;
  const liquidityDays = totalExpenses > 0 ? (state.fundBalance / totalExpenses) * 365 : 0;

  // Academic Calculations
  const totalStudents = schools.reduce((acc, s) => acc + s.enrollment, 0);
  const weightedMath = schools.reduce((acc, s) => acc + (s.academicOutcome.math * s.enrollment), 0);
  const weightedEla = schools.reduce((acc, s) => acc + (s.academicOutcome.ela * s.enrollment), 0);
  
  const avgMath = Math.round(weightedMath / totalStudents);
  const avgEla = Math.round(weightedEla / totalStudents);
  const avgScore = Math.round((avgMath + avgEla) / 2);

  // Compact styles
  const containerClass = compact 
    ? "grid grid-cols-4 gap-2" 
    : "grid grid-cols-2 md:grid-cols-4 gap-4";

  const cardClass = compact
    ? "bg-white p-2 rounded-md shadow-sm border border-slate-200 flex flex-col justify-center relative group cursor-help hover:border-indigo-300 transition-all"
    : "bg-white p-4 rounded-lg shadow border border-slate-200 relative group cursor-help hover:border-indigo-300 transition-colors";

  const labelClass = compact
    ? "text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 truncate"
    : "flex items-center justify-between text-slate-500 mb-1 text-sm font-semibold";

  const valueClass = compact
    ? `text-sm font-bold ${gapColor} leading-tight`
    : `text-2xl font-bold ${gapColor} transition-all duration-500`;

  const textValueClass = compact
    ? "text-sm font-bold text-slate-700 leading-tight"
    : "text-2xl font-bold text-slate-700 transition-all duration-500";

  return (
    <div className={containerClass}>
      {/* Structural Balance Card */}
      <div className={cardClass}>
        <div className={labelClass}>
           {compact ? (
               <>
                <TrendingDown className="w-3 h-3" /> Balance
               </>
           ) : (
             <>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" /> Structural Balance
              </div>
              <Info className="w-5 h-5 text-indigo-300 group-hover:text-indigo-600 transition-colors" />
             </>
           )}
        </div>
        <div className={valueClass}>
          {state.structuralGap < 0 ? '-' : '+'}${Math.abs(state.structuralGap).toLocaleString()}
        </div>
        {!compact && <p className="text-xs text-slate-400 mt-1">Recurring Rev - Recurring Exp</p>}

        {/* Tooltip */}
        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
          <p className="font-bold mb-1 text-slate-200">Structural Balance:</p>
          The difference between ongoing revenue and ongoing costs. If negative, you are using savings to pay bills—a path to insolvency known as the "Fiscal Cliff".
          {/* Arrow */}
          <div className="absolute bottom-full left-6 -mb-1 border-4 border-transparent border-b-slate-800"></div>
        </div>
      </div>

      {/* Days Cash on Hand Card */}
      <div className={cardClass}>
        <div className={labelClass}>
           {compact ? (
               <>
                <DollarSign className="w-3 h-3" /> Cash Days
               </>
           ) : (
             <>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Days Cash on Hand
              </div>
              <Info className="w-5 h-5 text-indigo-300 group-hover:text-indigo-600 transition-colors" />
             </>
           )}
        </div>
        <div className={textValueClass}>
          {liquidityDays.toFixed(1)} Days
        </div>
        {!compact && (
            <div className="w-full bg-slate-200 h-2 rounded-full mt-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(liquidityDays, 100)}%` }}></div>
            </div>
        )}

         {/* Tooltip */}
         <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
          <p className="font-bold mb-1 text-slate-200">Liquidity Health:</p>
          How long the district can operate if all revenue stopped today. 
          <ul className="list-disc list-inside mt-1 text-slate-300">
            <li>&lt; 30 Days: Critical Risk</li>
            <li>60+ Days: Healthy</li>
          </ul>
          <div className="absolute bottom-full left-6 -mb-1 border-4 border-transparent border-b-slate-800"></div>
        </div>
      </div>

      {/* Community Trust Card */}
      <div className={cardClass}>
        <div className={labelClass}>
             {compact ? (
               <>
                <Users className="w-3 h-3" /> Trust
               </>
           ) : (
             <>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Community Trust
              </div>
              <Info className="w-5 h-5 text-indigo-300 group-hover:text-indigo-600 transition-colors" />
             </>
           )}
        </div>
        <div className={textValueClass}>
          {state.communityTrust}%
        </div>
        {!compact && <p className="text-xs text-slate-400 mt-1">Political Capital</p>}

         {/* Tooltip */}
         <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
          <p className="font-bold mb-1 text-slate-200">Political Survival:</p>
          Represents the Board and public's confidence in you. If this drops too low (&lt; 50%), the Board is likely to reject your budget or vote "No Confidence".
          <div className="absolute bottom-full left-6 -mb-1 border-4 border-transparent border-b-slate-800"></div>
        </div>
      </div>

      {/* Academic ROI Card */}
      <div className={cardClass}>
        <div className={labelClass}>
             {compact ? (
               <>
                <GraduationCap className="w-3 h-3" /> Outcomes
               </>
           ) : (
             <>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Academic ROI
              </div>
              <Info className="w-5 h-5 text-indigo-300 group-hover:text-indigo-600 transition-colors" />
             </>
           )}
        </div>
        <div className={`font-bold text-indigo-600 ${compact ? 'text-sm leading-tight' : 'text-2xl transition-all duration-500'}`}>
          {avgScore} <span className={`text-slate-400 font-normal ${compact ? 'text-[10px]' : 'text-xs'}`}>Avg</span>
        </div>
        {!compact ? (
            <p className="text-[10px] text-slate-400 mt-1">Math: {avgMath} • ELA: {avgEla}</p>
        ) : (
            <p className="text-[9px] text-slate-400">M:{avgMath} E:{avgEla}</p>
        )}

         {/* Tooltip */}
         <div className="absolute top-full right-0 md:left-0 mt-2 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
          <p className="font-bold mb-1 text-slate-200">Student Outcomes:</p>
          Weighted average of Math & ELA proficiency across all schools. Investments in high-poverty schools or class size reduction will improve this immediately.
          <div className="absolute bottom-full right-6 md:left-6 -mb-1 border-4 border-transparent border-b-slate-800"></div>
        </div>
      </div>
    </div>
  );
};

export default Cockpit;
