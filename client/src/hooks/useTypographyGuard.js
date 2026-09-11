import { useEffect } from 'react';

const useTypographyGuard = (bodyFontSize, headingFontSize) => {
  useEffect(() => {
    // In a real app, this could trigger a toast notification system
    if (bodyFontSize < 9) {
      console.warn('Warning: Body font size below 9pt may be unreadable.');
    } else if (bodyFontSize > 14) {
      console.warn('Warning: Body font size above 14pt is unusually large for standard resumes.');
    }

    if (headingFontSize < 11) {
      console.warn('Warning: Heading font size is very small.');
    }
  }, [bodyFontSize, headingFontSize]);
};

export default useTypographyGuard;
