import React, { useEffect } from 'react';

export default function PolicyPage({ title, content }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="min-h-[60vh] max-w-4xl mx-auto px-6 py-16 animate-in fade-in duration-500">
      <h1 className="text-3xl font-black uppercase tracking-wide mb-8 border-b-2 border-black pb-4">
        {title}
      </h1>
      
      <div className="text-gray-600 leading-relaxed space-y-6 text-[15px] whitespace-pre-line">
        {content}
      </div>
    </div>
  );
}