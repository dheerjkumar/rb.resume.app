import React, { useContext } from 'react';
import { ResumeContext } from '../../../contexts/ResumeContext';

const Projects = () => {
  const { resume } = useContext(ResumeContext);
  const projects = resume?.projects || [];
  if (projects.length === 0) return null;

  const headingSize = resume?.layoutConfig?.typography?.headingFontSize || 14;

  return (
    <div className="w-full">
      <h2 className="border-b-[1.5px] border-black uppercase text-sm font-bold tracking-wider mb-1 pb-0.5" style={{ fontSize: `${headingSize}pt` }}>Projects</h2>
      <div className="space-y-1.5">
        {projects.map((proj, idx) => (
          <div key={idx} className="flex flex-col leading-tight">
            <div className="flex justify-between items-baseline">
              <span className="font-bold">
                {proj.link ? (
                  <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-700">
                    {proj.title}
                  </a>
                ) : (
                  proj.title
                )}
              </span>
              <span className="italic">{proj.duration}</span>
            </div>
            {proj.technologies && (
              <div className="italic text-sm">{proj.technologies}</div>
            )}
            {proj.description && (
              <div 
                className="prose prose-sm max-w-none text-black mt-0.5 ml-4 leading-snug prose-li:my-0 prose-ul:my-0 prose-p:my-0"
                dangerouslySetInnerHTML={{ __html: proj.description }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default Projects;
