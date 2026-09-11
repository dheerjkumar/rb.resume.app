import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import ClassicATSTemplate from './ClassicATSTemplate';
import { ResumeContext } from '../../../contexts/ResumeContext';
import api from '../../../api/axiosConfig';
import Draggable from 'react-draggable';

/* Stable sub-component with its own nodeRef so react-draggable always finds the DOM node */
const LogoWidget = ({ institute, logoSize, defaultPos, onStop }) => {
  const nodeRef = useRef(null);
  if (!institute) return null;
  return (
    <Draggable nodeRef={nodeRef} defaultPosition={defaultPos} onStop={onStop}>
      <div
        ref={nodeRef}
        title="Drag to move logo"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 'auto',
          width: logoSize,
          height: logoSize,
          cursor: 'move',
          zIndex: 30,
          background: '#fff',
          padding: 2,
        }}
      >
        <img
          src={institute.logoUrl}
          alt={institute.name}
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
        />
      </div>
    </Draggable>
  );
};

const NIRFInstituteTemplate = () => {
  const { resume, updateLayoutConfig } = useContext(ResumeContext);
  const [institutes, setInstitutes] = useState([]);

  useEffect(() => {
    api.get('/institutes/nirf')
      .then(res => setInstitutes(res.data.institutes || []))
      .catch(() => {});
  }, []);

  /* Robust id comparison — handles both string and ObjectId */
  const savedId = String(
    resume?.layoutConfig?.instituteId?._id ??
    resume?.layoutConfig?.instituteId ??
    ''
  );
  const activeInstitute = savedId ? institutes.find(i => String(i._id) === savedId) : null;

  const logoSize = resume?.layoutConfig?.typography?.logoSize || 64;
  const logoPos  = resume?.layoutConfig?.positions?.logoPosition || { x: 0, y: 0 };

  const handleDragStop = useCallback((e, d) => {
    updateLayoutConfig({
      positions: { ...resume?.layoutConfig?.positions, logoPosition: { x: d.x, y: d.y } },
    });
  }, [resume?.layoutConfig?.positions, updateLayoutConfig]);

  /* LogoEl is now a stable component, not inline JSX, so nodeRef always works */
  const LogoEl = (
    <LogoWidget
      institute={activeInstitute}
      logoSize={logoSize}
      defaultPos={logoPos}
      onStop={handleDragStop}
    />
  );

  return <ClassicATSTemplate childrenHeaderExtension={LogoEl} />;
};

export default NIRFInstituteTemplate;
