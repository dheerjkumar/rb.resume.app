import React, { useContext, useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../api/axiosConfig';

const OnboardingTour = () => {
  const { user, completeTour } = useContext(AuthContext);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    if (user && user.hasSeenTour === false) {
      setRunTour(true);
      // Mark as seen immediately in DB so a page refresh doesn't trigger it again,
      // but do it silently via fetch so we don't trigger a React Context update
      // that would instantly unmount the tour while they are looking at it.
      api.patch('/users/tour').catch(console.error);
    } else {
      setRunTour(false);
    }
  }, [user]);

  const steps = [
    {
      target: 'body',
      content: 'Welcome to RB! Let us give you a quick tour to help you get started.',
      placement: 'center',
    },
    {
      target: '.tour-dashboard',
      content: 'Your Dashboard is where you can view all your generated resumes, track your referrals, and create new resumes using our ATS-friendly templates.',
    },
    {
      target: '.tour-community',
      content: 'Check out the Community! You can read career tips, share your own advice, and follow other users to build your professional network.',
    },
    {
      target: '.tour-inbox',
      content: 'This is your Inbox. Send direct messages to other users to collaborate, ask questions, or network privately.',
    },
    {
      target: '.tour-guide',
      content: 'Need help understanding how the platform works? The Guide has a quick rundown of our history and basic instructions.',
    },
    {
      target: '.tour-help',
      content: 'Visit the Help Desk if you ever need to contact us or submit feedback. We read every message!',
    },
  ];

  const handleJoyrideCallback = async (data) => {
    const { status, action, type } = data;
    if (
      status === STATUS.FINISHED || 
      status === STATUS.SKIPPED || 
      action === 'close' || 
      type === 'tour:end'
    ) {
      setRunTour(false);
      // Write to DB — this is permanent across all devices/browsers
      await completeTour();
    }
  };

  if (!user || user.hasSeenTour) return null;

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#aa3bff',
        },
      }}
    />
  );
};

export default OnboardingTour;

