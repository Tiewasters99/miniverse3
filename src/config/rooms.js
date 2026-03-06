const CUSTOM_ROOMS_KEY = 'miniverse:custom-rooms';

export const roomConfigs = {
  study: {
    name: "Scholar's Study",
    subtitle: "Home \u2022 Your Miniverse\u2122",
    isExterior: false,
    doors: [
      { to: 'french', label: 'French Literature Wing', icon: '\ud83d\udeaa' },
      { to: 'jamaica', label: 'The Vibes of Jamaica', icon: '\ud83c\udfd6\ufe0f' },
    ]
  },
  jamaica: {
    name: "The Vibes of Jamaica",
    subtitle: "Your Miniverse\u2122",
    isExterior: true,
    hasReggaeMusic: true,
    doors: [
      { to: 'opensea', label: 'To the Open Sea', icon: '\u26f5' },
      { to: 'study', label: 'Return to Study', icon: '\ud83c\udfe0' },
    ]
  },
  opensea: {
    name: "The Open Sea",
    subtitle: "Your Miniverse\u2122",
    isExterior: true,
    doors: [
      { to: 'cabin', label: 'To My Cabin', icon: '\ud83d\udeaa' },
      { to: 'jamaica', label: 'Return to Jamaica', icon: '\ud83c\udfd6\ufe0f' },
      { to: 'study', label: 'Return Home', icon: '\ud83c\udfe0' },
    ]
  },
  cabin: {
    name: "The Captain's Cabin",
    subtitle: "Your Miniverse\u2122",
    isExterior: false,
    doors: [
      { to: 'opensea', label: 'Return to Open Sea', icon: '\u26f5' },
      { to: 'study', label: 'Return Home', icon: '\ud83c\udfe0' },
    ]
  },
  french: {
    name: "The Golden Age of French Literature",
    subtitle: "Moli\u00e8re \u2022 Racine \u2022 Corneille",
    isExterior: false,
    doors: [
      { to: 'versailles', label: 'Gardens of Versailles', icon: '\ud83c\udf33' },
      { to: 'study', label: 'Return Home', icon: '\ud83c\udfe0' },
    ]
  },
  versailles: {
    name: "Gardens of Versailles \u2014 Central Vista",
    subtitle: "The Art of Perspective",
    isExterior: true,
    doors: [
      { to: 'orangerie', label: 'The Orangerie', icon: '\ud83c\udf4a' },
      { to: 'french', label: 'Return to French Literature', icon: '\u21a9\ufe0f' },
      { to: 'study', label: 'Return Home', icon: '\ud83c\udfe0' },
    ]
  },
  orangerie: {
    name: "The Orangerie",
    subtitle: "Gardens of Versailles",
    isExterior: true,
    hasMusic: true,
    doors: [
      { to: 'versailles', label: 'Return to Central Vista', icon: '\u21a9\ufe0f' },
      { to: 'study', label: 'Return Home', icon: '\ud83c\udfe0' },
    ]
  }
};

export const cameraDefaults = {
  study: { radius: 10, phi: 0.3, theta: 0 },
  jamaica: { radius: 25, phi: 0.35, theta: 0 },
  opensea: { radius: 60, phi: 0.25, theta: 0 },
  cabin: { radius: 10, phi: 0.3, theta: 0 },
  french: { radius: 15, phi: 0.25, theta: 0 },
  versailles: { radius: 80, phi: 0.4, theta: 0 },
  orangerie: { radius: 55, phi: 0.35, theta: 0 },
};

export const roomBounds = {
  study: { minX: -6, maxX: 6, minZ: -6, maxZ: 6 },
  cabin: { minX: -5, maxX: 5, minZ: -5, maxZ: 5 },
  french: { minX: -14, maxX: 34, minZ: -8, maxZ: 8 },
  jamaica: { minX: -80, maxX: 80, minZ: -10, maxZ: 35 },
  opensea: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 },
  versailles: null,
  orangerie: { minX: -40, maxX: 40, minZ: -20, maxZ: 50 },
};

// --- Dynamic custom room support ---

function loadCustomRooms() {
  try {
    const raw = localStorage.getItem(CUSTOM_ROOMS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCustomRooms(rooms) {
  try {
    localStorage.setItem(CUSTOM_ROOMS_KEY, JSON.stringify(rooms));
  } catch { /* storage full or unavailable */ }
}

export function addCustomRoom(id, name, fromRoom) {
  const custom = loadCustomRooms();

  // Create the new room config with a door back to the origin room
  const allConfigs = getAllRoomConfigs();
  const fromName = allConfigs[fromRoom]?.name || fromRoom;

  custom[id] = {
    name,
    subtitle: 'Your Miniverse\u2122',
    isExterior: false,
    doors: [
      { to: fromRoom, label: `Return to ${fromName}`, icon: '\u21a9\ufe0f' },
    ],
  };

  // Add a door from the origin room to the new room (if not already present)
  if (custom[fromRoom]) {
    // Origin is also a custom room
    const alreadyHasDoor = custom[fromRoom].doors.some(d => d.to === id);
    if (!alreadyHasDoor) {
      custom[fromRoom].doors.push({ to: id, label: name, icon: '\ud83d\udeaa' });
    }
  }

  saveCustomRooms(custom);

  // If origin is a hardcoded room, we store the extra door in a separate localStorage key
  if (roomConfigs[fromRoom]) {
    addDoorToHardcodedRoom(fromRoom, { to: id, label: name, icon: '\ud83d\udeaa' });
  }

  return custom[id];
}

// Extra doors appended to hardcoded rooms (stored separately so we don't mutate the source)
const EXTRA_DOORS_KEY = 'miniverse:extra-doors';

function loadExtraDoors() {
  try {
    const raw = localStorage.getItem(EXTRA_DOORS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExtraDoors(data) {
  try {
    localStorage.setItem(EXTRA_DOORS_KEY, JSON.stringify(data));
  } catch { /* */ }
}

function addDoorToHardcodedRoom(roomId, door) {
  const extra = loadExtraDoors();
  if (!extra[roomId]) extra[roomId] = [];
  const alreadyHas = extra[roomId].some(d => d.to === door.to);
  if (!alreadyHas) {
    extra[roomId].push(door);
  }
  saveExtraDoors(extra);
}

export function getAllRoomConfigs() {
  const custom = loadCustomRooms();
  const extra = loadExtraDoors();

  // Start with deep copies of hardcoded configs so we don't mutate originals
  const merged = {};
  for (const [id, cfg] of Object.entries(roomConfigs)) {
    merged[id] = {
      ...cfg,
      doors: [...cfg.doors, ...(extra[id] || [])],
    };
  }

  // Add custom rooms
  for (const [id, cfg] of Object.entries(custom)) {
    merged[id] = { ...cfg };
  }

  return merged;
}
