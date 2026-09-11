import React, { useContext } from 'react';
import { ResumeContext } from '../../../contexts/ResumeContext';

import PersonalDetails from '../sections/PersonalDetails';
import Education from '../sections/Education';
import Experience from '../sections/Experience';
import Projects from '../sections/Projects';
import Skills from '../sections/Skills';
import Achievements from '../sections/Achievements';
import Hobbies from '../sections/Hobbies';

const SECTION_MAP = {
  education: Education,
  experience: Experience,
  projects: Projects,
  skills: Skills,
  achievements: Achievements,
  hobbies: Hobbies,
};

const ClassicATSTemplate = ({ childrenHeaderExtension }) => {
  const { resume } = useContext(ResumeContext);

  const sectionOrder    = resume?.layoutConfig?.sectionOrder    || ['education','experience','projects','skills','achievements','hobbies'];
  const hiddenSections  = resume?.layoutConfig?.hiddenSections  || [];
  const globalSpacing   = resume?.layoutConfig?.typography?.sectionSpacing ?? 4;
  const sectionSpacings = resume?.layoutConfig?.sectionSpacings || {};

  return (
    <div className="w-full flex flex-col template-classic-ats">

      {/*
        Header container — position:relative so that the absolutely-positioned
        photo (from PersonalDetails) and logo (from childrenHeaderExtension)
        stay within this bounding box by default, but react-draggable will
        let them move anywhere on the canvas.
      */}
      <div className="relative mb-2 border-b border-black" style={{ minHeight: '80px' }}>
        <PersonalDetails />
        {/* Logo rendered here — absolutely positioned top-right via Draggable */}
        {childrenHeaderExtension}
      </div>

      {/* Ordered sections with per-section or global spacing */}
      {sectionOrder.map((key, i) => {
        if (hiddenSections.includes(key)) return null;
        const Component = SECTION_MAP[key];
        if (!Component) return null;
        // Per-section spacing overrides global; first section gets no top margin
        const spacing = sectionSpacings[key] !== undefined && sectionSpacings[key] !== null
          ? Number(sectionSpacings[key])
          : Number(globalSpacing);
        return (
          <div key={key} style={{ marginTop: `${spacing}px` }}>
            <Component />
          </div>
        );
      })}
    </div>
  );
};

export default ClassicATSTemplate;
