import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Rating from '@mui/material/Rating';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useApp } from '../context/AppContext';

// Simple Request detail view + rating submission
const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, showNotification } = useApp();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchRequest = async () => {
      try {
        const ref = doc(db, 'requests', id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          showNotification('Request not found', 'error');
          navigate('/');
          return;
        }
        if (mounted) setRequest({ id: snap.id, ...snap.data() });
      } catch (err) {
        // Avoid printing to console in production builds; notify user instead
        showNotification('Error loading request', 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRequest();
    return () => { mounted = false; };
  }, [id, navigate, showNotification]);

  const submitRating = async () => {
    if (!user) {
      showNotification('Please sign in to leave ratings', 'info');
      return;
    }
    setSubmitting(true);
    try {
      const ratingsRef = collection(db, 'requests', id, 'ratings');
      await addDoc(ratingsRef, {
        uid: user.uid,
        rating,
        comment,
        createdAt: serverTimestamp()
      });
      showNotification('Thanks for your feedback!');
      setComment('');
    } catch (err) {
      // surface to user via notification rather than console
      showNotification('Failed to submit rating', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading…</div>;
  if (!request) return null;

  return (
    <div className="p-4">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">{request.postedBy ? request.postedBy.charAt(0) : 'U'}</div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{request.title}</h2>
            <div className="text-sm text-gray-500">Posted by {request.postedBy || 'Anonymous'}</div>
          </div>
          <div className="flex-1" />
          <div className="px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: request.status === 'open' ? '#0284c7' : request.status === 'claimed' ? '#f59e0b' : '#10b981' }}>{(request.status || '').toUpperCase()}</div>
        </div>

        <div className="border-b border-gray-100 pb-4 mb-4" />

        <p className="text-gray-700 dark:text-gray-200 mb-4">{request.description}</p>

        <div className="mt-2">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Contact</h3>
          <div className="text-sm text-gray-600 dark:text-gray-300">{request.contactInfo || '—'}</div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Leave a rating</h3>
          <div className="mt-2 flex items-center gap-3">
            <Rating value={rating} onChange={(e, v) => setRating(v || 0)} />
            <span className="text-sm text-gray-600">{rating} / 5</span>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment"
            rows={4}
            className="mt-3 w-full rounded-md border border-gray-200 focus:ring-2 focus:ring-indigo-300 p-2 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100"
            aria-label="Optional comment"
          />

          <div className="mt-4 flex items-center gap-2">
            <button
              className="inline-flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
              onClick={submitRating}
              disabled={submitting}
              aria-disabled={submitting}
            >
              Submit
            </button>

            <button
              className="inline-flex items-center justify-center border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50"
              type="button"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
