
import React from 'react';
import { Loader2, Info } from 'lucide-react';

interface LoadingScreenProps {
    title: string;
    subtitle?: string;
    loadingLog?: string[];
    loadingFact?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ title, subtitle, loadingLog, loadingFact }) => {
    return (
        <div className="min-h-screen bg-indigo-900 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
            <div className="z-10 flex flex-col items-center max-w-2xl w-full text-center">
                <Loader2 className="w-16 h-16 text-blue-300 animate-spin mb-6" />
                <h2 className="text-2xl font-bold mb-2">{title}</h2>
                {subtitle && <p className="text-blue-200 mb-8">{subtitle}</p>}

                {/* Live Action Log */}
                {loadingLog && loadingLog.length > 0 && (
                    <div className="bg-indigo-950/50 rounded-lg p-4 font-mono text-xs text-left w-full h-[120px] overflow-y-auto mb-6 border border-indigo-800 shadow-inner">
                        {loadingLog.map((log, i) => (
                            <div key={i} className="text-blue-300 mb-1 last:text-white last:font-bold last:animate-pulse">
                                {log}
                            </div>
                        ))}
                    </div>
                )}

                {loadingFact && (
                    <div className="bg-indigo-800/50 border border-indigo-700 p-6 rounded-xl max-w-lg w-full">
                        <div className="flex items-center justify-center gap-2 mb-3 text-blue-300 text-xs font-bold uppercase tracking-widest">
                            <Info className="w-4 h-4" /> Did you know?
                        </div>
                        <p className="text-lg font-serif leading-relaxed animate-in fade-in duration-500">"{loadingFact}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoadingScreen;
