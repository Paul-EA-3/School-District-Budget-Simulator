
import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { Loader2, AlertCircle, Info } from 'lucide-react';

interface NarrativeBuilderProps {
  decisions: Card[];
  onSubmit: (narrative: string) => void;
  isSubmitting?: boolean;
  allSorted: boolean;
}

const NarrativeBuilder: React.FC<NarrativeBuilderProps> = ({ decisions, onSubmit, isSubmitting = false, allSorted }) => {
  const [narrative, setNarrative] = useState('');
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isSubmitting) {
      setTimeLeft(20);
      timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSubmitting]);
  
  const fundedItems = decisions.filter(d => d.selected === 'Fund' || d.selected === 'OneTime');
  const investments = fundedItems.filter(d => d.cost > 0);
  const cuts = fundedItems.filter(d => d.cost < 0); 

  const generateTemplate = () => {
    const topInvest = investments[0]?.title || '[Investment]';
    const topCut = cuts[0]?.title || '[Reduction]';
    const reason = investments[0] ? 'address critical academic gaps' : 'balance our structural deficit';
    
    setNarrative(`Our data suggests that our students need support to ${reason}. Therefore, we are prioritizing investments in ${topInvest}. To responsibly fund this, we made the difficult decision to proceed with ${topCut}, recognizing that while painful, it is necessary to ensure long-term solvency.`);
  };

  const isNarrativeReady = narrative.length >= 10;
  const isReady = isNarrativeReady && allSorted;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 min-h-[400px] flex flex-col relative shadow-sm">
      {/* Loading Modal - Full Screen Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border-t-8 border-indigo-600">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
                        <div className="bg-indigo-50 p-4 rounded-full relative z-10">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                        </div>
                    </div>
                </div>
                
                <h3 className="text-2xl font-bold text-indigo-900 mb-2">Board Session in Progress</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                    The AI Board Members are currently analyzing your budget proposals and strategic narrative.
                </p>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-left text-sm text-slate-500 space-y-2">
                    <p className="flex items-center gap-2 transition-opacity duration-500" style={{ opacity: timeLeft <= 18 ? 1 : 0.5 }}>
                        <span className={`w-2 h-2 rounded-full ${timeLeft <= 18 ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        Evaluating Structural Balance...
                    </p>
                    <p className="flex items-center gap-2 transition-opacity duration-500" style={{ opacity: timeLeft <= 12 ? 1 : 0.5 }}>
                        <span className={`w-2 h-2 rounded-full ${timeLeft <= 12 ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        Weighing Community Impact...
                    </p>
                    <p className="flex items-center gap-2 transition-opacity duration-500" style={{ opacity: timeLeft <= 6 ? 1 : 0.5 }}>
                        <span className={`w-2 h-2 rounded-full ${timeLeft <= 6 ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        Generating Vote & Feedback...
                    </p>
                </div>
                
                <div className="mt-6 flex flex-col items-center">
                     <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2">
                        <div 
                            className="bg-indigo-600 h-full transition-all duration-1000 ease-linear" 
                            style={{ width: `${((20 - timeLeft) / 20) * 100}%` }}
                        ></div>
                     </div>
                     <p className="text-xs text-slate-400 italic">
                        Estimated wait: {timeLeft > 0 ? `${timeLeft}s` : 'Finalizing...'}
                     </p>
                </div>
            </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 relative group w-fit">
        <h3 className="text-xl font-bold text-slate-800">Strategic Narrative</h3>
        <Info className="w-5 h-5 text-slate-400 hover:text-indigo-600 cursor-help transition-colors" />
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
          <p className="font-bold mb-1 text-slate-200">The Power of Story:</p>
          The AI Board actually reads this text! A persuasive narrative explaining your trade-offs is critical to convincing a skeptical board to approve a difficult budget.
          {/* Arrow */}
          <div className="absolute top-full left-6 -mt-1 border-4 border-transparent border-t-slate-800"></div>
        </div>
      </div>

      <p className="text-sm text-slate-600 mb-4">
        A budget is a moral document. You must explain your trade-offs to the School Board.
      </p>
      <textarea 
        className="w-full flex-1 p-3 border border-slate-300 rounded-lg text-sm font-sans mb-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 min-h-[150px]"
        placeholder="Draft your statement here..."
        value={narrative}
        onChange={(e) => setNarrative(e.target.value)}
        disabled={isSubmitting}
      />
      
      <div className="mb-4 min-h-[20px]">
        {!allSorted ? (
           <p className="text-xs text-orange-600 flex items-center gap-1 font-bold">
             <AlertCircle className="w-3 h-3" /> Must sort all proposals to submit.
           </p>
        ) : !isNarrativeReady ? (
            <p className="text-xs text-slate-400 italic">
             Please write a narrative description (min 10 chars).
           </p>
        ) : null}
      </div>

      <div className="flex gap-2 mt-auto">
        <button onClick={generateTemplate} disabled={isSubmitting} className="text-xs text-blue-600 hover:underline disabled:text-slate-400">
          Generate Template
        </button>
        <div className="flex-1"></div>
        <button 
          disabled={!isReady || isSubmitting}
          onClick={() => onSubmit(narrative)}
          className="bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Board Voting...' : 'Submit Budget'}
        </button>
      </div>
    </div>
  );
};

export default NarrativeBuilder;
