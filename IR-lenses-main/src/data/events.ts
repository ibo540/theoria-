import { HistoricalEvent, TheoryInterpretation } from '../types';

export const events: HistoricalEvent[] = [
  {
    id: 'cold-war',
    name: 'The Cold War (1947-1991)',
    year: '1947-1991',
    description: 'A period of geopolitical tension between the United States and the Soviet Union and their respective allies.',
    location: {
      lat: 52.52,
      lng: 13.405
    },
    zoom: 3,
    actors: ['United States', 'Soviet Union', 'NATO', 'Warsaw Pact'],
    data: {
      militaryPower: {
        'United States': 85,
        'Soviet Union': 80,
        'NATO Allies': 65,
        'Warsaw Pact': 60
      },
      economicPower: {
        'United States': 90,
        'Soviet Union': 65,
        'Western Europe': 75,
        'Eastern Europe': 45
      },
      alliances: ['NATO (1949)', 'Warsaw Pact (1955)', 'Non-Aligned Movement'],
      timeline: [
        { date: '1947', event: 'Truman Doctrine announced' },
        { date: '1949', event: 'NATO formed' },
        { date: '1955', event: 'Warsaw Pact formed' },
        { date: '1962', event: 'Cuban Missile Crisis' },
        { date: '1989', event: 'Fall of Berlin Wall' },
        { date: '1991', event: 'Soviet Union dissolves' }
      ]
    }
  },
  {
    id: 'wwi',
    name: 'World War I Outbreak (1914)',
    year: '1914',
    description: 'The assassination of Archduke Franz Ferdinand triggered a chain of alliance commitments leading to global war.',
    location: {
      lat: 48.2082,
      lng: 16.3738
    },
    zoom: 4,
    actors: ['Austria-Hungary', 'Serbia', 'Germany', 'Russia', 'France', 'Britain'],
    data: {
      militaryPower: {
        'Germany': 85,
        'Austria-Hungary': 65,
        'Russia': 75,
        'France': 70,
        'Britain': 80
      },
      alliances: ['Triple Alliance (Germany, Austria-Hungary, Italy)', 'Triple Entente (Britain, France, Russia)'],
      timeline: [
        { date: 'June 28, 1914', event: 'Assassination of Franz Ferdinand' },
        { date: 'July 28, 1914', event: 'Austria-Hungary declares war on Serbia' },
        { date: 'August 1, 1914', event: 'Germany declares war on Russia' },
        { date: 'August 3, 1914', event: 'Germany declares war on France' },
        { date: 'August 4, 1914', event: 'Britain declares war on Germany' }
      ]
    }
  },
  {
    id: 'eu-formation',
    name: 'European Union Formation',
    year: '1993',
    description: 'The transformation from European Coal and Steel Community to the European Union, creating unprecedented economic and political integration.',
    location: {
      lat: 50.8503,
      lng: 4.3517
    },
    zoom: 4,
    actors: ['France', 'Germany', 'Italy', 'Belgium', 'Netherlands', 'Luxembourg'],
    data: {
      economicPower: {
        'Germany': 85,
        'France': 80,
        'Italy': 70,
        'UK': 85,
        'Spain': 60
      },
      timeline: [
        { date: '1951', event: 'European Coal and Steel Community formed' },
        { date: '1957', event: 'Treaty of Rome - EEC created' },
        { date: '1992', event: 'Maastricht Treaty signed' },
        { date: '1993', event: 'European Union officially formed' },
        { date: '2002', event: 'Euro introduced as currency' }
      ]
    }
  },
  {
    id: 'cuban-missile-crisis',
    name: 'Cuban Missile Crisis (1962)',
    year: '1962',
    description: 'A 13-day confrontation between the United States and Soviet Union over Soviet ballistic missiles in Cuba.',
    location: {
      lat: 23.1136,
      lng: -82.3666
    },
    zoom: 5,
    actors: ['United States', 'Soviet Union', 'Cuba'],
    data: {
      militaryPower: {
        'United States': 90,
        'Soviet Union': 85,
        'Cuba': 30
      },
      timeline: [
        { date: 'October 14, 1962', event: 'U-2 spy plane photographs missile sites' },
        { date: 'October 22, 1962', event: 'Kennedy announces naval blockade' },
        { date: 'October 24, 1962', event: 'Soviet ships approach blockade' },
        { date: 'October 27, 1962', event: 'Peak of crisis - U-2 shot down' },
        { date: 'October 28, 1962', event: 'Khrushchev agrees to remove missiles' }
      ]
    }
  },
  {
    id: 'un-formation',
    name: 'United Nations Formation (1945)',
    year: '1945',
    description: 'Creation of the United Nations after WWII to maintain international peace and security through collective action.',
    location: {
      lat: 37.7749,
      lng: -122.4194
    },
    zoom: 2,
    actors: ['United States', 'Soviet Union', 'United Kingdom', 'France', 'China'],
    data: {
      timeline: [
        { date: 'June 26, 1945', event: 'UN Charter signed in San Francisco' },
        { date: 'October 24, 1945', event: 'UN officially established' },
        { date: '1948', event: 'Universal Declaration of Human Rights' },
        { date: '1950', event: 'First major intervention - Korean War' }
      ]
    }
  }
];

export const interpretations: TheoryInterpretation[] = [
  {
    theoryId: 'classical-realism',
    eventId: 'cold-war',
    interpretation: 'The Cold War exemplifies realist principles of power politics and security competition. Two superpowers competed for dominance in an anarchic international system, each seeking to maximize their power and security while minimizing threats.',
    keyPoints: [
      'Bipolar balance of power between US and USSR',
      'Security dilemma: each side\'s defensive measures increased the other\'s insecurity',
      'Zero-sum competition for influence and allies',
      'Nuclear weapons as ultimate power capability',
      'Ideological rhetoric masked pure power calculations'
    ],
    visualElements: [
      {
        type: 'circle',
        coordinates: [[38.9072, -77.0369]],
        label: 'US Power Center',
        color: '#FF0000'
      },
      {
        type: 'circle',
        coordinates: [[55.7558, 37.6173]],
        label: 'Soviet Power Center',
        color: '#CC0000'
      }
    ]
  },
  {
    theoryId: 'structural-realism',
    eventId: 'cold-war',
    interpretation: 'Neorealism sees the Cold War as a product of bipolar system structure. The distribution of capabilities created a stable balance where two superpowers dominated, reducing uncertainty but creating intense competition.',
    keyPoints: [
      'Bipolar structure created stability through clarity',
      'Balance of power through nuclear deterrence (MAD)',
      'System structure determined behavior more than ideology',
      'Self-help through military buildups and alliances',
      'Relative gains concerns drove arms race'
    ],
    visualElements: []
  },
  {
    theoryId: 'liberalism',
    eventId: 'cold-war',
    interpretation: 'Liberalism explains Cold War tensions through lack of democratic peace and absence of strong international institutions between the blocs. The eventual end came through increasing interdependence and institutional cooperation.',
    keyPoints: [
      'Democratic peace absent - USSR was authoritarian',
      'Limited institutions for cooperation (UN Security Council deadlock)',
      'Economic isolation prevented interdependence benefits',
      'Eventual cooperation through arms control treaties',
      'End facilitated by Gorbachev\'s liberalization'
    ],
    visualElements: []
  },
  {
    theoryId: 'english-school',
    eventId: 'cold-war',
    interpretation: 'The English School views the Cold War as a managed rivalry within an international society. Despite ideological differences, both superpowers recognized shared interests in avoiding nuclear war and maintaining basic order.',
    keyPoints: [
      'Maintenance of international society despite ideological divide',
      'Shared norms against nuclear weapon use',
      'Great power management of international order',
      'Diplomacy and communication channels maintained',
      'Balance between conflict and cooperation'
    ],
    visualElements: []
  },
  {
    theoryId: 'classical-realism',
    eventId: 'wwi',
    interpretation: 'WWI demonstrates how alliance systems and power calculations in an anarchic system can lead to catastrophic conflict. States pursued their national interests through alliances, which then dragged them into a massive war.',
    keyPoints: [
      'Alliance systems created automatic war triggers',
      'Security dilemma: Germany\'s rise threatened Britain and France',
      'Balance of power logic failed to prevent war',
      'Arms races reflected power competition',
      'Each state acted rationally but collectively produced disaster'
    ],
    visualElements: []
  },
  {
    theoryId: 'liberalism',
    eventId: 'eu-formation',
    interpretation: 'The EU is a triumph of liberal principles: economic interdependence, democratic peace, and institutional cooperation have made war between member states unthinkable.',
    keyPoints: [
      'Economic integration created mutual dependence',
      'Democratic peace among all member states',
      'Institutions (Commission, Parliament, Court) facilitate cooperation',
      'Absolute gains from trade benefit all members',
      'Spillover effect from economic to political integration'
    ],
    visualElements: []
  },
  {
    theoryId: 'neoliberalism',
    eventId: 'eu-formation',
    interpretation: 'Neoliberal institutionalism sees the EU as proof that institutions can enable cooperation even while states remain self-interested. Institutions reduce uncertainty and enforcement costs.',
    keyPoints: [
      'Treaties created binding commitments and reduced uncertainty',
      'Common market reduced transaction costs',
      'European Court ensures compliance',
      'Repeated interactions built trust',
      'Information sharing through institutions'
    ],
    visualElements: []
  },
  {
    theoryId: 'structural-realism',
    eventId: 'cuban-missile-crisis',
    interpretation: 'The crisis demonstrates nuclear deterrence and balance of power. Both superpowers had to consider the catastrophic consequences of war, leading to a negotiated settlement that maintained the strategic balance.',
    keyPoints: [
      'Nuclear weapons created mutual assured destruction',
      'Balance of power maintained through compromise',
      'Rationality prevailed due to system pressures',
      'Security competition nearly led to war',
      'System structure constrained both sides'
    ],
    visualElements: []
  },
  {
    theoryId: 'neoliberalism',
    eventId: 'un-formation',
    interpretation: 'The UN represents an institutional approach to managing anarchy. By creating rules, norms, and mechanisms for collective action, it reduces uncertainty and facilitates cooperation on shared challenges.',
    keyPoints: [
      'Institutions reduce costs of cooperation',
      'Security Council provides forum for conflict resolution',
      'Charter establishes norms against aggression',
      'Specialized agencies address global problems',
      'Even imperfect institutions better than pure anarchy'
    ],
    visualElements: []
  },
  {
    theoryId: 'english-school',
    eventId: 'un-formation',
    interpretation: 'The UN embodies international society\'s shared values and commitment to order. It represents great powers\' recognition of their responsibility to maintain international order while respecting sovereignty.',
    keyPoints: [
      'Codifies norms of international society',
      'Great power responsibility through Security Council',
      'Balance between order and justice',
      'Sovereignty as foundational principle',
      'Diplomatic culture and shared procedures'
    ],
    visualElements: []
  }
];

