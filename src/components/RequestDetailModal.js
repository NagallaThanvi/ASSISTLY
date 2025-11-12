import React from 'react';

const RequestDetailModal = ({ request, onClose, onOpenRating }) => {
  if (!request) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="request-modal-title">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-3xl w-full mx-4 z-50 overflow-auto" role="document">
        <div className="flex items-start justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 id="request-modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">{request.title}</h2>
          <button aria-label="Close" onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-300">×</button>
        </div>

        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-200">{request.description}</p>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            <div><strong>Location:</strong> {typeof request.location === 'string' ? request.location : request.location?.address || 'Location set'}</div>
            <div className="mt-2"><strong>Urgency:</strong> <span className={`inline-block px-2 py-1 rounded ${request.urgency === 'high' ? 'bg-red-100 text-red-700' : request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{request.urgency}</span></div>
          </div>

          <div className="mt-4">
            <strong className="text-sm text-gray-800 dark:text-gray-200">Timeline:</strong>
            <ul className="list-disc list-inside mt-2 text-sm text-gray-600 dark:text-gray-300">
              {(request.history || []).map((h, i) => (
                <li key={i}>{h.type} — {h.by} — {h.at?.toDate ? h.at.toDate().toLocaleString() : ''}</li>
              ))}
            </ul>
          </div>

          {request.status === 'completed' && (
            <div className="mt-4">
              <button
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                onClick={() => onOpenRating?.(request.id)}
              >
                Leave a Rating
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetailModal;
