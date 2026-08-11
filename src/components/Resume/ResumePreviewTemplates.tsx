import React from 'react';
import { ResumeData } from '../../types';
import { Mail, Phone, MapPin, Linkedin, Github, Globe, ExternalLink } from 'lucide-react';

interface ResumePreviewTemplatesProps {
  data: ResumeData;
  template?: 'classic' | 'modern' | 'minimal' | 'ats-friendly';
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

  // Combine all skills for traditional view if categorized lists are empty
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

  // --- TEMPLATE 1: ATS FRIENDLY (Pure text, standard headers, high parseability) ---
  if (template === 'ats-friendly') {
    return (
      <div className="bg-white text-slate-900 font-sans p-8 sm:p-12 shadow-2xl rounded-sm max-w-3xl mx-auto border border-slate-300 print:shadow-none print:border-none print:max-w-none print:w-full print:p-0">
        {/* Header */}
        <div className="border-b border-slate-400 pb-3 text-left space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wide text-slate-900">
            {fullName || 'YOUR FULL NAME'}
          </h1>
          {professionalTitle && (
            <p className="text-sm font-semibold text-slate-700">{professionalTitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700 font-medium">
            {location && <span>{location}</span>}
            {phone && <span>| Phone: {phone}</span>}
            {email && <span>| Email: {email}</span>}
            {linkedIn && <span>| LinkedIn: {linkedIn}</span>}
            {gitHub && <span>| GitHub: {gitHub}</span>}
            {portfolio && <span>| Portfolio: {portfolio}</span>}
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mt-4 space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Professional Summary
            </h2>
            <p className="text-xs leading-relaxed text-slate-800">{summary}</p>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mt-4 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Education
            </h2>
            <div className="space-y-2">
              {education.map((edu, idx) => (
                <div key={idx} className="text-xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{edu.degree}{edu.department ? ` (${edu.department})` : ''}</span>
                    <span>
                      {edu.startYear && edu.endYear ? `${edu.startYear} - ${edu.endYear}` : edu.graduationYear || ''}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>{edu.institution}{edu.university ? `, ${edu.university}` : ''}{edu.location ? ` | ${edu.location}` : ''}</span>
                    {edu.cgpa && <span className="font-semibold">CGPA: {edu.cgpa}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {allSkillsList.length > 0 && (
          <div className="mt-4 space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Technical Skills
            </h2>
            <div className="text-xs space-y-1">
              {programmingLanguages.length > 0 && (
                <div><span className="font-bold">Languages:</span> {programmingLanguages.join(', ')}</div>
              )}
              {webTechnologies.length > 0 && (
                <div><span className="font-bold">Web Technologies:</span> {webTechnologies.join(', ')}</div>
              )}
              {frameworksLibraries.length > 0 && (
                <div><span className="font-bold">Frameworks & Libraries:</span> {frameworksLibraries.join(', ')}</div>
              )}
              {databases.length > 0 && (
                <div><span className="font-bold">Databases:</span> {databases.join(', ')}</div>
              )}
              {toolsAndTech.length > 0 && (
                <div><span className="font-bold">Tools & Technologies:</span> {toolsAndTech.join(', ')}</div>
              )}
              {otherSkills.length > 0 && (
                <div><span className="font-bold">Other Competencies:</span> {otherSkills.join(', ')}</div>
              )}
              {programmingLanguages.length === 0 && webTechnologies.length === 0 && frameworksLibraries.length === 0 && databases.length === 0 && toolsAndTech.length === 0 && (
                <div>{allSkillsList.join(', ')}</div>
              )}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mt-4 space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Projects
            </h2>
            {projects.map((proj, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{proj.title}</span>
                  <span className="font-normal text-slate-600">
                    {proj.gitHubUrl && `GitHub: ${proj.gitHubUrl}`}
                  </span>
                </div>
                <p className="text-slate-800 leading-relaxed">{proj.description}</p>
                {proj.keyContributions && (
                  <p className="text-slate-800 font-medium">• {proj.keyContributions}</p>
                )}
                {proj.techStack && proj.techStack.length > 0 && (
                  <p className="text-[11px] text-slate-700">
                    <span className="font-bold">Technologies Used:</span> {Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mt-4 space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Work & Internship Experience
            </h2>
            {experience.map((exp, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{exp.role} — {exp.company}{exp.location ? `, ${exp.location}` : ''}</span>
                  <span className="font-normal text-slate-600">
                    {exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : exp.duration}
                  </span>
                </div>
                <p className="text-slate-800 leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="mt-4 space-y-1 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Certifications
            </h2>
            <ul className="list-disc list-inside space-y-0.5 text-slate-800">
              {certifications.map((c, idx) => (
                <li key={idx}>
                  <span className="font-bold">{c.title}</span>{c.issuer ? ` - ${c.issuer}` : ''}{c.year || c.date ? ` (${c.year || c.date})` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Achievements & Activities */}
        {(achievements.length > 0 || leadership.length > 0 || clubsVolunteering.length > 0 || extracurriculars.length > 0) && (
          <div className="mt-4 space-y-1 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Achievements & Co-Curricular Activities
            </h2>
            <ul className="list-disc list-inside space-y-0.5 text-slate-800">
              {achievements.map((item, idx) => <li key={`ach-${idx}`}>{item}</li>)}
              {leadership.map((item, idx) => <li key={`lead-${idx}`}><span className="font-semibold">Leadership:</span> {item}</li>)}
              {clubsVolunteering.map((item, idx) => <li key={`club-${idx}`}><span className="font-semibold">Volunteering:</span> {item}</li>)}
              {extracurriculars.map((item, idx) => <li key={`extra-${idx}`}>{item}</li>)}
            </ul>
          </div>
        )}

        {/* Languages & Additional Links */}
        {(languages.length > 0 || additionalLinks.length > 0) && (
          <div className="mt-4 space-y-1 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Additional Information
            </h2>
            {languages.length > 0 && (
              <div>
                <span className="font-bold">Languages Spoken:</span> {languages.map(l => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(', ')}
              </div>
            )}
            {additionalLinks.length > 0 && (
              <div>
                <span className="font-bold">Profiles & Links:</span> {additionalLinks.map(al => `${al.platform}: ${al.url}`).join(' | ')}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- TEMPLATE 2: CLASSIC PROFESSIONAL ---
  if (template === 'classic') {
    return (
      <div className="bg-white text-slate-900 font-serif p-8 sm:p-12 shadow-2xl rounded-sm max-w-3xl mx-auto border border-slate-200 print:shadow-none print:border-none print:max-w-none print:w-full print:p-0">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-slate-900">
            {fullName || 'YOUR FULL NAME'}
          </h1>
          {professionalTitle && (
            <p className="text-sm font-sans font-semibold text-slate-700 uppercase tracking-widest">{professionalTitle}</p>
          )}
          <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-xs text-slate-700 font-sans">
            {location && <span>{location}</span>}
            {phone && <span>• {phone}</span>}
            {email && <span>• {email}</span>}
            {linkedIn && <span>• {linkedIn}</span>}
            {gitHub && <span>• {gitHub}</span>}
            {portfolio && <span>• {portfolio}</span>}
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mt-5 space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Professional Summary
            </h2>
            <p className="text-xs leading-relaxed text-slate-800 font-sans">{summary}</p>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mt-5 space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Education
            </h2>
            <div className="space-y-2 font-sans">
              {education.map((edu, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{edu.degree}</span>
                    {edu.department && <span className="text-slate-700"> in {edu.department}</span>}
                    <span className="text-slate-700"> — {edu.institution}</span>
                    {edu.university && <span className="text-slate-600"> ({edu.university})</span>}
                  </div>
                  <div className="text-right shrink-0 font-medium text-slate-700">
                    {edu.startYear && edu.endYear ? `${edu.startYear} - ${edu.endYear}` : edu.graduationYear || ''}
                    {edu.cgpa && <span className="ml-2 font-semibold">| CGPA: {edu.cgpa}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {allSkillsList.length > 0 && (
          <div className="mt-5 space-y-1.5 font-sans">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Skills & Competencies
            </h2>
            <div className="text-xs space-y-1">
              {programmingLanguages.length > 0 && (
                <div><span className="font-bold text-slate-900">Languages: </span><span className="text-slate-800">{programmingLanguages.join(', ')}</span></div>
              )}
              {webTechnologies.length > 0 && (
                <div><span className="font-bold text-slate-900">Web Technologies: </span><span className="text-slate-800">{webTechnologies.join(', ')}</span></div>
              )}
              {frameworksLibraries.length > 0 && (
                <div><span className="font-bold text-slate-900">Frameworks: </span><span className="text-slate-800">{frameworksLibraries.join(', ')}</span></div>
              )}
              {databases.length > 0 && (
                <div><span className="font-bold text-slate-900">Databases: </span><span className="text-slate-800">{databases.join(', ')}</span></div>
              )}
              {toolsAndTech.length > 0 && (
                <div><span className="font-bold text-slate-900">Tools: </span><span className="text-slate-800">{toolsAndTech.join(', ')}</span></div>
              )}
              {programmingLanguages.length === 0 && webTechnologies.length === 0 && frameworksLibraries.length === 0 && databases.length === 0 && (
                <div><span className="text-slate-800">{allSkillsList.join(', ')}</span></div>
              )}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mt-5 space-y-3 font-sans">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Key Projects
            </h2>
            {projects.map((proj, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{proj.title}</span>
                  <div className="text-[11px] font-normal text-slate-600 flex gap-2">
                    {proj.gitHubUrl && <span>GitHub: {proj.gitHubUrl}</span>}
                    {proj.demoUrl && <span>Demo: {proj.demoUrl}</span>}
                  </div>
                </div>
                <p className="text-slate-800 leading-normal">{proj.description}</p>
                {proj.keyContributions && <p className="text-slate-700 italic">• {proj.keyContributions}</p>}
                {proj.techStack && proj.techStack.length > 0 && (
                  <p className="text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">Technologies: </span>
                    {Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mt-5 space-y-2.5 font-sans">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Internships & Experience
            </h2>
            {experience.map((exp, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{exp.role} — {exp.company}{exp.location ? `, ${exp.location}` : ''}</span>
                  <span className="font-normal text-slate-600">{exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : exp.duration}</span>
                </div>
                <p className="text-slate-800 leading-normal">{exp.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Certifications & Achievements */}
        {(certifications.length > 0 || achievements.length > 0 || leadership.length > 0 || workshops.length > 0) && (
          <div className="mt-5 space-y-2 font-sans">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Certifications & Achievements
            </h2>
            <ul className="list-disc list-inside text-xs text-slate-800 space-y-1">
              {certifications.map((c, idx) => (
                <li key={`cert-${idx}`}>
                  <span className="font-semibold">{c.title}</span>
                  {c.issuer && <span> — {c.issuer}</span>}
                  {c.year || c.date ? ` (${c.year || c.date})` : ''}
                </li>
              ))}
              {achievements.map((ach, idx) => <li key={`ach-${idx}`}>{ach}</li>)}
              {leadership.map((lead, idx) => <li key={`lead-${idx}`}><span className="font-semibold">Leadership: </span>{lead}</li>)}
              {workshops.map((w, idx) => <li key={`wk-${idx}`}><span className="font-semibold">Workshop: </span>{w}</li>)}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // --- TEMPLATE 3: MODERN PROFESSIONAL ---
  if (template === 'modern') {
    return (
      <div className="bg-white text-slate-900 font-sans p-8 sm:p-12 shadow-2xl rounded-sm max-w-3xl mx-auto border-t-8 border-indigo-600 print:shadow-none print:border-t-8 print:max-w-none print:w-full print:p-0">
        {/* Header */}
        <div className="flex justify-between items-start pb-6 border-b border-slate-200">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {fullName || 'Your Full Name'}
            </h1>
            <p className="text-sm font-semibold text-indigo-600">
              {professionalTitle || education[0]?.degree || 'Aspiring Software Engineer'}
            </p>
          </div>
          <div className="text-right text-xs space-y-1 text-slate-600 font-medium">
            {email && <div className="flex items-center justify-end gap-1.5"><Mail className="w-3.5 h-3.5 text-indigo-500" />{email}</div>}
            {phone && <div className="flex items-center justify-end gap-1.5"><Phone className="w-3.5 h-3.5 text-indigo-500" />{phone}</div>}
            {location && <div className="flex items-center justify-end gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-500" />{location}</div>}
          </div>
        </div>

        {/* Links bar */}
        {(linkedIn || gitHub || portfolio || additionalLinks.length > 0) && (
          <div className="py-2.5 px-4 bg-indigo-50/60 border-b border-indigo-100 flex flex-wrap gap-4 text-xs font-semibold text-indigo-700">
            {linkedIn && <span className="flex items-center gap-1"><Linkedin className="w-3.5 h-3.5 text-indigo-600" />{linkedIn}</span>}
            {gitHub && <span className="flex items-center gap-1"><Github className="w-3.5 h-3.5 text-indigo-600" />{gitHub}</span>}
            {portfolio && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-indigo-600" />{portfolio}</span>}
            {additionalLinks.map((al, idx) => (
              <span key={idx} className="flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5 text-indigo-600" />{al.platform}: {al.url}</span>
            ))}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="mt-6 space-y-1.5">
            <h2 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Summary
            </h2>
            <p className="text-xs leading-relaxed text-slate-700 font-normal pl-4 border-l-2 border-indigo-100">{summary}</p>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Education
            </h2>
            <div className="space-y-2 pl-4">
              {education.map((edu, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900">{edu.degree}{edu.department ? ` - ${edu.department}` : ''}</h3>
                    <p className="text-slate-600">{edu.institution} {edu.university ? `(${edu.university})` : ''}</p>
                  </div>
                  <div className="text-right shrink-0 font-bold text-indigo-600">
                    {edu.startYear && edu.endYear ? `${edu.startYear} - ${edu.endYear}` : edu.graduationYear} {edu.cgpa && <span className="text-slate-700 font-medium">| {edu.cgpa}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {allSkillsList.length > 0 && (
          <div className="mt-6 space-y-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Technical Skills
            </h2>
            <div className="pl-4 space-y-1.5 text-xs">
              {programmingLanguages.length > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="font-bold text-slate-900 min-w-[110px]">Languages:</span>
                  <div className="flex flex-wrap gap-1">
                    {programmingLanguages.map((s, i) => (
                      <span key={i} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold text-[11px] border border-indigo-100">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {webTechnologies.length > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="font-bold text-slate-900 min-w-[110px]">Web Tech:</span>
                  <div className="flex flex-wrap gap-1">
                    {webTechnologies.map((s, i) => (
                      <span key={i} className="bg-indigo-50/70 text-indigo-800 px-2 py-0.5 rounded font-semibold text-[11px]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {frameworksLibraries.length > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="font-bold text-slate-900 min-w-[110px]">Frameworks:</span>
                  <div className="flex flex-wrap gap-1">
                    {frameworksLibraries.map((s, i) => (
                      <span key={i} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold text-[11px]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {databases.length > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="font-bold text-slate-900 min-w-[110px]">Databases:</span>
                  <div className="flex flex-wrap gap-1">
                    {databases.map((s, i) => (
                      <span key={i} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold text-[11px]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {toolsAndTech.length > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="font-bold text-slate-900 min-w-[110px]">Tools:</span>
                  <div className="flex flex-wrap gap-1">
                    {toolsAndTech.map((s, i) => (
                      <span key={i} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold text-[11px]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Projects
            </h2>
            <div className="pl-4 space-y-3">
              {projects.map((proj, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-slate-900 text-sm">{proj.title}</h3>
                    <div className="text-[11px] font-semibold text-indigo-600 flex gap-3">
                      {proj.gitHubUrl && <span>GitHub</span>}
                      {proj.demoUrl && <span>Demo</span>}
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{proj.description}</p>
                  {proj.keyContributions && <p className="text-indigo-900 font-medium text-[11px]">• {proj.keyContributions}</p>}
                  {proj.techStack && proj.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(Array.isArray(proj.techStack) ? proj.techStack : [proj.techStack]).map((t, i) => (
                        <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Experience
            </h2>
            <div className="pl-4 space-y-2">
              {experience.map((exp, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center font-extrabold text-slate-900">
                    <span>{exp.role} — {exp.company}</span>
                    <span className="text-indigo-600 font-medium">{exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : exp.duration}</span>
                  </div>
                  <p className="text-slate-700">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications & Achievements */}
        {(certifications.length > 0 || achievements.length > 0 || leadership.length > 0) && (
          <div className="mt-6 space-y-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Certifications & Achievements
            </h2>
            <div className="pl-4 text-xs space-y-1.5">
              {certifications.map((c, idx) => (
                <div key={idx} className="flex justify-between text-slate-800">
                  <span className="font-bold">{c.title} {c.issuer ? `— ${c.issuer}` : ''}</span>
                  <span className="text-slate-500 font-semibold">{c.year || c.date}</span>
                </div>
              ))}
              {achievements.map((ach, idx) => (
                <div key={idx} className="text-slate-700">• {ach}</div>
              ))}
              {leadership.map((lead, idx) => (
                <div key={idx} className="text-slate-700">• <span className="font-semibold text-indigo-900">Leadership:</span> {lead}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- TEMPLATE 4: MINIMAL CLEAN ---
  return (
    <div className="bg-white text-slate-900 font-sans p-8 sm:p-12 shadow-2xl rounded-sm max-w-3xl mx-auto border border-slate-200 print:shadow-none print:border-none print:max-w-none print:w-full print:p-0">
      {/* Header */}
      <div className="text-left space-y-1.5 pb-4 border-b-2 border-slate-900">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {fullName || 'YOUR NAME'}
        </h1>
        {professionalTitle && (
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{professionalTitle}</p>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-slate-600 pt-1">
          {email && <span>{email}</span>}
          {phone && <span>• {phone}</span>}
          {location && <span>• {location}</span>}
          {linkedIn && <span>• {linkedIn}</span>}
          {gitHub && <span>• {gitHub}</span>}
          {portfolio && <span>• {portfolio}</span>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="py-3 border-b border-slate-200 space-y-1">
          <p className="text-xs text-slate-700 leading-relaxed italic">{summary}</p>
        </div>
      )}

      {/* Grid Layout for Education & Skills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 border-b border-slate-200">
        {/* Education Column */}
        {education.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Education</h2>
            {education.map((edu, idx) => (
              <div key={idx} className="text-xs space-y-0.5">
                <div className="font-bold text-slate-900">{edu.degree}{edu.department ? ` (${edu.department})` : ''}</div>
                <div className="text-slate-600 text-[11px]">{edu.institution}</div>
                <div className="text-slate-500 text-[10px] font-semibold">
                  {edu.startYear && edu.endYear ? `${edu.startYear} - ${edu.endYear}` : edu.graduationYear} | CGPA: {edu.cgpa}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills Column */}
        {allSkillsList.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Core Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {allSkillsList.map((skill, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-900 text-[11px] font-bold border border-slate-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div className="py-4 border-b border-slate-200 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Projects</h2>
          {projects.map((proj, idx) => (
            <div key={idx} className="text-xs space-y-1">
              <div className="font-bold text-slate-900 flex justify-between">
                <span>{proj.title}</span>
                {proj.techStack && <span className="font-normal text-[11px] text-slate-500">{Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack}</span>}
              </div>
              <p className="text-slate-700 leading-normal">{proj.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Certifications & Achievements */}
      {(certifications.length > 0 || achievements.length > 0 || workshops.length > 0) && (
        <div className="pt-3 space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Certifications & Achievements</h2>
          <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
            {certifications.map((c, idx) => (
              <li key={idx}><span className="font-bold">{c.title}</span> {c.issuer ? `(${c.issuer})` : ''}</li>
            ))}
            {achievements.map((ach, idx) => (
              <li key={idx}>{ach}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResumePreviewTemplates;
