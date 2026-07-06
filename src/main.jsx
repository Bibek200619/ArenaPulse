import { createRoot } from 'react-dom/client';
import './style.css';

function Mark(){return <div className="mark" aria-label="World Cup 26"><span>2</span><span>6</span></div>}

function Header(){return <header className="site-header"><a className="brand dark" href="/"><Mark/><span>FIFA WORLD CUP<br/><b>26</b></span></a><nav><a href="/matches">MATCHES</a><a href="/stats">STATS</a><a href="/teams">TEAMS</a></nav><a className="header-cta" href="/matches">FIXTURES ↗</a></header>}

function App() {
  return <><Header /><main style={{padding:'100px 8vw'}}><h1>FIFA World Cup 2026 — Coming Soon</h1></main></>;
}

createRoot(document.getElementById('root')).render(<App />);
