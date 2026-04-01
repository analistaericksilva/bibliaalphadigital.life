import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bibleBooks } from "@/data/bibleBooks";
import { X, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const goldIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface BiblePlace {
  id: string;
  name: string;
  lat: number;
  lon: number;
  place_type: string;
  refs: { b: string; c: number; v: number }[];
}

interface BibleMapPanelProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  chapter: number;
  onNavigate: (bookId: string, chapter: number, verse?: number) => void;
}

function FitBounds({ places }: { places: BiblePlace[] }) {
  const map = useMap();
  useEffect(() => {
    if (places.length > 0) {
      const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lon]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
    } else {
      map.setView([31.5, 35.2], 7);
    }
  }, [places, map]);
  return null;
}

const getBookName = (bookId: string) => bibleBooks.find((b) => b.id === bookId)?.name || bookId;

const BibleMapPanel = ({ open, onClose, bookId, chapter, onNavigate }: BibleMapPanelProps) => {
  const [allPlaces, setAllPlaces] = useState<BiblePlace[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("bible_places")
        .select("*")
        .order("name");
      if (data) setAllPlaces(data as BiblePlace[]);
      setLoading(false);
    };
    fetch();
  }, [open]);

  const filteredPlaces = useMemo(() => {
    return allPlaces.filter((p) =>
      p.refs.some((r) => r.b === bookId && r.c === chapter)
    );
  }, [allPlaces, bookId, chapter]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/5 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-background border-l border-border z-50 animate-fade-in flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="text-xs tracking-[0.3em] font-sans font-semibold text-foreground">
              MAPA BÍBLICO — {getBookName(bookId)} {chapter}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {filteredPlaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <MapPin className="w-8 h-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground font-sans">
                    Nenhum local geográfico encontrado para este capítulo.
                  </p>
                </div>
              ) : (
                <MapContainer
                  center={[31.5, 35.2]}
                  zoom={7}
                  style={{ height: "100%", width: "100%" }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FitBounds places={filteredPlaces} />
                  {filteredPlaces.map((place) => (
                    <Marker key={place.id} position={[place.lat, place.lon]} icon={goldIcon}>
                      <Popup>
                        <div className="font-sans text-sm min-w-[150px]">
                          <p className="font-bold text-foreground">{place.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                            {place.place_type}
                          </p>
                          <div className="space-y-0.5">
                            {place.refs
                              .filter((r) => r.b === bookId && r.c === chapter)
                              .map((r, i) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    onNavigate(r.b, r.c, r.v);
                                    onClose();
                                  }}
                                  className="block text-xs text-primary hover:underline"
                                >
                                  {getBookName(r.b)} {r.c}:{r.v}
                                </button>
                              ))}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded px-3 py-2 border border-border z-[1000]">
                <p className="text-[10px] font-sans text-muted-foreground">
                  {filteredPlaces.length} {filteredPlaces.length === 1 ? "local" : "locais"} encontrados
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BibleMapPanel;
