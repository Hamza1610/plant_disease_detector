"use client";

import { useEffect, useState, useRef } from 'react';
import { useUser } from '@/hooks/useUser';
import { Globe2, ShieldCheck, Zap, TrendingUp, Loader2 } from 'lucide-react';

// 🌍 Enterprise Geographic Coordinate Registry
const COORDINATE_REGISTRY: { [key: string]: [number, number] } = {
  'Nigeria': [9.082, 8.675],
  'Kenya': [-1.292, 36.821],
  'South Africa': [-30.559, 22.937],
  'Ghana': [7.946, -1.023],
  'Ethiopia': [9.145, 40.489],
  'Egypt': [26.820, 30.802],
  'Tanzania': [-6.369, 34.888],
  'Uganda': [1.373, 32.290],
  'Algeria': [28.033, 1.659],
  'Morocco': [31.791, -7.092],
  'Cameroon': [7.369, 12.354],
  'Cote dIvoire': [7.540, -5.547],
  'Senegal': [14.497, -14.452],
  'Zimbabwe': [-19.015, 29.154]
};

export default function GlobalHeatmap() {
  const { user, loading: userLoading } = useUser();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  
  const [stats, setStats] = useState<any>(null);
  const [geospatial, setGeospatial] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Stateful map focus mode: 'africa' | 'global'
  const [viewMode, setViewMode] = useState<'africa' | 'global'>('africa');

  // Step A: Fetch Authentic System Data
  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        const [statsRes, geoRes] = await Promise.all([
          fetch(`${apiUrl}/analytics/summary`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${apiUrl}/analytics/geospatial`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (geoRes.ok) setGeospatial(await geoRes.json());

      } catch (err) {
        console.error('Geospatial sync failure:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchRealTimeData();
  }, [user]);

  // Step B: Dynamic Leaflet Library Assets Injector
  useEffect(() => {
    if (isLoading || userLoading || !mapRef.current || mapLoaded) return;

    const initializeMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      // Initialize Map centered strictly on the African Continent
      const map = L.map(mapRef.current, { 
        zoomControl: false,
        attributionControl: false,
        minZoom: 2,
        maxBounds: [[-60, -180], [85, 180]]
      }).setView([2.0, 22.0], 3); 

      // Inject Premium Stylized Dark Matter tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18
      }).addTo(map);

      // Build Custom Zoom Controls
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Save map instance for flyTo transitions
      mapInstance.current = map;

      // Plot real pulsing markers from database
      geospatial.forEach((node: any) => {
        const country = node.country || node.region || "Unknown";
        const count = node.count || 0;
        const coords = COORDINATE_REGISTRY[country];

        if (coords) {
          const glowColor = count > 100 ? '#ef4444' : count > 20 ? '#eab308' : '#22c55e'; 
          const intensityText = count > 100 ? 'CRITICAL' : count > 20 ? 'MODERATE' : 'SAFE';

          const pinIcon = L.divIcon({
            className: 'custom-leaflet-pin',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            html: `
              <div class="relative w-8 h-8 flex items-center justify-center group cursor-pointer">
                <div class="absolute inset-0 rounded-full opacity-40 animate-ping" style="background-color: ${glowColor}; animation-duration: 2.5s;"></div>
                <div class="absolute inset-2 rounded-full opacity-20 animate-pulse" style="background-color: ${glowColor};"></div>
                <div class="w-4 h-4 rounded-full border border-white shadow-[0_0_12px_${glowColor}]" style="background-color: ${glowColor};"></div>
              </div>
            `
          });

          const marker = L.marker(coords, { icon: pinIcon }).addTo(map);
          
          const popupTemplate = `
            <div style="background: #0a0a0a; color: #fff; border-radius: 12px; border: 1px solid #333; padding: 12px; min-width: 160px; font-family: sans-serif;">
              <h4 style="margin: 0 0 6px; font-weight: 900; color: #22c55e; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase;">${country}</h4>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #888; margin-bottom: 6px;">
                <span>Outbreak Level:</span>
                <strong style="color: ${glowColor}">${intensityText}</strong>
              </div>
              <div style="font-size: 14px; font-weight: 800;">${count.toLocaleString()} <span style="font-size: 10px; font-weight: 400; color: #aaa;">verified scans</span></div>
            </div>
          `;

          marker.bindPopup(popupTemplate, {
            className: 'omnivax-leaflet-popup',
            closeButton: false
          });
        }
      });

      setMapLoaded(true);
    };

    if (!(window as any).L) {
      const leafletLink = document.createElement('link');
      leafletLink.rel = 'stylesheet';
      leafletLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletLink);

      const leafletScript = document.createElement('script');
      leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletScript.async = true;
      leafletScript.onload = initializeMap;
      document.body.appendChild(leafletScript);
    } else {
      initializeMap();
    }
  }, [isLoading, geospatial, userLoading, mapLoaded]);

  // Step C: Watch viewMode and animate/fly map to perspective!
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    if (viewMode === 'africa') {
      mapInstance.current.flyTo([2.0, 22.0], 3, { duration: 1.5, easeLinearity: 0.25 });
    } else {
      mapInstance.current.flyTo([15.0, 0.0], 2, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [viewMode, mapLoaded]);

  if (isLoading || userLoading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-white p-4 md:p-8 relative overflow-hidden animate-fade-in-up">
      
      <div className="absolute -top-40 right-0 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Globe2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Epidemiological Intelligence</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
              Surveillance Map
            </h1>
            <p className="text-gray-400 mt-3 text-base max-w-xl">
              Authentic, production-ready mapping of active crop vector nodes across the continent based on database logs.
            </p>
          </div>
          
          {/* Interactive Region Toggles (Sliding Selector) */}
          <div className="relative flex items-center gap-1 border border-white/10 p-1 rounded-2xl bg-white/5 backdrop-blur-md shrink-0 h-fit select-none">
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-green-500 rounded-xl transition-all duration-500 ease-in-out shadow-[0_0_15px_rgba(34,197,94,0.4)] ${
                viewMode === 'africa' ? 'left-1' : 'left-[calc(50%+3px)]'
              }`}
            />
            <button 
              onClick={() => setViewMode('africa')}
              className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${
                viewMode === 'africa' ? 'text-black' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              African Focus
            </button>
            <button 
              onClick={() => setViewMode('global')}
              className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${
                viewMode === 'global' ? 'text-black' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Expanded Region
            </button>
          </div>
        </header>

        <div className="glass-panel border border-white/5 bg-[#070707] rounded-[2rem] overflow-hidden mb-8 flex flex-col p-6 md:p-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
             <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                Interactive Geospatial Node Map
             </h2>
             <div className="flex flex-wrap gap-4 text-xs text-gray-500 font-medium tracking-wide">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]" /> Safe Density</span>
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-yellow-500 rounded-full shadow-[0_0_5px_rgba(234,179,8,0.5)]" /> Moderate Load</span>
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]" /> Alert Zone</span>
             </div>
          </div>

          <div 
            ref={mapRef} 
            className="w-full aspect-[16/9] md:aspect-[21/9] bg-[#080808] rounded-2xl border border-white/5 overflow-hidden relative z-20 shadow-inner"
            style={{ height: '480px' }}
          />

          <style jsx global>{`
            .leaflet-popup-content-wrapper {
              background: transparent !important;
              border-radius: 12px !important;
              box-shadow: none !important;
              padding: 0 !important;
            }
            .leaflet-popup-tip-container {
              display: none !important;
            }
            .leaflet-container {
              background: #080808 !important;
            }
          `}</style>
        </div>

        {/* 📊 Real-Time Authentic Metrics (Strictly Database Fed!) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
           {[
             { 
               title: "Active Platform Nodes", 
               value: geospatial.length.toString(), // ⚡ Authenticated value (no simulated multipliers!)
               icon: Zap, 
               color: "text-blue-400", 
               detail: `Deployed in ${geospatial.length} unique countries` 
             },
             { 
               title: "Inference Engine Accuracy", 
               value: stats?.average_confidence ? `${stats.average_confidence}%` : "0.0%", 
               icon: ShieldCheck, 
               color: "text-green-400", 
               detail: `Validated on ${stats?.total_scans || 0} events` 
             },
             { 
               title: "Outbreak Outlier Vectors", 
               value: geospatial.filter(n => n.count > 50).length.toString(), 
               icon: TrendingUp, 
               color: "text-emerald-400", 
               detail: "Active containment anomalies" 
             },
           ].map((item, idx) => (
             <div key={idx} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.04] transition-all group">
                <div className="flex items-center gap-3 mb-4">
                   <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                   </div>
                   <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase">{item.title}</h3>
                </div>
                <p className="text-3xl font-black text-white mb-1">{item.value}</p>
                <p className="text-[10px] text-gray-500 tracking-wider font-semibold uppercase font-mono mt-1.5">{item.detail}</p>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
}
