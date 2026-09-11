import React, { useContext } from 'react';
import { ResumeContext } from '../../../contexts/ResumeContext';

const Education = () => {
  const { resume } = useContext(ResumeContext);
  const education = resume?.education || [];
  if (education.length === 0) return null;

  const headingSize = resume?.layoutConfig?.typography?.headingFontSize || 14;

  return (
    <div className="w-full">
      <h2 className="border-b-[1.5px] border-black uppercase text-sm font-bold tracking-wider mb-1 pb-0.5" style={{ fontSize: `${headingSize}pt` }}>Education</h2>
      <div className="space-y-1">
        {education.map((edu, idx) => (
          <div key={idx} className="flex flex-col leading-tight">
            <div className="flex justify-between items-baseline">
              <span className="font-bold">{edu.institution}</span>
              <span className="font-normal">{edu.location}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="italic">{edu.degree} {edu.score ? `(Score: ${edu.score})` : ''}</span>
              <span className="italic">{edu.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Education;
