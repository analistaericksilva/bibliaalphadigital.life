import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bibleBooks } from "@/data/bibleBooks";
import { X, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const getBookName = (bookId: string) => bibleBooks.find((b) => b.id === bookId)?.name || bookId;

const BibleMapPanel = ({ open, onClose, bookId, chapter, onNavigate }: BibleMapPanelProps) => {
  const [allPlaces, setAllPlaces] = useState<BiblePlace[]>([]);
  const [loading, setLoading] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("bible_places")
        .select("*")
        .order("name");
      if (data) setAllPlaces(data as unknown as BiblePlace[]);
      setLoading(false);
    };
    fetchData();
  }, [open]);

  const filteredPlaces = useMemo(() => {
    return allPlaces.filter((p) =>
      p.refs.some((r) => r.b === bookId && r.c === chapter)
    );
  }, [allPlaces, bookId, chapter]);

  // Initialize / update map
  useEffect(() => {
    if (!open || loading || filteredPlaces.length === 0 || !mapContainerRef.current) return;

    // Clean up previous map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapContainerRef.current).setView([31.5, 35.2], 7);
    mapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
    }).addTo(map);

    const bounds = L.latLngBounds(filteredPlaces.map((p) => [p.lat, p.lon]));

    filteredPlaces.forEach((place) => {
      const chapterRefs = place.refs.filter((r) => r.b === bookId && r.c === chapter);
      const refsHtml = chapterRefs
        .map(
          (r) =>
            `<button class="text-xs text-blue-600 hover:underline block" data-book="${r.b}" data-chapter="${r.c}" data-verse="${r.v}">${getBookName(r.b)} ${r.c}:${r.v}</button>`
        )
        .join("");

      const popup = L.popup().setContent(
        `<div class="font-sans text-sm min-w-[150px]">
          <p class="font-bold">${place.name}</p>
          <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">${place.place_type}</p>
          <div class="space-y-0.5 popup-refs">${refsHtml}</div>
        </div>`
      );

      const marker = L.marker([place.lat, place.lon], { icon: goldIcon }).addTo(map);
      marker.bindPopup(popup);

      marker.on("popupopen", () => {
        const container = marker.getPopup()?.getElement();
        if (container) {
          container.querySelectorAll(".popup-refs button").forEach((btn) => {
            btn.addEventListener("click", () => {
              const b = btn.getAttribute("data-book")!;
              const c = Number(btn.getAttribute("data-chapter"));
              const v = Number(btn.getAttribute("data-verse"));
              onNavigate(b, c, v);
              onClose();
            });
          });
        }
      });
    });

    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });

    // Force resize after panel animation
    setTimeout(() => map.invalidateSize(), 300);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [open, loading, filteredPlaces, bookId, chapter, onNavigate, onClose]);

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
                <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
              )}
              {filteredPlaces.length > 0 && (
                <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded px-3 py-2 border border-border z-[1000]">
                  <p className="text-[10px] font-sans text-muted-foreground">
                    {filteredPlaces.length} {filteredPlaces.length === 1 ? "local" : "locais"} encontrados
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BibleMapPanel;
