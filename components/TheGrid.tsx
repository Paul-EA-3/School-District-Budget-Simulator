
import React, { useState } from 'react';
import { BookOpen, AlertCircle, Info, Undo2, Redo2, Plus, X, ArrowDownToLine, ChevronDown, ChevronUp, GripHorizontal } from 'lucide-react';
import { Card, SelectionState } from '../types';
import GridCard from './GridCard';

interface TheGridProps {
  cards: Card[];
  onMoveCard: (id: string, dest: SelectionState) => void;
  fundOneTimeRemaining: number;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onAddProposal: (card: Card) => void;
}

const TheGrid: React.FC<TheGridProps> = ({ 
    cards, 
    onMoveCard, 
    fundOneTimeRemaining,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    onAddProposal
}) => {
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>(''); // String to handle input easier
  const [type, setType] = useState<'expense' | 'savings'>('expense');
  const [frequency, setFrequency] = useState<'recurring' | 'onetime'>('recurring');

  const handleCreate = () => {
    if (!title || !amount) return;
    
    const numAmount = parseInt(amount.replace(/,/g, ''), 10);
    const finalCost = type === 'expense' ? numAmount : -numAmount;

    const newCard: Card = {
        id: `custom-${Date.now()}`,
        title: title,
        description: 'Custom user proposal',
        cost: finalCost,
        studentsServed: 0, // Default
        isRecurring: frequency === 'recurring',
        riskFactor: 'Medium', // Default
        riskDescription: 'User generated strategy',
        category: 'Custom',
        selected: 'None'
    };

    onAddProposal(newCard);
    
    // Reset and Close
    setTitle('');
    setAmount('');
    setType('expense');
    setFrequency('recurring');
    setIsModalOpen(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, destination: SelectionState) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    // Find the card being dropped
    const card = cards.find(c => c.id === id);
    if (!card) return;

    // Constraint: Savings/Revenue (Negative Cost) cannot be funded by One-Time Grants
    if (destination === 'OneTime' && card.cost <= 0) {
        return; 
    }

    onMoveCard(id, destination);
  };

  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm relative">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
            <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6" /> The Grid: Decision Matrix
            </h3>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-slate-500 flex items-center gap-2">
                    <GripHorizontal className="w-4 h-4" />
                    Drag cards or use buttons on cards to sort.
                </p>
                {(onUndo || onRedo) && (
                    <div className="flex gap-1 ml-2 border-l border-slate-300 pl-2">
                        <button 
                            onClick={onUndo} 
                            disabled={!canUndo}
                            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Undo"
                        >
                            <Undo2 className="w-4 h-4 text-slate-600" />
                        </button>
                        <button 
                            onClick={onRedo} 
                            disabled={!canRedo}
                            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Redo"
                        >
                            <Redo2 className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>
                )}
            </div>
        </div>
        <div className={`text-sm font-mono px-4 py-2 rounded-lg border-2 transition-colors duration-300 font-bold ${fundOneTimeRemaining < 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-indigo-900 border-indigo-100'}`}>
          Federal Grants Available: ${fundOneTimeRemaining.toLocaleString()}
        </div>
      </div>

      {/* Instructional Accordion */}
      <div className="mb-6 border border-indigo-100 rounded-lg bg-indigo-50/50 overflow-hidden transition-all">
        <button 
            onClick={() => setIsStrategyOpen(!isStrategyOpen)}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-indigo-50 transition-colors"
        >
            <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                <div>
                    <h4 className="text-sm font-bold text-indigo-900">Budgeting Strategy Guide</h4>
                    {!isStrategyOpen && <p className="text-[10px] text-indigo-600">Click to expand rules for Recurring vs One-Time funds</p>}
                </div>
            </div>
            {isStrategyOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
        </button>
        
        {isStrategyOpen && (
            <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-indigo-800 animate-in slide-in-from-top-2 fade-in border-t border-indigo-100/50 mt-2">
                <div className="bg-white p-3 rounded border border-indigo-100 shadow-sm">
                    <strong className="block text-emerald-700 mb-1 text-sm">Option 1: Fund (Recurring)</strong>
                    <p>Paid for by local/state taxes. Hits your <strong>Structural Balance</strong> immediately. Use for staff salaries.</p>
                </div>
                <div className="bg-white p-3 rounded border border-indigo-100 shadow-sm">
                    <strong className="block text-blue-600 mb-1 text-sm">Option 2: Fund (One-Time)</strong>
                    <p>Paid for by temporary Federal Grants. Does <strong>NOT</strong> affect structural balance, but creates a "Fiscal Cliff" if used for salaries.</p>
                </div>
                <div className="bg-white p-3 rounded border border-indigo-100 shadow-sm">
                    <strong className="block text-red-600 mb-1 text-sm">Option 3: Reject / Cut</strong>
                    <p>Removes the cost (or realizes the savings). Necessary to balance the budget, but may hurt <strong>Community Trust</strong>.</p>
                </div>
            </div>
        )}
      </div>
      
      {/* Main Grid Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Column 1: Unsorted */}
        <div className="space-y-3 h-full flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="font-bold text-slate-500 text-xs uppercase tracking-wider">Unsorted Proposals</h4>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 flex items-center gap-1 font-bold transition-colors"
            >
                <Plus className="w-3 h-3" /> Add Proposal
            </button>
          </div>
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'None')}
            className="bg-slate-200/50 flex-1 min-h-[400px] p-2 rounded-lg border-2 border-dashed border-slate-300 overflow-y-auto max-h-[600px] transition-colors relative hover:border-slate-400"
          >
            {cards.filter(c => c.selected === 'None').map(card => (
              <GridCard key={card.id} card={card} onMove={onMoveCard} />
            ))}
            {cards.filter(c => c.selected === 'None').length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-sm italic p-4 text-center pointer-events-none">
                    <div className="bg-slate-200 rounded-full p-3 mb-2">
                        <AlertCircle className="w-6 h-6 text-slate-400" />
                    </div>
                    All proposals sorted!
                </div>
            )}
          </div>
        </div>

        {/* Column 2: Fund (Recurring) */}
        <div className="space-y-3 h-full flex flex-col">
           <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
            <h4 className="font-bold text-emerald-700 text-xs uppercase tracking-wider">Fund (Recurring Revenue)</h4>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{cards.filter(c => c.selected === 'Fund').length}</span>
          </div>
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'Fund')}
            className="bg-white flex-1 min-h-[400px] p-2 rounded-lg border-2 border-emerald-100 shadow-inner overflow-y-auto max-h-[600px] transition-colors relative hover:border-emerald-400"
          >
            {cards.filter(c => c.selected === 'Fund').map(card => (
              <GridCard key={card.id} card={card} showWarning={!card.isRecurring} onMove={onMoveCard} />
            ))}
            {cards.filter(c => c.selected === 'Fund').length === 0 && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-200 text-xs italic p-4 pointer-events-none">
                    <ArrowDownToLine className="w-8 h-8 mb-2 opacity-50" />
                    Drag & Drop Recurring Expenses Here
                </div>
            )}
          </div>
        </div>

        {/* Column 3: One-Time & Reject */}
        <div className="space-y-3 h-full flex flex-col">
           <div className="flex items-center justify-between border-b border-blue-200 pb-2">
            <h4 className="font-bold text-blue-700 text-xs uppercase tracking-wider">Fund (One-Time Grants)</h4>
             <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{cards.filter(c => c.selected === 'OneTime').length}</span>
          </div>
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'OneTime')}
            className="bg-white min-h-[150px] p-2 rounded-lg border-2 border-blue-100 mb-4 shadow-inner transition-colors relative hover:border-blue-400"
          >
            {cards.filter(c => c.selected === 'OneTime').map(card => (
              <GridCard key={card.id} card={card} oneTimeMode={true} onMove={onMoveCard} />
            ))}
            {cards.filter(c => c.selected === 'OneTime').length === 0 && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-200 text-xs italic p-4 pointer-events-none">
                    <ArrowDownToLine className="w-6 h-6 mb-1 opacity-50" />
                    Drag & Drop One-Time Expenses Here
                </div>
            )}
          </div>

           <div className="flex items-center justify-between border-b border-red-200 pb-2 mt-auto">
            <h4 className="font-bold text-red-600 text-xs uppercase tracking-wider">Reject / Cut</h4>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{cards.filter(c => c.selected === 'Reject').length}</span>
          </div>
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'Reject')}
            className="bg-white min-h-[150px] p-2 rounded-lg border-2 border-red-100 shadow-inner transition-colors relative hover:border-red-400"
          >
            {cards.filter(c => c.selected === 'Reject').map(card => (
              <GridCard key={card.id} card={card} onMove={onMoveCard} />
            ))}
             {cards.filter(c => c.selected === 'Reject').length === 0 && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-red-200 text-xs italic p-4 pointer-events-none">
                    <ArrowDownToLine className="w-6 h-6 mb-1 opacity-50" />
                    Drag & Drop to Reject
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Proposal Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 rounded-xl backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md m-4 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800">Add Custom Proposal</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Proposal Title</label>
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Cut Athletic Budget"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Impact Type</label>
                            <div className="flex bg-slate-100 p-1 rounded">
                                <button 
                                    onClick={() => setType('expense')}
                                    className={`flex-1 py-1 text-xs font-bold rounded ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Expense
                                </button>
                                <button 
                                    onClick={() => setType('savings')}
                                    className={`flex-1 py-1 text-xs font-bold rounded ${type === 'savings' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Savings
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Frequency</label>
                             <div className="flex bg-slate-100 p-1 rounded">
                                <button 
                                    onClick={() => setFrequency('recurring')}
                                    className={`flex-1 py-1 text-xs font-bold rounded ${frequency === 'recurring' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Recurring
                                </button>
                                <button 
                                    onClick={() => setFrequency('onetime')}
                                    className={`flex-1 py-1 text-xs font-bold rounded ${frequency === 'onetime' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    One-Time
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dollar Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-400">$</span>
                            <input 
                                type="number" 
                                className="w-full border border-slate-300 rounded p-2 pl-6 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {type === 'expense' ? 'Increases costs.' : 'Reduces costs (Negative Cost).'}
                        </p>
                    </div>

                    <button 
                        onClick={handleCreate}
                        disabled={!title || !amount}
                        className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-bold py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add to Grid
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TheGrid;
