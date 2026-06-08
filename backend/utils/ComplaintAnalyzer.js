// Rule-based NLP complaint analyzer
// Matches keywords to categories, suggests parts and priority

const categories = [
  {
    id:       'filter',
    name:     'Filter Issue',
    icon:     '🔵',
    keywords: [
      'filter', 'membrane', 'pressure', 'low pressure', 'slow water',
      'less water', 'water slow', 'ro filter', 'taste', 'smell',
      'bad taste', 'water smell', 'dirty water', 'color', 'yellow water',
      'brown water', 'black water', 'sediment', 'particles',
      'pani kam', 'pani slow', 'pressure kam',
    ],
    parts:    ['Filter membrane', 'Carbon filter', 'Sediment filter', 'Post carbon filter'],
    cost:     { min: 300, max: 1500 },
    priority: 'Medium',
    advice:   'Check and replace filter cartridges. Clean housing unit.',
  },
  {
    id:       'pump',
    name:     'Motor / Pump Issue',
    icon:     '⚙️',
    keywords: [
      'motor', 'pump', 'noise', 'sound', 'vibration', 'not working',
      'motor noise', 'pump noise', 'loud', 'humming', 'buzzing',
      'motor jam', 'pump fail', 'no water', 'not starting',
      'band ho gaya', 'nahi chal raha', 'awaaz', 'motor nahi',
    ],
    parts:    ['Water pump', 'Motor winding', 'Pump impeller', 'Capacitor'],
    cost:     { min: 800, max: 4000 },
    priority: 'High',
    advice:   'Inspect motor winding, check capacitor, clean pump impeller.',
  },
  {
    id:       'leakage',
    name:     'Leakage / Pipe Issue',
    icon:     '💧',
    keywords: [
      'leak', 'leakage', 'drip', 'dripping', 'pipe', 'fitting',
      'water drip', 'water leak', 'connection', 'joint', 'crack',
      'overflow', 'seepage', 'wet', 'water coming', 'paani aa raha',
      'tapak', 'tapakna', 'leak ho raha',
    ],
    parts:    ['Pipe fitting', 'O-ring', 'Connector', 'Elbow joint', 'Ball valve'],
    cost:     { min: 200, max: 1000 },
    priority: 'High',
    advice:   'Locate leak source, replace fittings or O-rings, check all connections.',
  },
  {
    id:       'electrical',
    name:     'Electrical Issue',
    icon:     '⚡',
    keywords: [
      'electric', 'power', 'switch', 'circuit', 'short', 'trip',
      'not on', 'no power', 'fuse', 'wire', 'current', 'shock',
      'sparking', 'indicator', 'light', 'display', 'pcb', 'board',
      'bijli', 'current nahi', 'band ho gaya', 'on nahi ho raha',
    ],
    parts:    ['SMPS/Adaptor', 'PCB board', 'Switch', 'Solenoid valve', 'Fuse'],
    cost:     { min: 500, max: 3000 },
    priority: 'High',
    advice:   'Check power supply, inspect PCB, test solenoid valve.',
  },
  {
    id:       'tank',
    name:     'Tank / Storage Issue',
    icon:     '🪣',
    keywords: [
      'tank', 'storage', 'full', 'overflow tank', 'not filling',
      'float', 'ball valve', 'tank full', 'not fill', 'empty',
      'tank problem', 'level', 'indicator',
    ],
    parts:    ['Float valve', 'Ball valve', 'Tank connector', 'Level indicator'],
    cost:     { min: 300, max: 1500 },
    priority: 'Medium',
    advice:   'Check float valve mechanism, inspect ball valve, test level sensor.',
  },
  {
    id:       'uv',
    name:     'UV / Purification Issue',
    icon:     '☢️',
    keywords: [
      'uv', 'ultraviolet', 'purification', 'bacteria', 'virus',
      'contamination', 'uv lamp', 'lamp', 'bulb', 'purify',
      'safe', 'pure', 'germs',
    ],
    parts:    ['UV lamp', 'UV chamber', 'Quartz sleeve'],
    cost:     { min: 400, max: 2000 },
    priority: 'High',
    advice:   'Replace UV lamp if older than 12 months. Clean quartz sleeve.',
  },
  {
    id:       'cooler',
    name:     'Cooling Issue',
    icon:     '❄️',
    keywords: [
      'cool', 'cooling', 'cold', 'not cold', 'hot water', 'warm',
      'compressor', 'refrigerant', 'chiller', 'thermostat',
      'thanda nahi', 'garam pani', 'cooling nahi',
    ],
    parts:    ['Compressor', 'Thermostat', 'Refrigerant gas', 'Cooling coil'],
    cost:     { min: 1000, max: 6000 },
    priority: 'Medium',
    advice:   'Check compressor operation, inspect thermostat, check refrigerant level.',
  },
  {
    id:       'maintenance',
    name:     'Routine Maintenance',
    icon:     '🔧',
    keywords: [
      'service', 'maintenance', 'cleaning', 'annual', 'regular',
      'routine', 'check', 'servicing', 'general', 'overall',
      'service karna', 'saaf karna',
    ],
    parts:    ['Filter set', 'Cleaning chemicals', 'Lubricant'],
    cost:     { min: 500, max: 2000 },
    priority: 'Low',
    advice:   'Full system check, replace filters, clean all components.',
  },
];

function analyzeComplaint(complaint) {
  if (!complaint || complaint.trim().length === 0) {
    return null;
  }

  const text = complaint.toLowerCase().trim();

  // Score each category
  const scores = categories.map(cat => {
    let score = 0;
    cat.keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        // Longer keyword match = higher confidence
        score += keyword.split(' ').length;
      }
    });
    return { ...cat, score };
  });

  // Sort by score
  scores.sort((a, b) => b.score - a.score);

  // Best match
  const best = scores[0];

  // Low confidence — return unknown
  if (best.score === 0) {
    return {
      category: 'General Issue',
      icon:     '🔩',
      parts:    ['Inspect required'],
      cost:     { min: 200, max: 2000 },
      priority: 'Medium',
      advice:   'Physical inspection needed to diagnose the issue.',
      confidence: 'Low',
      allMatches: [],
    };
  }

  // Confidence level
  const confidence = best.score >= 3 ? 'High' : best.score >= 2 ? 'Medium' : 'Low';

  // Secondary matches
  const allMatches = scores
    .filter(s => s.score > 0 && s.id !== best.id)
    .slice(0, 2)
    .map(s => s.name);

  return {
    category:   best.name,
    icon:       best.icon,
    parts:      best.parts,
    cost:       best.cost,
    priority:   best.priority,
    advice:     best.advice,
    confidence,
    allMatches,
  };
}

module.exports = { analyzeComplaint };
