import React, { useContext, useState } from 'react';
import { ResumeContext } from '../../../contexts/ResumeContext';
import RichTextEditor from '../RichTextEditor';
import { ChevronDown, ChevronUp, Trash2, Plus, Sparkles } from 'lucide-react';
import api from '../../../api/axiosConfig';

/** Validates whether the html has enough content for AI enhancement */
function isEnhanceReady(html) {
  if (!html) return false;
  const liCount = (html.match(/<li/gi) || []).length;
  const wordCount = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return liCount >= 2 && wordCount >= 50;
}

const AccordionItem = ({ title, isOpen, onToggle, children, sectionKey }) => {
  const { resume, updateLayoutConfig } = useContext(ResumeContext);
  const isHidden = resume?.layoutConfig?.hiddenSections?.includes(sectionKey);

  const toggleVisibility = (e) => {
    e.stopPropagation();
    let updatedHidden = [...(resume?.layoutConfig?.hiddenSections || [])];
    if (isHidden) {
      updatedHidden = updatedHidden.filter(k => k !== sectionKey);
    } else {
      updatedHidden.push(sectionKey);
    }
    updateLayoutConfig({ hiddenSections: updatedHidden });
  };

  const moveUp = (e) => {
    e.stopPropagation();
    const order = [...(resume?.layoutConfig?.sectionOrder || ['education', 'experience', 'projects', 'skills', 'achievements', 'hobbies'])];
    const idx = order.indexOf(sectionKey);
    if (idx > 0) {
      [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
      updateLayoutConfig({ sectionOrder: order });
    }
  };

  const moveDown = (e) => {
    e.stopPropagation();
    const order = [...(resume?.layoutConfig?.sectionOrder || ['education', 'experience', 'projects', 'skills', 'achievements', 'hobbies'])];
    const idx = order.indexOf(sectionKey);
    if (idx !== -1 && idx < order.length - 1) {
      [order[idx + 1], order[idx]] = [order[idx], order[idx + 1]];
      updateLayoutConfig({ sectionOrder: order });
    }
  };

  return (
    <div className="border border-gray-200 rounded-md mb-2 bg-white overflow-hidden shadow-sm">
      <div 
        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-2">
          {sectionKey !== 'personal' && (
            <div className="flex flex-col space-y-1 mr-2">
              <button onClick={moveUp} className="text-gray-400 hover:text-accent p-0.5 rounded"><ChevronUp size={14}/></button>
              <button onClick={moveDown} className="text-gray-400 hover:text-accent p-0.5 rounded"><ChevronDown size={14}/></button>
            </div>
          )}
          <span className="font-semibold text-sm text-gray-800 uppercase tracking-wide">{title}</span>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer text-xs text-gray-600" onClick={e => e.stopPropagation()}>
            <input 
              type="checkbox" 
              checked={!isHidden} 
              onChange={toggleVisibility}
              className="rounded text-accent focus:ring-accent"
            />
            <span>Include</span>
          </label>
          {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </div>
      </div>
      {isOpen && (
        <div className="p-4 border-t border-gray-200 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

export const PersonalDetailsForm = () => {
  const { resume, updateSection } = useContext(ResumeContext);
  const data = resume?.personalDetails || {};
  const [showPhotoUpload, setShowPhotoUpload] = useState(!!data.photoUrl);

  const handleChange = (field, value) => updateSection('personalDetails', { ...data, [field]: value });

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('photoUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
        <input type="text" value={data.name || ''} onChange={e => handleChange('name', e.target.value)} className="w-full border-gray-300 rounded text-sm p-2 border" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
          <input type="text" value={data.phone || ''} onChange={e => handleChange('phone', e.target.value)} className="w-full border-gray-300 rounded text-sm p-2 border" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={data.email || ''} onChange={e => handleChange('email', e.target.value)} className="w-full border-gray-300 rounded text-sm p-2 border" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
        <input type="text" value={data.location || ''} onChange={e => handleChange('location', e.target.value)} className="w-full border-gray-300 rounded text-sm p-2 border" />
      </div>
      <div className="pt-2">
          <label className="flex items-center space-x-2 cursor-pointer text-xs text-gray-600" onClick={e => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={showPhotoUpload}
              onChange={e => {
                const checked = e.target.checked;
                setShowPhotoUpload(checked);
                if (!checked) {
                  // clear uploaded photo from resume
                  handleChange('photoUrl', '');
                }
              }}
              className="rounded text-accent focus:ring-accent"
            />
            <span>Include Profile Photo?</span>
          </label>

        {showPhotoUpload && (
          <div className="mt-2">
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-xs text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
            {data.photoUrl && <p className="text-xs text-green-600 mt-1 italic">Photo uploaded successfully.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export const HyperlinksForm = () => {
  const { resume, updateSection } = useContext(ResumeContext);
  const links = resume?.hyperlinks || [];

  const handleUpdate = (idx, field, value) => {
    const updated = [...links];
    updated[idx] = { ...updated[idx], [field]: value };
    updateSection('hyperlinks', updated);
  };
  const handleAdd = () => updateSection('hyperlinks', [...links, { label: '', url: '' }]);
  const handleRemove = (idx) => updateSection('hyperlinks', links.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {links.map((link, idx) => (
        <div key={idx} className="flex space-x-2 items-center bg-gray-50 p-2 rounded border border-gray-200">
          <input type="text" placeholder="Label (e.g. GitHub)" value={link.label || ''} onChange={e => handleUpdate(idx, 'label', e.target.value)} className="w-1/3 text-sm p-1 border rounded" />
          <input type="text" placeholder="URL" value={link.url || ''} onChange={e => handleUpdate(idx, 'url', e.target.value)} className="flex-1 text-sm p-1 border rounded" />
          <button onClick={() => handleRemove(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/></button>
        </div>
      ))}
      <button onClick={handleAdd} className="text-xs text-accent flex items-center space-x-1 font-medium"><Plus size={14}/> <span>Add Link</span></button>
    </div>
  );
};

export const EducationForm = () => {
  const { resume, updateSection } = useContext(ResumeContext);
  const education = resume?.education || [];

  const handleUpdate = (idx, field, value) => {
    const updated = [...education];
    updated[idx] = { ...updated[idx], [field]: value };
    updateSection('education', updated);
  };
  const handleAdd = () => updateSection('education', [...education, { institution: '', degree: '', location: '', duration: '', score: '' }]);
  const handleRemove = (idx) => updateSection('education', education.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      {education.map((edu, idx) => (
        <div key={idx} className="border border-gray-200 p-3 rounded bg-gray-50 space-y-3 relative">
          <button onClick={() => handleRemove(idx)} className="absolute top-2 right-2 text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={14}/></button>
          <div className="grid grid-cols-2 gap-3 pr-6">
            <div><label className="text-xs text-gray-500">Institution</label><input type="text" value={edu.institution || ''} onChange={e => handleUpdate(idx, 'institution', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
            <div><label className="text-xs text-gray-500">Location</label><input type="text" value={edu.location || ''} onChange={e => handleUpdate(idx, 'location', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
            <div><label className="text-xs text-gray-500">Degree/Board</label><input type="text" value={edu.degree || ''} onChange={e => handleUpdate(idx, 'degree', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
            <div><label className="text-xs text-gray-500">Duration</label><input type="text" value={edu.duration || ''} onChange={e => handleUpdate(idx, 'duration', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
            <div className="col-span-2"><label className="text-xs text-gray-500">Score/GPA</label><input type="text" value={edu.score || ''} onChange={e => handleUpdate(idx, 'score', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
          </div>
        </div>
      ))}
      <button onClick={handleAdd} className="text-xs text-accent flex items-center space-x-1 font-medium"><Plus size={14}/> <span>Add Education</span></button>
    </div>
  );
};

export const ExperienceForm = () => {
  const { resume, updateSection } = useContext(ResumeContext);
  const experience = resume?.experience || [];
  const [enhancing, setEnhancing] = useState({});

  const handleUpdate = (idx, field, value) => {
    const updated = [...experience];
    updated[idx] = { ...updated[idx], [field]: value };
    updateSection('experience', updated);
  };
  const handleAdd    = () => updateSection('experience', [...experience, { company: '', role: '', location: '', duration: '', description: '' }]);
  const handleRemove = (idx) => updateSection('experience', experience.filter((_, i) => i !== idx));

  const handleEnhance = async (idx) => {
    const html = experience[idx]?.description;
    setEnhancing(prev => ({ ...prev, [idx]: true }));
    try {
      const { data } = await api.post('/ai/enhance', { html });
      handleUpdate(idx, 'description', data.html);
    } catch (err) {
      alert(err?.response?.data?.message || 'AI enhancement failed. Try again.');
    } finally {
      setEnhancing(prev => ({ ...prev, [idx]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {experience.map((exp, idx) => {
        const ready = isEnhanceReady(exp.description);
        return (
          <div key={idx} className="border border-gray-200 p-3 rounded bg-gray-50 space-y-3 relative">
            <button onClick={() => handleRemove(idx)} className="absolute top-2 right-2 text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={14}/></button>
            <div className="grid grid-cols-2 gap-3 pr-6">
              <div><label className="text-xs text-gray-500">Company</label><input type="text" value={exp.company || ''} onChange={e => handleUpdate(idx, 'company', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
              <div><label className="text-xs text-gray-500">Location</label><input type="text" value={exp.location || ''} onChange={e => handleUpdate(idx, 'location', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
              <div><label className="text-xs text-gray-500">Role</label><input type="text" value={exp.role || ''} onChange={e => handleUpdate(idx, 'role', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
              <div><label className="text-xs text-gray-500">Duration</label><input type="text" value={exp.duration || ''} onChange={e => handleUpdate(idx, 'duration', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">Description</label>
                <button
                  onClick={() => handleEnhance(idx)}
                  disabled={!ready || enhancing[idx]}
                  title={ready ? 'Enhance with AI' : 'Add at least 2 bullet points and 50 words to enable AI enhancement'}
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${
                    ready && !enhancing[idx]
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles size={12} />
                  {enhancing[idx] ? 'Enhancing…' : 'Enhance with AI'}
                </button>
              </div>
              <div className="bg-white border border-gray-300 rounded p-1">
                <RichTextEditor content={exp.description} onChange={val => handleUpdate(idx, 'description', val)} />
              </div>
              {!ready && exp.description && (
                <p className="text-xs text-gray-400 mt-1">Add at least 2 bullet points and 50 words to enable AI enhancement.</p>
              )}
            </div>
          </div>
        );
      })}
      <button onClick={handleAdd} className="text-xs text-accent flex items-center space-x-1 font-medium"><Plus size={14}/> <span>Add Experience</span></button>
    </div>
  );
};

export const ProjectsForm = () => {
  const { resume, updateSection } = useContext(ResumeContext);
  const projects = resume?.projects || [];
  const [enhancing, setEnhancing] = useState({});

  const handleUpdate = (idx, field, value) => {
    const updated = [...projects];
    updated[idx] = { ...updated[idx], [field]: value };
    updateSection('projects', updated);
  };
  const handleAdd    = () => updateSection('projects', [...projects, { title: '', technologies: '', link: '', linkLabel: '', duration: '', description: '' }]);
  const handleRemove = (idx) => updateSection('projects', projects.filter((_, i) => i !== idx));

  const handleEnhance = async (idx) => {
    const html = projects[idx]?.description;
    setEnhancing(prev => ({ ...prev, [idx]: true }));
    try {
      const { data } = await api.post('/ai/enhance', { html });
      handleUpdate(idx, 'description', data.html);
    } catch (err) {
      alert(err?.response?.data?.message || 'AI enhancement failed. Try again.');
    } finally {
      setEnhancing(prev => ({ ...prev, [idx]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {projects.map((proj, idx) => {
        const ready = isEnhanceReady(proj.description);
        return (
          <div key={idx} className="border border-gray-200 p-3 rounded bg-gray-50 space-y-3 relative">
            <button onClick={() => handleRemove(idx)} className="absolute top-2 right-2 text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={14}/></button>
            <div className="grid grid-cols-2 gap-3 pr-6">
              <div><label className="text-xs text-gray-500">Title</label><input type="text" value={proj.title || ''} onChange={e => handleUpdate(idx, 'title', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
              <div><label className="text-xs text-gray-500">Link URL</label><input type="text" value={proj.link || ''} onChange={e => handleUpdate(idx, 'link', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
              <div><label className="text-xs text-gray-500">Link Label (e.g. "Live Demo")</label><input type="text" value={proj.linkLabel || ''} placeholder="e.g. Live Demo" onChange={e => handleUpdate(idx, 'linkLabel', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
              <div><label className="text-xs text-gray-500">Technologies</label><input type="text" value={proj.technologies || ''} onChange={e => handleUpdate(idx, 'technologies', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
              <div><label className="text-xs text-gray-500">Duration</label><input type="text" value={proj.duration || ''} onChange={e => handleUpdate(idx, 'duration', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">Description</label>
                <button
                  onClick={() => handleEnhance(idx)}
                  disabled={!ready || enhancing[idx]}
                  title={ready ? 'Enhance with AI' : 'Add at least 2 bullet points and 50 words to enable AI enhancement'}
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${
                    ready && !enhancing[idx]
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles size={12} />
                  {enhancing[idx] ? 'Enhancing…' : 'Enhance with AI'}
                </button>
              </div>
              <div className="bg-white border border-gray-300 rounded p-1">
                <RichTextEditor content={proj.description} onChange={val => handleUpdate(idx, 'description', val)} />
              </div>
              {!ready && proj.description && (
                <p className="text-xs text-gray-400 mt-1">Add at least 2 bullet points and 50 words to enable AI enhancement.</p>
              )}
            </div>
          </div>
        );
      })}
      <button onClick={handleAdd} className="text-xs text-accent flex items-center space-x-1 font-medium"><Plus size={14}/> <span>Add Project</span></button>
    </div>
  );
};

export const SkillsForm = () => {
  const { resume, updateSection } = useContext(ResumeContext);
  const skills = resume?.skills || [];

  const handleUpdate = (idx, field, value) => {
    const updated = [...skills];
    updated[idx] = { ...updated[idx], [field]: value };
    updateSection('skills', updated);
  };
  const handleAdd = () => updateSection('skills', [...skills, { category: '', items: '' }]);
  const handleRemove = (idx) => updateSection('skills', skills.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {skills.map((skill, idx) => (
        <div key={idx} className="flex space-x-2 items-start bg-gray-50 p-2 rounded border border-gray-200">
          <input type="text" placeholder="Category (e.g. Languages)" value={skill.category || ''} onChange={e => handleUpdate(idx, 'category', e.target.value)} className="w-1/3 text-sm p-1.5 border rounded" />
          <textarea placeholder="Comma separated items" value={skill.items || ''} onChange={e => handleUpdate(idx, 'items', e.target.value)} className="flex-1 text-sm p-1.5 border rounded" rows={2} />
          <button onClick={() => handleRemove(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded mt-1"><Trash2 size={14}/></button>
        </div>
      ))}
      <button onClick={handleAdd} className="text-xs text-accent flex items-center space-x-1 font-medium"><Plus size={14}/> <span>Add Skill Category</span></button>
    </div>
  );
};

export const AchievementsForm = () => {
  const { resume, updateSection } = useContext(ResumeContext);
  const achievements = resume?.achievements || [];

  const handleUpdate = (idx, field, value) => {
    const updated = [...achievements];
    updated[idx] = { ...updated[idx], [field]: value };
    updateSection('achievements', updated);
  };
  const handleAdd = () => updateSection('achievements', [...achievements, { title: '', organization: '', description: '', date: '' }]);
  const handleRemove = (idx) => updateSection('achievements', achievements.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      {achievements.map((ach, idx) => (
        <div key={idx} className="border border-gray-200 p-3 rounded bg-gray-50 space-y-3 relative">
          <button onClick={() => handleRemove(idx)} className="absolute top-2 right-2 text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={14}/></button>
          <div className="grid grid-cols-2 gap-3 pr-6">
            <div><label className="text-xs text-gray-500">Title</label><input type="text" value={ach.title || ''} onChange={e => handleUpdate(idx, 'title', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
            <div><label className="text-xs text-gray-500">Organization</label><input type="text" value={ach.organization || ''} onChange={e => handleUpdate(idx, 'organization', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
            <div className="col-span-2"><label className="text-xs text-gray-500">Description</label><input type="text" value={ach.description || ''} onChange={e => handleUpdate(idx, 'description', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
            <div><label className="text-xs text-gray-500">Date/Year</label><input type="text" value={ach.date || ''} onChange={e => handleUpdate(idx, 'date', e.target.value)} className="w-full text-sm p-1.5 border rounded" /></div>
          </div>
        </div>
      ))}
      <button onClick={handleAdd} className="text-xs text-accent flex items-center space-x-1 font-medium"><Plus size={14}/> <span>Add Achievement</span></button>
    </div>
  );
};

export const HobbiesForm = () => {
  const { resume, updateSection } = useContext(ResumeContext);
  const hobbies = resume?.hobbies || [];

  const handleUpdate = (idx, field, value) => {
    const updated = [...hobbies];
    updated[idx] = { ...updated[idx], [field]: value };
    updateSection('hobbies', updated);
  };
  const handleAdd = () => updateSection('hobbies', [...hobbies, { name: '', role: '' }]);
  const handleRemove = (idx) => updateSection('hobbies', hobbies.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {hobbies.map((hob, idx) => (
        <div key={idx} className="flex space-x-2 items-center bg-gray-50 p-2 rounded border border-gray-200">
          <input type="text" placeholder="Organization/Hobby" value={hob.name || ''} onChange={e => handleUpdate(idx, 'name', e.target.value)} className="flex-1 text-sm p-1.5 border rounded" />
          <input type="text" placeholder="Role (Optional)" value={hob.role || ''} onChange={e => handleUpdate(idx, 'role', e.target.value)} className="flex-1 text-sm p-1.5 border rounded" />
          <button onClick={() => handleRemove(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/></button>
        </div>
      ))}
      <button onClick={handleAdd} className="text-xs text-accent flex items-center space-x-1 font-medium"><Plus size={14}/> <span>Add Extracurricular/Hobby</span></button>
    </div>
  );
};

export const AccordionFormList = () => {
  const [openSection, setOpenSection] = useState('personal');
  
  const handleToggle = (sec) => {
    setOpenSection(openSection === sec ? null : sec);
  };

  const { resume } = useContext(ResumeContext);
  const sectionOrder = resume?.layoutConfig?.sectionOrder || ['education', 'experience', 'projects', 'skills', 'achievements', 'hobbies'];

  const FORM_MAP = {
    education: { title: "Education", component: EducationForm },
    experience: { title: "Experience", component: ExperienceForm },
    projects: { title: "Projects", component: ProjectsForm },
    skills: { title: "Technical Skills", component: SkillsForm },
    achievements: { title: "Honors & Awards", component: AchievementsForm },
    hobbies: { title: "Extracurriculars", component: HobbiesForm },
  };

  return (
    <div className="mt-6 space-y-1">
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">Content</h3>
      <AccordionItem title="Personal & Contacts" isOpen={openSection === 'personal'} onToggle={() => handleToggle('personal')} sectionKey="personal">
        <PersonalDetailsForm />
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Hyperlinks</h4>
          <HyperlinksForm />
        </div>
      </AccordionItem>
      
      {sectionOrder.map((key) => {
        const formMeta = FORM_MAP[key];
        if (!formMeta) return null;
        const FormComponent = formMeta.component;
        return (
          <AccordionItem 
            key={key} 
            title={formMeta.title} 
            isOpen={openSection === key} 
            onToggle={() => handleToggle(key)} 
            sectionKey={key}
          >
            <FormComponent />
          </AccordionItem>
        );
      })}
    </div>
  );
};
