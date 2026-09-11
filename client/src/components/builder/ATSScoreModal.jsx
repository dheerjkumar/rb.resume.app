import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../api/axiosConfig';

const ATSScoreModal = ({ isOpen, onClose, resumeData, onQuotaExceeded, onScoreUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState(resumeData?.lastAtsScore?.jobDescription || '');
  const [showJobInput, setShowJobInput] = useState(!!resumeData?.lastAtsScore?.jobDescription);
  const [result, setResult] = useState(resumeData?.lastAtsScore || null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && resumeData?.lastAtsScore) {
      setResult(resumeData.lastAtsScore);
      setJobDescription(resumeData.lastAtsScore.jobDescription || '');
      setShowJobInput(!!resumeData.lastAtsScore.jobDescription);
    } else if (isOpen && !resumeData?.lastAtsScore) {
      setResult(null);
    }
  }, [isOpen, resumeData]);

  if (!isOpen) return null;

  const handleCheck = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await api.post('/resumes/ats-score', {
        resumeData,
        jobDescription: showJobInput ? jobDescription : ''
      });
      setResult(response.data);
      if (onScoreUpdated) {
        onScoreUpdated({ ...response.data, jobDescription: showJobInput ? jobDescription : '' });
      }
    } catch (err) {
      if (err.response?.status === 429 || err.response?.data?.message === 'QUOTA_EXCEEDED') {
        onClose();
        onQuotaExceeded();
      } else {
        setError(err.response?.data?.message || 'Couldn\'t generate a score, try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">ATS Score Checker</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!result && !loading && (
            <div className="space-y-6">
              <p className="text-gray-600">
                Our AI will analyze your resume against Applicant Tracking System best practices and give you actionable feedback.
              </p>
              
              <div className="border rounded-lg p-4 bg-gray-50">
                <button 
                  onClick={() => setShowJobInput(!showJobInput)}
                  className="flex items-center justify-between w-full font-semibold text-gray-700"
                >
                  <span>Optional: Paste a Job Description</span>
                  {showJobInput ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                
                {showJobInput && (
                  <textarea
                    className="w-full mt-4 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                    rows="6"
                    placeholder="Paste the job description here to get a tailored keyword match score..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                )}
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center gap-2">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <button
                onClick={handleCheck}
                className="w-full bg-accent text-white py-3 rounded-md font-bold hover:bg-opacity-90 transition-colors"
              >
                Scan Resume Now
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              <p className="text-gray-500 font-medium">Scanning your resume...</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-8">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={getScoreColor(result.score)}
                      strokeWidth="3"
                      strokeDasharray={`${result.score}, 100`}
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-4xl font-bold text-gray-800">{result.score}</div>
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-800">Overall ATS Score</h3>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Score Breakdown</h4>
                <div className="space-y-4">
                  {result.breakdown.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm font-medium mb-1">
                        <span className="text-gray-700">{item.category}</span>
                        <span className={getScoreColor(item.score)}>{item.score}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div className={`h-2 rounded-full ${item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${item.score}%` }}></div>
                      </div>
                      <p className="text-xs text-gray-500">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Top Suggestions to Improve</h4>
                <ul className="space-y-2">
                  {result.suggestions.map((sug, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-blue-50 p-3 rounded-md">
                      <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setResult(null)}
                className="w-full border border-gray-300 text-gray-700 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Scan Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ATSScoreModal;
