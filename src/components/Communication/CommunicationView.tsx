import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  ArrowRight,
  ArrowLeft,
  Mic,
  MicOff,
  TrendingUp,
  Award,
  BookOpen,
  LogOut,
  Bot,
  X,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { evaluateAnswerWithAI } from '../../services/aiEngine';
import { SupabaseService } from '../../services/supabaseClient';
import { DualLanguageFeedback } from '../../types';


export type SelectedLanguage = 'English' | 'Tanglish';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type ViewState = 'input' | 'result';

// Non-repeating Question Bank per Difficulty Level
const QUESTION_BANK_BY_DIFFICULTY: Record<DifficultyLevel, string[]> = {
  Easy: [
    "What is your name and tell me about your background?",
    "Where are you from and what college do you attend?",
    "What are your favorite hobbies and interests outside of studies?",
    "What core technical and personal skills are you most confident in?",
    "What programming language do you enjoy using the most and why?"
  ],
  Medium: [
    "What are your short-term and long-term career goals?",
    "Tell me about a key college project you built and your role in it.",
    "What are your primary technical and personal strengths?",
    "Why are you interested in pursuing a career in software development?",
    "How do you prepare for campus placement coding interviews?"
  ],
  Hard: [
    "Describe a difficult technical problem you solved and how you approached it.",
    "How would you handle a disagreement with a teammate during a group project?",
    "How would you explain a complex technical project to a non-technical manager?",
    "Describe a time when you faced an unexpected failure and how you overcame it.",
    "How do you manage tight deadlines when multiple academic deliverables overlap?"
  ]
};

// Question-Specific & Difficulty-Aware Best Answer Generator
function generateQuestionSpecificBestAnswer(
  question: string,
  userAnswer: string,
  difficulty: DifficultyLevel
): string {
  const qLower = question.toLowerCase();
  const ansTrim = userAnswer.trim();

  // Helper name extractor
  const nameMatch = ansTrim.match(/(?:myself|name is|i am|i'm)\s+([A-Za-z]+)/i);
  const detectedName = nameMatch ? nameMatch[1] : 'Karthika';

  // PRIORITY 1: Project & Practical Development Questions (Checked BEFORE generic 'college' or 'background')
  if (qLower.includes('project') || qLower.includes('built') || qLower.includes('system') || qLower.includes('application')) {
    return `For my main college project, I developed a web-based automated assessment platform using React and Node.js. My primary role was building responsive UI components, integrating RESTful APIs, and implementing database queries.`;
  }

  // PRIORITY 2: Why Hire You / Unique Value
  if (qLower.includes('hire') || qLower.includes('why should we') || qLower.includes('choose you')) {
    return `You should hire me because I combine strong core technical skills in Java and Web Development with a disciplined problem-solving mindset. I am eager to learn, adapt quickly to your team's tech stack, and deliver reliable code from day one.`;
  }

  // PRIORITY 3: Difficult Technical Problem / Challenge Faced
  if (qLower.includes('difficult problem') || qLower.includes('challenge') || qLower.includes('solved') || qLower.includes('approached')) {
    return `When encountering slow database query execution during testing, I analyzed query execution plans, identified unindexed foreign keys, added targeted indexes, and implemented Redis caching, reducing response latency by 50%.`;
  }

  // PRIORITY 4: Technical & Personal Strengths
  if (qLower.includes('strengths') || qLower.includes('strength') || qLower.includes('confident')) {
    return `My primary technical strength is algorithmic problem solving and writing clean, maintainable code. My primary personal strength is perseverance when debugging complex technical issues under pressure.`;
  }

  // PRIORITY 5: Programming Language Preference
  if (qLower.includes('programming language') || qLower.includes('favorite language') || qLower.includes('enjoy')) {
    return `I enjoy programming in Java the most due to its object-oriented architecture, platform independence, robust memory management, and rich library ecosystem for building enterprise applications.`;
  }

  // PRIORITY 6: Career Goals
  if (qLower.includes('career goals') || qLower.includes('short-term') || qLower.includes('long-term') || qLower.includes('future')) {
    return `My short-term goal is to secure a Software Engineer role in a progressive technology company where I can refine my coding skills. Long-term, I aim to grow into a Technical Lead designing scalable distributed systems.`;
  }

  // PRIORITY 7: Team Disagreement / Conflict
  if (qLower.includes('disagreement') || qLower.includes('teammate') || qLower.includes('conflict')) {
    return `If a technical disagreement arises during a project, I listen actively to my teammate's perspective, compare both approaches objectively using performance benchmarks or quick prototypes, and make a data-driven consensus decision.`;
  }

  // PRIORITY 8: Explaining to Non-Technical Manager
  if (qLower.includes('non-technical') || qLower.includes('manager') || qLower.includes('explain')) {
    return `When communicating with non-technical managers, I avoid low-level technical jargon, use everyday real-world analogies to explain architectural workflow, and focus primarily on project outcomes and user value.`;
  }

  // PRIORITY 9: Unexpected Failure Recovery
  if (qLower.includes('failure') || qLower.includes('unexpected') || qLower.includes('overcame')) {
    return `When a deployment bug broke API integration during project testing, I took immediate responsibility, rolled back to a stable build, resolved the root cause through step-by-step debugging, and added automated unit tests to prevent recurrence.`;
  }

  // PRIORITY 10: Managing Tight Deadlines
  if (qLower.includes('deadlines') || qLower.includes('overlap') || qLower.includes('deliverables')) {
    return `When academic deadlines overlap, I prioritize tasks based on project impact and urgency, break large deliverables into manageable daily milestones, and maintain transparent status updates to stay on schedule.`;
  }

  // PRIORITY 11: Hobbies
  if (qLower.includes('hobbies') || qLower.includes('interests') || qLower.includes('free time')) {
    return `Outside of my academic studies, I enjoy building personal web projects, reading tech publications, and playing competitive badminton, which keeps me active and refreshed.`;
  }

  // PRIORITY 12: Location / Specific College Attendance (Checked AFTER 'project' to avoid collisions)
  if (qLower.includes('from') || qLower.includes('where do you live') || qLower.includes('college location')) {
    return `I am from Chennai, Tamil Nadu, and I am currently pursuing my B.E. in Computer Science and Engineering at Anna University, where I focus on software engineering and data structures.`;
  }

  // PRIORITY 13: Self Intro / Background (Checked LAST to prevent capturing other questions)
  if (qLower.includes('tell me about yourself') || qLower.includes('introduce yourself') || qLower.includes('your background') || qLower.includes('name')) {
    return `Hello! My name is ${detectedName}. I am currently a final-year Computer Science student with a strong interest in software development, web applications, and algorithmic problem solving.`;
  }

  // Fallback (Question-Driven)
  return `My response for "${question}" is to state my core perspective directly: ${ansTrim ? `Building upon my point ("${ansTrim.substring(0, 45)}..."), ` : ''}I structure my answer with a clear technical overview, 1-2 supporting practical details, and a confident summary statement.`;
}

export const CommunicationView: React.FC = () => {
  const { user, recordUserActivity, setActiveTab, registerSessionGuard, unregisterSessionGuard } = useApp();

  // Settings & View State
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [feedbackLanguage, setFeedbackLanguage] = useState<SelectedLanguage>('English');
  const [viewState, setViewState] = useState<ViewState>('input');

  // Question & Session History
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [askedQuestions, setAskedQuestions] = useState<Record<DifficultyLevel, string[]>>({
    Easy: [],
    Medium: [],
    Hard: []
  });

  // User Answer & Voice Recognition
  const [inputSentence, setInputSentence] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechRecognition, setSpeechRecognition] = useState<any | null>(null);
  const [hasVoiceSupport, setHasVoiceSupport] = useState<boolean>(true);
  const [voiceNotice, setVoiceNotice] = useState<string>('');

  // Validation Popup State
  const [showValidationPopup, setShowValidationPopup] = useState<boolean>(false);

  // Evaluated Question & Answer Context Isolation State
  const [evaluatedQuestion, setEvaluatedQuestion] = useState<string>('');
  const [evaluatedAnswer, setEvaluatedAnswer] = useState<string>('');

  // Analysis State & Result Feedback
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const [feedback, setFeedback] = useState<DualLanguageFeedback | null>(null);
  const [animatedScore, setAnimatedScore] = useState<number>(0);

  // Score comparison tracking for "Try Again"
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [newScore, setNewScore] = useState<number | null>(null);
  const [hasAttemptedAgain, setHasAttemptedAgain] = useState<boolean>(false);

  // Modal session refs
  const [showCommModal, setShowCommModal] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const resultContainerRef = useRef<HTMLDivElement | null>(null);

  // Active question
  const currentQuestionList = QUESTION_BANK_BY_DIFFICULTY[difficulty];
  const currentQuestion = currentQuestionList[currentQuestionIndex % currentQuestionList.length];

  // Cumulative transcript tracking refs (zero truncation / zero duplication)
  const accumulatedTranscriptRef = useRef<string>('');
  const currentInterimRef = useRef<string>('');
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);

  // Animate score ring from 0 to target score on result load
  useEffect(() => {
    if (viewState === 'result' && feedback) {
      setAnimatedScore(0);
      const timer = setTimeout(() => {
        setAnimatedScore(feedback.confidenceScore);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [viewState, feedback]);

  // Web Speech API Support Detection on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setHasVoiceSupport(!!SpeechRecognition);
    }
  }, []);

  const toggleRecording = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setHasVoiceSupport(false);
      setVoiceNotice('Web Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    // IF ALREADY RECORDING -> STOP
    if (isRecording || isListeningRef.current) {
      isListeningRef.current = false;
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (e) {}
      }
      setVoiceNotice('Recording stopped. Review your spoken response below before analyzing.');
      return;
    }

    // IF NOT RECORDING -> START FRESH SESSION DIRECTLY
    try {
      // Clear transcript refs for a fresh speaking session
      accumulatedTranscriptRef.current = '';
      currentInterimRef.current = '';
      setInputSentence('');

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      
      // Respect selected language preference (English vs Tanglish/Indian English)
      const selectedLangCode = (feedbackLanguage === 'Tanglish' || user?.preferredLanguage === 'Tanglish') ? 'en-IN' : 'en-US';
      recognition.lang = selectedLangCode;

      isListeningRef.current = true;
      setIsRecording(true);
      setVoiceNotice('Listening... Speak naturally in English. Words will appear live below.');

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            finalChunk += text + ' ';
          } else {
            interimChunk += text;
          }
        }

        if (finalChunk) {
          accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + ' ' + finalChunk)
            .replace(/\s+/g, ' ')
            .trim();
        }
        currentInterimRef.current = interimChunk;

        const combinedText = [accumulatedTranscriptRef.current, interimChunk]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (combinedText) {
          setInputSentence(combinedText);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
          isListeningRef.current = false;
          setIsRecording(false);
          setVoiceNotice('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (err.error !== 'no-speech') {
          setVoiceNotice(`Speech recognition notice: ${err.error || 'Connection interrupted'}. Click 'Start Speaking' to try again.`);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            setTimeout(() => {
              if (isListeningRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (err) {}
              }
            }, 200);
          }
        } else {
          setIsRecording(false);
        }
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition start failed:', e);
      setIsRecording(false);
      isListeningRef.current = false;
      setVoiceNotice('Could not start speech recognition. Please check your microphone and browser settings.');
    }
  };

  const handleDirectExitCommunication = useCallback(() => {
    if (isRecording || isListeningRef.current) {
      isListeningRef.current = false;
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (e) {}
      }
    }
    setInputSentence('');
    setFeedback(null);
    setViewState('input');
    setHasAttemptedAgain(false);
    setPreviousScore(null);
    setNewScore(null);
  }, [isRecording]);

  useEffect(() => {
    const isSessionActive = inputSentence.trim().length > 0 || isRecording || isAnalyzing;
    registerSessionGuard({
      moduleTab: 'communication',
      isSessionActive,
      clearSessionCallback: handleDirectExitCommunication
    });
    return () => {
      unregisterSessionGuard('communication');
    };
  }, [inputSentence, isRecording, isAnalyzing, registerSessionGuard, unregisterSessionGuard, handleDirectExitCommunication]);

  // Switch difficulty & load non-repeating question
  const handleSelectDifficulty = (newDiff: DifficultyLevel) => {
    setDifficulty(newDiff);
    setFeedback(null);
    setInputSentence('');
    setEvaluatedQuestion('');
    setEvaluatedAnswer('');
    setViewState('input');
    setHasAttemptedAgain(false);
    
    const questions = QUESTION_BANK_BY_DIFFICULTY[newDiff];
    const asked = askedQuestions[newDiff];
    const unaskedIndex = questions.findIndex((q) => !asked.includes(q));

    if (unaskedIndex !== -1) {
      setCurrentQuestionIndex(unaskedIndex);
    } else {
      setCurrentQuestionIndex(Math.floor(Math.random() * questions.length));
    }
  };

  // Submit & analyze actual user answer
  const handleAnalyzeCommunication = async () => {
    const textToEvaluate = inputSentence.trim();
    const questionToEvaluate = currentQuestion;

    // Validation: Empty answer check
    if (!textToEvaluate) {
      setShowValidationPopup(true);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      return;
    }

    if (isAnalyzing) return;

    if (isRecording || isListeningRef.current) {
      isListeningRef.current = false;
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (e) {}
      }
    }

    setIsAnalyzing(true);
    setEvaluatedQuestion(questionToEvaluate);
    setEvaluatedAnswer(textToEvaluate);

    try {
      const res = await evaluateAnswerWithAI(questionToEvaluate, textToEvaluate, 'HR', difficulty, feedbackLanguage, undefined, user);

      if (feedback && feedback.confidenceScore !== undefined) {
        setPreviousScore(feedback.confidenceScore);
        setNewScore(res.confidenceScore);
        setHasAttemptedAgain(true);
      } else {
        setPreviousScore(null);
        setNewScore(null);
        setHasAttemptedAgain(false);
      }

      setFeedback(res);
      setViewState('result');

      if (user?.id) {
        SupabaseService.saveCommunicationProgress(user.id, {
          topic: questionToEvaluate,
          difficulty: difficulty,
          score: res.confidenceScore,
          feedback: res
        });
      }

      recordUserActivity('communication', `AI Communication Practice (${difficulty})`, res.confidenceScore, 'Communication');

      // Immediate viewport alignment to top of result
      setTimeout(() => {
        if (resultContainerRef.current) {
          resultContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);

    } catch (err) {
      console.error('Error analyzing communication:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Action: ← Try Again
  const handleTryAgain = () => {
    setInputSentence('');
    setViewState('input');
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      window.scrollTo({ top: 150, behavior: 'smooth' });
    }, 100);
  };

  // Action: Next Question →
  const handleNextQuestion = () => {
    setAskedQuestions((prev) => ({
      ...prev,
      [difficulty]: [...prev[difficulty], currentQuestion]
    }));

    setFeedback(null);
    setInputSentence('');
    setEvaluatedQuestion('');
    setEvaluatedAnswer('');
    setViewState('input');
    setHasAttemptedAgain(false);
    setCurrentQuestionIndex((prev) => (prev + 1) % currentQuestionList.length);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Question-Specific Answering Concept / Rule Generator (Dual Language: English & Tanglish)
  function getQuestionSpecificRule(
    questionText: string,
    difficulty: DifficultyLevel,
    isTanglish: boolean,
    isGreetingOrIncomplete?: boolean
  ): string {
    const qLower = questionText.toLowerCase();

    // If a greeting, short, or incomplete answer was provided, explain specifically what is missing for THIS question
    if (isGreetingOrIncomplete) {
      if (qLower.includes('project')) {
        return isTanglish
          ? "Indha question ungaloda college project, tech stack, and unga individual role patthi explain panna solluvadhu. Unga answer incomplete ah irukura nala, project details edhum cover aagala. Core project details oda explain pannanum."
          : "This question asks you to describe one important college project and clearly explain your role in that project. A short or greeting response does not address your responsibilities, tech stack, or contribution. Structure a complete response detailing your project.";
      }
      if (qLower.includes('career goals') || qLower.includes('short-term') || qLower.includes('long-term')) {
        return isTanglish
          ? "Indha question ungaloda short-term and long-term career goals patthi ask pannugiradhu. Incomplete answer la career ambitions cover aagala. 2-part structure la short-term and long-term goals ah explain panga."
          : "This question asks you to outline your short-term and long-term career goals. A brief response does not explain your professional roadmap. Divide your answer into short-term skill goals and long-term leadership goals.";
      }
      if (qLower.includes('name') || qLower.includes('background')) {
        return isTanglish
          ? "Indha question unga name, academic background and placement goals patthi ask pannugiradhu. Crisp self-introduction structure oda name, degree and core skills ah mention panga."
          : "This question asks for a professional self-introduction. State your name, degree, 1-2 core technical focus areas, and conclude with your career aspiration.";
      }
      if (qLower.includes('hobbies') || qLower.includes('interests')) {
        return isTanglish
          ? "Indha question unga hobbies and personal interests patthi ask pannugiradhu. 1-2 genuine activities ah solli, adhu eppadi unga engineering mindset-ah sharp ah vechikudhu nu explain panga."
          : "This question asks about your hobbies outside of academics. Mention 1-2 genuine interests and explain how they foster continuous learning or problem-solving skills.";
      }
      if (qLower.includes('skills') || qLower.includes('confident') || qLower.includes('strengths')) {
        return isTanglish
          ? "Indha question unga core technical skills and strengths patthi ask pannugiradhu. Verum single word illama, main skill and adha project la use pannina proof oda explain panga."
          : "This question asks about your core technical skills and personal strengths. Name your key skill and back it up with a practical coding or project example.";
      }
      if (qLower.includes('programming language') || qLower.includes('enjoy')) {
        return isTanglish
          ? "Indha question unga favorite programming language and adha yen choose panninga nu ask pannugiradhu. Language name sollitu 2 key technical features ah explain panga."
          : "This question asks about your preferred programming language and your reasoning. State the language clearly and list 2 key technical reasons (e.g. OOP, memory management).";
      }
      if (qLower.includes('difficult problem') || qLower.includes('solved') || qLower.includes('approached')) {
        return isTanglish
          ? "Indha question solved pannina difficult technical problem patthi ask pannugiradhu. STAR method (Situation, Task, Action, Result) follow panni 60% focus debugging actions-ku tharungga."
          : "This question expects a practical problem-solving story. Use the STAR method (Situation, Task, Action, Result) and focus on your specific debugging actions and metric results.";
      }
      if (qLower.includes('disagreement') || qLower.includes('teammate') || qLower.includes('conflict')) {
        return isTanglish
          ? "Indha question team disagreement-ah handle panna solluvadhu. Objective data-driven approach, active listening, and benchmark testing-ah explain panga."
          : "This question evaluates your conflict resolution skills. Explain how you listen actively, compare approaches using data or prototypes, and reach a consensus.";
      }
      if (qLower.includes('non-technical') || qLower.includes('manager') || qLower.includes('explain')) {
        return isTanglish
          ? "Indha question non-technical manager-ku complex tech project explain panna solluvadhu. Jargon avoid panni, real-world analogy and business value ah emphasize panga."
          : "This question assesses your communication simplification skills. Explain how you eliminate jargon, use real-life analogies, and focus on user/business impact.";
      }
      if (qLower.includes('failure') || qLower.includes('unexpected') || qLower.includes('overcame')) {
        return isTanglish
          ? "Indha question failure handle panra maturity-ah test pannugiradhu. Ownership edukurdhu, corrective action, and preventive measures ah explain panga."
          : "This question asks about overcoming unexpected failure. Demonstrate accountability, explain your fix, and share preventive testing added.";
      }
      if (qLower.includes('deadlines') || qLower.includes('overlap') || qLower.includes('manage')) {
        return isTanglish
          ? "Indha question overlapping deadlines prioritization-ah ask pannugiradhu. Eisenhower matrix, daily milestones, and transparent status updates-ah explain panga."
          : "This question evaluates time management under pressure. Explain how you prioritize by urgency/impact, break work into daily milestones, and communicate proactively.";
      }
    }

    // 1. Background / Self-Introduction Questions
    if (qLower.includes('name') || qLower.includes('background') || qLower.includes('from') || qLower.includes('college')) {
      return isTanglish
        ? "Self-introduction question-ku start pannum podhu, unga name marium degree sollitu, 1-2 technical skills ah emphasize panni placement goal oda crisp ah finish pannanum. 'Myself [Name]' nu start panradha avoid panga."
        : "When answering self-introduction questions, state your name and degree, highlight 1-2 core technical focus areas, and conclude with your placement career goal. Avoid starting sentences with 'Myself'.";
    }

    // 2. Hobbies / Personal Interests
    if (qLower.includes('hobbies') || qLower.includes('interests')) {
      return isTanglish
        ? "Hobbies patthi kettaldhu, unga learning lead panra 1-2 genuine activities ah solli, adhu eppadi unga problem-solving mind-ah sharp ah vechikudhu nu connect panni sollungga."
        : "When asked about hobbies, state 1-2 genuine activities that demonstrate continuous learning, creativity, or teamwork, and connect how they keep your mind sharp for engineering challenges.";
    }

    // 3. Technical Skills & Strengths
    if (qLower.includes('skills') || qLower.includes('strengths') || qLower.includes('confident')) {
      return isTanglish
        ? "Skills patthi sollum podhu, paditha keywords ah verum list pannaama, unga main skill, adha vachi panina project illati LeetCode experience oda concrete proof ah sollungga."
        : "When discussing technical skills or strengths, don't just list buzzwords. State your primary skill, mention how long you've used it, and back it up with a real project or coding practice example.";
    }

    // 4. Programming Language Preference
    if (qLower.includes('programming language') || qLower.includes('enjoy')) {
      return isTanglish
        ? "Favorite programming language kettu answer pannum podhu, language name sollitu, 2 strong technical features (OOP, memory management) ah mention panni unga project usage-ah express pannanum."
        : "When choosing a favorite language, name the language clearly, state 2 key architectural reasons (e.g. OOP, memory management, rich ecosystem), and mention a practical project where you applied it.";
    }

    // 5. Career Goals
    if (qLower.includes('career goals') || qLower.includes('short-term') || qLower.includes('long-term')) {
      return isTanglish
        ? "Career goals question-ku 2 parts ah structure pannanum: 1) Short-term (software role la join panni coding master panradhu), 2) Long-term (tech lead/architect ah role elevate panradhu)."
        : "When explaining career goals, split your response into a clear 2-part structure: 1) Short-term goal (securing a software role to master tech skills) and 2) Long-term goal (advancing into technical leadership or architecture).";
    }

    // 6. College Project
    if (qLower.includes('project')) {
      return isTanglish
        ? "Project question-ku 3-step formula use pannanum: 1) Project oda main goal, 2) Tech stack (React, Node, Database), 3) Neengga personally enna contribution panninga and outcome enna nu sollungga."
        : "When describing a college project, use the 3-step formula: 1) High-level project objective, 2) Core tech stack used (React, Node, DB), and 3) Your specific individual contribution and outcome.";
    }

    // 7. Passion for Software Development
    if (qLower.includes('software development') || qLower.includes('interested')) {
      return isTanglish
        ? "Software engineering passion patthi kettaldhu, logical logic ah practical application ah mathuradhula irukira interest-ah solli, unga coding spark moment ah connect pannanum."
        : "When explaining why you chose software engineering, highlight your passion for building real-world solutions from abstract logic, and share a pivotal moment that sparked your interest.";
    }

    // 8. Placement Preparation Strategy
    if (qLower.includes('prepare') || qLower.includes('interviews')) {
      return isTanglish
        ? "Placement prep strategy-ku balanced plan sollungga: 1) Daily DSA problem solving, 2) Core CS topics (DBMS/OS/CN) revision, 3) Mock interview verbal practice."
        : "When asked about placement preparation, detail a balanced system: 1) Daily Data Structures practice, 2) Core CS fundamentals review (DBMS/OS/CN), and 3) Mock interview practice for verbal clarity.";
    }

    // 9. Difficult Technical Problem & Troubleshooting
    if (qLower.includes('difficult problem') || qLower.includes('solved') || qLower.includes('approached')) {
      return isTanglish
        ? "Technical problem-solving question-ku STAR method (Situation, Task, Action, Result) follow pannanum. Ungaloda specific debugging Action and measurable Result ku 60% importance tharungga."
        : "For problem-solving questions, follow the STAR method (Situation, Task, Action, Result). Focus 60% of your response on the specific debugging actions and metric-driven results achieved.";
    }

    // 10. Team Disagreement & Conflict Resolution
    if (qLower.includes('disagreement') || qLower.includes('teammate') || qLower.includes('conflict')) {
      return isTanglish
        ? "Team disagreement question-ku data-driven approach ah kaatungga. Respectful ah listen panni, prototypes illati benchmarks vachi objective ah consensus reached paningga nu sollungga."
        : "For team conflict questions, emphasize objective, data-driven resolution. Explain how you listened to their perspective, benchmarked solutions with data or prototypes, and reached team consensus.";
    }

    // 11. Explaining Tech Concepts to Non-Technical Managers
    if (qLower.includes('non-technical') || qLower.includes('manager') || qLower.includes('explain')) {
      return isTanglish
        ? "Non-technical managers ku explain panra rule: 1) Technical jargon avoid pannanum, 2) Everyday real-life analogy use pannanum, 3) Code details ku badhila business value emphasize pannanum."
        : "When explaining tech to non-technical stakeholders, use the Simplification Rule: 1) Eliminate jargon, 2) Use a relatable real-world analogy, and 3) Emphasize business value over code details.";
    }

    // 12. Unexpected Failure Recovery
    if (qLower.includes('failure') || qLower.includes('unexpected') || qLower.includes('overcame')) {
      return isTanglish
        ? "Failure handling question-ku 3 steps: 1) Blame pannama immediate ownership edukuranum, 2) Corrective action eduthu fix pannanum, 3) Future la warama iruka automated tests add paninan nu sollungga."
        : "For failure questions, apply the Accountability & Post-Mortem Rule: 1) Take immediate ownership without blaming others, 2) Describe the corrective action, and 3) State the preventive measures added.";
    }

    // 13. Managing Tight Deadlines
    if (qLower.includes('deadlines') || qLower.includes('overlap') || qLower.includes('manage')) {
      return isTanglish
        ? "Overlapping deadlines handle panna Prioritization Rule: 1) Task impact & urgency base panni prioritize pannanum, 2) Work ah daily milestones ah split panni status transparent ah communicate pannanum."
        : "For overlapping deadline questions, explain the Eisenhower Prioritization Rule: 1) Prioritize by impact vs urgency, 2) Break work into daily milestones, and 3) Maintain proactive communication.";
    }

    // Fallback Rule
    if (difficulty === 'Easy') {
      return isTanglish
        ? "Sollavandha thagavala 1-2 thaelivaana sentences la, clear tech vocabulary and confident pronunciation oda express panga."
        : "State your point directly in 1-2 clean sentences with clear technical vocabulary and confident pronunciation.";
    } else if (difficulty === 'Medium') {
      return isTanglish
        ? "Unga answer-a structure panga: 1) Direct response -> 2) Supporting technical example -> 3) Summary outcome statement."
        : "Structure your answer: 1) Direct response -> 2) Supporting technical example -> 3) Summary outcome statement.";
    } else {
      return isTanglish
        ? "Interview-ready aaga STAR method (Situation, Task, Action, Result) ah metric-driven proof oda execute panga."
        : "Use the STAR method (Situation, Task, Action, Result) with quantitative metrics to demonstrate senior-level readiness.";
    }
  }

  // Dynamic feedback details generator tailored to ACTUAL question + user answer + selected language
  const getDynamicFeedbackDetails = (
    questionText: string,
    answerText: string,
    feedbackObj: DualLanguageFeedback | null,
    feedbackLang: SelectedLanguage
  ) => {
    if (!feedbackObj) return { good: '', wrong: '', rule: '' };

    const rawInput = answerText.trim();
    const lowerInput = rawInput.toLowerCase();
    const words = rawInput.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const qLower = questionText.toLowerCase();
    const isTanglish = feedbackLang === 'Tanglish';

    // 1. Detect Greetings vs Gibberish vs Off-Topic
    const isGreeting =
      /^(hello|hi|hey|good\s*(morning|afternoon|evening)|greetings)\b/i.test(rawInput) && wordCount <= 3;

    const isGibberish =
      !isGreeting &&
      (wordCount < 1 ||
       (wordCount < 4 && !/[aeiouy]/i.test(rawInput)) ||
       /^([bcdfghjklmnpqrstvwxz]{3,}\s*)+$/i.test(rawInput) ||
       /^(.)\1{3,}/i.test(rawInput) ||
       /^(asdf|qwerty|zxcv|hff|ghj|jkl|test1234)/i.test(rawInput));

    // 2. Question Topic Keyword Analysis
    const questionKeywords = qLower
      .replace(/[^\w\s]/gi, '')
      .split(' ')
      .filter((w) => w.length > 3 && !['what', 'where', 'your', 'tell', 'about', 'would', 'have', 'from', 'with', 'does', 'like'].includes(w));

    const matchedKeywords = questionKeywords.filter((kw) => lowerInput.includes(kw));
    const keywordMatchRatio = questionKeywords.length > 0 ? matchedKeywords.length / questionKeywords.length : 0.5;

    // Check if off-topic words are present
    const isOffTopic =
      lowerInput.includes('cricket') ||
      lowerInput.includes('movie') ||
      lowerInput.includes('weather') ||
      lowerInput.includes('food') ||
      lowerInput.includes('ipl') ||
      lowerInput.includes('song');

    // Categorize Relevance Level
    let relevanceCategory: 'FULL' | 'PARTIAL' | 'IRRELEVANT' | 'GREETING' | 'GIBBERISH' = 'FULL';
    if (isGibberish) {
      relevanceCategory = 'GIBBERISH';
    } else if (isGreeting) {
      relevanceCategory = 'GREETING';
    } else if (isOffTopic || (wordCount > 3 && matchedKeywords.length === 0 && !qLower.includes('name') && !qLower.includes('background') && !qLower.includes('from'))) {
      relevanceCategory = 'IRRELEVANT';
    } else if (keywordMatchRatio < 0.4 && wordCount < 6) {
      relevanceCategory = 'PARTIAL';
    } else {
      relevanceCategory = 'FULL';
    }

    // Grammar Analysis
    const gScore = feedbackObj.grammarScore ?? 95;
    const hasMyselfError = lowerInput.includes('myself');
    const hasGrammarMistakes = gScore < 85 || hasMyselfError;

    let good = '';
    let wrong = '';

    // ==========================================
    // A. WHAT WAS GOOD (Language-Aware & Honest)
    // ==========================================
    if (relevanceCategory === 'GREETING') {
      good = isTanglish
        ? `Unga answer polite ah irukku, aana adhu "${questionText}" question-ku podhumaana thagaval kudukala.`
        : `Your answer is polite, but it does not provide the required information for "${questionText}".`;
    } else if (relevanceCategory === 'GIBBERISH') {
      good = isTanglish
        ? `Unga response-la valid English text edhum illai. Interview question-ku meaningful sentence pesum podhu dhaan positive feedback thara mudiyum.`
        : `Your response does not contain valid English words. A meaningful response is required before specific strengths can be evaluated.`;
    } else if (relevanceCategory === 'IRRELEVANT') {
      good = isTanglish
        ? `Unga sentence framing ok, aana answer "${questionText}" topic oda relate aagala. This answer does not address the question asked.`
        : `Your sentence framing was fine, but your answer does not address the question asked ("${questionText}").`;
    } else if (relevanceCategory === 'PARTIAL') {
      good = isTanglish
        ? `Unga answer-la irukira main idea puriyudhu, aana question-ku podhumaana technical points & key details missing ah irukku.`
        : `Your main intent is clear, but your response only partially addresses "${questionText}". Expand with supporting technical details.`;
    } else {
      // FULL RELEVANCE
      if (feedbackObj.confidenceScore >= 80) {
        good = isTanglish
          ? `Super performance! "${questionText}" question-ku direct ah relevant response kuduthurikingga, clear tech words oda logical structure maintain pannirikingga.`
          : `Excellent response! You directly addressed "${questionText}" using clear technical vocabulary and a strong logical structure.`;
      } else if (wordCount >= 5) {
        good = isTanglish
          ? `Unga main answer concept and core point puriyura maadhiri thaelivaa solli irukingga.`
          : `Your core message and main idea were communicated clearly and understandably.`;
      } else {
        good = isTanglish
          ? `Sollavandha thagavala hesitation illama direct ah start pannirikingga.`
          : `You introduced your thought directly without hesitation.`;
      }
    }

    // ==========================================
    // B. GRAMMAR & IMPROVEMENT (No Fake Errors)
    // ==========================================
    if (relevanceCategory === 'GREETING') {
      wrong = isTanglish
        ? `Unga response-la greeting ('${rawInput}') mattum dhaan irukku, adhu incomplete. Indha question-ku complete answer and details kudukangga.`
        : `Your response consists of only a greeting ('${rawInput}'), which is incomplete. Provide a full answer with specific details for this question.`;
    } else if (relevanceCategory === 'GIBBERISH') {
      wrong = isTanglish
        ? `Complete English sentences pesungga. Random words illati gibberish avoid panni, proper grammar oda answer panga.`
        : `Please speak in complete, meaningful English sentences. Avoid random words or non-standard characters.`;
    } else if (hasMyselfError) {
      wrong = isTanglish
        ? `Sentence-ah 'Myself [Name]' nu start panradha avoid panga. Professional communication la 'My name is' illati 'I am' nu pesungga.`
        : `Avoid starting your response with 'Myself [Name]'. In professional interviews, always state 'My name is' or 'I am'.`;
    } else if (hasGrammarMistakes) {
      wrong = isTanglish
        ? `Sentence structure la chinna prepositions illati verb tense mistakes irukku. Continuous practice moolama grammar-ah refine panga.`
        : `There are minor grammatical/preposition errors in your sentence framing. Practicing proper verb tenses will refine your fluency.`;
    } else if (relevanceCategory === 'IRRELEVANT') {
      wrong = isTanglish
        ? `Grammar correct ah irukku, aana unga answer question-ku unrelated. Main improvement point: Question ask panna topic-ah focus panradhu dhaan.`
        : `Your grammar is correct, but your response is off-topic. The main improvement needed is directly answering the question prompt.`;
    } else if (wordCount < 6) {
      wrong = isTanglish
        ? `Unga answer romba brief ah irukku. Supporting details oda 1-2 extra sentences add panni explain panga.`
        : `Your answer is very brief. Expand slightly by adding 1-2 supporting details or concrete examples.`;
    } else {
      wrong = isTanglish
        ? `Peridhaaga grammar mistakes edhum illai! Unga sentence structure thaelivaa and grammatically sound ah irukku.`
        : `No major grammar mistakes found! Your sentence structure is clear, accurate, and grammatically sound.`;
    }

    // ==========================================
    // C. QUESTION-SPECIFIC RULE / EXPLANATION
    // ==========================================
    const isGreetingOrIncomplete = relevanceCategory === 'GREETING' || relevanceCategory === 'GIBBERISH' || wordCount < 4;
    const rule = getQuestionSpecificRule(questionText, difficulty, isTanglish, isGreetingOrIncomplete);

    return { good, wrong, rule };
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6 max-w-6xl w-full mx-auto py-4 px-4 sm:px-8 relative animate-in fade-in duration-300">
      {showValidationPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card rounded-3xl p-6 max-w-md w-full border border-amber-500/40 bg-slate-900 text-white shadow-2xl space-y-4 text-center relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white font-['Space_Grotesk']">
                Answer Required
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Please click 'Start Speaking' and speak your response before analyzing.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowValidationPopup(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-md cursor-pointer transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Ambient Lighting Glows */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />

      {/* 1. HERO HEADER */}
      <div className="animated-border-glow-wrapper">
        <div className="relative overflow-hidden rounded-[23px] bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-950 p-5 sm:p-7 text-white border-0 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-cyan-200 text-xs font-bold backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>AI Communication Coach</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Space_Grotesk'] flex items-center gap-2 text-white">
                <span>🗣️ Communication Hub</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-100 dark:text-slate-300 font-medium leading-relaxed">
                Practice naturally. Speak confidently. Improve with AI.
              </p>
            </div>

            <button
              onClick={handleDirectExitCommunication}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-red-500/20 text-white hover:text-red-300 border border-white/20 hover:border-red-400 text-xs font-extrabold flex items-center gap-1.5 backdrop-blur-xl transition-all cursor-pointer shrink-0 self-start sm:self-center"
              title="Exit Practice"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DIFFICULTY SELECTOR */}
      <div className="glass-card rounded-2xl p-2.5 border border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl shadow-md flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 px-3 uppercase tracking-wider hidden sm:block">
          Difficulty:
        </span>
        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto flex-1 max-w-md">
          {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => handleSelectDifficulty(level)}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${
                difficulty === level
                  ? level === 'Easy'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                    : level === 'Medium'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                    : 'bg-purple-600 text-white shadow-md shadow-purple-600/25 scale-[1.02]'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {level === 'Easy' ? '🟢 Easy' : level === 'Medium' ? '🔵 Medium' : '🟣 Hard'}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW STATE 1: INPUT STATE */}
      {viewState === 'input' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* COMPACT QUESTION CARD */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-purple-500/20 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-extrabold text-blue-600 dark:text-cyan-400 uppercase tracking-wider">
                  AI Communication Question • {difficulty} Level
                </span>
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk'] leading-snug">
              "{currentQuestion}"
            </h2>
          </div>

          {/* USER RESPONSE AREA (Voice Only) */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-purple-500/20 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                🎤 Your Spoken Response (Voice Only):
              </label>

              <button
                type="button"
                onClick={toggleRecording}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isRecording ? 'Stop Recording' : '🎤 Start Speaking'}</span>
              </button>
            </div>

            {/* Recording Animation Indicator */}
            {isRecording && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-extrabold flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span>Listening... Speak naturally in English. Your spoken words will appear live below.</span>
                </div>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className="px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-extrabold"
                >
                  Stop
                </button>
              </div>
            )}

            {voiceNotice && !isRecording && (
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-400 text-xs font-semibold">
                <span>{voiceNotice}</span>
              </div>
            )}

            <textarea
              ref={textareaRef}
              rows={4}
              value={inputSentence}
              readOnly={true}
              placeholder="Click 🎤 Start Speaking and speak your response... (Recognized speech will appear here)"
              className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none leading-relaxed select-text cursor-not-allowed"
            />

            <button
              onClick={handleAnalyzeCommunication}
              disabled={isAnalyzing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/25 transition-all duration-300 ease-out hover:scale-[1.01] active:scale-98 cursor-pointer disabled:opacity-50 border border-cyan-400/30"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Analyzing Communication with AI...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-white" />
                  <span>Analyze My Communication →</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* VIEW STATE 2: PREMIUM COMPACT RESULT STATE */}
      {viewState === 'result' && feedback && (
        <div ref={resultContainerRef} className="space-y-6 animate-in slide-in-from-bottom-3 duration-300">
          
          {/* Try Again Score Comparison Toast */}
          {hasAttemptedAgain && previousScore !== null && newScore !== null && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center justify-between shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Great improvement! 🎉 Previous Score: <strong>{previousScore}%</strong> → New Score: <strong className="text-emerald-400">{newScore}%</strong></span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] uppercase font-black tracking-wider">
                +{Math.max(0, newScore - previousScore)}% Boost
              </span>
            </div>
          )}

          {/* MAIN PREMIUM SCORE & FEEDBACK CARD */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white border border-indigo-500/30 shadow-2xl space-y-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header: ANIMATED SCORE CIRCULAR GAUGE RING + Feedback Language Selector */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-800/90 pb-6 relative z-10">
              
              {/* Circular Animated Progress Gauge Ring */}
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="w-24 h-24 transform -rotate-90 drop-shadow-[0_0_12px_rgba(99,102,241,0.35)]">
                    <defs>
                      <linearGradient id="scoreRingGradComm" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38BDF8" />
                        <stop offset="50%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#A855F7" />
                      </linearGradient>
                    </defs>
                    <circle cx="48" cy="48" r="36" stroke="rgba(30, 41, 59, 0.8)" strokeWidth="7" fill="transparent" />
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="url(#scoreRingGradComm)"
                      strokeWidth="7"
                      className="transition-all duration-1000 ease-out"
                      strokeDasharray={226.195}
                      strokeDashoffset={226.195 - (226.195 * animatedScore) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white tracking-tight font-['Space_Grotesk']">
                      {feedback.confidenceScore}%
                    </span>
                    <span className="text-[9px] font-black uppercase text-cyan-300 tracking-widest">
                      Score
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-cyan-300 border border-indigo-500/30">
                      {feedback.communicationRating} Rating
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
                    Overall Communication Score
                  </h3>
                  <p className="text-xs text-slate-400 font-medium line-clamp-1">
                    Question: "{evaluatedQuestion || currentQuestion}"
                  </p>
                </div>
              </div>

              {/* FEEDBACK LANGUAGE SELECTOR */}
              <div className="p-1 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex items-center gap-1 shrink-0 shadow-inner">
                <button
                  type="button"
                  onClick={() => setFeedbackLanguage('English')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    feedbackLanguage === 'English'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackLanguage('Tanglish')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    feedbackLanguage === 'Tanglish'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tanglish
                </button>
              </div>
            </div>

            {/* Dynamic AI Feedback Details */}
            {(() => {
              const targetQuestion = evaluatedQuestion || currentQuestion;
              const targetAnswer = evaluatedAnswer || inputSentence;
              const details = getDynamicFeedbackDetails(targetQuestion, targetAnswer, feedback, feedbackLanguage);
              const bestAnswerStr = generateQuestionSpecificBestAnswer(targetQuestion, targetAnswer, difficulty);

              return (
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>AI Feedback & Relevance Breakdown ({feedbackLanguage})</span>
                    </span>
                  </div>

                  {/* VISUALLY SEPARATED FEEDBACK CATEGORY CARDS */}
                  <div className="grid grid-cols-1 gap-3.5">
                    
                    {/* What Was Good */}
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1 transition-all hover:border-emerald-500/40">
                      <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>What was good:</span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium leading-relaxed pl-6">
                        {details.good}
                      </p>
                    </div>

                    {/* Grammar & Improvement */}
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1 transition-all hover:border-amber-500/40">
                      <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Grammar & Improvement:</span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium leading-relaxed pl-6">
                        {details.wrong}
                      </p>
                    </div>

                    {/* Rule / Explanation */}
                    <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 space-y-1 transition-all hover:border-cyan-500/40">
                      <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs">
                        <BookOpen className="w-4 h-4 shrink-0" />
                        <span>Rule / Explanation:</span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium leading-relaxed pl-6">
                        {details.rule}
                      </p>
                    </div>

                  </div>

                  {/* Question-Specific Best Answer */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 border border-emerald-500/30 space-y-2 shadow-md">
                    <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
                      <Award className="w-4 h-4 shrink-0" />
                      <span>Best Answer (Interview Ready)</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-emerald-100 leading-relaxed italic pl-6">
                      "{bestAnswerStr}"
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* ACTION BUTTONS WITH GLOW EFFECTS */}
            <div className="flex items-center justify-between gap-4 pt-5 border-t border-slate-800/90 relative z-10">
              
              {/* Secondary Action: ← Try Again */}
              <button
                type="button"
                onClick={handleTryAgain}
                className="px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-white hover:text-cyan-200 border border-slate-700 hover:border-cyan-500/40 shadow-md hover:scale-[1.02] active:scale-98 transition-all duration-300 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-300" />
                <span>← Try Again</span>
              </button>

              {/* Primary Action: Next Question → with Glow */}
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-xl shadow-blue-600/30 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-98 transition-all duration-300 cursor-pointer border border-cyan-400/30"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CommunicationView;
