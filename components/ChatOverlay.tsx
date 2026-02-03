
import React, { useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, Bot } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface ChatOverlayProps {
  isOpen: boolean;
  onToggle: () => void;
  history: ChatMessage[];
  onSend: (message: string) => void;
  isTyping: boolean;
  contextLabel?: string;
}

const ChatOverlay: React.FC<ChatOverlayProps> = ({ 
  isOpen, 
  onToggle, 
  history, 
  onSend, 
  isTyping,
  contextLabel = "AI Advisor"
}) => {
  const [input, setInput] = React.useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-indigo-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="bg-indigo-900 p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-1.5 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm leading-none">Education Associates</h3>
                <p className="text-indigo-300 text-[10px] font-medium mt-1">{contextLabel}</p>
              </div>
            </div>
            <button 
              onClick={onToggle}
              className="text-indigo-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
            {history.length === 0 && (
              <div className="text-center mt-8 text-slate-400 text-xs px-8">
                <p>I can help you analyze data, suggest proposals, or explain financial concepts.</p>
              </div>
            )}
            
            {history.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-slate-200 text-orange-500'}`}>
                  {msg.role === 'user' ? <div className="w-2 h-2 bg-indigo-600 rounded-full" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm max-w-[80%] shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-orange-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for advice..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button 
          onClick={onToggle}
          className="group flex items-center gap-3 bg-indigo-900 hover:bg-indigo-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-sm font-bold">
            Ask Advisor
          </span>
          <MessageSquare className="w-6 h-6" />
          {/* Notification Dot (Optional, could be prop driven) */}
          <span className="absolute top-4 right-4 w-3 h-3 bg-orange-500 border-2 border-indigo-900 rounded-full"></span>
        </button>
      )}
    </div>
  );
};

export default ChatOverlay;
