import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { ResumeContext } from '../contexts/ResumeContext';
import ResumeCanvas from '../components/builder/ResumeCanvas';
import TemplateGallery from '../components/builder/TemplateGallery';
import TypographyControl from '../components/builder/TypographyControl';
import SectionSpacingControl from '../components/builder/SectionSpacingControl';
import { AccordionFormList } from '../components/builder/forms/AccordionForms';
import { ChevronLeft, Eye, Settings, Download, X, Sparkles, Share2, Mail, Target } from 'lucide-react';
import api from '../api/axiosConfig';
import ATSScoreModal from '../components/builder/ATSScoreModal';

// ── Quota-exceeded modal ────────────────────────────────────────────────────
const QuotaModal = ({ onClose, referralCode }) => {
  const refLink = `${window.location.origin}/?ref=${referralCode}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm mx-4 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Daily Limit Reached</h2>
        <p className="text-sm text-gray-600 mb-4">
          You've used your PDF exports for today. Refer friends to unlock more!
        </p>
        <div className="bg-gray-100 p-3 rounded text-left mb-4 break-all">
          <p className="text-xs text-gray-500 mb-1">Your referral link:</p>
          <p className="text-sm font-mono text-gray-800">{refLink}</p>
        </div>
        <div>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto">
            <X size={12} /> Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── LaTeX templates (server-side export) ───────────────────────────────────
const LATEX_TEMPLATES = new Set(['classic_ats', 'nirf_institute']);

const Builder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const { resume, loadResume, saving, updateTargetCompany, updateEntireResume, setResume } = useContext(ResumeContext);
  const canvasRef = useRef(null);
  const [mobileTab, setMobileTab] = useState('form');
  const [exporting, setExporting] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAtsModal, setShowAtsModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const isAtsReady = resume && 
    resume.personalDetails?.name && 
    ((resume.experience && resume.experience.length > 0) || (resume.projects && resume.projects.length > 0));
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (id) loadResume(id);
  }, [id, loadResume]);

  const handlePolish = async () => {
    if (!resume) return;
    setPolishing(true);
    try {
      const { data } = await api.post('/ai/polish-resume', { resumeData: resume });
      if (data.resume) {
        updateEntireResume(data.resume);
      }
    } catch (err) {
      console.error('Polish error:', err);
      alert(err?.response?.data?.message || 'Failed to polish resume. Please try again.');
    } finally {
      setPolishing(false);
    }
  };

  // Internal helper to get the blob
  const _generatePdfBlob = async () => {
    const templateId = resume.layoutConfig?.templateId || 'classic_ats';
    if (LATEX_TEMPLATES.has(templateId)) {
      const response = await api.post('/export/latex', { resumeId: resume._id }, { responseType: 'blob' });
      return new Blob([response.data], { type: 'application/pdf' });
    } else {
      const { default: html2pdf } = await import('html2pdf.js');
      const element = document.querySelector('.resume-paper-canvas');
      if (!element) throw new Error('Resume canvas not found');
      
      const blob = await html2pdf()
        .set({
          margin: 0,
          filename: 'resume.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
        })
        .from(element)
        .outputPdf('blob');
      return blob;
    }
  };

  const handleExport = async () => {
    if (!resume) return;
    setExporting(true);
    try {
      const blob = await _generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(resume.targetCompany || 'Resume').replace(/[^a-z0-9]/gi, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      // Explicitly deduct quota only after successful export
      await api.post('/export/track');
    } catch (err) {
      if (err?.response?.status === 429 || err?.response?.data?.code === 'QUOTA_EXCEEDED') {
        setShowQuotaModal(true);
      } else {
        showToast(err?.response?.data?.message || err?.message || 'Export failed.');
      }
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    if (!resume) return;
    setExporting(true);
    try {
      const blob = await _generatePdfBlob();
      const file = new File([blob], `${(resume.targetCompany || 'Resume').replace(/[^a-z0-9]/gi, '_')}.pdf`, { type: 'application/pdf' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Resume',
          files: [file]
        });
      } else {
        // Fallback to clipboard
        showToast('Sharing not supported on this browser. File downloaded instead.');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      // Explicitly deduct quota only if the user didn't cancel the share popup
      await api.post('/export/track');
    } catch (err) {
      if (err.name === 'AbortError') return; // User cancelled share
      if (err?.response?.status === 429 || err?.response?.data?.code === 'QUOTA_EXCEEDED') {
        setShowQuotaModal(true);
      } else {
        showToast(err?.message || 'Share failed.');
      }
    } finally {
      setExporting(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!resume || !emailInput) return;
    setShowEmailModal(false);
    setEmailing(true);
    try {
      await api.post('/export/email', { resumeId: resume._id, email: emailInput });
      showToast('Email sent successfully!');
    } catch (err) {
      if (err?.response?.status === 429 || err?.response?.data?.code === 'QUOTA_EXCEEDED') {
        setShowQuotaModal(true);
      } else {
        showToast(err?.response?.data?.message || err?.message || 'Email failed.');
      }
    } finally {
      setEmailing(false);
      setEmailInput('');
    }
  };

  if (!resume) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500 text-sm">
        Loading builder…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {showQuotaModal && <QuotaModal onClose={() => setShowQuotaModal(false)} />}

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b px-3 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-800 p-1.5 border rounded-md bg-white hover:bg-gray-50 flex-shrink-0"
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="text"
            className="text-base font-semibold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-accent focus:outline-none focus:ring-0 px-1 min-w-0 max-w-[140px] sm:max-w-xs truncate"
            value={resume.targetCompany || ''}
            onChange={e => updateTargetCompany(e.target.value)}
            placeholder="Untitled Resume"
          />
        </div>

        <div className="flex items-center gap-2 text-sm flex-shrink-0">
          <span className={`hidden sm:inline text-xs ${saving ? 'text-gray-400' : 'text-green-600'}`}>
            {saving ? 'Saving…' : 'Saved'}
          </span>
          <button
            onClick={() => setShowAtsModal(true)}
            disabled={!isAtsReady}
            title={isAtsReady ? "Scan resume for ATS compatibility" : "Fill Personal Details and at least one Experience or Project to check ATS score"}
            className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded shadow hover:bg-blue-200 text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Target size={14} />
            Check ATS Score
          </button>
          <button
            onClick={handlePolish}
            disabled={polishing || !resume}
            title="Fix typos and grammar across entire resume"
            className="flex items-center gap-1.5 bg-purple-100 text-purple-700 px-3 py-1.5 rounded shadow hover:bg-purple-200 text-xs sm:text-sm disabled:opacity-60 transition-colors"
          >
            <Sparkles size={14} />
            {polishing ? 'Polishing…' : 'Polish Resume'}
          </button>
          <button
            onClick={handleShare}
            disabled={exporting}
            className="hidden sm:flex items-center gap-1.5 bg-gray-100 text-gray-700 border px-3 py-1.5 rounded shadow-sm hover:bg-gray-200 text-xs sm:text-sm disabled:opacity-60"
          >
            <Share2 size={14} />
            Share
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            disabled={emailing}
            className="hidden sm:flex items-center gap-1.5 bg-gray-100 text-gray-700 border px-3 py-1.5 rounded shadow-sm hover:bg-gray-200 text-xs sm:text-sm disabled:opacity-60"
          >
            <Mail size={14} />
            {emailing ? 'Sending...' : 'Email'}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 bg-accent text-white px-3 py-1.5 rounded shadow hover:bg-opacity-90 text-xs sm:text-sm disabled:opacity-60"
          >
            <Download size={14} />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </header>

      {/* Main Builder Content */}

      {/* Custom UI elements */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-gray-400 hover:text-white">&times;</button>
        </div>
      )}

      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Email PDF</h2>
            <p className="text-gray-600 mb-6 text-sm">Enter the email address you want to send your resume to.</p>
            <input 
              type="email" 
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full border rounded p-2 mb-4 focus:ring focus:ring-accent"
              autoFocus
            />
            <div className="flex gap-4 justify-center">
              <button 
                onClick={handleEmailSubmit}
                disabled={!emailInput}
                className="bg-accent text-white px-6 py-2 rounded font-semibold hover:bg-opacity-90 disabled:opacity-50"
              >
                Send
              </button>
              <button 
                onClick={() => setShowEmailModal(false)}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile tab switcher ───────────────────────────────────────── */}
      <div className="flex md:hidden border-b bg-white sticky top-[57px] z-10">
        <button
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 ${mobileTab === 'form' ? 'border-b-2 border-accent text-accent' : 'text-gray-500'}`}
        >
          <Settings size={14}/> Edit
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 ${mobileTab === 'preview' ? 'border-b-2 border-accent text-accent' : 'text-gray-500'}`}
        >
          <Eye size={14}/> Preview
        </button>
      </div>

      {/* ── Main Workspace ───────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Pane */}
        <aside
          className={`
            ${mobileTab === 'form' ? 'flex' : 'hidden'} md:flex
            w-full md:w-[38%] lg:w-[32%]
            bg-white border-r overflow-y-auto flex-col p-4 sm:p-6 space-y-6
          `}
        >
          <TemplateGallery />
          <TypographyControl />
          <SectionSpacingControl />
          <AccordionFormList />
        </aside>

        {/* Right Pane — preview */}
        <main
          ref={canvasRef}
          className={`
            ${mobileTab === 'preview' ? 'flex' : 'hidden'} md:flex
            flex-1 overflow-y-auto p-4 sm:p-8 flex-col items-center bg-gray-200
          `}
        >
          <ResumeCanvas />
        </main>

      </div>
      <ATSScoreModal 
        isOpen={showAtsModal}
        onClose={() => setShowAtsModal(false)}
        resumeData={resume}
        onQuotaExceeded={() => setShowQuotaModal(true)}
        onScoreUpdated={(newScore) => setResume(prev => ({ ...prev, lastAtsScore: newScore }))}
      />
    </div>
  );
};

export default Builder;
