import React, { useContext } from 'react';
import { ResumeContext } from '../../../contexts/ResumeContext';

const Experience = () => {
  const { resume } = useContext(ResumeContext);
  const experience = resume?.experience || [];
  if (experience.length === 0) return null;

  const headingSize = resume?.layoutConfig?.typography?.headingFontSize || 14;

  return (
    <div className="w-full">
      <h2 className="border-b-[1.5px] border-black uppercase text-sm font-bold tracking-wider mb-1 pb-0.5" style={{ fontSize: `${headingSize}pt` }}>Experience</h2>
      <div className="space-y-1.5">
        {experience.map((exp, idx) => (
          <div key={idx} className="flex flex-col leading-tight">
            <div className="flex justify-between items-baseline">
              <span className="font-bold">{exp.company}</span>
              <span className="font-normal">{exp.location}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="italic">{exp.role}</span>
              <span className="italic">{exp.duration}</span>
            </div>
            {exp.description && (
              <div 
                className="prose prose-sm max-w-none text-black mt-0.5 ml-4 leading-snug prose-li:my-0 prose-ul:my-0 prose-p:my-0"
                dangerouslySetInnerHTML={{ __html: exp.description }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default Experience;
