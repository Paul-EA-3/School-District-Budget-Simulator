
import React, { useState } from 'react';
import { Target, MousePointerClick } from 'lucide-react';
import { School } from '../types';

interface ScatterplotProps {
  schools: School[];
}

type MetricType = 'math' | 'ela';

const Scatterplot: React.FC<ScatterplotProps> = ({ schools }) => {
  const [hovered, setHovered] = useState<School | null>(null);
  const [metric, setMetric] = useState<MetricType>('math');
  
  const width = 500;
  const height = 350;
  const padding = 40;
  
  const maxSpend = 25000; // Updated to 25k
  const minSpend = 5000;  // Updated to 5k
  const maxOutcome = 100;
  const minOutcome = 0; 

  const xScale = (spend: number) => ((spend - minSpend) / (maxSpend - minSpend)) * (width - padding * 2) + padding;
  const yScale = (outcome: number) => height - (((outcome - minOutcome) / (maxOutcome - minOutcome)) * (height - padding * 2) + padding);

  const avgSpend = 15500;
  const avgOutcome = 60;

  return (
    <div className="relative bg-white rounded-lg shadow p-4 border border-slate-200">
      <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-2">
        <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" /> Academic ROI
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <MousePointerClick className="w-3 h-3" /> Hover to inspect school details.
            </p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setMetric('math')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${metric === 'math' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
                Math
            </button>
             <button 
                onClick={() => setMetric('ela')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${metric === 'ela' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
                ELA
            </button>
        </div>
      </div>

      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" style={{ maxWidth: '100%' }}>
          {/* Grid lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="2" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="2" />
          
          {/* Averages */}
          <line x1={xScale(avgSpend)} y1={padding} x2={xScale(avgSpend)} y2={height - padding} stroke="#94a3b8" strokeDasharray="4 4" />
          <line x1={padding} y1={yScale(avgOutcome)} x2={width - padding} y2={yScale(avgOutcome)} stroke="#94a3b8" strokeDasharray="4 4" />

          {/* Axes Labels */}
          <text x={width / 2} y={height - 5} textAnchor="middle" className="text-xs fill-slate-500 font-semibold">Spending Per Pupil ($)</text>
          <text x={10} y={height / 2} transform={`rotate(-90, 10, ${height/2})`} textAnchor="middle" className="text-xs fill-slate-500 font-semibold">
            {metric === 'math' ? 'Math Proficiency' : 'ELA Proficiency'} (%)
          </text>
          
          {/* X-Axis Min/Max Labels */}
          <text x={padding} y={height - 25} textAnchor="start" className="text-[10px] fill-slate-400">$5k</text>
          <text x={width - padding} y={height - 25} textAnchor="end" className="text-[10px] fill-slate-400">$25k</text>

          {/* Y-Axis Min/Max Labels */}
          <text x={padding - 8} y={padding + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">100%</text>
          <text x={padding - 8} y={height - padding} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">0%</text>

          {/* Quadrant Labels */}
          <text x={width - 20} y={padding + 10} textAnchor="end" className="text-[10px] fill-indigo-400 font-bold uppercase tracking-wide">High Investment</text>
          <text x={width - 20} y={height - padding - 10} textAnchor="end" className="text-[10px] fill-red-500 font-bold uppercase tracking-wide">Danger Zone</text>
          <text x={padding + 10} y={padding + 10} textAnchor="start" className="text-[10px] fill-emerald-600 font-bold uppercase tracking-wide">Efficiency Stars</text>
          <text x={padding + 10} y={height - padding - 10} textAnchor="start" className="text-[10px] fill-slate-400 font-bold uppercase tracking-wide">Underfunded?</text>

          {schools.map((school) => {
            const x = xScale(school.spendingPerPupil);
            const y = yScale(school.academicOutcome[metric]);
            const isHovered = hovered?.id === school.id;
            
            return (
              <g key={school.id} onMouseEnter={() => setHovered(school)} onMouseLeave={() => setHovered(null)}>
                <circle
                  cx={x}
                  cy={y}
                  r={school.enrollment > 800 ? (isHovered ? 12 : 8) : (isHovered ? 9 : 5)}
                  className={`stroke-white stroke-2 cursor-pointer transition-all duration-200 ${isHovered ? 'fill-indigo-600' : 'fill-blue-500'}`}
                  style={{ opacity: hovered && !isHovered ? 0.3 : 1 }}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hovered && (
          <div 
            className="absolute z-50 bg-white rounded-lg shadow-xl border border-slate-200 p-4 w-64 pointer-events-none animate-in fade-in zoom-in-95 duration-200"
            style={{ 
              left: Math.min(xScale(hovered.spendingPerPupil) + 15, width - 260), 
              top: Math.min(yScale(hovered.academicOutcome[metric]) - 10, height - 150) 
            }}
          >
            <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-bold text-slate-800 text-sm leading-tight">{hovered.name}</h4>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{hovered.type}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mb-3">
              <span className="text-slate-500">Enrollment:</span>
              <span className="font-mono text-right">{hovered.enrollment}</span>
              
              <span className="text-slate-500">Poverty:</span>
              <span className="font-mono text-right">{(hovered.povertyRate * 100).toFixed(0)}%</span>
              
              <span className="text-slate-500">Spend/Pupil:</span>
              <span className="font-mono text-right font-bold text-emerald-600">${hovered.spendingPerPupil.toLocaleString()}</span>
              
              <span className="text-slate-500 font-bold">Math:</span>
              <span className={`font-mono text-right font-bold ${metric === 'math' ? 'text-indigo-600' : 'text-slate-700'}`}>{hovered.academicOutcome.math}%</span>
              
               <span className="text-slate-500 font-bold">ELA:</span>
              <span className={`font-mono text-right font-bold ${metric === 'ela' ? 'text-indigo-600' : 'text-slate-700'}`}>{hovered.academicOutcome.ela}%</span>
            </div>

            <div className="bg-slate-50 rounded p-2 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Staffing Mix</div>
              <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500" style={{ width: `${(hovered.staffing.senior / (hovered.staffing.senior + hovered.staffing.junior)) * 100}%` }}></div>
                <div className="bg-blue-300" style={{ width: `${(hovered.staffing.junior / (hovered.staffing.senior + hovered.staffing.junior)) * 100}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>{hovered.staffing.senior} Senior</span>
                <span>{hovered.staffing.junior} Junior</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scatterplot;
