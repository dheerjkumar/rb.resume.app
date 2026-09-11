import React, { useEffect, useState, useContext, useRef } from 'react';
import api from '../api/axiosConfig';
import { AuthContext } from '../contexts/AuthContext';
import { SocketContext } from '../contexts/SocketContext';
import { Send, User, MoreVertical, Edit2, Trash2 } from 'lucide-react';

const Inbox = () => {
  const { user: currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  // Edit State
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editInput, setEditInput] = useState('');
  
  const [menuOpenId, setMenuOpenId] = useState(null);

  const query = new URLSearchParams(window.location.search);
  const initiateUserId = query.get('userId');

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activePartner) {
      fetchMessages(activePartner._id);
    }
  }, [activePartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg) => {
      const msgSenderId = msg.sender?._id?.toString() ?? msg.sender?.toString();
      const msgRecipientId = msg.recipient?._id?.toString() ?? msg.recipient?.toString();
      const partnerId = activePartner?._id?.toString();
      if (activePartner && (msgSenderId === partnerId || msgRecipientId === partnerId)) {
        setMessages(prev => {
          if (!prev.find(m => m._id === msg._id)) return [...prev, msg];
          return prev;
        });
      }
      fetchConversations(); // update latest message and unread count
    };

    const handleMessageEdited = (msg) => {
      setMessages(prev => prev.map(m => m._id === msg._id ? msg : m));
      setConversations(prev => prev.map(c => c.latestMessage?._id === msg._id ? { ...c, latestMessage: msg } : c));
    };

    const handleMessageDeleted = (msg) => {
      setMessages(prev => prev.map(m => m._id === msg._id ? msg : m));
      setConversations(prev => prev.map(c => c.latestMessage?._id === msg._id ? { ...c, latestMessage: msg } : c));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, activePartner]);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/messages');
      let loadedConvos = data.conversations.filter(c => c.partner._id !== currentUser._id);
      
      if (initiateUserId && initiateUserId !== currentUser?._id?.toString()) {
        const existing = loadedConvos.find(c => c.partner._id === initiateUserId);
        if (existing) {
          setActivePartner(existing.partner);
        } else {
          const userRes = await api.get(`/users/${initiateUserId}/profile`);
          if (userRes.data.profile) {
            const newPartner = userRes.data.profile;
            loadedConvos = [{ partner: newPartner, unreadCount: 0 }, ...loadedConvos];
            setActivePartner(newPartner);
          }
        }
      } else if (loadedConvos.length > 0 && !activePartner) {
        setActivePartner(loadedConvos[0].partner);
      }
      
      setConversations(loadedConvos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const { data } = await api.get(`/messages/${userId}`);
      setMessages(data.messages);
      
      setConversations(prev => prev.map(c => 
        c.partner._id === userId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activePartner) return;

    if (editingMessageId) {
      try {
        const { data } = await api.patch(`/messages/${editingMessageId}`, { content: input });
        setMessages(prev => prev.map(m => m._id === data.message._id ? data.message : m));
        setEditingMessageId(null);
        setInput('');
      } catch (err) {
        alert('Failed to edit message.');
      }
      return;
    }

    try {
      const { data } = await api.post('/messages', {
        recipient: activePartner._id,
        content: input
      });
      setMessages(prev => [...prev, data.message]);
      setInput('');
      
      setConversations(prev => {
        let exists = false;
        const mapped = prev.map(c => {
          if (c.partner._id === activePartner._id) {
            exists = true;
            return { ...c, latestMessage: data.message };
          }
          return c;
        });
        if (!exists) {
          mapped.unshift({ partner: activePartner, latestMessage: data.message, unreadCount: 0 });
        }
        return mapped;
      });
    } catch (err) {
      alert('Failed to send message.');
    }
  };

  const handleDelete = async (msgId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const { data } = await api.delete(`/messages/${msgId}`);
      setMessages(prev => prev.map(m => m._id === data.message._id ? data.message : m));
      setMenuOpenId(null);
    } catch (err) {
      alert('Failed to delete message.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading inbox...</div>;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 h-[calc(100vh-140px)]">
      <div className="bg-white rounded-xl shadow-sm border flex h-full overflow-hidden">
        
        {/* Left Pane: Conversations */}
        <div className="w-1/3 border-r flex flex-col bg-gray-50">
          <div className="p-4 border-b bg-white font-bold text-gray-800">Messages</div>
          <div className="overflow-y-auto flex-1">
            {conversations.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No conversations yet.</p>
            ) : (
              conversations.map((conv) => (
                <div 
                  key={conv.partner._id}
                  onClick={() => { setActivePartner(conv.partner); setEditingMessageId(null); setInput(''); }}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-100 flex items-center gap-3 ${activePartner?._id === conv.partner._id ? 'bg-indigo-50 border-l-4 border-l-accent' : ''}`}
                >
                  <img src={conv.partner.profilePhoto || 'https://via.placeholder.com/40'} alt="avatar" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-sm truncate">{conv.partner.name}</p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">{conv.unreadCount}</span>
                      )}
                    </div>
                    {conv.partner.email && (
                      <p className="text-[10px] text-gray-400 truncate">{conv.partner.email}</p>
                    )}
                    <p className="text-xs text-gray-500 truncate">
                      {conv.latestMessage?.isDeleted ? <i>This message was deleted</i> : conv.latestMessage?.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Messages */}
        <div className="w-2/3 flex flex-col bg-white" onClick={() => setMenuOpenId(null)}>
          {activePartner ? (
            <>
              <div className="p-4 border-b bg-white flex items-center gap-3 shadow-sm z-10">
                <img src={activePartner.profilePhoto || 'https://via.placeholder.com/40'} alt="avatar" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                <div>
                  <h3 className="font-bold">{activePartner.name}</h3>
                  {activePartner.email && <p className="text-xs text-gray-500">{activePartner.email}</p>}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3 relative">
                {messages.map((msg) => {
                  const senderId = msg.sender?._id ?? msg.sender;
                  const isMine = senderId?.toString() === currentUser?._id?.toString();
                  const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={msg._id} className={`flex items-start gap-1 max-w-[70%] ${isMine ? 'self-end flex-row-reverse' : 'self-start'}`}>
                      <div className={`relative px-4 py-2 rounded-2xl ${isMine ? 'bg-accent text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none shadow-sm'}`}>
                        {msg.isDeleted ? (
                          <p className="text-sm italic opacity-75">This message was deleted</p>
                        ) : (
                          <p className="text-sm break-words">{msg.content}</p>
                        )}
                        <div className={`text-[10px] mt-1 flex gap-1 items-center justify-end ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {msg.edited && !msg.isDeleted && <span>(edited)</span>}
                          <span>{timeStr}</span>
                        </div>
                      </div>
                      
                      {isMine && !msg.isDeleted && (
                        <div className="relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === msg._id ? null : msg._id); }} 
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
                          >
                            <MoreVertical size={14} />
                          </button>
                          {menuOpenId === msg._id && (
                            <div className="absolute right-0 top-6 bg-white border shadow-lg rounded-md z-50 overflow-hidden text-sm w-24">
                              <button 
                                onClick={() => {
                                  setEditingMessageId(msg._id);
                                  setInput(msg.content);
                                  setMenuOpenId(null);
                                }} 
                                className="flex items-center gap-2 px-3 py-2 w-full hover:bg-gray-50 text-left text-gray-700"
                              >
                                <Edit2 size={12} /> Edit
                              </button>
                              <button 
                                onClick={() => handleDelete(msg._id)} 
                                className="flex items-center gap-2 px-3 py-2 w-full hover:bg-red-50 text-left text-red-600"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              
              {editingMessageId && (
                <div className="bg-indigo-50 px-4 py-2 text-xs flex justify-between items-center text-indigo-800 border-t">
                  <span>Editing message...</span>
                  <button onClick={() => { setEditingMessageId(null); setInput(''); }} className="text-indigo-500 hover:text-indigo-800 font-bold">Cancel</button>
                </div>
              )}
              
              <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-accent"
                />
                <button type="submit" disabled={!input.trim()} className="bg-accent text-white p-2 rounded-full hover:bg-opacity-90 disabled:opacity-50">
                  <Send size={18} className="ml-0.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <User size={48} className="mb-2 opacity-20" />
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Inbox;
