export interface TimelinePoint {
  year: string;
  date: string;
  title: string;
  description: string;
  eventType: 'military' | 'diplomatic' | 'economic' | 'ideological';
  isTurningPoint?: boolean;
  relevantTheories: string[]; // Which theories find this event significant
  icon: string;
  focusLocation?: [number, number]; // Where map should zoom to
  focusZoom?: number; // Zoom level for this event
  mapData: {
    militaryBases?: { position: [number, number]; name: string; country: string; size: number }[];
    troops?: { position: [number, number]; name: string; strength: number }[];
    movements?: { from: [number, number]; to: [number, number]; type: string; label: string }[];
    influence?: { center: [number, number]; radius: number; country: string }[];
    conflicts?: { position: [number, number]; name: string; intensity: number }[];
    alliances?: { members: string[]; color: string }[];
  };
}

export const coldWarTimeline: TimelinePoint[] = [
  {
    year: '1947',
    date: 'March 1947',
    title: 'Truman Doctrine Announced',
    description: 'Realists argue that the Cold War began when the United States announced the Truman Doctrine in 1947. They saw it as a move to contain Soviet power. The goal was not moral defense of democracy but to stop a rival from expanding its sphere of influence. This policy set the logic of containment that guided U.S. actions for decades.',
    eventType: 'diplomatic',
    isTurningPoint: true,
    relevantTheories: ['classical-realism', 'structural-realism'],
    icon: 'shield',
    focusLocation: [39.0, 22.0], // Greece/Turkey region
    focusZoom: 5,
    mapData: {
      militaryBases: [
        { position: [38.9072, -77.0369], name: 'Pentagon', country: 'USA', size: 10 },
        { position: [55.7558, 37.6173], name: 'Kremlin', country: 'USSR', size: 10 },
      ],
      influence: [
        { center: [38.9072, -77.0369], radius: 2000000, country: 'USA' },
        { center: [55.7558, 37.6173], radius: 1800000, country: 'USSR' },
      ],
    },
  },
  {
    year: '1948',
    date: 'April 1948',
    title: 'Marshall Plan Implemented',
    description: 'As a result, the Marshall Plan in 1948 became the economic arm of containment. The U.S. rebuilt Western Europe to prevent Soviet influence through economic dependence. Realists interpret it as strategic aid to strengthen allies and stabilize the balance of power.',
    eventType: 'economic',
    isTurningPoint: true,
    relevantTheories: ['classical-realism', 'liberalism'],
    icon: 'trending-up',
    focusLocation: [48.8566, 2.3522], // Paris
    focusZoom: 5,
    mapData: {
      militaryBases: [
        { position: [38.9072, -77.0369], name: 'Pentagon', country: 'USA', size: 10 },
        { position: [48.8566, 2.3522], name: 'Paris', country: 'France', size: 8 },
      ],
      influence: [
        { center: [38.9072, -77.0369], radius: 2100000, country: 'USA' },
        { center: [55.7558, 37.6173], radius: 1900000, country: 'USSR' },
      ],
    },
  },
  {
    year: '1949',
    date: 'April 1949',
    title: 'NATO Founded',
    description: 'The success of containment led to the formation of NATO in 1949. The alliance institutionalized collective defense to counter Soviet military strength. Realists viewed it as a clear example of balancing behavior among states facing a common threat.',
    eventType: 'military',
    isTurningPoint: true,
    relevantTheories: ['classical-realism', 'liberalism', 'neoliberalism'],
    icon: 'users',
    focusLocation: [50.0, 10.0], // Western Europe
    focusZoom: 4,
    mapData: {
      militaryBases: [
        { position: [38.9072, -77.0369], name: 'Pentagon', country: 'USA', size: 10 },
        { position: [51.5074, -0.1278], name: 'London HQ', country: 'UK', size: 8 },
        { position: [48.8566, 2.3522], name: 'Paris HQ', country: 'France', size: 8 },
        { position: [52.5200, 13.4050], name: 'Berlin (West)', country: 'West Germany', size: 7 },
        { position: [55.7558, 37.6173], name: 'Moscow', country: 'USSR', size: 10 },
      ],
      movements: [
        { from: [38.9072, -77.0369], to: [51.5074, -0.1278], type: 'alliance', label: 'NATO Alliance' },
        { from: [38.9072, -77.0369], to: [48.8566, 2.3522], type: 'alliance', label: 'NATO Alliance' },
        { from: [51.5074, -0.1278], to: [48.8566, 2.3522], type: 'alliance', label: 'NATO Alliance' },
      ],
      influence: [
        { center: [38.9072, -77.0369], radius: 2200000, country: 'USA' },
        { center: [55.7558, 37.6173], radius: 2000000, country: 'USSR' },
      ],
    },
  },
  {
    year: '1950',
    date: 'June 1950',
    title: 'Korean War Begins',
    description: 'The next escalation came with the Korean War (1950-1953). It tested U.S. willingness to defend its containment policy by force. For realists, this was a limited war to preserve credibility and prevent communist dominance in Asia.',
    eventType: 'military',
    isTurningPoint: true,
    relevantTheories: ['classical-realism', 'structural-realism'],
    icon: 'sword',
    focusLocation: [37.5665, 126.9780], // Seoul
    focusZoom: 6,
    mapData: {
      militaryBases: [
        { position: [37.5665, 126.9780], name: 'Seoul', country: 'South Korea', size: 8 },
        { position: [38.9072, -77.0369], name: 'Pentagon', country: 'USA', size: 10 },
      ],
      conflicts: [
        { position: [38.0, 127.0], name: 'Korean War', intensity: 9 }
      ],
      influence: [
        { center: [38.9072, -77.0369], radius: 2150000, country: 'USA' },
        { center: [55.7558, 37.6173], radius: 2100000, country: 'USSR' },
      ],
    },
  },
  {
    year: '1952',
    date: 'November 1952',
    title: 'First Hydrogen Bomb Test',
    description: 'In response, both sides sought deterrence through weapons. The hydrogen bomb development (1952-1953) created mutual fear and strategic balance. Realists explain this as survival logic under anarchy, where security depends on deterrence.',
    eventType: 'military',
    isTurningPoint: true,
    relevantTheories: ['structural-realism'],
    icon: 'zap',
    focusLocation: [11.55, 162.35], // Eniwetok Atoll
    focusZoom: 5,
    mapData: {
      militaryBases: [
        { position: [38.9072, -77.0369], name: 'Pentagon', country: 'USA', size: 10 },
        { position: [55.7558, 37.6173], name: 'Moscow', country: 'USSR', size: 10 },
      ],
      influence: [
        { center: [38.9072, -77.0369], radius: 2200000, country: 'USA' },
        { center: [55.7558, 37.6173], radius: 2150000, country: 'USSR' },
      ],
    },
  },
  {
    year: '1955',
    date: 'May 1955',
    title: 'Warsaw Pact Established',
    description: 'To counter NATO, the Soviet Union established the Warsaw Pact in 1955. This formalized the division of Europe into two armed camps. Realists saw it as the mirror image of NATO, reinforcing the bipolar balance.',
    eventType: 'military',
    isTurningPoint: false,
    relevantTheories: ['classical-realism', 'structural-realism'],
    icon: 'shield',
    focusLocation: [52.2297, 21.0122], // Warsaw, Poland
    focusZoom: 5,
    mapData: {
      militaryBases: [
        { position: [38.9072, -77.0369], name: 'Pentagon', country: 'USA', size: 10 },
        { position: [51.5074, -0.1278], name: 'London', country: 'UK', size: 8 },
        { position: [48.8566, 2.3522], name: 'Paris', country: 'France', size: 8 },
        { position: [55.7558, 37.6173], name: 'Moscow', country: 'USSR', size: 10 },
        { position: [52.2297, 21.0122], name: 'Warsaw', country: 'Poland', size: 7 },
        { position: [50.0755, 14.4378], name: 'Prague', country: 'Czechoslovakia', size: 6 },
        { position: [47.4979, 19.0402], name: 'Budapest', country: 'Hungary', size: 6 },
      ],
      movements: [
        { from: [55.7558, 37.6173], to: [52.2297, 21.0122], type: 'alliance', label: 'Warsaw Pact' },
        { from: [55.7558, 37.6173], to: [50.0755, 14.4378], type: 'alliance', label: 'Warsaw Pact' },
        { from: [55.7558, 37.6173], to: [47.4979, 19.0402], type: 'alliance', label: 'Warsaw Pact' },
      ],
      influence: [
        { center: [38.9072, -77.0369], radius: 2300000, country: 'USA' },
        { center: [55.7558, 37.6173], radius: 2300000, country: 'USSR' },
      ],
    },
  },
  {
    year: '1956',
    date: 'October 1956',
    title: 'Suez Crisis',
    description: 'Power politics soon extended beyond Europe. The Suez Crisis of 1956 revealed U.S. dominance over Britain and France and Soviet influence in the Middle East. Realists saw it as a shift in hierarchy within the Western bloc, proving the U.S. as the new global leader.',
    eventType: 'diplomatic',
    isTurningPoint: true,
    relevantTheories: ['classical-realism'],
    icon: 'globe',
    focusLocation: [30.0444, 31.2357], // Cairo/Suez
    focusZoom: 6,
    mapData: {
      militaryBases: [
        { position: [30.0444, 31.2357], name: 'Suez Canal Zone', country: 'Egypt', size: 8 },
      ],
      conflicts: [
        { position: [30.0444, 31.2357], name: 'Suez Crisis', intensity: 8 }
      ],
    },
  },
  {
    year: '1957',
    date: 'October 1957',
    title: 'Sputnik Launched',
    description: 'The launch of Sputnik in 1957 demonstrated Soviet technological and strategic reach. Realists viewed space competition as a new domain for power projection and psychological warfare. It intensified the arms race.',
    eventType: 'military',
    isTurningPoint: true,
    relevantTheories: ['structural-realism'],
    icon: 'zap',
    focusLocation: [45.9200, 63.3400], // Baikonur
    focusZoom: 5,
    mapData: {
      militaryBases: [
        { position: [45.9200, 63.3400], name: 'Baikonur Cosmodrome', country: 'USSR', size: 9 },
      ],
    },
  },
  {
    year: '1962',
    date: 'October 1962',
    title: 'Cuban Missile Crisis',
    description: 'The Cuban Missile Crisis in 1962 marked the peak of confrontation. Realists saw it as a near-war that proved deterrence works when both sides act rationally. Each preserved survival through calculated restraint.',
    eventType: 'military',
    isTurningPoint: true,
    relevantTheories: ['structural-realism', 'english-school'],
    icon: 'zap',
    focusLocation: [23.1136, -82.3666], // Cuba
    focusZoom: 6,
    mapData: {
      militaryBases: [
        { position: [38.9072, -77.0369], name: 'Pentagon', country: 'USA', size: 10 },
        { position: [25.7617, -80.1918], name: 'Homestead AFB', country: 'USA', size: 9 },
        { position: [23.1136, -82.3666], name: 'Soviet Missile Sites', country: 'USSR', size: 8 },
        { position: [55.7558, 37.6173], name: 'Moscow', country: 'USSR', size: 10 },
      ],
      movements: [
        { from: [55.7558, 37.6173], to: [23.1136, -82.3666], type: 'military', label: 'Soviet Missiles' },
        { from: [38.9072, -77.0369], to: [23.1136, -82.3666], type: 'blockade', label: 'US Naval Blockade' },
      ],
      conflicts: [
        { position: [23.1136, -82.3666], name: 'Cuban Missile Crisis', intensity: 10 },
      ],
      influence: [
        { center: [38.9072, -77.0369], radius: 2400000, country: 'USA' },
        { center: [55.7558, 37.6173], radius: 2400000, country: 'USSR' },
      ],
    },
  },
  {
    year: '1975',
    date: 'April 1975',
    title: 'Fall of Saigon',
    description: 'Vietnam War ends. Communist victory in Southeast Asia expands Soviet influence.',
    eventType: 'military',
    isTurningPoint: false,
    relevantTheories: ['classical-realism', 'constructivism'],
    icon: 'flag',
    focusLocation: [10.8231, 106.6297], // Saigon/Ho Chi Minh City
    focusZoom: 6,
    mapData: {
      militaryBases: [
        { position: [38.9072, -77.0369], name: 'Pentagon', country: 'USA', size: 10 },
        { position: [55.7558, 37.6173], name: 'Moscow', country: 'USSR', size: 10 },
        { position: [10.8231, 106.6297], name: 'Saigon (Ho Chi Minh)', country: 'Vietnam', size: 7 },
      ],
      conflicts: [
        { position: [10.8231, 106.6297], name: 'Vietnam War Ends', intensity: 8 },
      ],
      movements: [
        { from: [55.7558, 37.6173], to: [10.8231, 106.6297], type: 'support', label: 'Soviet Support' },
      ],
      influence: [
        { center: [38.9072, -77.0369], radius: 2200000, country: 'USA' },
        { center: [55.7558, 37.6173], radius: 2600000, country: 'USSR' },
      ],
    },
  },
  {
    year: '1979',
    date: 'December 1979',
    title: 'Soviet Invasion of Afghanistan',
    description: 'USSR invades Afghanistan. US provides support to Mujahideen fighters.',
    eventType: 'military',
    isTurningPoint: false,
    relevantTheories: ['classical-realism', 'structural-realism'],
    icon: 'sword',
    focusLocation: [34.5553, 69.2075], // Kabul, Afghanistan
    focusZoom: 6,
    mapData: {
      militaryBases: [
        { position: [38.9072, -77.0369], name: 'Pentagon', country: 'USA', size: 10 },
        { position: [55.7558, 37.6173], name: 'Moscow', country: 'USSR', size: 10 },
        { position: [34.5553, 69.2075], name: 'Kabul', country: 'Afghanistan', size: 8 },
      ],
      troops: [
        { position: [34.5553, 69.2075], name: 'Soviet Forces', strength: 100000 },
      ],
      conflicts: [
        { position: [34.5553, 69.2075], name: 'Soviet-Afghan War', intensity: 9 },
      ],
      movements: [
        { from: [55.7558, 37.6173], to: [34.5553, 69.2075], type: 'invasion', label: 'Soviet Invasion' },
        { from: [38.9072, -77.0369], to: [34.5553, 69.2075], type: 'support', label: 'US Support to Mujahideen' },
      ],
      influence: [
        { center: [38.9072, -77.0369], radius: 2300000, country: 'USA' },
        { center: [55.7558, 37.6173], radius: 2700000, country: 'USSR' },
      ],
    },
  },
  {
    year: '1985',
    date: 'March 1985',
    title: 'Gorbachev Comes to Power',
    description: 'Mikhail Gorbachev becomes Soviet leader. Begins Glasnost and Perestroika reforms.',
    eventType: 'ideological',
    isTurningPoint: true,
    relevantTheories: ['constructivism', 'liberalism'],
    icon: 'lightbulb',
    focusLocation: [55.7558, 37.6173], // Moscow
    focusZoom: 6,
    mapData: {
      militaryBases: [
        { position: [38.9072, -77.0369], name: 'Pentagon', country: 'USA', size: 10 },
        { position: [55.7558, 37.6173], name: 'Moscow (Reforming)', country: 'USSR', size: 10 },
      ],
      movements: [
        { from: [55.7558, 37.6173], to: [38.9072, -77.0369], type: 'diplomacy', label: 'New Thinking' },
      ],
      influence: [
        { center: [38.9072, -77.0369], radius: 2400000, country: 'USA' },
        { center: [55.7558, 37.6173], radius: 2500000, country: 'USSR' },
      ],
    },
  },
  {
    year: '1972',
    date: 'February 1972',
    title: 'Nixon Visits China',
    description: 'This division enabled the U.S.-China rapprochement in 1972. Nixon used the Sino-Soviet split to balance against the USSR. Realists consider it a successful strategic move that reshaped the global power structure.',
    eventType: 'diplomatic',
    isTurningPoint: true,
    relevantTheories: ['classical-realism', 'structural-realism'],
    icon: 'users',
    focusLocation: [39.9042, 116.4074], // Beijing
    focusZoom: 5,
    mapData: {
      militaryBases: [
        { position: [39.9042, 116.4074], name: 'Beijing', country: 'China', size: 9 },
      ],
      movements: [
        { from: [38.9072, -77.0369], to: [39.9042, 116.4074], type: 'diplomacy', label: 'US-China Rapprochement' },
      ],
    },
  },
  {
    year: '1989',
    date: 'November 1989',
    title: 'Fall of Berlin Wall',
    description: 'The fall of the Berlin Wall in 1989 showed Soviet loss of control over Eastern Europe. Realists interpreted it as the outcome of economic and military decline, not a triumph of liberal ideas.',
    eventType: 'ideological',
    isTurningPoint: true,
    relevantTheories: ['constructivism', 'liberalism', 'english-school'],
    icon: 'wall',
    focusLocation: [52.5200, 13.4050], // Berlin
    focusZoom: 7,
    mapData: {
      militaryBases: [
        { position: [38.9072, -77.0369], name: 'Pentagon', country: 'USA', size: 10 },
        { position: [52.5200, 13.4050], name: 'Berlin (Reunifying)', country: 'Germany', size: 9 },
        { position: [55.7558, 37.6173], name: 'Moscow', country: 'USSR', size: 9 },
      ],
      conflicts: [
        { position: [52.5200, 13.4050], name: 'Peaceful Revolution', intensity: 3 },
      ],
      influence: [
        { center: [38.9072, -77.0369], radius: 2600000, country: 'USA' },
        { center: [55.7558, 37.6173], radius: 2000000, country: 'USSR' },
      ],
    },
  },
  {
    year: '1991',
    date: 'December 1991',
    title: 'Soviet Union Dissolves',
    description: 'By 1991, the Soviet Union dissolved. Realists saw the end of bipolarity as a consequence of overextension and power imbalance. The United States remained dominant because it sustained its economic and military capacity. From a realist view, the Cold War was a continuous chain of actions driven by security, competition, and balance of power. Each event shaped the next through shifts in military strength, alliances, and national interest.',
    eventType: 'ideological',
    isTurningPoint: true,
    relevantTheories: ['constructivism', 'structural-realism', 'liberalism'],
    icon: 'alert-circle',
    focusLocation: [55.7558, 37.6173], // Moscow
    focusZoom: 5,
    mapData: {
      militaryBases: [
        { position: [38.9072, -77.0369], name: 'Pentagon', country: 'USA', size: 10 },
        { position: [55.7558, 37.6173], name: 'Moscow (Russia)', country: 'Russia', size: 7 },
      ],
      influence: [
        { center: [38.9072, -77.0369], radius: 3000000, country: 'USA' },
        { center: [55.7558, 37.6173], radius: 1500000, country: 'Russia' },
      ],
    },
  },
];

export const wwiTimeline: TimelinePoint[] = [
  {
    year: '1914',
    date: 'June 28, 1914',
    title: 'Assassination of Archduke Franz Ferdinand',
    description: 'Austrian Archduke assassinated in Sarajevo by Serbian nationalist.',
    eventType: 'military',
    isTurningPoint: true,
    relevantTheories: ['classical-realism'],
    icon: 'alert-circle',
    mapData: {
      conflicts: [
        { position: [43.8564, 18.4131], name: 'Assassination Site', intensity: 10 },
      ],
      militaryBases: [
        { position: [48.2082, 16.3738], name: 'Vienna', country: 'Austria-Hungary', size: 9 },
        { position: [44.7866, 20.4489], name: 'Belgrade', country: 'Serbia', size: 6 },
      ],
    },
  },
  {
    year: '1914',
    date: 'July 28, 1914',
    title: 'Austria-Hungary Declares War on Serbia',
    description: 'First declaration of war. Alliance system begins to activate.',
    eventType: 'military',
    isTurningPoint: false,
    relevantTheories: ['classical-realism', 'structural-realism'],
    icon: 'sword',
    mapData: {
      militaryBases: [
        { position: [48.2082, 16.3738], name: 'Vienna', country: 'Austria-Hungary', size: 9 },
        { position: [44.7866, 20.4489], name: 'Belgrade', country: 'Serbia', size: 6 },
        { position: [55.7558, 37.6173], name: 'St. Petersburg', country: 'Russia', size: 10 },
      ],
      movements: [
        { from: [48.2082, 16.3738], to: [44.7866, 20.4489], type: 'invasion', label: 'War Declaration' },
      ],
      conflicts: [
        { position: [44.7866, 20.4489], name: 'Serbian Front', intensity: 7 },
      ],
    },
  },
  {
    year: '1914',
    date: 'August 1-4, 1914',
    title: 'Mobilization Cascades Across Europe',
    description: 'Germany, Russia, France, and Britain enter the war through alliance commitments.',
    eventType: 'military',
    isTurningPoint: true,
    relevantTheories: ['classical-realism', 'structural-realism'],
    icon: 'users',
    mapData: {
      militaryBases: [
        { position: [52.5200, 13.4050], name: 'Berlin', country: 'Germany', size: 10 },
        { position: [48.8566, 2.3522], name: 'Paris', country: 'France', size: 10 },
        { position: [51.5074, -0.1278], name: 'London', country: 'Britain', size: 10 },
        { position: [55.7558, 37.6173], name: 'St. Petersburg', country: 'Russia', size: 10 },
        { position: [48.2082, 16.3738], name: 'Vienna', country: 'Austria-Hungary', size: 9 },
      ],
      movements: [
        { from: [52.5200, 13.4050], to: [55.7558, 37.6173], type: 'war', label: 'Germany vs Russia' },
        { from: [52.5200, 13.4050], to: [48.8566, 2.3522], type: 'invasion', label: 'Schlieffen Plan' },
        { from: [51.5074, -0.1278], to: [52.5200, 13.4050], type: 'war', label: 'Britain vs Germany' },
      ],
      troops: [
        { position: [50.8503, 4.3517], name: 'German Forces', strength: 1500000 },
        { position: [49.4432, 1.0993], name: 'French Forces', strength: 1300000 },
      ],
      conflicts: [
        { position: [50.8503, 4.3517], name: 'Battle of Belgium', intensity: 9 },
      ],
    },
  },
  {
    year: '1914',
    date: 'September 1914',
    title: 'Battle of the Marne',
    description: 'German advance stopped at Paris. Trench warfare begins.',
    eventType: 'military',
    isTurningPoint: true,
    relevantTheories: ['classical-realism'],
    icon: 'sword',
    mapData: {
      militaryBases: [
        { position: [48.8566, 2.3522], name: 'Paris (Saved)', country: 'France', size: 10 },
        { position: [52.5200, 13.4050], name: 'Berlin', country: 'Germany', size: 10 },
      ],
      troops: [
        { position: [48.9597, 3.3419], name: 'Allied Forces', strength: 1082000 },
        { position: [49.0369, 3.7589], name: 'German Forces', strength: 1485000 },
      ],
      conflicts: [
        { position: [48.9597, 3.3419], name: 'Battle of the Marne', intensity: 10 },
      ],
      movements: [
        { from: [52.5200, 13.4050], to: [48.9597, 3.3419], type: 'offensive', label: 'German Offensive Halted' },
      ],
    },
  },
];

export const unFormationTimeline: TimelinePoint[] = [
  {
    year: '1945',
    date: 'June 26, 1945',
    title: 'UN Charter Signed',
    description: '50 nations sign the UN Charter in San Francisco, establishing the United Nations.',
    eventType: 'diplomatic',
    isTurningPoint: true,
    relevantTheories: ['liberalism', 'neoliberalism', 'english-school'],
    icon: 'users',
    mapData: {
      militaryBases: [],
    },
  },
  {
    year: '1945',
    date: 'October 24, 1945',
    title: 'UN Officially Established',
    description: 'United Nations officially comes into existence with 51 founding members.',
    eventType: 'diplomatic',
    isTurningPoint: true,
    relevantTheories: ['liberalism', 'neoliberalism', 'english-school'],
    icon: 'shield',
    mapData: {
      militaryBases: [],
    },
  },
  {
    year: '1948',
    date: 'December 10, 1948',
    title: 'Universal Declaration of Human Rights',
    description: 'UN General Assembly adopts UDHR, establishing international human rights norms.',
    eventType: 'ideological',
    isTurningPoint: true,
    relevantTheories: ['liberalism', 'constructivism', 'english-school'],
    icon: 'lightbulb',
    mapData: {
      militaryBases: [],
    },
  },
  {
    year: '1950',
    date: 'June 25, 1950',
    title: 'Korean War - First UN Military Action',
    description: 'UN authorizes military intervention in Korea. First major collective security action.',
    eventType: 'military',
    isTurningPoint: true,
    relevantTheories: ['neoliberalism', 'english-school'],
    icon: 'shield',
    mapData: {
      militaryBases: [],
    },
  },
];

