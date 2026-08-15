import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { ResumeData } from '../../types';

interface ResumePreviewTemplatesProps {
  data: ResumeData;
  template?: string;
  onPhotoUpload?: (photoDataUrl: string) => void;
}

export const ResumePreviewTemplates: React.FC<ResumePreviewTemplatesProps> = ({
  data,
  template = 'modern',
  onPhotoUpload
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onPhotoUpload) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onPhotoUpload(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const {
    fullName,
    professionalTitle,
    email,
    phone,
    location,
    linkedIn,
    gitHub,
    portfolio,
    photoUrl,
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

  // Helper for photo avatar placeholder / user photo upload
  const renderPhotoAvatar = (size = 'w-20 h-20', shape = 'rounded-full') => {
    const isInteractive = !!onPhotoUpload;

    return (
      <div
        onClick={() => isInteractive && fileInputRef.current?.click()}
        className={`${size} ${shape} overflow-hidden border-2 border-indigo-500/40 bg-slate-100 shrink-0 flex items-center justify-center shadow-md relative group ${
          isInteractive ? 'cursor-pointer hover:border-indigo-600 hover:shadow-lg transition-all' : ''
        }`}
        title={isInteractive ? 'Click to Upload Profile Photo' : undefined}
      >
        {isInteractive && (
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoFileChange}
            accept="image/*"
            className="hidden"
          />
        )}

        {photoUrl ? (
          <>
            <img src={photoUrl} alt={fullName || 'Candidate Photo'} className="w-full h-full object-cover" />
            {isInteractive && (
              <div className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-1 text-center print:hidden">
                <Camera className="w-4 h-4 text-white mb-0.5" />
                <span className="text-[8px] font-extrabold uppercase">Change</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs p-1 group-hover:from-indigo-600 group-hover:to-purple-700 transition-colors">
            {isInteractive ? (
              <>
                <Camera className="w-5 h-5 text-white/90 mb-0.5" />
                <span className="text-[8px] uppercase tracking-tighter opacity-90 font-extrabold">Upload Photo</span>
              </>
            ) : (
              <>
                <svg className="w-1/2 h-1/2 opacity-90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span className="text-[8px] uppercase tracking-tighter opacity-80 mt-0.5">Photo</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // Helper for contact details line with bulletproof text wrapping
  const renderContactBar = (separator = '•') => (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium leading-relaxed">
      {email && <span className="whitespace-nowrap">{email}</span>}
      {phone && <span className="whitespace-nowrap">{separator} {phone}</span>}
      {location && <span className="whitespace-nowrap">{separator} {location}</span>}
      {linkedIn && <span className="break-all">{separator} LinkedIn: {linkedIn}</span>}
      {gitHub && <span className="break-all">{separator} GitHub: {gitHub}</span>}
      {portfolio && <span className="break-all">{separator} Portfolio: {portfolio}</span>}
    </div>
  );

  // Helper for skills list rendering
  const renderCategorizedSkills = (textClass = 'text-xs text-slate-800') => (
    <div className={`${textClass} space-y-1`}>
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
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-xs text-slate-900">{proj.title}</span>
                {proj.gitHubUrl && <span className="text-[10px] text-indigo-600 font-mono break-all">{proj.gitHubUrl}</span>}
              </div>
              {proj.techStack && proj.techStack.length > 0 && (
                <div className="text-[11px] text-indigo-700 font-semibold">
                  Tech Stack: {Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack}
                </div>
              )}
              <p className="text-xs text-slate-700 leading-relaxed">{proj.description}</p>
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
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-xs text-slate-900">{exp.role} — <span className="italic">{exp.company}</span></span>
                <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">{exp.duration}</span>
              </div>
              {exp.location && <div className="text-[10px] text-slate-500">{exp.location}</div>}
              <p className="text-xs text-slate-700 leading-relaxed">{exp.description}</p>
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
            <div key={idx} className="flex justify-between items-start text-xs">
              <div>
                <span className="font-bold text-slate-900 block">{edu.degree}</span>
                <span className="text-slate-700 block">{edu.institution} {edu.location ? `• ${edu.location}` : ''}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-slate-600 block font-medium">{edu.endYear || edu.graduationYear}</span>
                {edu.cgpa && <span className="text-indigo-700 font-bold block text-[11px]">CGPA: {edu.cgpa}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  );

  // Helper for certifications & achievements section
  const renderCertificationsSection = (titleClass = 'text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2') => (
    ((certifications && certifications.length > 0) || (achievements && achievements.length > 0) || (languages && languages.length > 0)) && (
      <div className="space-y-3 mt-4 text-left">
        {certifications && certifications.length > 0 && (
          <div>
            <h2 className={titleClass}>Certifications</h2>
            <div className="space-y-1 text-xs">
              {certifications.map((c, idx) => (
                <div key={idx} className="flex justify-between text-slate-800">
                  <span><span className="font-bold">{c.title}</span> {c.issuer ? `— ${c.issuer}` : ''}</span>
                  {c.year && <span className="text-slate-500 font-medium">{c.year}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {achievements && achievements.length > 0 && (
          <div>
            <h2 className={titleClass}>Achievements & Leadership</h2>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5">
              {achievements.map((ach, idx) => (
                <li key={idx}>{ach}</li>
              ))}
              {(leadership || []).map((lead, idx) => (
                <li key={`lead-${idx}`}>{lead}</li>
              ))}
            </ul>
          </div>
        )}

        {languages && languages.length > 0 && (
          <div>
            <h2 className={titleClass}>Languages & Profiles</h2>
            <div className="text-xs text-slate-700">
              <span className="font-bold">Languages:</span> {languages.map(l => `${l.language} (${l.proficiency})`).join(', ')}
            </div>
            {additionalLinks && additionalLinks.length > 0 && (
              <div className="text-xs text-slate-700 mt-1">
                <span className="font-bold">Coding Profiles:</span> {additionalLinks.map(al => `${al.platform}: ${al.url}`).join(' • ')}
              </div>
            )}
          </div>
        )}
      </div>
    )
  );

  // =========================================================================================
  // 10 PHOTO TEMPLATE DESIGNS (Photo Templates #1 to #10)
  // =========================================================================================
  if (tId.startsWith('photo-')) {
    // Photo Template 1: Modern Avatar Header
    if (tId === 'photo-modern') {
      return (
        <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4">
          <div className="flex items-center gap-5 border-b-2 border-indigo-600 pb-4">
            {renderPhotoAvatar('w-20 h-20', 'rounded-2xl')}
            <div className="space-y-1 flex-1">
              <h1 className="text-2xl font-black text-slate-900">{fullName || 'YOUR NAME'}</h1>
              {professionalTitle && <p className="text-xs font-bold text-indigo-600 uppercase">{professionalTitle}</p>}
              {renderContactBar('•')}
            </div>
          </div>
          {summary && <p className="text-xs text-slate-700 leading-relaxed italic">{summary}</p>}
          {renderEducationSection('text-xs font-extrabold uppercase text-slate-900 border-b border-indigo-500 pb-0.5 mb-2')}
          {allSkillsList.length > 0 && (
            <div>
              <h2 className="text-xs font-extrabold uppercase text-slate-900 border-b border-indigo-500 pb-0.5 mb-2">Technical Skills</h2>
              {renderCategorizedSkills()}
            </div>
          )}
          {renderProjectsSection('text-xs font-extrabold uppercase text-slate-900 border-b border-indigo-500 pb-0.5 mb-2')}
          {renderExperienceSection('text-xs font-extrabold uppercase text-slate-900 border-b border-indigo-500 pb-0.5 mb-2')}
          {renderCertificationsSection('text-xs font-extrabold uppercase text-slate-900 border-b border-indigo-500 pb-0.5 mb-2')}
        </div>
      );
    }

    // Photo Template 2: Executive Headshot Portrait
    if (tId === 'photo-executive') {
      return (
        <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4 border-t-4 border-slate-900">
          <div className="flex items-center justify-between gap-6 border-b border-slate-300 pb-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 font-serif">{fullName || 'YOUR NAME'}</h1>
              {professionalTitle && <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">{professionalTitle}</p>}
              {renderContactBar('◆')}
            </div>
            {renderPhotoAvatar('w-24 h-24', 'rounded-full')}
          </div>
          {summary && <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">{summary}</p>}
          {renderEducationSection('text-xs font-bold uppercase text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-2 font-serif')}
          {allSkillsList.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-2 font-serif">Executive Qualifications</h2>
              {renderCategorizedSkills()}
            </div>
          )}
          {renderProjectsSection('text-xs font-bold uppercase text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-2 font-serif')}
          {renderExperienceSection('text-xs font-bold uppercase text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-2 font-serif')}
          {renderCertificationsSection('text-xs font-bold uppercase text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-2 font-serif')}
        </div>
      );
    }

    // Photo Template 3: Tech Developer Headshot
    if (tId === 'photo-tech') {
      return (
        <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4">
          <div className="p-4 bg-slate-950 text-cyan-400 rounded-2xl flex items-center gap-4 border border-cyan-500/30">
            {renderPhotoAvatar('w-20 h-20', 'rounded-xl')}
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white font-mono">{fullName || 'YOUR NAME'}</h1>
              {professionalTitle && <p className="text-xs font-bold text-cyan-300 font-mono uppercase">{professionalTitle}</p>}
              <div className="text-xs text-slate-300 font-mono">{email} • {phone} • {location}</div>
            </div>
          </div>
          {summary && <p className="text-xs text-slate-700 font-mono leading-relaxed p-2 bg-slate-50 rounded-lg">{summary}</p>}
          {renderEducationSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-cyan-500 pb-1 mb-2')}
          {allSkillsList.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-cyan-500 pb-1 mb-2">Technical Competencies</h2>
              {renderCategorizedSkills('text-xs font-mono text-slate-800')}
            </div>
          )}
          {renderProjectsSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-cyan-500 pb-1 mb-2')}
          {renderExperienceSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-cyan-500 pb-1 mb-2')}
          {renderCertificationsSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-cyan-500 pb-1 mb-2')}
        </div>
      );
    }

    // Photo Template 4: Creative Portfolio Photo
    if (tId === 'photo-creative') {
      return (
        <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4">
          <div className="p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white rounded-3xl flex items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <h1 className="text-2xl font-black tracking-tight">{fullName || 'YOUR NAME'}</h1>
              {professionalTitle && <p className="text-xs font-extrabold text-purple-200 uppercase">{professionalTitle}</p>}
              <div className="text-xs text-white/90 font-medium pt-1">{email} • {phone} • {location}</div>
            </div>
            {renderPhotoAvatar('w-22 h-22', 'rounded-2xl border-4 border-white/20')}
          </div>
          {summary && <p className="text-xs text-slate-700 leading-relaxed border-l-4 border-purple-500 pl-3 italic">{summary}</p>}
          {renderEducationSection('text-xs font-extrabold uppercase text-purple-900 border-b-2 border-purple-500 pb-0.5 mb-2')}
          {allSkillsList.length > 0 && (
            <div>
              <h2 className="text-xs font-extrabold uppercase text-purple-900 border-b-2 border-purple-500 pb-0.5 mb-2">Creative & Tech Skills</h2>
              {renderCategorizedSkills()}
            </div>
          )}
          {renderProjectsSection('text-xs font-extrabold uppercase text-purple-900 border-b-2 border-purple-500 pb-0.5 mb-2')}
          {renderExperienceSection('text-xs font-extrabold uppercase text-purple-900 border-b-2 border-purple-500 pb-0.5 mb-2')}
          {renderCertificationsSection('text-xs font-extrabold uppercase text-purple-900 border-b-2 border-purple-500 pb-0.5 mb-2')}
        </div>
      );
    }

    // Photo Template 5: Minimal Profile Avatar
    if (tId === 'photo-minimal') {
      return (
        <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4 border-l-4 border-slate-800">
          <div className="flex items-center gap-4 pb-3 border-b border-slate-200">
            {renderPhotoAvatar('w-16 h-16', 'rounded-full')}
            <div>
              <h1 className="text-xl font-bold text-slate-900">{fullName || 'YOUR NAME'}</h1>
              {professionalTitle && <p className="text-xs font-semibold text-slate-500 uppercase">{professionalTitle}</p>}
              <div className="text-[11px] text-slate-600">{email} • {phone} • {location}</div>
            </div>
          </div>
          {summary && <p className="text-xs text-slate-700 leading-relaxed">{summary}</p>}
          {renderEducationSection('text-xs font-bold uppercase text-slate-900 border-b border-slate-300 pb-0.5 mb-2')}
          {allSkillsList.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase text-slate-900 border-b border-slate-300 pb-0.5 mb-2">Core Skills</h2>
              {renderCategorizedSkills()}
            </div>
          )}
          {renderProjectsSection('text-xs font-bold uppercase text-slate-900 border-b border-slate-300 pb-0.5 mb-2')}
          {renderExperienceSection('text-xs font-bold uppercase text-slate-900 border-b border-slate-300 pb-0.5 mb-2')}
          {renderCertificationsSection('text-xs font-bold uppercase text-slate-900 border-b border-slate-300 pb-0.5 mb-2')}
        </div>
      );
    }

    // Photo Template 6: Split Sidebar Portrait (Two Column with photo)
    if (tId === 'photo-sidebar') {
      return (
        <div className="w-full bg-white text-slate-900 font-sans p-0 flex text-left min-h-[500px]">
          <div className="w-1/3 bg-slate-900 text-white p-5 space-y-4 shrink-0">
            <div className="flex flex-col items-center text-center space-y-2">
              {renderPhotoAvatar('w-24 h-24', 'rounded-full border-4 border-indigo-500')}
              <h1 className="text-lg font-bold text-white leading-tight">{fullName || 'YOUR NAME'}</h1>
              {professionalTitle && <p className="text-[11px] font-semibold text-indigo-400 uppercase">{professionalTitle}</p>}
            </div>
            <div className="space-y-1 text-[11px] text-slate-300 border-t border-slate-800 pt-3">
              <div>{email}</div>
              <div>{phone}</div>
              <div>{location}</div>
              {linkedIn && <div className="break-all">LI: {linkedIn}</div>}
              {gitHub && <div className="break-all">GH: {gitHub}</div>}
            </div>
            {allSkillsList.length > 0 && (
              <div className="space-y-1.5 border-t border-slate-800 pt-3">
                <span className="text-[11px] font-bold text-indigo-400 uppercase block">Skills</span>
                <div className="flex flex-wrap gap-1">
                  {allSkillsList.map((sk, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px]">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 p-6 space-y-4">
            {summary && <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">{summary}</p>}
            {renderEducationSection('text-xs font-bold uppercase text-indigo-900 border-b-2 border-indigo-600 pb-0.5 mb-2')}
            {renderProjectsSection('text-xs font-bold uppercase text-indigo-900 border-b-2 border-indigo-600 pb-0.5 mb-2')}
            {renderExperienceSection('text-xs font-bold uppercase text-indigo-900 border-b-2 border-indigo-600 pb-0.5 mb-2')}
            {renderCertificationsSection('text-xs font-bold uppercase text-indigo-900 border-b-2 border-indigo-600 pb-0.5 mb-2')}
          </div>
        </div>
      );
    }

    // Photo Template 7: Corporate Headshot
    if (tId === 'photo-corporate') {
      return (
        <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4">
          <div className="flex items-center justify-between gap-5 border-b-4 border-blue-900 pb-4">
            {renderPhotoAvatar('w-22 h-22', 'rounded-lg border-2 border-blue-900')}
            <div className="space-y-1 flex-1">
              <h1 className="text-2xl font-black text-blue-950 uppercase">{fullName || 'YOUR NAME'}</h1>
              {professionalTitle && <p className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">{professionalTitle}</p>}
              {renderContactBar('•')}
            </div>
          </div>
          {summary && <p className="text-xs text-slate-700 leading-relaxed p-3 bg-blue-50/40 rounded-lg">{summary}</p>}
          {renderEducationSection('text-xs font-black uppercase text-blue-950 border-b-2 border-blue-800 pb-0.5 mb-2')}
          {allSkillsList.length > 0 && (
            <div>
              <h2 className="text-xs font-black uppercase text-blue-950 border-b-2 border-blue-800 pb-0.5 mb-2">Core Competencies</h2>
              {renderCategorizedSkills()}
            </div>
          )}
          {renderProjectsSection('text-xs font-black uppercase text-blue-950 border-b-2 border-blue-800 pb-0.5 mb-2')}
          {renderExperienceSection('text-xs font-black uppercase text-blue-950 border-b-2 border-blue-800 pb-0.5 mb-2')}
          {renderCertificationsSection('text-xs font-black uppercase text-blue-950 border-b-2 border-blue-800 pb-0.5 mb-2')}
        </div>
      );
    }

    // Photo Template 8: Elegant Gold Headshot
    if (tId === 'photo-elegant') {
      return (
        <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4 border-t-4 border-amber-500">
          <div className="flex items-center gap-5 border-b border-amber-200 pb-4">
            {renderPhotoAvatar('w-20 h-20', 'rounded-full border-2 border-amber-500')}
            <div className="space-y-1 flex-1">
              <h1 className="text-2xl font-serif font-bold text-amber-950">{fullName || 'YOUR NAME'}</h1>
              {professionalTitle && <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">{professionalTitle}</p>}
              {renderContactBar('◆')}
            </div>
          </div>
          {summary && <p className="text-xs text-slate-700 leading-relaxed italic text-amber-900/90">{summary}</p>}
          {renderEducationSection('text-xs font-serif font-bold uppercase text-amber-900 border-b border-amber-400 pb-0.5 mb-2')}
          {allSkillsList.length > 0 && (
            <div>
              <h2 className="text-xs font-serif font-bold uppercase text-amber-900 border-b border-amber-400 pb-0.5 mb-2">Skills & Qualifications</h2>
              {renderCategorizedSkills()}
            </div>
          )}
          {renderProjectsSection('text-xs font-serif font-bold uppercase text-amber-900 border-b border-amber-400 pb-0.5 mb-2')}
          {renderExperienceSection('text-xs font-serif font-bold uppercase text-amber-900 border-b border-amber-400 pb-0.5 mb-2')}
          {renderCertificationsSection('text-xs font-serif font-bold uppercase text-amber-900 border-b border-amber-400 pb-0.5 mb-2')}
        </div>
      );
    }

    // Photo Template 9: Gradient Wave Photo
    if (tId === 'photo-gradient') {
      return (
        <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4">
          <div className="p-5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl shadow-md flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-black">{fullName || 'YOUR NAME'}</h1>
              {professionalTitle && <p className="text-xs font-extrabold text-teal-100 uppercase">{professionalTitle}</p>}
              <div className="text-xs text-white/90 font-medium pt-1">{email} • {phone} • {location}</div>
            </div>
            {renderPhotoAvatar('w-20 h-20', 'rounded-2xl border-2 border-white')}
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

    // Photo Template 10: Scholar Academic Portrait
    if (tId === 'photo-academic') {
      return (
        <div className="w-full bg-white text-stone-900 font-serif p-6 sm:p-8 text-left space-y-3 border-t-4 border-stone-800">
          <div className="flex items-center gap-5 border-b-2 border-stone-800 pb-3">
            {renderPhotoAvatar('w-20 h-20', 'rounded-full border-2 border-stone-800')}
            <div className="space-y-1 flex-1">
              <h1 className="text-2xl font-bold uppercase tracking-widest">{fullName || 'YOUR NAME'}</h1>
              {professionalTitle && <p className="text-xs uppercase tracking-widest text-stone-600 font-bold">{professionalTitle}</p>}
              <div className="text-xs text-stone-600 pt-1 font-sans">{email} • {phone} • {location}</div>
            </div>
          </div>
          {summary && <p className="text-xs text-stone-700 leading-relaxed italic">{summary}</p>}
          {renderEducationSection('text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-400 pb-0.5 mb-2 font-serif')}
          {renderProjectsSection('text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-400 pb-0.5 mb-2 font-serif')}
          {renderExperienceSection('text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-400 pb-0.5 mb-2 font-serif')}
          {allSkillsList.length > 0 && (
            <div className="font-sans mt-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-400 pb-0.5 mb-2 font-serif">Academic Qualifications</h2>
              {renderCategorizedSkills()}
            </div>
          )}
          {renderCertificationsSection('text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-400 pb-0.5 mb-2 font-serif')}
        </div>
      );
    }
  }

  // =========================================================================================
  // 40 NON-PHOTO TEMPLATE DESIGNS (#11 to #50)
  // =========================================================================================

  if (tId === 'ats-friendly') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4">
        <div className="border-b-2 border-slate-900 pb-3 space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">{fullName || 'YOUR FULL NAME'}</h1>
          {professionalTitle && <p className="text-xs font-bold text-slate-700 uppercase">{professionalTitle}</p>}
          {renderContactBar('•')}
        </div>
        {summary && <p className="text-xs text-slate-800 leading-relaxed">{summary}</p>}
        {renderEducationSection('text-xs font-bold uppercase text-slate-900 border-b border-slate-900 pb-0.5 mb-2')}
        {allSkillsList.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase text-slate-900 border-b border-slate-900 pb-0.5 mb-2">Technical Skills</h2>
            {renderCategorizedSkills()}
          </div>
        )}
        {renderProjectsSection('text-xs font-bold uppercase text-slate-900 border-b border-slate-900 pb-0.5 mb-2')}
        {renderExperienceSection('text-xs font-bold uppercase text-slate-900 border-b border-slate-900 pb-0.5 mb-2')}
        {renderCertificationsSection('text-xs font-bold uppercase text-slate-900 border-b border-slate-900 pb-0.5 mb-2')}
      </div>
    );
  }

  if (tId === 'minimal') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4 border-l-4 border-slate-700">
        <div className="space-y-1 pb-2 border-b border-slate-200">
          <h1 className="text-2xl font-light text-slate-900 tracking-tight">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs font-semibold text-slate-500 uppercase">{professionalTitle}</p>}
          {renderContactBar('•')}
        </div>
        {summary && <p className="text-xs text-slate-700 leading-relaxed">{summary}</p>}
        {renderEducationSection('text-xs font-semibold uppercase text-slate-800 border-b border-slate-300 pb-0.5 mb-2')}
        {allSkillsList.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase text-slate-800 border-b border-slate-300 pb-0.5 mb-2">Key Skills</h2>
            {renderCategorizedSkills()}
          </div>
        )}
        {renderProjectsSection('text-xs font-semibold uppercase text-slate-800 border-b border-slate-300 pb-0.5 mb-2')}
        {renderExperienceSection('text-xs font-semibold uppercase text-slate-800 border-b border-slate-300 pb-0.5 mb-2')}
        {renderCertificationsSection('text-xs font-semibold uppercase text-slate-800 border-b border-slate-300 pb-0.5 mb-2')}
      </div>
    );
  }

  if (tId === 'executive') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4">
        <div className="bg-slate-950 text-white p-6 rounded-2xl border-b-4 border-amber-500 space-y-1">
          <h1 className="text-3xl font-serif font-bold tracking-wide">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">{professionalTitle}</p>}
          {renderContactBar('◆')}
        </div>
        {summary && <p className="text-xs text-slate-800 leading-relaxed p-3 bg-slate-50 rounded-xl border border-slate-200">{summary}</p>}
        {renderEducationSection('text-xs font-serif font-bold uppercase text-slate-950 border-b-2 border-slate-950 pb-0.5 mb-2')}
        {allSkillsList.length > 0 && (
          <div>
            <h2 className="text-xs font-serif font-bold uppercase text-slate-950 border-b-2 border-slate-950 pb-0.5 mb-2">Leadership & Technical Competencies</h2>
            {renderCategorizedSkills()}
          </div>
        )}
        {renderProjectsSection('text-xs font-serif font-bold uppercase text-slate-950 border-b-2 border-slate-950 pb-0.5 mb-2')}
        {renderExperienceSection('text-xs font-serif font-bold uppercase text-slate-950 border-b-2 border-slate-950 pb-0.5 mb-2')}
        {renderCertificationsSection('text-xs font-serif font-bold uppercase text-slate-950 border-b-2 border-slate-950 pb-0.5 mb-2')}
      </div>
    );
  }

  if (tId === 'technical') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4">
        <div className="p-5 bg-slate-900 text-emerald-400 rounded-2xl border-b-2 border-emerald-500 font-mono space-y-1">
          <h1 className="text-2xl font-black text-white">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs font-bold text-emerald-400 uppercase">{professionalTitle}</p>}
          {renderContactBar('//')}
        </div>
        {summary && <p className="text-xs text-slate-800 font-mono leading-relaxed p-2.5 bg-slate-50 rounded-lg border border-slate-200">{summary}</p>}
        {renderEducationSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-emerald-500 pb-1 mb-2')}
        {allSkillsList.length > 0 && (
          <div>
            <h2 className="text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-emerald-500 pb-1 mb-2">Technical Matrix</h2>
            {renderCategorizedSkills('text-xs font-mono text-slate-800')}
          </div>
        )}
        {renderProjectsSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-emerald-500 pb-1 mb-2')}
        {renderExperienceSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-emerald-500 pb-1 mb-2')}
        {renderCertificationsSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-emerald-500 pb-1 mb-2')}
      </div>
    );
  }

  if (tId === 'creative') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4">
        <div className="p-6 bg-gradient-to-r from-purple-700 to-indigo-600 text-white rounded-3xl space-y-1 shadow-lg">
          <h1 className="text-3xl font-black">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs font-extrabold text-purple-200 uppercase">{professionalTitle}</p>}
          {renderContactBar('•')}
        </div>
        {summary && <p className="text-xs text-slate-800 leading-relaxed border-l-4 border-purple-500 pl-3 italic">{summary}</p>}
        {renderEducationSection('text-xs font-extrabold uppercase text-purple-900 border-b-2 border-purple-500 pb-0.5 mb-2')}
        {allSkillsList.length > 0 && (
          <div>
            <h2 className="text-xs font-extrabold uppercase text-purple-900 border-b-2 border-purple-500 pb-0.5 mb-2">Creative & Technical Core</h2>
            {renderCategorizedSkills()}
          </div>
        )}
        {renderProjectsSection('text-xs font-extrabold uppercase text-purple-900 border-b-2 border-purple-500 pb-0.5 mb-2')}
        {renderExperienceSection('text-xs font-extrabold uppercase text-purple-900 border-b-2 border-purple-500 pb-0.5 mb-2')}
        {renderCertificationsSection('text-xs font-extrabold uppercase text-purple-900 border-b-2 border-purple-500 pb-0.5 mb-2')}
      </div>
    );
  }

  if (tId === 'developer') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4">
        <div className="p-4 bg-slate-950 text-cyan-400 font-mono rounded-2xl border border-cyan-500/30 space-y-1">
          <div className="text-[10px] text-slate-500">$ cat candidate_profile.json</div>
          <h1 className="text-2xl font-black text-white">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs font-bold text-cyan-300 uppercase">{professionalTitle}</p>}
          {renderContactBar('::')}
        </div>
        {summary && <p className="text-xs text-slate-800 font-mono leading-relaxed p-2.5 bg-slate-50 rounded-lg">{summary}</p>}
        {renderEducationSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-cyan-500 pb-1 mb-2')}
        {allSkillsList.length > 0 && (
          <div>
            <h2 className="text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-cyan-500 pb-1 mb-2">Stack Overview</h2>
            {renderCategorizedSkills('text-xs font-mono text-slate-800')}
          </div>
        )}
        {renderProjectsSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-cyan-500 pb-1 mb-2')}
        {renderExperienceSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-cyan-500 pb-1 mb-2')}
        {renderCertificationsSection('text-xs font-mono font-bold text-slate-900 uppercase border-b-2 border-cyan-500 pb-1 mb-2')}
      </div>
    );
  }

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

  if (tId === 'emerald-fresh') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4">
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md space-y-1">
          <h1 className="text-2xl font-black">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs font-extrabold text-emerald-100 uppercase">{professionalTitle}</p>}
          <div className="text-xs text-white/90 font-medium pt-1">{email} • {phone} • {location}</div>
        </div>
        {summary && <p className="text-xs text-slate-700 leading-relaxed p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">{summary}</p>}
        {renderEducationSection('text-xs font-black uppercase text-emerald-900 border-b-2 border-emerald-500 pb-1 mb-2')}
        {allSkillsList.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase text-emerald-900 border-b-2 border-emerald-500 pb-1 mb-2">Technical Skills</h2>
            {renderCategorizedSkills()}
          </div>
        )}
        {renderProjectsSection('text-xs font-black uppercase text-emerald-900 border-b-2 border-emerald-500 pb-1 mb-2')}
        {renderExperienceSection('text-xs font-black uppercase text-emerald-900 border-b-2 border-emerald-500 pb-1 mb-2')}
        {renderCertificationsSection('text-xs font-black uppercase text-emerald-900 border-b-2 border-emerald-500 pb-1 mb-2')}
      </div>
    );
  }

  if (tId === 'monochrome') {
    return (
      <div className="w-full bg-white text-black font-sans p-6 sm:p-8 text-left space-y-4">
        <div className="border-b-4 border-black pb-3 space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs font-extrabold uppercase">{professionalTitle}</p>}
          {renderContactBar('|')}
        </div>
        {summary && <p className="text-xs text-black leading-relaxed font-medium">{summary}</p>}
        {renderEducationSection('text-xs font-black uppercase text-black border-b-2 border-black pb-0.5 mb-2')}
        {allSkillsList.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase text-black border-b-2 border-black pb-0.5 mb-2">Technical & Core Skills</h2>
            {renderCategorizedSkills()}
          </div>
        )}
        {renderProjectsSection('text-xs font-black uppercase text-black border-b-2 border-black pb-0.5 mb-2')}
        {renderExperienceSection('text-xs font-black uppercase text-black border-b-2 border-black pb-0.5 mb-2')}
        {renderCertificationsSection('text-xs font-black uppercase text-black border-b-2 border-black pb-0.5 mb-2')}
      </div>
    );
  }

  if (tId === 'cyan-matrix') {
    return (
      <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-8 text-left space-y-4">
        <div className="p-5 bg-slate-900 text-cyan-400 rounded-2xl border-l-8 border-cyan-400 space-y-1">
          <h1 className="text-2xl font-black text-white">{fullName || 'YOUR NAME'}</h1>
          {professionalTitle && <p className="text-xs font-bold text-cyan-300 uppercase">{professionalTitle}</p>}
          {renderContactBar('◆')}
        </div>
        {summary && <p className="text-xs text-slate-800 leading-relaxed border-l-2 border-cyan-400 pl-3 italic">{summary}</p>}
        {renderEducationSection('text-xs font-black uppercase text-cyan-900 border-b-2 border-cyan-500 pb-0.5 mb-2')}
        {allSkillsList.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase text-cyan-900 border-b-2 border-cyan-500 pb-0.5 mb-2">Data & Analytics Matrix</h2>
            {renderCategorizedSkills()}
          </div>
        )}
        {renderProjectsSection('text-xs font-black uppercase text-cyan-900 border-b-2 border-cyan-500 pb-0.5 mb-2')}
        {renderExperienceSection('text-xs font-black uppercase text-cyan-900 border-b-2 border-cyan-500 pb-0.5 mb-2')}
        {renderCertificationsSection('text-xs font-black uppercase text-cyan-900 border-b-2 border-cyan-500 pb-0.5 mb-2')}
      </div>
    );
  }

  // DEFAULT / UNIVERSAL TEMPLATE (Handles modern, corporate, compact, split, two-column, left-bar, border-accent, etc.)
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
