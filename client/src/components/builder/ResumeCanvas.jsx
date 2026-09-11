import React, { useContext, useRef, useEffect, useState } from 'react';
import { ResumeContext } from '../../contexts/ResumeContext';
import ClassicATSTemplate from './templates/ClassicATSTemplate';
import NIRFInstituteTemplate from './templates/NIRFInstituteTemplate';

const PAGE_WIDTH  = 794;   // A4 @ 96dpi
const PAGE_HEIGHT = 1123;

const ResumeCanvas = () => {
  const { resume } = useContext(ResumeContext);
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const [scale, setScale]         = useState(1);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Scale the A4 sheet to fit the available container width
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const available = entry.contentRect.width - 32; // subtract padding
        const newScale  = Math.min(1, available / PAGE_WIDTH);
        setScale(newScale > 0 ? newScale : 1);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Overflow detection
  useEffect(() => {
    if (!canvasRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setIsOverflowing(entry.contentRect.height > PAGE_HEIGHT);
      }
    });
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  const templateId = resume?.layoutConfig?.templateId || 'classic_ats';
  const typography = resume?.layoutConfig?.typography || { bodyFontSize: 11, headingFontSize: 14 };

  const getTemplate = () => {
    switch (templateId) {
      case 'nirf_institute': return <NIRFInstituteTemplate />;
      default:               return <ClassicATSTemplate />;
    }
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      {isOverflowing && (
        <div className="w-full max-w-[794px] bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-3 mb-4 rounded shadow-sm text-sm pointer-events-auto">
          <strong>Warning:</strong> Your resume content exceeds a single A4 page. Try adjusting typography or content.
        </div>
      )}

      {/*
        Outer wrapper: actual rendered size = PAGE_WIDTH * scale
        Inner sheet:   always PAGE_WIDTH px but scaled via transform-origin top-left
      */}
      <div
        style={{
          width:  PAGE_WIDTH * scale,
          height: 'auto',
          overflow: 'visible',
        }}
      >
        <div
          className="bg-white shadow-xl text-black resume-paper-canvas"
          style={{
            width:           PAGE_WIDTH,
            minHeight:       PAGE_HEIGHT,
            transformOrigin: 'top left',
            transform:       `scale(${scale})`,
            fontSize:        `${typography.bodyFontSize}pt`,
            fontFamily:      '"Times New Roman", Times, serif',
          }}
        >
          <div ref={canvasRef} className="w-full p-10 leading-tight">
            {getTemplate()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeCanvas;
