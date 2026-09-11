import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import { debounce } from 'lodash';

export const ResumeContext = createContext();

export const ResumeProvider = ({ children }) => {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Function to load a specific resume
  const loadResume = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await api.get(`/resumes/${id}`);
      setResume(response.data.resume);
    } catch (error) {
      console.error('Error loading resume:', error);
      setResume(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Internal debounced save to prevent spamming the backend
  const debouncedSave = useCallback(
    debounce(async (id, data) => {
      setSaving(true);
      try {
        await api.put(`/resumes/${id}`, data);
      } catch (error) {
        console.error('Error saving resume:', error);
      } finally {
        setSaving(false);
      }
    }, 1000),
    []
  );

  // Update specific section of the resume (e.g., updateSection('personalDetails', { name: 'John' }))
  const updateSection = (sectionName, data) => {
    setResume((prev) => {
      const updated = { ...prev, [sectionName]: data };
      debouncedSave(prev._id, updated);
      return updated;
    });
  };

  // Update layout config (e.g., typography, grid positions, hiddenSections)
  const updateLayoutConfig = (updates) => {
    setResume((prev) => {
      const updated = {
        ...prev,
        layoutConfig: { ...prev.layoutConfig, ...updates },
      };
      debouncedSave(prev._id, updated);
      return updated;
    });
  };

  const DEFAULT_SECTION_SPACINGS = {
    education: 8, experience: 8, projects: 8, skills: 8, achievements: 8, hobbies: 8,
  };

  const resetLayout = () => {
    setResume((prev) => {
      const updated = {
        ...prev,
        layoutConfig: {
          ...prev.layoutConfig,
          sectionOrder: ['education', 'experience', 'projects', 'skills', 'achievements', 'hobbies'],
          hiddenSections: [],
          sectionSpacings: { ...DEFAULT_SECTION_SPACINGS },
          typography: {
            ...prev.layoutConfig?.typography,
            sectionSpacing: 8,
          },
        },
      };
      debouncedSave(prev._id, updated);
      return updated;
    });
  };

  const updateTargetCompany = (name) => {
    setResume((prev) => {
      const updated = { ...prev, targetCompany: name };
      debouncedSave(prev._id, updated);
      return updated;
    });
  };

  const updateEntireResume = (newResumeData) => {
    setResume(newResumeData);
    debouncedSave(newResumeData._id, newResumeData);
  };

  return (
    <ResumeContext.Provider
      value={{
        resume,
        setResume,
        loading,
        saving,
        loadResume,
        updateSection,
        updateLayoutConfig,
        resetLayout,
        updateTargetCompany,
        updateEntireResume,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};
