import { useState, useEffect, useRef } from "react";
import { MapPin, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LocationPickerProps {
  value: { lat: number; lng: number; address: string } | null;
  onChange: (loc: { lat: number; lng: number; address: string } | null) => void;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);

  // Charger Leaflet dynamiquement
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).L) { setMapLoaded(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialiser la carte
  useEffect(() => {
    if (!mapLoaded || !mapDivRef.current || mapRef.current) return;
    const L = (window as any).L;
    const defaultLat = value?.lat ?? 36.7538;
    const defaultLng = value?.lng ?? 3.0588;
    const map = L.map(mapDivRef.current).setView([defaultLat, defaultLng], value ? 15 : 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(map);
    mapRef.current = map;

    if (value) {
      const marker = L.marker([value.lat, value.lng]).addTo(map);
      marker.bindPopup(value.address).openPopup();
      markerRef.current = marker;
    }

    map.on("click", async (e: any) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) markerRef.current.remove();
      const L2 = (window as any).L;
      const marker = L2.marker([lat, lng]).addTo(map);
      markerRef.current = marker;
      // Reverse geocoding
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        marker.bindPopup(address).openPopup();
        onChange({ lat, lng, address });
      } catch {
        onChange({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
      }
    });
  }, [mapLoaded]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=5&countrycodes=dz`
      );
      const data = await res.json();
      setResults(data);
    } catch { setResults([]); }
    setLoading(false);
  };

  const selectResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const address = result.display_name;
    onChange({ lat, lng, address });
    setResults([]);
    setSearch(address);
    if (mapRef.current) {
      const L = (window as any).L;
      mapRef.current.setView([lat, lng], 16);
      if (markerRef.current) markerRef.current.remove();
      const marker = L.marker([lat, lng]).addTo(mapRef.current);
      marker.bindPopup(address).openPopup();
      markerRef.current = marker;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Ex: Département Informatique, Université Tlemcen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button type="button" variant="outline" onClick={handleSearch} disabled={loading}>
          {loading ? "..." : "Chercher"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="icon" onClick={() => { onChange(null); setSearch(""); }}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {results.length > 0 && (
        <div className="border rounded-lg shadow-md bg-background z-50 max-h-48 overflow-y-auto">
          {results.map((r, i) => (
            <button key={i} type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-0 flex items-start gap-2"
              onClick={() => selectResult(r)}>
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span className="line-clamp-2">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {value && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 rounded-lg px-3 py-2 border border-primary/20">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="line-clamp-1">{value.address}</span>
        </div>
      )}

      <div
        ref={mapDivRef}
        className="w-full h-64 rounded-xl border overflow-hidden"
        style={{ zIndex: 0 }}
      />
      <p className="text-xs text-muted-foreground">
        Cliquez sur la carte pour placer votre localisation exacte
      </p>
    </div>
  );
}
