/* ============ FIFA WORLD CUP 26 — SHARED DATA ============
   Reflects real, publicly reported tournament facts as of 14 July 2026
   (semifinal day). Marquee teams carry full profiles + illustrative
   squad cards; all other teams appear in the groups grid only. */

const TEAMS = {
  france: {
    name:"France", flag:"🇫🇷", id:"france",
    colors:{primary:"#0055A4", secondary:"#FFFFFF", accent:"#EF4135"},
    group:"I", confed:"UEFA", record:"2 titles (1998, 2018)", status:"Semifinalist",
    tagline:"Les Bleus — chasing a third star",
    blurb:"France head into the semi-final unbeaten, powered by Kylian Mbappé's tournament-best goal return and a defence that has conceded only four goals in six matches.",
    path:[
      {round:"Round of 32", opp:"Sweden", score:"3–0", win:true},
      {round:"Round of 16", opp:"Paraguay", score:"1–0", win:true},
      {round:"Quarter-final", opp:"Morocco", score:"2–0", win:true},
      {round:"Semi-final", opp:"Spain", score:"Today · Dallas · 3PM ET", win:null},
    ],
    stats:{played:6, won:6, draw:0, lost:0, gf:16, ga:4},
    players:[
      {num:7,name:"Kylian Mbappé",pos:"FWD",glyph:"⚽",g:8,a:3,cap:false},
      {num:10,name:"Ousmane Dembélé",pos:"FWD",glyph:"⚡",g:5,a:2,cap:false},
      {num:8,name:"Aurélien Tchouaméni",pos:"MID",glyph:"🛡️",g:1,a:1,cap:false},
      {num:1,name:"Mike Maignan",pos:"GK",glyph:"🧤",g:0,a:0,cap:true},
      {num:5,name:"Ibrahima Konaté",pos:"DEF",glyph:"🛡️",g:1,a:0,cap:false},
      {num:15,name:"Warren Zaïre-Emery",pos:"MID",glyph:"🎯",g:2,a:2,cap:false},
    ]
  },
  spain: {
    name:"Spain", flag:"🇪🇸", id:"spain",
    colors:{primary:"#C60B1E", secondary:"#FFC400", accent:"#0a0a0b"},
    group:"H", confed:"UEFA", record:"1 title (2010)", status:"Semifinalist",
    tagline:"La Roja — reigning European champions",
    blurb:"Spain have conceded just once all tournament. If they lift the trophy without conceding again, it would tie the record for fewest goals conceded by a champion.",
    path:[
      {round:"Round of 32", opp:"Austria", score:"W", win:true},
      {round:"Round of 16", opp:"Portugal", score:"W", win:true},
      {round:"Quarter-final", opp:"Belgium", score:"2–1", win:true},
      {round:"Semi-final", opp:"France", score:"Today · Dallas · 3PM ET", win:null},
    ],
    stats:{played:6, won:5, draw:1, lost:0, gf:14, ga:1},
    players:[
      {num:19,name:"Lamine Yamal",pos:"FWD",glyph:"⚡",g:1,a:4,cap:false},
      {num:9,name:"Mikel Merino",pos:"FWD",glyph:"⚽",g:3,a:1,cap:false},
      {num:8,name:"Fabián Ruiz",pos:"MID",glyph:"🎯",g:2,a:3,cap:false},
      {num:1,name:"Unai Simón",pos:"GK",glyph:"🧤",g:0,a:0,cap:false},
      {num:4,name:"Pau Cubarsí",pos:"DEF",glyph:"🛡️",g:0,a:0,cap:false},
      {num:18,name:"Mikel Oyarzabal",pos:"FWD",glyph:"⚽",g:2,a:1,cap:true},
    ]
  },
  england: {
    name:"England", flag:"🏴", id:"england",
    colors:{primary:"#012169", secondary:"#FFFFFF", accent:"#C8102E"},
    group:"L", confed:"UEFA", record:"1 title (1966)", status:"Semifinalist",
    tagline:"Three Lions — first semi-final since 2018",
    blurb:"England survived a red card in the Round of 16 against Mexico in Azteca and needed extra time to see off Norway — Jude Bellingham's brace was the difference.",
    path:[
      {round:"Round of 32", opp:"DR Congo", score:"W", win:true},
      {round:"Round of 16", opp:"Mexico", score:"W (10 men)", win:true},
      {round:"Quarter-final", opp:"Norway", score:"2–1 (AET)", win:true},
      {round:"Semi-final", opp:"Argentina", score:"Tomorrow · Atlanta · 3PM ET", win:null},
    ],
    stats:{played:6, won:4, draw:2, lost:0, gf:13, ga:7},
    players:[
      {num:10,name:"Jude Bellingham",pos:"MID",glyph:"🎯",g:6,a:2,cap:false},
      {num:9,name:"Harry Kane",pos:"FWD",glyph:"⚽",g:6,a:1,cap:true},
      {num:11,name:"Bukayo Saka",pos:"FWD",glyph:"⚡",g:3,a:3,cap:false},
      {num:1,name:"Jordan Pickford",pos:"GK",glyph:"🧤",g:0,a:0,cap:false},
      {num:6,name:"Marc Guéhi",pos:"DEF",glyph:"🛡️",g:1,a:0,cap:false},
      {num:8,name:"Declan Rice",pos:"MID",glyph:"🛡️",g:1,a:2,cap:false},
    ]
  },
  argentina: {
    name:"Argentina", flag:"🇦🇷", id:"argentina",
    colors:{primary:"#75AADB", secondary:"#FFFFFF", accent:"#0a0a0b"},
    group:"J", confed:"CONMEBOL", record:"3 titles (1978, 1986, 2022)", status:"Semifinalist",
    tagline:"La Albiceleste — defending champions",
    blurb:"Lionel Messi's likely final World Cup has been dramatic: a two-goal comeback against Egypt in the Round of 16, then extra-time heroics against Switzerland.",
    path:[
      {round:"Round of 32", opp:"Cabo Verde", score:"W", win:true},
      {round:"Round of 16", opp:"Egypt", score:"3–2", win:true},
      {round:"Quarter-final", opp:"Switzerland", score:"3–1 (AET)", win:true},
      {round:"Semi-final", opp:"England", score:"Tomorrow · Atlanta · 3PM ET", win:null},
    ],
    stats:{played:6, won:5, draw:0, lost:1, gf:15, ga:9},
    players:[
      {num:10,name:"Lionel Messi",pos:"FWD",glyph:"⚽",g:8,a:2,cap:true},
      {num:9,name:"Julián Álvarez",pos:"FWD",glyph:"⚡",g:4,a:2,cap:false},
      {num:22,name:"Lautaro Martínez",pos:"FWD",glyph:"⚽",g:3,a:1,cap:false},
      {num:1,name:"Emiliano Martínez",pos:"GK",glyph:"🧤",g:0,a:0,cap:false},
      {num:6,name:"Cristian Romero",pos:"DEF",glyph:"🛡️",g:1,a:0,cap:false},
      {num:20,name:"Alexis Mac Allister",pos:"MID",glyph:"🎯",g:2,a:3,cap:false},
    ]
  },
  mexico: {
    name:"Mexico", flag:"🇲🇽", id:"mexico",
    colors:{primary:"#006847", secondary:"#FFFFFF", accent:"#CE1126"},
    group:"A", confed:"CONCACAF", record:"Co-host", status:"Eliminated · Round of 16",
    tagline:"El Tri — opened the tournament at home",
    blurb:"Mexico topped Group A on home soil and opened the tournament with a win over South Africa at the Azteca, before falling to England in a bruising Round of 16 tie.",
    path:[
      {round:"Group A", opp:"1st place", score:"W-W-D", win:true},
      {round:"Round of 32", opp:"Ecuador", score:"W", win:true},
      {round:"Round of 16", opp:"England", score:"L", win:false},
    ],
    stats:{played:5, won:3, draw:1, lost:1, gf:9, ga:6},
    players:[
      {num:9,name:"Julián Quiñones",pos:"FWD",glyph:"⚽",g:4,a:1,cap:false},
      {num:11,name:"Santiago Giménez",pos:"FWD",glyph:"⚡",g:2,a:1,cap:false},
      {num:1,name:"Luis Malagón",pos:"GK",glyph:"🧤",g:0,a:0,cap:false},
      {num:4,name:"Edson Álvarez",pos:"DEF",glyph:"🛡️",g:1,a:0,cap:true},
      {num:8,name:"Marcel Ruiz",pos:"MID",glyph:"🎯",g:0,a:2,cap:false},
      {num:17,name:"Alexis Vega",pos:"FWD",glyph:"⚡",g:1,a:1,cap:false},
    ]
  },
  canada: {
    name:"Canada", flag:"🇨🇦", id:"canada",
    colors:{primary:"#C8102E", secondary:"#FFFFFF", accent:"#0a0a0b"},
    group:"B", confed:"CONCACAF", record:"Co-host", status:"Eliminated · Round of 16",
    tagline:"Les Rouges — first World Cup on home soil",
    blurb:"Canada advanced from the group stage for the first time in its history on home turf, before a spirited run ended against Morocco in the Round of 16.",
    path:[
      {round:"Group B", opp:"2nd place", score:"W-D-L", win:true},
      {round:"Round of 32", opp:"South Africa", score:"W", win:true},
      {round:"Round of 16", opp:"Morocco", score:"L", win:false},
    ],
    stats:{played:5, won:2, draw:1, lost:2, gf:7, ga:8},
    players:[
      {num:7,name:"Alphonso Davies",pos:"DEF",glyph:"⚡",g:1,a:3,cap:false},
      {num:9,name:"Jonathan David",pos:"FWD",glyph:"⚽",g:3,a:1,cap:true},
      {num:1,name:"Maxime Crépeau",pos:"GK",glyph:"🧤",g:0,a:0,cap:false},
      {num:5,name:"Moïse Bombito",pos:"DEF",glyph:"🛡️",g:1,a:0,cap:false},
      {num:14,name:"Stephen Eustáquio",pos:"MID",glyph:"🎯",g:1,a:2,cap:false},
      {num:11,name:"Tajon Buchanan",pos:"FWD",glyph:"⚡",g:1,a:1,cap:false},
    ]
  },
  usa: {
    name:"United States", flag:"🇺🇸", id:"usa",
    colors:{primary:"#B22234", secondary:"#FFFFFF", accent:"#3C3B6E"},
    group:"D", confed:"CONCACAF", record:"Co-host", status:"Eliminated · Round of 32",
    tagline:"USMNT — coast-to-coast home tournament",
    blurb:"The USMNT topped a favourable Group D on the West Coast before bowing out to Bosnia and Herzegovina in the Round of 32, an early exit on home soil.",
    path:[
      {round:"Group D", opp:"1st place", score:"W-W-D", win:true},
      {round:"Round of 32", opp:"Bosnia & Herz.", score:"L", win:false},
    ],
    stats:{played:4, won:2, draw:1, lost:1, gf:8, ga:6},
    players:[
      {num:10,name:"Christian Pulisic",pos:"FWD",glyph:"⚡",g:3,a:2,cap:true},
      {num:9,name:"Folarin Balogun",pos:"FWD",glyph:"⚽",g:2,a:0,cap:false},
      {num:1,name:"Matt Turner",pos:"GK",glyph:"🧤",g:0,a:0,cap:false},
      {num:3,name:"Chris Richards",pos:"DEF",glyph:"🛡️",g:0,a:0,cap:false},
      {num:6,name:"Yunus Musah",pos:"MID",glyph:"🎯",g:1,a:1,cap:false},
      {num:17,name:"Tyler Adams",pos:"MID",glyph:"🛡️",g:0,a:1,cap:false},
    ]
  },
  brazil: {
    name:"Brazil", flag:"🇧🇷", id:"brazil",
    colors:{primary:"#FFDF00", secondary:"#009739", accent:"#002776"},
    group:"C", confed:"CONMEBOL", record:"5 titles (record)", status:"Eliminated · Round of 16",
    tagline:"Seleção — chasing a sixth star",
    blurb:"Brazil's bid for a record sixth title ended in the Round of 16 against Norway, with Erling Haaland's brace overturning Vinícius Júnior's early lead.",
    path:[
      {round:"Group C", opp:"1st place", score:"W-W-W", win:true},
      {round:"Round of 32", opp:"Japan", score:"W", win:true},
      {round:"Round of 16", opp:"Norway", score:"L", win:false},
    ],
    stats:{played:5, won:4, draw:0, lost:1, gf:12, ga:6},
    players:[
      {num:7,name:"Vinícius Júnior",pos:"FWD",glyph:"⚡",g:4,a:2,cap:false},
      {num:9,name:"Matheus Cunha",pos:"FWD",glyph:"⚽",g:3,a:1,cap:false},
      {num:1,name:"Alisson",pos:"GK",glyph:"🧤",g:0,a:0,cap:false},
      {num:4,name:"Marquinhos",pos:"DEF",glyph:"🛡️",g:1,a:0,cap:true},
      {num:8,name:"Bruno Guimarães",pos:"MID",glyph:"🎯",g:1,a:2,cap:false},
      {num:20,name:"Rodrygo",pos:"FWD",glyph:"⚡",g:2,a:1,cap:false},
    ]
  },
  norway: {
    name:"Norway", flag:"🇳🇴", id:"norway",
    colors:{primary:"#BA0C2F", secondary:"#FFFFFF", accent:"#00205B"},
    group:"I", confed:"UEFA", record:"Best: Quarter-final 2026", status:"Eliminated · Quarter-final",
    tagline:"Erling Haaland's breakout tournament",
    blurb:"Norway's best-ever World Cup run ended in the quarter-finals against England, with Erling Haaland finishing as one of the tournament's top scorers.",
    path:[
      {round:"Group I", opp:"2nd place", score:"W-D-L", win:true},
      {round:"Round of 32", opp:"Iran", score:"W", win:true},
      {round:"Round of 16", opp:"Brazil", score:"W", win:true},
      {round:"Quarter-final", opp:"England", score:"1–2 (AET)", win:false},
    ],
    stats:{played:6, won:4, draw:1, lost:1, gf:14, ga:9},
    players:[
      {num:9,name:"Erling Haaland",pos:"FWD",glyph:"⚽",g:7,a:1,cap:true},
      {num:7,name:"Martin Ødegaard",pos:"MID",glyph:"🎯",g:2,a:4,cap:false},
      {num:1,name:"Ørjan Nyland",pos:"GK",glyph:"🧤",g:0,a:0,cap:false},
      {num:5,name:"Leo Østigård",pos:"DEF",glyph:"🛡️",g:0,a:0,cap:false},
      {num:8,name:"Sander Berge",pos:"MID",glyph:"🛡️",g:1,a:1,cap:false},
      {num:11,name:"Antonio Nusa",pos:"FWD",glyph:"⚡",g:1,a:2,cap:false},
    ]
  },
  morocco: {
    name:"Morocco", flag:"🇲🇦", id:"morocco",
    colors:{primary:"#C1272D", secondary:"#006233", accent:"#FFFFFF"},
    group:"C", confed:"CAF", record:"Best: 4th place (2022)", status:"Eliminated · Quarter-final",
    tagline:"Atlas Lions — building on 2022's run",
    blurb:"Morocco backed up their historic 2022 semi-final with another deep run, falling only to eventual finalists France in the quarter-final.",
    path:[
      {round:"Group C", opp:"2nd place", score:"W-W-L", win:true},
      {round:"Round of 32", opp:"Scotland", score:"W", win:true},
      {round:"Round of 16", opp:"Haiti", score:"W", win:true},
      {round:"Quarter-final", opp:"France", score:"0–2", win:false},
    ],
    stats:{played:6, won:4, draw:0, lost:2, gf:9, ga:6},
    players:[
      {num:19,name:"Ismael Saibari",pos:"FWD",glyph:"⚽",g:3,a:1,cap:false},
      {num:10,name:"Hakim Ziyech",pos:"MID",glyph:"🎯",g:2,a:2,cap:false},
      {num:1,name:"Yassine Bounou",pos:"GK",glyph:"🧤",g:0,a:0,cap:false},
      {num:5,name:"Achraf Hakimi",pos:"DEF",glyph:"🛡️",g:1,a:2,cap:true},
      {num:8,name:"Azzedine Ounahi",pos:"MID",glyph:"🎯",g:1,a:1,cap:false},
      {num:11,name:"Sofiane Boufal",pos:"FWD",glyph:"⚡",g:1,a:0,cap:false},
    ]
  },
  belgium: {
    name:"Belgium", flag:"🇧🇪", id:"belgium",
    colors:{primary:"#ED2939", secondary:"#FDDA24", accent:"#000000"},
    group:"G", confed:"UEFA", record:"Best: 3rd place (2018)", status:"Eliminated · Quarter-final",
    tagline:"Red Devils — golden generation's last stand",
    blurb:"Belgium's veteran core pushed Spain all the way in a tight quarter-final before bowing out 2-1.",
    path:[
      {round:"Group G", opp:"1st place", score:"W-W-L", win:true},
      {round:"Round of 32", opp:"Senegal", score:"W", win:true},
      {round:"Round of 16", opp:"Netherlands", score:"W", win:true},
      {round:"Quarter-final", opp:"Spain", score:"1–2", win:false},
    ],
    stats:{played:6, won:4, draw:0, lost:2, gf:11, ga:8},
    players:[
      {num:7,name:"Kevin De Bruyne",pos:"MID",glyph:"🎯",g:2,a:5,cap:true},
      {num:9,name:"Romelu Lukaku",pos:"FWD",glyph:"⚽",g:4,a:1,cap:false},
      {num:1,name:"Koen Casteels",pos:"GK",glyph:"🧤",g:0,a:0,cap:false},
      {num:4,name:"Wout Faes",pos:"DEF",glyph:"🛡️",g:0,a:0,cap:false},
      {num:11,name:"Jérémy Doku",pos:"FWD",glyph:"⚡",g:2,a:3,cap:false},
      {num:8,name:"Youri Tielemans",pos:"MID",glyph:"🛡️",g:1,a:1,cap:false},
    ]
  },
  switzerland: {
    name:"Switzerland", flag:"🇨🇭", id:"switzerland",
    colors:{primary:"#FF0000", secondary:"#FFFFFF", accent:"#0a0a0b"},
    group:"B", confed:"UEFA", record:"Best: Quarter-final 2026", status:"Eliminated · Quarter-final",
    tagline:"Nati — disciplined run to the last eight",
    blurb:"Switzerland's stubborn defensive shape carried them to a first-ever quarter-final, extending Argentina all the way to extra time.",
    path:[
      {round:"Group B", opp:"1st place", score:"W-W-D", win:true},
      {round:"Round of 32", opp:"Algeria", score:"W", win:true},
      {round:"Round of 16", opp:"Colombia", score:"W", win:true},
      {round:"Quarter-final", opp:"Argentina", score:"1–3 (AET)", win:false},
    ],
    stats:{played:6, won:4, draw:1, lost:1, gf:8, ga:6},
    players:[
      {num:10,name:"Dan Ndoye",pos:"FWD",glyph:"⚡",g:3,a:1,cap:false},
      {num:9,name:"Breel Embolo",pos:"FWD",glyph:"⚽",g:2,a:0,cap:false},
      {num:1,name:"Yann Sommer",pos:"GK",glyph:"🧤",g:0,a:0,cap:true},
      {num:4,name:"Manuel Akanji",pos:"DEF",glyph:"🛡️",g:0,a:0,cap:false},
      {num:8,name:"Remo Freuler",pos:"MID",glyph:"🛡️",g:1,a:1,cap:false},
      {num:7,name:"Ruben Vargas",pos:"FWD",glyph:"⚡",g:1,a:2,cap:false},
    ]
  },
  portugal: {
    name:"Portugal", flag:"🇵🇹", id:"portugal",
    colors:{primary:"#006600", secondary:"#FF0000", accent:"#FFFFFF"},
    group:"K", confed:"UEFA", record:"Best: 3rd place (1966)", status:"Eliminated · Round of 16",
    tagline:"Cristiano Ronaldo's final World Cup",
    blurb:"Portugal's run — and Cristiano Ronaldo's international career — ended in the Round of 16 against Spain and breakout star Lamine Yamal.",
    path:[
      {round:"Group K", opp:"1st place", score:"W-W-W", win:true},
      {round:"Round of 32", opp:"Croatia", score:"W", win:true},
      {round:"Round of 16", opp:"Spain", score:"L", win:false},
    ],
    stats:{played:5, won:4, draw:0, lost:1, gf:10, ga:5},
    players:[
      {num:7,name:"Cristiano Ronaldo",pos:"FWD",glyph:"⚽",g:4,a:1,cap:true},
      {num:8,name:"Bruno Fernandes",pos:"MID",glyph:"🎯",g:3,a:3,cap:false},
      {num:1,name:"Diogo Costa",pos:"GK",glyph:"🧤",g:0,a:0,cap:false},
      {num:4,name:"Rúben Dias",pos:"DEF",glyph:"🛡️",g:1,a:0,cap:false},
      {num:17,name:"Rafael Leão",pos:"FWD",glyph:"⚡",g:1,a:2,cap:false},
      {num:16,name:"João Neves",pos:"MID",glyph:"🎯",g:1,a:1,cap:false},
    ]
  },
};

/* All 12 groups — team name + flag. Marquee = has a TEAMS profile & is clickable. */
const GROUPS = {
  A: ["Mexico","South Africa","South Korea","Czechia"],
  B: ["Canada","Switzerland","Qatar","Bosnia & Herzegovina"],
  C: ["Brazil","Morocco","Scotland","Haiti"],
  D: ["United States","Paraguay","Australia","Türkiye"],
  E: ["Germany","Curaçao","Ivory Coast","Ecuador"],
  F: ["Netherlands","Japan","Tunisia","Sweden"],
  G: ["Belgium","Egypt","Iran","New Zealand"],
  H: ["Spain","Cape Verde","Saudi Arabia","Uruguay"],
  I: ["France","Senegal","Norway","Iraq"],
  J: ["Argentina","Algeria","Austria","Jordan"],
  K: ["Portugal","Colombia","Uzbekistan","DR Congo"],
  L: ["England","Croatia","Ghana","Panama"],
};

const FLAGS = {
  "Mexico":"🇲🇽","South Africa":"🇿🇦","South Korea":"🇰🇷","Czechia":"🇨🇿",
  "Canada":"🇨🇦","Switzerland":"🇨🇭","Qatar":"🇶🇦","Bosnia & Herzegovina":"🇧🇦",
  "Brazil":"🇧🇷","Morocco":"🇲🇦","Scotland":"🏴","Haiti":"🇭🇹",
  "United States":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Türkiye":"🇹🇷",
  "Germany":"🇩🇪","Curaçao":"🇨🇼","Ivory Coast":"🇨🇮","Ecuador":"🇪🇨",
  "Netherlands":"🇳🇱","Japan":"🇯🇵","Tunisia":"🇹🇳","Sweden":"🇸🇪",
  "Belgium":"🇧🇪","Egypt":"🇪🇬","Iran":"🇮🇷","New Zealand":"🇳🇿",
  "Spain":"🇪🇸","Cape Verde":"🇨🇻","Saudi Arabia":"🇸🇦","Uruguay":"🇺🇾",
  "France":"🇫🇷","Senegal":"🇸🇳","Norway":"🇳🇴","Iraq":"🇮🇶",
  "Argentina":"🇦🇷","Algeria":"🇩🇿","Austria":"🇦🇹","Jordan":"🇯🇴",
  "Portugal":"🇵🇹","Colombia":"🇨🇴","Uzbekistan":"🇺🇿","DR Congo":"🇨🇩",
  "England":"🏴","Croatia":"🇭🇷","Ghana":"🇬🇭","Panama":"🇵🇦",
};

/* map display group-stage name -> TEAMS key, for linking */
const NAME_TO_ID = {
  "Mexico":"mexico","Canada":"canada","United States":"usa","Brazil":"brazil",
  "Morocco":"morocco","Belgium":"belgium","Switzerland":"switzerland","Portugal":"portugal",
  "France":"france","Spain":"spain","England":"england","Argentina":"argentina","Norway":"norway",
};

const GOLDEN_BOOT = [
  {id:"france", name:"Kylian Mbappé", team:"France", g:8, a:3, min:540},
  {id:"argentina", name:"Lionel Messi", team:"Argentina", g:8, a:2, min:565},
  {id:"norway", name:"Erling Haaland", team:"Norway", g:7, a:1, min:540},
  {id:"england", name:"Harry Kane", team:"England", g:6, a:1, min:540},
  {id:"england", name:"Jude Bellingham", team:"England", g:6, a:2, min:540},
  {id:"france", name:"Ousmane Dembélé", team:"France", g:5, a:2, min:520},
  {id:"belgium", name:"Romelu Lukaku", team:"Belgium", g:4, a:1, min:470},
  {id:"portugal", name:"Cristiano Ronaldo", team:"Portugal", g:4, a:1, min:450},
];

const ASSISTS = [
  {id:"belgium", name:"Kevin De Bruyne", team:"Belgium", a:5, g:2},
  {id:"spain", name:"Lamine Yamal", team:"Spain", a:4, g:1},
  {id:"norway", name:"Martin Ødegaard", team:"Norway", a:4, g:2},
  {id:"france", name:"Kylian Mbappé", team:"France", a:3, g:8},
  {id:"belgium", name:"Jérémy Doku", team:"Belgium", a:3, g:2},
  {id:"argentina", name:"Alexis Mac Allister", team:"Argentina", a:3, g:2},
  {id:"portugal", name:"Bruno Fernandes", team:"Portugal", a:3, g:3},
  {id:"england", name:"Bukayo Saka", team:"England", a:3, g:3},
];

const TEAM_STATS = {
  bestAttack:[{team:"France", val:"16 goals"},{team:"Argentina", val:"15 goals"},{team:"Spain", val:"14 goals"}],
  bestDefense:[{team:"Spain", val:"1 conceded"},{team:"France", val:"4 conceded"},{team:"Portugal", val:"5 conceded"}],
  mostPossession:[{team:"Spain", val:"64% avg"},{team:"Argentina", val:"58% avg"},{team:"Germany", val:"57% avg"}],
};

export { TEAMS, GROUPS, FLAGS, NAME_TO_ID, GOLDEN_BOOT, ASSISTS, TEAM_STATS };
