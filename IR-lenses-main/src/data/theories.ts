import { Theory } from '../types';

export const theories: Theory[] = [
  {
    id: 'classical-realism',
    name: 'Classical Realism',
    shortName: 'Realism',
    color: '#8B0000',
    description: 'Focuses on power, national interest, and the inherent conflict in international relations. States are the primary actors driven by self-interest and survival.',
    keyPrinciples: [
      'States are primary actors in international relations',
      'International system is anarchic (no overarching authority)',
      'States act rationally in pursuit of national interest',
      'Power is the primary currency in international relations',
      'Morality is subordinate to survival and security'
    ],
    keyThinkers: ['Hans Morgenthau', 'E.H. Carr', 'Thucydides', 'Machiavelli', 'John Herz']
  },
  {
    id: 'structural-realism',
    name: 'Structural Realism (Neorealism)',
    shortName: 'Neorealism',
    color: '#B22222',
    description: 'Emphasizes the structure of the international system rather than human nature. The distribution of power determines state behavior.',
    keyPrinciples: [
      'International system structure determines state behavior',
      'Balance of power is crucial for stability',
      'States seek security through self-help',
      'Relative gains matter more than absolute gains',
      'Bipolar or multipolar systems affect stability differently'
    ],
    keyThinkers: ['Kenneth Waltz', 'John Mearsheimer']
  },
  {
    id: 'liberalism',
    name: 'Liberalism',
    shortName: 'Liberalism',
    color: '#1E90FF',
    description: 'Emphasizes cooperation, international institutions, democracy, and economic interdependence as paths to peace.',
    keyPrinciples: [
      'Democratic peace theory - democracies rarely fight each other',
      'International institutions facilitate cooperation',
      'Economic interdependence reduces conflict',
      'Non-state actors play important roles',
      'Possibility of absolute gains through cooperation'
    ],
    keyThinkers: ['Immanuel Kant', 'Woodrow Wilson', 'Michael Doyle', 'Robert Keohane']
  },
  {
    id: 'neoliberalism',
    name: 'Neoliberal Institutionalism',
    shortName: 'Neoliberalism',
    color: '#4169E1',
    description: 'Accepts realist assumptions about anarchy but argues that international institutions can facilitate cooperation and mitigate conflict.',
    keyPrinciples: [
      'Institutions reduce transaction costs',
      'Regimes create expectations and reduce uncertainty',
      'Cooperation possible even under anarchy',
      'Information sharing promotes trust',
      'Iteration and reciprocity encourage cooperation'
    ],
    keyThinkers: ['Robert Keohane', 'Joseph Nye', 'Robert Axelrod']
  },
  {
    id: 'english-school',
    name: 'The English School',
    shortName: 'English School',
    color: '#2E8B57',
    description: 'Focuses on international society, shared norms, and the balance between order and justice in the international system.',
    keyPrinciples: [
      'International society exists beyond mere system',
      'Shared norms and values shape state behavior',
      'Balance between pluralism and solidarism',
      'Importance of diplomacy and international law',
      'Great powers have special responsibilities'
    ],
    keyThinkers: ['Hedley Bull', 'Martin Wight', 'Adam Watson']
  },
  {
    id: 'constructivism',
    name: 'Constructivism',
    shortName: 'Constructivism',
    color: '#FFD700',
    description: 'Emphasizes that international relations are socially constructed through ideas, identities, and norms rather than material forces alone.',
    keyPrinciples: [
      'Interests and identities are socially constructed',
      'Ideas and norms shape state behavior',
      'Anarchy is what states make of it',
      'Change is possible through social interaction',
      'Culture and identity matter in IR'
    ],
    keyThinkers: ['Alexander Wendt', 'Martha Finnemore', 'Nicholas Onuf']
  }
];

