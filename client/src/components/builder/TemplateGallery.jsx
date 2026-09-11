import React, { useContext, useEffect, useState } from 'react';
import { ResumeContext } from '../../contexts/ResumeContext';
import api from '../../api/axiosConfig';

const templates = [
  { id: 'classic_ats', name: 'Classic ATS', thumb: '📄' },
  { id: 'nirf_institute', name: 'NIRF Institute', thumb: '🏫' },
];

const TemplateGallery = () => {
  const { resume, updateLayoutConfig } = useContext(ResumeContext);
  const activeTemplate = resume?.layoutConfig?.templateId || 'classic_ats';
  
  const [institutes, setInstitutes] = useState([]);
  useEffect(() => {
    if (activeTemplate === 'nirf_institute') {
      api.get('/institutes/nirf').then(res => setInstitutes(res.data.institutes)).catch(() => {});
    }
  }, [activeTemplate]);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3">Templates</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => updateLayoutConfig({ templateId: tpl.id })}
            className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${
              activeTemplate === tpl.id
                ? 'border-accent bg-accent-bg ring-2 ring-accent ring-opacity-50'
                : 'border-gray-200 hover:border-accent hover:bg-gray-50'
            }`}
          >
            <span className="text-2xl mb-2">{tpl.thumb}</span>
            <span className="text-xs font-medium text-gray-700 text-center">{tpl.name}</span>
          </button>
        ))}
      </div>
      
      {activeTemplate === 'nirf_institute' && (
        <div className="mt-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Select Institute Logo</label>
          <select 
            value={resume?.layoutConfig?.instituteId?._id || resume?.layoutConfig?.instituteId || ''}
            onChange={(e) => updateLayoutConfig({ instituteId: e.target.value || null })}
            className="w-full text-sm border-gray-300 rounded p-2"
          >
            <option value="">-- No Logo --</option>
            {institutes.map(inst => (
              <option key={inst._id} value={inst._id}>{inst.category} {inst.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
