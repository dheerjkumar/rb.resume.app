import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { SocketContext } from '../../contexts/SocketContext';
import { User, LogOut, Bell, X } from 'lucide-react';

const NotificationBadge = () => {
  const { notifications, removeNotification } = useContext(SocketContext);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-1 text-gray-500 hover:text-accent">
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>
      {open && notifications.length > 0 && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 border">
          {notifications.map(n => (
            <div key={n._id || n.id} className="flex justify-between items-start px-4 py-2 border-b last:border-0 hover:bg-gray-50">
              <span className="text-sm text-gray-700">{n.text}</span>
              <button onClick={() => removeNotification(n._id || n.id)} className="text-gray-400 hover:text-gray-600 ml-2">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const { user, login, logout, loading } = useContext(AuthContext);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-accent">RB</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link to="/guide" className="tour-guide hidden sm:inline-flex text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Guide</Link>
            <Link to="/help" className="tour-help hidden sm:inline-flex text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Help Desk</Link>
            {!loading && (
              user ? (
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <Link to="/community" className="tour-community text-gray-700 hover:text-accent px-3 py-2 text-sm font-medium">Community</Link>
                  <Link to="/inbox" className="tour-inbox text-gray-700 hover:text-accent px-3 py-2 text-sm font-medium">Inbox</Link>
                  <Link to="/dashboard" className="tour-dashboard text-gray-700 hover:text-accent px-3 py-2 text-sm font-medium">Dashboard</Link>
                  <div className="tour-notifications">
                    <NotificationBadge />
                  </div>
                  <div className="flex items-center space-x-2 border-l pl-4">
                    {user.profilePhoto ? (
                      <img src={user.profilePhoto} alt="Profile" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-8 h-8 p-1 rounded-full bg-gray-100 text-gray-600" />
                    )}
                    <button onClick={logout} className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-500 font-medium ml-2" title="Logout">
                      <LogOut size={18} />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={login}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-accent hover:bg-opacity-90 focus:outline-none"
                >
                  Log in with Google
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
