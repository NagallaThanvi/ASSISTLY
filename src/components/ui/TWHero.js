import React from 'react';

export default function TWHero({ title = 'Welcome to Assistly', subtitle = 'Connect with neighbors who care' }) {
  return (
    <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold drop-shadow-md">{title}</h1>
        <p className="mt-4 text-lg md:text-xl text-purple-100 max-w-2xl mx-auto">{subtitle}</p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <a className="inline-block bg-white text-purple-700 font-semibold px-6 py-3 rounded-lg shadow hover:shadow-lg transition" href="#">Get Started</a>
          <a className="inline-block text-white/90 px-4 py-3 rounded-lg border border-white/20 hover:bg-white/10 transition" href="#">Learn More</a>
        </div>
      </div>
    </section>
  );
}
