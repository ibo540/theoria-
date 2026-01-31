export interface ScholarProfile {
  name: string;
  lifespan: string;
  nationality: string;
  theory: string;
  keyWorks: string[];
  mainContributions: string[];
  famousQuote?: string;
  background: string;
  legacy: string;
}

export const scholars: { [key: string]: ScholarProfile } = {
  'Hans Morgenthau': {
    name: 'Hans Morgenthau',
    lifespan: '1904–1980',
    nationality: 'German-American',
    theory: 'Classical Realism',
    keyWorks: [
      'Politics Among Nations (1948)',
      'Scientific Man vs. Power Politics (1946)',
      'In Defense of the National Interest (1951)'
    ],
    mainContributions: [
      'Founder of modern realist theory in IR',
      'Developed six principles of political realism',
      'Emphasized power and national interest as core concepts',
      'Distinguished between moral principles and political necessity',
      'Advocated for prudent statecraft based on national interest'
    ],
    famousQuote: '"International politics, like all politics, is a struggle for power."',
    background: 'Fled Nazi Germany, became leading American IR theorist at University of Chicago. His work dominated post-WWII IR scholarship.',
    legacy: 'Most influential realist scholar of 20th century. "Politics Among Nations" remains foundational text in IR theory.'
  },

  'Kenneth Waltz': {
    name: 'Kenneth Waltz',
    lifespan: '1924–2013',
    nationality: 'American',
    theory: 'Structural Realism (Neorealism)',
    keyWorks: [
      'Theory of International Politics (1979)',
      'Man, the State, and War (1959)',
      'The Spread of Nuclear Weapons (1981)'
    ],
    mainContributions: [
      'Created structural realism/neorealism',
      'Three levels of analysis framework (individual, state, system)',
      'System structure determines state behavior',
      'Bipolar systems are more stable than multipolar',
      'Nuclear weapons promote stability through deterrence'
    ],
    famousQuote: '"The structure of the system shapes the behavior of states."',
    background: 'Professor at UC Berkeley and Columbia. Revolutionized IR theory with systemic approach.',
    legacy: 'Theory of International Politics (1979) is one of most cited works in political science. Created modern neorealism.'
  },

  'E.H. Carr': {
    name: 'Edward Hallett Carr',
    lifespan: '1892–1982',
    nationality: 'British',
    theory: 'Classical Realism',
    keyWorks: [
      'The Twenty Years\' Crisis, 1919-1939 (1939)',
      'What is History? (1961)',
      'Nationalism and After (1945)'
    ],
    mainContributions: [
      'Critiqued liberal idealism after WWI',
      'Emphasized power politics and national interest',
      'Distinguished between "realism" and "utopianism"',
      'Analyzed failure of League of Nations',
      'Combined historical analysis with theoretical insight'
    ],
    famousQuote: '"Realism tends to emphasize the irresistible strength of existing forces and the inevitable character of existing tendencies."',
    background: 'British diplomat and historian. Wrote during interwar period, witnessing failure of League of Nations.',
    legacy: 'The Twenty Years\' Crisis remains essential reading for understanding realism\'s critique of liberalism.'
  },

  'Thucydides': {
    name: 'Thucydides',
    lifespan: 'c. 460–400 BC',
    nationality: 'Ancient Greek',
    theory: 'Classical Realism',
    keyWorks: [
      'History of the Peloponnesian War'
    ],
    mainContributions: [
      'First systematic realist analysis of international relations',
      'Thucydides Trap: Rising power threatens established power',
      'Fear, honor, and interest as drivers of conflict',
      'Power politics transcends time and culture',
      'Melian Dialogue: "The strong do what they can, the weak suffer what they must"'
    ],
    famousQuote: '"The strong do what they can and the weak suffer what they must."',
    background: 'Athenian general and historian. Wrote definitive account of war between Athens and Sparta (431-404 BC).',
    legacy: '2,400 years later, still cited in IR theory. Thucydides Trap used to analyze US-China relations today.'
  },

  'Immanuel Kant': {
    name: 'Immanuel Kant',
    lifespan: '1724–1804',
    nationality: 'German (Prussian)',
    theory: 'Liberalism',
    keyWorks: [
      'Perpetual Peace: A Philosophical Sketch (1795)',
      'Critique of Pure Reason (1781)',
      'Groundwork of the Metaphysics of Morals (1785)'
    ],
    mainContributions: [
      'Philosophical foundation for liberal peace theory',
      'Democratic peace hypothesis: Republics don\'t fight each other',
      'Commercial interdependence promotes peace',
      'International law and organizations can prevent war',
      'Moral imperative for peaceful international relations'
    ],
    famousQuote: '"Perpetual peace is guaranteed by no less an authority than the great artist Nature herself."',
    background: 'Enlightenment philosopher in Königsberg. Never traveled far but wrote about global peace.',
    legacy: 'Democratic peace theory traces to his work. EU and UN embody his ideals of institutional cooperation.'
  },

  'Robert Keohane': {
    name: 'Robert Keohane',
    lifespan: '1941–present',
    nationality: 'American',
    theory: 'Neoliberal Institutionalism',
    keyWorks: [
      'After Hegemony (1984)',
      'Power and Interdependence (1977, with Joseph Nye)',
      'Neorealism and Its Critics (1986)'
    ],
    mainContributions: [
      'Developed neoliberal institutionalism',
      'Showed how institutions enable cooperation under anarchy',
      'Complex interdependence theory',
      'Institutions reduce transaction costs and uncertainty',
      'Bridged realism and liberalism'
    ],
    famousQuote: '"Cooperation is possible even when states are self-interested."',
    background: 'Professor at Princeton, Harvard, Duke. Leading liberal IR theorist engaging with realist critics.',
    legacy: 'After Hegemony showed cooperation possible without hegemon. Most cited living IR scholar.'
  },

  'Michael Doyle': {
    name: 'Michael Doyle',
    lifespan: '1948–present',
    nationality: 'American',
    theory: 'Liberalism',
    keyWorks: [
      'Kant, Liberal Legacies, and Foreign Affairs (1983)',
      'Ways of War and Peace (1997)',
      'Liberalism and World Politics (1986)'
    ],
    mainContributions: [
      'Empirical testing of democratic peace theory',
      'Showed democracies don\'t fight each other',
      'Linked Kant\'s philosophy to modern IR',
      'Distinguished between liberal and illiberal states',
      'Analyzed peace zones among democracies'
    ],
    famousQuote: '"Liberalism has left a legacy of liberal peace."',
    background: 'Professor at Columbia. Former UN Assistant Secretary-General. Combined theory with practice.',
    legacy: 'Provided empirical evidence for democratic peace, making it central to liberal IR theory.'
  },

  'Alexander Wendt': {
    name: 'Alexander Wendt',
    lifespan: '1958–present',
    nationality: 'American',
    theory: 'Constructivism',
    keyWorks: [
      'Social Theory of International Politics (1999)',
      'Anarchy is What States Make of It (1992)',
      'Quantum Mind and Social Science (2015)'
    ],
    mainContributions: [
      'Founded social constructivism in IR',
      '"Anarchy is what states make of it" - famous argument',
      'Interests and identities are socially constructed',
      'Material forces matter, but ideas give them meaning',
      'Three cultures of anarchy: Hobbesian, Lockean, Kantian'
    ],
    famousQuote: '"Anarchy is what states make of it."',
    background: 'Professor at Ohio State. Challenged materialist assumptions of realism and liberalism.',
    legacy: 'Made constructivism a major IR theory. Showed how ideas and norms shape international politics.'
  },

  'Hedley Bull': {
    name: 'Hedley Bull',
    lifespan: '1932–1985',
    nationality: 'Australian-British',
    theory: 'English School',
    keyWorks: [
      'The Anarchical Society (1977)',
      'The Control of the Arms Race (1961)',
      'Justice in International Relations (1983)'
    ],
    mainContributions: [
      'Developed English School of IR theory',
      'International society vs. international system distinction',
      'Balance between order and justice',
      'Great power management of international order',
      'Pluralism vs. solidarism debate'
    ],
    famousQuote: '"Order is the first value of international society."',
    background: 'Professor at Oxford and Australian National University. Leader of English School alongside Martin Wight.',
    legacy: 'The Anarchical Society established English School as distinct theoretical tradition between realism and liberalism.'
  },

  'John Mearsheimer': {
    name: 'John Mearsheimer',
    lifespan: '1947–present',
    nationality: 'American',
    theory: 'Offensive Realism',
    keyWorks: [
      'The Tragedy of Great Power Politics (2001)',
      'The Israel Lobby and U.S. Foreign Policy (2007)',
      'The Great Delusion (2018)'
    ],
    mainContributions: [
      'Created offensive realism variant',
      'States seek to maximize power, not just security',
      'Hegemony is ultimate goal for great powers',
      'Geography and stopping power of water matter',
      'Predicted Russia-Ukraine conflict'
    ],
    famousQuote: '"The best guarantee of survival is to be a regional hegemon."',
    background: 'Professor at University of Chicago. Former US Air Force officer. Known for controversial but rigorous arguments.',
    legacy: 'Leading contemporary realist. Applies realism to current events (Ukraine, China, Middle East).'
  },

  'Machiavelli': {
    name: 'Niccolò Machiavelli',
    lifespan: '1469–1527',
    nationality: 'Italian (Florentine)',
    theory: 'Classical Realism',
    keyWorks: [
      'The Prince (1532)',
      'Discourses on Livy (1531)',
      'The Art of War (1521)'
    ],
    mainContributions: [
      'Separated politics from ethics and religion',
      'Advocated for pragmatic statecraft',
      'Power maintenance over moral considerations',
      'Better to be feared than loved (for rulers)',
      'Ends justify means in politics'
    ],
    famousQuote: '"It is better to be feared than loved, if you cannot be both."',
    background: 'Renaissance diplomat and political philosopher in Florence. Wrote during Italian city-state wars.',
    legacy: 'Foundational realist thinker. "Machiavellian" now describes ruthless political pragmatism.'
  },

  'John Herz': {
    name: 'John Herz',
    lifespan: '1908–2005',
    nationality: 'German-American',
    theory: 'Classical Realism / Defensive Realism',
    keyWorks: [
      'Political Realism and Political Idealism (1951)',
      'International Politics in the Atomic Age (1959)',
      'The Security Dilemma in International Relations (1950)'
    ],
    mainContributions: [
      'Coined term "security dilemma"',
      'Explained how defensive actions appear threatening',
      'Spiral model of conflict escalation',
      'Analyzed impact of nuclear weapons on security',
      'Defensive realist perspective'
    ],
    famousQuote: '"Wherever such anarchic society has existed...there has arisen the security dilemma."',
    background: 'Fled Nazi Germany. Professor at City College of New York. Focused on security and arms control.',
    legacy: 'Security dilemma concept is central to understanding arms races and conflict escalation.'
  },

  'Joseph Nye': {
    name: 'Joseph Nye',
    lifespan: '1937–present',
    nationality: 'American',
    theory: 'Neoliberal Institutionalism',
    keyWorks: [
      'Power and Interdependence (1977, with Robert Keohane)',
      'Soft Power (1990)',
      'The Future of Power (2011)'
    ],
    mainContributions: [
      'Complex interdependence theory',
      'Soft power concept',
      'Smart power (combining hard and soft)',
      'Institutions matter even without hegemony',
      'Non-military sources of influence'
    ],
    famousQuote: '"Soft power is the ability to get what you want through attraction rather than coercion."',
    background: 'Professor at Harvard Kennedy School. Former Assistant Secretary of Defense. Dean of Harvard Kennedy School.',
    legacy: 'Soft power concept adopted by governments worldwide. Bridges academic theory and policy practice.'
  },

  'Martha Finnemore': {
    name: 'Martha Finnemore',
    lifespan: '1959–present',
    nationality: 'American',
    theory: 'Constructivism',
    keyWorks: [
      'National Interests in International Society (1996)',
      'The Purpose of Intervention (2003)',
      'Rules for the World (2004, with Michael Barnett)'
    ],
    mainContributions: [
      'Showed how norms shape state interests',
      'International organizations teach states new norms',
      'Humanitarian intervention norms evolved over time',
      'Socialization in international institutions',
      'Norms matter for state behavior'
    ],
    famousQuote: '"States are socialized to want certain things by the international society in which they and the people in them live."',
    background: 'Professor at George Washington University. Leading constructivist scholar.',
    legacy: 'Demonstrated how international norms and institutions construct state interests, not just constrain them.'
  },

  'Nicholas Onuf': {
    name: 'Nicholas Onuf',
    lifespan: '1941–present',
    nationality: 'American',
    theory: 'Constructivism',
    keyWorks: [
      'World of Our Making (1989)',
      'International Legal Theory (2008)',
      'Making Sense, Making Worlds (2013)'
    ],
    mainContributions: [
      'First to use term "constructivism" in IR (1989)',
      'Rules constitute social reality',
      'Language and speech acts create international relations',
      'Bridge between IR and social theory',
      'Constitutive rules vs. regulative rules'
    ],
    famousQuote: '"We make the world in which we live, and it makes us."',
    background: 'Professor at Florida International University. Brought linguistic turn to IR theory.',
    legacy: 'Intellectual founder of constructivism in IR. Influenced Wendt and others.'
  },

  'Martin Wight': {
    name: 'Martin Wight',
    lifespan: '1913–1972',
    nationality: 'British',
    theory: 'English School',
    keyWorks: [
      'Power Politics (1946)',
      'Systems of States (1977, posthumous)',
      'International Theory: The Three Traditions (1991, posthumous)'
    ],
    mainContributions: [
      'Three traditions of IR: Realism, Rationalism, Revolutionism',
      'International society concept',
      'Historical approach to IR theory',
      'Balance of power analysis',
      'Normative dimensions of international relations'
    ],
    famousQuote: '"International society exists when a group of states, conscious of certain common interests and values, form a society in the sense that they conceive themselves to be bound by a common set of rules."',
    background: 'Professor at London School of Economics. Co-founded English School with Hedley Bull.',
    legacy: 'Three traditions framework remains influential. Established English School\'s historical and normative approach.'
  },

  'Adam Watson': {
    name: 'Adam Watson',
    lifespan: '1914–2007',
    nationality: 'British',
    theory: 'English School',
    keyWorks: [
      'The Evolution of International Society (1992)',
      'The Limits of Independence (1997)',
      'Diplomacy: The Dialogue Between States (1982)'
    ],
    mainContributions: [
      'Historical systems of states',
      'Spectrum from anarchy to empire',
      'Evolution of international society',
      'Diplomatic culture and practice',
      'Comparative historical analysis'
    ],
    famousQuote: '"International society is always evolving between the poles of multiple independent states and empire."',
    background: 'British diplomat before becoming scholar. Practical experience informed theoretical work.',
    legacy: 'Historical depth enriched English School. Showed how international societies evolved across civilizations.'
  },

  'Woodrow Wilson': {
    name: 'Woodrow Wilson',
    lifespan: '1856–1924',
    nationality: 'American',
    theory: 'Liberalism (Idealism)',
    keyWorks: [
      'Fourteen Points (1918)',
      'Constitutional Government in the United States (1908)',
      'Congressional Government (1885)'
    ],
    mainContributions: [
      'League of Nations founder',
      'Self-determination principle',
      'Open diplomacy and collective security',
      'International law and organizations for peace',
      'Moral dimension of foreign policy'
    ],
    famousQuote: '"The world must be made safe for democracy."',
    background: '28th US President. Scholar before politician (Princeton professor). Led US in WWI.',
    legacy: 'Wilsonian idealism shaped liberal internationalism. UN Charter reflects his vision despite League\'s failure.'
  },

  'Robert Axelrod': {
    name: 'Robert Axelrod',
    lifespan: '1943–present',
    nationality: 'American',
    theory: 'Neoliberal Institutionalism',
    keyWorks: [
      'The Evolution of Cooperation (1984)',
      'The Complexity of Cooperation (1997)',
      'Harnessing Complexity (1999)'
    ],
    mainContributions: [
      'Game theory applied to cooperation',
      'Tit-for-tat strategy in repeated games',
      'Shadow of the future promotes cooperation',
      'Evolution of cooperation without central authority',
      'Reciprocity as key to sustained cooperation'
    ],
    famousQuote: '"Cooperation can emerge in a world of egoists without central authority."',
    background: 'Professor at University of Michigan. Political scientist using mathematical modeling.',
    legacy: 'Showed cooperation can emerge from self-interest through iteration. Influenced institutional theory.'
  }
};

