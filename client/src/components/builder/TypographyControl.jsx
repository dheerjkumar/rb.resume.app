import React, { useContext, useState, useEffect, useCallback } from 'react';
import { ResumeContext } from '../../contexts/ResumeContext';
import useTypographyGuard from '../../hooks/useTypographyGuard';
import debounce from 'lodash/debounce';

const TypographyControl = () => {
  const { resume, updateLayoutConfig, resetLayout } = useContext(ResumeContext);
  const typography = resume?.layoutConfig?.typography || {
    bodyFontSize: 11,
    headingFontSize: 14,
    logoSize: 64,
    photoSize: 64,
    sectionSpacing: 8,
  };

  const [bodySize, setBodySize] = useState(typography.bodyFontSize || 11);
  const [headingSize, setHeadingSize] = useState(typography.headingFontSize || 14);
  const [logoSize, setLogoSize] = useState(typography.logoSize || 64);
  const [photoSize, setPhotoSize] = useState(typography.photoSize || 64);
  const [sectionSpacing, setSectionSpacing] = useState(typography.sectionSpacing ?? 8);

  useTypographyGuard(bodySize, headingSize);

  const updateLayoutDebounced = useCallback(
    debounce((newConfig) => {
      updateLayoutConfig(newConfig);
    }, 300),
    [updateLayoutConfig]
  );

  useEffect(() => {
    if (resume?.layoutConfig?.typography) {
      const t = resume.layoutConfig.typography;
      setBodySize(t.bodyFontSize || 11);
      setHeadingSize(t.headingFontSize || 14);
      setLogoSize(t.logoSize || 64);
      setPhotoSize(t.photoSize || 64);
      setSectionSpacing(t.sectionSpacing || 8);
    }
  }, [resume?.layoutConfig?.typography]);

  const buildTypography = (overrides) => ({
    ...typography,
    bodyFontSize: bodySize,
    headingFontSize: headingSize,
    logoSize,
    photoSize,
    sectionSpacing,
    ...overrides,
  });

  const handleBodyChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setBodySize(val);
    updateLayoutDebounced({ typography: buildTypography({ bodyFontSize: val }) });
  };

  const handleHeadingChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setHeadingSize(val);
    updateLayoutDebounced({ typography: buildTypography({ headingFontSize: val }) });
  };

  const handleLogoChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setLogoSize(val);
    updateLayoutDebounced({ typography: buildTypography({ logoSize: val }) });
  };

  const handlePhotoChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setPhotoSize(val);
    updateLayoutDebounced({ typography: buildTypography({ photoSize: val }) });
  };

  const handleSpacingChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setSectionSpacing(val);
    
    // Also broadcast to all specific section spacings so they match the global value
    const newSpacings = {
      education: val, experience: val, projects: val, skills: val, achievements: val, hobbies: val
    };

    updateLayoutDebounced({ 
      typography: buildTypography({ sectionSpacing: val }),
      sectionSpacings: newSpacings
    });
  };

  const Slider = ({ label, value, min, max, unit, onChange }) => (
    <div>
      <label className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-mono">{value}{unit}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
      />
    </div>
  );

  return (
    <div className="pt-6 border-t">
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">Typography &amp; Layout</h3>

      <div className="space-y-4">
        <Slider label="Body Font Size"   value={bodySize}      min={8}  max={16}  unit="pt" onChange={handleBodyChange} />
        <Slider label="Heading Font Size" value={headingSize}   min={10} max={24}  unit="pt" onChange={handleHeadingChange} />
        <Slider label="Logo Size"         value={logoSize}      min={40} max={120} unit="px" onChange={handleLogoChange} />
        <Slider label="Photo Size"        value={photoSize}     min={40} max={120} unit="px" onChange={handlePhotoChange} />
        <Slider label="Section Spacing"   value={sectionSpacing} min={0} max={20}  unit="px" onChange={handleSpacingChange} />
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-2">Layout Controls</h3>
        <button
          onClick={resetLayout}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded transition-colors text-sm"
        >
          Reset to Default Layout
        </button>
      </div>
    </div>
  );
};

export default TypographyControl;
