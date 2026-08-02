import React from 'react';
import { RotateCcw, ArrowRight, Layers } from 'lucide-react';

interface SessionResumeModalProps {
  isOpen: boolean;
  moduleName: string;
  progressText: string;
  onContinue: () => void;
  onExit: () => void;
}

export const SessionResumeModal: React.FC<SessionResumeModalProps> = ({
  isOpen,
  moduleName,
  progressText,
  onContinue,
  onExit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-blue-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Module Icon Badge */}
        <div className="p-4 rounded-3xl bg-blue-500/10 text-blue-400 w-16 h-16 mx-auto flex items-center justify-center border border-blue-500/20 shadow-inner">
          <Layers className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>

        {/* Modal Text Content */}
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk'] tracking-wide">
            Continue your previous session?
          </h3>
          <p className="text-xs sm:text-sm font-medium text-slate-300">
            You have an ongoing <span className="font-extrabold text-blue-400">{moduleName}</span> session.
          </p>
          <div className="mt-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-200">
            {progressText}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onExit}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs transition-all cursor-pointer border border-slate-700"
          >
            Exit
          </button>
          
          <button
            onClick={onContinue}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
