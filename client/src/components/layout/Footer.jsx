import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
        <p className="text-sm text-gray-500">
          All rights reserved 2026–2027, made with love.
        </p>
        <div className="flex space-x-6 mt-4 sm:mt-0">
          <Link to="/contact" className="text-gray-400 hover:text-gray-500">
            Contact
          </Link>
          <Link to="/feedback" className="text-gray-400 hover:text-gray-500">
            Feedback
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
