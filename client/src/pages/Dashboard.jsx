import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { Plus, FileText, Settings, LogOut, Trash2, Mail, Gift } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

const Dashboard = () => {
  const [resumes, setResumes] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    fetchResumes();
    if (user?.isAdmin) fetchFeedback();
  }, [user]);

  const fetchResumes = async () => {
    try {
      const response = await api.get('/resumes/history');
      setResumes(response.data.resumes);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await api.get('/feedback');
      setFeedback(response.data.feedback);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const handleCreateNew = async () => {
    try {
      const response = await api.post('/resumes', {
        targetCompany: 'Untitled Resume',
        templateId: 'classic_ats'
      });
      navigate(`/builder/${response.data.resume._id}`);
    } catch (error) {
      console.error('Failed to create resume:', error);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // prevent navigating to builder
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        await api.delete(`/resumes/${id}`);
        setResumes(resumes.filter(r => r._id !== id));
      } catch (error) {
        console.error('Failed to delete resume:', error);
      }
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">Your Resumes</h2>
        </div>

        {/* Refer & Earn Widget */}
        {user && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-purple-900 mb-1 flex items-center gap-2">
                <Gift className="text-purple-600" size={20} /> Refer & Earn Bonus Exports
              </h3>
              <p className="text-sm text-purple-700">
                Get 5 unique visits to your link in a week to unlock 5 daily PDF exports! 
                (Current progress: <strong>{user.referralVisits?.length || 0} / 5</strong>)
              </p>
              {user.bonusQuotaExpiringAt && new Date(user.bonusQuotaExpiringAt) > new Date() && (
                <p className="text-xs text-green-600 font-semibold mt-1">
                  Bonus active until {new Date(user.bonusQuotaExpiringAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto bg-white border border-purple-200 rounded px-3 py-2">
              <span className="text-sm text-gray-500 font-mono truncate max-w-[200px]">
                {window.location.origin}/?ref={user.referralCode}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(`${window.location.origin}/?ref=${user.referralCode}`);
                  alert('Copied to clipboard!');
                }}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 uppercase tracking-wide ml-2"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {/* Create New Card */}
          <div 
            onClick={handleCreateNew}
            className="h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-accent hover:text-accent transition-colors cursor-pointer bg-white"
          >
            <Plus size={32} className="mb-2" />
            <span className="font-medium">Create New Resume</span>
          </div>

          {/* Existing Resumes */}
          {resumes.map((resume) => (
            <div 
              key={resume._id} 
              onClick={() => navigate(`/builder/${resume._id}`)}
              className="h-64 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col group relative overflow-hidden"
            >
              <button 
                onClick={(e) => handleDelete(e, resume._id)}
                className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-2 rounded-full z-10 bg-white shadow-sm border border-gray-100"
                title="Delete Resume"
              >
                <Trash2 size={16} />
              </button>
              <div className="flex-1 bg-gray-50 rounded-t-xl flex items-center justify-center border-b">
                <FileText size={48} className="text-gray-300" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 truncate">{resume.targetCompany || 'Untitled Resume'}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Updated {new Date(resume.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {user?.isAdmin && (
          <div className="mt-8 border-t pt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Admin Panel: User Feedback</h2>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {feedback.length === 0 ? (
                <p className="p-6 text-gray-500 text-center">No feedback received yet.</p>
              ) : (
                <div className="divide-y">
                  {feedback.map(item => (
                    <div key={item._id} className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <img src={item.userId?.profilePhoto || 'https://via.placeholder.com/40'} alt="Avatar" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                          <div>
                            <p className="font-bold text-gray-900">{item.name || item.userId?.name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">{item.email || item.userId?.email || 'No email provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-400">{new Date(item.createdAt).toLocaleString()}</span>
                          {item.userId && (
                            <button onClick={() => navigate(`/inbox?userId=${item.userId._id}`)} className="flex items-center gap-1 bg-accent text-white px-3 py-1.5 rounded hover:bg-opacity-90">
                              <Mail size={14} /> Message
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 bg-gray-50 p-4 rounded text-sm text-gray-700 whitespace-pre-wrap">
                        {item.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
