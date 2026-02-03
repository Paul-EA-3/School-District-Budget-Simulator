
import React from 'react';

interface BoardFeedback {
    approved: boolean;
    voteCount: string;
    feedback: string;
}

interface SimulationResultsProps {
    feedback: BoardFeedback;
    onRestart: () => void;
}

const SimulationResults: React.FC<SimulationResultsProps> = ({ feedback, onRestart }) => {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-2xl mx-auto border-t-8 border-indigo-900">
            <div className="mb-4 text-6xl">{feedback.approved ? '🎉' : '❌'}</div>
            <h2 className="text-3xl font-bold text-indigo-900 mb-2">
                {feedback.approved ? 'Budget Adopted' : 'Budget Rejected'}
            </h2>
            <p className="text-slate-500 mb-6 font-mono font-bold">Vote: {feedback.voteCount}</p>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left italic text-slate-700 mb-8">
                "{feedback.feedback}"
            </div>
            <button
                onClick={onRestart}
                className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors"
            >
                Start Over
            </button>
        </div>
    );
};

export default SimulationResults;
