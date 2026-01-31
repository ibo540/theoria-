import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { HistoricalEvent } from '../types';
import { TrendingUp, Shield, DollarSign, Clock } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DataChartsProps {
  event: HistoricalEvent;
}

function DataCharts({ event }: DataChartsProps) {
  const { data } = event;

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {data.militaryPower && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-red-600 mr-2" />
            <h3 className="text-xl font-bold">Military Power</h3>
          </div>
          <div style={{ height: '250px' }}>
            <Bar
              data={{
                labels: Object.keys(data.militaryPower),
                datasets: [{
                  label: 'Military Power Index',
                  data: Object.values(data.militaryPower),
                  backgroundColor: 'rgba(220, 38, 38, 0.7)',
                  borderColor: 'rgba(220, 38, 38, 1)',
                  borderWidth: 2
                }]
              }}
              options={chartOptions}
            />
          </div>
        </div>
      )}

      {data.economicPower && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-xl font-bold">Economic Power</h3>
          </div>
          <div style={{ height: '250px' }}>
            <Bar
              data={{
                labels: Object.keys(data.economicPower),
                datasets: [{
                  label: 'Economic Power Index',
                  data: Object.values(data.economicPower),
                  backgroundColor: 'rgba(34, 197, 94, 0.7)',
                  borderColor: 'rgba(34, 197, 94, 1)',
                  borderWidth: 2
                }]
              }}
              options={chartOptions}
            />
          </div>
        </div>
      )}

      {data.alliances && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-xl font-bold">Key Alliances</h3>
          </div>
          <ul className="space-y-2">
            {data.alliances.map((alliance, index) => (
              <li key={index} className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 text-sm font-bold">
                  {index + 1}
                </span>
                <span className="text-gray-700">{alliance}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.timeline && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-xl font-bold">Timeline</h3>
          </div>
          <div className="space-y-3">
            {data.timeline.map((item, index) => (
              <div key={index} className="flex items-start">
                <div className="bg-purple-100 text-purple-600 rounded px-2 py-1 text-sm font-bold mr-3 flex-shrink-0">
                  {item.date}
                </div>
                <p className="text-gray-700 text-sm">{item.event}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DataCharts;

