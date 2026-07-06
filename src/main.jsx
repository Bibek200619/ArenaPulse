import { createRoot } from 'react-dom/client';
import './style.css';

function Mark(){return <div className="mark" aria-label="World Cup 26"><span>2</span><span>6</span></div>}

function Header(){return <header className="site-header"><a className="brand dark" href="/"><Mark/><span>FIFA WORLD CUP<br/><b>26</b></span></a><nav><a href="/matches">MATCHES</a><a href="/stats">STATS</a><a href="/teams">TEAMS</a></nav><a className="header-cta" href="/matches">FIXTURES ↗</a></header>}

function Landing(){return <><main className="home-landing"><header className="home-nav"><a className="brand" href="/"><Mark/><span>FIFA WORLD CUP<br/><b>26</b></span></a><nav><a href="/matches">MATCHES</a><a href="/stats">STATS</a><a href="/teams">TEAMS</a></nav></header><div className="home-red"></div><div className="home-mint"></div><div className="home-ring"></div><div className="home-copy"><p className="eyebrow">CANADA · MÉXICO · USA</p><h1>THE WORLD<br/><i>IS ON.</i></h1><p>The biggest stage in football is here. Three countries. Forty-eight nations. One beautiful game.</p><a href="#hosts">EXPLORE THE HOSTS <b>↓</b></a></div><div className="home-26"><span>2</span><span>6</span></div><img className="home-trophy" src="/fifa-world-cup-26-emblem.png" alt="FIFA World Cup 26 emblem"/><div className="home-info"><span>11 JUN — 19 JUL</span><span>104 MATCHES</span><span>16 CITIES</span></div></main></>}

function App() {
  return <Landing />;
}

createRoot(document.getElementById('root')).render(<App />);
