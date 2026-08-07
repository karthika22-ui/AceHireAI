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
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ResumeData, EducationEntry, ProjectEntry, CertificationEntry, InternshipEntry } from '../../types';
import { ResumePreviewTemplates } from './ResumePreviewTemplates';

interface ResumeBuilderWizardProps {
  onBackToSelection: () => void;
}

export const ResumeBuilderWizard: React.FC<ResumeBuilderWizardProps> = ({ onBackToSelection }) => {
  const { resume, setResume, recordUserActivity } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');

  // Pre-fill state from existing resume data if available
  const [formData, setFormData] = useState<ResumeData>(() => ({
    fullName: resume?.fullName || '',
    email: resume?.email || '',
    phone: resume?.phone || '',
    location: resume?.location || '',
    linkedIn: resume?.linkedIn || '',
    gitHub: resume?.gitHub || '',
    portfolio: resume?.portfolio || '',
    summary: resume?.summary || '',
    education: resume?.education && resume.education.length > 0 ? resume.education : [
      { degree: '', institution: '', university: '', graduationYear: '', cgpa: '' }
    ],
    skills: resume?.skills || [],
    programmingLanguages: resume?.programmingLanguages || ['Java', 'Python', 'JavaScript'],
    technicalSkills: resume?.technicalSkills || ['Data Structures', 'React.js', 'SQL'],
    toolsAndTech: resume?.toolsAndTech || ['Git', 'VS Code'],
    projects: resume?.projects && resume.projects.length > 0 ? resume.projects : [
      { title: '', description: '', techStack: ['React', 'Node.js'], gitHubUrl: '', demoUrl: '' }
    ],
    experience: resume?.experience || [],
    certifications: resume?.certifications || [],
    achievements: resume?.achievements || [],
    workshops: resume?.workshops || [],
    selectedTemplate: resume?.selectedTemplate || 'modern'
  }));

  // Skill input tag scratch state
  const [langInput, setLangInput] = useState<string>('');
  const [techInput, setTechInput] = useState<string>('');
  const [toolsInput, setToolsInput] = useState<string>('');

  // Step names & icons
  const steps = [
    { num: 1, label: 'Personal', icon: <User className="w-4 h-4" /> },
    { num: 2, label: 'Summary', icon: <FileText className="w-4 h-4" /> },
    { num: 3, label: 'Education', icon: <GraduationCap className="w-4 h-4" /> },
    { num: 4, label: 'Skills', icon: <Code2 className="w-4 h-4" /> },
    { num: 5, label: 'Projects', icon: <FolderGit2 className="w-4 h-4" /> },
    { num: 6, label: 'Certifications', icon: <Award className="w-4 h-4" /> },
    { num: 7, label: 'Template', icon: <Layout className="w-4 h-4" /> },
    { num: 8, label: 'Preview', icon: <Eye className="w-4 h-4" /> }
  ];

  // Helper validation routines
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateUrl = (url: string) => !url || /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i.test(url);

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
      if (!formData.email.trim()) errors.email = 'Email address is required';
      else if (!validateEmail(formData.email)) errors.email = 'Please enter a valid email address';
      if (!formData.phone.trim()) errors.phone = 'Phone number is required';
      if (formData.linkedIn && !validateUrl(formData.linkedIn)) errors.linkedIn = 'Invalid LinkedIn URL format';
      if (formData.gitHub && !validateUrl(formData.gitHub)) errors.gitHub = 'Invalid GitHub URL format';
      if (formData.portfolio && !validateUrl(formData.portfolio)) errors.portfolio = 'Invalid Portfolio URL format';
    }

    if (currentStep === 3) {
      if (!formData.education || formData.education.length === 0) {
        errors.education = 'Please add at least one education entry';
      } else {
        const firstEdu = formData.education[0];
        if (!firstEdu.degree.trim()) errors.degree = 'Degree is required';
        if (!firstEdu.institution.trim()) errors.institution = 'College / Institution is required';
      }
    }

    if (currentStep === 5) {
      if (formData.projects && formData.projects.length > 0) {
        const firstProj = formData.projects[0];
        if (!firstProj.title.trim()) errors.projectTitle = 'Project Name is required';
        if (!firstProj.description.trim()) errors.projectDesc = 'Project Description is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < 8) {
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

  const handleSaveAndGenerate = () => {
    setResume(formData);
    recordUserActivity('resume', 'Resume Built & Saved Successfully', 95, 'Resume');
    setSaveSuccessMessage('🎉 Resume saved successfully! Your readiness score has been updated.');
    setTimeout(() => setSaveSuccessMessage(''), 5000);
  };

  const handlePrintPDF = () => {
    handleSaveAndGenerate();
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // --- Education Handlers ---
  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', university: '', graduationYear: '', cgpa: '' }]
    }));
  };

  const removeEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateEducation = (index: number, field: keyof EducationEntry, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  };

  // --- Project Handlers ---
  const addProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [...prev.projects, { title: '', description: '', techStack: [], gitHubUrl: '', demoUrl: '' }]
    }));
  };

  const removeProject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const updateProject = (index: number, field: keyof ProjectEntry, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.projects];
      if (field === 'techStack' && typeof value === 'string') {
        const stackArr = value.split(',').map((s) => s.trim()).filter(Boolean);
        updated[index] = { ...updated[index], techStack: stackArr };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, projects: updated };
    });
  };

  // --- Skill Chip Handlers ---
  const addTag = (category: 'programmingLanguages' | 'technicalSkills' | 'toolsAndTech', val: string) => {
    const clean = val.trim();
    if (!clean) return;
    setFormData((prev) => {
      const list = prev[category] || [];
      if (!list.includes(clean)) {
        return { ...prev, [category]: [...list, clean] };
      }
      return prev;
    });
  };

  const removeTag = (category: 'programmingLanguages' | 'technicalSkills' | 'toolsAndTech', tag: string) => {
    setFormData((prev) => ({
      ...prev,
      [category]: (prev[category] || []).filter((t) => t !== tag)
    }));
  };

  // --- Certification Handlers ---
  const addCertification = () => {
    setFormData((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), { title: '', issuer: '', year: '' }]
    }));
  };

  const removeCertification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter((_, i) => i !== index)
    }));
  };

  const updateCertification = (index: number, field: keyof CertificationEntry, value: string) => {
    setFormData((prev) => {
      const updated = [...(prev.certifications || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, certifications: updated };
    });
  };

  // --- Achievement Handlers ---
  const addAchievement = () => {
    setFormData((prev) => ({
      ...prev,
      achievements: [...(prev.achievements || []), '']
    }));
  };

  const removeAchievement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      achievements: (prev.achievements || []).filter((_, i) => i !== index)
    }));
  };

  const updateAchievement = (index: number, value: string) => {
    setFormData((prev) => {
      const updated = [...(prev.achievements || [])];
      updated[index] = value;
      return { ...prev, achievements: updated };
    });
  };

  return (
    <div className="flex-1 overflow-y-auto max-w-5xl mx-auto py-2 px-4 sm:px-6 relative animate-in fade-in duration-300">
      {/* Print Stylesheet Overrides */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #resume-printable-container, #resume-printable-container * {
            visibility: visible;
          }
          #resume-printable-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      {/* Ambient Lighting */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />

      {/* CHANGE 2: MASTER RESUME BUILDER HIGH-CONTRAST ROUNDED CONTAINER CARD */}
      <div className="glass-card rounded-[28px] p-6 sm:p-8 sm:p-10 border border-slate-200/90 dark:border-purple-500/25 bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl shadow-2xl hover:shadow-[0_0_40px_rgba(59,130,246,0.12)] transition-all duration-300 relative overflow-hidden space-y-7">
        
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <button
              onClick={onBackToSelection}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-cyan-400 mb-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Resume Options</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk']">
              Build Your Resume
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              Create a professional, ATS-friendly resume step by step.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-extrabold px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 shadow-sm">
              Step {currentStep} of 8
            </span>
          </div>
        </div>

        {/* SUCCESS NOTIFICATION TOAST */}
        {saveSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>{saveSuccessMessage}</span>
            </div>
          </div>
        )}

        {/* STEP PROGRESS BAR / NAVIGATION CHIPS */}
        <div className="rounded-2xl p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 backdrop-blur-xl shadow-inner overflow-x-auto">
        <div className="flex items-center justify-between min-w-[650px] gap-2">
          {steps.map((step) => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <button
                key={step.num}
                onClick={() => {
                  if (step.num < currentStep || validateCurrentStep()) {
                    setCurrentStep(step.num);
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-[1.02]'
                    : isCompleted
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                  isActive ? 'bg-white/20 text-white font-black' : isCompleted ? 'bg-emerald-500 text-white font-bold' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {isCompleted ? <Check className="w-3 h-3" /> : step.num}
                </span>
                <span className="truncate">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* WIZARD CARD CONTAINER */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-purple-500/20 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-6 relative overflow-hidden">
        
        {/* ================= STEP 1: PERSONAL INFORMATION ================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                <User className="w-5 h-5 text-blue-500" />
                <span>Personal Information</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Enter your contact details so recruiters can reach you easily.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Karthika Ramanathan"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                    validationErrors.fullName
                      ? 'border-red-500 focus:ring-red-500/30'
                      : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                {validationErrors.fullName && (
                  <p className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {validationErrors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. karthika@college.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                    validationErrors.email
                      ? 'border-red-500 focus:ring-red-500/30'
                      : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                {validationErrors.email && (
                  <p className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                    validationErrors.phone
                      ? 'border-red-500 focus:ring-red-500/30'
                      : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                {validationErrors.phone && (
                  <p className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {validationErrors.phone}
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Location (City, State / Country)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chennai, Tamil Nadu, India"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {/* LinkedIn URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  LinkedIn Profile URL
                </label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/karthika"
                  value={formData.linkedIn || ''}
                  onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                {validationErrors.linkedIn && (
                  <p className="text-[11px] font-bold text-red-500">{validationErrors.linkedIn}</p>
                )}
              </div>

              {/* GitHub URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  GitHub Profile URL
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/karthika"
                  value={formData.gitHub || ''}
                  onChange={(e) => setFormData({ ...formData, gitHub: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                {validationErrors.gitHub && (
                  <p className="text-[11px] font-bold text-red-500">{validationErrors.gitHub}</p>
                )}
              </div>

              {/* Portfolio URL */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Portfolio / Personal Website URL
                </label>
                <input
                  type="text"
                  placeholder="https://karthika.dev"
                  value={formData.portfolio || ''}
                  onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: CAREER SUMMARY ================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                <FileText className="w-5 h-5 text-indigo-500" />
                <span>Career Summary / Objective</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Summarize your academic background, core strengths, and career ambitions.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                Professional Summary Text
              </label>
              <textarea
                rows={6}
                placeholder="Write 3-4 impactful sentences highlighting your skills, education, and career aspirations..."
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all leading-relaxed"
              />
            </div>

            {/* Quick Suggestions for Freshers */}
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4" /> Fresher Summary Templates (Click to apply)
              </span>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      summary:
                        'Motivated Computer Science graduate with strong hands-on experience in Java, Python, and full-stack web development. Eager to leverage analytical skills and technical problem-solving to build scalable software solutions in a dynamic team environment.'
                    })
                  }
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-500 text-left text-xs font-medium text-slate-700 dark:text-slate-300 transition-all"
                >
                  💡 <strong>Software Development Focus:</strong> "Motivated Computer Science graduate with strong hands-on experience in Java, Python..."
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      summary:
                        'Analytical B.Tech candidate specializing in Data Structures, SQL, and Machine Learning algorithms. Proven track record in academic projects and placement coding challenges. Seeking an entry-level Software Engineer role.'
                    })
                  }
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-500 text-left text-xs font-medium text-slate-700 dark:text-slate-300 transition-all"
                >
                  💡 <strong>Core Engineering & Problem Solving:</strong> "Analytical B.Tech candidate specializing in Data Structures, SQL..."
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: EDUCATION ================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                  <GraduationCap className="w-5 h-5 text-blue-500" />
                  <span>Education Details</span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Add your college degree, university, graduation year, and academic scores.
                </p>
              </div>

              <button
                type="button"
                onClick={addEducation}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Education</span>
              </button>
            </div>

            {validationErrors.education && (
              <p className="text-xs font-bold text-red-500">{validationErrors.education}</p>
            )}

            <div className="space-y-5">
              {formData.education.map((edu, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4 relative group"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <span className="text-xs font-extrabold text-blue-600 dark:text-cyan-400 uppercase tracking-wider">
                      Education #{idx + 1}
                    </span>
                    {formData.education.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEducation(idx)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        Degree / Branch <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. B.Tech Computer Science & Engineering"
                        value={edu.degree}
                        onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        College / Institution <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Anna University College of Engineering"
                        value={edu.institution}
                        onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        University (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Anna University"
                        value={edu.university || ''}
                        onChange={(e) => updateEducation(idx, 'university', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          Graduation Year
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 2026"
                          value={edu.graduationYear || ''}
                          onChange={(e) => updateEducation(idx, 'graduationYear', e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          CGPA / Percentage
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 8.6 / 10"
                          value={edu.cgpa}
                          onChange={(e) => updateEducation(idx, 'cgpa', e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= STEP 4: SKILLS ================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                <Code2 className="w-5 h-5 text-purple-500" />
                <span>Skills & Competencies</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Add programming languages, technical concepts, and software tools.
              </p>
            </div>

            {/* Category 1: Programming Languages */}
            <div className="space-y-2.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                Programming Languages
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a language (e.g. Java, Python, C++) and press Enter..."
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag('programmingLanguages', langInput);
                      setLangInput('');
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    addTag('programmingLanguages', langInput);
                    setLangInput('');
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {(formData.programmingLanguages || []).map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-purple-500/15 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-500/30 flex items-center gap-1.5"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag('programmingLanguages', tag)}
                      className="hover:text-red-500 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Category 2: Technical Skills */}
            <div className="space-y-2.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                Technical Skills & Concepts
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type skill (e.g. Data Structures, React.js, SQL, REST APIs)..."
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag('technicalSkills', techInput);
                      setTechInput('');
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    addTag('technicalSkills', techInput);
                    setTechInput('');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {(formData.technicalSkills || []).map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-blue-500/15 text-blue-700 dark:text-cyan-300 text-xs font-bold border border-blue-500/30 flex items-center gap-1.5"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag('technicalSkills', tag)}
                      className="hover:text-red-500 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Category 3: Tools & Technologies */}
            <div className="space-y-2.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                Tools & Software Platforms
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type tool (e.g. Git, VS Code, Docker, Postman, Figma)..."
                  value={toolsInput}
                  onChange={(e) => setToolsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag('toolsAndTech', toolsInput);
                      setToolsInput('');
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    addTag('toolsAndTech', toolsInput);
                    setToolsInput('');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {(formData.toolsAndTech || []).map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag('toolsAndTech', tag)}
                      className="hover:text-red-500 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: PROJECTS ================= */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                  <FolderGit2 className="w-5 h-5 text-blue-500" />
                  <span>Projects & Work Experience</span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Showcase academic projects, hackathons, or personal applications built.
                </p>
              </div>

              <button
                type="button"
                onClick={addProject}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            </div>

            <div className="space-y-5">
              {formData.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4 relative"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <span className="text-xs font-extrabold text-blue-600 dark:text-cyan-400 uppercase tracking-wider">
                      Project #{idx + 1}
                    </span>
                    {formData.projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProject(idx)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        Project Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. HasHire AI Placement Platform"
                        value={proj.title}
                        onChange={(e) => updateProject(idx, 'title', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        Project Description & Impact <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Describe key features, your individual role, and outcomes achieved..."
                        value={proj.description}
                        onChange={(e) => updateProject(idx, 'description', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          Technologies Used (comma separated)
                        </label>
                        <input
                          type="text"
                          placeholder="React, TypeScript, Node.js"
                          value={Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack}
                          onChange={(e) => updateProject(idx, 'techStack', e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          GitHub Repository URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://github.com/user/project"
                          value={proj.gitHubUrl || ''}
                          onChange={(e) => updateProject(idx, 'gitHubUrl', e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          Live Demo URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://myproject.vercel.app"
                          value={proj.demoUrl || ''}
                          onChange={(e) => updateProject(idx, 'demoUrl', e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= STEP 6: CERTIFICATIONS & ACHIEVEMENTS ================= */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Certifications & Achievements</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Add verified certifications, hackathon awards, and training courses.
              </p>
            </div>

            {/* Certifications Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Certifications
                </h3>
                <button
                  type="button"
                  onClick={addCertification}
                  className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1 border border-amber-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Certification
                </button>
              </div>

              {(formData.certifications || []).map((cert, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Certification Title (e.g. AWS Certified Cloud Practitioner)"
                    value={cert.title}
                    onChange={(e) => updateCertification(idx, 'title', e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Issuer (e.g. NPTEL / Amazon)"
                    value={cert.issuer || ''}
                    onChange={(e) => updateCertification(idx, 'issuer', e.target.value)}
                    className="w-1/3 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeCertification(idx)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Achievements Section */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Achievements & Awards
                </h3>
                <button
                  type="button"
                  onClick={addAchievement}
                  className="px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1 border border-blue-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Achievement
                </button>
              </div>

              {(formData.achievements || []).map((ach, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="e.g. 1st Place in Smart India Hackathon 2025"
                    value={ach}
                    onChange={(e) => updateAchievement(idx, e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeAchievement(idx)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= STEP 7: RESUME TEMPLATE ================= */}
        {currentStep === 7 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                <Layout className="w-5 h-5 text-blue-500" />
                <span>Select Resume Template</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Choose an ATS-compliant template style tailored to your application targets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Template Option 1: Classic ATS */}
              <div
                onClick={() => setFormData({ ...formData, selectedTemplate: 'classic' })}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                  formData.selectedTemplate === 'classic'
                    ? 'border-blue-600 bg-blue-500/10 dark:bg-blue-500/15 shadow-xl shadow-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-slate-50/70 dark:bg-slate-950/60'
                }`}
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Max ATS Score
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">1. Classic ATS</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Traditional single-column layout optimized for 95%+ pass rates on corporate ATS filters.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-blue-600 dark:text-cyan-400">
                  <span>{formData.selectedTemplate === 'classic' ? '✓ Selected' : 'Select Template'}</span>
                </div>
              </div>

              {/* Template Option 2: Modern Professional */}
              <div
                onClick={() => setFormData({ ...formData, selectedTemplate: 'modern' })}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                  formData.selectedTemplate === 'modern'
                    ? 'border-indigo-600 bg-indigo-500/10 dark:bg-indigo-500/15 shadow-xl shadow-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50/70 dark:bg-slate-950/60'
                }`}
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    Most Popular
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">2. Modern Professional</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Sleek indigo accent bars, structured section hierarchy, and clean modern font styling.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>{formData.selectedTemplate === 'modern' ? '✓ Selected' : 'Select Template'}</span>
                </div>
              </div>

              {/* Template Option 3: Minimal Fresher */}
              <div
                onClick={() => setFormData({ ...formData, selectedTemplate: 'minimal' })}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                  formData.selectedTemplate === 'minimal'
                    ? 'border-purple-600 bg-purple-500/10 dark:bg-purple-500/15 shadow-xl shadow-purple-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-purple-400 bg-slate-50/70 dark:bg-slate-950/60'
                }`}
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Fresher Choice
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">3. Minimal Fresher</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Clean minimalist dividers with dual-column grid emphasis on education & core technical skills.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-purple-600 dark:text-purple-400">
                  <span>{formData.selectedTemplate === 'minimal' ? '✓ Selected' : 'Select Template'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 8: LIVE PREVIEW & FINAL ACTIONS ================= */}
        {currentStep === 8 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                  <Eye className="w-5 h-5 text-emerald-500" />
                  <span>Resume Preview</span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Live preview formatted in real-time with your entered information.
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Details
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndGenerate}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Generate Resume
                </button>

                <button
                  type="button"
                  onClick={handlePrintPDF}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            </div>

            {/* Printable Preview Component Wrapper */}
            <div id="resume-printable-container" className="overflow-x-auto py-2">
              <ResumePreviewTemplates
                data={formData}
                template={formData.selectedTemplate || 'modern'}
              />
            </div>
          </div>
        )}

        {/* BOTTOM NAVIGATION FOOTER */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            )}
          </div>

          <div>
            {currentStep < 8 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
              >
                <span>Save & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveAndGenerate}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Generate Resume</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  </div>
);
};
