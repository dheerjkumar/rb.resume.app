import React, { useContext } from 'react';
import { ResumeContext } from '../../../contexts/ResumeContext';

const Hobbies = () => {
  const { resume } = useContext(ResumeContext);
  const hobbies = resume?.hobbies || [];
  if (hobbies.length === 0) return null;

  const headingSize = resume?.layoutConfig?.typography?.headingFontSize || 14;

  return (
    <div className="w-full">
      <h2 className="border-b-[1.5px] border-black uppercase text-sm font-bold tracking-wider mb-1 pb-0.5" style={{ fontSize: `${headingSize}pt` }}>Extracurricular Activities</h2>
      <div className="space-y-0.5">
        {hobbies.map((hob, idx) => (
          <div key={idx} className="flex leading-tight">
            <span className="font-bold">{hob.name}</span>
            {hob.role && <span> | <span className="italic">{hob.role}</span></span>}
          </div>
        ))}
      </div>
    </div>
  );
};
export default Hobbies;
