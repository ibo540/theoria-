export interface Theory {
  id: string;
  name: string;
  shortName: string;
  color: string;
  description: string;
  keyPrinciples: string[];
  keyThinkers: string[];
}

export interface HistoricalEvent {
  id: string;
  name: string;
  year: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  zoom: number;
  actors: string[];
  data: EventData;
}

export interface EventData {
  militaryPower?: { [key: string]: number };
  economicPower?: { [key: string]: number };
  alliances?: string[];
  timeline?: TimelineEvent[];
}

export interface TimelineEvent {
  date: string;
  event: string;
}

export interface TheoryInterpretation {
  theoryId: string;
  eventId: string;
  interpretation: string;
  keyPoints: string[];
  visualElements: VisualElement[];
}

export interface VisualElement {
  type: 'arrow' | 'circle' | 'line' | 'marker';
  coordinates: [number, number][];
  label: string;
  color: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  situation: string;
  options: ScenarioOption[];
}

export interface ScenarioOption {
  text: string;
  theoryAlignment: string;
  explanation: string;
}

