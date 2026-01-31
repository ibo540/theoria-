// Comprehensive map overlay data for each theory perspective

export interface CountryData {
  name: string;
  position: [number, number];
  perspectives: {
    realism?: string;
    liberalism?: string;
    neoliberalism?: string;
    constructivism?: string;
    neorealism?: string;
    englishSchool?: string;
  };
}

export interface AllianceBorder {
  name: string;
  members: [number, number][];
  color: string;
  tooltip: string;
}

export interface Institution {
  name: string;
  location: [number, number];
  founded: string;
  members: number;
  icon: string;
}

export interface TradeRoute {
  from: [number, number];
  to: [number, number];
  volume: number; // 1-10 for thickness
  tooltip: string;
}

export interface IdeologicalZone {
  name: string;
  countries: [number, number][];
  color: string;
  ideology: string;
}

export interface MilitaryAsset {
  type: 'base' | 'nuclear-site' | 'naval-base' | 'airbase';
  position: [number, number];
  name: string;
  country: string;
  tooltip: string;
}

// Cold War Map Data
export const coldWarMapData = {
  // REALISM VIEW - Military and Security Focus
  realism: {
    militaryBases: [
      { type: 'base', position: [38.8719, -77.0563], name: 'Pentagon', country: 'USA', tooltip: 'US Military Command Center - Global power projection hub' },
      { type: 'base', position: [55.7558, 37.6173], name: 'Kremlin/GRU', country: 'USSR', tooltip: 'Soviet Command - Counter to US power' },
      { type: 'airbase', position: [52.4667, 13.3], name: 'Tempelhof AFB', country: 'USA', tooltip: 'Key US airbase in West Berlin during blockade' },
      { type: 'naval-base', position: [23.1136, -82.3666], name: 'Guantanamo Bay', country: 'USA', tooltip: 'US Naval Base - Power projection in Caribbean' },
      { type: 'naval-base', position: [33.9716, 35.6256], name: 'Tartus', country: 'USSR', tooltip: 'Soviet Mediterranean Naval Base' },
      { type: 'nuclear-site', position: [37.2166, -80.0133], name: 'Radford Arsenal', country: 'USA', tooltip: 'Nuclear weapons production facility' },
      { type: 'nuclear-site', position: [55.4167, 65.3333], name: 'Chelyabinsk-40', country: 'USSR', tooltip: 'Secret Soviet plutonium production' },
    ] as MilitaryAsset[],
    
    allianceBorders: [
      {
        name: 'NATO (1949)',
        members: [
          [38.9072, -77.0369], [51.5074, -0.1278], [48.8566, 2.3522], 
          [52.5200, 13.4050], [41.9028, 12.4964], [50.8503, 4.3517]
        ],
        color: '#2563EB',
        tooltip: 'North Atlantic Treaty Organization - Western defensive alliance. Collective defense under Article 5.'
      },
      {
        name: 'Warsaw Pact (1955)',
        members: [
          [55.7558, 37.6173], [52.2297, 21.0122], [50.0755, 14.4378],
          [47.4979, 19.0402], [42.6977, 23.3219], [44.4268, 26.1025]
        ],
        color: '#DC2626',
        tooltip: 'Warsaw Pact - Soviet-led Eastern bloc military alliance in response to NATO.'
      }
    ] as AllianceBorder[],
    
    spheresOfInfluence: [
      { center: [38.9072, -77.0369], radius: 3000000, color: '#2563EB', label: 'US Sphere' },
      { center: [55.7558, 37.6173], radius: 3000000, color: '#DC2626', label: 'Soviet Sphere' },
    ],
    
    attackVectors: [
      { from: [55.7558, 37.6173], to: [48.8566, 2.3522], tooltip: 'Potential Soviet invasion route to Western Europe', color: '#DC2626' },
      { from: [38.9072, -77.0369], to: [55.7558, 37.6173], tooltip: 'Strategic bomber routes and ICBM trajectories', color: '#2563EB' },
    ]
  },

  // LIBERALISM VIEW - Institutions and Cooperation
  liberalism: {
    institutions: [
      { name: 'United Nations HQ', location: [40.7489, -73.9680], founded: '1945', members: 193, icon: '🏛️' },
      { name: 'World Bank', location: [38.8993, -77.0420], founded: '1944', members: 189, icon: '🏦' },
      { name: 'IMF', location: [38.8993, -77.0420], founded: '1945', members: 190, icon: '💰' },
      { name: 'Council of Europe', location: [48.5967, 7.7717], founded: '1949', members: 47, icon: '⚖️' },
      { name: 'OECD', location: [48.8606, 2.3376], founded: '1961', members: 38, icon: '📊' },
    ] as Institution[],
    
    tradeRoutes: [
      { from: [38.9072, -77.0369], to: [51.5074, -0.1278], volume: 9, tooltip: 'US-UK Trade: $50B annually. Strong economic interdependence.' },
      { from: [38.9072, -77.0369], to: [48.8566, 2.3522], volume: 8, tooltip: 'US-France Trade: Deep economic ties through Marshall Plan.' },
      { from: [51.5074, -0.1278], to: [48.8566, 2.3522], volume: 10, tooltip: 'UK-France: Founding EEC members, high trade volume.' },
      { from: [48.8566, 2.3522], to: [52.5200, 13.4050], volume: 9, tooltip: 'France-Germany: Economic reconciliation through ECSC.' },
      { from: [35.6762, 139.6503], to: [38.9072, -77.0369], volume: 10, tooltip: 'Japan-US: Post-war trade partnership, mutual benefit.' },
    ] as TradeRoute[],
    
    democraticCountries: [
      [38.9072, -77.0369], [51.5074, -0.1278], [48.8566, 2.3522],
      [52.5200, 13.4050], [35.6762, 139.6503], [41.9028, 12.4964]
    ],
  },

  // NEOLIBERALISM VIEW - Regimes and Treaties
  neoliberalism: {
    treaties: [
      { name: 'NPT (1968)', location: [40.7489, -73.9680], tooltip: 'Nuclear Non-Proliferation Treaty - Regime reducing nuclear uncertainty', signatories: 191 },
      { name: 'SALT I (1972)', location: [59.9343, 30.3351], tooltip: 'Strategic Arms Limitation - Bilateral regime limiting arms race', signatories: 2 },
      { name: 'Helsinki Accords (1975)', location: [60.1699, 24.9384], tooltip: 'CSCE - Cooperation on security, economics, human rights', signatories: 35 },
      { name: 'GATT (1947)', location: [46.2044, 6.1432], tooltip: 'General Agreement on Tariffs and Trade - Trade regime', signatories: 128 },
      { name: 'Partial Test Ban (1963)', location: [55.7558, 37.6173], tooltip: 'Limited nuclear testing - Norm against atmospheric tests', signatories: 126 },
    ],
    
    regimes: [
      { type: 'Security', count: 12, effectiveness: 75 },
      { type: 'Trade', count: 23, effectiveness: 88 },
      { type: 'Human Rights', count: 18, effectiveness: 62 },
      { type: 'Environmental', count: 8, effectiveness: 55 },
    ],
    
    cooperationZones: [
      { center: [50.8503, 4.3517], radius: 1200000, color: '#3B82F6', label: 'European Cooperation Zone (EEC)' },
      { center: [38.9072, -77.0369], radius: 2500000, color: '#60A5FA', label: 'Western Hemisphere Cooperation' },
    ]
  },

  // CONSTRUCTIVISM VIEW - Identity and Ideology
  constructivism: {
    ideologicalZones: [
      {
        name: 'Capitalist/Democratic Bloc',
        countries: [[38.9072, -77.0369], [51.5074, -0.1278], [48.8566, 2.3522], [52.5200, 13.4050]],
        color: '#3B82F6',
        ideology: 'Liberal Democracy & Capitalism'
      },
      {
        name: 'Communist Bloc',
        countries: [[55.7558, 37.6173], [52.2297, 21.0122], [50.0755, 14.4378], [39.9042, 116.4074]],
        color: '#DC2626',
        ideology: 'Marxist-Leninist'
      },
      {
        name: 'Non-Aligned Movement',
        countries: [[28.6139, 77.2090], [6.5244, 3.3792], [-1.2921, 36.8219], [-22.9068, -43.1729]],
        color: '#F59E0B',
        ideology: 'Third Way / Non-Aligned'
      }
    ] as IdeologicalZone[],
    
    normDiffusion: [
      { from: [38.9072, -77.0369], to: [35.6762, 139.6503], tooltip: 'Democracy promotion: US influences Japanese post-war constitution', type: 'democracy' },
      { from: [55.7558, 37.6173], to: [39.9042, 116.4074], tooltip: 'Communist ideology: Soviet model exported to China', type: 'ideology' },
      { from: [40.7489, -73.9680], to: [28.6139, 77.2090], tooltip: 'Human rights norms: UN Declaration spreads through decolonization', type: 'norms' },
    ],
    
    identityShifts: [
      { location: [55.7558, 37.6173], year: '1985-1991', shift: 'Revolutionary → Normal State', intensity: 10 },
      { location: [52.5200, 13.4050], year: '1990', shift: 'Divided → Unified German Identity', intensity: 9 },
    ]
  },

  // NEOREALISM VIEW - System Structure
  neorealism: {
    polarityStructure: {
      type: 'Bipolar',
      poles: [
        { position: [38.9072, -77.0369], power: 95, label: 'US Superpower' },
        { position: [55.7558, 37.6173], power: 92, label: 'Soviet Superpower' },
      ],
      bufferStates: [
        { position: [59.3293, 18.0686], name: 'Sweden', tooltip: 'Neutral buffer - Balances between blocs' },
        { position: [47.5162, 14.5501], name: 'Austria', tooltip: 'Permanently neutral - System stability role' },
        { position: [46.9480, 7.4474], name: 'Switzerland', tooltip: 'Neutral state - Diplomatic bridge' },
      ],
      regionalSubsystems: [
        { center: [50.0, 10.0], radius: 1500000, label: 'European Theater', tension: 9 },
        { center: [35.0, 105.0], radius: 2000000, label: 'Asian Theater', tension: 7 },
      ]
    },
    
    balanceIndicators: [
      { type: 'Nuclear Parity', year: '1970', balanced: true },
      { type: 'Conventional Forces', year: '1980', balanced: false, advantage: 'USSR' },
      { type: 'Economic Power', year: '1985', balanced: false, advantage: 'USA' },
    ]
  },

  // ENGLISH SCHOOL VIEW - International Society
  englishSchool: {
    internationalSocietyMembers: [
      [38.9072, -77.0369], [55.7558, 37.6173], [51.5074, -0.1278], 
      [48.8566, 2.3522], [39.9042, 116.4074]
    ],
    
    legalCommitments: [
      { treaty: 'UN Charter (1945)', signatories: [[38.9072, -77.0369], [55.7558, 37.6173], [51.5074, -0.1278]], tooltip: 'Foundational commitment to international order' },
      { treaty: 'Geneva Conventions', signatories: 'all', tooltip: 'Laws of war - Even enemies respect these norms' },
      { treaty: 'Vienna Convention', signatories: 'all', tooltip: 'Diplomatic relations - Rules of international society' },
    ],
    
    diplomaticChannels: [
      { from: [38.9072, -77.0369], to: [55.7558, 37.6173], type: 'hotline', tooltip: 'Moscow-Washington Hotline (1963) - Crisis communication' },
      { from: [38.9072, -77.0369], to: [51.5074, -0.1278], type: 'special-relationship', tooltip: 'UK-US Special Relationship - Deep diplomatic ties' },
    ],
    
    sharedNorms: [
      'Nuclear weapons taboo - Never used since 1945',
      'Diplomatic immunity - Always respected',
      'Sovereignty principle - Recognized by all',
      'Great power responsibility - Managed crises together',
    ]
  },

  // Country-specific data with theory perspectives
  countries: [
    {
      name: 'United States',
      position: [38.9072, -77.0369],
      perspectives: {
        realism: 'Superpower pursuing global hegemony. Power maximizer using military alliances (NATO) and nuclear deterrence.',
        liberalism: 'Leader of liberal international order. Promotes democracy, free trade, and international institutions.',
        neoliberalism: 'Hegemon providing public goods (security, institutions). Uses regimes to manage cooperation.',
        constructivism: 'Identity as "leader of free world" shapes behavior. Spreads democratic norms and values.',
        neorealism: 'Pole in bipolar system. Behavior determined by structure - must balance Soviet power.',
        englishSchool: 'Great power with special responsibility for maintaining international order and norms.'
      }
    },
    {
      name: 'Soviet Union',
      position: [55.7558, 37.6173],
      perspectives: {
        realism: 'Rival superpower competing for global influence. Seeks security through buffer states and military power.',
        liberalism: 'Authoritarian regime limiting cooperation. Lack of democracy prevents deeper engagement with West.',
        neoliberalism: 'Participates in arms control regimes when it serves interests. Uses institutions strategically.',
        constructivism: 'Revolutionary identity drives expansionist behavior. 1985+ identity shift (Gorbachev) ends Cold War.',
        neorealism: 'Second pole in bipolar system. Must compete with US due to anarchic structure, not ideology.',
        englishSchool: 'Great power recognizing limits. Shares norms with West (diplomacy, nuclear taboo) despite rivalry.'
      }
    },
    {
      name: 'West Germany',
      position: [52.5200, 13.4050],
      perspectives: {
        realism: 'Frontline state in US sphere. Hosts NATO troops as buffer against Soviet power.',
        liberalism: 'Democratic state deeply integrated in Western institutions (NATO, EEC). Benefits from trade.',
        neoliberalism: 'Embedded in multiple regimes. Uses institutions to overcome WWII legacy and rebuild.',
        constructivism: 'New democratic identity. Transformation from Nazi state to peaceful democracy.',
        neorealism: 'Bandwagons with stronger power (US) for security. Structural position determines alignment.',
        englishSchool: 'Divided Germany represents Cold War order. Reunification requires great power consensus.'
      }
    },
    {
      name: 'Cuba',
      position: [23.1136, -82.3666],
      perspectives: {
        realism: 'Small state seeking Soviet protection against US threat. Hosts missiles to balance power.',
        liberalism: 'Authoritarian regime limiting cooperation. Economic isolation from democratic West.',
        neoliberalism: 'Outside Western institutional framework. No regimes to moderate conflict.',
        constructivism: 'Revolutionary identity aligned with Soviet ideology. Castro\'s identity as anti-imperialist.',
        neorealism: 'Bandwagons with distant power (USSR) against proximate threat (US).',
        englishSchool: 'Sovereignty recognized even by US (didn\'t invade). Part of international society despite ideology.'
      }
    },
    {
      name: 'United Kingdom',
      position: [51.5074, -0.1278],
      perspectives: {
        realism: 'Declining power. Maintains influence through "special relationship" with rising US power.',
        liberalism: 'Democratic leader promoting liberal values. Founding member of NATO and European cooperation.',
        neoliberalism: 'Uses institutions (UN Security Council seat) to maintain influence despite power decline.',
        constructivism: 'Identity as liberal democracy and global diplomat. Commonwealth reflects post-imperial identity.',
        neorealism: 'Former great power adapting to bipolar structure. Balances through alliance with US.',
        englishSchool: 'Diplomatic great power. Upholds international law and norms. Bridges US and Europe.'
      }
    },
    {
      name: 'France',
      position: [48.8566, 2.3522],
      perspectives: {
        realism: 'Medium power seeking autonomy. Builds independent nuclear force (force de frappe).',
        liberalism: 'Democratic state driving European integration. Leader in building EEC institutions.',
        neoliberalism: 'Strategic use of European institutions to constrain Germany and amplify French power.',
        constructivism: 'Gaullist identity of independence. National pride shapes foreign policy.',
        neorealism: 'Balances within alliance. Stays in NATO but maintains autonomy from US dominance.',
        englishSchool: 'Great power upholding international norms. Champion of multilateralism and law.'
      }
    },
    {
      name: 'China',
      position: [39.9042, 116.4074],
      perspectives: {
        realism: 'Rising power. Sino-Soviet split shows states prioritize security over ideology.',
        liberalism: 'Authoritarian regime limiting cooperation. Economic opening in late period enables engagement.',
        neoliberalism: 'Initially outside regimes. Gradual integration (UN seat 1971) shows institutional importance.',
        constructivism: 'Communist identity but distinct from Soviet model. "Chinese characteristics" matter.',
        neorealism: 'Balances against both superpowers. Classic balancing behavior in triangular system.',
        englishSchool: 'Great power with own sphere. Recognition of five principles of peaceful coexistence.'
      }
    },
    {
      name: 'India',
      position: [28.6139, 77.2090],
      perspectives: {
        realism: 'Regional power pursuing strategic autonomy. Non-aligned to avoid entrapment.',
        liberalism: 'Democracy but pragmatic. Uses institutions (Non-Aligned Movement) for collective voice.',
        neoliberalism: 'Participates in regimes when beneficial. Nuclear program outside NPT shows limits.',
        constructivism: 'Post-colonial identity of independence. Non-alignment as core identity.',
        neorealism: 'External balancing against regional threats (China, Pakistan) while staying neutral in Cold War.',
        englishSchool: 'Leader of Third World. Promotes new norms of decolonization and development.'
      }
    }
  ] as CountryData[]
};

export const wwiMapData = {
  realism: {
    allianceBorders: [
      {
        name: 'Triple Entente',
        members: [[51.5074, -0.1278], [48.8566, 2.3522], [55.7558, 37.6173]],
        color: '#2563EB',
        tooltip: 'Britain, France, Russia - Encirclement of Germany creating security dilemma'
      },
      {
        name: 'Triple Alliance',
        members: [[52.5200, 13.4050], [48.2082, 16.3738], [41.9028, 12.4964]],
        color: '#DC2626',
        tooltip: 'Germany, Austria-Hungary, Italy - Central Powers seeking security'
      }
    ] as AllianceBorder[],
    
    militaryBases: [
      { type: 'base', position: [52.5200, 13.4050], name: 'Berlin', country: 'Germany', tooltip: 'German military command - largest army in Europe' },
      { type: 'base', position: [48.8566, 2.3522], name: 'Paris', country: 'France', tooltip: 'French military HQ - mobilization center' },
      { type: 'base', position: [51.5074, -0.1278], name: 'London', country: 'Britain', tooltip: 'British Admiralty - dominant naval power' },
      { type: 'base', position: [55.7558, 37.6173], name: 'St. Petersburg', country: 'Russia', tooltip: 'Russian Empire command - massive army' },
    ] as MilitaryAsset[],
    
    spheresOfInfluence: [
      { center: [52.5200, 13.4050], radius: 1500000, color: '#DC2626', label: 'Central Powers' },
      { center: [48.8566, 2.3522], radius: 1800000, color: '#2563EB', label: 'Entente Powers' },
    ],
  },
  
  liberalism: {
    institutions: [
      { name: 'Hague Conferences (1899, 1907)', location: [52.0705, 4.3007], founded: '1899', members: 44, icon: 'law' },
      { name: 'International Court of Arbitration', location: [52.0705, 4.3007], founded: '1899', members: 26, icon: 'law' },
    ] as Institution[],
    
    tradeRoutes: [
      { from: [51.5074, -0.1278], to: [52.5200, 13.4050], volume: 10, tooltip: 'Britain-Germany: Largest trading partners despite tension' },
      { from: [48.8566, 2.3522], to: [52.5200, 13.4050], volume: 8, tooltip: 'France-Germany: Significant trade ties failed to prevent war' },
    ] as TradeRoute[],
    
    democraticCountries: [[51.5074, -0.1278], [48.8566, 2.3522]],
  },
  
  countries: [
    {
      name: 'Germany',
      position: [52.5200, 13.4050],
      perspectives: {
        realism: 'Rising power seeking security but creating fear. Surrounded by hostile alliances (encirclement). Arms buildup for defense appeared aggressive to neighbors.',
        liberalism: 'Democratic state (limited) but militaristic culture. Economic ties with Britain/France failed to prevent security concerns from dominating.',
        constructivism: 'National identity of greatness and honor. Perceived encirclement created threat perception regardless of actual intentions.',
      }
    },
    {
      name: 'France',
      position: [48.8566, 2.3522],
      perspectives: {
        realism: 'Medium power seeking security through alliances. Feared German power. Alliance with Russia to balance Germany.',
        liberalism: 'Democratic republic but security fears overrode liberal values. Economic interdependence with Germany insufficient.',
        constructivism: 'Identity shaped by 1871 defeat. Revanchism and national honor drove alliance choices and war support.',
      }
    },
    {
      name: 'Britain',
      position: [51.5074, -0.1278],
      perspectives: {
        realism: 'Balancing power. Feared German naval buildup threatening supremacy. Entered war to prevent German hegemony.',
        liberalism: 'Liberal democracy. Belgian neutrality violation triggered intervention (norm-based). Alliance commitments binding.',
        constructivism: 'Identity as empire and naval power. German challenge to naval supremacy seen as existential threat to British identity.',
      }
    },
    {
      name: 'Russia',
      position: [55.7558, 37.6173],
      perspectives: {
        realism: 'Empire seeking to maintain influence in Balkans. Alliance with Serbia and France to balance Germany/Austria.',
        liberalism: 'Autocracy limiting cooperation. No democratic constraints on war decision. Mobilization triggered automatic escalation.',
        constructivism: 'Pan-Slavic identity. Saw itself as protector of Slavic peoples. Serbian cause became Russian honor issue.',
      }
    },
  ] as CountryData[]
};

// EU Formation Map Data
export const euFormationMapData = {
  liberalism: {
    institutions: [
      { name: 'European Coal & Steel Community', location: [49.6116, 6.1319], founded: '1951', members: 6, icon: 'institution' },
      { name: 'European Economic Community', location: [50.8503, 4.3517], founded: '1957', members: 6, icon: 'bank' },
      { name: 'European Commission', location: [50.8503, 4.3517], founded: '1958', members: 27, icon: 'institution' },
      { name: 'European Parliament', location: [48.5967, 7.7717], founded: '1979', members: 27, icon: 'law' },
      { name: 'European Court of Justice', location: [49.6116, 6.1319], founded: '1952', members: 27, icon: 'law' },
    ] as Institution[],
    
    tradeRoutes: [
      { from: [48.8566, 2.3522], to: [52.5200, 13.4050], volume: 10, tooltip: 'France-Germany: From enemies to largest trading partners' },
      { from: [52.5200, 13.4050], to: [52.3676, 4.9041], volume: 9, tooltip: 'Germany-Netherlands: Deep economic integration' },
      { from: [48.8566, 2.3522], to: [41.9028, 12.4964], volume: 8, tooltip: 'France-Italy: Founding member trade ties' },
      { from: [50.8503, 4.3517], to: [48.8566, 2.3522], volume: 10, tooltip: 'Belgium-France: EEC headquarters connection' },
      { from: [52.5200, 13.4050], to: [41.9028, 12.4964], volume: 7, tooltip: 'Germany-Italy: Industrial cooperation' },
    ] as TradeRoute[],
    
    democraticCountries: [
      [48.8566, 2.3522], [52.5200, 13.4050], [41.9028, 12.4964],
      [50.8503, 4.3517], [52.3676, 4.9041], [49.6116, 6.1319]
    ],
  },
  
  neoliberalism: {
    treaties: [
      { name: 'Treaty of Rome (1957)', location: [41.9028, 12.4964], tooltip: 'Established EEC - Economic integration regime', signatories: 6 },
      { name: 'Maastricht Treaty (1992)', location: [50.8513, 5.6909], tooltip: 'Created EU - Political and monetary union', signatories: 12 },
      { name: 'Schengen Agreement (1985)', location: [49.4969, 5.9464], tooltip: 'Free movement regime - borderless Europe', signatories: 26 },
      { name: 'Single European Act (1986)', location: [50.8503, 4.3517], tooltip: 'Single market regime - economic harmonization', signatories: 12 },
    ],
    
    cooperationZones: [
      { center: [50.8503, 4.3517], radius: 1000000, color: '#3B82F6', label: 'EU Cooperation Zone' },
    ]
  },
  
  countries: [
    {
      name: 'France',
      position: [48.8566, 2.3522],
      perspectives: {
        realism: 'Uses EU to constrain German power while maintaining French influence. Strategic use of institutions for relative gains.',
        liberalism: 'Founding member driven by democratic peace vision. Economic interdependence with Germany prevents war. Institutional commitment genuine.',
        neoliberalism: 'Strategic institution-builder. Uses regimes (CAP, ECB) to lock in cooperation and amplify French power beyond material capabilities.',
        constructivism: 'European identity construction. Post-WWII identity shift from nationalism to European cooperation. Norms of integration internalized.',
      }
    },
    {
      name: 'Germany',
      position: [52.5200, 13.4050],
      perspectives: {
        realism: 'Seeks rehabilitation and influence through civilian power. EU constrains Germany but also provides platform for economic dominance.',
        liberalism: 'Democratic transformation after WWII. EU integration shows democratic peace in action. Trade partnerships replace military rivalry.',
        neoliberalism: 'Uses institutions to overcome WWII legacy and regain legitimacy. Economic power through EU single market. Embedded liberalism.',
        constructivism: 'Identity transformation from Nazi aggression to peaceful democracy. European identity adopted. Norms of multilateralism internalized.',
      }
    },
  ] as CountryData[]
};

// Cuban Missile Crisis Map Data
export const cubanMissileMapData = {
  realism: {
    militaryBases: [
      { type: 'base', position: [38.9072, -77.0369], name: 'Pentagon', country: 'USA', tooltip: 'US Command Center - Nuclear decision-making' },
      { type: 'base', position: [25.7617, -80.1918], name: 'Homestead AFB', country: 'USA', tooltip: 'Frontline US airbase facing Cuba' },
      { type: 'nuclear-site', position: [23.1136, -82.3666], name: 'Soviet Missile Sites', country: 'USSR', tooltip: 'Soviet nuclear missiles 90 miles from US' },
      { type: 'naval-base', position: [23.1136, -82.3666], name: 'Guantanamo Bay', country: 'USA', tooltip: 'US Naval Base in Cuba - observation post' },
    ] as MilitaryAsset[],
    
    spheresOfInfluence: [
      { center: [38.9072, -77.0369], radius: 2500000, color: '#2563EB', label: 'US Monroe Doctrine Sphere' },
      { center: [23.1136, -82.3666], radius: 500000, color: '#DC2626', label: 'Soviet Foothold in Caribbean' },
    ],
    
    attackVectors: [
      { from: [23.1136, -82.3666], to: [38.9072, -77.0369], tooltip: 'Soviet missiles could reach Washington in minutes', color: '#DC2626' },
      { from: [38.9072, -77.0369], to: [23.1136, -82.3666], tooltip: 'US naval blockade and potential invasion routes', color: '#2563EB' },
    ]
  },
  
  countries: [
    {
      name: 'United States',
      position: [38.9072, -77.0369],
      perspectives: {
        realism: 'Defending hemisphere sphere of influence. Soviet missiles unacceptable power shift. Used naval blockade (quarantine) to force removal.',
        neorealism: 'Maintaining strategic nuclear balance. Soviet attempt to change power distribution. Nuclear deterrence logic prevented escalation.',
        englishSchool: 'Respected norms (no invasion of Cuba) while defending vital interests. Negotiated through diplomatic channels despite crisis.',
      }
    },
    {
      name: 'Cuba',
      position: [23.1136, -82.3666],
      perspectives: {
        realism: 'Small state balancing against proximate threat (US) by allying with distant power (USSR). Rational security-seeking.',
        constructivism: 'Revolutionary identity aligned with Soviet ideology. Castro\'s anti-imperialist identity drove alliance choice.',
        liberalism: 'Authoritarian regime. Excluded from hemisphere institutions. Isolation drove Soviet alliance.',
      }
    },
    {
      name: 'Soviet Union',
      position: [55.7558, 37.6173],
      perspectives: {
        realism: 'Attempting to change strategic balance cheaply. Defending ally (Cuba). Testing US resolve.',
        neorealism: 'Inferior strategic position. Missiles in Cuba would offset US missiles in Turkey. Balance of power logic.',
        englishSchool: 'Pushed international norms to limit but ultimately respected crisis management norms. Backed down to avoid war.',
      }
    },
  ] as CountryData[]
};

// UN Formation Map Data
export const unFormationMapData = {
  liberalism: {
    institutions: [
      { name: 'UN Headquarters', location: [40.7489, -73.9680], founded: '1945', members: 51, icon: 'institution' },
      { name: 'Security Council', location: [40.7489, -73.9680], founded: '1945', members: 5, icon: 'law' },
      { name: 'General Assembly', location: [40.7489, -73.9680], founded: '1945', members: 51, icon: 'institution' },
      { name: 'International Court of Justice', location: [52.0705, 4.3007], founded: '1945', members: 193, icon: 'law' },
      { name: 'World Bank', location: [38.8993, -77.0420], founded: '1944', members: 189, icon: 'bank' },
      { name: 'IMF', location: [38.8993, -77.0420], founded: '1945', members: 190, icon: 'bank' },
    ] as Institution[],
    
    tradeRoutes: [
      { from: [38.9072, -77.0369], to: [51.5074, -0.1278], volume: 10, tooltip: 'US-UK: Special relationship and economic cooperation' },
      { from: [38.9072, -77.0369], to: [48.8566, 2.3522], volume: 8, tooltip: 'US-France: Marshall Plan economic ties' },
      { from: [51.5074, -0.1278], to: [48.8566, 2.3522], volume: 9, tooltip: 'UK-France: Western alliance cooperation' },
    ] as TradeRoute[],
    
    democraticCountries: [
      [38.9072, -77.0369], [51.5074, -0.1278], [48.8566, 2.3522]
    ],
  },
  
  neoliberalism: {
    institutions: [
      { name: 'UN Headquarters', location: [40.7489, -73.9680], founded: '1945', members: 51, icon: 'institution' },
      { name: 'Security Council', location: [40.7489, -73.9680], founded: '1945', members: 5, icon: 'law' },
      { name: 'General Assembly', location: [40.7489, -73.9680], founded: '1945', members: 51, icon: 'institution' },
      { name: 'International Court of Justice', location: [52.0705, 4.3007], founded: '1945', members: 193, icon: 'law' },
      { name: 'World Bank', location: [38.8993, -77.0420], founded: '1944', members: 189, icon: 'bank' },
      { name: 'IMF', location: [38.8993, -77.0420], founded: '1945', members: 190, icon: 'bank' },
    ] as Institution[],
    
    treaties: [
      { name: 'UN Charter (1945)', location: [37.7749, -122.4194], tooltip: 'Foundational treaty - 51 original signatories', signatories: 193 },
      { name: 'Universal Declaration of Human Rights', location: [48.8566, 2.3522], tooltip: 'Human rights norm creation - 1948', signatories: 193 },
    ],
    
    cooperationZones: [
      { center: [40.7489, -73.9680], radius: 5000000, color: '#3B82F6', label: 'Global Institutional Network' },
    ]
  },
  
  englishSchool: {
    internationalSocietyMembers: [
      [38.9072, -77.0369], [55.7558, 37.6173], [51.5074, -0.1278],
      [48.8566, 2.3522], [39.9042, 116.4074]
    ],
    
    legalCommitments: [
      { treaty: 'UN Charter', signatories: [[38.9072, -77.0369], [55.7558, 37.6173], [51.5074, -0.1278], [48.8566, 2.3522], [39.9042, 116.4074]], tooltip: 'Great powers commit to international order' },
    ],
    
    diplomaticChannels: [],
    
    sharedNorms: [
      'Sovereignty principle - Recognized by all',
      'Non-aggression norm - Article 2(4)',
      'Self-determination - Colonial independence',
      'Human rights standards - UDHR 1948',
    ]
  },
  
  countries: [
    {
      name: 'United States',
      position: [38.9072, -77.0369],
      perspectives: {
        neoliberalism: 'Hegemon creating institutions to manage international order. Provides public goods (security, monetary system). Institutions serve US interests while enabling cooperation.',
        liberalism: 'Democratic leader building liberal international order. UN embodies Wilsonian ideals. Institutions prevent return to 1930s anarchy.',
        englishSchool: 'Great power accepting special responsibility for order. UN Charter balances power and law. Security Council reflects great power concert.',
      }
    },
    {
      name: 'Soviet Union',
      position: [55.7558, 37.6173],
      perspectives: {
        neoliberalism: 'Uses institutions strategically. Veto power in Security Council protects interests. Participates in regimes when beneficial.',
        realism: 'Skeptical of institutions as tools of powerful. UN reflects power realities (P5 veto). International law masks power politics.',
        englishSchool: 'Great power recognizing need for international society. Shares basic norms (sovereignty, diplomacy) despite ideological rivalry.',
      }
    },
  ] as CountryData[]
};

