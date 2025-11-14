import React, { useState, useEffect } from 'react';
import {
  Message as MessageIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import MessageThread from './MessageThread';
import RatingDialog from './RatingDialog';
import LocationVerification from './LocationVerification';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const RequestCard = ({ request, onVolunteer, onComplete, onVerifyCompletion, onReviewOffers }) => {
  const { user } = useAuth();
  const [showMessageThread, setShowMessageThread] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showLocationVerification, setShowLocationVerification] = useState(false);
  const isClaimed = request.status === 'claimed';
  const isPendingCompletion = request.status === 'pending_completion';
  const isCompleted = request.status === 'completed';
  const isOwner = request.createdByUid === user?.uid;
  const isVolunteer = request.claimedByUid === user?.uid;
  const isOpen = request.status === 'open';
  const [offersCount, setOffersCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadOffersCount() {
      try {
        if (isOwner && isOpen && request?.id) {
          const snap = await getDocs(query(collection(db, 'requests', request.id, 'offers'), where('status', '==', 'pending')));
          if (!cancelled) setOffersCount(snap.size || 0);
        } else {
          if (!cancelled) setOffersCount(0);
        }
      } catch (_e) {
        if (!cancelled) setOffersCount(0);
      }
    }
    loadOffersCount();
    return () => {
      cancelled = true;
    };
  }, [isOwner, isOpen, request?.id]);
  
  const canMessage = (isOwner && (isClaimed || isPendingCompletion)) || (isVolunteer && (isClaimed || isPendingCompletion));
  const canRate = isCompleted && isOwner && !request.rating; // Only owner can rate volunteer
  const canVerify = isPendingCompletion && isOwner; // Only owner can verify completion
  const otherUserId = isOwner ? request.claimedByUid : request.createdByUid;
  const otherUserEmail = isOwner ? request.claimedBy : request.createdBy;
  
  const _getStatusColor = () => {
    switch (request.status) {
      case 'open': return 'info';
      case 'claimed': return 'warning';
      case 'pending_completion': return 'secondary';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  return (
    <>
      <article className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 rounded-xl shadow-sm dark:shadow-lg p-4 flex flex-col h-full relative transition-colors transition-transform hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 break-words">{request.title}</h3>
          </div>
          <div>
            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
              request.status === 'open' ? 'bg-blue-100 text-blue-800' :
              request.status === 'claimed' ? 'bg-yellow-100 text-yellow-800' :
              request.status === 'pending_completion' ? 'bg-purple-100 text-purple-800' :
              request.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
            }`}>{request.status.toUpperCase()}</span>
          </div>
        </div>

        {canMessage && (
          <div className="absolute top-3 right-3">
            <button aria-label="Send Message" onClick={() => setShowMessageThread(true)} className="p-1 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <MessageIcon fontSize="small" />
            </button>
          </div>
        )}

        {request.category && (
          <div className="mb-2">
            <span className="inline-block text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 dark:bg-slate-700">{request.category}</span>
          </div>
        )}

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-3">{request.description}</p>

        <div className="border-t border-slate-100 dark:border-slate-700 pt-3 mt-auto">
          <div className="flex flex-col gap-2">
            {(request.location?.address || request.location) && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <LocationIcon fontSize="small" />
                <span>{typeof request.location === 'string' ? request.location : request.location?.address || 'Location set'}</span>
              </div>
            )}

            {isOwner && isOpen && !isCompleted && typeof onReviewOffers === 'function' && (
              <button onClick={() => onReviewOffers(request.id)} className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 rounded-md hover:dark:bg-slate-600 transition-colors">{`Review Offers${offersCount ? ` (${offersCount})` : ''}`}</button>
            )}

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                request.urgency === 'high' ? 'bg-red-100 text-red-800' : request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-emerald-100 text-emerald-800'
              }`}>{(request.urgency || 'medium').toUpperCase()}</span>
              {request.estimatedTime && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-600 border border-slate-100 px-2 py-0.5 rounded"><TimeIcon fontSize="small" />{request.estimatedTime}</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-700">
              <PersonIcon fontSize="small" />
              <span>{request.postedBy || request.postedByEmail?.split('@')[0] || 'Anonymous'}</span>
            </div>

            <div className="text-xs text-slate-500">Posted {formatDate(request.timestamp || request.createdAt)}</div>

            {(isClaimed || isPendingCompletion) && (
              <div className="text-sm text-slate-700"><strong>Volunteer:</strong> {request.claimedBy || request.claimedByEmail?.split('@')[0] || '—'}</div>
            )}

            {request.rating && (
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-600 dark:text-slate-400">
                <StarIcon fontSize="small" className="text-yellow-500" />
                <span> {request.rating.score} {request.rating.review && <span className="text-xs text-slate-500 dark:text-slate-500">"{request.rating.review}"</span>}</span>
              </div>
            )}

            {request.contactInfo && (isOwner || isVolunteer) && (
              <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-700 rounded text-sm text-slate-700 dark:text-slate-300">
                <div className="text-xs text-slate-500 dark:text-slate-400">Contact Info:</div>
                <div>{request.contactInfo}</div>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2">
            {!isOwner && !isCompleted && (
              <>
                {isOpen && typeof onVolunteer === 'function' && (
                  <button onClick={() => onVolunteer(request.id)} className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-3 py-2 rounded-md transition-colors">Offer to Help</button>
                )}

                {isVolunteer && isClaimed && typeof onComplete === 'function' && (
                  <button onClick={() => setShowLocationVerification(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-3 py-2 rounded-md transition-colors">Mark as Complete</button>
                )}

                {!isOpen && !isVolunteer && (
                  <div className="text-center text-sm text-slate-500 dark:text-slate-400">Already claimed by a volunteer</div>
                )}
              </>
            )}

            {isPendingCompletion && (
              <div className="flex flex-col gap-2">
                <div className="text-center font-bold text-purple-700">⏳ Pending Verification</div>
                {canVerify && typeof onVerifyCompletion === 'function' && (
                  <div className="flex gap-2">
                    <button onClick={() => onVerifyCompletion(request.id, true)} className="flex-1 bg-emerald-600 text-white px-3 py-2 rounded-md">✓ Verify</button>
                    <button onClick={() => onVerifyCompletion(request.id, false)} className="flex-1 border border-red-300 text-red-600 px-3 py-2 rounded-md">✗ Reject</button>
                  </div>
                )}
                {isVolunteer && <div className="text-center text-xs text-slate-500 dark:text-slate-400">Waiting for resident to verify completion</div>}
              </div>
            )}

            {isCompleted && (
              <div className="flex flex-col gap-2">
                <div className="text-center font-bold text-emerald-700 dark:text-emerald-400">✓ Completed</div>
                {canRate && (
                  <button onClick={() => setShowRatingDialog(true)} className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 rounded-md hover:dark:bg-slate-600 transition-colors">Rate Volunteer</button>
                )}
              </div>
            )}
          </div>
        </div>
      </article>

      {showMessageThread && canMessage && (
        <MessageThread
          open={showMessageThread}
          onClose={() => setShowMessageThread(false)}
          requestId={request.id}
          requestTitle={request.title}
          otherUserId={otherUserId}
          otherUserEmail={otherUserEmail}
        />
      )}

      {showRatingDialog && canRate && (
        <RatingDialog
          open={showRatingDialog}
          onClose={() => setShowRatingDialog(false)}
          requestId={request.id}
          requestTitle={request.title}
          ratedUserId={otherUserId}
          ratedUserEmail={otherUserEmail}
          isVolunteer={isOwner}
          onRatingSubmitted={() => {
            setShowRatingDialog(false);
          }}
        />
      )}

      <LocationVerification
        open={showLocationVerification}
        onClose={() => setShowLocationVerification(false)}
        requestLocation={request.location}
        onVerified={(verificationData) => {
          onComplete(request.id, verificationData);
          setShowLocationVerification(false);
        }}
        maxDistance={100}
      />
    </>
  );
};

export default React.memo(RequestCard);
