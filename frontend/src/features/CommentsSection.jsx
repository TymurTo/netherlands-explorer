import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
export default function CommentsSection({ attractionId, user, onLogin }) {
  const [comments, setComments] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api(`/attractions/${attractionId}/comments`)
      .then((data) => {
        if (active) {
          setComments(data.items);
          setNextCursor(data.next_cursor);
        }
      })
      .catch((error) => active && setError(error.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [attractionId, revision]);
  async function submitComment(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(`/attractions/${attractionId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          body: commentText,
        }),
      });
      setCommentText('');
      setRevision((currentRevision) => currentRevision + 1);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function deleteComment(id) {
    setBusy(true);
    setError('');
    try {
      await api(`/comments/${id}`, {
        method: 'DELETE',
      });
      setRevision((currentRevision) => currentRevision + 1);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function loadMoreComments() {
    if (nextCursor === null || busy || loading) return;
    setBusy(true);
    setError('');
    try {
      const data = await api(`/attractions/${attractionId}/comments?before=${nextCursor}`);
      setComments((list) => {
        const knownIds = new Set(list.map((comment) => comment.id));
        return [...list, ...data.items.filter((comment) => !knownIds.has(comment.id))];
      });
      setNextCursor(data.next_cursor);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h3>Traveler reviews</h3>
      {user ? (
        <form onSubmit={submitComment} className="stack">
          <label>
            Your comment
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              maxLength={2000}
              required
              rows={3}
              placeholder="What stood out to you?"
            />
          </label>
          <small>{commentText.length} / 2000</small>
          <button className="primary shine-button" disabled={busy || !commentText.trim()}>
            Post comment
          </button>
        </form>
      ) : (
        <p>
          <button className="text-button" onClick={onLogin}>
            Sign in
          </button>
          to leave a comment.
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}{' '}
          <button
            onClick={() => setRevision((currentRevision) => currentRevision + 1)}
            className="shine-button"
          >
            Try again
          </button>
        </p>
      )}
      {loading ? (
        <p role="status">Loading comments…</p>
      ) : (
        <>
          {!comments.length && (
            <p className="empty">No comments yet. Be the first to share your experience.</p>
          )}
          {comments.map((comment) => (
            <article key={comment.id} className="comment">
              <div>
                <strong>{comment.username}</strong>
                <time dateTime={comment.created_at}>
                  {new Date(comment.created_at).toLocaleString('en-GB')}
                </time>
              </div>
              <p>{comment.body}</p>
              {user?.id === comment.user_id && (
                <button
                  disabled={busy || loading}
                  className="text-button"
                  onClick={() => deleteComment(comment.id)}
                >
                  Delete my comment
                </button>
              )}
            </article>
          ))}
          {nextCursor !== null && (
            <button disabled={busy || loading} onClick={loadMoreComments} className="shine-button">
              More comments
            </button>
          )}
        </>
      )}
    </>
  );
}
