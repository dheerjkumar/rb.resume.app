import React, { useState } from 'react';
import api from '../../api/axiosConfig';

import { ChevronDown, ChevronUp } from 'lucide-react';

export const HelpDesk = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "How many resumes can I export, share, or email?",
      answer: "To ensure fast and reliable performance for all users, each account is limited to exporting, sharing, or emailing a resume 2 times per 24-hour period. If you need more, check out the 'Refer & Earn' section on your Dashboard to unlock up to 5 daily exports by inviting friends!"
    },
    {
      question: "How can I get the best results from the AI Assistant?",
      answer: "Our AI is great at transforming rough notes into professional bullet points. For the best results, provide a clear, factual baseline of your responsibilities (e.g., 'managed a team of 5 and increased sales by 10%'), and let the AI rewrite it with strong action verbs and ATS-friendly phrasing. Always review the output to ensure it accurately reflects your real experience."
    },
    {
      question: "Are these resume templates ATS-friendly?",
      answer: "Yes! All of our templates (Classic, Modern, Minimal, and Professional) are specifically engineered to be readable by Applicant Tracking Systems (ATS). We avoid complicated multi-column layouts and background graphics that often confuse automated parsers."
    },
    {
      question: "How do I connect and communicate with other users?",
      answer: "Navigate to the Community tab to read career advice, share your own posts, and follow other professionals. If you want to reach out privately for networking or advice, just click the 'Message' button on their Community post to start a direct chat in your Inbox."
    },
    {
      question: "How do I manage or delete my data?",
      answer: "You are in full control of your data. You can delete any resume directly from your Dashboard by clicking the red trash can icon on the resume card. You can also edit or delete your Community posts, and securely unsend/delete direct messages from your Inbox at any time."
    }
  ];

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-3">Help Desk & FAQ</h1>
      <p className="text-gray-600 mb-8">Welcome to the RB Help Desk. Browse our frequently asked questions below, or reach out to us if you need further assistance.</p>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors focus:outline-none"
            >
              <span className="font-semibold text-gray-800">{faq.question}</span>
              {openFaq === index ? (
                <ChevronUp className="text-accent flex-shrink-0 ml-4" size={20} />
              ) : (
                <ChevronDown className="text-gray-400 flex-shrink-0 ml-4" size={20} />
              )}
            </button>
            {openFaq === index && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-gray-700 leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Guide = () => (
  <div className="max-w-3xl mx-auto py-12 px-4">
    <h1 className="text-3xl font-bold mb-6">Beginner's Guide & History</h1>
    <p className="text-gray-700 mb-4">RB (Resume Builder) was founded in 2026 to help professionals build ATS-friendly, beautiful resumes effortlessly.</p>
    <h2 className="text-2xl font-semibold mt-8 mb-4">How to use RB</h2>
    <ul className="list-disc pl-5 space-y-2 text-gray-700">
      <li>Choose a template from the Gallery.</li>
      <li>Fill in your details in the Builder.</li>
      <li>Use our AI to enhance your bullet points.</li>
      <li>Export to PDF and start applying!</li>
    </ul>
  </div>
);

export const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/feedback', formData);
      setStatus('Message sent successfully!');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Failed to send message.');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">Contact Us / Help Desk</h1>
      
      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-8 text-sm shadow-sm border border-blue-100">
        <h2 className="font-bold mb-2 flex items-center gap-2">📌 Important Facts & FAQ</h2>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Response Time:</strong> We typically respond within 24-48 hours.</li>
          <li><strong>Bugs & Issues:</strong> If you're experiencing a PDF export failure, wait a few minutes and try again.</li>
          <li><strong>Feature Requests:</strong> Use the "Feedback" form below to request new templates.</li>
          <li><strong>Direct Email:</strong> You can also email us directly at <em>support@resumebuilder.com</em>.</li>
        </ul>
      </div>

      {status && <div className={`mb-4 font-medium p-3 rounded-lg ${status.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{status}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Message *</label>
          <textarea required rows={4} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="mt-1 block w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50" />
        </div>
        <button type="submit" className="w-full bg-accent text-white py-2 px-4 rounded-md hover:bg-opacity-90">Send Message</button>
      </form>
    </div>
  );
};

export const Feedback = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/feedback', formData);
      setStatus('Feedback submitted successfully! Thank you.');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Failed to submit feedback.');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">Leave Feedback</h1>
      
      <div className="bg-purple-50 text-purple-800 p-4 rounded-lg mb-8 text-sm shadow-sm border border-purple-100">
        <h2 className="font-bold mb-2 flex items-center gap-2">💡 Why your feedback matters</h2>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Continuous Improvement:</strong> Your suggestions directly influence our roadmap.</li>
          <li><strong>Template Ideas:</strong> Tell us what ATS templates you'd like to see next!</li>
          <li><strong>Report Issues:</strong> If you find a bug, let us know here so we can fix it.</li>
        </ul>
      </div>

      {status && <div className={`mb-4 font-medium p-3 rounded-lg ${status.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{status}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name (Optional)</label>
          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Message *</label>
          <textarea required rows={4} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="What can we improve?" className="mt-1 block w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50" />
        </div>
        <button type="submit" className="w-full bg-accent text-white py-2 px-4 rounded-md hover:bg-opacity-90">Submit Feedback</button>
      </form>
    </div>
  );
};
