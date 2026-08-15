import React from 'react';
import { ResumeData } from '../../types';

interface ResumePreviewTemplatesProps {
  data: ResumeData;
  template?: string;
}

export const ResumePreviewTemplates: React.FC<ResumePreviewTemplatesProps> = ({ data, template = 'modern' }) => {
  const {
    fullName,
    professionalTitle,
    email,
    phone,
    location,
    linkedIn,
    gitHub,
    portfolio,
    summary,
    education = [],
    skills = [],
    programmingLanguages = [],
    webTechnologies = [],
    frameworksLibraries = [],
    databases = [],
    toolsAndTech = [],
    otherSkills = [],
    technicalSkills = [],
    projects = [],
    experience = [],
    certifications = [],
    achievements = [],
    leadership = [],
    clubsVolunteering = [],
    extracurriculars = [],
    workshops = [],
    languages = [],
    additionalLinks = []
  } = data;

  // Combine all skills for structured views
  const allSkillsList = Array.from(
    new Set([
      ...programmingLanguages,
      ...webTechnologies,
      ...frameworksLibraries,
      ...databases,
      ...toolsAndTech,
      ...technicalSkills,
      ...otherSkills,
      ...skills
    ])
  ).filter(Boolean);

  const keySkillsCategorized = [
    { label: 'Languages', items: programmingLanguages },
    { label: 'Web Tech', items: webTechnologies },
    { label: 'Frameworks', items: frameworksLibraries },
    { label: 'Databases', items: databases },
    { label: 'Tools', items: toolsAndTech },
    { label: 'Technical', items: technicalSkills },
    { label: 'Other', items: otherSkills }
  ].filter((cat) => cat.items && cat.items.length > 0);

  const tId = (template || 'modern').toLowerCase();

  // Helper for contact details line
  const renderContactBar = (separator = '•') => (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
      {email && <span>{email}</span>}
      {phone && <span>{separator} {phone}</span>}
      {location && <span>{separator} {location}</span>}
      {linkedIn && <span>{separator} LinkedIn: {linkedIn}</span>}
      {gitHub && <span>{separator} GitHub: {gitHub}</span>}
      {portfolio && <span>{separator} Portfolio: {portfolio}</span>}
    </div>
  );

  // Helper for skills list rendering
  const renderCategorizedSkills = () => (
    <div className="text-xs space-y-1 text-slate-800">
      {keySkillsCategorized.length > 0 ? (
        keySkillsCategorized.map((cat, idx) => (
          <div key={idx}>
            <span className="font-bold text-slate-900">{cat.label}:</span> {cat.items.join(', ')}
          </div>
        ))
      ) : (
        <div>{allSkillsList.join(', ')}</div>
      )}
    </div>
  );

  // Helper for projects section
  const renderProjectsSection = (titleClass = 'text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2') => (
    projects.length > 0 && (
      <div className="space-y-2 mt-4 text-left">
        <h2 className={titleClass}>Projects</h2>
        <div className="space-y-2.5">
          {projects.map((proj, idx) => (
            <div key={idx} className="text-xs space-y-0.5">
              <div className="flex justify-between items-baseline font-bold text-slate-900">
                <span>{proj.title}</span>
                {proj.gitHubUrl && <span className="text-[10px] text-blue-600 font-normal">GitHub: {proj.gitHubUrl}</span>}
              </div>
              {proj.techStack && proj.techStack.length > 0 && (
                <div className="text-[11px] font-semibold text-indigo-700">
                  Tech Stack: {Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack}
                </div>
              )}
              {proj.description && <p className="text-slate-700 leading-relaxed text-[11px]">{proj.description}</p>}
              {proj.keyContributions && (
                <p className="text-slate-700 text-[11px] font-medium pt-0.5">• Key Contributions: {proj.keyContributions}</p>
              )}
              {proj.demoUrl && <div className="text-[10px] text-blue-600">Demo: {proj.demoUrl}</div>}
            </div>
          ))}
        </div>
      </div>
    )
  );

  // Helper for experience section
  const renderExperienceSection = (titleClass = 'text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2') => (
    experience.length > 0 && (
      <div className="space-y-2 mt-4 text-left">
        <h2 className={titleClass}>Experience & Internships</h2>
        <div className="space-y-2.5">
          {experience.map((exp, idx) => (
            <div key={idx} className="text-xs space-y-0.5">
              <div className="flex justify-between items-baseline font-bold text-slate-900">
                <span>{exp.role} — {exp.company}</span>
                <span className="text-[11px] font-normal text-slate-600">{exp.duration || `${exp.startDate || ''} - ${exp.endDate || ''}`}</span>
              </div>
              {exp.location && <div className="text-[11px] text-slate-500">{exp.location}</div>}
              {exp.description && <p className="text-slate-700 leading-relaxed text-[11px]">{exp.description}</p>}
            </div>
          ))}
        </div>
      </div>
    )
  );

  // Helper for education section
  const renderEducationSection = (titleClass = 'text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2') => (
    education.length > 0 && (
      <div className="space-y-2 mt-4 text-left">
        <h2 className={titleClass}>Education</h2>
        <div className="space-y-2">
          {education.map((edu, idx) => (
            <div key={idx} className="text-xs">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{edu.degree}{edu.department ? ` (${edu.department})` : ''}</span>
                <span>{edu.startYear && edu.endYear ? `${edu.startYear} - ${edu.endYear}` : edu.graduationYear || ''}</span>
              </div>
              <div className="flex justify-between text-slate-700 text-[11px]">
                <span>{edu.institution}{edu.university ? `, ${edu.university}` : ''}{edu.location ? ` | ${edu.location}` : ''}</span>
                {edu.cgpa && <span className="font-semibold">CGPA/Score: {edu.cgpa}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  );

  // Helper for certifications & achievements
  const renderCertificationsSection = (titleClass = 'text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2') => (
    (certifications.length > 0 || achievements.length > 0 || leadership.length > 0 || languages.length > 0) && (
      <div className="space-y-2 mt-4 text-left text-xs">
        <h2 className={titleClass}>Certifications, Achievements & Languages</h2>
        <div className="space-y-1.5 text-slate-800">
          {certifications.length > 0 && (
            <div>
              <span className="font-bold text-slate-900">Certifications: </span>
              {certifications.map((c) => `${c.title}${c.issuer ? ` (${c.issuer})` : ''}`).join(', ')}
            </div>
          )}
          {achievements.length > 0 && (
            <div>
              <span className="font-bold text-slate-900">Key Achievements: </span>
              {achievements.join(' • ')}
            </div>
          )}
          {leadership.length > 0 && (
            <div>
              <span className="font-bold text-slate-900">Leadership & Activities: </span>
              {leadership.join(' • ')}
            </div>
          )}
          {languages.length > 0 && (
            <div>
              <span className="font-bold text-slate-900">Languages: </span>
              {languages.map((l) => `${l.language} (${l.proficiency})`).join(', ')}
            </div>
          )}
        </div>
      </div>
    )
  );

  // =========================================================================================
  // 1. ATS FRIENDLY (Pure single-column maximum parser compatibility)
  // =========================================================================================
  if (tId === 'ats-friendly') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left break-words">
        <div className="border-b border-slate-400 pb-3">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-sm font-semibold text-slate-700">{professionalTitle}</p>}
          {renderContactBar('|')}
        </div>
        {summary && (
          <div className="mt-3">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-0.5">Professional Summary</h2>
            <p className="text-xs text-slate-800 leading-relaxed mt-1">{summary}</p>
          </div>
        )}
        {renderEducationSection()}
        {allSkillsList.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-0.5 mb-1">Technical Skills</h2>
            {renderCategorizedSkills()}
          </div>
        )}
        {renderProjectsSection()}
        {renderExperienceSection()}
        {renderCertificationsSection()}
      </div>
    );
  }

  // =========================================================================================
  // 2. MINIMAL CLEAN (Ultra-clean layout with left border accent)
  // =========================================================================================
  if (tId === 'minimal') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left border-l-8 border-slate-900">
        <div className="pb-3 border-b border-slate-200">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-0.5">{professionalTitle}</p>}
          <div className="pt-2">{renderContactBar('•')}</div>
        </div>
        {summary && <p className="text-xs text-slate-700 leading-relaxed italic my-3">{summary}</p>}
        {renderEducationSection('text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2')}
        {allSkillsList.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">Technical Core</h2>
            {renderCategorizedSkills()}
          </div>
        )}
        {renderProjectsSection('text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2')}
        {renderExperienceSection('text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2')}
        {renderCertificationsSection('text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2')}
      </div>
    );
  }

  // =========================================================================================
  // 3. EXECUTIVE LEADERSHIP (Dark navy banner header & serif typography)
  // =========================================================================================
  if (tId === 'executive') {
    return (
      <div className="w-full bg-white text-slate-900 font-serif p-0 text-left">
        <div className="bg-slate-950 text-white p-6 sm:p-8 text-center space-y-1.5 border-b-4 border-amber-500">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wider font-serif uppercase">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs uppercase tracking-widest text-amber-400 font-sans">{professionalTitle}</p>}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-300 font-sans pt-1">
            {email && <span>{email}</span>}
            {phone && <span>• {phone}</span>}
            {location && <span>• {location}</span>}
            {linkedIn && <span>• {linkedIn}</span>}
          </div>
        </div>
        <div className="p-6 sm:p-8 font-sans space-y-4">
          {summary && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-1 font-serif">Executive Summary</h2>
              <p className="text-xs text-slate-800 leading-relaxed font-serif">{summary}</p>
            </div>
          )}
          {renderExperienceSection('text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2 font-serif')}
          {renderProjectsSection('text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2 font-serif')}
          {renderEducationSection('text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2 font-serif')}
          {allSkillsList.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2 font-serif">Competencies & Skills</h2>
              {renderCategorizedSkills()}
            </div>
          )}
          {renderCertificationsSection('text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2 font-serif')}
        </div>
      </div>
    );
  }

  // =========================================================================================
  // 4. ELEGANT SERIF (Gold/Warm top rule & elegant two-column layout)
  // =========================================================================================
  if (tId === 'elegant') {
    return (
      <div className="w-full bg-white text-slate-900 font-serif p-6 sm:p-8 text-left border-t-8 border-amber-600">
        <div className="text-center border-b border-amber-200 pb-4">
          <h1 className="text-3xl font-bold text-slate-900 tracking-wide">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs font-sans uppercase tracking-widest text-amber-700 mt-1 font-bold">{professionalTitle}</p>}
          <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-600 font-sans pt-2">
            {email && <span>{email}</span>}
            {phone && <span>• {phone}</span>}
            {location && <span>• {location}</span>}
            {linkedIn && <span>• {linkedIn}</span>}
          </div>
        </div>
        {summary && <p className="text-xs text-slate-800 leading-relaxed italic my-4 text-center px-4">{summary}</p>}
        {renderEducationSection('text-xs font-bold uppercase tracking-widest text-amber-800 border-b border-amber-300 pb-1 mb-2 font-sans')}
        {allSkillsList.length > 0 && (
          <div className="mt-4 font-sans">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-800 border-b border-amber-300 pb-1 mb-2">Technical Stack</h2>
            {renderCategorizedSkills()}
          </div>
        )}
        {renderProjectsSection('text-xs font-bold uppercase tracking-widest text-amber-800 border-b border-amber-300 pb-1 mb-2 font-sans')}
        {renderExperienceSection('text-xs font-bold uppercase tracking-widest text-amber-800 border-b border-amber-300 pb-1 mb-2 font-sans')}
        {renderCertificationsSection('text-xs font-bold uppercase tracking-widest text-amber-800 border-b border-amber-300 pb-1 mb-2 font-sans')}
      </div>
    );
  }

  // =========================================================================================
  // 5. TECHNICAL ENGINEER (Monospace accents & dark slate sidebar for skills)
  // =========================================================================================
  if (tId === 'technical') {
    return (
      <div className="w-full bg-white text-slate-900 font-mono p-6 sm:p-8 text-left">
        <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl space-y-1 mb-4">
          <div className="text-[10px] text-slate-400 font-mono">// ENGINEER_PROFILE_V2.0</div>
          <h1 className="text-2xl font-bold font-mono text-white">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs text-emerald-400 font-bold">{professionalTitle}</p>}
          <div className="text-[11px] text-slate-300 pt-1 font-sans">
            {email} | {phone} | {location} {gitHub ? `| GitHub: ${gitHub}` : ''}
          </div>
        </div>
        <div className="font-sans space-y-4">
          {summary && (
            <div>
              <h2 className="text-xs font-bold font-mono text-emerald-700 uppercase tracking-wider border-b border-emerald-500 pb-0.5 mb-1">&gt; System Summary</h2>
              <p className="text-xs text-slate-800 leading-relaxed font-sans">{summary}</p>
            </div>
          )}
          {allSkillsList.length > 0 && (
            <div>
              <h2 className="text-xs font-bold font-mono text-emerald-700 uppercase tracking-wider border-b border-emerald-500 pb-0.5 mb-1">&gt; Technical Skills Matrix</h2>
              {renderCategorizedSkills()}
            </div>
          )}
          {renderProjectsSection('text-xs font-bold font-mono text-emerald-700 uppercase tracking-wider border-b border-emerald-500 pb-0.5 mb-1')}
          {renderExperienceSection('text-xs font-bold font-mono text-emerald-700 uppercase tracking-wider border-b border-emerald-500 pb-0.5 mb-1')}
          {renderEducationSection('text-xs font-bold font-mono text-emerald-700 uppercase tracking-wider border-b border-emerald-500 pb-0.5 mb-1')}
          {renderCertificationsSection('text-xs font-bold font-mono text-emerald-700 uppercase tracking-wider border-b border-emerald-500 pb-0.5 mb-1')}
        </div>
      </div>
    );
  }

  // =========================================================================================
  // 6. CREATIVE DUAL-TONE (30% Left Indigo Sidebar, 70% Right Main Column)
  // =========================================================================================
  if (tId === 'creative' || tId === 'split') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans grid grid-cols-12 min-h-[600px] text-left">
        {/* Left Sidebar 30% */}
        <div className="col-span-4 bg-slate-900 text-white p-5 space-y-4 text-left">
          <div>
            <h1 className="text-xl font-black text-cyan-300 leading-tight">{fullName || 'YOUR NAME'}</h1>
            {professionalTitle && <p className="text-[11px] font-bold text-slate-300 mt-1 uppercase">{professionalTitle}</p>}
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800 pt-3">
            <div className="font-bold text-cyan-400 uppercase text-[10px]">Contact</div>
            {email && <div className="break-all">{email}</div>}
            {phone && <div>{phone}</div>}
            {location && <div>{location}</div>}
            {linkedIn && <div className="break-all">LinkedIn: {linkedIn}</div>}
            {gitHub && <div className="break-all">GitHub: {gitHub}</div>}
          </div>
          {allSkillsList.length > 0 && (
            <div className="border-t border-slate-800 pt-3 space-y-2">
              <div className="font-bold text-cyan-400 uppercase text-[10px]">Skills</div>
              <div className="flex flex-wrap gap-1">
                {allSkillsList.map((sk, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-200 text-[10px] font-semibold border border-slate-700">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}
          {languages.length > 0 && (
            <div className="border-t border-slate-800 pt-3 space-y-1 text-[11px]">
              <div className="font-bold text-cyan-400 uppercase text-[10px]">Languages</div>
              {languages.map((l, idx) => (
                <div key={idx} className="text-slate-300">{l.language} ({l.proficiency})</div>
              ))}
            </div>
          )}
        </div>

        {/* Right Main Column 70% */}
        <div className="col-span-8 p-6 space-y-4 bg-white">
          {summary && (
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-indigo-600 pb-0.5 mb-1">About Me</h2>
              <p className="text-xs text-slate-700 leading-relaxed">{summary}</p>
            </div>
          )}
          {renderProjectsSection('text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-indigo-600 pb-0.5 mb-1')}
          {renderExperienceSection('text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-indigo-600 pb-0.5 mb-1')}
          {renderEducationSection('text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-indigo-600 pb-0.5 mb-1')}
          {renderCertificationsSection('text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-indigo-600 pb-0.5 mb-1')}
        </div>
      </div>
    );
  }

  // =========================================================================================
  // 7. CLASSIC CORPORATE (Standard corporate layout, serif headings)
  // =========================================================================================
  if (tId === 'classic') {
    return (
      <div className="w-full bg-white text-slate-900 font-serif p-6 sm:p-8 text-left">
        <div className="text-center pb-3 border-b-2 border-slate-900">
          <h1 className="text-3xl font-bold tracking-wide text-slate-900">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs font-sans font-bold uppercase tracking-widest text-slate-600 mt-1">{professionalTitle}</p>}
          <div className="pt-2">{renderContactBar('•')}</div>
        </div>
        {summary && <p className="text-xs text-slate-800 leading-relaxed italic my-3 text-center px-2">{summary}</p>}
        {renderEducationSection('text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-2 font-sans')}
        {allSkillsList.length > 0 && (
          <div className="mt-4 font-sans">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-2">Technical Skills</h2>
            {renderCategorizedSkills()}
          </div>
        )}
        {renderProjectsSection('text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-2 font-sans')}
        {renderExperienceSection('text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-2 font-sans')}
        {renderCertificationsSection('text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-2 font-sans')}
      </div>
    );
  }

  // =========================================================================================
  // 8. CORPORATE STEEL (Steel blue header rule & bold section badges)
  // =========================================================================================
  if (tId === 'corporate') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left">
        <div className="bg-blue-900 text-white p-5 rounded-t-xl space-y-1 border-b-4 border-cyan-400">
          <h1 className="text-2xl font-black">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs font-bold text-cyan-300 uppercase">{professionalTitle}</p>}
          <div className="text-[11px] text-blue-100 pt-1">{email} • {phone} • {location}</div>
        </div>
        <div className="p-4 border border-t-0 border-slate-200 rounded-b-xl space-y-4">
          {summary && <p className="text-xs text-slate-800 leading-relaxed">{summary}</p>}
          {renderEducationSection('text-xs font-black uppercase tracking-wider text-blue-950 border-b-2 border-blue-900 pb-0.5 mb-2')}
          {allSkillsList.length > 0 && (
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-950 border-b-2 border-blue-900 pb-0.5 mb-2">Technical Skills</h2>
              {renderCategorizedSkills()}
            </div>
          )}
          {renderProjectsSection('text-xs font-black uppercase tracking-wider text-blue-950 border-b-2 border-blue-900 pb-0.5 mb-2')}
          {renderExperienceSection('text-xs font-black uppercase tracking-wider text-blue-950 border-b-2 border-blue-900 pb-0.5 mb-2')}
          {renderCertificationsSection('text-xs font-black uppercase tracking-wider text-blue-950 border-b-2 border-blue-900 pb-0.5 mb-2')}
        </div>
      </div>
    );
  }

  // =========================================================================================
  // 9. DEVELOPER TECH (Dark terminal style header & pill stack tags)
  // =========================================================================================
  if (tId === 'developer') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left">
        <div className="bg-slate-950 text-cyan-300 p-5 rounded-2xl border border-cyan-500/30 space-y-2 mb-4 font-mono">
          <div className="text-[10px] text-slate-500">$ cat candidate_profile.json</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs text-cyan-400 font-bold">// {professionalTitle}</p>}
          {renderContactBar('|')}
        </div>
        {summary && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed mb-4">
            <span className="font-mono font-bold text-indigo-600 block mb-1">&gt; Summary:</span>
            {summary}
          </div>
        )}
        {allSkillsList.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-cyan-500 pb-1 mb-2">&gt; Tech Stack & Capabilities</h2>
            <div className="flex flex-wrap gap-1.5">
              {allSkillsList.map((sk, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 text-[11px] font-mono font-semibold">
                  {sk}
                </span>
              ))}
            </div>
          </div>
        )}
        {renderProjectsSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-cyan-500 pb-1 mb-2')}
        {renderExperienceSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-cyan-500 pb-1 mb-2')}
        {renderEducationSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-cyan-500 pb-1 mb-2')}
        {renderCertificationsSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-cyan-500 pb-1 mb-2')}
      </div>
    );
  }

  // =========================================================================================
  // 10. STARTUP MODERN (Gradient accent line & rounded section cards)
  // =========================================================================================
  if (tId === 'startup') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md space-y-1">
          <h1 className="text-2xl font-black tracking-tight">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs font-extrabold text-teal-100 uppercase">{professionalTitle}</p>}
          <div className="text-xs text-white/90 font-medium pt-1">{email} • {phone} • {location}</div>
        </div>
        {summary && <p className="text-xs text-slate-700 leading-relaxed p-3 bg-teal-50/50 rounded-xl border border-teal-100">{summary}</p>}
        {renderEducationSection('text-xs font-black uppercase text-teal-800 border-b-2 border-teal-500 pb-1 mb-2')}
        {allSkillsList.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase text-teal-800 border-b-2 border-teal-500 pb-1 mb-2">Key Skills</h2>
            {renderCategorizedSkills()}
          </div>
        )}
        {renderProjectsSection('text-xs font-black uppercase text-teal-800 border-b-2 border-teal-500 pb-1 mb-2')}
        {renderExperienceSection('text-xs font-black uppercase text-teal-800 border-b-2 border-teal-500 pb-1 mb-2')}
        {renderCertificationsSection('text-xs font-black uppercase text-teal-800 border-b-2 border-teal-500 pb-1 mb-2')}
      </div>
    );
  }

  // =========================================================================================
  // 11. IVY LEAGUE ACADEMIC (Harvard/Yale traditional serif style, centered header)
  // =========================================================================================
  if (tId === 'ivy') {
    return (
      <div className="w-full bg-white text-stone-900 font-serif p-6 sm:p-8 text-center space-y-3 border-t-4 border-stone-800">
        <div className="border-b-2 border-stone-800 pb-3">
          <h1 className="text-3xl font-bold uppercase tracking-widest">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs uppercase tracking-widest text-stone-600 font-bold mt-1">{professionalTitle}</p>}
          <div className="flex flex-wrap justify-center gap-3 text-xs text-stone-600 pt-2 font-sans">
            {email && <span>{email}</span>}
            {phone && <span>• {phone}</span>}
            {location && <span>• {location}</span>}
            {linkedIn && <span>• {linkedIn}</span>}
          </div>
        </div>
        {summary && <p className="text-xs text-stone-700 leading-relaxed italic text-center px-4">{summary}</p>}
        {renderEducationSection('text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-400 pb-0.5 mb-2 font-serif text-center')}
        {renderProjectsSection('text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-400 pb-0.5 mb-2 font-serif text-center')}
        {renderExperienceSection('text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-400 pb-0.5 mb-2 font-serif text-center')}
        {allSkillsList.length > 0 && (
          <div className="text-left font-sans mt-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-400 pb-0.5 mb-2 font-serif text-center">Core Qualifications</h2>
            {renderCategorizedSkills()}
          </div>
        )}
        {renderCertificationsSection('text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-400 pb-0.5 mb-2 font-serif text-center')}
      </div>
    );
  }

  // =========================================================================================
  // 12. BOLD HEADER BANNER (Solid full-width dark background header banner with high contrast)
  // =========================================================================================
  if (tId === 'bold-header') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans p-0 text-left">
        <div className="bg-indigo-950 text-white p-6 sm:p-8 space-y-1 border-b-4 border-indigo-500">
          <h1 className="text-3xl font-black tracking-tight">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">{professionalTitle}</p>}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-300 font-medium pt-2">
            {email && <span>{email}</span>}
            {phone && <span>• {phone}</span>}
            {location && <span>• {location}</span>}
            {gitHub && <span>• GitHub: {gitHub}</span>}
          </div>
        </div>
        <div className="p-6 sm:p-8 space-y-4">
          {summary && <p className="text-xs text-slate-700 leading-relaxed p-3 bg-slate-50 rounded-xl border border-slate-200">{summary}</p>}
          {renderEducationSection('text-xs font-black uppercase text-indigo-950 border-b-2 border-indigo-600 pb-1 mb-2')}
          {allSkillsList.length > 0 && (
            <div>
              <h2 className="text-xs font-black uppercase text-indigo-950 border-b-2 border-indigo-600 pb-1 mb-2">Technical Competencies</h2>
              {renderCategorizedSkills()}
            </div>
          )}
          {renderProjectsSection('text-xs font-black uppercase text-indigo-950 border-b-2 border-indigo-600 pb-1 mb-2')}
          {renderExperienceSection('text-xs font-black uppercase text-indigo-950 border-b-2 border-indigo-600 pb-1 mb-2')}
          {renderCertificationsSection('text-xs font-black uppercase text-indigo-950 border-b-2 border-indigo-600 pb-1 mb-2')}
        </div>
      </div>
    );
  }

  // =========================================================================================
  // 13. GEOMETRIC MODERN (Purple geometric section dividers and badge tags)
  // =========================================================================================
  if (tId === 'geometric') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4">
        <div className="p-5 bg-slate-900 text-purple-300 rounded-2xl border-l-8 border-purple-500 space-y-1">
          <h1 className="text-2xl font-black text-white">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs font-bold text-purple-400 uppercase">{professionalTitle}</p>}
          {renderContactBar('◆')}
        </div>
        {summary && <p className="text-xs text-slate-800 leading-relaxed border-l-2 border-purple-400 pl-3 italic">{summary}</p>}
        {renderEducationSection('text-xs font-black uppercase text-purple-900 border-b-2 border-purple-500 pb-0.5 mb-2')}
        {allSkillsList.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase text-purple-900 border-b-2 border-purple-500 pb-0.5 mb-2">Core Skills Matrix</h2>
            {renderCategorizedSkills()}
          </div>
        )}
        {renderProjectsSection('text-xs font-black uppercase text-purple-900 border-b-2 border-purple-500 pb-0.5 mb-2')}
        {renderExperienceSection('text-xs font-black uppercase text-purple-900 border-b-2 border-purple-500 pb-0.5 mb-2')}
        {renderCertificationsSection('text-xs font-black uppercase text-purple-900 border-b-2 border-purple-500 pb-0.5 mb-2')}
      </div>
    );
  }

  // =========================================================================================
  // DEFAULT / MODERN PROFESSIONAL (Template fallback for all other IDs: clean, high-impact)
  // =========================================================================================
  return (
    <div className="w-full max-w-full box-border bg-white text-slate-900 font-sans p-6 sm:p-8 overflow-hidden break-words text-left print:shadow-none print:border-none print:max-w-none print:w-full print:p-0">
      {/* Header Bar */}
      <div className="border-b-2 border-indigo-600 pb-4 text-left space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-['Space_Grotesk']">
          {fullName || 'YOUR FULL NAME'}
        </h1>
        {professionalTitle && (
          <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
            {professionalTitle}
          </p>
        )}
        {renderContactBar('•')}
      </div>

      {/* Summary */}
      {summary && (
        <div className="mt-4 space-y-1">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            Professional Summary
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Education */}
      {renderEducationSection('text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2')}

      {/* Skills */}
      {allSkillsList.length > 0 && (
        <div className="mt-4 space-y-1">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            Technical & Core Skills
          </h2>
          {renderCategorizedSkills()}
        </div>
      )}

      {/* Projects */}
      {renderProjectsSection('text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2')}

      {/* Experience */}
      {renderExperienceSection('text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2')}

      {/* Certifications & Achievements */}
      {renderCertificationsSection('text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2')}
    </div>
  );
};

export default ResumePreviewTemplates;
