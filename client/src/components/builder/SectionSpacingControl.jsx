import React, { useContext, useState, useEffect, useCallback } from 'react';
import { ResumeContext } from '../../contexts/ResumeContext';
import debounce from 'lodash/debounce';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SECTIONS = [
  { key: 'education',    label: 'Education' },
  { key: 'experience',   label: 'Experience' },
  { key: 'projects',     label: 'Projects' },
  { key: 'skills',       label: 'Technical Skills' },
  { key: 'achievements', label: 'Honors & Awards' },
  { key: 'hobbies',      label: 'Extracurriculars' },
];

const DEFAULT_SPACINGS = {
  education: 8, experience: 8, projects: 8, skills: 8, achievements: 8, hobbies: 8,
};

const SectionSpacingControl = () => {
  const { resume, updateLayoutConfig } = useContext(ResumeContext);
  const [open, setOpen] = useState(true); // open by default
  const [spacings, setSpacings] = useState({ ...DEFAULT_SPACINGS });

  useEffect(() => {
    if (resume?.layoutConfig?.sectionSpacings) {
      // Convert Mongoose sub-document (which has _id etc) to plain values
      const raw = resume.layoutConfig.sectionSpacings;
      const plain = {};
      Object.keys(DEFAULT_SPACINGS).forEach(k => {
        const v = raw[k];
        plain[k] = (v !== undefined && v !== null) ? Number(v) : DEFAULT_SPACINGS[k];
      });
      setSpacings(plain);
    }
  }, [resume?.layoutConfig?.sectionSpacings]);

  const saveDebounced = useCallback(
    debounce((newSpacings) => {
      updateLayoutConfig({ sectionSpacings: newSpacings });
    }, 300),
    [updateLayoutConfig]
  );

  const handleChange = (key, val) => {
    const next = { ...spacings, [key]: val };
    setSpacings(next);
    saveDebounced(next);
  };

  const handleReset = () => {
    setSpacings({ ...DEFAULT_SPACINGS });
    updateLayoutConfig({ sectionSpacings: { ...DEFAULT_SPACINGS } });
  };

  return (
    <div className="pt-4 border-t">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-sm font-semibold text-gray-800 uppercase tracking-wider mb-2"
      >
        <span>Per-Section Spacing</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="space-y-3 mt-2">
          <p className="text-xs text-gray-500">
            Override the global spacing for each section individually (0 = tightest).
          </p>

          {SECTIONS.map(({ key, label }) => (
            <div key={key}>
              <label className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{label}</span>
                <span className="font-mono">{spacings[key] ?? 4}px</span>
              </label>
              <input
                type="range"
                min={0}
                max={20}
                value={spacings[key] ?? 4}
                onChange={e => handleChange(key, parseInt(e.target.value, 10))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
          ))}

          <button
            onClick={handleReset}
            className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-1.5 px-3 rounded transition-colors border border-gray-300"
          >
            Reset Section Spacing to Default
          </button>
        </div>
      )}
    </div>
  );
};

export default SectionSpacingControl;
