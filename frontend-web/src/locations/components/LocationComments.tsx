import { useState } from 'react';
import { Message, SimplifiedUser } from '../Interfaces';
import './LocationComments.css';

interface LocationCommentsProps {
  comments: Message[];
  currentUser: SimplifiedUser;
  onAddComment: (content: string) => void;
  onAddResponse: (messageId: number, content: string) => void;
}

const LocationComments = ({
  comments,
  currentUser,
  onAddComment,
  onAddResponse,
}: LocationCommentsProps) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  const handleSubmitReply = (messageId: number, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (replyContent.trim()) {
      onAddResponse(messageId, replyContent);
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  return (
    <div className="comments-container">
      <h4 className="comments-title">Comments ({comments.length})</h4>

      <form onSubmit={handleSubmitComment} className="comment-form">
        <div className="comment-input-container">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="comment-input"
          />
          <button type="submit" className="comment-submit-button">
            Send
          </button>
        </div>
      </form>

      <div className="comments-list">
        {comments.map((message) => (
          <div key={message.id} className="comment-item">
            <div className="comment-content">
              <div className="comment-avatar">
                {message.sender.username.charAt(0).toUpperCase()}
              </div>
              <div className="comment-body">
                <div className="comment-header">
                  <span className="comment-username">
                    {message.sender.username}
                  </span>
                  <span className="comment-timestamp">
                    {formatDateTime(new Date(message.sentAt))}
                  </span>
                </div>
                <p className="comment-text">{message.content}</p>

                <button
                  onClick={() => setReplyingTo(message.id)}
                  className="comment-reply-button"
                >
                  Reply
                </button>
              </div>
            </div>

            {message.responses && message.responses.length > 0 && (
              <div className="responses-container">
                {message.responses.map((response) => (
                  <div key={response.id} className="response-item">
                    <div className="response-avatar">
                      {response.sender.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="response-body">
                      <div className="response-header">
                        <span className="response-username">
                          {response.sender.username}
                        </span>
                        <span className="response-timestamp">
                          {formatDateTime(new Date(response.sentAt))}
                        </span>
                      </div>
                      <p className="response-text">{response.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {replyingTo === message.id && (
              <div className="reply-form">
                <div className="reply-input-container">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="reply-input"
                    autoFocus
                  />
                  <button
                    onClick={(e) => handleSubmitReply(message.id, e)}
                    className="reply-submit-button"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                    }}
                    className="reply-cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <p className="comments-empty">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
};

export default LocationComments;
