# IR Lenses - International Relations Theory Explorer

An interactive educational platform that helps students and professionals understand International Relations theories through visual storytelling and practical scenarios.

## Features

### 🗺️ Theory Explorer
- **Interactive Map Visualization**: View major historical events on an interactive map
- **Theory Lens Overlay**: Apply different IR theories as visual "lenses" that transform how events are interpreted
- **Data Visualizations**: Explore military power, economic indicators, alliances, and timelines
- **Rich Interpretations**: Learn how each theory analyzes the same event differently

### 🧠 Test Your Lens
- **Scenario-Based Quiz**: Answer realistic IR scenarios to discover your theoretical perspective
- **Multiple Theories**: Covers Realism, Liberalism, Neorealism, Neoliberalism, English School, and Constructivism
- **Immediate Feedback**: Get instant explanations for how each answer aligns with different theories
- **Results Analysis**: See which theoretical frameworks align with your worldview

## Theories Covered

- **Classical Realism**: Power politics, national interest, and security competition
- **Structural Realism (Neorealism)**: System structure and balance of power
- **Liberalism**: Democratic peace, institutions, and cooperation
- **Neoliberal Institutionalism**: International institutions facilitating cooperation
- **The English School**: International society, norms, and diplomacy
- **Constructivism**: Social construction of interests and identities

## Historical Events

- The Cold War (1947-1991)
- World War I Outbreak (1914)
- European Union Formation
- Cuban Missile Crisis (1962)
- United Nations Formation (1945)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository or navigate to the project directory

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Leaflet** - Interactive maps
- **Chart.js** - Data visualizations
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/        # Reusable React components
│   ├── TheoryCard.tsx
│   ├── EventCard.tsx
│   ├── MapVisualization.tsx
│   ├── DataCharts.tsx
│   └── InterpretationPanel.tsx
├── data/             # Theory and event data
│   ├── theories.ts
│   ├── events.ts
│   └── scenarios.ts
├── pages/            # Main page components
│   ├── Home.tsx
│   ├── LensExplorer.tsx
│   └── ScenarioQuiz.tsx
├── types.ts          # TypeScript type definitions
├── App.tsx           # Main app component with routing
├── main.tsx          # App entry point
└── index.css         # Global styles
```

## Usage

### Theory Explorer

1. Navigate to "Theory Explorer" from the home page
2. Select a historical event from the available options
3. Choose an IR theory to apply as a lens
4. Watch as the map transforms with the theory's perspective
5. Explore data visualizations and read detailed interpretations

### Test Your Lens

1. Navigate to "Test Your Lens" from the home page
2. Read each scenario carefully
3. Select the option that best represents what you would do
4. Get immediate feedback on which theory aligns with your choice
5. Complete all scenarios to see your overall theoretical profile

## Educational Use

This tool is designed for:
- **Students** learning International Relations theory
- **Educators** teaching IR concepts
- **Researchers** exploring theoretical perspectives
- **Anyone** interested in understanding global politics

## Future Enhancements

Potential additions:
- More historical events (9/11, Arab Spring, etc.)
- Additional theories (Marxism, Feminism, Postcolonialism)
- User accounts to save progress
- Comparison mode to view multiple theories side-by-side
- Custom event creation
- Social sharing of results

## Contributing

This is an educational project. Contributions are welcome to:
- Add more historical events
- Include additional theories
- Improve visualizations
- Fix bugs or improve performance

## License

This project is created for educational purposes.

## Acknowledgments

Built with knowledge from Political Science and International Relations curricula, incorporating perspectives from key thinkers including Hans Morgenthau, Kenneth Waltz, Robert Keohane, Hedley Bull, and Alexander Wendt.

