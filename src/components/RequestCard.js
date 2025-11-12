import React, { useState } from 'react';
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

const RequestCard = ({ request, onVolunteer, onComplete, onVerifyCompletion }) => {
  const { user } = useAuth();
  const [showMessageThread, setShowMessageThread] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showLocationVerification, setShowLocationVerification] = useState(false);
  const isClaimed = request.status === 'claimed';
  const isPendingCompletion = request.status === 'pending_completion';
  const isCompleted = request.status === 'completed';
  const isOwner = request.createdByUid === user?.uid;
  const isVolunteer = request.claimedByUid === user?.uid;
  
  const canMessage = (isOwner && (isClaimed || isPendingCompletion)) || (isVolunteer && (isClaimed || isPendingCompletion));
  const canRate = isCompleted && isOwner && !request.rating; // Only owner can rate volunteer
  const canVerify = isPendingCompletion && isOwner; // Only owner can verify completion
  const otherUserId = isOwner ? request.claimedByUid : request.createdByUid;
  const otherUserEmail = isOwner ? request.claimedBy : request.createdBy;
  
  const getStatusColor = () => {
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
      <article className="bg-white rounded-xl shadow p-4 flex flex-col h-full relative">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800 break-words">{request.title}</h3>
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
            <button aria-label="Send Message" onClick={() => setShowMessageThread(true)} className="p-1 rounded text-slate-700 hover:bg-slate-100">
              <MessageIcon fontSize="small" />
            </button>
          </div>
        )}

        {request.category && (
          <div className="mb-2">
            <span className="inline-block text-xs px-2 py-1 rounded border border-slate-200 text-slate-700">{request.category}</span>
          </div>
        )}

        <p className="text-sm text-slate-600 mb-3 line-clamp-3">{request.description}</p>

        <div className="border-t border-slate-100 pt-3 mt-auto">
          <div className="flex flex-col gap-2">
            {(request.location?.address || request.location) && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <LocationIcon fontSize="small" />
                <span>{typeof request.location === 'string' ? request.location : request.location?.address || 'Location set'}</span>
              </div>
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

            {isClaimed && (
              <div className="text-sm text-slate-700"><strong>Volunteer:</strong> {request.claimedBy || request.claimedByEmail?.split('@')[0] || '—'}</div>
            )}

            {request.rating && (
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                <StarIcon fontSize="small" className="text-yellow-500" />
                <span> {request.rating.score} {request.rating.review && <span className="text-xs text-slate-500">"{request.rating.review}"</span>}</span>
              </div>
            )}

            {request.contactInfo && (isOwner || isVolunteer) && (
              <div className="mt-2 p-2 bg-slate-50 rounded text-sm text-slate-700">
                <div className="text-xs text-slate-500">Contact Info:</div>
                <div>{request.contactInfo}</div>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2">
            {!isOwner && !isCompleted && (
              <>
                {!isClaimed && (
                  <button onClick={() => onVolunteer(request.id)} className="w-full bg-blue-600 text-white px-3 py-2 rounded-md">Volunteer to Help</button>
                )}

                {isVolunteer && (
                  <button onClick={() => setShowLocationVerification(true)} className="w-full bg-emerald-600 text-white px-3 py-2 rounded-md">Mark as Complete</button>
                )}

                {isClaimed && !isVolunteer && (
                  <div className="text-center text-sm text-slate-500">Already claimed by a volunteer</div>
                )}
              </>
            )}

            {isPendingCompletion && (
              <div className="flex flex-col gap-2">
                <div className="text-center font-bold text-purple-700">⏳ Pending Verification</div>
                {canVerify && (
                  <div className="flex gap-2">
                    <button onClick={() => onVerifyCompletion(request.id, true)} className="flex-1 bg-emerald-600 text-white px-3 py-2 rounded-md">✓ Verify</button>
                    <button onClick={() => onVerifyCompletion(request.id, false)} className="flex-1 border border-red-300 text-red-600 px-3 py-2 rounded-md">✗ Reject</button>
                  </div>
                )}
                {isVolunteer && <div className="text-center text-xs text-slate-500">Waiting for resident to verify completion</div>}
              </div>
            )}

            {isCompleted && (
              <div className="flex flex-col gap-2">
                <div className="text-center font-bold text-emerald-700">✓ Completed</div>
                {canRate && (
                  <button onClick={() => setShowRatingDialog(true)} className="w-full border border-slate-200 px-3 py-2 rounded-md">Rate Volunteer</button>
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
