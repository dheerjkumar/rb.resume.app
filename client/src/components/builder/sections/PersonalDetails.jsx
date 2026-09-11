import React, { useContext, useRef, useCallback, useState, useEffect } from 'react';
import { ResumeContext } from '../../../contexts/ResumeContext';
import Draggable from 'react-draggable';
import { Phone, Mail, MapPin, Link as LinkIcon, Globe } from 'lucide-react';
import api from '../../../api/axiosConfig';

const getIconForUrl = (url) => {
  if (!url) return <LinkIcon size={12} className="inline mr-1" />;
  const lower = url.toLowerCase();
  if (lower.includes('github.com') || lower.includes('linkedin.com')) {
    return <Globe size={12} className="inline mr-1" />;
  }
  return <LinkIcon size={12} className="inline mr-1" />;
};

/* ── Draggable Photo ─────────────────────────────────────────────────────── */
const DraggablePhoto = ({ photoUrl, photoSize, defaultPos, onStop }) => {
  const nodeRef = useRef(null);
  if (!photoUrl) return null;
  return (
    <Draggable nodeRef={nodeRef} defaultPosition={defaultPos} onStop={onStop}>
      <div
        ref={nodeRef}
        title="Drag to move photo"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 'auto',
          width: photoSize,
          height: photoSize,
          cursor: 'move',
          zIndex: 30,
          border: '1px solid #ccc',
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <img
          src={photoUrl}
          alt="Profile"
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
        />
      </div>
    </Draggable>
  );
};

/* ── Draggable Logo ──────────────────────────────────────────────────────── */
const DraggableLogo = ({ logoUrl, logoName, logoSize, defaultPos, onStop }) => {
  const nodeRef = useRef(null);
  if (!logoUrl) return null;
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
          src={logoUrl}
          alt={logoName}
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
        />
      </div>
    </Draggable>
  );
};

/* ── PersonalDetails ─────────────────────────────────────────────────────── */
const PersonalDetails = () => {
  const { resume, updateLayoutConfig } = useContext(ResumeContext);
  const data  = resume?.personalDetails || {};
  const links = resume?.hyperlinks || [];

  const photoSize = resume?.layoutConfig?.typography?.photoSize || 64;
  const photoPos  = resume?.layoutConfig?.positions?.photoPosition || { x: 0, y: 0 };

  const handlePhotoDragStop = useCallback((e, d) => {
    updateLayoutConfig({
      positions: { ...resume?.layoutConfig?.positions, photoPosition: { x: d.x, y: d.y } },
    });
  }, [resume?.layoutConfig?.positions, updateLayoutConfig]);

  return (
    /* position:relative so absolutely-placed photo stays inside this block by default */
    <div className="relative pb-2" style={{ paddingRight: data.photoUrl ? photoSize + 8 : 0 }}>
      <h1 className="text-3xl font-bold text-black leading-tight">{data.name || 'Your Name'}</h1>

      <div className="flex flex-wrap items-center text-[10pt] gap-x-2 gap-y-0.5 mt-1">
        {data.phone    && <span className="flex items-center"><Phone  size={12} className="mr-1"/>{data.phone}</span>}
        {data.phone && data.email    && <span>|</span>}
        {data.email    && <span className="flex items-center"><Mail   size={12} className="mr-1"/>{data.email}</span>}
        {data.email && data.location && <span>|</span>}
        {data.location && <span className="flex items-center"><MapPin size={12} className="mr-1"/>{data.location}</span>}
      </div>

      {links.length > 0 && (
        <div className="flex flex-wrap items-center text-[10pt] gap-x-2 mt-0.5">
          {links.map((link, idx) => (
            <React.Fragment key={idx}>
              {link.label && link.url && (
                <a href={link.url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center text-black hover:text-gray-700">
                  {getIconForUrl(link.url)}{link.label}
                </a>
              )}
              {idx < links.length - 1 && <span>|</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Profile photo — rendered with a stable component so nodeRef lifecycle is clean */}
      <DraggablePhoto
        photoUrl={data.photoUrl}
        photoSize={photoSize}
        defaultPos={photoPos}
        onStop={handlePhotoDragStop}
      />
    </div>
  );
};

export default PersonalDetails;
