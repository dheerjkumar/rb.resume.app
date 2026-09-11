import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../contexts/AuthContext';
import { SocketContext } from '../contexts/SocketContext';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Sparkles, Send, Heart, MessageCircle, Share2, UserPlus, UserMinus, Edit } from 'lucide-react';

const CreatePost = ({ onPostCreated }) => {
  const [enhancing, setEnhancing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [, setTick] = useState(0);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: () => setTick(t => t + 1),
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[100px] p-3 border rounded-md',
      },
    },
  });

  const handleEnhance = async () => {
    if (!editor || editor.isEmpty) return;
    setEnhancing(true);
    try {
      const { data } = await api.post('/ai/enhance', { html: editor.getHTML() });
      editor.commands.setContent(data.html);
    } catch (err) {
      alert(err?.response?.data?.message || 'AI Enhance failed.');
    } finally {
      setEnhancing(false);
    }
  };

  const handlePost = async () => {
    if (!editor || !editor.getText().trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post('/posts', { content: editor.getHTML() });
      onPostCreated(data.post);
      editor.commands.clearContent();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to post.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
      <h3 className="font-semibold mb-2">Share a Career Tip</h3>
      <div className="mb-3">
        <EditorContent editor={editor} />
      </div>
      <div className="flex justify-between items-center">
        <button
          onClick={handleEnhance}
          disabled={enhancing || !editor || !editor.getText().trim()}
          className="flex items-center gap-1 text-sm bg-purple-50 text-purple-600 px-3 py-1.5 rounded hover:bg-purple-100 disabled:opacity-50"
        >
          <Sparkles size={14} /> {enhancing ? 'Enhancing...' : 'Enhance with AI'}
        </button>
        <button
          onClick={handlePost}
          disabled={posting || !editor || !editor.getText().trim()}
          className="flex items-center gap-1 text-sm bg-accent text-white px-4 py-1.5 rounded hover:bg-opacity-90 disabled:opacity-50"
        >
          <Send size={14} /> Post
        </button>
      </div>
    </div>
  );
};

const PostCard = ({ post: initialPost }) => {
  const [post, setPost] = useState(initialPost);
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(currentUser?.following?.includes(post.author._id));

  const handleLike = async () => {
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      setPost({ ...post, likes: data.likes });
    } catch (error) {
      console.error(error);
    }
  };

  const handleFollow = async () => {
    try {
      const { data } = await api.post(`/users/${post.author._id}/follow`);
      setIsFollowing(data.following.includes(post.author._id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/community/post/${post._id}`;
    if (navigator.share) {
      await navigator.share({ url, title: 'Career Tip' });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  const isAdmin = post.author.email === 'admin@resumebuilder.com';
  const canEditPost = currentUser && currentUser._id === post.author._id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  const handlePostEdit = async () => {
    try {
      const { data } = await api.put(`/posts/${post._id}`, { content: editContent });
      setPost(data.post);
      setIsEditing(false);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to edit post.');
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img src={post.author.profilePhoto || 'https://via.placeholder.com/40'} alt="Avatar" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
          <div>
            <p className="font-bold text-gray-800 flex items-center gap-2">
              {post.author.name}
              {isAdmin && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Admin</span>}
            </p>
            <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {currentUser && currentUser._id !== post.author._id && (
            <div className="flex gap-2">
              <button onClick={() => navigate(`/inbox?userId=${post.author._id}`)} className="text-xs px-3 py-1 rounded-full flex items-center gap-1 border hover:bg-gray-50 text-gray-700">
                Message
              </button>
              <button onClick={handleFollow} className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 border ${isFollowing ? 'bg-gray-100 text-gray-600' : 'bg-accent text-white'}`}>
                {isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <div className="mt-2 mb-4">
          <textarea
            className="w-full border p-3 rounded focus:outline-none focus:ring-1 focus:ring-accent"
            rows="4"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handlePostEdit} className="bg-accent text-white px-4 py-1.5 rounded font-semibold text-sm">Save</button>
            <button onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded font-semibold text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="prose text-sm text-gray-700 mb-4" dangerouslySetInnerHTML={{ __html: post.content }} />
      )}
      <div className="flex items-center gap-4 text-gray-500 text-sm border-t pt-3">
        <button onClick={handleLike} className={`flex items-center gap-1 ${post.likes?.includes(currentUser?._id) ? 'text-red-500' : 'hover:text-red-500'}`}>
          <Heart size={16} fill={post.likes?.includes(currentUser?._id) ? 'currentColor' : 'none'} /> {post.likes?.length || 0}
        </button>
        <Link to={`/community/post/${post._id}`} className="flex items-center gap-1 hover:text-accent">
          <MessageCircle size={16} /> {post.commentCount || 0} Comments
        </Link>
        <button onClick={handleShare} className="flex items-center gap-1 hover:text-green-600">
          <Share2 size={16} /> Share
        </button>
        {canEditPost && (
          <button 
            onClick={() => {
              setEditContent(post.content);
              setIsEditing(!isEditing);
            }} 
            className="flex items-center gap-1 hover:text-blue-500 ml-auto"
          >
            <Edit size={16} /> Edit
          </button>
        )}
      </div>
    </div>
  );
};

const CommunityFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const { data } = await api.get('/posts/feed');
      setPosts(data.posts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <CreatePost onPostCreated={(post) => setPosts([post, ...posts])} />
      {loading ? (
        <p className="text-center text-gray-500">Loading feed...</p>
      ) : posts.length > 0 ? (
        posts.map(post => <PostCard key={post._id} post={post} />)
      ) : (
        <p className="text-center text-gray-500">No posts yet.</p>
      )}
    </div>
  );
};

export default CommunityFeed;
