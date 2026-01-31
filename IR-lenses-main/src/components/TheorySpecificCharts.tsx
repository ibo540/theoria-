import { Bar, Line, Radar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { HistoricalEvent, Theory } from '../types';
import { Shield, TrendingUp, Users, Scale, Globe, BookOpen } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TheorySpecificChartsProps {
  event: HistoricalEvent;
  theory: Theory;
}

function TheorySpecificCharts({ event, theory }: TheorySpecificChartsProps) {
  const baseOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  // REALISM/NEOREALISM: Focus on Power, Military Capabilities, Security Competition
  if (theory.id === 'classical-realism' || theory.id === 'structural-realism') {
    if (event.id === 'cold-war') {
      return (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Military Expenditure Over Time */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-xl font-bold">Military Expenditure (% of GDP)</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Line
                data={{
                  labels: ['1950', '1960', '1970', '1980', '1990'],
                  datasets: [
                    {
                      label: 'United States',
                      data: [5.2, 8.9, 7.8, 5.7, 5.5],
                      borderColor: '#DC2626',
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      tension: 0.4,
                      fill: true,
                    },
                    {
                      label: 'Soviet Union',
                      data: [11.8, 12.7, 11.2, 13.4, 15.7],
                      borderColor: '#991B1B',
                      backgroundColor: 'rgba(153, 27, 27, 0.1)',
                      tension: 0.4,
                      fill: true,
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 20,
                      title: {
                        display: true,
                        text: '% of GDP'
                      }
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Realist Insight:</strong> Arms race reflects security dilemma - each side's military buildup increases the other's insecurity.
            </p>
          </div>

          {/* Nuclear Warheads */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-6 h-6 text-orange-600 mr-2" />
              <h3 className="text-xl font-bold">Nuclear Warheads Arsenal</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Bar
                data={{
                  labels: ['1960', '1970', '1980', '1990'],
                  datasets: [
                    {
                      label: 'USA',
                      data: [18638, 26008, 23368, 21004],
                      backgroundColor: '#DC2626',
                    },
                    {
                      label: 'USSR',
                      data: [1605, 11643, 30062, 37000],
                      backgroundColor: '#991B1B',
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Number of Warheads'
                      }
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Neorealist Insight:</strong> Nuclear parity created Mutually Assured Destruction (MAD), stabilizing bipolar system through deterrence.
            </p>
          </div>

          {/* Balance of Power Index */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Scale className="w-6 h-6 text-purple-600 mr-2" />
              <h3 className="text-xl font-bold">Composite Power Index (1970)</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Radar
                data={{
                  labels: ['Military', 'Economic', 'Technology', 'Population', 'Territory', 'Alliance Network'],
                  datasets: [
                    {
                      label: 'United States',
                      data: [95, 100, 100, 70, 85, 90],
                      backgroundColor: 'rgba(220, 38, 38, 0.2)',
                      borderColor: '#DC2626',
                      borderWidth: 2,
                    },
                    {
                      label: 'Soviet Union',
                      data: [100, 65, 75, 100, 100, 85],
                      backgroundColor: 'rgba(153, 27, 27, 0.2)',
                      borderColor: '#991B1B',
                      borderWidth: 2,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Realist Analysis:</strong> Multiple capabilities determine power. Rough parity across dimensions maintained bipolar stability.
            </p>
          </div>

          {/* Security Threats Perception */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-xl font-bold">Proxy Conflicts (1947-1991)</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Bar
                data={{
                  labels: ['Europe', 'Asia', 'Middle East', 'Latin America', 'Africa'],
                  datasets: [
                    {
                      label: 'Number of Proxy Conflicts',
                      data: [2, 7, 8, 5, 6],
                      backgroundColor: [
                        '#DC2626',
                        '#EF4444',
                        '#F87171',
                        '#FCA5A5',
                        '#FECACA'
                      ],
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  indexAxis: 'y' as const,
                  scales: {
                    x: {
                      beginAtZero: true,
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Realist Insight:</strong> Zero-sum competition for spheres of influence - gains for one superpower = losses for the other.
            </p>
          </div>
        </div>
      );
    }
  }

  // LIBERALISM: Focus on Democracy, Trade, Cooperation
  if (theory.id === 'liberalism') {
    if (event.id === 'eu-formation') {
      return (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Democratic Development */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-xl font-bold">Democracy Index (Polity IV)</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Line
                data={{
                  labels: ['1950', '1970', '1990', '2000', '2010', '2020'],
                  datasets: [
                    {
                      label: 'EU Average',
                      data: [6.2, 8.5, 9.2, 9.7, 9.8, 9.6],
                      borderColor: '#2563EB',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      tension: 0.4,
                      fill: true,
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 10,
                      title: {
                        display: true,
                        text: 'Democracy Score (0-10)'
                      }
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Liberal Theory:</strong> Democratic peace - democracies rarely fight each other. EU integration reinforced democratic norms.
            </p>
          </div>

          {/* Intra-EU Trade */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-xl font-bold">Intra-EU Trade (% of Total)</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Bar
                data={{
                  labels: ['1960', '1970', '1980', '1990', '2000', '2010', '2020'],
                  datasets: [
                    {
                      label: 'Intra-EU Trade',
                      data: [35, 48, 52, 61, 64, 67, 63],
                      backgroundColor: '#10B981',
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: '% of Total Trade'
                      }
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Liberal Insight:</strong> Economic interdependence makes conflict costly. Trade integration created mutual dependence.
            </p>
          </div>

          {/* Peace Duration */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Globe className="w-6 h-6 text-indigo-600 mr-2" />
              <h3 className="text-xl font-bold">Interstate Conflicts in Europe</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Line
                data={{
                  labels: ['1950-60', '1960-70', '1970-80', '1980-90', '1990-2000', '2000-10', '2010-20'],
                  datasets: [
                    {
                      label: 'Wars between EU Members',
                      data: [0, 0, 0, 0, 0, 0, 0],
                      borderColor: '#4F46E5',
                      backgroundColor: 'rgba(79, 70, 229, 0.1)',
                      tension: 0.4,
                      fill: true,
                    },
                    {
                      label: 'European Wars (non-EU)',
                      data: [3, 2, 1, 2, 4, 1, 1],
                      borderColor: '#DC2626',
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      tension: 0.4,
                      fill: true,
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Number of Conflicts'
                      }
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Liberal Success:</strong> Zero wars between EU members since formation - unprecedented in European history.
            </p>
          </div>

          {/* Institutional Integration */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <BookOpen className="w-6 h-6 text-purple-600 mr-2" />
              <h3 className="text-xl font-bold">EU Integration Depth</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Doughnut
                data={{
                  labels: ['Single Market', 'Common Currency', 'Free Movement', 'Common Policies', 'Political Union'],
                  datasets: [
                    {
                      label: 'Integration Level',
                      data: [100, 70, 90, 65, 40],
                      backgroundColor: [
                        '#2563EB',
                        '#3B82F6',
                        '#60A5FA',
                        '#93C5FD',
                        '#DBEAFE'
                      ],
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Liberal Theory:</strong> Institutions facilitate cooperation by reducing uncertainty and enforcement costs.
            </p>
          </div>
        </div>
      );
    }
  }

  // NEOLIBERALISM: Focus on Institutions, Regimes, Cooperation under Anarchy
  if (theory.id === 'neoliberalism') {
    if (event.id === 'un-formation') {
      return (
        <div className="grid md:grid-cols-2 gap-6">
          {/* UN Membership Growth */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-xl font-bold">UN Membership Growth</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Line
                data={{
                  labels: ['1945', '1955', '1965', '1975', '1985', '1995', '2005', '2020'],
                  datasets: [
                    {
                      label: 'Member States',
                      data: [51, 76, 117, 144, 159, 185, 191, 193],
                      borderColor: '#3B82F6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4,
                      fill: true,
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 200,
                      title: {
                        display: true,
                        text: 'Number of States'
                      }
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Neoliberal Insight:</strong> Near-universal membership shows states value institutions even under anarchy.
            </p>
          </div>

          {/* Treaty Compliance */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <BookOpen className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-xl font-bold">International Treaty Compliance Rate</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Bar
                data={{
                  labels: ['Human Rights', 'Trade', 'Environment', 'Arms Control', 'Maritime'],
                  datasets: [
                    {
                      label: 'Compliance Rate (%)',
                      data: [78, 92, 81, 85, 88],
                      backgroundColor: [
                        '#10B981',
                        '#059669',
                        '#34D399',
                        '#6EE7B7',
                        '#A7F3D0'
                      ],
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Compliance %'
                      }
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Neoliberal Theory:</strong> Institutions create binding commitments and reduce cheating through monitoring and information sharing.
            </p>
          </div>

          {/* Peacekeeping Missions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-indigo-600 mr-2" />
              <h3 className="text-xl font-bold">UN Peacekeeping Operations</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Line
                data={{
                  labels: ['1950', '1960', '1970', '1980', '1990', '2000', '2010', '2020'],
                  datasets: [
                    {
                      label: 'Active Missions',
                      data: [1, 2, 3, 8, 12, 16, 15, 13],
                      borderColor: '#6366F1',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      tension: 0.4,
                      fill: true,
                    },
                    {
                      label: 'Personnel (thousands)',
                      data: [2, 10, 15, 25, 70, 85, 95, 87],
                      borderColor: '#8B5CF6',
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      tension: 0.4,
                      fill: true,
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Neoliberal Success:</strong> Collective security mechanisms work imperfectly but provide tools for managing conflict.
            </p>
          </div>

          {/* Institutional Effectiveness */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Scale className="w-6 h-6 text-purple-600 mr-2" />
              <h3 className="text-xl font-bold">UN Institutional Effectiveness</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Radar
                data={{
                  labels: ['Conflict Resolution', 'Humanitarian Aid', 'Development', 'Health', 'Education', 'Environmental'],
                  datasets: [
                    {
                      label: 'Effectiveness Score',
                      data: [65, 85, 78, 88, 82, 72],
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      borderColor: '#6366F1',
                      borderWidth: 2,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Neoliberal Analysis:</strong> Institutions more effective in functional areas (health, development) than security due to lower sovereignty costs.
            </p>
          </div>
        </div>
      );
    }
  }

  // ENGLISH SCHOOL: Focus on International Society, Norms, Diplomacy
  if (theory.id === 'english-school') {
    if (event.id === 'cold-war') {
      return (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Diplomatic Channels */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-xl font-bold">Diplomatic Engagement Index</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Line
                data={{
                  labels: ['1950', '1960', '1970', '1980', '1990'],
                  datasets: [
                    {
                      label: 'Summit Meetings',
                      data: [2, 5, 12, 18, 24],
                      borderColor: '#059669',
                      backgroundColor: 'rgba(5, 150, 105, 0.1)',
                      tension: 0.4,
                      fill: true,
                    },
                    {
                      label: 'Bilateral Treaties',
                      data: [15, 28, 42, 67, 89],
                      borderColor: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      tension: 0.4,
                      fill: true,
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>English School:</strong> Even during intense rivalry, international society maintained through continuous diplomacy and communication channels.
            </p>
          </div>

          {/* International Law Adherence */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-xl font-bold">Arms Control Treaties Signed</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Bar
                data={{
                  labels: ['1950s', '1960s', '1970s', '1980s', '1990s'],
                  datasets: [
                    {
                      label: 'Major Treaties',
                      data: [1, 4, 8, 7, 12],
                      backgroundColor: [
                        '#10B981',
                        '#059669',
                        '#047857',
                        '#065F46',
                        '#064E3B'
                      ],
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Key Treaties:</strong> Partial Test Ban (1963), NPT (1968), SALT I (1972), INF (1987), START (1991) - norms constraining behavior.
            </p>
          </div>

          {/* Great Power Management */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-purple-600 mr-2" />
              <h3 className="text-xl font-bold">Crisis Management Success Rate</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Doughnut
                data={{
                  labels: ['De-escalated', 'Limited Escalation', 'Proxy Only', 'Near-War'],
                  datasets: [
                    {
                      label: 'Cold War Crises',
                      data: [58, 25, 14, 3],
                      backgroundColor: [
                        '#10B981',
                        '#FCD34D',
                        '#F59E0B',
                        '#DC2626'
                      ],
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>English School Insight:</strong> Great powers managed crises through shared understanding of nuclear war consequences and diplomatic norms.
            </p>
          </div>

          {/* International Society Norms */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Globe className="w-6 h-6 text-indigo-600 mr-2" />
              <h3 className="text-xl font-bold">Norm Compliance in Practice</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Radar
                data={{
                  labels: ['Sovereignty Respect', 'Diplomatic Immunity', 'Non-Nuclear Use', 'Third World Non-Interference', 'UN Procedures', 'Treaty Honor'],
                  datasets: [
                    {
                      label: 'USA Compliance',
                      data: [75, 95, 100, 60, 70, 85],
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      borderColor: '#3B82F6',
                      borderWidth: 2,
                    },
                    {
                      label: 'USSR Compliance',
                      data: [65, 90, 100, 55, 65, 80],
                      backgroundColor: 'rgba(220, 38, 38, 0.2)',
                      borderColor: '#DC2626',
                      borderWidth: 2,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>English School:</strong> Both sides largely observed core norms (nuclear taboo, diplomacy) despite ideological rivalry.
            </p>
          </div>
        </div>
      );
    }
  }

  // CONSTRUCTIVISM: Focus on Identity, Norms, Social Construction
  if (theory.id === 'constructivism') {
    if (event.id === 'cold-war') {
      return (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Identity Shifts */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-yellow-600 mr-2" />
              <h3 className="text-xl font-bold">Soviet Identity Transformation (1985-1991)</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Line
                data={{
                  labels: ['1985', '1986', '1987', '1988', '1989', '1990', '1991'],
                  datasets: [
                    {
                      label: 'References to "Class Struggle"',
                      data: [100, 85, 68, 52, 35, 20, 10],
                      borderColor: '#DC2626',
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      tension: 0.4,
                      fill: true,
                    },
                    {
                      label: 'References to "Common Values"',
                      data: [10, 22, 38, 55, 72, 85, 95],
                      borderColor: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      tension: 0.4,
                      fill: true,
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Frequency in Official Discourse'
                      }
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Constructivist Insight:</strong> Gorbachev's "New Thinking" reconstructed Soviet identity from revolutionary to normal state, enabling Cold War end.
            </p>
          </div>

          {/* Norm Diffusion */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Globe className="w-6 h-6 text-purple-600 mr-2" />
              <h3 className="text-xl font-bold">Norm Acceptance: Human Rights</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Bar
                data={{
                  labels: ['1950', '1960', '1970', '1980', '1990'],
                  datasets: [
                    {
                      label: 'States Accepting HR Norms',
                      data: [12, 25, 42, 68, 95],
                      backgroundColor: '#FCD34D',
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: '% of States'
                      }
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Constructivist Theory:</strong> Human rights norms socially constructed and diffused through international interaction and socialization.
            </p>
          </div>

          {/* Threat Perception Changes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-xl font-bold">US Threat Perception of USSR</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Line
                data={{
                  labels: ['1980', '1982', '1984', '1986', '1988', '1990', '1991'],
                  datasets: [
                    {
                      label: 'Threat Level (Survey Data)',
                      data: [95, 92, 90, 78, 52, 28, 15],
                      borderColor: '#EF4444',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      tension: 0.4,
                      fill: true,
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Perceived Threat %'
                      }
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Constructivist Insight:</strong> "Anarchy is what states make of it" - Soviet capabilities didn't change 1985-91, but US perceptions did due to identity shifts.
            </p>
          </div>

          {/* Cultural/Ideational Factors */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <BookOpen className="w-6 h-6 text-indigo-600 mr-2" />
              <h3 className="text-xl font-bold">Ideational vs Material Explanations</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Radar
                data={{
                  labels: ['Military Balance', 'Economic Capacity', 'Identity Change', 'Norm Evolution', 'Leadership Ideas', 'Social Learning'],
                  datasets: [
                    {
                      label: 'Importance in Ending Cold War',
                      data: [30, 40, 95, 85, 90, 80],
                      backgroundColor: 'rgba(251, 191, 36, 0.2)',
                      borderColor: '#F59E0B',
                      borderWidth: 2,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Constructivist Argument:</strong> Ideas and identity changes (not just material power shifts) ended Cold War peacefully.
            </p>
          </div>
        </div>
      );
    }
  }

  // Additional event-theory combinations for Cuban Missile Crisis
  if (event.id === 'cuban-missile-crisis') {
    if (theory.id === 'classical-realism' || theory.id === 'structural-realism') {
      return (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Crisis Timeline Escalation */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-xl font-bold">Crisis Escalation Level (Oct 1962)</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Line
                data={{
                  labels: ['Oct 14', 'Oct 16', 'Oct 20', 'Oct 22', 'Oct 24', 'Oct 27', 'Oct 28'],
                  datasets: [
                    {
                      label: 'DEFCON Alert Level',
                      data: [5, 3, 3, 2, 2, 1.5, 3],
                      borderColor: '#DC2626',
                      backgroundColor: 'rgba(220, 38, 38, 0.2)',
                      tension: 0.4,
                      fill: true,
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      reverse: true,
                      min: 1,
                      max: 5,
                      title: {
                        display: true,
                        text: 'DEFCON Level (1=highest alert)'
                      }
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Realist Analysis:</strong> Security dilemma nearly led to nuclear war. Rational actors brought to brink by structural pressures.
            </p>
          </div>

          {/* Strategic Balance Impact */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Scale className="w-6 h-6 text-purple-600 mr-2" />
              <h3 className="text-xl font-bold">Strategic Nuclear Balance (1962)</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Bar
                data={{
                  labels: ['ICBMs', 'SLBMs', 'Strategic Bombers', 'Total Warheads'],
                  datasets: [
                    {
                      label: 'United States',
                      data: [203, 144, 1306, 27297],
                      backgroundColor: '#2563EB',
                    },
                    {
                      label: 'Soviet Union (est.)',
                      data: [75, 72, 155, 3322],
                      backgroundColor: '#DC2626',
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      type: 'logarithmic' as const,
                      title: {
                        display: true,
                        text: 'Count (log scale)'
                      }
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Neorealist Insight:</strong> US superiority and Soviet attempt to change balance motivated missile deployment. Power distribution drove crisis.
            </p>
          </div>
        </div>
      );
    }
  }

  // WWI and Security Dilemma
  if (event.id === 'wwi') {
    if (theory.id === 'classical-realism' || theory.id === 'structural-realism') {
      return (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Alliance Commitments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-xl font-bold">Alliance System Rigidity</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Doughnut
                data={{
                  labels: ['Triple Entente', 'Triple Alliance', 'Neutral Powers', 'Colonial Territories'],
                  datasets: [
                    {
                      data: [35, 32, 15, 18],
                      backgroundColor: [
                        '#2563EB',
                        '#DC2626',
                        '#6B7280',
                        '#F59E0B'
                      ],
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Realist Analysis:</strong> Rigid alliance blocs created automatic escalation. Balance of power logic led to world war.
            </p>
          </div>

          {/* Arms Race Pre-WWI */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-orange-600 mr-2" />
              <h3 className="text-xl font-bold">Naval Arms Race (1900-1914)</h3>
            </div>
            <div style={{ height: '300px' }}>
              <Line
                data={{
                  labels: ['1900', '1904', '1908', '1912', '1914'],
                  datasets: [
                    {
                      label: 'British Dreadnoughts',
                      data: [0, 1, 7, 22, 29],
                      borderColor: '#2563EB',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      tension: 0.4,
                      fill: true,
                    },
                    {
                      label: 'German Dreadnoughts',
                      data: [0, 0, 4, 13, 17],
                      borderColor: '#DC2626',
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      tension: 0.4,
                      fill: true,
                    }
                  ]
                }}
                options={{
                  ...baseOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                    }
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Security Dilemma:</strong> British naval supremacy challenged by German buildup. Each side's defensive measures increased other's insecurity.
            </p>
          </div>
        </div>
      );
    }
  }

  // Default: Show general event data
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <p className="text-gray-600 text-center py-8">
        <strong>Select a theory to see specialized professional visualizations.</strong>
        <br />
        <br />
        Different theories focus on different aspects:
        <br />
        • Realism: Power, military capabilities, security competition
        <br />
        • Liberalism: Democracy, trade, cooperation
        <br />
        • Neoliberalism: Institutions, treaties, compliance
        <br />
        • English School: Diplomacy, norms, international society
        <br />
        • Constructivism: Ideas, identity, social construction
      </p>
    </div>
  );
}

export default TheorySpecificCharts;

