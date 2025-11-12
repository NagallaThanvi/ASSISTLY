import React from 'react';

export default function TWCard({ title, children, footer }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition w-full">
      <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
      <div className="mt-3 text-slate-600">{children}</div>
      {footer && <div className="mt-4 text-sm text-slate-500">{footer}</div>}
    </div>
  );
}
