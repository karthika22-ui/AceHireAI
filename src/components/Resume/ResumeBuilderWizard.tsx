import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Plus,
  Trash2,
  User,
  FileText,
  GraduationCap,
  Code2,
  FolderGit2,
  Award,
  Layout,
  Check,
  Wand2,
  Download,
  AlertCircle,
  Briefcase,
  Trophy,
  Globe,
  BarChart3,
  Save,
  ShieldCheck,
  Languages,
  ExternalLink,
  Camera,
  Search,
  X,
  Eye,
  RotateCcw
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useApp } from '../../context/AppContext';
import { ResumeData, EducationEntry, ProjectEntry, CertificationEntry, InternshipEntry, LanguageProficiency, AdditionalLink, ResumeAnalysis } from '../../types';
import { ResumePreviewTemplates } from './ResumePreviewTemplates';
import { ATSAnalyzerView } from './ATSAnalyzerView';
import { fetchFromOpenRouter } from '../../services/aiEngine';
import { SupabaseService } from '../../services/supabaseClient';

export interface TemplateInfo {
  id: string;
  name: string;
  category: string;
  badge: string;
  desc: string;
  hasPhoto?: boolean;
}

const LOCAL_STORAGE_KEY = 'ACEHIRE_SAVED_RESUME_BUILDER_DRAFT';

// DEFAULT EMPTY RESUME FORM DATA (USER ENTERS THEIR OWN DETAILS)
const defaultEmptyFormData: ResumeData = {
  fullName: '',
  professionalTitle: '',
  email: '',
  phone: '',
  location: '',
  linkedIn: '',
  gitHub: '',
  portfolio: '',
  photoUrl: '',
  summary: '',
  education: [
    {
      degree: '',
      institution: '',
      location: '',
      startYear: '',
      endYear: '',
      graduationYear: '',
      cgpa: ''
    }
  ],
  skills: [],
  programmingLanguages: [],
  webTechnologies: [],
  frameworksLibraries: [],
  databases: [],
  toolsAndTech: [],
  projects: [
    {
      title: '',
      description: '',
      techStack: [],
      gitHubUrl: ''
    }
  ],
  experience: [
    {
      role: '',
      company: '',
      location: '',
      duration: '',
      description: ''
    }
  ],
  certifications: [
    {
      title: '',
      issuer: '',
      year: '',
      credentialUrl: ''
    }
  ],
  achievements: [''],
  languages: [{ language: '', proficiency: 'Full Professional' }],
  additionalLinks: [],
  selectedTemplate: 'modern'
};

// EXACTLY 30 REAL, POLISHED, PROFESSIONAL RESUME TEMPLATE DESIGNS
export const RESUME_TEMPLATES_LIST: TemplateInfo[] = [
  // --- 10 PHOTO TEMPLATES ---
  {
    id: 'photo-modern',
    name: 'Modern Avatar Header',
    category: 'Photo Templates',
    badge: 'Photo Included',
    desc: 'Modern layout with left photo avatar badge and indigo header accent.',
    hasPhoto: true
  },
  {
    id: 'photo-executive',
    name: 'Executive Headshot Portrait',
    category: 'Photo Templates',
    badge: 'Senior Executive',
    desc: 'Full-width executive banner with right circular portrait frame.',
    hasPhoto: true
  },
  {
    id: 'photo-tech',
    name: 'Tech Developer Headshot',
    category: 'Photo Templates',
    badge: 'Developer Choice',
    desc: 'Dark terminal style header with square photo placeholder.',
    hasPhoto: true
  },
  {
    id: 'photo-creative',
    name: 'Creative Portfolio Photo',
    category: 'Photo Templates',
    badge: 'Design & Creative',
    desc: 'Vibrant purple gradient header with border-highlighted profile photo.',
    hasPhoto: true
  },
  {
    id: 'photo-minimal',
    name: 'Minimal Profile Avatar',
    category: 'Photo Templates',
    badge: 'Clean Minimal',
    desc: 'Clean left border layout with compact circular photo avatar.',
    hasPhoto: true
  },
  {
    id: 'photo-sidebar',
    name: 'Split Sidebar Portrait',
    category: 'Photo Templates',
    badge: 'Two-Column Split',
    desc: 'Dark left sidebar featuring profile photo, contact details & skills.',
    hasPhoto: true
  },
  {
    id: 'photo-corporate',
    name: 'Corporate Leadership Photo',
    category: 'Photo Templates',
    badge: 'Corporate Standard',
    desc: 'Deep blue corporate header with square executive headshot.',
    hasPhoto: true
  },
  {
    id: 'photo-elegant',
    name: 'Elegant Gold Headshot',
    category: 'Photo Templates',
    badge: 'Elegant Style',
    desc: 'Warm gold accent lines with centered serif title & circular headshot.',
    hasPhoto: true
  },
  {
    id: 'photo-gradient',
    name: 'Gradient Wave Photo',
    category: 'Photo Templates',
    badge: 'Teal Modern',
    desc: 'Teal gradient header pill with rounded portrait container.',
    hasPhoto: true
  },
  {
    id: 'photo-academic',
    name: 'Scholar Academic Portrait',
    category: 'Photo Templates',
    badge: 'Academic',
    desc: 'Traditional serif academic document layout with scholar photo badge.',
    hasPhoto: true
  },

  // --- 20 NON-PHOTO TEMPLATES ---
  {
    id: 'modern',
    name: 'Modern Professional',
    category: 'Modern',
    badge: 'Popular',
    desc: 'Indigo accent header bar, clean modern typography, structured section dividers.'
  },
  {
    id: 'ats-friendly',
    name: 'ATS Maximum Parser',
    category: 'ATS Standard',
    badge: 'Recommended for ATS',
    desc: 'Clean single-column structure, standard text headings, maximum parser compatibility.'
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    category: 'Minimal',
    badge: 'Fresher Choice',
    desc: 'Ultra-clean layout, left border accent, compact line spacing.'
  },
  {
    id: 'executive',
    name: 'Executive Leadership',
    category: 'Modern',
    badge: 'Senior Level',
    desc: 'Dark navy top banner, centered executive header, serif section titles.'
  },
  {
    id: 'technical',
    name: 'Technical Engineer Dark',
    category: 'Modern',
    badge: 'Engineering',
    desc: 'Monospace code-style accents, dark slate banner for tech competencies.'
  },
  {
    id: 'creative',
    name: 'Creative Dual-Tone',
    category: 'Modern',
    badge: 'Product & Design',
    desc: 'Vibrant dual-tone gradient header bar, bold typography hierarchy.'
  },
  {
    id: 'developer',
    name: 'Terminal Developer Tech',
    category: 'Modern',
    badge: 'Software Engineer',
    desc: 'Terminal command prompt header banner `$ cat profile.json`.'
  },
  {
    id: 'ivy',
    name: 'Ivy League Academic',
    category: 'ATS Standard',
    badge: 'Academic',
    desc: 'Harvard/Yale traditional style, small caps headings, centered contact info.'
  },
  {
    id: 'emerald-fresh',
    name: 'Emerald Graduate Accent',
    category: 'Modern',
    badge: 'Fresher Special',
    desc: 'Fresh emerald gradient header, structured skills breakdown.'
  },
  {
    id: 'monochrome',
    name: 'Pure Monochrome B&W',
    category: 'Minimal',
    badge: 'Pure B&W',
    desc: 'High contrast monochrome styling, bold black borders.'
  },
  {
    id: 'cyan-matrix',
    name: 'Cyan Data Analytics',
    category: 'Modern',
    badge: 'Data Science',
    desc: 'Left thick cyan bar, data matrix section dividers.'
  },
  {
    id: 'rose-modern',
    name: 'Rose Quartz Accent',
    category: 'Modern',
    badge: 'Modern Rose',
    desc: 'Soft rose accent rule, elegant font pairing.'
  },
  {
    id: 'slate-minimal',
    name: 'Slate Line Minimal',
    category: 'Minimal',
    badge: 'Clean Line',
    desc: 'Crisp grey lines, subtle section padding.'
  },
  {
    id: 'charcoal-exec',
    name: 'Charcoal Director Slate',
    category: 'Modern',
    badge: 'Director',
    desc: 'Charcoal banner with gold subtitles.'
  },
  {
    id: 'amber-gold',
    name: 'Amber Gold Corporate',
    category: 'Modern',
    badge: 'Warm Gold',
    desc: 'Amber gold headers, classic corporate spacing.'
  },
  {
    id: 'navy-classic',
    name: 'Deep Navy Traditional',
    category: 'ATS Standard',
    badge: 'Traditional',
    desc: 'Classic deep navy title bar, serif subheadings.'
  },
  {
    id: 'teal-impact',
    name: 'Teal High Impact',
    category: 'Modern',
    badge: 'High Impact',
    desc: 'Teal header banner with crisp white text font.'
  },
  {
    id: 'indigo-grid',
    name: 'Indigo Structured Grid',
    category: 'Modern',
    badge: 'Grid Layout',
    desc: 'Indigo section dividers and clean structured boxes.'
  },
  {
    id: 'serif-academic',
    name: 'Scholar Serif Classic',
    category: 'ATS Standard',
    badge: 'Research',
    desc: 'Centered serif header with classic academic dividers.'
  },
  {
    id: 'border-accent',
    name: 'Framed Border Accent',
    category: 'Modern',
    badge: 'Framed Design',
    desc: 'Framed outer border layout with colored headers.'
  }
];

// Sample Candidate Data for Gallery Thumbnail Cards Only
const sampleMiniData: ResumeData = {
  fullName: 'Alex Chen',
  professionalTitle: 'Full Stack Software Engineer',
  email: 'alex.chen@university.edu',
  phone: '+91 98765 43210',
  location: 'Chennai, TN',
  linkedIn: 'linkedin.com/in/alexchen-dev',
  gitHub: 'github.com/alexchen-dev',
  portfolio: 'alexchen.dev',
  photoUrl: '',
  summary: 'Software Engineering student skilled in React, TypeScript, Node.js, and PostgreSQL.',
  education: [
    {
      degree: 'B.E. Computer Science & Engineering',
      institution: 'Anna University / Sri Sairam College',
      location: 'Chennai',
      startYear: '2021',
      endYear: '2025',
      graduationYear: '2025',
      cgpa: '8.85 / 10'
    }
  ],
  skills: ['System Design', 'Agile', 'Problem Solving'],
  programmingLanguages: ['Java', 'Python', 'TypeScript', 'C++'],
  webTechnologies: ['React.js', 'Next.js', 'Tailwind CSS', 'Node.js'],
  frameworksLibraries: ['Express.js', 'Spring Boot'],
  databases: ['PostgreSQL', 'MongoDB'],
  toolsAndTech: ['Git & GitHub', 'Docker', 'Vite'],
  projects: [
    {
      title: 'AceHire AI — Placement Preparation Ecosystem',
      description: 'Built AI mock interview & ATS analysis platform with dual-language evaluation.',
      techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Supabase'],
      gitHubUrl: 'github.com/alexchen-dev/acehire-ai'
    }
  ],
  experience: [
    {
      role: 'Software Engineer Intern',
      company: 'TechCorp Innovations',
      location: 'Bangalore',
      duration: 'Jun 2024 - Aug 2024',
      description: 'Engineered RESTful API endpoints and optimized DB query speeds by 35%.'
    }
  ],
  certifications: [{ title: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', year: '2024' }],
  achievements: ['1st Place National Hackathon Winner (2024)', 'LeetCode Knight Badge (1850+)'],
  languages: [{ language: 'English', proficiency: 'Full Professional' }],
  selectedTemplate: 'modern'
};

// MINIATURE PREVIEW FOR TEMPLATE GALLERY MODAL CARDS ONLY
const TemplateMiniPreview: React.FC<{ templateId: string }> = ({ templateId }) => {
  const isPhoto = templateId.startsWith('photo-');
  const miniData = isPhoto
    ? {
        ...sampleMiniData,
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
      }
    : sampleMiniData;

  return (
    <div
      className={`w-full ${
        isPhoto ? 'h-64' : 'h-56'
      } overflow-hidden rounded-lg bg-white border border-slate-200 dark:border-slate-800 shadow-sm relative select-none pointer-events-none flex items-start justify-center transition-all`}
    >
      <div
        className={`w-[420px] ${
          isPhoto ? 'h-[660px] scale-[0.38]' : 'h-[565px] scale-[0.38]'
        } origin-top-left bg-white text-slate-900 pointer-events-none box-border p-2 overflow-hidden`}
      >
        <ResumePreviewTemplates data={miniData} template={templateId} />
      </div>
    </div>
  );
};

interface ResumeBuilderWizardProps {
  onBackToSelection: () => void;
}

export const ResumeBuilderWizard: React.FC<ResumeBuilderWizardProps> = ({ onBackToSelection }) => {
  const { user, setResume } = useApp();

  // Wizard State — Restores from persistent draft if available (REQUIREMENT 3: CONTINUE SAVED RESUME)
  const [formData, setFormData] = useState<ResumeData>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.formData) {
          return parsed.formData;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved draft:', e);
    }
    return defaultEmptyFormData;
  });

  const [currentStep, setCurrentStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.currentStep === 'number') {
          return parsed.currentStep;
        }
      }
    } catch (e) {
      console.error('Failed to restore currentStep:', e);
    }
    return 1;
  });

  const [isResumeCreated, setIsResumeCreated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.isResumeCreated === 'boolean') {
          return parsed.isResumeCreated;
        }
      }
    } catch (e) {
      console.error('Failed to restore isResumeCreated:', e);
    }
    return false;
  });

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);

  // View mode switcher for embedded ATS scan view vs Resume Builder
  const [showEmbeddedAtsView, setShowEmbeddedAtsView] = useState<boolean>(false);

  // Template Search & Category Filter Inside Selection Gallery Modal
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Async States
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState<boolean>(false);

  // AUTO-SAVE DRAFT TO PERSISTENT STORAGE WHENEVER FORM, STEP OR CREATED STATE CHANGES (REQUIREMENT 2 & 3)
  useEffect(() => {
    try {
      const draft = {
        formData,
        currentStep,
        isResumeCreated,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error('Auto save draft failed:', e);
    }
  }, [formData, currentStep, isResumeCreated]);

  // Filter Categories for Inside Template Selection Gallery Modal
  const categories = ['All', 'Photo Templates', 'ATS Standard', 'Modern', 'Minimal'];

  // Filtered 30 Templates List inside Gallery Selection Modal
  const filteredTemplates = RESUME_TEMPLATES_LIST.filter((tpl) => {
    const matchesCategory =
      selectedCategory === 'All'
        ? true
        : selectedCategory === 'Photo Templates'
        ? tpl.hasPhoto === true
        : selectedCategory === 'ATS Standard'
        ? tpl.category === 'ATS Standard'
        : selectedCategory === 'Modern'
        ? tpl.category === 'Modern'
        : selectedCategory === 'Minimal'
        ? tpl.category === 'Minimal'
        : true;

    const matchesSearch =
      tpl.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      tpl.desc.toLowerCase().includes(templateSearchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Template Selection Handler (Shows Template Selected ✓ & Auto-Advances)
  const handleSelectTemplate = (tplId: string) => {
    setSelectedNotificationId(tplId);
    setFormData((prev) => ({ ...prev, selectedTemplate: tplId }));

    setTimeout(() => {
      setSelectedNotificationId(null);
      setIsTemplateModalOpen(false);
      if (!isResumeCreated) {
        setCurrentStep(2);
      }
    }, 300);
  };

  // Next Step Handler (Steps 2-9)
  const handleNextStep = () => {
    if (currentStep < 10) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Previous Step Handler
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Create Resume Action (Step 10)
  const handleCreateResume = () => {
    setIsResumeCreated(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // REAL SAVE PROGRESS FLOW (REQUIREMENT 2: REAL SAVE PROGRESS PERSISTENCE)
  const handleSaveResume = async () => {
    try {
      const draft = {
        formData,
        currentStep,
        isResumeCreated,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
      setResume(formData);

      if (user?.id) {
        await SupabaseService.saveResume(formData, user.id);
      }

      setSaveSuccessToast(true);
      setTimeout(() => setSaveSuccessToast(false), 3000);
    } catch (error) {
      console.error('Error saving resume progress:', error);
    }
  };

  // Clear Saved Draft and Reset Form
  const handleClearDraftAndReset = () => {
    if (window.confirm('Are you sure you want to clear your saved draft and start fresh?')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setFormData(defaultEmptyFormData);
      setCurrentStep(1);
      setIsResumeCreated(false);
    }
  };

  // Direct Client-Side PDF Generator (jsPDF + html2canvas on True A4 Canvas)
  const handlePrintPDF = async () => {
    const element = document.getElementById('printable-resume-preview-canvas');
    if (!element) return;

    setIsDownloadingPdf(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${(formData.fullName || 'Candidate').replace(/\s+/g, '_')}_Resume.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Failed to generate client PDF:', error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // AI Summary Enhancement
  const handleGenerateAISummary = async () => {
    setIsAiLoading(true);
    try {
      const prompt = `Generate a concise, high-impact 3-sentence professional resume summary for a college engineering graduate applying for software engineering roles. Title: ${formData.professionalTitle || 'Software Engineer'}. Skills: ${formData.programmingLanguages?.join(', ') || 'Java, Python, Web Development'}. Return ONLY the plain text summary without markdown format quotes.`;
      const aiResponse = await fetchFromOpenRouter(prompt);
      if (aiResponse) {
        setFormData((prev) => ({ ...prev, summary: aiResponse.trim() }));
      }
    } catch (err) {
      console.error('Failed to generate AI summary:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Project Description Enhancer
  const handleImproveProjectWithAI = async (index: number) => {
    const proj = formData.projects[index];
    if (!proj) return;
    setIsAiLoading(true);
    try {
      const prompt = `Rewrite this software project description for an ATS-optimized resume using active metric-driven bullet points. Title: ${proj.title || 'Software Project'}. Description: ${proj.description || 'Built web application'}. Return ONLY the plain improved description string.`;
      const aiResponse = await fetchFromOpenRouter(prompt);
      if (aiResponse) {
        const updated = [...formData.projects];
        updated[index].description = aiResponse.trim();
        setFormData((prev) => ({ ...prev, projects: updated }));
      }
    } catch (err) {
      console.error('Failed to improve project description:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Skill Tag Input Handlers
  const [skillInputs, setSkillInputs] = useState({ prog: '', web: '', db: '', other: '' });
  const handleAddSkillTag = (categoryKey: keyof typeof skillInputs, targetField: keyof ResumeData) => {
    const val = skillInputs[categoryKey].trim();
    if (!val) return;
    const currentList = (formData[targetField] as string[]) || [];
    setFormData({ ...formData, [targetField]: [...currentList, val] });
    setSkillInputs({ ...skillInputs, [categoryKey]: '' });
  };
  const handleRemoveSkillTag = (targetField: keyof ResumeData, index: number) => {
    const currentList = (formData[targetField] as string[]) || [];
    const updated = currentList.filter((_, i) => i !== index);
    setFormData({ ...formData, [targetField]: updated });
  };

  // If user clicked "ATS Analysis" button on generated resume screen, launch the EXACT SAME standalone ATSAnalyzerView component
  if (showEmbeddedAtsView) {
    return (
      <ATSAnalyzerView
        initialResumeData={formData}
        onBackToSelection={() => setShowEmbeddedAtsView(false)}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto max-w-6xl mx-auto py-2 px-3 sm:px-6 lg:px-8 space-y-6 relative animate-in fade-in duration-300">
      
      {/* SUCCESS TOAST FLOATING NOTIFICATION */}
      {saveSuccessToast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>Progress Saved Successfully!</span>
        </div>
      )}

      {/* TOP SAAS HEADER (REQUIREMENT 1: REMOVED DUPLICATE CHANGE TEMPLATE BUTTON) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToSelection}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Back to Option Selection"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/20 mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HasHire Resume Studio</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
              Resume Builder & ATS
            </h1>
          </div>
        </div>

        {/* HEADER CONTROLS (REQUIREMENT 1: ONLY SAVE PROGRESS & DOWNLOAD PDF; REMOVED DUPLICATE CHANGE TEMPLATE) */}
        {isResumeCreated && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveResume}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 text-indigo-500" />
              <span>Save Progress</span>
            </button>

            <button
              onClick={handlePrintPDF}
              disabled={isDownloadingPdf}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Resume PDF'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================================= */}
      {/* VIEW A: DEDICATED FULL A4 PAGE RESUME RESULT VIEW */}
      {/* ========================================================================================= */}
      {isResumeCreated ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Action Bar Sub-Header (REQUIREMENT 1: KEPT THE ONLY CHANGE TEMPLATE BUTTON HERE) */}
          <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Active Template: <strong className="text-indigo-600 dark:text-indigo-400 uppercase">{formData.selectedTemplate || 'MODERN'}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsResumeCreated(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 hover:bg-slate-200 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Edit Form
              </button>
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow hover:bg-indigo-700 cursor-pointer"
              >
                <Layout className="w-3.5 h-3.5" /> Change Template
              </button>
            </div>
          </div>

          {/* TRUE A4 RESUME DOCUMENT CANVAS (210mm x 297mm = 794px x 1123px AT FULL RESOLUTION) */}
          <div className="flex justify-center overflow-x-auto py-4">
            <div
              id="printable-resume-preview-canvas"
              className="w-[794px] min-h-[1123px] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 overflow-hidden box-border p-8 sm:p-10 flex flex-col justify-between"
            >
              <ResumePreviewTemplates
                data={formData}
                template={formData.selectedTemplate}
                onPhotoUpload={(photoDataUrl) => setFormData((prev) => ({ ...prev, photoUrl: photoDataUrl }))}
              />
            </div>
          </div>

          {/* STANDALONE ATS SCANNER PROCESS DIRECTLY BELOW GENERATED RESUME */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 space-y-4 shadow-xl print:hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <span>Existing ATS Scanner Integration</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                Run ATS Analysis on Generated Resume
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Send your generated resume through the complete standalone ATS Scanner parser & placement audit engine.
              </p>
            </div>

            <button
              onClick={() => setShowEmbeddedAtsView(true)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/25 transition-all cursor-pointer shrink-0"
            >
              <BarChart3 className="w-5 h-5" />
              <span>ATS Analysis →</span>
            </button>
          </div>
        </div>
      ) : (

        /* ========================================================================================= */
        /* VIEW B: CLEAN 10-STEP WIZARD FORM FILLING WITH PERSISTENT DRAFT DRAFT RESTORE */
        /* ========================================================================================= */
        <div className="w-full max-w-5xl mx-auto space-y-6 print:hidden">

          {/* DRAFT RESTORE BANNER */}
          {formData.fullName || formData.summary || formData.education[0]?.degree ? (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Resumed from your saved resume draft. Work is auto-saved.</span>
              </div>
              <button
                type="button"
                onClick={handleClearDraftAndReset}
                className="text-[11px] text-slate-500 hover:text-red-500 underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Start Fresh
              </button>
            </div>
          ) : null}

          {/* STEP FORM INPUTS CONTAINER */}
          <div className="w-full space-y-6">

            {/* STEP 1: TEMPLATE SELECTION SCREEN */}
            {currentStep === 1 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/20 mb-2">
                      <Layout className="w-4 h-4" />
                      <span>Step 1 of 10 — Template Selection</span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                      Select Your Resume Template
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Current Template: <strong className="text-indigo-600 dark:text-indigo-400 uppercase">{formData.selectedTemplate || 'MODERN'}</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer shrink-0"
                  >
                    <Layout className="w-4 h-4" />
                    <span>Select Your Resume Template →</span>
                  </button>
                </div>

                {/* CURRENT TEMPLATE FEATURE CARD */}
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    Active Design Selection
                  </span>
                  {RESUME_TEMPLATES_LIST.find((t) => t.id === formData.selectedTemplate) && (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-44 shrink-0">
                        <TemplateMiniPreview templateId={formData.selectedTemplate || 'modern'} />
                      </div>
                      <div className="space-y-3 flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                            {RESUME_TEMPLATES_LIST.find((t) => t.id === formData.selectedTemplate)!.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold border border-indigo-500/20">
                            {RESUME_TEMPLATES_LIST.find((t) => t.id === formData.selectedTemplate)!.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {RESUME_TEMPLATES_LIST.find((t) => t.id === formData.selectedTemplate)!.desc}
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setIsTemplateModalOpen(true)}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow hover:bg-indigo-700 cursor-pointer"
                          >
                            <span>Browse All 30 Resume Templates</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: PERSONAL INFORMATION */}
            {currentStep === 2 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 space-y-6 shadow-xl">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                    Personal Information
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Enter your contact details, location, social profiles, and job title.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 text-xs font-medium">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Enter your full name"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">Professional Title *</label>
                    <input
                      type="text"
                      value={formData.professionalTitle}
                      onChange={(e) => setFormData({ ...formData, professionalTitle: e.target.value })}
                      placeholder="Enter your professional job title (e.g. Software Engineer)"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email address"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">Phone Number *</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">Location *</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Enter your location (City, State)"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">LinkedIn Profile URL</label>
                    <input
                      type="text"
                      value={formData.linkedIn || ''}
                      onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                      placeholder="Enter your LinkedIn profile URL"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">GitHub Profile URL</label>
                    <input
                      type="text"
                      value={formData.gitHub || ''}
                      onChange={(e) => setFormData({ ...formData, gitHub: e.target.value })}
                      placeholder="Enter your GitHub profile URL"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">Portfolio Link (Optional)</label>
                    <input
                      type="text"
                      value={formData.portfolio || ''}
                      onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                      placeholder="Enter your portfolio URL (Optional)"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Profile Photo Image URL (Optional - Active for Photo Templates)
                    </label>
                    <input
                      type="text"
                      value={formData.photoUrl || ''}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      placeholder="Enter image URL or click photo area on final resume to upload"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PROFESSIONAL SUMMARY */}
            {currentStep === 3 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 space-y-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                      Professional Summary
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Write a concise summary highlighting your engineering background and career goals.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAISummary}
                    disabled={isAiLoading}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow hover:shadow-purple-500/25 cursor-pointer disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{isAiLoading ? 'Generating AI Summary...' : 'AI Generate Summary'}</span>
                  </button>
                </div>

                <textarea
                  rows={5}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Enter your professional summary or career objective..."
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium leading-relaxed"
                />
              </div>
            )}

            {/* STEP 4: EDUCATION */}
            {currentStep === 4 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 space-y-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                      Education History
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Add degrees, colleges, universities, and academic CGPA metrics.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newEdu: EducationEntry = { degree: '', institution: '', cgpa: '' };
                      setFormData({ ...formData, education: [...formData.education, newEdu] });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Education
                  </button>
                </div>

                {formData.education.map((edu, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase">Degree Entry #{idx + 1}</span>
                      {formData.education.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.education.filter((_, i) => i !== idx);
                            setFormData({ ...formData, education: updated });
                          }}
                          className="text-xs text-red-500 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Degree / Qualification *</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx].degree = e.target.value;
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="Enter your degree (e.g. B.E. Computer Science)"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">College / Institution *</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx].institution = e.target.value;
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="Enter your college or university name"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">CGPA / Percentage</label>
                        <input
                          type="text"
                          value={edu.cgpa}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx].cgpa = e.target.value;
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="Enter your CGPA (e.g. 8.85 / 10)"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Graduation Year</label>
                        <input
                          type="text"
                          value={edu.endYear || edu.graduationYear || ''}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx].endYear = e.target.value;
                            updated[idx].graduationYear = e.target.value;
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="Enter graduation year (e.g. 2025)"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 5: SKILLS */}
            {currentStep === 5 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 space-y-5 shadow-xl">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                    Skills & Technical Competencies
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Add programming languages, web technologies, frameworks, and tools.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                    <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Programming Languages</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skillInputs.prog}
                        onChange={(e) => setSkillInputs({ ...skillInputs, prog: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkillTag('prog', 'programmingLanguages'))}
                        placeholder="Enter programming language (e.g. Python)"
                        className="flex-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSkillTag('prog', 'programmingLanguages')}
                        className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(formData.programmingLanguages || []).map((sk, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-bold border border-indigo-500/20 flex items-center gap-1">
                          {sk}
                          <button type="button" onClick={() => handleRemoveSkillTag('programmingLanguages', i)} className="hover:text-red-500 cursor-pointer">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                    <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Web Tech & Frameworks</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skillInputs.web}
                        onChange={(e) => setSkillInputs({ ...skillInputs, web: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkillTag('web', 'webTechnologies'))}
                        placeholder="Enter framework or web tech (e.g. React.js)"
                        className="flex-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSkillTag('web', 'webTechnologies')}
                        className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(formData.webTechnologies || []).map((sk, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-bold border border-indigo-500/20 flex items-center gap-1">
                          {sk}
                          <button type="button" onClick={() => handleRemoveSkillTag('webTechnologies', i)} className="hover:text-red-500 cursor-pointer">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: PROJECTS */}
            {currentStep === 6 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                      Projects & Work Submissions
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Detail software projects, tech stack, and GitHub repository links.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newProj: ProjectEntry = { title: '', description: '', techStack: [], gitHubUrl: '' };
                      setFormData({ ...formData, projects: [...formData.projects, newProj] });
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow hover:bg-indigo-700 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add Project
                  </button>
                </div>

                {formData.projects.map((proj, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase">Project #{idx + 1}</span>
                      {formData.projects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.projects.filter((_, i) => i !== idx);
                            setFormData({ ...formData, projects: updated });
                          }}
                          className="text-xs text-red-500 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Project Title *</label>
                          <input
                            type="text"
                            value={proj.title}
                            onChange={(e) => {
                              const updated = [...formData.projects];
                              updated[idx].title = e.target.value;
                              setFormData({ ...formData, projects: updated });
                            }}
                            placeholder="Enter your project title"
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">GitHub / Live URL</label>
                          <input
                            type="text"
                            value={proj.gitHubUrl || ''}
                            onChange={(e) => {
                              const updated = [...formData.projects];
                              updated[idx].gitHubUrl = e.target.value;
                              setFormData({ ...formData, projects: updated });
                            }}
                            placeholder="Enter GitHub repository or live URL"
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description & Key Contributions *</label>
                          <button
                            type="button"
                            onClick={() => handleImproveProjectWithAI(idx)}
                            disabled={isAiLoading || !proj.title}
                            className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-40"
                          >
                            <Wand2 className="w-3.5 h-3.5" /> AI Refine Description
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={proj.description}
                          onChange={(e) => {
                            const updated = [...formData.projects];
                            updated[idx].description = e.target.value;
                            setFormData({ ...formData, projects: updated });
                          }}
                          placeholder="Enter project description and technical contributions..."
                          className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 7: EXPERIENCE */}
            {currentStep === 7 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 space-y-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                      Work Experience & Internships
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Add relevant industry internships, software roles, or training programs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newExp: InternshipEntry = { role: '', company: '', location: '', duration: '', description: '' };
                      setFormData({ ...formData, experience: [...formData.experience, newExp] });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Experience
                  </button>
                </div>

                {formData.experience.map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase">Experience #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.experience.filter((_, i) => i !== idx);
                          setFormData({ ...formData, experience: updated });
                        }}
                        className="text-xs text-red-500 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Job Role / Title</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => {
                            const updated = [...formData.experience];
                            updated[idx].role = e.target.value;
                            setFormData({ ...formData, experience: updated });
                          }}
                          placeholder="Enter your job role or title"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Company Name</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const updated = [...formData.experience];
                            updated[idx].company = e.target.value;
                            setFormData({ ...formData, experience: updated });
                          }}
                          placeholder="Enter company name"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 8: CERTIFICATIONS */}
            {currentStep === 8 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 space-y-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                      Certifications & Badges
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Add verified courses, online certifications, and domain credentials.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newCert: CertificationEntry = { title: '', issuer: '', year: '' };
                      setFormData({ ...formData, certifications: [...(formData.certifications || []), newCert] });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow hover:bg-indigo-700 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Certification
                  </button>
                </div>

                {(formData.certifications || []).map((cert, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Certification Name</label>
                        <input
                          type="text"
                          value={cert.title}
                          onChange={(e) => {
                            const updated = [...(formData.certifications || [])];
                            updated[idx].title = e.target.value;
                            setFormData({ ...formData, certifications: updated });
                          }}
                          placeholder="Enter certification title"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Issuing Organization</label>
                        <input
                          type="text"
                          value={cert.issuer || ''}
                          onChange={(e) => {
                            const updated = [...(formData.certifications || [])];
                            updated[idx].issuer = e.target.value;
                            setFormData({ ...formData, certifications: updated });
                          }}
                          placeholder="Enter issuing organization name"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 9: ACTIVITIES / LINKS & LANGUAGES */}
            {currentStep === 9 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 space-y-6 shadow-xl">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                    Activities, Spoken Languages & Links
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Add achievements, hackathon awards, spoken languages, and competitive coding links.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Achievements Column */}
                  <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Achievements & Hackathon Awards</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, achievements: [...(formData.achievements || []), ''] })}
                        className="text-xs text-indigo-600 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Item
                      </button>
                    </div>
                    {(formData.achievements || []).map((ach, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={ach}
                          onChange={(e) => {
                            const updated = [...(formData.achievements || [])];
                            updated[i] = e.target.value;
                            setFormData({ ...formData, achievements: updated });
                          }}
                          placeholder="Enter achievement or award"
                          className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (formData.achievements || []).filter((_, idx) => idx !== i);
                            setFormData({ ...formData, achievements: updated });
                          }}
                          className="p-2 text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Spoken Languages Column */}
                  <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Spoken Languages</label>
                      <button
                        type="button"
                        onClick={() => {
                          const newLang: LanguageProficiency = { language: '', proficiency: 'Full Professional' };
                          setFormData({ ...formData, languages: [...(formData.languages || []), newLang] });
                        }}
                        className="text-xs text-indigo-600 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Language
                      </button>
                    </div>
                    {(formData.languages || []).map((l, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={l.language}
                          onChange={(e) => {
                            const updated = [...(formData.languages || [])];
                            updated[idx].language = e.target.value;
                            setFormData({ ...formData, languages: updated });
                          }}
                          placeholder="Enter language name (e.g. English)"
                          className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                        />
                        <select
                          value={l.proficiency}
                          onChange={(e) => {
                            const updated = [...(formData.languages || [])];
                            updated[idx].proficiency = e.target.value;
                            setFormData({ ...formData, languages: updated });
                          }}
                          className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium cursor-pointer"
                        >
                          <option value="Native / Bilingual">Native / Bilingual</option>
                          <option value="Full Professional">Full Professional</option>
                          <option value="Professional Working">Professional Working</option>
                          <option value="Elementary">Elementary</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (formData.languages || []).filter((_, i) => i !== idx);
                            setFormData({ ...formData, languages: updated });
                          }}
                          className="p-2 text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 10: FINAL REVIEW & CREATE RESUME */}
            {currentStep === 10 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/20 mb-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Step 10 of 10 — Final Verification</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                      Review & Create Resume
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Verify your entered candidate information before generating the final full-page resume.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateResume}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer shrink-0"
                  >
                    <span>Create Resume</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400">Step 1: Template</span>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{formData.selectedTemplate?.toUpperCase()}</h3>
                    </div>
                    <button onClick={() => setCurrentStep(1)} className="px-3 py-1 rounded-xl bg-indigo-600/10 text-indigo-600 font-bold hover:bg-indigo-600/20 cursor-pointer">Edit</button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400">Step 2: Personal Information</span>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{formData.fullName || 'Candidate Name'}</h3>
                      <p className="text-slate-500">{formData.professionalTitle || 'Job Title'} • {formData.email || 'Email'} • {formData.phone || 'Phone'}</p>
                    </div>
                    <button onClick={() => setCurrentStep(2)} className="px-3 py-1 rounded-xl bg-indigo-600/10 text-indigo-600 font-bold hover:bg-indigo-600/20 cursor-pointer shrink-0">Edit</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM STEP NAVIGATION CONTROLS (Steps 1 to 10) */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 print:hidden">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {currentStep === 10 ? (
              <button
                type="button"
                onClick={handleCreateResume}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer"
              >
                <span>Create Resume</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow hover:shadow-lg cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* DEDICATED COMPACT 30-TEMPLATE GALLERY MODAL */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 print:hidden">
          <div className="relative w-full max-w-6xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 bg-slate-900/90">
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
                  <Layout className="w-3.5 h-3.5" />
                  <span>30 Resume Template Marketplace Gallery</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Space_Grotesk']">
                  Select Your Resume Template
                </h2>
              </div>

              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TEMPLATE FILTER CONTROLS INSIDE GALLERY MODAL */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  placeholder="Search 30 templates by title or category..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* COMPACT 4-COLUMN RESPONSIVE GRID SHOWING MULTIPLE COMPLETE A4 MINIATURE RESUME CARDS AT ONCE */}
            <div className="p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredTemplates.map((tpl) => {
                const isSelected = formData.selectedTemplate === tpl.id;
                const isNotified = selectedNotificationId === tpl.id;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`group rounded-2xl p-3 border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden bg-slate-950/70 hover:border-indigo-500 hover:scale-[1.02] shadow-sm hover:shadow-xl ${
                      isSelected || isNotified
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-2xl ring-2 ring-emerald-500'
                        : 'border-slate-800'
                    }`}
                  >
                    {(isSelected || isNotified) && (
                      <div className="absolute top-2 right-2 z-20 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center gap-1 shadow-lg">
                        <Check className="w-3 h-3" />
                        <span>✓ Selected</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <TemplateMiniPreview templateId={tpl.id} />
                      
                      <div className="space-y-0.5 text-left pt-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="font-extrabold text-white text-xs truncate">{tpl.name}</h3>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 text-[8px] font-extrabold border border-slate-700 shrink-0">
                            {tpl.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{tpl.desc}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 mt-2 flex items-center justify-between">
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                        {tpl.hasPhoto ? '📷 Photo' : '📄 Standard'}
                      </span>
                      <span className={`text-[10px] font-extrabold ${isSelected ? 'text-emerald-400 font-black' : 'text-indigo-400 group-hover:underline'}`}>
                        {isSelected ? '✓ Selected' : 'Select →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilderWizard;
