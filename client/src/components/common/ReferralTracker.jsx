import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';

const generateFingerprint = () => {
  let fp = localStorage.getItem('rb_fingerprint');
  if (!fp) {
    fp = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    localStorage.setItem('rb_fingerprint', fp);
  }
  return fp;
};

const ReferralTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get('ref');

    if (refCode) {
      const fingerprint = generateFingerprint();
      
      // Track silently
      api.post('/users/track-referral', { code: refCode, fingerprint })
        .catch(err => {
          // Silent catch
          console.debug('Referral track failed:', err?.response?.data || err.message);
        });
    }
  }, [location.search]);

  return null;
};

export default ReferralTracker;
