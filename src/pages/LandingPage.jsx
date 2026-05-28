import { LandingNav }      from '../components/landing/LandingNav';
import { LandingHero }     from '../components/landing/LandingHero';
import { LandingTicker }   from '../components/landing/LandingTicker';
import { LandingFeatures } from '../components/landing/LandingFeatures';
import { LandingStats }    from '../components/landing/LandingStats';
import { LandingCTA }      from '../components/landing/LandingCTA';
import { LandingFooter }   from '../components/landing/LandingFooter';

export function LandingPage({ onLogin, onGetStarted, onDemo }) {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <LandingNav onLogin={onLogin} onGetStarted={onGetStarted} />
      <main>
        <LandingHero onGetStarted={onGetStarted} onDemo={onDemo} />
        <LandingTicker />
        <LandingFeatures />
        <LandingStats />
        <LandingCTA onGetStarted={onGetStarted} />
      </main>
      <LandingFooter />
    </div>
  );
}
