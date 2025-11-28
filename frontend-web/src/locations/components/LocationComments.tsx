import { useState } from 'react';
import { Message, SimplifiedUser } from '../Interfaces';

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
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        Comments ({comments.length})
      </h4>

      <form onSubmit={handleSubmitComment} className="mb-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </form>

      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {comments.map((message) => (
          <div key={message.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {message.sender.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-800">
                    {message.sender.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(new Date(message.sentAt))}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{message.content}</p>

                <button
                  onClick={() => setReplyingTo(message.id)}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium"
                >
                  Reply
                </button>
              </div>
            </div>

            {message.responses && message.responses.length > 0 && (
              <div className="ml-10 mt-2 space-y-2">
                {message.responses.map((response) => (
                  <div key={response.id} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-linear-to-br from-green-400 to-teal-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {response.sender.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-gray-800">
                          {response.sender.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(new Date(response.sentAt))}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 mt-1">
                        {response.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {replyingTo === message.id && (
              <div className="ml-10 mt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={(e) => handleSubmitReply(message.id, e)}
                    className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
};

export default LocationComments;
