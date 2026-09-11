import React, { useContext } from 'react';
import { ResumeContext } from '../../../contexts/ResumeContext';

const Achievements = () => {
  const { resume } = useContext(ResumeContext);
  const achievements = resume?.achievements || [];
  if (achievements.length === 0) return null;

  const headingSize = resume?.layoutConfig?.typography?.headingFontSize || 14;

  return (
    <div className="w-full">
      <h2 className="border-b-[1.5px] border-black uppercase text-sm font-bold tracking-wider mb-1 pb-0.5" style={{ fontSize: `${headingSize}pt` }}>Honors and Awards</h2>
      <div className="space-y-1">
        {achievements.map((ach, idx) => (
          <div key={idx} className="flex flex-col leading-tight">
            <div className="flex justify-between items-baseline">
              <span className="font-bold">{ach.title}</span>
              <span className="font-normal">{ach.organization}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="italic">{ach.description}</span>
              <span className="italic">{ach.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Achievements;
