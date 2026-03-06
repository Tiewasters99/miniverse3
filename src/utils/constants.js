// Room connection map and shared constants

export const ROOM_KEYS = ['study', 'jamaica', 'opensea', 'cabin', 'french', 'versailles', 'orangerie'];

export const COLORS = {
  darkWood: '#2a1a0a',
  richWood: '#4a2a1a',
  leather: '#5a3020',
  gold: '#d4af37',
  brass: '#b8962e',
  parchment: '#f4e8c1',
  galleryWall: '#e8e0d0',
  galleryTrim: '#c9b896',
  redVelvet: '#7a2a3a',
  limestone: '#e8dcc0',
  limestoneDark: '#d0c4a8',
  limestoneLight: '#f0e8d8',
};

export const WALL_TEXT_SPOTS = {
  study: { x: 0, y: 7, z: -6.85, rotY: 0, w: 5, h: 1.5 },
  jamaica: { x: 0, y: 5, z: 31.9, rotY: Math.PI, w: 6, h: 2 },
  opensea: { x: 0, y: 18, z: 0, rotY: 0, w: 8, h: 2 },
  cabin: { x: -5.85, y: 6.5, z: 2, rotY: Math.PI / 2, w: 4, h: 1.5 },
  french: { x: -5, y: 8.5, z: -8.8, rotY: 0, w: 6, h: 1.5 },
  versailles: { x: 0, y: 32, z: -23, rotY: 0, w: 12, h: 3 },
  orangerie: { x: 0, y: 13.5, z: -19, rotY: 0, w: 10, h: 2 },
};

export const WALL_PANELS = {
  moliere: {
    title: "The Complete Works of Molière",
    subtitle: "Œuvres Complètes (in French)",
    icon: "📜",
    color: '#4a1a2a',
    links: [
      { label: "📜 Read the Complete Works of Molière", url: "https://dn790006.ca.archive.org/0/items/uvrescompltes03moli/uvrescompltes03moli.pdf", desc: "Volume III — Internet Archive (PDF)" }
    ]
  },
  comedie: {
    title: "A Command Performance",
    subtitle: "at the Comédie-Française",
    icon: "🎭",
    color: '#5a1a1a',
    links: [
      { label: "🎭 Watch the Performance", url: "https://youtu.be/KQjOScrkemo", desc: "Video — YouTube" }
    ]
  },
  dictionaries: {
    title: "Dictionaries & Language Resources",
    subtitle: "Reference tools for the scholar",
    icon: "📚",
    color: '#1a3a5a',
    links: [
      { label: "📚 Merriam-Webster Dictionary", url: "https://www.merriam-webster.com/", desc: "English dictionary & thesaurus" },
      { label: "🇫🇷 Larousse (French)", url: "https://www.larousse.fr/dictionnaires/francais", desc: "Dictionnaire français" },
      { label: "🇩🇪 Duden (German)", url: "https://www.duden.de/", desc: "Deutsches Wörterbuch" },
      { label: "🇱🇦 Latin Dictionary", url: "https://www.latin-dictionary.net/", desc: "Latin — English lookup" }
    ]
  },
  legalresources: {
    title: "Online Legal Resources",
    subtitle: "Professional legal research platforms",
    icon: "⚖️",
    color: '#2a2a4a',
    links: [
      { label: "📜 Westlaw", url: "https://www.westlaw.com/", desc: "Thomson Reuters — requires subscription" },
      { label: "📜 LexisNexis", url: "https://www.lexisnexis.com/", desc: "RELX Group — requires subscription" },
      { label: "🏦 Google Scholar — Case Law", url: "https://scholar.google.com/", desc: "Free legal opinions & journals" },
      { label: "📄 Cornell LII", url: "https://www.law.cornell.edu/", desc: "Free legal encyclopedia & statutes" }
    ]
  },
  videolinks: {
    title: "Video Links",
    subtitle: "Launch video calls & streams",
    icon: "🎥",
    color: '#2a4a3a',
    links: [
      { label: "📹 Zoom", url: "https://zoom.us/myhome", desc: "Launch Zoom — join or start a meeting" }
    ]
  },
  'book-detail': {
    title: "Book from the Scholar's Library",
    subtitle: "A volume from the collection",
    icon: "📖",
    color: '#3a2a1a',
    links: [
      { label: "📖 Project Gutenberg", url: "https://www.gutenberg.org/", desc: "Free ebooks — Classic literature" },
      { label: "📚 Internet Archive Books", url: "https://archive.org/details/books", desc: "Digital library — Millions of books" },
      { label: "🏛️ Google Books", url: "https://books.google.com/", desc: "Search & preview books online" },
      { label: "📑 HathiTrust Digital Library", url: "https://www.hathitrust.org/", desc: "Academic digital library" }
    ]
  }
};

export const MOZART_TRACKS = [
  {
    name: "Eine kleine Nachtmusik",
    notes: [
      { note: "G4", duration: "8n", time: 0 },
      { note: "D4", duration: "8n", time: 0.15 },
      { note: "G4", duration: "4n", time: 0.3 },
      { note: "D4", duration: "8n", time: 0.6 },
      { note: "G4", duration: "8n", time: 0.75 },
      { note: "B4", duration: "8n", time: 0.9 },
      { note: "D5", duration: "2n", time: 1.05 },
      { note: "C5", duration: "8n", time: 1.8 },
      { note: "A4", duration: "8n", time: 1.95 },
      { note: "C5", duration: "4n", time: 2.1 },
      { note: "A4", duration: "8n", time: 2.4 },
      { note: "F#4", duration: "8n", time: 2.7 },
      { note: "D4", duration: "2n", time: 3.0 },
    ],
    tempo: 140
  },
  {
    name: "Rondo alla Turca",
    notes: [
      { note: "B4", duration: "16n", time: 0 },
      { note: "A4", duration: "16n", time: 0.1 },
      { note: "G#4", duration: "16n", time: 0.2 },
      { note: "A4", duration: "8n", time: 0.3 },
      { note: "C5", duration: "4n", time: 0.5 },
      { note: "E5", duration: "4n", time: 1.0 },
      { note: "D5", duration: "8n", time: 1.4 },
      { note: "C5", duration: "4n", time: 1.6 },
    ],
    tempo: 130
  },
];