import React from 'react';
import {
  Brain,
  Briefcase,
  MessageSquare,
  ArrowRight,
  Bot,
  FileText,
  Code2,
  BarChart3
} from 'lucide-react';
import { useApp, ActiveTab } from '../../context/AppContext';

interface SplashScreenProps {
  onDismiss: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDismiss }) => {
  const { handleFeatureLaunch } = useApp();

  const featureCards: Array<{
    id: ActiveTab;
    title: string;
    desc: string;
    icon: React.ReactNode;
    accent: string;
  }> = [
    {
      id: 'interview',
      title: 'AI Mock Interviews',
      desc: 'Practice HR, Technical & Company rounds with real-time feedback.',
      icon: <Bot className="w-5 h-5 text-purple-300" />,
      accent: 'hover:border-purple-400/50'
    },
    {
      id: 'resume',
      title: 'Resume Analyzer',
      desc: 'Evaluate ATS compatibility scores and optimize section content.',
      icon: <FileText className="w-5 h-5 text-blue-300" />,
      accent: 'hover:border-blue-400/50'
    },
    {
      id: 'coding',
      title: 'Coding & Aptitude',
      desc: 'Solve algorithmic challenges & aptitude tests with instant AI reviews.',
      icon: <Code2 className="w-5 h-5 text-cyan-300" />,
      accent: 'hover:border-cyan-400/50'
    },
    {
      id: 'dashboard',
      title: 'Performance Dashboard',
      desc: 'Track placement readiness scores and learning roadmaps.',
      icon: <BarChart3 className="w-5 h-5 text-amber-300" />,
      accent: 'hover:border-amber-400/50'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#0F172A] via-[#1E1B4B] to-[#2E1065] text-white px-4 sm:px-8 py-8 select-none overflow-y-auto font-sans">
      
      {/* 1. Lighter Soft Ambient Refractive Lighting (Light Navy, Soft Blue & Subtle Violet Glows) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[400px] bg-gradient-to-b from-[#38BDF8]/25 via-[#818CF8]/20 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-[600px] h-[600px] bg-[#818CF8]/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[600px] h-[600px] bg-[#C084FC]/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#38BDF8]/20 rounded-full blur-[130px] pointer-events-none" />

      {/* 2. Full-Screen Transparent Crystal Glass Formations (Bright Specular Reflections, Spread Across Full Canvas) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Specular White Edge Highlight */}
          <linearGradient id="edgeHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
          </linearGradient>

          {/* Cyan Specular Glass Facet */}
          <linearGradient id="cyanFacetLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#0284C7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.1" />
          </linearGradient>

          {/* Violet Specular Glass Facet */}
          <linearGradient id="violetFacetLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E087FF" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#C084FC" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.1" />
          </linearGradient>

          {/* Blue Specular Glass Facet */}
          <linearGradient id="blueFacetLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.1" />
          </linearGradient>

          <filter id="glassShine" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#38BDF8" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* TOP CENTER CRYSTAL SHINE */}
        <g transform="translate(630, -15) rotate(10)" filter="url(#glassShine)" opacity="0.75">
          <polygon points="100,20 190,65 160,160 70,125" fill="url(#cyanFacetLight)" stroke="rgba(56,189,248,0.5)" strokeWidth="1.2" />
          <polygon points="190,65 260,20 230,115 160,160" fill="url(#violetFacetLight)" stroke="rgba(192,132,252,0.4)" strokeWidth="1.2" />
          <line x1="100" y1="20" x2="190" y2="65" stroke="url(#edgeHighlight)" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* TOP-LEFT CRYSTAL FORMATION */}
        <g transform="translate(-20, -20) rotate(-10)" filter="url(#glassShine)" opacity="0.75">
          <polygon points="140,30 260,85 220,230 100,175" fill="url(#cyanFacetLight)" stroke="rgba(56,189,248,0.45)" strokeWidth="1.2" />
          <polygon points="260,85 360,30 330,165 220,230" fill="url(#violetFacetLight)" stroke="rgba(192,132,252,0.4)" strokeWidth="1.2" />
          <polygon points="100,175 220,230 170,320 60,245" fill="url(#blueFacetLight)" stroke="rgba(96,165,250,0.4)" strokeWidth="1.2" />
          <line x1="140" y1="30" x2="260" y2="85" stroke="url(#edgeHighlight)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="260" y1="85" x2="360" y2="30" stroke="url(#edgeHighlight)" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* MID-LEFT SIDE CRYSTAL CLUSTER */}
        <g transform="translate(-35, 300) rotate(8)" opacity="0.7">
          <polygon points="120,40 230,95 190,220 80,165" fill="url(#blueFacetLight)" stroke="rgba(96,165,250,0.4)" strokeWidth="1.2" />
          <polygon points="230,95 310,50 280,175 190,220" fill="url(#cyanFacetLight)" stroke="rgba(56,189,248,0.35)" strokeWidth="1.2" />
          <line x1="120" y1="40" x2="230" y2="95" stroke="url(#edgeHighlight)" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* TOP-RIGHT CRYSTAL FORMATION */}
        <g transform="translate(1060, -30) rotate(16)" filter="url(#glassShine)" opacity="0.75">
          <polygon points="160,40 280,95 240,240 120,185" fill="url(#violetFacetLight)" stroke="rgba(192,132,252,0.45)" strokeWidth="1.2" />
          <polygon points="280,95 380,40 350,175 240,240" fill="url(#cyanFacetLight)" stroke="rgba(56,189,248,0.4)" strokeWidth="1.2" />
          <line x1="160" y1="40" x2="280" y2="95" stroke="url(#edgeHighlight)" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* MID-RIGHT SIDE CRYSTAL CLUSTER */}
        <g transform="translate(1130, 320) rotate(-12)" opacity="0.7">
          <polygon points="130,30 240,85 195,210 90,155" fill="url(#violetFacetLight)" stroke="rgba(192,132,252,0.4)" strokeWidth="1.2" />
          <polygon points="240,85 320,40 290,165 195,210" fill="url(#blueFacetLight)" stroke="rgba(96,165,250,0.35)" strokeWidth="1.2" />
          <line x1="130" y1="30" x2="240" y2="85" stroke="url(#edgeHighlight)" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* BOTTOM-LEFT CRYSTAL FORMATION */}
        <g transform="translate(-40, 620) rotate(20)" opacity="0.7">
          <polygon points="120,40 245,95 205,240 80,185" fill="url(#violetFacetLight)" stroke="rgba(192,132,252,0.4)" strokeWidth="1.2" />
          <polygon points="245,95 345,50 315,185 205,240" fill="url(#blueFacetLight)" stroke="rgba(96,165,250,0.35)" strokeWidth="1.2" />
          <line x1="120" y1="40" x2="245" y2="95" stroke="url(#edgeHighlight)" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* BOTTOM-RIGHT CRYSTAL FORMATION */}
        <g transform="translate(1050, 590) rotate(-16)" opacity="0.7">
          <polygon points="140,40 265,95 225,240 100,185" fill="url(#cyanFacetLight)" stroke="rgba(56,189,248,0.4)" strokeWidth="1.2" />
          <polygon points="265,95 365,50 335,185 225,240" fill="url(#violetFacetLight)" stroke="rgba(192,132,252,0.35)" strokeWidth="1.2" />
          <line x1="140" y1="40" x2="265" y2="95" stroke="url(#edgeHighlight)" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>

      {/* 3. Main Center Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full mx-auto my-auto space-y-6 sm:space-y-7 pt-4">
        
        {/* AceHire AI Brand Logo */}
        <div 
          onClick={() => handleFeatureLaunch('home', onDismiss)}
          className="relative cursor-pointer group flex items-center justify-center transition-transform duration-300 hover:scale-105 mt-4 mb-1"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-2xl shadow-blue-500/30">
            <div className="w-full h-full bg-slate-950/90 backdrop-blur-md rounded-[22px] flex items-center justify-center relative overflow-hidden">
              <Brain className="w-9 h-9 sm:w-10 sm:h-10 text-blue-400 animate-pulse" />
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 absolute top-2.5 right-2.5" />
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 absolute bottom-2.5 left-2.5" />
            </div>
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-['Space_Grotesk'] text-white py-1.5 leading-snug">
            AceHire <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 font-extrabold tracking-tight">AI</span>
          </h1>

          <div className="text-base sm:text-xl font-extrabold tracking-wider font-['Plus_Jakarta_Sans'] uppercase flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-blue-400">PRACTICE SMART.</span>
            <span className="text-amber-400">GET HIRED.</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-xl mx-auto px-4">
          Prepare smarter, build confidence, and land your dream job<br className="hidden sm:inline" /> with AI-powered interview coaching.
        </p>

        {/* Primary CTA Button (Start Your Preparation -> checks Auth status) */}
        <div className="pt-2">
          <button
            onClick={() => handleFeatureLaunch('home', onDismiss)}
            className="px-9 py-4 sm:px-10 sm:py-4.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-blue-600/30 hover:shadow-purple-600/40 hover:-translate-y-1 transition-all duration-300 group cursor-pointer border border-white/10"
          >
            <span>Start Your Preparation</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full pt-4">
          {featureCards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleFeatureLaunch(card.id, onDismiss)}
              className={`group p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl text-left transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between shadow-xl ${card.accent}`}
            >
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 w-fit transition-transform duration-300 group-hover:scale-110">
                  {card.icon}
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  {card.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
