import React, { useState } from 'react';
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
  Eye,
  Check,
  Wand2,
  Download,
  Edit3,
  AlertCircle,
  Briefcase,
  Trophy,
  Globe,
  BarChart3,
  Save,
  RotateCcw,
  ShieldCheck,
  Languages,
  ExternalLink,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ResumeData, EducationEntry, ProjectEntry, CertificationEntry, InternshipEntry, LanguageProficiency, AdditionalLink, ResumeAnalysis } from '../../types';
import { ResumePreviewTemplates } from './ResumePreviewTemplates';
import { fetchFromOpenRouter, analyzeResumeWithAI } from '../../services/aiEngine';

interface ResumeBuilderWizardProps {
  onBackToSelection: () => void;
}

export const ResumeBuilderWizard: React.FC<ResumeBuilderWizardProps> = ({ onBackToSelection }) => {
  const { resume, setResume, recordUserActivity } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [mobileViewMode, setMobileViewMode] = useState<'edit' | 'preview'>('edit');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');
  
  // ATS Check State
  const [atsAnalysis, setAtsAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAtsAnalyzing, setIsAtsAnalyzing] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<ResumeData>(() => ({
    fullName: resume?.fullName || '',
    professionalTitle: resume?.professionalTitle || '',
    email: resume?.email || '',
    phone: resume?.phone || '',
    location: resume?.location || '',
    linkedIn: resume?.linkedIn || '',
    gitHub: resume?.gitHub || '',
    portfolio: resume?.portfolio || '',
    summary: resume?.summary || '',
    education: resume?.education || [],
    skills: resume?.skills || [],
    programmingLanguages: resume?.programmingLanguages || [],
    webTechnologies: resume?.webTechnologies || [],
    frameworksLibraries: resume?.frameworksLibraries || [],
    databases: resume?.databases || [],
    toolsAndTech: resume?.toolsAndTech || [],
    otherSkills: resume?.otherSkills || [],
    technicalSkills: resume?.technicalSkills || [],
    projects: resume?.projects || [],
    experience: resume?.experience || [],
    certifications: resume?.certifications || [],
    achievements: resume?.achievements || [],
    leadership: resume?.leadership || [],
    clubsVolunteering: resume?.clubsVolunteering || [],
    extracurriculars: resume?.extracurriculars || [],
    languages: resume?.languages || [],
    additionalLinks: resume?.additionalLinks || [],
    selectedTemplate: resume?.selectedTemplate || 'modern'
  }));

  // Skill scratch inputs
  const [skillInputs, setSkillInputs] = useState({
    prog: '',
    web: '',
    frame: '',
    db: '',
    tool: '',
    other: ''
  });

  // Step definitions (12 steps total)
  const steps = [
    { num: 1, label: 'Template', icon: <Layout className="w-4 h-4" /> },
    { num: 2, label: 'Personal', icon: <User className="w-4 h-4" /> },
    { num: 3, label: 'Summary', icon: <FileText className="w-4 h-4" /> },
    { num: 4, label: 'Education', icon: <GraduationCap className="w-4 h-4" /> },
    { num: 5, label: 'Skills', icon: <Code2 className="w-4 h-4" /> },
    { num: 6, label: 'Projects', icon: <FolderGit2 className="w-4 h-4" /> },
    { num: 7, label: 'Experience', icon: <Briefcase className="w-4 h-4" /> },
    { num: 8, label: 'Certifications', icon: <Award className="w-4 h-4" /> },
    { num: 9, label: 'Activities', icon: <Trophy className="w-4 h-4" /> },
    { num: 10, label: 'Links & Lang', icon: <Languages className="w-4 h-4" /> },
    { num: 11, label: 'Review', icon: <Eye className="w-4 h-4" /> },
    { num: 12, label: 'ATS & Finish', icon: <ShieldCheck className="w-4 h-4" /> }
  ];

  // Helper validation routines
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateUrl = (url: string) => !url || /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i.test(url);

  const isSectionCompleted = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1:
        return Boolean(formData.selectedTemplate);
      case 2:
        return Boolean(
          formData.fullName?.trim() &&
          formData.email?.trim() &&
          formData.phone?.trim() &&
          formData.location?.trim()
        );
      case 3:
        return Boolean(formData.summary?.trim() && formData.summary.trim().length >= 10);
      case 4:
        return Boolean(
          formData.education &&
          formData.education.length > 0 &&
          formData.education[0]?.degree?.trim() &&
          formData.education[0]?.institution?.trim()
        );
      case 5:
        return Boolean(
          (formData.programmingLanguages && formData.programmingLanguages.length > 0) ||
          (formData.webTechnologies && formData.webTechnologies.length > 0) ||
          (formData.technicalSkills && formData.technicalSkills.length > 0) ||
          (formData.skills && formData.skills.length > 0) ||
          (formData.databases && formData.databases.length > 0) ||
          (formData.toolsAndTech && formData.toolsAndTech.length > 0)
        );
      case 6:
        return Boolean(
          formData.projects &&
          formData.projects.length > 0 &&
          formData.projects[0]?.title?.trim() &&
          formData.projects[0]?.description?.trim()
        );
      case 7:
        // Experience is optional: complete if empty OR if filled properly
        return (formData.experience || []).length === 0 || Boolean(formData.experience?.[0]?.role?.trim() && formData.experience?.[0]?.company?.trim());
      case 8:
        // Certifications are optional
        return (formData.certifications || []).length === 0 || Boolean(formData.certifications?.[0]?.title?.trim());
      case 9:
        // Activities are optional
        return true;
      case 10:
        return Boolean(formData.languages && formData.languages.length > 0 && formData.languages[0]?.language?.trim());
      case 11:
        return Boolean(
          formData.fullName?.trim() &&
          formData.email?.trim() &&
          formData.phone?.trim() &&
          formData.education?.length > 0 &&
          formData.education[0]?.degree?.trim()
        );
      case 12:
        return Boolean(atsAnalysis || (formData.atsScore && formData.atsScore > 0));
      default:
        return false;
    }
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 2) {
      if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
      if (!formData.email.trim()) errors.email = 'Email address is required';
      else if (!validateEmail(formData.email)) errors.email = 'Please enter a valid email address';
      if (!formData.phone.trim()) errors.phone = 'Phone number is required';
      if (formData.linkedIn && !validateUrl(formData.linkedIn)) errors.linkedIn = 'Invalid LinkedIn URL format';
      if (formData.gitHub && !validateUrl(formData.gitHub)) errors.gitHub = 'Invalid GitHub URL format';
      if (formData.portfolio && !validateUrl(formData.portfolio)) errors.portfolio = 'Invalid Portfolio URL format';
    }

    if (currentStep === 4) {
      if (!formData.education || formData.education.length === 0) {
        errors.education = 'Please add at least one education entry';
      } else {
        const firstEdu = formData.education[0];
        if (!firstEdu.degree.trim()) errors.degree = 'Degree is required';
        if (!firstEdu.institution.trim()) errors.institution = 'College / Institution is required';
      }
    }

    if (currentStep === 6) {
      if (formData.projects && formData.projects.length > 0) {
        const firstProj = formData.projects[0];
        if (!firstProj.title.trim()) errors.projectTitle = 'Project Title is required';
        if (!firstProj.description.trim()) errors.projectDesc = 'Project Description is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < 12) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // AI Summary Generator & Enhancer via OpenRouter API
  const handleGenerateAISummary = async (mode: 'generate' | 'improve') => {
    setIsAiLoading(true);
    setAiError('');
    try {
      const prompt = mode === 'generate'
        ? `Generate a professional 2-3 sentence resume summary for a college student / fresher candidate with these details:
Name: ${formData.fullName || 'Student'}
Degree: ${formData.education[0]?.degree || 'Computer Science'}
Target Title: ${formData.professionalTitle || 'Software Engineer'}
Skills: ${[...(formData.programmingLanguages || []), ...(formData.webTechnologies || [])].join(', ')}

Return ONLY a polished, first-person or standard professional summary text without markdown formatting or introductory commentary. Do NOT invent fake qualifications.`
        : `Improve and polish this existing candidate resume summary into concise, high-impact bullet points or sentences:
"${formData.summary}"

Target Role: ${formData.professionalTitle || 'Software Engineering'}
Skills: ${[...(formData.programmingLanguages || []), ...(formData.webTechnologies || [])].join(', ')}

Return ONLY the improved summary text without introductory remarks or conversational prose. Do NOT invent fake skills or experience.`;

      const aiText = await fetchFromOpenRouter(prompt);
      const cleaned = aiText.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();
      setFormData(prev => ({ ...prev, summary: cleaned }));
    } catch (err: any) {
      console.warn('AI Summary generation failed:', err);
      setAiError('AI generation failed. Please check your connection or edit the summary manually.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Project Description Enhancer via OpenRouter API
  const handleImproveProjectWithAI = async (index: number) => {
    const proj = formData.projects[index];
    if (!proj || !proj.title) return;

    setIsAiLoading(true);
    setAiError('');
    try {
      const prompt = `Refine and improve this candidate's project description into 2 impact-driven bullet points with strong action verbs (e.g. Developed, Implemented, Engineered, Designed):

Project Title: ${proj.title}
Current Description: ${proj.description}
Technologies Used: ${Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack}

Return ONLY the improved bullet points without introductory text or markdown prose. Do NOT invent unmentioned features.`;

      const aiText = await fetchFromOpenRouter(prompt);
      const cleaned = aiText.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();
      
      const updatedProjects = [...formData.projects];
      updatedProjects[index] = { ...updatedProjects[index], description: cleaned };
      setFormData(prev => ({ ...prev, projects: updatedProjects }));
    } catch (err: any) {
      console.warn('AI Project enhancement failed:', err);
      setAiError('Failed to refine project description. Please edit manually.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Run ATS Score Check via analyzeResumeWithAI
  const handleRunAtsCheck = async () => {
    setIsAtsAnalyzing(true);
    try {
      const result = await analyzeResumeWithAI(formData);
      setAtsAnalysis(result);
      setFormData(prev => ({ ...prev, atsScore: result.atsScore }));
    } catch (err) {
      console.warn('ATS Check failed fallback:', err);
    } finally {
      setIsAtsAnalyzing(false);
    }
  };

  const handleSaveResume = () => {
    setResume(formData);
    recordUserActivity('resume', 'Resume Built & Saved Successfully', formData.atsScore || 90, 'Resume');
    setSaveSuccessMessage('🎉 Resume saved successfully to your profile!');
    setTimeout(() => setSaveSuccessMessage(''), 5000);
  };

  const handlePrintPDF = () => {
    handleSaveResume();
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Tag helper adding routine
  const handleAddSkillTag = (categoryKey: keyof typeof skillInputs, targetKey: keyof ResumeData) => {
    const val = skillInputs[categoryKey].trim();
    if (!val) return;
    const currentList = (formData[targetKey] as string[]) || [];
    if (!currentList.includes(val)) {
      setFormData({ ...formData, [targetKey]: [...currentList, val] });
    }
    setSkillInputs({ ...skillInputs, [categoryKey]: '' });
  };

  const handleRemoveSkillTag = (targetKey: keyof ResumeData, index: number) => {
    const currentList = (formData[targetKey] as string[]) || [];
    const updated = currentList.filter((_, i) => i !== index);
    setFormData({ ...formData, [targetKey]: updated });
  };

  return (
    <div className="flex-1 overflow-y-auto max-w-7xl mx-auto py-2 px-3 sm:px-6 space-y-6 relative animate-in fade-in duration-300 pb-20">
      {/* Hide controls on PDF Print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-resume-preview, #printable-resume-preview * {
            visibility: visible;
          }
          #printable-resume-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* TOP NAVBAR / HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToSelection}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Back to Selection"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk'] flex items-center gap-2">
              <span>Resume Builder & ATS</span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                Step {currentStep} of 12
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create a professional placement-ready resume step by step
            </p>
          </div>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center gap-2">
          {/* Mobile View Toggle */}
          <div className="lg:hidden flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setMobileViewMode('edit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                mobileViewMode === 'edit' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setMobileViewMode('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                mobileViewMode === 'preview' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          <button
            onClick={handleSaveResume}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save Progress</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* SAVE SUCCESS BANNER */}
      {saveSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in print:hidden">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* REDESIGNED FOCUSED STEP-BY-STEP PROGRESS BAR & NAVIGATION */}
      {(() => {
        const currentStepObj = steps.find((s) => s.num === currentStep) || steps[0];
        const isCompleted = isSectionCompleted(currentStep);
        const progressPercent = Math.round((currentStep / steps.length) * 100);

        return (
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-md space-y-3.5 print:hidden">
            {/* Step Header & Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold shadow-md shrink-0">
                  {currentStepObj.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      Step {currentStep} of {steps.length}
                    </span>
                    {isCompleted && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                    {currentStepObj.label}
                  </h2>
                </div>
              </div>

              {/* Step Previous & Next Quick Navigation */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={currentStep === 12}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow transition-all disabled:opacity-40 cursor-pointer"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Overall Wizard Progress Indicator */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>Wizard Progress</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Step Navigation Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              {steps.map((s) => {
                const isActive = currentStep === s.num;
                const isDone = isSectionCompleted(s.num);
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setCurrentStep(s.num)}
                    title={`Step ${s.num}: ${s.label}`}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-500/30 font-extrabold'
                        : isDone
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-[10px] opacity-75">{s.num}.</span>
                    <span className="whitespace-nowrap">{s.label}</span>
                    {isDone && <Check className="w-3 h-3 text-emerald-500 shrink-0 font-extrabold" />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* MAIN TWO-COLUMN 12-COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start relative">
        {/* LEFT COLUMN: WIZARD FORM INPUTS (7 COLS) */}
        <div className={`lg:col-span-7 space-y-6 w-full min-w-0 ${mobileViewMode === 'preview' ? 'hidden lg:block' : 'block'} print:hidden`}>
          {/* STEP 1: CHOOSE TEMPLATE GALLERY */}
          {currentStep === 1 && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk'] flex items-center gap-2">
                    <Layout className="w-5 h-5 text-indigo-500" />
                    <span>Resume Template Gallery</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Select a high-impact layout optimized for automated ATS parsers and technical recruiter reviews. Selecting a template instantly updates the Live Resume Preview.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 shrink-0">
                  Active: {formData.selectedTemplate?.toUpperCase() || 'MODERN'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {[
                  {
                    id: 'modern',
                    name: 'Modern Professional',
                    badge: 'Popular',
                    desc: 'Indigo accent header bar, clean modern typography, structured section dividers.',
                    previewHeader: 'bg-indigo-600 text-white p-3 rounded-t-lg',
                    previewLines: ['w-1/2 h-2.5 bg-white/80 rounded', 'w-1/3 h-2 bg-indigo-200/80 rounded mt-1']
                  },
                  {
                    id: 'ats-friendly',
                    name: 'ATS Maximum Parser',
                    badge: 'Recommended for ATS',
                    desc: 'Clean single-column structure, standard text headings, maximum parser compatibility.',
                    previewHeader: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white p-3 rounded-t-lg border-b-2 border-slate-900 dark:border-slate-400',
                    previewLines: ['w-2/3 h-2.5 bg-slate-800 dark:bg-slate-200 rounded', 'w-1/2 h-2 bg-slate-500 dark:bg-slate-400 rounded mt-1']
                  },
                  {
                    id: 'classic',
                    name: 'Classic Corporate',
                    badge: 'Standard Serif',
                    desc: 'Traditional corporate layout, serif headings, elegant top rule divider.',
                    previewHeader: 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-3 rounded-t-lg border-b-2 border-indigo-900 dark:border-indigo-400 text-center',
                    previewLines: ['w-1/2 h-2.5 bg-slate-900 dark:bg-slate-100 rounded mx-auto', 'w-1/3 h-2 bg-slate-600 dark:bg-slate-400 rounded mx-auto mt-1']
                  },
                  {
                    id: 'minimal',
                    name: 'Minimal Clean',
                    badge: 'Fresher Choice',
                    desc: 'Ultra-clean layout, border dividers, compact line spacing.',
                    previewHeader: 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-3 rounded-t-lg border-l-4 border-slate-600',
                    previewLines: ['w-1/2 h-2.5 bg-slate-800 dark:bg-slate-200 rounded', 'w-1/3 h-2 bg-slate-400 rounded mt-1']
                  }
                ].map((t) => {
                  const isSelected = formData.selectedTemplate === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setFormData({ ...formData, selectedTemplate: t.id as any })}
                      className={`group p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30 shadow-xl scale-[1.01]'
                          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-950/40 hover:shadow-md'
                      }`}
                    >
                      {/* Mini Mockup Visual Preview */}
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm group-hover:border-indigo-400/60 transition-colors">
                        <div className={t.previewHeader}>
                          <div className={t.previewLines[0]}></div>
                          <div className={t.previewLines[1]}></div>
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded"></div>
                          <div className="w-5/6 h-1.5 bg-slate-200 dark:bg-slate-800 rounded"></div>
                          <div className="flex gap-1 pt-1">
                            <div className="w-1/3 h-1 bg-indigo-500/40 rounded"></div>
                            <div className="w-1/3 h-1 bg-indigo-500/40 rounded"></div>
                            <div className="w-1/3 h-1 bg-indigo-500/40 rounded"></div>
                          </div>
                        </div>
                      </div>

                      {/* Info & Badges */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                            {t.badge}
                          </span>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{t.name}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.desc}</p>
                      </div>

                      {/* Select Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData({ ...formData, selectedTemplate: t.id as any });
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Currently Active</span>
                          </>
                        ) : (
                          <span>Use This Template →</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: PERSONAL INFORMATION */}
          {currentStep === 2 && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                  Personal Information
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter your official contact details for campus recruitment drives
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Alex Pandian"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                  {validationErrors.fullName && <p className="text-[11px] text-red-500 font-medium">{validationErrors.fullName}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Professional Headline / Title
                  </label>
                  <input
                    type="text"
                    value={formData.professionalTitle || ''}
                    onChange={(e) => setFormData({ ...formData, professionalTitle: e.target.value })}
                    placeholder="e.g. Computer Science Student | Aspiring SDE"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. alex@college.edu"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                  {validationErrors.email && <p className="text-[11px] text-red-500 font-medium">{validationErrors.email}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                  {validationErrors.phone && <p className="text-[11px] text-red-500 font-medium">{validationErrors.phone}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Location / City, State
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Chennai, Tamil Nadu"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="text"
                    value={formData.linkedIn || ''}
                    onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                    placeholder="e.g. linkedin.com/in/alex-pandian"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                  {validationErrors.linkedIn && <p className="text-[11px] text-red-500 font-medium">{validationErrors.linkedIn}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    GitHub Profile URL
                  </label>
                  <input
                    type="text"
                    value={formData.gitHub || ''}
                    onChange={(e) => setFormData({ ...formData, gitHub: e.target.value })}
                    placeholder="e.g. github.com/alexpandian"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                  {validationErrors.gitHub && <p className="text-[11px] text-red-500 font-medium">{validationErrors.gitHub}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Portfolio / Website URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.portfolio || ''}
                    onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                    placeholder="e.g. alexpandian.dev"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PROFESSIONAL SUMMARY */}
          {currentStep === 3 && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                    Professional Summary
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Highlight your core domain strengths, academic background, and passion for software engineering
                  </p>
                </div>

                {/* AI Actions Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateAISummary('generate')}
                    disabled={isAiLoading}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow hover:shadow-lg disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>Generate with AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateAISummary('improve')}
                    disabled={isAiLoading || !formData.summary.trim()}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-100 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Improve with AI</span>
                  </button>
                </div>
              </div>

              {aiError && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <div className="space-y-1">
                <textarea
                  rows={6}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="e.g. Motivated Computer Science graduate with hands-on experience building full-stack web applications in React and Node.js. Proficient in Data Structures, SQL databases, and Object-Oriented Programming, seeking an entry-level Software Development Engineer role."
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium leading-relaxed focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tip: You can edit AI-generated text directly to add specific achievements or target goals.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: EDUCATION */}
          {currentStep === 4 && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                    Education
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Add your degree details, university, department, and CGPA
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newEdu: EducationEntry = { degree: '', institution: '', department: '', startYear: '', endYear: '', graduationYear: '', cgpa: '' };
                    setFormData({ ...formData, education: [...formData.education, newEdu] });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Education</span>
                </button>
              </div>

              {validationErrors.degree && <p className="text-xs text-red-500 font-medium">{validationErrors.degree}</p>}
              {validationErrors.institution && <p className="text-xs text-red-500 font-medium">{validationErrors.institution}</p>}

              <div className="space-y-4">
                {formData.education.map((edu, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3 relative">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Education #{idx + 1}
                      </span>
                      {formData.education.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.education.filter((_, i) => i !== idx);
                            setFormData({ ...formData, education: updated });
                          }}
                          className="p-1 rounded-lg text-red-500 hover:bg-red-500/10"
                          title="Remove Education"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Degree / Qualification</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx].degree = e.target.value;
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="e.g. B.E. Computer Science & Engineering"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">College / Institution</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx].institution = e.target.value;
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="e.g. National Institute of Technology"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Department / Major</label>
                        <input
                          type="text"
                          value={edu.department || ''}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx].department = e.target.value;
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="e.g. Information Technology"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
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
                          placeholder="e.g. 8.75 / 10 or 87.5%"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Start Year</label>
                        <input
                          type="text"
                          value={edu.startYear || ''}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx].startYear = e.target.value;
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="e.g. 2022"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">End Year / Expected Graduation</label>
                        <input
                          type="text"
                          value={edu.endYear || edu.graduationYear || ''}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx].endYear = e.target.value;
                            updated[idx].graduationYear = e.target.value;
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="e.g. 2026"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: SKILLS (CHIP / TAG UI UNDER 6 CATEGORIES) */}
          {currentStep === 5 && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                  Technical Skills & Competencies
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Organize your tech stack under categorized skill tags for high ATS matching
                </p>
              </div>

              <div className="space-y-5">
                {[
                  { label: 'Programming Languages', key: 'prog' as const, target: 'programmingLanguages' as keyof ResumeData, placeholder: 'e.g. Java, Python, C++, TypeScript' },
                  { label: 'Web Technologies', key: 'web' as const, target: 'webTechnologies' as keyof ResumeData, placeholder: 'e.g. HTML5, CSS3, React.js, Next.js' },
                  { label: 'Frameworks & Libraries', key: 'frame' as const, target: 'frameworksLibraries' as keyof ResumeData, placeholder: 'e.g. Node.js, Express.js, Tailwind CSS' },
                  { label: 'Databases & DBMS', key: 'db' as const, target: 'databases' as keyof ResumeData, placeholder: 'e.g. SQL, MySQL, PostgreSQL, MongoDB' },
                  { label: 'Tools & Technologies', key: 'tool' as const, target: 'toolsAndTech' as keyof ResumeData, placeholder: 'e.g. Git, GitHub, VS Code, Postman' },
                  { label: 'Other Skills & Core Concepts', key: 'other' as const, target: 'otherSkills' as keyof ResumeData, placeholder: 'e.g. Data Structures, OOP, REST APIs' }
                ].map((cat) => {
                  const tagList = (formData[cat.target] as string[]) || [];
                  return (
                    <div key={cat.key} className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        {cat.label}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={skillInputs[cat.key]}
                          onChange={(e) => setSkillInputs({ ...skillInputs, [cat.key]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkillTag(cat.key, cat.target);
                            }
                          }}
                          placeholder={cat.placeholder}
                          className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSkillTag(cat.key, cat.target)}
                          className="px-3.5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add</span>
                        </button>
                      </div>

                      {/* Tag list rendering */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tagList.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkillTag(cat.target, tIdx)}
                              className="text-indigo-400 hover:text-indigo-600 dark:hover:text-white"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: PROJECTS */}
          {currentStep === 6 && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                    Projects
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Detail your academic, open-source, or personal software projects
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newProj: ProjectEntry = { title: '', description: '', techStack: ['React'], keyContributions: '', gitHubUrl: '' };
                    setFormData({ ...formData, projects: [...formData.projects, newProj] });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Project</span>
                </button>
              </div>

              {validationErrors.projectTitle && <p className="text-xs text-red-500 font-medium">{validationErrors.projectTitle}</p>}
              {validationErrors.projectDesc && <p className="text-xs text-red-500 font-medium">{validationErrors.projectDesc}</p>}

              <div className="space-y-4">
                {formData.projects.map((proj, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Project #{idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleImproveProjectWithAI(idx)}
                          disabled={isAiLoading || !proj.title}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold flex items-center gap-1 hover:bg-indigo-100 disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Improve with AI</span>
                        </button>
                        {formData.projects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.projects.filter((_, i) => i !== idx);
                              setFormData({ ...formData, projects: updated });
                            }}
                            className="p-1 rounded-lg text-red-500 hover:bg-red-500/10"
                            title="Remove Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Project Name / Title</label>
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => {
                            const updated = [...formData.projects];
                            updated[idx].title = e.target.value;
                            setFormData({ ...formData, projects: updated });
                          }}
                          placeholder="e.g. AI Mock Interview Simulator"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Description & Features</label>
                        <textarea
                          rows={3}
                          value={proj.description}
                          onChange={(e) => {
                            const updated = [...formData.projects];
                            updated[idx].description = e.target.value;
                            setFormData({ ...formData, projects: updated });
                          }}
                          placeholder="e.g. Engineered an AI placement assistant using React and TypeScript delivering dual-language feedback."
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Technologies Used (comma separated)</label>
                          <input
                            type="text"
                            value={Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack}
                            onChange={(e) => {
                              const updated = [...formData.projects];
                              updated[idx].techStack = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              setFormData({ ...formData, projects: updated });
                            }}
                            placeholder="e.g. React, Node.js, PostgreSQL"
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">GitHub / Project Link (Optional)</label>
                          <input
                            type="text"
                            value={proj.gitHubUrl || ''}
                            onChange={(e) => {
                              const updated = [...formData.projects];
                              updated[idx].gitHubUrl = e.target.value;
                              setFormData({ ...formData, projects: updated });
                            }}
                            placeholder="e.g. github.com/user/repository"
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: EXPERIENCE (OPTIONAL FOR FRESHERS) */}
          {currentStep === 7 && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                    Work & Internship Experience (Optional)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Optional section for students and freshers to detail internships or freelance projects
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newExp: InternshipEntry = { role: '', company: '', duration: '', description: '', location: '', startDate: '', endDate: '' };
                    setFormData({ ...formData, experience: [...formData.experience, newExp] });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Experience</span>
                </button>
              </div>

              {formData.experience.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                  <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">No experience added yet. Freshers can leave this section blank.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.experience.map((exp, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Experience #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.experience.filter((_, i) => i !== idx);
                            setFormData({ ...formData, experience: updated });
                          }}
                          className="p-1 rounded-lg text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Job / Internship Role</label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => {
                              const updated = [...formData.experience];
                              updated[idx].role = e.target.value;
                              setFormData({ ...formData, experience: updated });
                            }}
                            placeholder="e.g. Web Development Intern"
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Company / Organization</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => {
                              const updated = [...formData.experience];
                              updated[idx].company = e.target.value;
                              setFormData({ ...formData, experience: updated });
                            }}
                            placeholder="e.g. Tech Solutions Pvt Ltd"
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Location</label>
                          <input
                            type="text"
                            value={exp.location || ''}
                            onChange={(e) => {
                              const updated = [...formData.experience];
                              updated[idx].location = e.target.value;
                              setFormData({ ...formData, experience: updated });
                            }}
                            placeholder="e.g. Chennai / Remote"
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Duration / Dates</label>
                          <input
                            type="text"
                            value={exp.duration}
                            onChange={(e) => {
                              const updated = [...formData.experience];
                              updated[idx].duration = e.target.value;
                              setFormData({ ...formData, experience: updated });
                            }}
                            placeholder="e.g. Jun 2024 - Aug 2024 (3 mos)"
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Responsibilities / Achievements</label>
                        <textarea
                          rows={3}
                          value={exp.description}
                          onChange={(e) => {
                            const updated = [...formData.experience];
                            updated[idx].description = e.target.value;
                            setFormData({ ...formData, experience: updated });
                          }}
                          placeholder="e.g. Developed responsive frontend UI modules using React and integrated RESTful APIs."
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 8: CERTIFICATIONS */}
          {currentStep === 8 && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                    Certifications
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Add verified courses, online certifications, and domain credentials
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newCert: CertificationEntry = { title: '', issuer: '', year: '' };
                    setFormData({ ...formData, certifications: [...(formData.certifications || []), newCert] });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Certification</span>
                </button>
              </div>

              <div className="space-y-3">
                {(formData.certifications || []).map((cert, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Certification #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (formData.certifications || []).filter((_, i) => i !== idx);
                          setFormData({ ...formData, certifications: updated });
                        }}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

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
                          placeholder="e.g. AWS Certified Cloud Practitioner"
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
                          placeholder="e.g. Amazon Web Services / Coursera"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Date / Year</label>
                        <input
                          type="text"
                          value={cert.year || cert.date || ''}
                          onChange={(e) => {
                            const updated = [...(formData.certifications || [])];
                            updated[idx].year = e.target.value;
                            updated[idx].date = e.target.value;
                            setFormData({ ...formData, certifications: updated });
                          }}
                          placeholder="e.g. 2024"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Credential Link (Optional)</label>
                        <input
                          type="text"
                          value={cert.credentialUrl || ''}
                          onChange={(e) => {
                            const updated = [...(formData.certifications || [])];
                            updated[idx].credentialUrl = e.target.value;
                            setFormData({ ...formData, certifications: updated });
                          }}
                          placeholder="e.g. coursera.org/verify/credential-id"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 9: ACHIEVEMENTS & ACTIVITIES */}
          {currentStep === 9 && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                  Achievements & Co-Curricular Activities
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Add hackathon awards, leadership responsibilities, volunteering, and club positions
                </p>
              </div>

              {/* Achievements */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Key Achievements & Awards</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, achievements: [...(formData.achievements || []), ''] })}
                    className="text-xs text-indigo-600 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
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
                      placeholder="e.g. 1st Place Winner - Smart India Hackathon 2024"
                      className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (formData.achievements || []).filter((_, idx) => idx !== i);
                        setFormData({ ...formData, achievements: updated });
                      }}
                      className="p-2 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Leadership */}
              <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Leadership & Positions of Responsibility</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, leadership: [...(formData.leadership || []), ''] })}
                    className="text-xs text-indigo-600 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                {(formData.leadership || []).map((lead, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={lead}
                      onChange={(e) => {
                        const updated = [...(formData.leadership || [])];
                        updated[i] = e.target.value;
                        setFormData({ ...formData, leadership: updated });
                      }}
                      placeholder="e.g. President / Student Lead - Computer Society of India"
                      className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (formData.leadership || []).filter((_, idx) => idx !== i);
                        setFormData({ ...formData, leadership: updated });
                      }}
                      className="p-2 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 10: LANGUAGES & ADDITIONAL LINKS */}
          {currentStep === 10 && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                  Languages & Professional Links
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Specify spoken languages and technical profiles (LeetCode, HackerRank, CodeChef)
                </p>
              </div>

              {/* Languages */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Languages Spoken</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newLang: LanguageProficiency = { language: '', proficiency: 'Full Professional' };
                      setFormData({ ...formData, languages: [...(formData.languages || []), newLang] });
                    }}
                    className="text-xs text-indigo-600 font-bold flex items-center gap-1"
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
                      placeholder="e.g. English / Tamil / Hindi"
                      className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                    />
                    <select
                      value={l.proficiency}
                      onChange={(e) => {
                        const updated = [...(formData.languages || [])];
                        updated[idx].proficiency = e.target.value;
                        setFormData({ ...formData, languages: updated });
                      }}
                      className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
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
                      className="p-2 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Additional Professional Links */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Additional Coding Profiles & Links</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newLink: AdditionalLink = { platform: 'LeetCode', url: '' };
                      setFormData({ ...formData, additionalLinks: [...(formData.additionalLinks || []), newLink] });
                    }}
                    className="text-xs text-indigo-600 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Link
                  </button>
                </div>

                {(formData.additionalLinks || []).map((al, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={al.platform}
                      onChange={(e) => {
                        const updated = [...(formData.additionalLinks || [])];
                        updated[idx].platform = e.target.value;
                        setFormData({ ...formData, additionalLinks: updated });
                      }}
                      placeholder="e.g. LeetCode / HackerRank"
                      className="w-1/3 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                    />
                    <input
                      type="text"
                      value={al.url}
                      onChange={(e) => {
                        const updated = [...(formData.additionalLinks || [])];
                        updated[idx].url = e.target.value;
                        setFormData({ ...formData, additionalLinks: updated });
                      }}
                      placeholder="e.g. leetcode.com/u/candidate"
                      className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (formData.additionalLinks || []).filter((_, i) => i !== idx);
                        setFormData({ ...formData, additionalLinks: updated });
                      }}
                      className="p-2 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 11: REVIEW RESUME */}
          {currentStep === 11 && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                  Review Your Resume
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Audit all resume sections before finalizing or running ATS checks
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Personal */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{formData.fullName || 'No Name Provided'}</h3>
                    <p className="text-slate-500">{formData.professionalTitle} | {formData.email} | {formData.phone}</p>
                  </div>
                  <button onClick={() => setCurrentStep(2)} className="text-indigo-600 font-bold underline">Edit</button>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">Summary</h3>
                    <p className="text-slate-600 dark:text-slate-400 italic leading-relaxed">{formData.summary || 'No summary provided.'}</p>
                  </div>
                  <button onClick={() => setCurrentStep(3)} className="text-indigo-600 font-bold underline shrink-0">Edit</button>
                </div>

                {/* Education */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">Education ({formData.education.length})</h3>
                    {formData.education.map((e, idx) => (
                      <div key={idx} className="text-slate-600 dark:text-slate-400">• {e.degree} — {e.institution} ({e.cgpa})</div>
                    ))}
                  </div>
                  <button onClick={() => setCurrentStep(4)} className="text-indigo-600 font-bold underline shrink-0">Edit</button>
                </div>

                {/* Projects */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">Projects ({formData.projects.length})</h3>
                    {formData.projects.map((p, idx) => (
                      <div key={idx} className="text-slate-600 dark:text-slate-400">• {p.title}</div>
                    ))}
                  </div>
                  <button onClick={() => setCurrentStep(6)} className="text-indigo-600 font-bold underline shrink-0">Edit</button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 12: ATS CHECK & FINISH */}
          {currentStep === 12 && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk'] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  <span>ATS Score Audit & Finalize</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Run an instant AI ATS parser audit on your completed resume data to optimize keywords and formatting before exporting.
                </p>
              </div>

              {/* ATS Check Action Card */}
              <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1 max-w-md">
                  <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 block flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>AI Resume Parser Audit</span>
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Evaluates candidate contact details, technical skill density, project action verbs, and structural parseability.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunAtsCheck}
                  disabled={isAtsAnalyzing}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <BarChart3 className="w-4 h-4 text-white" />
                  <span>{isAtsAnalyzing ? 'Analyzing Real Data...' : 'Run ATS Audit Now →'}</span>
                </button>
              </div>

              {/* ATS Results Output View */}
              {atsAnalysis && (
                <div className="p-6 rounded-2xl bg-slate-900 text-white border border-indigo-500/30 shadow-xl space-y-5 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center font-black text-2xl text-emerald-400 shrink-0">
                        {atsAnalysis.atsScore}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                          {atsAnalysis.atsScore >= 80 ? 'Placement Ready' : atsAnalysis.atsScore >= 60 ? 'Moderate Compatibility' : 'Action Required'}
                        </span>
                        <h3 className="text-base font-extrabold text-white font-['Space_Grotesk'] mt-1">
                          ATS Parser Compatibility Score
                        </h3>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      Based on user-entered content
                    </span>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="font-extrabold text-emerald-400 block flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Matched Keywords ({atsAnalysis.matchedSkills.length})</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {atsAnalysis.matchedSkills.length > 0 ? (
                          atsAnalysis.matchedSkills.map((sk, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold">
                              {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No matched skills detected yet. Add skills in Step 5.</span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="font-extrabold text-amber-400 block flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        <span>Recommended Keyword Additions</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {atsAnalysis.missingSkills.length > 0 ? (
                          atsAnalysis.missingSkills.map((sk, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-semibold">
                              + {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Great coverage! Essential placement keywords are present.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Readiness Breakdown */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                      Section Readiness Audit
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Personal Info</span>
                        <span className={`font-bold ${formData.fullName && formData.email ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {formData.fullName && formData.email ? '✓ Complete' : '⚠️ Pending'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Education</span>
                        <span className={`font-bold ${(formData.education || []).length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {(formData.education || []).length > 0 ? '✓ Complete' : '⚠️ Missing'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Tech Skills</span>
                        <span className={`font-bold ${(formData.programmingLanguages || []).length > 0 || (formData.skills || []).length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {(formData.programmingLanguages || []).length > 0 || (formData.skills || []).length > 0 ? '✓ Added' : '⚠️ Add Skills'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Projects</span>
                        <span className={`font-bold ${(formData.projects || []).length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {(formData.projects || []).length > 0 ? '✓ Added' : '⚠️ Add Project'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Final Export Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveResume}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Save Resume Profile</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintPDF}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/25 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Resume PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* PREV / NEXT NAVIGATION CONTROLS */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 print:hidden">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {currentStep === 12 ? (
              <button
                type="button"
                onClick={handleSaveResume}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Finish & Save Resume</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow hover:shadow-lg"
              >
                <span>{currentStep === 11 ? 'Continue to ATS' : 'Next Step'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY LIVE RESUME PREVIEW (5 COLS) */}
        <div
          id="printable-resume-preview"
          className={`lg:col-span-5 lg:sticky lg:top-4 w-full min-w-0 ${
            mobileViewMode === 'edit' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 bg-slate-900/95 dark:bg-slate-950/95 text-white shadow-xl space-y-4 print:bg-white print:p-0 print:border-none overflow-hidden w-full box-border">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold font-['Space_Grotesk'] text-white">Live Resume Preview</span>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                {formData.selectedTemplate?.toUpperCase() || 'MODERN'}
              </span>
            </div>

            {/* LIVE RENDERER: Authentic A4 Paper Canvas */}
            <div className="max-h-[calc(100vh-160px)] overflow-y-auto overflow-x-hidden w-full min-w-0 rounded-2xl p-3 sm:p-4 bg-slate-950/60 border border-slate-800/80 scrollbar-thin scrollbar-thumb-slate-700 print:max-h-none print:p-0 print:bg-transparent print:border-none print:overflow-visible flex justify-center">
              <div className="w-full max-w-[794px] bg-white text-slate-900 rounded shadow-2xl overflow-hidden border border-slate-200/80 transition-all duration-300 transform-gpu">
                <ResumePreviewTemplates data={formData} template={formData.selectedTemplate || 'modern'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderWizard;
