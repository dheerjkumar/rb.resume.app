import React, { useContext } from 'react';
import { ResumeContext } from '../../../contexts/ResumeContext';

const Skills = () => {
  const { resume } = useContext(ResumeContext);
  const skills = resume?.skills || [];
  if (skills.length === 0) return null;

  const headingSize = resume?.layoutConfig?.typography?.headingFontSize || 14;

  return (
    <div className="w-full">
      <h2 className="border-b-[1.5px] border-black uppercase text-sm font-bold tracking-wider mb-1 pb-0.5" style={{ fontSize: `${headingSize}pt` }}>Technical Skills</h2>
      <div className="leading-tight space-y-0.5">
        {skills.map((skill, idx) => (
          <div key={idx}>
            <span className="font-bold">{skill.category}: </span>
            <span>{skill.items}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Skills;
