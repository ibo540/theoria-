import { Shield, Users, TrendingUp, Lightbulb, X } from 'lucide-react';

interface EventDetailCardProps {
  title: string;
  type: 'military' | 'diplomatic' | 'economic' | 'ideological';
  placeName?: string;
  country?: string;
  years?: string;
  coordinates?: { lat: number; lng: number };
  realistAnalysis: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const eventTypeConfig = {
  military: { color: '#DC2626', bg: 'bg-red-50', border: 'border-red-600', icon: Shield, label: 'MILITARY' },
  diplomatic: { color: '#2563EB', bg: 'bg-blue-50', border: 'border-blue-600', icon: Users, label: 'DIPLOMATIC' },
  economic: { color: '#10B981', bg: 'bg-green-50', border: 'border-green-600', icon: TrendingUp, label: 'ECONOMIC' },
  ideological: { color: '#F59E0B', bg: 'bg-orange-50', border: 'border-orange-600', icon: Lightbulb, label: 'IDEOLOGICAL' },
};

function EventDetailCard({
  title,
  type,
  placeName = 'Unknown',
  country = 'Unknown',
  years,
  coordinates,
  realistAnalysis,
  onClose,
  showCloseButton = true
}: EventDetailCardProps) {
  const config = eventTypeConfig[type];
  const Icon = config.icon;

  return (
    <div className="font-serif" style={{ minWidth: '300px', maxWidth: '360px' }}>
      {/* Header */}
      <div className={`p-4 ${config.bg} border-b-2 ${config.border} flex items-start justify-between`}>
        <div className="flex items-start space-x-3 flex-1">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: config.color }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base text-gray-900 leading-tight">{title}</h3>
            <div className="mt-1">
              <span 
                className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide"
                style={{ backgroundColor: config.color, color: '#FFFFFF' }}
              >
                {config.label}
              </span>
            </div>
          </div>
        </div>
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="hover:bg-gray-100 rounded p-1 transition-colors ml-2"
            title="Close"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        {/* Location Info */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Location:</span>
            <div className="font-semibold text-gray-900">{placeName}</div>
          </div>
          <div>
            <span className="text-gray-600">Country:</span>
            <div className="font-semibold text-gray-900">{country}</div>
          </div>
        </div>

        {years && (
          <div className="text-sm">
            <span className="text-gray-600">Period:</span>
            <span className="font-semibold text-gray-900 ml-2">{years}</span>
          </div>
        )}

        {coordinates && (
          <div className="text-xs text-gray-500">
            Coordinates: {coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°
          </div>
        )}

        {/* Realist Analysis */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center mb-2">
            <Shield className="w-4 h-4 mr-2 text-red-700" />
            <span className="text-xs uppercase tracking-wide font-bold text-red-900">REALIST ANALYSIS</span>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">
            {realistAnalysis}
          </p>
        </div>
      </div>
    </div>
  );
}

export default EventDetailCard;

