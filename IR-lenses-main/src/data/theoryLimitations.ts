export interface TheoryLimitation {
  theoryId: string;
  eventId: string;
  canExplain: boolean;
  weaknessLevel: 'critical' | 'moderate' | 'minor' | 'none';
  blindSpots: string[];
  whatItMisses: string[];
  betterAlternatives?: { theoryId: string; reason: string }[];
  funnyAnalogy?: string;
}

export const theoryLimitations: TheoryLimitation[] = [
  // Liberalism struggles with WWI
  {
    theoryId: 'liberalism',
    eventId: 'wwi',
    canExplain: false,
    weaknessLevel: 'critical',
    blindSpots: [
      'Cannot explain why democracies (Britain, France) went to war so easily',
      'Overestimates the power of economic interdependence (trade didn\'t prevent war)',
      'Ignores security competition and alliance dynamics',
      'Assumes institutions could prevent war (but they didn\'t exist yet)'
    ],
    whatItMisses: [
      'The role of military alliances in automatic escalation',
      'How national security fears overrode economic interests',
      'Why democratic publics enthusiastically supported war',
      'The absence of strong international institutions in 1914',
      'Power politics and arms races as primary drivers'
    ],
    betterAlternatives: [
      { theoryId: 'Classical Realism', reason: 'Explains alliance politics, security dilemma, and arms races that caused WWI' },
      { theoryId: 'Structural Realism', reason: 'Shows how multipolar system instability led to war' }
    ],
    funnyAnalogy: 'A doctor trying to cure a broken bone with meditation. Liberalism brings great tools (institutions, trade) but WWI happened before those tools existed, and even trade couldn\'t stop the security dilemma.'
  },

  // Constructivism limited on Cuban Missile Crisis
  {
    theoryId: 'constructivism',
    eventId: 'cuban-missile-crisis',
    canExplain: true,
    weaknessLevel: 'moderate',
    blindSpots: [
      'Downplays the very real nuclear weapons that could destroy civilization',
      'Identity hadn\'t changed by 1962 - both sides still saw each other as enemies',
      'Overemphasizes ideas when material reality (nukes) was dominant factor'
    ],
    whatItMisses: [
      'The immediate material threat of nuclear annihilation',
      'How power balance calculations drove both sides\' decisions',
      'Why Kennedy chose blockade over diplomacy-first approach',
      'The role of military capabilities in limiting options'
    ],
    betterAlternatives: [
      { theoryId: 'Structural Realism', reason: 'Nuclear balance and deterrence logic better explains the crisis resolution' },
      { theoryId: 'Classical Realism', reason: 'Power politics and survival instincts drove decision-making' }
    ],
    funnyAnalogy: 'Like explaining a chess game by focusing on what players were thinking, while ignoring the actual pieces on the board. Ideas matter, but so do nuclear weapons!'
  },

  // Realism struggles with EU formation
  {
    theoryId: 'classical-realism',
    eventId: 'eu-formation',
    canExplain: false,
    weaknessLevel: 'critical',
    blindSpots: [
      'Cannot explain why states voluntarily gave up sovereignty',
      'Misses how economic cooperation created peace',
      'Ignores the role of institutions in binding states together',
      'Assumes states only care about relative gains (but EU shows absolute gains work)'
    ],
    whatItMisses: [
      'Why France and Germany, historical enemies, became integrated partners',
      'How institutions reduced uncertainty and built trust',
      'The power of economic interdependence in preventing conflict',
      'Democratic peace effect - no EU wars between member democracies',
      'Supranational institutions constraining state behavior'
    ],
    betterAlternatives: [
      { theoryId: 'Liberalism', reason: 'Perfectly explains EU through democratic peace, institutions, and economic interdependence' },
      { theoryId: 'Neoliberal Institutionalism', reason: 'Shows how institutions facilitated cooperation even among self-interested states' }
    ],
    funnyAnalogy: 'Like a paranoid security guard trying to explain why people voluntarily share their resources and trust each other. Realism expects competition and conflict, but the EU shows cooperation is possible!'
  },

  {
    theoryId: 'structural-realism',
    eventId: 'eu-formation',
    canExplain: false,
    weaknessLevel: 'critical',
    blindSpots: [
      'System structure alone cannot explain regional integration',
      'Relative gains concerns should have prevented EU cooperation',
      'Predicts states wouldn\'t surrender sovereignty voluntarily',
      'Cannot account for supranational authority'
    ],
    whatItMisses: [
      'Domestic politics and democratic governance as drivers',
      'Economic motivations beyond security',
      'How trust was built through repeated interactions',
      'The normative commitment to peace after WWII',
      'Role of non-state actors (businesses, civil society)'
    ],
    betterAlternatives: [
      { theoryId: 'Liberalism', reason: 'Economic interdependence and democratic peace explain EU success' },
      { theoryId: 'Constructivism', reason: 'European identity and peace norms drove integration' }
    ],
    funnyAnalogy: 'Like predicting people will always compete and never cooperate. Neorealism\'s system-level focus misses how Europeans built peace through institutions and shared values!'
  },

  // Realism struggles with UN formation
  {
    theoryId: 'classical-realism',
    eventId: 'un-formation',
    canExplain: true,
    weaknessLevel: 'moderate',
    blindSpots: [
      'Skeptical about institutions actually mattering (but UN does matter for many issues)',
      'Focuses only on great power politics, ignores humanitarian and development work',
      'Assumes UN is just a tool of powerful states (partially true, but incomplete)'
    ],
    whatItMisses: [
      'How UN specialized agencies solve global problems (WHO, UNICEF)',
      'Peacekeeping operations that prevented conflicts',
      'Human rights norms that spread through UN',
      'Small states using UN as platform for voice'
    ],
    betterAlternatives: [
      { theoryId: 'Neoliberal Institutionalism', reason: 'Better explains how UN facilitates cooperation on shared problems' },
      { theoryId: 'English School', reason: 'Captures how UN embodies international society norms' }
    ],
    funnyAnalogy: 'Like dismissing a Swiss Army knife because the main blade isn\'t perfect, while ignoring all the other useful tools. Realism sees UN\'s security limits but misses its many other functions!'
  },

  // Liberalism has minor issues with Cold War
  {
    theoryId: 'liberalism',
    eventId: 'cold-war',
    canExplain: true,
    weaknessLevel: 'minor',
    blindSpots: [
      'Underestimates how ideological divide prevented cooperation early on',
      'Assumes institutions and trade could have prevented conflict (but ideological incompatibility was strong)',
      'Democratic peace doesn\'t apply when one side (USSR) is authoritarian'
    ],
    whatItMisses: [
      'The structural conflict between superpowers regardless of ideology',
      'Security competition as primary driver in early Cold War',
      'Why economic interdependence failed to develop between blocs'
    ],
    betterAlternatives: [
      { theoryId: 'Structural Realism', reason: 'Better explains early Cold War bipolar competition' },
      { theoryId: 'Constructivism', reason: 'Captures how identity change (Gorbachev) ended Cold War' }
    ],
    funnyAnalogy: 'Like a marriage counselor assuming communication can fix everything, even when one partner is fundamentally opposed to the relationship. Liberalism\'s tools work best between similar regimes!'
  },

  // Constructivism limited on WWI
  {
    theoryId: 'constructivism',
    eventId: 'wwi',
    canExplain: true,
    weaknessLevel: 'moderate',
    blindSpots: [
      'Focuses on nationalism and identity but doesn\'t explain the timing',
      'Downplays material factors like alliance systems and military mobilization plans',
      'Cannot fully explain why war escalated so quickly'
    ],
    whatItMisses: [
      'The role of military technology (railroads, machine guns) in escalation',
      'Rigid alliance commitments creating automatic war',
      'Security dilemma and first-strike advantages',
      'How mobilization schedules left no time for diplomacy'
    ],
    betterAlternatives: [
      { theoryId: 'Classical Realism', reason: 'Alliance dynamics and security dilemma better explain escalation' },
      { theoryId: 'Structural Realism', reason: 'Multipolar system instability explains outbreak' }
    ],
    funnyAnalogy: 'Like explaining a car crash by discussing the drivers\' road rage, while ignoring the brake failure and icy roads. Identity mattered, but so did material constraints!'
  },

  // English School moderate weakness on Cuban Missile Crisis
  {
    theoryId: 'english-school',
    eventId: 'cuban-missile-crisis',
    canExplain: true,
    weaknessLevel: 'moderate',
    blindSpots: [
      'Overestimates how much norms constrained behavior during peak crisis',
      'Diplomacy nearly failed - it was very close to war',
      'International society norms were weak compared to survival instincts'
    ],
    whatItMisses: [
      'How close the crisis came to nuclear war despite norms',
      'Role of nuclear deterrence in preventing escalation',
      'That crisis management was as much luck as skill',
      'Material power balance was more important than norms'
    ],
    betterAlternatives: [
      { theoryId: 'Structural Realism', reason: 'Nuclear deterrence logic better explains crisis resolution' }
    ],
    funnyAnalogy: 'Like crediting good manners for stopping a fistfight, when actually both fighters noticed they had guns. Norms helped, but nuclear weapons were the main reason neither side attacked!'
  },

  // Neoliberalism moderate on Cold War early period
  {
    theoryId: 'neoliberalism',
    eventId: 'cold-war',
    canExplain: true,
    weaknessLevel: 'moderate',
    blindSpots: [
      'Institutions were weak during early Cold War (UN Security Council deadlocked)',
      'No trade between blocs meant economic interdependence couldn\'t work',
      'Ideological incompatibility prevented regime formation'
    ],
    whatItMisses: [
      'Why institutions failed to prevent proxy wars',
      'How ideological divide prevented meaningful cooperation until late 1980s',
      'The primacy of security competition over institutional cooperation'
    ],
    betterAlternatives: [
      { theoryId: 'Constructivism', reason: 'Better explains how identity change (Gorbachev) ended Cold War' }
    ],
    funnyAnalogy: 'Like bringing a rulebook to a street fight. Institutions help when both sides want to cooperate, but in early Cold War, neither side trusted institutions enough!'
  }
];

