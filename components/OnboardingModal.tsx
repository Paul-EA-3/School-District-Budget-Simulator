
import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Target, ShieldAlert, TrendingUp, MessageSquare, Users, AlertTriangle, Wallet, RotateCcw, Info, CheckCircle2 } from 'lucide-react';
import { Scenario } from '../types';
import Logo from './Logo';

interface OnboardingModalProps {
  scenario: Scenario;
  onStart: () => void;
  onBack: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ scenario, onStart, onBack }) => {
  const [step, setStep] = useState(0);

  const totalSteps = 3;

  const handleNext = () => setStep(Math.min(totalSteps - 1, step + 1));
  const handlePrev = () => setStep(Math.max(0, step - 1));

  return (
    <div className="fixed inset-0 bg-indigo-900/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white max-w-3xl w-full rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] relative">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-4">
                <Logo className="h-8" />
                <div className="hidden md:block w-px h-6 bg-slate-200"></div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Confidential Briefing</div>
            </div>
            <div className="flex items-center gap-6">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-medium"
                >
                    <RotateCcw className="w-3 h-3" /> Start Over
                </button>
                <a 
                    href="mailto:paul@education.associates?subject=Simulator Feedback" 
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-medium"
                >
                    <MessageSquare className="w-3 h-3" /> Feedback
                </a>
            </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
            <div className="bg-indigo-600 h-1 transition-all duration-300 ease-out" style={{ width: `${((step + 1) / totalSteps) * 100}%` }}></div>
        </div>
        
        {/* Content Area */}
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
            
            {/* STEP 0: THE SITUATION (Numbers) */}
            {step === 0 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${scenario.difficulty === 'Hard' ? 'bg-red-100 text-red-700' : scenario.difficulty === 'Expert' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {scenario.difficulty} Scenario
                            </span>
                            <span className="text-slate-400 text-xs font-mono">ID: {scenario.id.toUpperCase()}-2025</span>
                        </div>
                        <h1 className="text-3xl font-bold text-indigo-900 mb-3">{scenario.title}</h1>
                        <p className="text-lg text-slate-600 leading-relaxed">{scenario.description}</p>
                    </div>

                    {/* The Numbers */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center relative group cursor-help hover:border-indigo-300 transition-colors">
                            <div className="flex items-center justify-center gap-1 text-xs text-indigo-400 font-bold uppercase mb-1">
                                Starting Deficit <Info className="w-3 h-3" />
                            </div>
                            <div className={`text-2xl font-bold ${scenario.initialState.structuralGap < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                ${(scenario.initialState.structuralGap / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-[10px] text-indigo-400 mt-1">Recurring Gap</div>
                            
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-left leading-relaxed font-normal">
                                The difference between ongoing revenue and ongoing costs. If negative, you are spending more than you make—the definition of a structural deficit.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                        </div>

                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center relative group cursor-help hover:border-indigo-300 transition-colors">
                            <div className="flex items-center justify-center gap-1 text-xs text-indigo-400 font-bold uppercase mb-1">
                                Current Trust <Info className="w-3 h-3" />
                            </div>
                            <div className="text-2xl font-bold text-indigo-900">
                                {scenario.initialState.communityTrust}%
                            </div>
                            <div className="text-[10px] text-indigo-400 mt-1">Political Capital</div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-left leading-relaxed font-normal">
                                Represents the Board and public's confidence. If this starts too low, you have very little room for error with unpopular cuts.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                        </div>

                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center relative group cursor-help hover:border-indigo-300 transition-colors">
                            <div className="flex items-center justify-center gap-1 text-xs text-indigo-400 font-bold uppercase mb-1">
                                Fed. Grants <Info className="w-3 h-3" />
                            </div>
                            <div className="text-2xl font-bold text-blue-600">
                                ${(scenario.initialState.revenue.federalOneTime / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-[10px] text-indigo-400 mt-1">Expires in 1 Year</div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-left leading-relaxed font-normal">
                                Temporary money (like ESSER). It disappears next year. Using it for salaries creates a dangerous Fiscal Cliff.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 1: THE CONTEXT (Why is this hard?) */}
            {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                     <h2 className="text-2xl font-bold text-indigo-900 mb-6">Strategic Context</h2>
                     <div className="grid grid-cols-1 gap-6">
                
                        {/* Concept 0: Revenue Sources */}
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 flex gap-4">
                            <div className="bg-blue-100 p-3 rounded-full h-fit">
                                <Wallet className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-blue-900 text-sm uppercase mb-1">Where Money Comes From</h3>
                                <p className="text-sm text-blue-800 leading-relaxed">
                                    Districts rely primarily on State and Local funding (~90%). Federal funds are typically a small slice (~10%) restricted for specific students (<a href="https://www.ed.gov/laws-and-policy/laws-preschool-grade-12-education/title-I" target="_blank" rel="noreferrer" className="underline hover:text-blue-950 font-bold">Title I</a>, <a href="https://www.ed.gov/laws-and-policy/individuals-disabilities/idea" target="_blank" rel="noreferrer" className="underline hover:text-blue-950 font-bold">IDEA</a>) or temporary relief.
                                </p>
                            </div>
                        </div>

                        {/* Concept 1: People are Expensive */}
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex gap-4">
                            <div className="bg-slate-200 p-3 rounded-full h-fit">
                                <Users className="w-6 h-6 text-slate-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm uppercase mb-1">Personnel Investments</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    With ~85% of budgets tied to salaries and benefits, addressing a structural deficit often requires difficult trade-offs regarding staffing levels rather than just cutting supplies.
                                </p>
                            </div>
                        </div>

                        {/* Concept 2: The Fiscal Cliff */}
                        <div className="bg-orange-50 p-6 rounded-xl border border-orange-200 flex gap-4">
                             <div className="bg-orange-100 p-3 rounded-full h-fit">
                                <AlertTriangle className="w-6 h-6 text-orange-600" />
                             </div>
                             <div>
                                <h3 className="font-bold text-orange-800 text-sm uppercase mb-1">One-Time Funds</h3>
                                <p className="text-sm text-orange-800 leading-relaxed">
                                    Temporary grants (like <a href="https://www.ed.gov/grants-and-programs/formula-grants/response-formula-grants/covid-19-emergency-relief-grants/elementary-and-secondary-school-emergency-relief-fund" target="_blank" rel="noreferrer" className="underline hover:text-orange-950 font-bold">ESSER</a>) are finite. Using them for recurring costs creates a "Fiscal Cliff"—a deficit that returns once funding expires.
                                </p>
                             </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* STEP 2: THE MISSION (Objectives) */}
            {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col justify-center">
                  <h2 className="text-2xl font-bold text-indigo-900 mb-2 text-center">Your Mission Objectives</h2>
                  <p className="text-center text-slate-500 mb-8">Achieve these three goals to pass the budget.</p>
                  
                  <div className="space-y-6 max-w-2xl mx-auto w-full">
                    <div className="flex gap-5 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="bg-emerald-100 p-3 rounded-full shrink-0">
                            <Target className="w-6 h-6 text-emerald-700" />
                        </div>
                        <div>
                            <strong className="text-base text-slate-900 block mb-1">1. Address the Structural Deficit</strong>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Bring "Structural Balance" to neutral. Recurring revenue must cover recurring expenses.
                            </p>
                        </div>
                    </div>
                     <div className="flex gap-5 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="bg-blue-100 p-3 rounded-full shrink-0">
                            <TrendingUp className="w-6 h-6 text-blue-700" />
                        </div>
                        <div>
                            <strong className="text-base text-slate-900 block mb-1">2. Invest Strategically</strong>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Use One-Time Grants for temporary needs only. Avoid the Fiscal Cliff.
                            </p>
                        </div>
                    </div>
                     <div className="flex gap-5 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="bg-orange-100 p-3 rounded-full shrink-0">
                            <ShieldAlert className="w-6 h-6 text-orange-700" />
                        </div>
                        <div>
                            <strong className="text-base text-slate-900 block mb-1">3. Maintain Community Trust</strong>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Don't let Trust drop below 50%. A balanced budget means nothing if the community revolts.
                            </p>
                        </div>
                    </div>
                  </div>
                </div>
            )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex-shrink-0 flex flex-col items-center">
            <div className="flex justify-between w-full max-w-3xl gap-4 mb-4">
                {step > 0 ? (
                    <button 
                        onClick={handlePrev}
                        className="text-slate-500 hover:text-indigo-600 font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                ) : (
                    <div></div> 
                )}

                {step < totalSteps - 1 ? (
                    <button 
                        onClick={handleNext}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                    >
                        Next <ArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button 
                        onClick={onStart}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-10 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-200 animate-pulse hover:animate-none"
                    >
                        Accept Assignment <CheckCircle2 className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
