import React, { useState, useEffect, useRef } from 'react';

interface AIRobotLoaderProps {
  title?: string;
  subtitle?: string;
  details?: string;
  overlay?: boolean;
  isDone?: boolean;
  onComplete?: () => void;
  minDurationMs?: number;
}

export const AIRobotLoader: React.FC<AIRobotLoaderProps> = ({
  title = 'Wait...',
  subtitle = 'AI is preparing your resume...',
  details = 'Checking your details...',
  overlay = true,
  isDone = true,
  onComplete,
  minDurationMs = 2500,
}) => {
  const [progress, setProgress] = useState<number>(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const hasCompletedRef = useRef(false);

  // Main visual progress timer loop
  useEffect(() => {
    let mounted = true;
    const startTime = Date.now();
    const duration = minDurationMs || 2500;
    const intervalTime = 30;

    const timer = setInterval(() => {
      if (!mounted) return;
      const elapsed = Date.now() - startTime;
      let nextProgress = Math.min(100, Math.floor((elapsed / duration) * 100));

      // If backend operation is still running, cap at 92% until isDone=true or 4000ms max safety timeout
      if (!isDone && nextProgress >= 92) {
        if (elapsed > 4000) {
          nextProgress = 100;
        } else {
          nextProgress = 92;
        }
      }

      setProgress(nextProgress);

      if (nextProgress >= 100 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        clearInterval(timer);
        setTimeout(() => {
          if (mounted && onCompleteRef.current) {
            onCompleteRef.current();
          }
        }, 150);
      }
    }, intervalTime);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [isDone, minDurationMs]);

  // Failsafe reactive handler: when backend process signals isDone = true, finish progress and transition
  useEffect(() => {
    if (isDone && !hasCompletedRef.current) {
      setProgress(100);
      hasCompletedRef.current = true;
      const delayTimer = setTimeout(() => {
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }, 200);
      return () => clearTimeout(delayTimer);
    }
  }, [isDone]);

  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 select-none animate-in fade-in duration-300">
      <style>{`
        @keyframes robotFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1.5deg); }
        }
        @keyframes eyeBlink {
          0%, 88%, 92%, 100% { transform: scaleY(1); }
          90% { transform: scaleY(0.1); }
        }
        @keyframes antennaPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; filter: drop-shadow(0 0 12px #06B6D4); }
        }
        @keyframes chestGlow {
          0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 6px #3B82F6); }
          50% { opacity: 1; filter: drop-shadow(0 0 16px #8B5CF6); }
        }
        @keyframes waveArmLeft {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-8deg); }
        }
        @keyframes waveArmRight {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(8deg); }
        }
      `}</style>

      {/* Large Futuristic Cute Animated Robot SVG */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
        {/* Ambient Outer Halo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/30 via-indigo-500/20 to-purple-600/30 blur-2xl animate-pulse" />

        <svg
          viewBox="0 0 200 200"
          className="w-full h-full relative z-10 drop-shadow-[0_10px_25px_rgba(6,182,212,0.3)]"
          style={{ animation: 'robotFloat 3.5s ease-in-out infinite' }}
        >
          <defs>
            <linearGradient id="botHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            <linearGradient id="botPlateGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>

            <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            <filter id="glowEffect">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ANTENNA */}
          <line x1="100" y1="35" x2="100" y2="18" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
          <circle
            cx="100"
            cy="14"
            r="7"
            fill="#06B6D4"
            filter="url(#glowEffect)"
            style={{ animation: 'antennaPulse 2s ease-in-out infinite', transformOrigin: '100px 14px' }}
          />

          {/* LEFT ARM */}
          <g style={{ animation: 'waveArmLeft 3s ease-in-out infinite', transformOrigin: '40px 135px' }}>
            <rect x="26" y="130" width="18" height="32" rx="9" fill="#1E293B" stroke="#38BDF8" strokeWidth="2" />
            <circle cx="35" cy="166" r="6" fill="#06B6D4" />
          </g>

          {/* RIGHT ARM */}
          <g style={{ animation: 'waveArmRight 3s ease-in-out infinite', transformOrigin: '160px 135px' }}>
            <rect x="156" y="130" width="18" height="32" rx="9" fill="#1E293B" stroke="#38BDF8" strokeWidth="2" />
            <circle cx="165" cy="166" r="6" fill="#06B6D4" />
          </g>

          {/* BODY / TORSO */}
          <rect x="52" y="118" width="96" height="58" rx="22" fill="url(#botHeadGrad)" stroke="url(#botPlateGrad)" strokeWidth="3" />
          
          {/* CHEST REACTOR CORE */}
          <circle
            cx="100"
            cy="147"
            r="12"
            fill="#06B6D4"
            fillOpacity="0.2"
            stroke="#38BDF8"
            strokeWidth="2"
          />
          <circle
            cx="100"
            cy="147"
            r="6"
            fill="#38BDF8"
            filter="url(#glowEffect)"
            style={{ animation: 'chestGlow 2.5s ease-in-out infinite' }}
          />

          {/* HEAD CONTAINER */}
          <rect x="42" y="32" width="116" height="82" rx="30" fill="url(#botHeadGrad)" stroke="url(#botPlateGrad)" strokeWidth="3.5" />

          {/* EARS / SIDE PODS */}
          <rect x="32" y="56" width="10" height="34" rx="5" fill="#38BDF8" opacity="0.8" />
          <rect x="158" y="56" width="10" height="34" rx="5" fill="#38BDF8" opacity="0.8" />

          {/* GLASS VISOR SCREEN */}
          <rect x="52" y="44" width="96" height="58" rx="20" fill="#020617" stroke="#1E293B" strokeWidth="2" />

          {/* EYES CONTAINER WITH NATURAL BLINKING */}
          <g style={{ animation: 'eyeBlink 3.8s ease-in-out infinite', transformOrigin: '100px 70px' }}>
            {/* LEFT EYE */}
            <ellipse cx="78" cy="70" rx="10" ry="13" fill="url(#eyeGrad)" filter="url(#glowEffect)" />
            <circle cx="81" cy="66" r="3.5" fill="#FFFFFF" />

            {/* RIGHT EYE */}
            <ellipse cx="122" cy="70" rx="10" ry="13" fill="url(#eyeGrad)" filter="url(#glowEffect)" />
            <circle cx="125" cy="66" r="3.5" fill="#FFFFFF" />
          </g>

          {/* CHEEK BLUSH DOTS */}
          <circle cx="68" cy="87" r="4" fill="#F472B6" opacity="0.5" />
          <circle cx="132" cy="87" r="4" fill="#F472B6" opacity="0.5" />

          {/* CUTE DIGITAL SMILE */}
          <path d="M 91 85 Q 100 91 109 85" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* TEXT MESSAGES */}
      <div className="space-y-2 max-w-md">
        <h3 className="text-2xl font-black text-white font-['Space_Grotesk'] tracking-wide">
          {title}
        </h3>
        <p className="text-sm font-extrabold text-cyan-300 leading-relaxed">
          {subtitle}
        </p>
        {details && (
          <p className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
            <span>{details}</span>
          </p>
        )}
      </div>

      {/* DYNAMIC 0-100% PROGRESS BAR & PERCENTAGE */}
      <div className="w-72 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400 px-1">
          <span>{progress >= 100 ? 'Complete!' : 'Processing...'}</span>
          <span className="text-cyan-300 font-extrabold">{progress}%</span>
        </div>

        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800/90 p-0.5 shadow-inner">
          <div
            className="bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 h-full rounded-full transition-all duration-150 ease-out shadow-[0_0_15px_rgba(6,182,212,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
};
