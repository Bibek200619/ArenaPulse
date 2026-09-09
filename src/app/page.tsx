import Link from 'next/link';
import {
  ArrowUpRight,
  Radio,
  Users,
  Trophy,
  BarChart3,
  Bell,
  Sparkles,
} from 'lucide-react';
const features = [
  {
    icon: Radio,
    title: 'Every moment matters.',
    text: 'Fixtures, match stories and the numbers behind the game.',
    label: 'FOLLOW THE GAME',
    href: '/matches',
  },
  {
    icon: Users,
    title: 'Find your people.',
    text: 'A home for the rivalries, celebrations and conversations.',
    label: 'JOIN THE CROWD',
    href: '/communities',
  },
  {
    icon: Trophy,
    title: 'Back your instincts.',
    text: 'Build your squad. Compete with friends. Make every pick count.',
    label: 'BUILD YOUR SQUAD',
    href: '/fantasy',
  },
];
export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> YOUR GAME. YOUR PEOPLE.
          </p>
          <h1>
            Sport is better
            <br />
            when you <em>belong.</em>
          </h1>
          <p className="hero-description">
            Follow the game. Build your squad. Join the crowd.
            <br className="desktop-break" /> One home for everything you love
            about sport.
          </p>
          <div className="actions">
            <Link className="button" href="/matches">
              Explore matches <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <Link className="text-link" href="/register">
              Create your account <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="hero-sports">
            <span>FOOTBALL</span>
            <span>CRICKET</span>
            <span>BASKETBALL</span>
            <span>AND BEYOND</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="pitch">
            <div className="pitch-line" />
            <div className="pitch-circle" />
            <div className="pitch-goal goal-left" />
            <div className="pitch-goal goal-right" />
          </div>
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-type">
            FEEL
            <br />
            EVERY
            <br />
            <span>MOMENT.</span>
          </div>
          <div className="art-caption">
            THE WORLD PLAYS. <span>YOU BELONG HERE.</span>
          </div>
        </div>
      </section>
      <div className="preview-banner">
        <span className="preview-tag">EARLY LOOK</span>
        <p>
          You’re exploring the ArenaPulse foundation. Match data and fan
          features are on the way.
        </p>
      </div>
      <section className="section feature-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MORE THAN THE FINAL SCORE</p>
            <h2>All your passion. One place.</h2>
          </div>
          <p>From the first whistle to the group chat.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text, label, href }, index) => (
            <Link className="feature" href={href} key={href}>
              <div className="feature-top">
                <Icon size={27} aria-hidden="true" />
                <span>0{index + 1}</span>
              </div>
              <p className="eyebrow">{label}</p>
              <h3>{title}</h3>
              <p>{text}</p>
              <ArrowUpRight
                className="feature-arrow"
                size={22}
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>
      <section className="section coming-section">
        <div>
          <p className="eyebrow">THE NEXT LEVEL OF MATCH INTELLIGENCE</p>
          <h2>
            A deeper read
            <br />
            on the game.
          </h2>
          <p>ArenaPulse Prediction Engine — Coming Soon</p>
          <p className="muted">
            Built for a future custom model. No predictions are available yet.
          </p>
          <Link href="/predictions" className="text-link">
            Meet the next chapter <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="intelligence-art" aria-hidden="true">
          <BarChart3 size={44} />
          <span className="intelligence-line" />
          <Sparkles size={44} />
          <span className="intelligence-line" />
          <Bell size={36} />
        </div>
      </section>
    </>
  );
}
