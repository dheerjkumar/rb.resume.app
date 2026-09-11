import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import api from '../api/axiosConfig';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      api.get('/notifications').then(res => {
        setNotifications(res.data.notifications.filter(n => !n.read));
      }).catch(err => console.error(err));
    } else {
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    let newSocket;
    if (user) {
      newSocket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', {
        withCredentials: true
      });
      
      newSocket.on('connect', () => {
        newSocket.emit('join', user._id);
      });

      newSocket.on('notification', (data) => {
        setNotifications(prev => [{ _id: data.id, text: data.text, link: data.link, read: false }, ...prev]);
      });

      newSocket.on('post_liked', (data) => {
        setNotifications(prev => [{ _id: Date.now().toString(), type: 'like', text: `${data.by} liked your post.` }, ...prev]);
      });

      newSocket.on('comment_added', (data) => {
        setNotifications(prev => [{ _id: Date.now().toString(), type: 'comment', text: `${data.by} commented on your post.` }, ...prev]);
      });

      setSocket(newSocket);
    }

    return () => {
      if (newSocket) newSocket.close();
    };
  }, [user]);

  const removeNotification = async (id) => {
    // Optimistic UI update
    setNotifications(prev => prev.filter(n => n._id !== id && n.id !== id));
    // If it's a real DB ObjectId (24 chars), mark it as read on the backend
    if (id && id.toString().length === 24) {
      try {
        await api.patch(`/notifications/${id}/read`);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, removeNotification }}>
      {children}
    </SocketContext.Provider>
  );
};
