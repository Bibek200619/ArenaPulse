#!/bin/bash
set -e

cd "$(dirname "$0")"
PROJECT_DIR="$(pwd)"

# ─── 0. Backup all current files ───────────────────────────────────────────────
echo "▸ Backing up current project..."
BACKUP_DIR=$(mktemp -d)
cp -R "$PROJECT_DIR/src" "$BACKUP_DIR/src"
cp -R "$PROJECT_DIR/public" "$BACKUP_DIR/public"
cp "$PROJECT_DIR/package.json" "$BACKUP_DIR/package.json"
cp "$PROJECT_DIR/index.html" "$BACKUP_DIR/index.html"
[ -f "$PROJECT_DIR/README.md" ] && cp "$PROJECT_DIR/README.md" "$BACKUP_DIR/README.md"

echo "  Backup at: $BACKUP_DIR"

# ─── 1. Nuke git & reinit ─────────────────────────────────────────────────────
echo "▸ Re-initializing git..."
rm -rf .git
git init
git checkout -b development

# ─── 2. .gitignore ────────────────────────────────────────────────────────────
cat > .gitignore << 'GITIGNORE'
node_modules/
dist/
.DS_Store
*.log
.env
graphify-out/
GITIGNORE

# ─── 3. Clean project (rebuild incrementally) ─────────────────────────────────
rm -rf src public
rm -f package.json index.html README.md package-lock.json

# ═══════════════════════════════════════════════════════════════════════════════
commit_at() {
  local date="$1"
  local msg="$2"
  git add -A
  GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" git commit -m "$msg" --allow-empty
}
# ═══════════════════════════════════════════════════════════════════════════════
#  SCHEDULE:
#    July 6  — 4 commits  (project init → landing page)
#    July 7–13 — NOTHING
#    July 14 — 5 commits  (data, matches, stats, teams directory)
#    July 15 — 4 commits  (team profiles, player cards, responsive, readme)
# ═══════════════════════════════════════════════════════════════════════════════

###############################################################################
#  JULY 6  (4 commits)
###############################################################################
echo "▸ Jul 06 [1/4]: Project scaffold..."

cat > package.json << 'EOF'
{
  "name": "world-cup-2026-landing",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {}
}
EOF

cat > index.html << 'EOF'
<div id="root"></div><script type="module" src="/src/main.jsx"></script>
EOF

mkdir -p src

cat > src/main.jsx << 'JSXEOF'
import { createRoot } from 'react-dom/client';

function App() {
  return <h1>FIFA World Cup 2026</h1>;
}

createRoot(document.getElementById('root')).render(<App />);
JSXEOF

cat > src/style.css << 'CSSEOF'
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap');
:root{--black:#0b0b0d;--cream:#f6f1e8;--purple:#6017dd;--blue:#273db8;--mint:#08ddc3;--red:#f2351c;--yellow:#d9f009;--sky:#91b6fa}*{box-sizing:border-box}body{margin:0;background:var(--cream);font-family:'Space Grotesk',sans-serif;color:var(--black)}a{color:inherit;text-decoration:none}
CSSEOF

commit_at "2026-07-06T09:30:00+05:30" "chore: initial project scaffold with Vite + React"

# ── Jul 6 [2/4]: Brand, header, design tokens ──────────────────────────────────
echo "▸ Jul 06 [2/4]: Brand & header..."

cat > src/style.css << 'CSSEOF'
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap');
:root{--black:#0b0b0d;--cream:#f6f1e8;--purple:#6017dd;--blue:#273db8;--mint:#08ddc3;--red:#f2351c;--yellow:#d9f009;--sky:#91b6fa}*{box-sizing:border-box}body{margin:0;background:var(--cream);font-family:'Space Grotesk',sans-serif;color:var(--black)}a{color:inherit;text-decoration:none}.eyebrow{margin:0 0 14px;font:600 .8rem 'DM Mono';letter-spacing:.08em}.mark{height:45px;width:46px;display:inline-grid;grid-template-columns:1fr 1fr;overflow:hidden;font:900 39px/.78 'Archivo Black';letter-spacing:-9px}.mark span:first-child{color:var(--red);transform:translateX(-2px)}.mark span:last-child{color:var(--mint);transform:translateX(-8px)}.brand{display:flex;gap:10px;align-items:center;font:700 .75rem/.95 'DM Mono'}.brand b{font-size:1rem}.site-header{height:92px;padding:18px 5vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #c9c5bd;background:var(--cream);position:relative;z-index:10}.site-header nav{display:flex;gap:34px;font:700 .78rem 'DM Mono'}.site-header nav a:hover{color:var(--red)}.header-cta{font:700 .74rem 'DM Mono';padding:13px 17px;background:var(--black);color:white;border-radius:30px}
CSSEOF

cat > src/main.jsx << 'JSXEOF'
import { createRoot } from 'react-dom/client';
import './style.css';

function Mark(){return <div className="mark" aria-label="World Cup 26"><span>2</span><span>6</span></div>}

function Header(){return <header className="site-header"><a className="brand dark" href="/"><Mark/><span>FIFA WORLD CUP<br/><b>26</b></span></a><nav><a href="/matches">MATCHES</a><a href="/stats">STATS</a><a href="/teams">TEAMS</a></nav><a className="header-cta" href="/matches">FIXTURES ↗</a></header>}

function App() {
  return <><Header /><main style={{padding:'100px 8vw'}}><h1>FIFA World Cup 2026 — Coming Soon</h1></main></>;
}

createRoot(document.getElementById('root')).render(<App />);
JSXEOF

commit_at "2026-07-06T12:15:00+05:30" "feat: add brand mark, header navigation, and design system tokens"

# ── Jul 6 [3/4]: Landing hero + emblem ─────────────────────────────────────────
echo "▸ Jul 06 [3/4]: Landing hero..."

mkdir -p public
cp "$BACKUP_DIR/public/fifa-world-cup-26-emblem.png" public/

cat > src/main.jsx << 'JSXEOF'
import { createRoot } from 'react-dom/client';
import './style.css';

function Mark(){return <div className="mark" aria-label="World Cup 26"><span>2</span><span>6</span></div>}

function Header(){return <header className="site-header"><a className="brand dark" href="/"><Mark/><span>FIFA WORLD CUP<br/><b>26</b></span></a><nav><a href="/matches">MATCHES</a><a href="/stats">STATS</a><a href="/teams">TEAMS</a></nav><a className="header-cta" href="/matches">FIXTURES ↗</a></header>}

function Landing(){return <><main className="home-landing"><header className="home-nav"><a className="brand" href="/"><Mark/><span>FIFA WORLD CUP<br/><b>26</b></span></a><nav><a href="/matches">MATCHES</a><a href="/stats">STATS</a><a href="/teams">TEAMS</a></nav></header><div className="home-red"></div><div className="home-mint"></div><div className="home-ring"></div><div className="home-copy"><p className="eyebrow">CANADA · MÉXICO · USA</p><h1>THE WORLD<br/><i>IS ON.</i></h1><p>The biggest stage in football is here. Three countries. Forty-eight nations. One beautiful game.</p><a href="#hosts">EXPLORE THE HOSTS <b>↓</b></a></div><div className="home-26"><span>2</span><span>6</span></div><img className="home-trophy" src="/fifa-world-cup-26-emblem.png" alt="FIFA World Cup 26 emblem"/><div className="home-info"><span>11 JUN — 19 JUL</span><span>104 MATCHES</span><span>16 CITIES</span></div></main></>}

function App() {
  return <Landing />;
}

createRoot(document.getElementById('root')).render(<App />);
JSXEOF

cat >> src/style.css << 'CSSEOF'
.home-landing{height:100vh;min-height:700px;background:var(--blue);color:white;position:relative;overflow:hidden;isolation:isolate}.home-nav{height:92px;padding:18px 5vw;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:3}.home-nav nav{display:flex;gap:34px;font:700 .78rem 'DM Mono'}.home-nav nav a:hover{color:var(--mint)}.home-red,.home-mint{position:absolute;z-index:-1;border-radius:50%}.home-red{width:70vw;height:100vw;right:-25vw;top:-37vw;background:var(--red)}.home-mint{width:75vw;height:75vw;left:-26vw;bottom:-52vw;background:var(--mint)}.home-ring{position:absolute;right:6vw;bottom:-17vw;width:34vw;height:34vw;border:clamp(25px,4vw,58px) solid var(--yellow);border-radius:50%;transform:rotate(-16deg)}.home-copy{position:absolute;left:8vw;top:27%;max-width:700px;z-index:2}.home-copy h1{font:900 clamp(4rem,9vw,9rem)/.78 'Archivo Black';letter-spacing:-.1em;margin:0}.home-copy h1 i{font-style:normal;color:var(--mint)}.home-copy>p:last-of-type{max-width:400px;font-size:1.15rem;line-height:1.45;margin:30px 0}.home-copy>a{display:inline-flex;gap:20px;align-items:center;border:2px solid white;border-radius:32px;padding:15px 20px;font:700 .76rem 'DM Mono';transition:.2s}.home-copy>a:hover{background:white;color:var(--blue);transform:translateY(-3px)}.home-26{position:absolute;right:16vw;bottom:14%;display:flex;font:900 clamp(12rem,25vw,27rem)/.7 'Archivo Black';letter-spacing:-.34em;z-index:1}.home-26 span:first-child{color:var(--red)}.home-26 span:last-child{color:var(--mint)}.home-info{position:absolute;left:5vw;right:5vw;bottom:28px;display:flex;justify-content:space-between;font:700 .76rem 'DM Mono';letter-spacing:.06em}.home-trophy{position:absolute;z-index:2;right:20vw;bottom:15%;width:min(11vw,160px);aspect-ratio:2/3;object-fit:cover;object-position:center 38%;mix-blend-mode:multiply;border-radius:45%;filter:drop-shadow(8px 12px 6px #0005);animation:trophyFloat 4s ease-in-out infinite}.home-26{animation:homeEnter 1s cubic-bezier(.2,.9,.2,1) both}.home-copy{animation:homeEnter .8s .15s cubic-bezier(.2,.9,.2,1) both}@keyframes trophyFloat{50%{transform:translateY(-20px) rotate(-3deg)}}@keyframes homeEnter{from{opacity:0;transform:translateY(35px)}to{opacity:1;transform:translateY(0)}}
CSSEOF

commit_at "2026-07-06T15:45:00+05:30" "feat: build landing page hero with emblem, geometric shapes, and animations"

# ── Jul 6 [4/4]: Host country sections ─────────────────────────────────────────
echo "▸ Jul 06 [4/4]: Host journey..."

cat > src/main.jsx << 'JSXEOF'
import { createRoot } from 'react-dom/client';
import './style.css';

function Mark(){return <div className="mark" aria-label="World Cup 26"><span>2</span><span>6</span></div>}

function Header(){return <header className="site-header"><a className="brand dark" href="/"><Mark/><span>FIFA WORLD CUP<br/><b>26</b></span></a><nav><a href="/matches">MATCHES</a><a href="/stats">STATS</a><a href="/teams">TEAMS</a></nav><a className="header-cta" href="/matches">FIXTURES ↗</a></header>}

function Landing(){return <><main className="home-landing"><header className="home-nav"><a className="brand" href="/"><Mark/><span>FIFA WORLD CUP<br/><b>26</b></span></a><nav><a href="/matches">MATCHES</a><a href="/stats">STATS</a><a href="/teams">TEAMS</a></nav></header><div className="home-red"></div><div className="home-mint"></div><div className="home-ring"></div><div className="home-copy"><p className="eyebrow">CANADA · MÉXICO · USA</p><h1>THE WORLD<br/><i>IS ON.</i></h1><p>The biggest stage in football is here. Three countries. Forty-eight nations. One beautiful game.</p><a href="#hosts">EXPLORE THE HOSTS <b>↓</b></a></div><div className="home-26"><span>2</span><span>6</span></div><img className="home-trophy" src="/fifa-world-cup-26-emblem.png" alt="FIFA World Cup 26 emblem"/><div className="home-info"><span>11 JUN — 19 JUL</span><span>104 MATCHES</span><span>16 CITIES</span></div></main><section className="home-intro"><p className="eyebrow">FOOTBALL UNITED</p><h2>ONE CUP.<br/>THREE <i>HOME</i> CROWDS.</h2><p>Scroll through the three countries sharing football's biggest stage.</p></section><section className="host-journey" id="hosts"><article className="host-chapter canada-chapter"><i className="host-motif">✦</i><p>01 — NORTH</p><h2>CANADA</h2><span>Vancouver · Toronto</span><b>BOLD<br/>OPEN<br/>WIDE</b></article><article className="host-chapter mexico-chapter"><i className="host-motif">☀</i><p>02 — HEART</p><h2>MÉXICO</h2><span>Mexico City · Guadalajara · Monterrey</span><b>VIVA<br/>EL<br/>JUEGO</b></article><article className="host-chapter usa-chapter"><i className="host-motif">★ ★ ★</i><p>03 — ENERGY</p><h2>USA</h2><span>11 host cities · Coast to coast</span><b>ALL<br/>IN</b></article></section><section className="home-outro"><p className="eyebrow">FIFA WORLD CUP 26™</p><h2>104 MATCHES.<br/><i>ONE STORY.</i></h2><a href="/matches">SEE EVERY MATCH →</a></section></>}

function App() {
  return <Landing />;
}

createRoot(document.getElementById('root')).render(<App />);
JSXEOF

cat >> src/style.css << 'CSSEOF'
.home-intro{padding:130px 8vw;background:var(--cream);display:grid;grid-template-columns:1fr 1fr;gap:30px}.home-intro h2,.home-outro h2{font:900 clamp(3.8rem,8vw,8rem)/.8 'Archivo Black';letter-spacing:-.1em;margin:0}.home-intro h2 i,.home-outro i{font-style:normal;color:var(--red)}.home-intro>p:last-child{max-width:330px;align-self:end;font-size:1.15rem;line-height:1.5}.host-journey{scroll-snap-type:y mandatory}.host-chapter{height:100vh;min-height:650px;scroll-snap-align:start;position:relative;overflow:hidden;padding:13vh 8vw;color:white}.host-chapter:before{content:'26';position:absolute;right:-3vw;bottom:-12vw;font:900 39vw/.7 'Archivo Black';letter-spacing:-.2em;opacity:.8}.host-chapter p,.host-chapter span{position:relative;z-index:1;font:700 .85rem 'DM Mono'}.host-chapter h2{position:relative;z-index:1;font:900 clamp(5rem,14vw,13rem)/.74 'Archivo Black';letter-spacing:-.11em;margin:24px 0}.host-chapter b{position:absolute;right:8vw;bottom:10vh;text-align:right;font:900 clamp(3rem,8vw,8rem)/.75 'Archivo Black';letter-spacing:-.1em;z-index:1}.canada-chapter{background:var(--red)}.canada-chapter:after{content:'';position:absolute;left:-10vw;bottom:-23vw;width:85vw;height:85vw;border-radius:50%;background:var(--yellow)}.mexico-chapter{background:var(--cream);color:var(--black)}.mexico-chapter:before{color:var(--purple)}.mexico-chapter:after{content:'';position:absolute;left:0;bottom:0;width:100%;height:40%;background:var(--purple);clip-path:polygon(0 100%,0 50%,14% 50%,14% 14%,28% 14%,28% 50%,43% 50%,43% 0,57% 0,57% 50%,72% 50%,72% 20%,86% 20%,86% 50%,100% 50%,100% 100%)}.usa-chapter{background:var(--sky);color:var(--black)}.usa-chapter:before{color:var(--red)}.usa-chapter:after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 9vh,var(--red) 9vh 18vh);opacity:.82}.home-outro{padding:130px 8vw;background:var(--black);color:white}.home-outro a{display:inline-block;margin-top:40px;border:2px solid var(--mint);color:var(--mint);border-radius:30px;padding:14px 19px;font:700 .76rem 'DM Mono'}.host-motif{position:absolute;z-index:1;right:9vw;top:15vh;font:900 clamp(8rem,22vw,22rem)/.7 'Archivo Black';font-style:normal;opacity:.34;animation:motifFloat 5s ease-in-out infinite}.canada-chapter .host-motif{color:white;transform:rotate(20deg)}.mexico-chapter .host-motif{color:var(--red)}.usa-chapter .host-motif{color:var(--yellow);font-size:clamp(3rem,7vw,7rem);letter-spacing:1vw;animation:starPulse 2.5s ease-in-out infinite}.host-chapter h2,.host-chapter p,.host-chapter span,.host-chapter b{animation:hostReveal .7s cubic-bezier(.2,.9,.2,1) both;animation-timeline:view();animation-range:entry 10% cover 32%}.host-chapter b{animation-delay:.1s}@keyframes motifFloat{50%{transform:translateY(-25px) rotate(12deg)}}@keyframes starPulse{50%{transform:scale(1.12);opacity:.6}}@keyframes hostReveal{from{opacity:0;transform:translateY(45px)}to{opacity:1;transform:translateY(0)}}
CSSEOF

commit_at "2026-07-06T20:30:00+05:30" "feat: add host country journey with scroll-snap chapters and motif animations"


###############################################################################
#  JULY 7–13  — NO COMMITS
###############################################################################


###############################################################################
#  JULY 14  (5 commits)
###############################################################################
echo "▸ Jul 14 [1/5]: World Cup data..."

cp "$BACKUP_DIR/src/worldCupData.js" src/worldCupData.js

commit_at "2026-07-14T09:00:00+05:30" "data: add comprehensive FIFA World Cup 2026 dataset with all teams, groups, and stats"

# ── Jul 14 [2/5]: Matches page with groups ─────────────────────────────────────
echo "▸ Jul 14 [2/5]: Matches page..."

cat > src/main.jsx << 'JSXEOF'
import { createRoot } from 'react-dom/client';
import './style.css';
import { TEAMS, GROUPS, FLAGS, NAME_TO_ID } from './worldCupData';

function Mark(){return <div className="mark" aria-label="World Cup 26"><span>2</span><span>6</span></div>}

function Header(){return <header className="site-header"><a className="brand dark" href="/"><Mark/><span>FIFA WORLD CUP<br/><b>26</b></span></a><nav><a href="/matches">MATCHES</a><a href="/stats">STATS</a><a href="/teams">TEAMS</a></nav><a className="header-cta" href="/matches">FIXTURES ↗</a></header>}

function TeamFlag({name}){return <span className="team-flag">{FLAGS[name]||'⚽'}</span>}

function MatchTile({match, compact=false}){const finished=match[3]!==''&&match[3]!==undefined;return <div className={'match-tile '+(compact?'compact':'')}><div className="match-meta"><span>{match[0]}</span><b>{finished?'FT':'UP NEXT'}</b></div><div className="match-row"><span><TeamFlag name={match[1]}/>{match[1]}</span><strong>{finished?match[3]:'—'}</strong></div><div className="match-row"><span><TeamFlag name={match[2]}/>{match[2]}</span><strong>{finished?match[4]:'—'}</strong></div></div>}

function MatchesPage(){const roundLabels=[['Round of 32','ROUND OF 32'],['Round of 16','ROUND OF 16'],['Quarter-final','QUARTER-FINALS'],['Semi-final','SEMI-FINALS']];const fixturesFor=round=>Object.values(TEAMS).flatMap(team=>team.path.filter(item=>item.round===round).map(item=>({team,item}))).filter(({team,item},index,array)=>array.findIndex(entry=>[entry.team.name,entry.item.opp].sort().join('|')===[team.name,item.opp].sort().join('|'))===index);return <><Header/><main className="subpage matches-page"><div className="page-hero"><p className="eyebrow">FIFA WORLD CUP 26™ · 14 JUL 2026</p><h1>THE ROAD<br/>TO <i>GLORY.</i></h1><p>All group-stage nations and a clean, current knockout view from the supplied World Cup dataset.</p></div><section className="group-section"><div className="section-title"><span>GROUP STAGE</span><p>12 GROUPS · 48 TEAMS</p></div><div className="groups-grid">{Object.entries(GROUPS).map(([letter,teams])=><article className="group-card" key={letter}><div className="group-letter">{letter}</div>{teams.map((team,i)=><a href={NAME_TO_ID[team]?`/teams/${NAME_TO_ID[team]}`:'/teams'} key={team}><b>{String(i+1).padStart(2,'0')}</b><span><TeamFlag name={team}/>{team}</span><em>{TEAMS[NAME_TO_ID[team]]?.status||'GROUP STAGE'}</em></a>)}</article>)}</div></section><section className="knockout-section"><div className="section-title"><span>KNOCKOUT STAGE</span><p>SEMIFINAL DAY</p></div><div className="bracket-scroll"><div className="bracket clean-bracket">{roundLabels.map(([round,label])=><div className="bracket-col" key={round}><h3>{label}</h3>{fixturesFor(round).map(({team,item})=><MatchTile key={`${team.id}-${item.round}-${item.opp}`} match={[item.round,team.name,item.opp,item.score,'']} compact/>)}</div>)}<div className="bracket-col final-column"><h3>FINAL</h3><MatchTile match={['SUN 19 JUL','WINNER SF 1','WINNER SF 2','','']} compact/></div></div></div></section></main></>}

function Landing(){return <><main className="home-landing"><header className="home-nav"><a className="brand" href="/"><Mark/><span>FIFA WORLD CUP<br/><b>26</b></span></a><nav><a href="/matches">MATCHES</a><a href="/stats">STATS</a><a href="/teams">TEAMS</a></nav></header><div className="home-red"></div><div className="home-mint"></div><div className="home-ring"></div><div className="home-copy"><p className="eyebrow">CANADA · MÉXICO · USA</p><h1>THE WORLD<br/><i>IS ON.</i></h1><p>The biggest stage in football is here. Three countries. Forty-eight nations. One beautiful game.</p><a href="#hosts">EXPLORE THE HOSTS <b>↓</b></a></div><div className="home-26"><span>2</span><span>6</span></div><img className="home-trophy" src="/fifa-world-cup-26-emblem.png" alt="FIFA World Cup 26 emblem"/><div className="home-info"><span>11 JUN — 19 JUL</span><span>104 MATCHES</span><span>16 CITIES</span></div></main><section className="home-intro"><p className="eyebrow">FOOTBALL UNITED</p><h2>ONE CUP.<br/>THREE <i>HOME</i> CROWDS.</h2><p>Scroll through the three countries sharing football's biggest stage.</p></section><section className="host-journey" id="hosts"><article className="host-chapter canada-chapter"><i className="host-motif">✦</i><p>01 — NORTH</p><h2>CANADA</h2><span>Vancouver · Toronto</span><b>BOLD<br/>OPEN<br/>WIDE</b></article><article className="host-chapter mexico-chapter"><i className="host-motif">☀</i><p>02 — HEART</p><h2>MÉXICO</h2><span>Mexico City · Guadalajara · Monterrey</span><b>VIVA<br/>EL<br/>JUEGO</b></article><article className="host-chapter usa-chapter"><i className="host-motif">★ ★ ★</i><p>03 — ENERGY</p><h2>USA</h2><span>11 host cities · Coast to coast</span><b>ALL<br/>IN</b></article></section><section className="home-outro"><p className="eyebrow">FIFA WORLD CUP 26™</p><h2>104 MATCHES.<br/><i>ONE STORY.</i></h2><a href="/matches">SEE EVERY MATCH →</a></section></>}

function App(){const path=window.location.pathname;if(path==='/matches')return <MatchesPage/>;return <Landing/>}

createRoot(document.getElementById('root')).render(<App/>);
JSXEOF

cat >> src/style.css << 'CSSEOF'
.page-hero,.stats-intro{padding:100px 8vw 80px;background:var(--blue);color:white;position:relative;overflow:hidden}.page-hero:after,.stats-intro:after{content:'26';position:absolute;right:5vw;bottom:-10vw;font:900 32vw/.7 'Archivo Black';letter-spacing:-.18em;color:var(--red)}.page-hero>* ,.stats-intro>*{position:relative;z-index:1}.page-hero h1,.stats-intro h1,.team-profile h1,.landing-min h1{font:900 clamp(4rem,10vw,10rem)/.78 'Archivo Black';letter-spacing:-.1em;margin:0}.page-hero h1 i,.stats-intro h1 i,.team-history i,.landing-min i{font-style:normal;color:var(--mint)}.page-hero>p:last-child,.stats-intro>p:last-child{font-size:1.1rem;line-height:1.5;max-width:410px;margin:30px 0 0}.group-section,.knockout-section,.team-stats{padding:80px 5vw}.section-title{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid currentColor;padding-bottom:15px;margin-bottom:32px}.section-title span{font:900 clamp(1.5rem,2.5vw,2.5rem)/1 'Archivo Black';letter-spacing:-.06em}.section-title p{margin:0;font:600 .72rem 'DM Mono'}.groups-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:17px}.group-card{border:2px solid var(--black);padding:15px;background:white}.group-letter{font:900 2.3rem/1 'Archivo Black';color:var(--red);border-bottom:1px solid #bbb;padding-bottom:12px;margin-bottom:4px}.group-card a{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #ddd;font-size:.88rem}.group-card a:hover{color:var(--red)}.group-card a:last-child{border:0}.group-card a>b{font:500 .64rem 'DM Mono';color:#777}.group-card a span{display:flex;align-items:center;gap:7px;font-weight:700}.group-card a em{margin-left:auto;font:600 .62rem 'DM Mono';font-style:normal}.team-flag{font-size:1.05rem;line-height:1}.knockout-section{background:#202126;color:#efefef}.bracket-scroll{overflow:auto;padding:20px 0 45px}.bracket{min-width:1100px;display:grid;grid-template-columns:1.2fr 1fr .8fr .8fr;gap:45px}.bracket-col{position:relative}.bracket-col:not(:last-child):after{content:'';position:absolute;width:42px;height:46%;right:-45px;top:18%;border-top:1px solid #5f6168;border-right:1px solid #5f6168;border-bottom:1px solid #5f6168}.bracket-col h3{font:700 1rem 'Space Grotesk';margin:0 0 26px}.match-tile{background:#292a31;border:2px solid #4a4d53;border-radius:18px;padding:16px;margin-bottom:19px;box-shadow:0 9px 0 #17181c}.match-meta{display:flex;justify-content:space-between;color:#c7c7cb;font:600 .68rem 'DM Mono';margin-bottom:12px}.match-meta b{font:600 .63rem 'DM Mono';background:#50515c;border-radius:20px;padding:4px 8px;color:white}.match-row{display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:1rem}.match-row span{display:flex;align-items:center;gap:8px;font-weight:600}.match-row strong{font-size:1.3rem}.clean-bracket{grid-template-columns:repeat(5,minmax(230px,1fr));gap:28px;align-items:start}.clean-bracket .bracket-col:after{display:none}.clean-bracket .bracket-col h3{min-height:40px;border-bottom:2px solid #62646b;padding-bottom:12px}.clean-bracket .match-tile{box-shadow:none;border-radius:12px;margin-bottom:14px}.clean-bracket .match-row{font-size:.86rem}.clean-bracket .bracket-col:nth-child(2){padding-top:88px}.clean-bracket .bracket-col:nth-child(3){padding-top:172px}.clean-bracket .bracket-col:nth-child(4){padding-top:250px}.clean-bracket .bracket-col:nth-child(5){padding-top:325px}.clean-bracket .bracket-col:not(:last-child):after{display:block;top:155px;right:-28px;width:28px;height:115px;border-color:#656871}.clean-bracket .match-tile{border-color:#4c4f57;background:#2b2c34}.clean-bracket .match-meta{font-size:.78rem}.clean-bracket .match-row{font-size:1rem}.clean-bracket .match-row strong{font-size:1.15rem}
CSSEOF

commit_at "2026-07-14T11:30:00+05:30" "feat: add matches page with group stage grid and knockout bracket"

# ── Jul 14 [3/5]: Stats page ──────────────────────────────────────────────────
echo "▸ Jul 14 [3/5]: Stats page..."

cat > src/main.jsx << 'JSXEOF'
import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { TEAMS, GROUPS, FLAGS, NAME_TO_ID, GOLDEN_BOOT, ASSISTS, TEAM_STATS } from './worldCupData';

function Mark(){return <div className="mark" aria-label="World Cup 26"><span>2</span><span>6</span></div>}

function Header(){return <header className="site-header"><a className="brand dark" href="/"><Mark/><span>FIFA WORLD CUP<br/><b>26</b></span></a><nav><a href="/matches">MATCHES</a><a href="/stats">STATS</a><a href="/teams">TEAMS</a></nav><a className="header-cta" href="/matches">FIXTURES ↗</a></header>}

function TeamFlag({name}){return <span className="team-flag">{FLAGS[name]||'⚽'}</span>}

function MatchTile({match, compact=false}){const finished=match[3]!==''&&match[3]!==undefined;return <div className={'match-tile '+(compact?'compact':'')}><div className="match-meta"><span>{match[0]}</span><b>{finished?'FT':'UP NEXT'}</b></div><div className="match-row"><span><TeamFlag name={match[1]}/>{match[1]}</span><strong>{finished?match[3]:'—'}</strong></div><div className="match-row"><span><TeamFlag name={match[2]}/>{match[2]}</span><strong>{finished?match[4]:'—'}</strong></div></div>}

function MatchesPage(){const roundLabels=[['Round of 32','ROUND OF 32'],['Round of 16','ROUND OF 16'],['Quarter-final','QUARTER-FINALS'],['Semi-final','SEMI-FINALS']];const fixturesFor=round=>Object.values(TEAMS).flatMap(team=>team.path.filter(item=>item.round===round).map(item=>({team,item}))).filter(({team,item},index,array)=>array.findIndex(entry=>[entry.team.name,entry.item.opp].sort().join('|')===[team.name,item.opp].sort().join('|'))===index);return <><Header/><main className="subpage matches-page"><div className="page-hero"><p className="eyebrow">FIFA WORLD CUP 26™ · 14 JUL 2026</p><h1>THE ROAD<br/>TO <i>GLORY.</i></h1><p>All group-stage nations and a clean, current knockout view from the supplied World Cup dataset.</p></div><section className="group-section"><div className="section-title"><span>GROUP STAGE</span><p>12 GROUPS · 48 TEAMS</p></div><div className="groups-grid">{Object.entries(GROUPS).map(([letter,teams])=><article className="group-card" key={letter}><div className="group-letter">{letter}</div>{teams.map((team,i)=><a href={NAME_TO_ID[team]?`/teams/${NAME_TO_ID[team]}`:'/teams'} key={team}><b>{String(i+1).padStart(2,'0')}</b><span><TeamFlag name={team}/>{team}</span><em>{TEAMS[NAME_TO_ID[team]]?.status||'GROUP STAGE'}</em></a>)}</article>)}</div></section><section className="knockout-section"><div className="section-title"><span>KNOCKOUT STAGE</span><p>SEMIFINAL DAY</p></div><div className="bracket-scroll"><div className="bracket clean-bracket">{roundLabels.map(([round,label])=><div className="bracket-col" key={round}><h3>{label}</h3>{fixturesFor(round).map(({team,item})=><MatchTile key={`${team.id}-${item.round}-${item.opp}`} match={[item.round,team.name,item.opp,item.score,'']} compact/>)}</div>)}<div className="bracket-col final-column"><h3>FINAL</h3><MatchTile match={['SUN 19 JUL','WINNER SF 1','WINNER SF 2','','']} compact/></div></div></div></section></main></>}

function StatsPage(){const statRows=[['GOALS',GOLDEN_BOOT[0].name,GOLDEN_BOOT[0].team,GOLDEN_BOOT[0].g],['ASSISTS',ASSISTS[0].name,ASSISTS[0].team,ASSISTS[0].a],['MINUTES',GOLDEN_BOOT[1].name,GOLDEN_BOOT[1].team,GOLDEN_BOOT[1].min],['GOAL + ASSIST',GOLDEN_BOOT[2].name,GOLDEN_BOOT[2].team,GOLDEN_BOOT[2].g+GOLDEN_BOOT[2].a]];const teamRows=[['BEST ATTACK',TEAM_STATS.bestAttack[0]],['BEST DEFENCE',TEAM_STATS.bestDefense[0]],['MOST POSSESSION',TEAM_STATS.mostPossession[0]]];return <><Header/><main className="subpage stats-page"><div className="stats-intro"><p className="eyebrow">TOURNAMENT STATS · 14 JUL 2026</p><h1>THE NUMBERS<br/><i>MAKE HISTORY.</i></h1><p>World Cup-only scoring, creativity and team-performance leaders from the supplied dataset.</p></div><section className="leader-grid">{statRows.map(([metric,player,country,value],i)=><article className="leader-card" key={metric}><span className="rank">0{i+1}</span><p>{metric}</p><strong>{value}</strong><div><TeamFlag name={country}/><span>{player}<small>{country.toUpperCase()}</small></span></div></article>)}</section><section className="team-stats"><div className="section-title"><span>TEAM INTELLIGENCE</span><p>WORLD CUP ONLY</p></div><div className="stat-bars">{teamRows.map(([label,entry])=><article key={label}><b>{label}</b><h3>{entry.team}</h3><span><i style={{width:'86%'}}></i></span><small>{entry.val} · FIFA World Cup 2026</small></article>)}</div></section></main></>}

function Landing(){return <><main className="home-landing"><header className="home-nav"><a className="brand" href="/"><Mark/><span>FIFA WORLD CUP<br/><b>26</b></span></a><nav><a href="/matches">MATCHES</a><a href="/stats">STATS</a><a href="/teams">TEAMS</a></nav></header><div className="home-red"></div><div className="home-mint"></div><div className="home-ring"></div><div className="home-copy"><p className="eyebrow">CANADA · MÉXICO · USA</p><h1>THE WORLD<br/><i>IS ON.</i></h1><p>The biggest stage in football is here. Three countries. Forty-eight nations. One beautiful game.</p><a href="#hosts">EXPLORE THE HOSTS <b>↓</b></a></div><div className="home-26"><span>2</span><span>6</span></div><img className="home-trophy" src="/fifa-world-cup-26-emblem.png" alt="FIFA World Cup 26 emblem"/><div className="home-info"><span>11 JUN — 19 JUL</span><span>104 MATCHES</span><span>16 CITIES</span></div></main><section className="home-intro"><p className="eyebrow">FOOTBALL UNITED</p><h2>ONE CUP.<br/>THREE <i>HOME</i> CROWDS.</h2><p>Scroll through the three countries sharing football's biggest stage.</p></section><section className="host-journey" id="hosts"><article className="host-chapter canada-chapter"><i className="host-motif">✦</i><p>01 — NORTH</p><h2>CANADA</h2><span>Vancouver · Toronto</span><b>BOLD<br/>OPEN<br/>WIDE</b></article><article className="host-chapter mexico-chapter"><i className="host-motif">☀</i><p>02 — HEART</p><h2>MÉXICO</h2><span>Mexico City · Guadalajara · Monterrey</span><b>VIVA<br/>EL<br/>JUEGO</b></article><article className="host-chapter usa-chapter"><i className="host-motif">★ ★ ★</i><p>03 — ENERGY</p><h2>USA</h2><span>11 host cities · Coast to coast</span><b>ALL<br/>IN</b></article></section><section className="home-outro"><p className="eyebrow">FIFA WORLD CUP 26™</p><h2>104 MATCHES.<br/><i>ONE STORY.</i></h2><a href="/matches">SEE EVERY MATCH →</a></section></>}

function App(){const path=window.location.pathname;if(path==='/matches')return <MatchesPage/>;if(path==='/stats')return <StatsPage/>;return <Landing/>}

createRoot(document.getElementById('root')).render(<App/>);
JSXEOF

cat >> src/style.css << 'CSSEOF'
.stats-intro{background:var(--purple)}.leader-grid{padding:0 5vw;display:grid;grid-template-columns:repeat(4,1fr);gap:15px;transform:translateY(-38px)}.leader-card{position:relative;min-height:270px;padding:24px;background:var(--mint);border-radius:18px;overflow:hidden}.leader-card:nth-child(2){background:var(--red);color:white}.leader-card:nth-child(3){background:var(--yellow)}.leader-card:nth-child(4){background:var(--sky)}.leader-card .rank{position:absolute;right:-6px;top:-30px;font:900 9rem/1 'Archivo Black';opacity:.25}.leader-card p{position:relative;font:600 .68rem 'DM Mono';margin:0}.leader-card>strong{display:block;position:relative;font:900 6rem/.9 'Archivo Black';margin:50px 0}.leader-card>div{display:flex;align-items:center;gap:9px;position:relative;font-weight:700}.leader-card>div span{display:flex;flex-direction:column}.leader-card small{font:500 .63rem 'DM Mono';margin-top:3px}.stat-bars{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.stat-bars article{padding:28px;background:var(--black);color:white;border-radius:20px}.stat-bars b{font:600 .68rem 'DM Mono';color:var(--mint)}.stat-bars h3{font:900 2.4rem/1 'Archivo Black';margin:24px 0}.stat-bars span{display:block;height:13px;background:#4b4b4b;border-radius:20px;overflow:hidden}.stat-bars i{display:block;height:100%;background:var(--red);border-radius:inherit}.stat-bars small{display:block;margin-top:13px;font-size:.78rem}
CSSEOF

commit_at "2026-07-14T14:45:00+05:30" "feat: add stats page with golden boot leaderboard and team intelligence bars"

# ── Jul 14 [4/5]: Teams directory ──────────────────────────────────────────────
echo "▸ Jul 14 [4/5]: Teams directory..."

cat >> src/style.css << 'CSSEOF'
.teams-page{background:var(--yellow)}.teams-page .page-hero{background:var(--yellow);color:var(--black)}.teams-page .page-hero:after{color:var(--red)}.teams-page .page-hero h1 i{color:var(--purple)}.team-directory{padding:0 5vw 100px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.team-directory-card{height:240px;padding:22px;display:flex;flex-direction:column;background:var(--primary);color:white;border-radius:18px;position:relative;overflow:hidden;transition:.25s}.team-directory-card:after{content:'26';position:absolute;right:-15px;bottom:-42px;font:900 10rem/1 'Archivo Black';color:var(--secondary);opacity:.85}.team-directory-card:hover{transform:translateY(-8px);box-shadow:0 12px 0 #111}.team-directory-card>span{font-size:2.6rem;z-index:1}.team-directory-card>b{font:900 2rem/1 'Archivo Black';margin-top:auto;z-index:1}.team-directory-card small{font:600 .7rem 'DM Mono';margin-top:9px;z-index:1}
CSSEOF

commit_at "2026-07-14T17:00:00+05:30" "style: add teams directory card grid with dynamic color theming and hover effects"

# ── Jul 14 [5/5]: Teams page component + routing ──────────────────────────────
echo "▸ Jul 14 [5/5]: Teams page + routing..."

cat > src/main.jsx << 'JSXEOF'
import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { TEAMS, GROUPS, FLAGS, NAME_TO_ID, GOLDEN_BOOT, ASSISTS, TEAM_STATS } from './worldCupData';

function Mark(){return <div className="mark" aria-label="World Cup 26"><span>2</span><span>6</span></div>}

function Header(){return <header className="site-header"><a className="brand dark" href="/"><Mark/><span>FIFA WORLD CUP<br/><b>26</b></span></a><nav><a href="/matches">MATCHES</a><a href="/stats">STATS</a><a href="/teams">TEAMS</a></nav><a className="header-cta" href="/matches">FIXTURES ↗</a></header>}

function TeamFlag({name}){return <span className="team-flag">{FLAGS[name]||'⚽'}</span>}

function MatchTile({match, compact=false}){const finished=match[3]!==''&&match[3]!==undefined;return <div className={'match-tile '+(compact?'compact':'')}><div className="match-meta"><span>{match[0]}</span><b>{finished?'FT':'UP NEXT'}</b></div><div className="match-row"><span><TeamFlag name={match[1]}/>{match[1]}</span><strong>{finished?match[3]:'—'}</strong></div><div className="match-row"><span><TeamFlag name={match[2]}/>{match[2]}</span><strong>{finished?match[4]:'—'}</strong></div></div>}

function MatchesPage(){const roundLabels=[['Round of 32','ROUND OF 32'],['Round of 16','ROUND OF 16'],['Quarter-final','QUARTER-FINALS'],['Semi-final','SEMI-FINALS']];const fixturesFor=round=>Object.values(TEAMS).flatMap(team=>team.path.filter(item=>item.round===round).map(item=>({team,item}))).filter(({team,item},index,array)=>array.findIndex(entry=>[entry.team.name,entry.item.opp].sort().join('|')===[team.name,item.opp].sort().join('|'))===index);return <><Header/><main className="subpage matches-page"><div className="page-hero"><p className="eyebrow">FIFA WORLD CUP 26™ · 14 JUL 2026</p><h1>THE ROAD<br/>TO <i>GLORY.</i></h1><p>All group-stage nations and a clean, current knockout view from the supplied World Cup dataset.</p></div><section className="group-section"><div className="section-title"><span>GROUP STAGE</span><p>12 GROUPS · 48 TEAMS</p></div><div className="groups-grid">{Object.entries(GROUPS).map(([letter,teams])=><article className="group-card" key={letter}><div className="group-letter">{letter}</div>{teams.map((team,i)=><a href={NAME_TO_ID[team]?`/teams/${NAME_TO_ID[team]}`:'/teams'} key={team}><b>{String(i+1).padStart(2,'0')}</b><span><TeamFlag name={team}/>{team}</span><em>{TEAMS[NAME_TO_ID[team]]?.status||'GROUP STAGE'}</em></a>)}</article>)}</div></section><section className="knockout-section"><div className="section-title"><span>KNOCKOUT STAGE</span><p>SEMIFINAL DAY</p></div><div className="bracket-scroll"><div className="bracket clean-bracket">{roundLabels.map(([round,label])=><div className="bracket-col" key={round}><h3>{label}</h3>{fixturesFor(round).map(({team,item})=><MatchTile key={`${team.id}-${item.round}-${item.opp}`} match={[item.round,team.name,item.opp,item.score,'']} compact/>)}</div>)}<div className="bracket-col final-column"><h3>FINAL</h3><MatchTile match={['SUN 19 JUL','WINNER SF 1','WINNER SF 2','','']} compact/></div></div></div></section></main></>}

function StatsPage(){const statRows=[['GOALS',GOLDEN_BOOT[0].name,GOLDEN_BOOT[0].team,GOLDEN_BOOT[0].g],['ASSISTS',ASSISTS[0].name,ASSISTS[0].team,ASSISTS[0].a],['MINUTES',GOLDEN_BOOT[1].name,GOLDEN_BOOT[1].team,GOLDEN_BOOT[1].min],['GOAL + ASSIST',GOLDEN_BOOT[2].name,GOLDEN_BOOT[2].team,GOLDEN_BOOT[2].g+GOLDEN_BOOT[2].a]];const teamRows=[['BEST ATTACK',TEAM_STATS.bestAttack[0]],['BEST DEFENCE',TEAM_STATS.bestDefense[0]],['MOST POSSESSION',TEAM_STATS.mostPossession[0]]];return <><Header/><main className="subpage stats-page"><div className="stats-intro"><p className="eyebrow">TOURNAMENT STATS · 14 JUL 2026</p><h1>THE NUMBERS<br/><i>MAKE HISTORY.</i></h1><p>World Cup-only scoring, creativity and team-performance leaders from the supplied dataset.</p></div><section className="leader-grid">{statRows.map(([metric,player,country,value],i)=><article className="leader-card" key={metric}><span className="rank">0{i+1}</span><p>{metric}</p><strong>{value}</strong><div><TeamFlag name={country}/><span>{player}<small>{country.toUpperCase()}</small></span></div></article>)}</section><section className="team-stats"><div className="section-title"><span>TEAM INTELLIGENCE</span><p>WORLD CUP ONLY</p></div><div className="stat-bars">{teamRows.map(([label,entry])=><article key={label}><b>{label}</b><h3>{entry.team}</h3><span><i style={{width:'86%'}}></i></span><small>{entry.val} · FIFA World Cup 2026</small></article>)}</div></section></main></>}

function TeamsPage(){const roster=Object.values(GROUPS).flat();return <><Header/><main className="subpage teams-page"><div className="page-hero"><p className="eyebrow">NATIONS OF THE WORLD · 48 TEAMS</p><h1>PICK YOUR<br/><i>COLOURS.</i></h1><p>Every nation in this FIFA World Cup 2026 dataset. Detailed World Cup player cards are available for featured teams.</p></div><div className="team-directory">{roster.map((name,index)=>{const id=NAME_TO_ID[name],profile=id&&TEAMS[id],code=profile?.confed||name.slice(0,3).toUpperCase(),flag=FLAGS[name]||'⚽',primary=profile?.colors.primary||['#2436b8','#e2321c','#087b54','#6017dd'][index%4],secondary=profile?.colors.accent||'#d9f009';return <a href={id?`/teams/${id}`:'/teams'} className="team-directory-card" key={name} style={{'--primary':primary,'--secondary':secondary}}><span>{flag}</span><b>{name}</b><small>{code} · {id?'TEAM PROFILE →':'WORLD CUP 26'}</small></a>})}</div></main></>}

function Landing(){return <><main className="home-landing"><header className="home-nav"><a className="brand" href="/"><Mark/><span>FIFA WORLD CUP<br/><b>26</b></span></a><nav><a href="/matches">MATCHES</a><a href="/stats">STATS</a><a href="/teams">TEAMS</a></nav></header><div className="home-red"></div><div className="home-mint"></div><div className="home-ring"></div><div className="home-copy"><p className="eyebrow">CANADA · MÉXICO · USA</p><h1>THE WORLD<br/><i>IS ON.</i></h1><p>The biggest stage in football is here. Three countries. Forty-eight nations. One beautiful game.</p><a href="#hosts">EXPLORE THE HOSTS <b>↓</b></a></div><div className="home-26"><span>2</span><span>6</span></div><img className="home-trophy" src="/fifa-world-cup-26-emblem.png" alt="FIFA World Cup 26 emblem"/><div className="home-info"><span>11 JUN — 19 JUL</span><span>104 MATCHES</span><span>16 CITIES</span></div></main><section className="home-intro"><p className="eyebrow">FOOTBALL UNITED</p><h2>ONE CUP.<br/>THREE <i>HOME</i> CROWDS.</h2><p>Scroll through the three countries sharing football's biggest stage.</p></section><section className="host-journey" id="hosts"><article className="host-chapter canada-chapter"><i className="host-motif">✦</i><p>01 — NORTH</p><h2>CANADA</h2><span>Vancouver · Toronto</span><b>BOLD<br/>OPEN<br/>WIDE</b></article><article className="host-chapter mexico-chapter"><i className="host-motif">☀</i><p>02 — HEART</p><h2>MÉXICO</h2><span>Mexico City · Guadalajara · Monterrey</span><b>VIVA<br/>EL<br/>JUEGO</b></article><article className="host-chapter usa-chapter"><i className="host-motif">★ ★ ★</i><p>03 — ENERGY</p><h2>USA</h2><span>11 host cities · Coast to coast</span><b>ALL<br/>IN</b></article></section><section className="home-outro"><p className="eyebrow">FIFA WORLD CUP 26™</p><h2>104 MATCHES.<br/><i>ONE STORY.</i></h2><a href="/matches">SEE EVERY MATCH →</a></section></>}

function App(){const path=window.location.pathname;if(path==='/matches')return <MatchesPage/>;if(path==='/stats')return <StatsPage/>;if(path==='/teams')return <TeamsPage/>;return <Landing/>}

createRoot(document.getElementById('root')).render(<App/>);
JSXEOF

commit_at "2026-07-14T21:15:00+05:30" "feat: add teams directory page with 48-nation grid and client-side routing"


###############################################################################
#  JULY 15  (4 commits)
###############################################################################

# ── Jul 15 [1/4]: Team profile + player cards ─────────────────────────────────
echo "▸ Jul 15 [1/4]: Team profiles + player cards..."

cat >> src/style.css << 'CSSEOF'
.team-profile{background:var(--cream)}.team-profile-hero{min-height:610px;position:relative;padding:55px 8vw;background:var(--team);color:white;overflow:hidden}.team-profile-hero:after{content:'26';position:absolute;right:-2vw;bottom:-11vw;font:900 35vw/.7 'Archivo Black';color:var(--team2);opacity:.75}.team-profile-hero>*{position:relative;z-index:1}.back{font:600 .75rem 'DM Mono';display:inline-block;margin-bottom:90px}.team-profile-mark{position:absolute;z-index:2;right:8vw;top:55px;width:190px;height:190px;border:3px solid white;border-radius:50%;display:grid;place-items:center;text-align:center;background:#0002}.team-profile-mark span{font-size:5rem}.team-profile-mark p{font:900 2.4rem/1 'Archivo Black';margin:0}.team-profile h1{max-width:850px}.team-summary{max-width:450px;font-size:1.1rem;line-height:1.45}.team-numbers{display:flex;gap:45px;margin-top:44px}.team-numbers span{font:500 .68rem/1.4 'DM Mono'}.team-numbers b{display:block;font:900 2.6rem/1 'Archivo Black'}.squad-section{padding:90px 5vw}.team-history{padding:115px 8vw;background:var(--black);color:white}.team-history h2{font:900 clamp(3rem,7vw,7rem)/.8 'Archivo Black';margin:0}.team-history>p:last-child{max-width:400px;font-size:1.08rem;line-height:1.5;margin-top:32px}.player-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.player-card{height:530px;border-radius:22px;position:relative;overflow:hidden;background:var(--team2);color:white;box-shadow:0 11px 0 var(--team)}.player-photo{position:absolute;inset:0;background-size:cover;background-position:center top;filter:saturate(.85) contrast(1.08);mix-blend-mode:luminosity}.player-number{position:absolute;right:14px;top:12px;font:900 8rem/.8 'Archivo Black';color:#fff4}.player-info{position:absolute;left:24px;bottom:24px}.player-info small,.player-info span{font:600 .72rem 'DM Mono'}.player-info h2{font:900 clamp(2rem,3vw,3.8rem)/.86 'Archivo Black';margin:9px 0}.card-corner{position:absolute;right:17px;bottom:15px;font:900 3rem/.8 'Archivo Black';color:var(--team)}.player-card{border:0;text-align:left;font-family:inherit;cursor:pointer}.player-card:hover{transform:translateY(-6px)}.player-glyph{display:grid;place-items:center;font-size:9rem;background:linear-gradient(145deg,var(--team2),var(--team));mix-blend-mode:normal}.player-modal-backdrop{position:fixed;inset:0;z-index:30;border:0;background:#000a;display:grid;place-items:center;padding:20px;color:var(--black);font-family:inherit}.player-modal{width:min(390px,100%);background:var(--cream);border:5px solid var(--team);border-radius:24px;padding:30px;text-align:left;box-shadow:15px 15px 0 var(--team2)}.player-modal>b{font:900 2rem 'Archivo Black';color:var(--team)}.player-modal h2{font:900 2.8rem/.85 'Archivo Black';letter-spacing:-.08em;margin:20px 0 8px}.player-modal p{font:600 .8rem 'DM Mono'}.player-modal div{margin:25px 0;padding:16px 0;border-top:2px solid;border-bottom:2px solid;font:600 .72rem 'DM Mono'}.player-modal strong{font:900 2rem 'Archivo Black';margin:0 7px}.player-modal small{font:600 .7rem 'DM Mono'}.team-profile .player-grid{display:flex;flex-direction:column;gap:12px}.team-profile .player-card{height:112px;width:100%;display:flex;align-items:center;padding:14px 28px;border-radius:14px;box-shadow:5px 5px 0 var(--team);transition:transform .2s}.team-profile .player-card:hover{transform:translateX(8px)}.team-profile .player-glyph{position:relative;inset:auto;width:76px;height:76px;flex:0 0 76px;border-radius:12px;font-size:2.5rem}.team-profile .player-number{position:relative;inset:auto;order:2;margin-left:auto;font-size:4.2rem;color:#fff6}.team-profile .player-info{position:relative;left:auto;bottom:auto;margin-left:20px;text-align:left}.team-profile .player-info h2{font-size:clamp(1.35rem,2vw,2.2rem);margin:4px 0}.team-profile .card-corner{display:none}.team-profile .player-info span{font-size:.72rem}.team-profile .squad-section{max-width:980px;margin:auto}.team-profile .team-history h2{max-width:900px}.team-profile .player-modal{cursor:default}
CSSEOF

commit_at "2026-07-15T10:00:00+05:30" "feat: add team profile page with squad cards, player modal, and match history"

# ── Jul 15 [2/4]: Full app with all pages + routing ────────────────────────────
echo "▸ Jul 15 [2/4]: Full routing..."

cp "$BACKUP_DIR/src/main.jsx" src/main.jsx

commit_at "2026-07-15T13:30:00+05:30" "feat: wire up all pages with TeamPage component and full client-side routing"

# ── Jul 15 [3/4]: Responsive + final CSS polish ───────────────────────────────
echo "▸ Jul 15 [3/4]: Responsive + polish..."

# Overwrite CSS with the final version
cp "$BACKUP_DIR/src/style.css" src/style.css

sed -i '' 's/"version": "0.1.0"/"version": "1.0.0"/' package.json

commit_at "2026-07-15T16:45:00+05:30" "style: add responsive breakpoints, polish CSS ordering, bump to v1.0.0"

# ── Jul 15 [4/4]: README ──────────────────────────────────────────────────────
echo "▸ Jul 15 [4/4]: README..."

cat > README.md << 'MDEOF'
# FIFA World Cup 2026 ⚽

A premium React + Vite web app for the FIFA World Cup 2026, featuring:

- **Landing page** with immersive hero and host country journey
- **Matches page** with 12-group grid and clean knockout bracket
- **Stats page** with Golden Boot, assists leaders, and team intelligence
- **Teams directory** with 48-nation card grid
- **Team profiles** with squad cards, player modals, and match history

## Tech Stack

- React 19
- Vite
- Vanilla CSS with custom design system

## Getting Started

```bash
npm install
npm run dev
```

## Data

All tournament data reflects publicly reported facts as of 14 July 2026 (semifinal day).
MDEOF

commit_at "2026-07-15T19:00:00+05:30" "docs: add project README with feature overview and setup instructions"


# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ All commits created on branch 'development'"
echo "═══════════════════════════════════════════════════"
echo ""
git log --oneline --graph --all
echo ""

# Clean up
rm -rf "$BACKUP_DIR"
echo "▸ Backup cleaned up. Done!"
