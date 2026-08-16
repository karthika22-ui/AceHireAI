import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Timer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Globe,
  RefreshCw,
  ArrowRight,
  UserCheck,
  Code2,
  Lightbulb,
  Check,
  Volume2,
  Brain,
  Eye,
  Target,
  ShieldCheck,
  Clock,
  Video,
  VideoOff,
  Sliders,
  Sparkle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  FileDown,
  Home,
  Zap,
  Shield,
  Flame,
  Copy,
  Trash2,
  Smile,
  GraduationCap,
  FolderGit2,
  Award,
  MessageSquareText,
  VolumeX,
  XCircle,
  LogOut,
  PlayCircle,
  X,
  BookOpen,
  HelpCircle,
  Quote,
  Activity,
  Gauge
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  QUESTION_BANK,
  evaluateAnswerWithAI,
  getRandomInterviewQuestions,
  generateInterviewFinalReport
} from '../../services/aiEngine';
import {
  InterviewQuestion,
  DualLanguageFeedback,
  SavedInterviewState,
  InterviewFinalReport
} from '../../types';
import { SessionResumeModal } from '../Common/SessionResumeModal';
import { SupabaseService } from '../../services/supabaseClient';

export const MockInterviewView: React.FC = () => {
  const { user, recordUserActivity, setActiveTab, registerWorkflowGuard, clearWorkflowGuard } = useApp();

  // Synchronous initial state helper
  const getInitialSavedSession = (): SavedInterviewState | null => {
    return null;
  };

  const initialSaved = useRef(getInitialSavedSession()).current;

  // 1. Category & Difficulty State
  const [selectedType, setSelectedType] = useState<'HR' | 'Technical'>(() => (initialSaved ? initialSaved.selectedType : 'HR'));
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(() => (initialSaved ? initialSaved.difficulty : 'Medium'));
  
  // 2. Hardware Check State
  const [micStatus, setMicStatus] = useState<'connected' | 'testing' | 'active'>('connected');
  const [cameraActive, setCameraActive] = useState<boolean>(() => (initialSaved ? !!initialSaved.cameraActive : false));
  const [micMuted, setMicMuted] = useState<boolean>(() => (initialSaved ? !!initialSaved.micMuted : false));
  const [audioTesting, setAudioTesting] = useState<boolean>(false);
  const hardwareVideoRef = useRef<HTMLVideoElement | null>(null);
  const interviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mainContainerRef = useRef<HTMLDivElement | null>(null);

  // Speech Recognition & Multimodal Camera Sampling Refs (Requirements 1-9)
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const baseAnswerRef = useRef<string>('');
  const capturedFramesRef = useRef<string[]>([]);
  const silenceTimerRef = useRef<any>(null);

  // Configured Interview Duration Helper (Requirement STEP 1)
  // HR Interview → Exactly 20:00 (1200s)
  // Technical Interview → Exactly 25:00 (1500s)
  const getConfiguredDuration = (type: 'HR' | 'Technical') => {
    return type === 'HR' ? 1200 : 1500;
  };

  // 3. Session Control State
  const [sessionActive, setSessionActive] = useState<boolean>(() => !!initialSaved);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() => (initialSaved ? (initialSaved.currentQuestionIndex || 0) : 0));
  const [userAnswer, setUserAnswer] = useState<string>(() => (initialSaved ? (initialSaved.userAnswer || '') : ''));

  // REGISTER GLOBAL EXIT GUARD FOR MOCK INTERVIEW
  useEffect(() => {
    const isDirty = sessionActive && !sessionCompleted;
    registerWorkflowGuard('Mock Interview', isDirty);
    return () => {
      clearWorkflowGuard('Mock Interview');
    };
  }, [sessionActive, sessionCompleted, registerWorkflowGuard, clearWorkflowGuard]);

  // Automatically scroll to the top of the interview screen when session becomes active or question changes
  useEffect(() => {
    if (sessionActive && !sessionCompleted) {
      if (mainContainerRef.current) {
        mainContainerRef.current.scrollTop = 0;
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.scrollTop = 0;
    }
  }, [sessionActive, sessionCompleted, currentQuestionIndex]);

  const [isListening, setIsListening] = useState<boolean>(false);

  const [timerSeconds, setTimerSeconds] = useState<number>(() => {
    if (initialSaved && initialSaved.timerSeconds !== undefined) {
      let tSec = initialSaved.timerSeconds;
      if (initialSaved.savedAtTimestamp) {
        const elapsed = Math.floor((Date.now() - initialSaved.savedAtTimestamp) / 1000);
        if (elapsed > 0) {
          tSec = Math.max(0, tSec - elapsed);
        }
      }
      return tSec;
    }
    return getConfiguredDuration('HR');
  });

  const [recSeconds, setRecSeconds] = useState<number>(() => {
    if (initialSaved && initialSaved.recSeconds !== undefined) {
      let rSec = initialSaved.recSeconds;
      if (initialSaved.savedAtTimestamp && initialSaved.cameraActive) {
        const elapsed = Math.floor((Date.now() - initialSaved.savedAtTimestamp) / 1000);
        if (elapsed > 0) {
          rSec += elapsed;
        }
      }
      return rSec;
    }
    return 0;
  });

  const [answersHistory, setAnswersHistory] = useState<{
    question: InterviewQuestion;
    userAnswer: string;
    feedback: DualLanguageFeedback;
  }[]>(() => (initialSaved ? (initialSaved.answersHistory || []) : []));

  // Timer Color Class Helper: > 5m Amber, <= 5m Orange, <= 1m Red + Pulse Animation
  const getTimerColorClass = (sec: number) => {
    if (sec <= 60) {
      return 'bg-red-500/20 text-red-400 border-red-500/50 shadow-md shadow-red-500/20 animate-pulse';
    } else if (sec <= 300) {
      return 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-sm';
    } else {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-sm';
    }
  };

  // 4. Persistence & Resume State
  const [savedSession, setSavedSession] = useState<SavedInterviewState | null>(initialSaved);
  const [showResumeModal, setShowResumeModal] = useState<boolean>(() => !!initialSaved);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  // 5. AI Evaluation State & Model Answer View Toggle
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [feedback, setFeedback] = useState<DualLanguageFeedback | null>(() => {
    if (initialSaved && initialSaved.answersHistory && initialSaved.activeQuestions) {
      const qIdx = initialSaved.currentQuestionIndex || 0;
      const currentSavedItem = initialSaved.answersHistory.find((item) => item.question.id === initialSaved.activeQuestions[qIdx]?.id);
      if (currentSavedItem && currentSavedItem.feedback) {
        return currentSavedItem.feedback;
      }
    }
    return null;
  });
  const [showModelAnswer, setShowModelAnswer] = useState<boolean>(false);

  // Dynamic Recording Timer Effect (Starts from 00:00 when camera is ON, pauses when evaluating or exit modal open)
  useEffect(() => {
    let interval: any;
    if (cameraActive && !isEvaluating && !feedback && !showExitModal) {
      interval = setInterval(() => {
        setRecSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cameraActive, isEvaluating, !!feedback, showExitModal]);

  const formatRecTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `REC ${m}:${s}`;
  };

  // Synchronize Microphone Mute State with active MediaStream and Speech Recognition (Requirement 4)
  useEffect(() => {
    if (micMuted && isListening) {
      setIsListening(false);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !micMuted;
      });
    }
  }, [micMuted, isListening]);

  // 6. Accordions State
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    evaluation: true,
    mistakes: true,
    camera: true,
    correctAnswer: true,
    explanation: true,
    scorecard: true
  });

  // Dynamic Session Questions Pool State
  const [activeQuestions, setActiveQuestions] = useState<InterviewQuestion[]>(() =>
    initialSaved && initialSaved.activeQuestions && initialSaved.activeQuestions.length > 0
      ? initialSaved.activeQuestions
      : getRandomInterviewQuestions('HR', 'Medium', 4)
  );

  const isRestoredRef = useRef<boolean>(true);

  // Re-open camera stream on mount if camera was active in restored session
  useEffect(() => {
    if (initialSaved && initialSaved.cameraActive) {
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  }, []);

  // Initialize fresh questions pool and configured duration on category/difficulty change ONLY if session NOT active
  useEffect(() => {
    if (!sessionActive) {
      setActiveQuestions(getRandomInterviewQuestions(selectedType, difficulty, 4));
      setTimerSeconds(getConfiguredDuration(selectedType));
    }
  }, [selectedType, difficulty, sessionActive]);

  const currentQ: InterviewQuestion = activeQuestions[currentQuestionIndex] || {
    id: 'default',
    category: selectedType,
    question: selectedType === 'HR' ? 'Tell me about yourself and your career goals.' : 'Explain the difference between SQL and NoSQL databases.',
    contextHint: 'Highlight key concepts clearly and provide real-world examples.',
    expectedKeypoints: ['key concepts', 'examples', 'structure']
  };

  // Timer Countdown (Fix: single continuous interval that never freezes, updates every second)
  useEffect(() => {
    if (!sessionActive || sessionCompleted || isEvaluating || showExitModal) {
      return;
    }
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionActive, sessionCompleted, isEvaluating, showExitModal]);

  // Auto-finish interview when countdown timer reaches zero (Requirement 1 & STEP 1)
  useEffect(() => {
    if (sessionActive && !sessionCompleted && timerSeconds === 0) {
      stopCamera();
      setIsListening(false);
      setSessionCompleted(true);
      clearSessionStorage();
    }
  }, [sessionActive, sessionCompleted, timerSeconds]);

  // Attach active camera MediaStream to video elements whenever view or camera state changes
  const attachStreamToVideoElements = (stream: MediaStream) => {
    setTimeout(() => {
      if (hardwareVideoRef.current) {
        hardwareVideoRef.current.srcObject = stream;
      }
      if (interviewVideoRef.current) {
        interviewVideoRef.current.srcObject = stream;
      }
    }, 50);
  };

  useEffect(() => {
    if (cameraActive && mediaStreamRef.current && mediaStreamRef.current.active) {
      attachStreamToVideoElements(mediaStreamRef.current);
    }
  }, [cameraActive, sessionActive]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // Real-time camera frame snapshot capture for Multimodal AI Vision Analysis (Requirements 1-9)
  useEffect(() => {
    if (!cameraActive || !sessionActive || sessionCompleted) {
      capturedFramesRef.current = [];
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');

    const interval = setInterval(() => {
      const video = interviewVideoRef.current || hardwareVideoRef.current;
      if (video && video.readyState >= 2 && ctx) {
        try {
          ctx.drawImage(video, 0, 0, 320, 240);
          const frameDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          if (frameDataUrl && frameDataUrl.length > 500) {
            if (capturedFramesRef.current.length < 4) {
              capturedFramesRef.current.push(frameDataUrl);
            } else {
              capturedFramesRef.current[capturedFramesRef.current.length - 1] = frameDataUrl;
            }
          }
        } catch (e) {
          console.warn('Webcam frame capture failed:', e);
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [cameraActive, sessionActive, sessionCompleted]);

  // Save interview session progress to state and Supabase DB
  const saveSessionToStorage = (
    history = answersHistory,
    qIndex = currentQuestionIndex,
    questions = activeQuestions,
    ans = userAnswer,
    tSec = timerSeconds,
    rSec = recSeconds,
    cam = cameraActive,
    mic = micMuted
  ) => {
    try {
      const payload: SavedInterviewState = {
        id: `session-${Date.now()}`,
        selectedType,
        difficulty,
        currentQuestionIndex: qIndex,
        activeQuestions: questions,
        userAnswer: ans,
        timerSeconds: tSec,
        recSeconds: rSec,
        cameraActive: cam,
        micMuted: mic,
        answersHistory: history,
        sessionActive: true,
        savedAtTimestamp: Date.now(),
        timestamp: new Date().toISOString()
      };
      setSavedSession(payload);
      if (user?.id) {
        SupabaseService.saveInterviewSession(user.id, payload);
      }
    } catch (e) {
      console.error('Session save failed', e);
    }
  };

  // Continuous auto-save while session is active
  useEffect(() => {
    if (isRestoredRef.current && sessionActive && !sessionCompleted && activeQuestions.length > 0) {
      saveSessionToStorage();
    }
  }, [sessionActive, sessionCompleted, currentQuestionIndex, userAnswer, answersHistory, selectedType, difficulty, timerSeconds, recSeconds, cameraActive, micMuted]);

  // Window beforeunload auto-save for tab close / refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionActive && !sessionCompleted && activeQuestions.length > 0) {
        saveSessionToStorage();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionActive, sessionCompleted, currentQuestionIndex, userAnswer, timerSeconds, answersHistory, selectedType, difficulty]);

  // Clear saved session from state
  const clearSessionStorage = () => {
    setSavedSession(null);
  };

  // Speech Recognition with Non-Duplicating Stream Processing (Requirement 1)
  const resetSilenceAutoStopTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        isListeningRef.current = false;
        setIsListening(false);
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }
      }
    }, 3000);
  };

  const toggleSpeechRecognition = () => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome/Edge.');
      return;
    }
    if (micMuted) {
      alert('Microphone is currently muted. Please unmute your microphone to start speaking.');
      return;
    }

    if (!isListening) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      baseAnswerRef.current = userAnswer.trim();
      capturedFramesRef.current = [];
      isListeningRef.current = true;
      setIsListening(true);

      let sessionFinalText = '';
      resetSilenceAutoStopTimer();

      recognition.onresult = (event: any) => {
        resetSilenceAutoStopTimer();
        let currentFinal = '';
        let currentInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const transcriptChunk = res[0].transcript;
          if (res.isFinal) {
            currentFinal += transcriptChunk + ' ';
          } else {
            currentInterim += transcriptChunk;
          }
        }

        sessionFinalText = currentFinal;

        const base = baseAnswerRef.current;
        const full = [base, sessionFinalText.trim(), currentInterim.trim()]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ');

        setUserAnswer(full.slice(0, 800));
      };

      recognition.onerror = (err: any) => {
        console.error('Speech recognition error', err);
        if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
          setIsListening(false);
          isListeningRef.current = false;
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          alert('Microphone access denied. Please check browser permissions.');
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          if (userAnswer.trim()) {
            baseAnswerRef.current = userAnswer.trim();
          }
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
            isListeningRef.current = false;
          }
        } else {
          setIsListening(false);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        }
      };

      try {
        recognition.start();
      } catch (e) {
        setIsListening(false);
        isListeningRef.current = false;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        console.error('Speech recognition start error', e);
      }
    } else {
      isListeningRef.current = false;
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    }
  };

  // Hardware Checks
  const handleTestAudio = () => {
    setAudioTesting(true);
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.log('Audio Context Error', e);
    }
    setTimeout(() => setAudioTesting(false), 800);
  };

  const handleTestMic = async () => {
    setMicStatus('testing');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setTimeout(() => {
        stream.getTracks().forEach((track) => track.stop());
        setMicStatus('active');
        setTimeout(() => setMicStatus('connected'), 2500);
      }, 1800);
    } catch (e) {
      alert('Microphone permission or hardware device not available.');
      setMicStatus('connected');
    }
  };

  const startCamera = async () => {
    if (mediaStreamRef.current && mediaStreamRef.current.active) {
      setCameraActive(true);
      attachStreamToVideoElements(mediaStreamRef.current);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = stream;
      setCameraActive(true);
      attachStreamToVideoElements(stream);
    } catch (err: any) {
      console.error('Camera access error', err);
      setCameraActive(false);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert('Camera device not found. Please connect a camera.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Camera permission denied. Please allow camera access in browser settings.');
      }
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (hardwareVideoRef.current) {
      hardwareVideoRef.current.srcObject = null;
    }
    if (interviewVideoRef.current) {
      interviewVideoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handlePreviewCamera = () => {
    toggleCamera();
  };

  // Textarea Actions
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUserAnswer((prev) => (prev ? `${prev} ${text}` : text).slice(0, 800));
    } catch (err) {
      alert('Clipboard permission denied. Use Ctrl+V to paste your response.');
    }
  };

  const handleClear = () => {
    setUserAnswer('');
  };

  // Automatically scroll to the top of the interview screen when session becomes active
  useEffect(() => {
    if (sessionActive && !sessionCompleted) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.scrollTop = 0;
    }
  }, [sessionActive, sessionCompleted]);

  // Session Handlers
  const handleStartSession = () => {
    clearSessionStorage();
    const newQuestions = getRandomInterviewQuestions(selectedType, difficulty, 4);
    setActiveQuestions(newQuestions);
    setAnswersHistory([]);
    setSessionActive(true);
    setSessionCompleted(false);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setFeedback(null);
    setTimerSeconds(getConfiguredDuration(selectedType));
    setRecSeconds(0);
    setShowModelAnswer(false);

    // Immediate Scroll to Top
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  };

  const handleResumeSession = () => {
    if (!savedSession) return;
    setSelectedType(savedSession.selectedType);
    setDifficulty(savedSession.difficulty);
    setActiveQuestions(savedSession.activeQuestions);
    setCurrentQuestionIndex(savedSession.currentQuestionIndex);
    setUserAnswer(savedSession.userAnswer || '');
    setTimerSeconds(savedSession.timerSeconds !== undefined ? savedSession.timerSeconds : getConfiguredDuration(savedSession.selectedType));
    setAnswersHistory(savedSession.answersHistory || []);
    setSessionActive(true);
    setSessionCompleted(false);
    setFeedback(null);
    setShowModelAnswer(false);
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;

    // Immediately stop speech recognition & clear silence timer on submit
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    setIsEvaluating(true);
    setLoadingStep(1);

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < 5 ? prev + 1 : 5));
    }, 400);

    try {
      const activeVideo = interviewVideoRef.current || hardwareVideoRef.current;
      if (activeVideo && activeVideo.readyState >= 2) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(activeVideo, 0, 0, 320, 240);
            const finalSnap = canvas.toDataURL('image/jpeg', 0.6);
            if (finalSnap && finalSnap.length > 500) {
              capturedFramesRef.current.push(finalSnap);
            }
          }
        } catch (e) {
          console.warn('Final frame capture failed:', e);
        }
      }

      const frames = capturedFramesRef.current.filter((f) => f && f.length > 500);

      // Preserve frames captured while camera was ON during the answer,
      // even if cameraActive was toggled OFF right before clicking submit!
      let cameraOpts: any = { isCameraOn: false };
      if (frames.length > 0 || cameraActive) {
        if (frames.length > 0) {
          cameraOpts = {
            isCameraOn: true,
            capturedFrames: frames
          };
        } else {
          cameraOpts = {
            isCameraOn: true,
            capturedFrames: [],
            visualObservations: {
              insufficientData: true,
              errorNotice: 'Insufficient visual data captured from camera feed.'
            }
          };
        }
      }

      const res = await evaluateAnswerWithAI(
        currentQ.question,
        userAnswer,
        currentQ.category,
        difficulty,
        user.preferredLanguage,
        cameraOpts,
        user
      );
      clearInterval(interval);
      setLoadingStep(5);
      await new Promise((r) => setTimeout(r, 250));
      setFeedback(res);
      setShowModelAnswer(false);

      // Cleanly replace history entry if resubmitting for current question, else append
      let updatedHistory = [...answersHistory];
      const existingIdx = updatedHistory.findIndex((item) => item.question.id === currentQ.id);
      if (existingIdx !== -1) {
        updatedHistory[existingIdx] = { question: currentQ, userAnswer, feedback: res };
      } else {
        updatedHistory.push({ question: currentQ, userAnswer, feedback: res });
      }

      setAnswersHistory(updatedHistory);
      saveSessionToStorage(updatedHistory, currentQuestionIndex, activeQuestions);

      recordUserActivity(
        'interview',
        `${selectedType} Mock Interview (${difficulty})`,
        res.overallScore,
        'Interview'
      );
    } catch (err) {
      console.error(err);
      clearInterval(interval);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (currentQuestionIndex + 1 < activeQuestions.length) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setUserAnswer('');
      baseAnswerRef.current = '';
      setFeedback(null);
      setShowModelAnswer(false);
      capturedFramesRef.current = [];
      saveSessionToStorage(answersHistory, nextIndex, activeQuestions, '');
    } else {
      setSessionCompleted(true);
      if (user?.id) {
        SupabaseService.saveInterviewSession(user.id, {
          type: selectedType,
          difficulty,
          score: finalReport.overallScore,
          session_data: answersHistory,
          final_report: finalReport,
          status: 'completed'
        });
      }
      clearSessionStorage();
    }
  };

  // Exit Interview Modal Handlers
  const handleExitSave = () => {
    saveSessionToStorage();
    setShowExitModal(false);
    setSessionActive(false);
  };

  const handleExitDiscard = () => {
    clearSessionStorage();
    setShowExitModal(false);
    setSessionActive(false);
    setActiveTab('dashboard');
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadingSteps = [
    'Analyzing Answer Structure & Relevance...',
    'Checking Technical Keypoints & Terminology...',
    'Evaluating Performance Factors...',
    'Generating Correct Professional Model Answer...',
    'Preparing Performance Scorecard...'
  ];

  // Final Report Generation
  const finalReport: InterviewFinalReport = generateInterviewFinalReport(
    answersHistory,
    selectedType,
    difficulty
  );

  return (
    <div ref={mainContainerRef} className="w-full max-w-6xl mx-auto px-4 sm:px-6 flex-1 overflow-y-auto space-y-7 pb-12 animate-in fade-in duration-300 relative">
      
      {/* Global Session Continuation Modal */}
      <SessionResumeModal
        isOpen={showResumeModal && !!initialSaved}
        moduleName="AI Mock Interview"
        progressText={
          initialSaved
            ? `Question ${(initialSaved.currentQuestionIndex || 0) + 1} of ${initialSaved.activeQuestions?.length || 5} (${initialSaved.selectedType} - ${initialSaved.difficulty})`
            : ''
        }
        onContinue={() => {
          setShowResumeModal(false);
          setSessionActive(true);
        }}
        onExit={() => {
          setShowResumeModal(false);
          clearSessionStorage();
          setSavedSession(null);
          setSessionActive(false);
          setCurrentQuestionIndex(0);
        }}
      />

      {/* 2. INTERVIEW COMPLETION SCREEN */}
      {sessionActive && sessionCompleted ? (
        <div className="space-y-7 animate-in zoom-in-95 duration-500">
          <div className="animated-border-glow-wrapper">
            <div className="relative overflow-hidden rounded-[23px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 sm:p-10 text-white text-center border-0 shadow-2xl space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk'] text-white">
                  🎉 Interview Completed!
                </h1>
                <p className="text-sm sm:text-base text-slate-300 font-medium max-w-xl mx-auto">
                  Great job completing your <strong className="text-blue-400">{selectedType} Mock Round ({difficulty})</strong>. Here is your AI placement readiness final report.
                </p>
              </div>

              {/* Overall Score Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-[0_0_25px_rgba(34,197,94,0.2)]">
                <div className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Overall Session Score</div>
                <div className="text-3xl font-black text-[#22C55E] drop-shadow-md">{finalReport.overallScore} / 100</div>
              </div>
            </div>
          </div>

          {/* FINAL REPORT DETAILED METRICS BREAKDOWN */}
          <div className="glass-card rounded-2xl p-6 border border-slate-700/80 bg-slate-900/70 backdrop-blur-xl shadow-xl space-y-6">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Award className="w-5 h-5 text-emerald-400" />
              <span>Score Factors Summary</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold">
              <div>
                <div className="flex justify-between text-slate-300 mb-1.5">
                  <span>Technical Accuracy</span>
                  <span className="text-[#22C55E] font-bold">{finalReport.technicalScore} / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#22C55E] h-full rounded-full transition-all duration-500" style={{ width: `${finalReport.technicalScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1.5">
                  <span>Grammar & Syntax</span>
                  <span className="text-[#22C55E] font-bold">{finalReport.grammarScore} / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#22C55E] h-full rounded-full transition-all duration-500" style={{ width: `${finalReport.grammarScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1.5">
                  <span>Communication & Structure</span>
                  <span className="text-[#22C55E] font-bold">{finalReport.communicationScore} / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#22C55E] h-full rounded-full transition-all duration-500" style={{ width: `${finalReport.communicationScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1.5">
                  <span>Confidence & Clarity</span>
                  <span className="text-[#22C55E] font-bold">{finalReport.confidenceScore} / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#22C55E] h-full rounded-full transition-all duration-500" style={{ width: `${finalReport.confidenceScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* STRENGTHS, WEAKNESSES & MISTAKES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths Card */}
            <div className="glass-card rounded-2xl p-6 border border-slate-700/80 bg-slate-900/60 backdrop-blur-xl shadow-md space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Key Strengths Observed</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                {finalReport.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses Card */}
            <div className="glass-card rounded-2xl p-6 border border-slate-700/80 bg-slate-900/60 backdrop-blur-xl shadow-md space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Areas for Improvement</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                {finalReport.weaknesses.map((weak, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RECOMMENDED TOPICS & AI LEARNING SUGGESTIONS */}
          <div className="glass-card rounded-2xl p-6 border border-slate-700/80 bg-slate-900/60 backdrop-blur-xl shadow-md space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <span>Recommended Practice Topics & AI Learning Suggestions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {finalReport.recommendedTopics.map((topic, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 font-semibold flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>{topic}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-900/60 text-xs text-blue-200 space-y-2 pt-3">
              <strong className="block text-blue-400 font-bold uppercase tracking-wider">💡 Next Steps Strategy:</strong>
              {finalReport.aiSuggestions.map((sug, i) => (
                <p key={i} className="leading-relaxed">• {sug}</p>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleStartSession}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:scale-[1.02] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Interview</span>
            </button>
            <button
              onClick={() => alert('PDF Placement Report generated and saved to downloads folder.')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-slate-500 hover:scale-[1.02]"
            >
              <FileDown className="w-4 h-4 text-blue-400" />
              <span>Download PDF Report</span>
            </button>
            <button
              onClick={() => {
                setSessionActive(false);
                setSessionCompleted(false);
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-slate-500 hover:scale-[1.02]"
            >
              <Home className="w-4 h-4 text-purple-400" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      ) : !sessionActive ? (
        /* 3. SETUP & CONFIGURATION VIEW */
        <div className="space-y-7">
          {/* HERO CARD */}
          <div className="animated-border-glow-wrapper">
            <div className="relative overflow-hidden rounded-[23px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white border-0 shadow-2xl">
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2.5 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
                    <Bot className="w-4 h-4 text-[#38BDF8] brightness-110" />
                    <span>AI Interview Simulator</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk'] text-white">
                    AI Mock Interview
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
                    Practice realistic HR and Technical interviews with instant AI feedback to improve placement readiness.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* INTERVIEW CATEGORY SELECTION */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 brightness-110" />
                <span>Select Interview Category</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* HR Interview Card */}
              <div
                onClick={() => setSelectedType('HR')}
                className={`glass-card rounded-2xl p-6 sm:p-7 border transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between group relative overflow-hidden h-full ${
                  selectedType === 'HR'
                    ? 'border-blue-500/90 bg-slate-900/95 shadow-[0_0_30px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/60 scale-[1.01]'
                    : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-500 hover:-translate-y-1 hover:shadow-2xl'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 brightness-110 shadow-sm">
                      <UserCheck className="w-7 h-7 text-purple-400" />
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                      selectedType === 'HR'
                        ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-500/30'
                        : 'border-slate-700 bg-slate-800/80'
                    }`}>
                      {selectedType === 'HR' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-white group-hover:text-blue-400 transition-colors">
                    HR Interview
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 mb-5 leading-relaxed font-medium">
                    Evaluate communication, situational judgement, and behavioral readiness.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Duration: 15–20 Mins</span>
                  </span>
                  <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                    Behavioral Round
                  </span>
                </div>
              </div>

              {/* Technical Interview Card */}
              <div
                onClick={() => setSelectedType('Technical')}
                className={`glass-card rounded-2xl p-6 sm:p-7 border transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between group relative overflow-hidden h-full ${
                  selectedType === 'Technical'
                    ? 'border-blue-500/90 bg-slate-900/95 shadow-[0_0_30px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/60 scale-[1.01]'
                    : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-500 hover:-translate-y-1 hover:shadow-2xl'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 brightness-110 shadow-sm">
                      <Code2 className="w-7 h-7 text-cyan-400" />
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                      selectedType === 'Technical'
                        ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-500/30'
                        : 'border-slate-700 bg-slate-800/80'
                    }`}>
                      {selectedType === 'Technical' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-white group-hover:text-blue-400 transition-colors">
                    Technical Interview
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 mb-5 leading-relaxed font-medium">
                    Test core computer science topics, algorithms, databases, and system design.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Duration: 20–25 Mins</span>
                  </span>
                  <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                    Technical CS
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CURRENT SELECTION SUMMARY CARD & DIFFICULTY PILLS */}
          <div className="glass-card rounded-2xl p-6 border border-slate-700/80 bg-slate-900/70 backdrop-blur-xl shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <Sliders className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Interview Configuration Summary</h3>
                  <p className="text-xs text-slate-400">Current active parameter status before session start</p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                <span>Status: Ready to Start</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Selected Round</span>
                <span className="font-extrabold text-white text-sm">{selectedType} Interview</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Difficulty</span>
                <span className="font-extrabold text-blue-400 text-sm">{difficulty}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Duration</span>
                <span className="font-extrabold text-slate-200 text-sm">{selectedType === 'HR' ? '15–20 Minutes' : '20–25 Minutes'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Generated Pool</span>
                <span className="font-extrabold text-purple-400 text-sm">{activeQuestions.length} AI Questions</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-800/80">
              <span className="text-xs text-slate-300 font-extrabold uppercase tracking-wider">Select Difficulty Level:</span>
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto">
                {(['Easy', 'Medium', 'Hard'] as const).map((level) => {
                  const isActive = difficulty === level;
                  return (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      {level === 'Easy' && <Zap className="w-3.5 h-3.5 text-amber-400" />}
                      {level === 'Medium' && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                      {level === 'Hard' && <Flame className="w-3.5 h-3.5 text-red-400" />}
                      <span>{level}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* HARDWARE DIAGNOSTIC WIDGET */}
          <div className="glass-card rounded-2xl p-6 border border-slate-700/80 bg-slate-900/60 backdrop-blur-xl shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-extrabold text-white">Hardware & System Check</h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                System Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Mic className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">Microphone</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    micStatus === 'testing'
                      ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20 animate-pulse'
                      : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  }`}>
                    {micStatus === 'testing' ? 'Testing Input...' : 'Connected'}
                  </span>
                </div>
                <button
                  onClick={handleTestMic}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5 text-blue-400" />
                  <span>{micStatus === 'testing' ? 'Listening...' : 'Test Mic'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Video className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">Camera</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                    {cameraActive ? 'Active Preview' : 'Optional'}
                  </span>
                </div>
                <button
                  onClick={handlePreviewCamera}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                  <span>{cameraActive ? 'Close Camera' : 'Preview Camera'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Speaker</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {audioTesting ? 'Playing Chime...' : 'Ready'}
                  </span>
                </div>
                <button
                  onClick={handleTestAudio}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{audioTesting ? 'Testing Sound...' : 'Test Audio'}</span>
                </button>
              </div>
            </div>

            {cameraActive && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-purple-500/40 relative overflow-hidden animate-in fade-in">
                <video ref={hardwareVideoRef} autoPlay playsInline muted className="w-full h-48 object-cover rounded-xl" />
                <span className="absolute top-5 left-5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Live Camera Stream
                </span>
              </div>
            )}
          </div>

          {/* START INTERVIEW BUTTON */}
          <button
            onClick={handleStartSession}
            className="relative w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.45)] transition-all duration-300 ease-out hover:scale-[1.02] active:scale-98 cursor-pointer overflow-hidden group"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            <span className="relative z-10 text-white font-extrabold">Start Interview</span>
            <ArrowRight className="w-5 h-5 relative z-10 text-white group-hover:translate-x-1.5 transition-transform duration-300 ease-out brightness-110" />
          </button>
        </div>
      ) : (
        /* 4. LIVE INTERVIEW QUESTION ROOM & EVALUATION WORKFLOW (PREMIUM SAAS REDESIGN) */
        <div className="space-y-6 animate-in fade-in duration-500">
          
          {/* TOP CONTROL BAR & GLOWING PROGRESS HEADER */}
          <div className="glass-card rounded-3xl p-5 border border-slate-700/80 bg-slate-900/80 backdrop-blur-xl shadow-2xl space-y-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              {/* Question Count & Round Badge */}
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs font-black shadow-md border border-white/10 tracking-wide">
                  Question {currentQuestionIndex + 1} of {activeQuestions.length}
                </span>
                <span className="text-xs font-extrabold text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/80">
                  {selectedType} Interview • {difficulty} Level
                </span>
              </div>

              {/* Color-Coded Simplified Icon Toggle Controls Row (Requirement 3) */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* 📷 Clean Icon-Only Camera Toggle Button (Requirement 3) */}
                <button
                  onClick={() => (cameraActive ? stopCamera() : startCamera())}
                  className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer border ${
                    cameraActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm hover:bg-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                  }`}
                  title={cameraActive ? 'Camera Enabled (Click to Disable)' : 'Camera Disabled (Click to Enable)'}
                  aria-label={cameraActive ? 'Camera Enabled' : 'Camera Disabled'}
                >
                  {cameraActive ? (
                    <Video className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VideoOff className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* 🎤 Clean Icon-Only Mic Toggle Button (Requirement 3) */}
                <button
                  onClick={() => setMicMuted((prev) => !prev)}
                  className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer border ${
                    !micMuted
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm hover:bg-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                  }`}
                  title={micMuted ? 'Microphone Muted (Click to Unmute)' : 'Microphone Active (Click to Mute)'}
                  aria-label={micMuted ? 'Microphone Muted' : 'Microphone Active'}
                >
                  {!micMuted ? (
                    <Mic className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <MicOff className="w-4 h-4 text-red-400" />
                  )}
                </button>

                {/* ⏱️ Top Interview Countdown Timer with Color-Coding (>5m Amber, <=5m Orange, <=1m Red Pulse) (Requirement 1) */}
                <div className={`flex items-center gap-1.5 text-xs font-mono font-bold px-3.5 py-2 rounded-xl border transition-colors ${getTimerColorClass(timerSeconds)}`}>
                  <Timer className="w-4 h-4 brightness-110" />
                  <span>{Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
                </div>

                {/* Exit Button */}
                <button
                  onClick={() => setShowExitModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/40 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit</span>
                </button>
              </div>
            </div>

            {/* Glowing Gradient Progress Bar (Requirement 6) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Overall Progress</span>
                <span className="text-emerald-400 font-extrabold">{Math.round(((currentQuestionIndex + 1) / activeQuestions.length) * 100)}% Completed</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                  style={{ width: `${((currentQuestionIndex + 1) / activeQuestions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* COMBINED QUESTION CARD & INTEGRATED BALANCED CAMERA PREVIEW */}
          <div className="glass-card rounded-3xl p-5 sm:p-7 border border-blue-500/30 bg-slate-900/80 backdrop-blur-2xl shadow-2xl space-y-4 relative overflow-hidden">
            <Quote className="w-12 h-12 text-blue-500/15 absolute top-6 right-6 pointer-events-none z-0" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center relative z-10">
              
              {/* LEFT COLUMN: QUESTION DETAILS & HINT */}
              <div className="lg:col-span-7 space-y-3 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-extrabold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>{selectedType} Interview Question</span>
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-extrabold text-white font-['Space_Grotesk'] leading-snug tracking-tight">
                  "{currentQ.question}"
                </h2>

                {/* AI CONTEXT HINT */}
                <div className="border-l-4 border-l-blue-500 bg-blue-950/30 border border-blue-900/50 p-3 sm:p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-blue-200">
                  <Lightbulb className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 brightness-110" />
                  <div>
                    <strong className="block font-bold text-blue-400 uppercase tracking-wider mb-0.5 text-[10px]">💡 AI Context Hint</strong>
                    <p className="leading-relaxed font-medium text-slate-200 text-xs">{currentQ.contextHint}</p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: HORIZONTALLY EXPANDED PROPORTIONAL CAMERA PREVIEW */}
              <div className="lg:col-span-5 w-full flex flex-col items-center lg:items-end">
                <div className="p-2.5 sm:p-3 rounded-2xl border border-blue-500/40 bg-slate-950/90 backdrop-blur-xl shadow-xl w-full max-w-[310px] sm:max-w-[330px] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1 shadow-sm text-[10px] ${
                      cameraActive ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cameraActive ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
                      {cameraActive ? 'Live Camera' : 'Camera Standby'}
                    </span>
                    {cameraActive && (
                      <span className="font-mono text-amber-400 font-bold animate-pulse text-[10px]">
                        {formatRecTime(recSeconds)}
                      </span>
                    )}
                  </div>

                  {/* Widescreen 16:10 Aspect Video Box (Expanded Horizontally, Compact Vertically) */}
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 w-full aspect-[16/10] flex items-center justify-center shadow-inner">
                    {cameraActive ? (
                      <video ref={interviewVideoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-1 text-slate-500 p-2 text-center">
                        <VideoOff className="w-5 h-5 text-slate-500" />
                        <span className="text-[11px] font-extrabold text-slate-400">Camera Off</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-800/80">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold truncate">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      {cameraActive ? 'Video Active' : 'Mic Ready'}
                    </span>
                    <span className="text-slate-400 text-[9px]">Face Centered</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ANSWER INPUT AREA DIRECTLY BELOW WITH NO EXTRA GAPS */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <span>Your Answer</span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5 animate-in fade-in duration-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Saved just now
                  </span>
                </label>

                {/* Speech Input & Paste Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Prominent "Start Speaking" Button (Requirement 4) */}
                  <button
                    onClick={toggleSpeechRecognition}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                    <span>{isListening ? 'Stop Speaking' : 'Start Speaking'}</span>
                  </button>

                  <button
                    onClick={handlePaste}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-purple-400" />
                    <span>Paste</span>
                  </button>

                  {userAnswer.length > 0 && (
                    <button
                      onClick={handleClear}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-red-500/20 text-red-400 border border-slate-700 hover:border-red-500/40 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Textarea Input */}
              <textarea
                rows={6}
                maxLength={800}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type or speak your structured answer here..."
                className="w-full p-5 rounded-2xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner leading-relaxed font-sans placeholder:text-slate-500"
              />

              {/* Live Indicators Bar (Requirement 5) */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-medium px-1 gap-2">
                <div className="flex items-center gap-3">
                  <span>{userAnswer.length} / 800 chars</span>
                  <span>•</span>
                  <span>{userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0} words</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    ~{Math.ceil((userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0) / 2.2)} sec speaking time
                  </span>
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON WITH CONTINUOUS SHINE (Requirement 6) */}
            {isEvaluating ? (
              <div className="p-6 rounded-2xl bg-slate-950 border border-blue-500/40 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                    <span className="text-sm font-extrabold text-white">AI Real-Time Evaluation in Progress</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                    Step {loadingStep} of 5
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${(loadingStep / 5) * 100}%` }}
                  />
                </div>

                <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>{loadingSteps[loadingStep - 1] || 'Finalizing Analysis...'}</span>
                </div>
              </div>
            ) : !feedback ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim()}
                className="relative w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/35 hover:shadow-[0_0_35px_rgba(59,130,246,0.5)] transition-all duration-300 ease-out hover:scale-[1.01] active:scale-98 cursor-pointer disabled:opacity-50 overflow-hidden group border border-blue-400/30"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shine-continuous pointer-events-none" />
                <Send className="w-5 h-5 text-white relative z-10" />
                <span className="relative z-10 font-extrabold">Submit Answer for AI Evaluation</span>
              </button>
            ) : (
              <button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim()}
                className="relative w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/35 hover:shadow-[0_0_35px_rgba(99,102,241,0.5)] transition-all duration-300 ease-out hover:scale-[1.01] active:scale-98 cursor-pointer disabled:opacity-50 overflow-hidden group border border-indigo-400/30"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shine-continuous pointer-events-none" />
                <RefreshCw className="w-5 h-5 text-white relative z-10" />
                <span className="relative z-10 font-extrabold">Resubmit Answer</span>
              </button>
            )}
          </div>

          {/* 4. AI FEEDBACK SYSTEM (4 STRUCTURED SECTIONS & ACCORDIONS) */}
          {feedback && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* ACCORDION 1: SECTION 1 - ANSWER EVALUATION */}
              <div className="glass-card rounded-2xl border border-slate-700/80 bg-slate-900/80 backdrop-blur-xl overflow-hidden shadow-xl">
                <button
                  onClick={() => toggleAccordion('evaluation')}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">Section 1: Answer Evaluation</h3>
                      <p className="text-xs text-slate-400">Accuracy classification and diagnostic status explanation</p>
                    </div>
                  </div>
                  {openAccordions.evaluation ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {openAccordions.evaluation && (
                  <div className="p-5 pt-0 border-t border-slate-800/80 space-y-4 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Status:</span>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 shadow-md ${
                        feedback.status === 'Correct'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : feedback.status === 'Partially Correct'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40'
                      }`}>
                        {feedback.status === 'Correct' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {feedback.status === 'Partially Correct' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                        {(feedback.status === 'Incorrect' || feedback.status === 'Unrelated Answer') && <XCircle className="w-4 h-4 text-red-400" />}
                        <span>{feedback.status}</span>
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-sm font-medium text-slate-200 leading-relaxed">
                      "{feedback.statusExplanation}"
                    </div>
                  </div>
                )}
              </div>

              {/* ACCORDION 2: SECTION 2 - MISTAKES FOUND */}
              <div className="glass-card rounded-2xl border border-slate-700/80 bg-slate-900/80 backdrop-blur-xl overflow-hidden shadow-xl">
                <button
                  onClick={() => toggleAccordion('mistakes')}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                      <AlertTriangle className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">Section 2: Mistakes Found</h3>
                      <p className="text-xs text-slate-400">Itemized list of errors, missing concepts, and grammar issues</p>
                    </div>
                  </div>
                  {openAccordions.mistakes ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {openAccordions.mistakes && (
                  <div className="p-5 pt-0 border-t border-slate-800/80 space-y-3 animate-in fade-in">
                    {feedback.mistakes && feedback.mistakes.length > 0 ? (
                      <ul className="space-y-2.5">
                        {feedback.mistakes.map((m, i) => (
                          <li key={i} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <div>
                              <strong className="text-white block font-extrabold">{m.type}</strong>
                              <span className="text-slate-300 font-medium leading-relaxed">{m.explanation}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>No major mistakes found! Excellent response structure.</span>
                      </div>
                    )}

                    {/* Requirement 16: FULLY DYNAMIC DETAILED GRAMMAR ANALYSIS (5 CASES) */}
                    {feedback.grammarReport && (
                      <div className="space-y-4 pt-3 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider block flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-purple-400" />
                            Detailed Grammar Analysis (Dynamic Report)
                          </span>
                        </div>

                        {/* CASE 1: GIBBERISH / MEANINGLESS TEXT */}
                        {feedback.grammarReport.grammarCase === 'GIBBERISH' && (
                          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-2 text-xs text-red-200">
                            <div className="font-extrabold text-sm text-red-400 flex items-center gap-2">
                              <span>{feedback.grammarReport.statusHeader}</span>
                            </div>
                            <p className="text-slate-300 font-medium">
                              <strong>Reason: </strong> {feedback.grammarReport.gibberishReason}
                            </p>
                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-blue-300 font-semibold mt-2">
                              💡 {feedback.grammarReport.gibberishSuggestion}
                            </div>
                          </div>
                        )}

                        {/* CASE 3: PERFECT GRAMMAR */}
                        {feedback.grammarReport.grammarCase === 'PERFECT_GRAMMAR' && (
                          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 text-xs text-emerald-200">
                            <div className="font-extrabold text-sm text-emerald-400 flex items-center gap-2">
                              <span>{feedback.grammarReport.statusHeader}</span>
                            </div>
                            <p className="text-emerald-300 font-medium leading-relaxed">
                              {feedback.grammarReport.statusSubtext}
                            </p>
                          </div>
                        )}

                        {/* CASE 4: GRAMMAR OK, CONTENT UNRELATED */}
                        {feedback.grammarReport.grammarCase === 'GRAMMAR_OK_CONTENT_UNRELATED' && (
                          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                            <div className="flex flex-wrap items-center gap-2 font-bold text-xs">
                              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Grammar Status: ✅ Grammar is Correct
                              </span>
                              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                                Content Status: ❌ Answer is Unrelated
                              </span>
                            </div>
                            <p className="text-slate-300 font-medium leading-relaxed">
                              {feedback.grammarReport.statusSubtext}
                            </p>
                          </div>
                        )}

                        {/* CASE 2 & CASE 5: GRAMMAR MISTAKES FOUND */}
                        {(feedback.grammarReport.grammarCase === 'HAS_ERRORS' || feedback.grammarReport.grammarCase === 'GRAMMAR_ERRORS_AND_CONTENT_UNRELATED') && (
                          <div className="space-y-4">
                            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 flex items-center justify-between text-xs">
                              <span className="font-extrabold text-red-400 flex items-center gap-2">
                                <span>{feedback.grammarReport.statusHeader}</span>
                              </span>
                              {feedback.grammarReport.contentStatusMessage && (
                                <span className="text-red-300 font-medium">
                                  {feedback.grammarReport.contentStatusMessage}
                                </span>
                              )}
                            </div>

                            {feedback.grammarReport.mistakes.map((m, idx) => (
                              <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs shadow-md">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Your Sentence:</span>
                                  <p className="text-slate-200 font-serif italic bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                                    "{m.yourSentence}"
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">
                                    <span className="text-[10px] uppercase font-extrabold text-red-400 block mb-0.5">Incorrect:</span>
                                    <span className="font-mono font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded">{m.incorrectPart}</span>
                                  </div>

                                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                                    <span className="text-[10px] uppercase font-extrabold text-emerald-400 block mb-0.5">Correct:</span>
                                    <span className="font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">{m.correctVersion}</span>
                                  </div>
                                </div>

                                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 text-blue-200 space-y-1">
                                  <strong className="text-blue-400 block uppercase font-bold text-[10px] tracking-wider">Reason:</strong>
                                  <p className="leading-relaxed">{m.reason}</p>
                                </div>

                                <div className="p-3 rounded-xl bg-[#1E1B4B]/60 border border-indigo-900/60 text-indigo-200 space-y-1">
                                  <strong className="text-indigo-400 block uppercase font-bold text-[10px] tracking-wider">Tanglish Explanation:</strong>
                                  <p className="leading-relaxed">{m.tanglishReason}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ACCORDION: CAMERA & BODY LANGUAGE ANALYSIS (Requirements 3, 4, 5, 6, 7, 9) */}
              {feedback.cameraAnalysis && (
                <div className="glass-card rounded-2xl border border-slate-700/80 bg-slate-900/80 backdrop-blur-xl overflow-hidden shadow-xl">
                  <button
                    onClick={() => toggleAccordion('camera')}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                        <Video className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-white">Camera & Body Language Analysis</h3>
                        <p className="text-xs text-slate-400">Dynamic visual presence, gaze, and posture evaluation</p>
                      </div>
                    </div>
                    {openAccordions.camera ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>

                  {openAccordions.camera && (
                    <div className="p-5 pt-0 border-t border-slate-800/80 space-y-4 animate-in fade-in">
                      {!feedback.cameraAnalysis.isCameraOn || feedback.cameraAnalysis.notice ? (
                        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-2.5">
                          <VideoOff className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{feedback.cameraAnalysis.notice || 'Camera analysis was not performed because the camera was off.'}</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {feedback.cameraAnalysis.eyeContact && (
                            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-white flex items-center gap-1.5">
                                  <Eye className="w-4 h-4 text-blue-400" />
                                  <span>Eye Contact</span>
                                </span>
                                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                  {feedback.cameraAnalysis.eyeContact.rating}
                                </span>
                              </div>
                              <p className="text-slate-300 font-medium leading-relaxed">
                                {feedback.cameraAnalysis.eyeContact.evidence}
                              </p>
                              {feedback.cameraAnalysis.eyeContact.suggestion && (
                                <p className="text-blue-300 font-semibold bg-blue-950/40 p-2.5 rounded-lg border border-blue-900/50">
                                  💡 {feedback.cameraAnalysis.eyeContact.suggestion}
                                </p>
                              )}
                            </div>
                          )}

                          {feedback.cameraAnalysis.facialExpression && (
                            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-white flex items-center gap-1.5">
                                  <Smile className="w-4 h-4 text-purple-400" />
                                  <span>Facial Expression</span>
                                </span>
                                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                  {feedback.cameraAnalysis.facialExpression.rating}
                                </span>
                              </div>
                              <p className="text-slate-300 font-medium leading-relaxed">
                                {feedback.cameraAnalysis.facialExpression.evidence}
                              </p>
                              {feedback.cameraAnalysis.facialExpression.suggestion && (
                                <p className="text-blue-300 font-semibold bg-blue-950/40 p-2.5 rounded-lg border border-blue-900/50">
                                  💡 {feedback.cameraAnalysis.facialExpression.suggestion}
                                </p>
                              )}
                            </div>
                          )}

                          {feedback.cameraAnalysis.posture && (
                            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-white flex items-center gap-1.5">
                                  <UserCheck className="w-4 h-4 text-cyan-400" />
                                  <span>Posture & Body Language</span>
                                </span>
                                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                  {feedback.cameraAnalysis.posture.rating}
                                </span>
                              </div>
                              <p className="text-slate-300 font-medium leading-relaxed">
                                {feedback.cameraAnalysis.posture.evidence}
                              </p>
                              {feedback.cameraAnalysis.posture.suggestion && (
                                <p className="text-blue-300 font-semibold bg-blue-950/40 p-2.5 rounded-lg border border-blue-900/50">
                                  💡 {feedback.cameraAnalysis.posture.suggestion}
                                </p>
                              )}
                            </div>
                          )}

                          {feedback.cameraAnalysis.overallVisualPresence && (
                            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-white flex items-center gap-1.5">
                                  <Award className="w-4 h-4 text-amber-400" />
                                  <span>Overall Visual Presence</span>
                                </span>
                                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                  {feedback.cameraAnalysis.overallVisualPresence.rating}
                                </span>
                              </div>
                              <p className="text-slate-300 font-medium leading-relaxed">
                                {feedback.cameraAnalysis.overallVisualPresence.evidence}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ACCORDION 3: SECTION 3 - CORRECT PROFESSIONAL ANSWER (WITH TOGGLE BUTTON) */}
              <div className="glass-card rounded-2xl border border-slate-700/80 bg-slate-900/80 backdrop-blur-xl overflow-hidden shadow-xl">
                <button
                  onClick={() => toggleAccordion('correctAnswer')}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      <GraduationCap className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">Section 3: Correct Professional Answer</h3>
                      <p className="text-xs text-slate-400">Ideal interview-ready response model matching this question</p>
                    </div>
                  </div>
                  {openAccordions.correctAnswer ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {openAccordions.correctAnswer && (
                  <div className="p-5 pt-0 border-t border-slate-800/80 space-y-3 animate-in fade-in">
                    {/* View Model Answer Toggle Button */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Model Response Preview:</span>
                      <button
                        onClick={() => setShowModelAnswer((prev) => !prev)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{showModelAnswer ? 'Hide Model Answer' : 'View Model Answer'}</span>
                      </button>
                    </div>

                    {showModelAnswer && (
                      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-white space-y-2 shadow-xl animate-in fade-in">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-400" /> Correct Professional Answer
                        </span>
                        <p className="text-sm font-serif italic text-slate-200 leading-relaxed">
                          "{feedback.correctProfessionalAnswer || feedback.improvedAnswer}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ACCORDION 4: SECTION 4 - EXPLANATION */}
              <div className="glass-card rounded-2xl border border-slate-700/80 bg-slate-900/80 backdrop-blur-xl overflow-hidden shadow-xl">
                <button
                  onClick={() => toggleAccordion('explanation')}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <Globe className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">Section 4: Explanation</h3>
                      <p className="text-xs text-slate-400">Why your answer was rated and key interview concepts</p>
                    </div>
                  </div>
                  {openAccordions.explanation ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {openAccordions.explanation && (
                  <div className="p-5 pt-0 border-t border-slate-800/80 space-y-3 animate-in fade-in">
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Globe className="w-4 h-4" />
                          {user.preferredLanguage === 'Tanglish' ? 'Tanglish Explanation' : 'English Explanation'}
                        </span>
                      </div>
                      <div className="text-sm font-medium leading-relaxed text-slate-200 whitespace-pre-line">
                        {feedback.explanationText}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ACCORDION 5: PERFORMANCE SCORECARD WITH EMERALD GREEN PROGRESS BARS */}
              <div className="glass-card rounded-2xl border border-slate-700/80 bg-slate-900/80 backdrop-blur-xl overflow-hidden shadow-xl">
                <button
                  onClick={() => toggleAccordion('scorecard')}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Award className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">Performance Scorecard</h3>
                      <p className="text-xs text-slate-400">Deterministic metric rating breakdown (no random scores)</p>
                    </div>
                  </div>
                  {openAccordions.scorecard ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {openAccordions.scorecard && (
                  <div className="p-5 pt-0 border-t border-slate-800/80 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-emerald-500/30">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Overall Question Score</span>
                      <span className="text-2xl font-black text-[#22C55E]">
                        {feedback.overallScore} / 100
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Relevance to Question</span>
                          <span className="text-[#22C55E] font-bold">{feedback.relevanceScore} / 100</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#22C55E] h-full rounded-full transition-all duration-500" style={{ width: `${feedback.relevanceScore}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Technical Accuracy</span>
                          <span className="text-[#22C55E] font-bold">{feedback.technicalAccuracyScore} / 100</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#22C55E] h-full rounded-full transition-all duration-500" style={{ width: `${feedback.technicalAccuracyScore}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Communication & Tone</span>
                          <span className="text-[#22C55E] font-bold">{feedback.communicationScore} / 100</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#22C55E] h-full rounded-full transition-all duration-500" style={{ width: `${feedback.communicationScore}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Grammar & Vocabulary</span>
                          <span className="text-[#22C55E] font-bold">{feedback.grammarScore} / 100</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#22C55E] h-full rounded-full transition-all duration-500" style={{ width: `${feedback.grammarScore}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Completeness</span>
                          <span className="text-[#22C55E] font-bold">{feedback.completenessScore} / 100</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#22C55E] h-full rounded-full transition-all duration-500" style={{ width: `${feedback.completenessScore}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Professional Readiness</span>
                          <span className="text-[#22C55E] font-bold">{feedback.professionalismScore} / 100</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#22C55E] h-full rounded-full transition-all duration-500" style={{ width: `${feedback.professionalismScore}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Why this score? Dynamic Explanation (Requirement #3) */}
                    {feedback.scoreExplanation && (
                      <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5 mt-4 animate-in fade-in">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-blue-400" />
                          <span>Why this score?</span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium leading-relaxed">
                          {feedback.scoreExplanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Proceed Button with Blue Theme & Glossy Bi-Directional Shine Animation (Requirement #4) */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleNextQuestion}
                  className="relative overflow-hidden group px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-98"
                >
                  {/* Glossy light shine moving smoothly Left -> Right on hover, Right -> Left on leave */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
                  <span className="relative z-10 font-extrabold text-white">Proceed to Next Question</span>
                  <ArrowRight className="w-4 h-4 relative z-10 text-white group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. EXIT INTERVIEW POPUP MODAL (REQUIREMENT 10) */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="glass-card rounded-[28px] p-7 sm:p-8 max-w-md w-full border border-amber-500/40 bg-slate-900/95 shadow-[0_0_40px_rgba(245,158,11,0.2)] space-y-5 text-center relative overflow-hidden">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <LogOut className="w-8 h-8 text-amber-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white font-['Space_Grotesk']">Ongoing Interview Active</h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                You have an ongoing interview. Are you sure you want to exit?
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="relative w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-blue-600/30 transition-all cursor-pointer hover:scale-[1.01] overflow-hidden group"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine-continuous pointer-events-none" />
                <span className="relative z-10">Continue Interview</span>
              </button>

              <button
                onClick={handleExitDiscard}
                className="relative w-full py-3.5 rounded-2xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-extrabold text-xs sm:text-sm transition-all cursor-pointer hover:scale-[1.01]"
              >
                <span>Exit Interview</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
