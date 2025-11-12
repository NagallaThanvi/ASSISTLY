import React from 'react';
import TWNavbar from '../components/ui/TWNavbar';
import TWHero from '../components/ui/TWHero';
import TWCard from '../components/ui/TWCard';

export default function TailwindDemo() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TWNavbar />
      <TWHero />

      <main className="max-w-6xl mx-auto px-4 py-12">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TWCard title="Find help fast">
            Search local requests, filter by urgency, and offer help in minutes.
          </TWCard>

          <TWCard title="Secure by default">
            Built with Firebase security rules and sensible defaults for community privacy.
          </TWCard>

          <TWCard title="Gamified volunteering">
            Earn points for helping and see your impact on the community leaderboard.
          </TWCard>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Component Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TWCard title="Quick action">
              <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Offer Help</button>
            </TWCard>

            <TWCard title="Notification">
              <div className="text-sm text-slate-600">You have <strong>3</strong> unread notifications.</div>
            </TWCard>
          </div>
        </section>
      </main>
    </div>
  );
}
