import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../contexts/AuthContext';
import { Heart, CornerDownRight, Trash2, Edit2 } from 'lucide-react';

const Comment = ({ comment, allComments, onReply, onLike, onDelete, onEdit }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const replies = allComments.filter(c => c.parentCommentId === comment._id);
  
  const canModify = currentUser && comment.author && currentUser._id === comment.author._id;
  const canDelete = canModify || (currentUser && currentUser.email === 'rb.resume.app@gmail.com');

  const handleEditSubmit = () => {
    onEdit(comment._id, editContent);
    setIsEditing(false);
  };

  return (
    <div className="mt-4">
      <div className="bg-gray-50 p-3 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <img src={comment.author?.profilePhoto || 'https://via.placeholder.com/30'} alt="Avatar" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
            <span className="font-semibold text-sm">{comment.author?.name || 'Unknown User'}</span>
            <span className="text-xs text-gray-400 ml-2">{new Date(comment.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex gap-2">
            {canModify && (
              <button onClick={() => setIsEditing(!isEditing)} className="text-gray-400 hover:text-blue-500" title="Edit Comment">
                <Edit2 size={14} />
              </button>
            )}
            {canDelete && (
              <button onClick={() => onDelete(comment._id)} className="text-gray-400 hover:text-red-500" title="Delete Comment">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <div className="mt-2">
            <textarea
              className="w-full border p-2 text-sm rounded focus:outline-none focus:ring-1 focus:ring-accent"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows="2"
            />
            <div className="flex gap-2 mt-1">
              <button onClick={handleEditSubmit} className="text-xs bg-accent text-white px-3 py-1 rounded">Save</button>
              <button onClick={() => setIsEditing(false)} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700">{comment.content}</p>
        )}
        
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <button 
            onClick={() => onLike(comment._id)} 
            className={`flex items-center gap-1 ${comment.likes?.includes(currentUser?._id) ? 'text-red-500' : 'hover:text-red-500'}`}
          >
            <Heart size={12} fill={comment.likes?.includes(currentUser?._id) ? 'currentColor' : 'none'} /> {comment.likes?.length || 0}
          </button>
          {currentUser && (
            <button onClick={() => onReply(comment._id)} className="hover:text-accent">Reply</button>
          )}
        </div>
      </div>
      {/* Recursively render replies */}
      {replies.length > 0 && (
        <div className="ml-6 border-l pl-4">
          {replies.map(reply => (
            <Comment key={reply._id} comment={reply} allComments={allComments} onReply={onReply} onLike={onLike} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
};

const PostView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // commentId or null for post-level
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostContent, setEditPostContent] = useState('');

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const { data } = await api.get(`/posts/${id}`);
      setPost(data.post);
      setComments(data.comments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert('Please login to comment.');
    if (!replyContent.trim()) return;

    try {
      const { data } = await api.post(`/posts/${post._id}/comments`, {
        content: replyContent,
        parentCommentId: replyingTo
      });
      setComments([...comments, data.comment]);
      setReplyContent('');
      setReplyingTo(null);
    } catch (err) {
      alert('Failed to post comment.');
    }
  };

  const handleCommentLike = async (commentId) => {
    if (!currentUser) return alert('Please login to like.');
    try {
      const { data } = await api.post(`/posts/${post._id}/comments/${commentId}/like`);
      setComments(comments.map(c => c._id === commentId ? { ...c, likes: data.likes } : c));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center p-8 text-gray-500">Loading...</div>;
  if (!post) return <div className="text-center p-8 text-red-500">Post not found.</div>;

  // Filter root comments (those without a parent)
  const rootComments = comments.filter(c => !c.parentCommentId);

  const isAdmin = post.author?.email === 'rb.resume.app@gmail.com';
  const isFollowing = currentUser?.following?.includes(post.author?._id);

  const handleFollow = async () => {
    if (!currentUser) return alert('Please login to follow.');
    try {
      await api.post(`/users/${post.author._id}/follow`);
      // Update local state (this is simplistic, ideally we'd update AuthContext too)
      alert('Follow status updated! Refresh to see changes in your following list.');
    } catch (error) {
      console.error(error);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.delete(`/posts/${post._id}/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId && c.parentCommentId !== commentId));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete comment.');
    }
  };

  const handleCommentEdit = async (commentId, newContent) => {
    if (!newContent.trim()) return;
    try {
      const { data } = await api.put(`/posts/${post._id}/comments/${commentId}`, { content: newContent });
      setComments(comments.map(c => c._id === commentId ? data.comment : c));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to edit comment.');
    }
  };

  const handlePostEdit = async () => {
    try {
      const { data } = await api.put(`/posts/${post._id}`, { content: editPostContent });
      setPost(data.post);
      setIsEditingPost(false);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to edit post.');
    }
  };

  const canEditPost = currentUser && currentUser._id === post.author._id;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Post */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={post.author?.profilePhoto || 'https://via.placeholder.com/40'} alt="Avatar" className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
            <div>
              <p className="font-bold text-gray-800 text-lg flex items-center gap-2">
                {post.author?.name || 'Unknown User'}
                {isAdmin && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Admin</span>}
              </p>
              <p className="text-sm text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {canEditPost && (
              <button 
                onClick={() => {
                  setEditPostContent(post.content);
                  setIsEditingPost(!isEditingPost);
                }} 
                className="text-gray-400 hover:text-blue-500" 
                title="Edit Post"
              >
                <Edit2 size={16} />
              </button>
            )}
            {currentUser && currentUser._id !== post.author?._id && (
              <>
                <button onClick={() => navigate(`/inbox?userId=${post.author._id}`)} className="text-xs px-3 py-1 rounded-full flex items-center gap-1 border hover:bg-gray-50 text-gray-700">
                  Message
                </button>
                <button onClick={handleFollow} className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 border ${isFollowing ? 'bg-gray-100 text-gray-600' : 'bg-accent text-white'}`}>
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </>
            )}
          </div>
        </div>
        
        {isEditingPost ? (
          <div className="mt-4">
            {/* Since post can be rich HTML, using a plain textarea might expose HTML tags, but for simplicity we'll allow it. */}
            <textarea
              className="w-full border p-3 rounded focus:outline-none focus:ring-1 focus:ring-accent"
              rows="6"
              value={editPostContent}
              onChange={(e) => setEditPostContent(e.target.value)}
            />
            <div className="flex gap-2 mt-2">
              <button onClick={handlePostEdit} className="bg-accent text-white px-4 py-2 rounded font-semibold text-sm">Save Changes</button>
              <button onClick={() => setIsEditingPost(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-semibold text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: post.content }} />
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="font-bold text-lg mb-4">{comments.length} Comments</h3>
        
        {currentUser ? (
          <form onSubmit={handleCommentSubmit} className="mb-6">
            {replyingTo && (
              <div className="flex items-center justify-between bg-gray-100 px-3 py-1 text-sm text-gray-600 rounded-t-md">
                <span className="flex items-center gap-1"><CornerDownRight size={14}/> Replying to a comment</span>
                <button type="button" onClick={() => setReplyingTo(null)} className="text-red-500 hover:underline">Cancel</button>
              </div>
            )}
            <textarea
              className={`w-full border p-3 rounded-b-md focus:outline-none focus:ring-1 focus:ring-accent ${!replyingTo && 'rounded-t-md'}`}
              rows="3"
              placeholder="Write a comment..."
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
            />
            <button type="submit" disabled={!replyContent.trim()} className="mt-2 bg-accent text-white px-4 py-2 rounded font-semibold text-sm hover:bg-opacity-90 disabled:opacity-50">
              Post Comment
            </button>
          </form>
        ) : (
          <div className="bg-gray-50 p-4 rounded text-center text-gray-600 mb-6">
            Please <Link to="/" className="text-accent hover:underline font-semibold">log in</Link> to join the discussion.
          </div>
        )}

        <div className="space-y-4">
          {rootComments.map(comment => (
            <Comment 
              key={comment._id} 
              comment={comment} 
              allComments={comments} 
              onReply={setReplyingTo} 
              onLike={handleCommentLike}
              onDelete={handleCommentDelete} 
              onEdit={handleCommentEdit}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostView;
