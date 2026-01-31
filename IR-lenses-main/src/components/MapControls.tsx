import { Compass, Ruler } from 'lucide-react';

function MapControls() {
  return (
    <div className="absolute bottom-4 left-4 z-[1001] space-y-2">
      {/* Compass */}
      <div className="bg-white/98 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-300">
        <div className="flex flex-col items-center">
          <Compass className="w-8 h-8 text-gray-700" />
          <div className="mt-1 text-[10px] font-serif font-semibold text-gray-600 uppercase tracking-wide">
            North
          </div>
        </div>
      </div>

      {/* Scale indicator */}
      <div className="bg-white/98 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-300">
        <div className="flex items-center space-x-2">
          <Ruler className="w-4 h-4 text-gray-700" />
          <div className="text-[10px] font-serif text-gray-600">
            <div className="font-semibold uppercase tracking-wide">Scale</div>
            <div className="flex items-center space-x-1 mt-1">
              <div className="w-8 h-0.5 bg-gray-700"></div>
              <span>1000 km</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapControls;

