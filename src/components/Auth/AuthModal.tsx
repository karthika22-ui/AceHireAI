import React, { useState } from 'react';
import { X, Sparkles, User, GraduationCap, Building2, Globe, Mail, Lock, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LanguagePreference } from '../../types';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, user, setUser } = useApp();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('signup');

  // Form fields
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [college, setCollege] = useState(user.college);
  const [department, setDepartment] = useState(user.department);
  const [year, setYear] = useState(user.year);
  const [dreamCompany, setDreamCompany] = useState(user.dreamCompany);
  const [customCompany, setCustomCompany] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguagePreference>(user.preferredLanguage);

  const topCompanies = ['Zoho', 'TCS', 'Google', 'Microsoft', 'Amazon', 'Infosys', 'Accenture', 'Cognizant', 'Wipro', 'HCLTech', 'Custom'];

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCompany = dreamCompany === 'Custom' ? (customCompany || 'Tech Giant') : dreamCompany;
    
    setUser({
      ...user,
      name,
      email,
      college,
      department,
      year,
      dreamCompany: finalCompany,
      preferredLanguage
    });

    setIsAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AceHire AI Placement Profile</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {mode === 'signup' ? 'Create Student Profile' : mode === 'login' ? 'Welcome Back' : 'Reset Password'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tailor AI Mock Interviews & Dual-Language Feedback to your goals.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Karthik Subramanian"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    College / University
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. CEG Anna Univ"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. CSE / ECE / IT"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dream Company Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Dream Company
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                  {topCompanies.map((comp) => (
                    <button
                      type="button"
                      key={comp}
                      onClick={() => setDreamCompany(comp)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        dreamCompany === comp
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {comp}
                    </button>
                  ))}
                </div>
                {dreamCompany === 'Custom' && (
                  <input
                    type="text"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    placeholder="Enter custom company name..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm mt-1"
                  />
                )}
              </div>

              {/* Preferred Language Dual Option */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  AI Feedback Explanation Language
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPreferredLanguage('Tanglish')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      preferredLanguage === 'Tanglish'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-sm">
                      <span>Tanglish</span>
                      <span className="tanglish-badge px-2 py-0.5 rounded text-[10px]">Tamil+English</span>
                    </div>
                    <p className="text-xs opacity-80 mt-1">
                      "Interested apram eppovume 'in' use pannanum."
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferredLanguage('English')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      preferredLanguage === 'English'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-900 dark:text-blue-300 ring-2 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-sm">
                      <span>English</span>
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">Standard</span>
                    </div>
                    <p className="text-xs opacity-80 mt-1">
                      "Interested should always be followed by 'in'."
                    </p>
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl btn-primary text-white font-bold text-base flex items-center justify-center gap-2 mt-4"
          >
            <span>Save Profile & Start Preparing</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Switch */}
        <div className="text-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          {mode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-blue-500 font-bold hover:underline">
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need a profile?{' '}
              <button onClick={() => setMode('signup')} className="text-blue-500 font-bold hover:underline">
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
