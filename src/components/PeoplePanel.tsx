import { useState, useEffect } from "react";
import { X, Loader2, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface PersonEntry {
  id: string;
  name: string;
  description: string | null;
  strongs_number: string | null;
  references_list: any;
  person_type: string | null;
}

interface PeoplePanelProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  person: "Pessoa",
  place: "Lugar",
  title: "Título",
  other: "Outro",
};

const TYPE_COLORS: Record<string, string> = {
  person: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  place: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  title: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  other: "bg-muted text-muted-foreground",
};

const PeoplePanel = ({ open, onClose }: PeoplePanelProps) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PersonEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    if (!open || search.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      let query = supabase
        .from("bible_people")
        .select("id, name, description, strongs_number, references_list, person_type")
        .ilike("name", `%${search}%`);

      if (typeFilter !== "all") {
        query = query.eq("person_type", typeFilter);
      }

      const { data } = await query.limit(50);
      setResults((data as PersonEntry[]) || []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [open, search, typeFilter]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/5 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border z-50 animate-fade-in flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-xs tracking-[0.3em] font-sans font-semibold text-foreground">
              NOMES BÍBLICOS
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pessoa, lugar ou título..."
              className="pl-9 text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {["all", "person", "place", "other"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-[10px] tracking-wider font-sans rounded transition-colors ${
                  typeFilter === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-primary/10"
                }`}
              >
                {t === "all" ? "Todos" : TYPE_LABELS[t] || t}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-2 text-[9px] tracking-[0.2em] text-muted-foreground font-sans">
          {results.length > 0
            ? `${results.length} RESULTADO${results.length > 1 ? "S" : ""}`
            : search.length >= 2
            ? "NENHUM RESULTADO"
            : "DIGITE PARA BUSCAR • 4.271 NOMES DISPONÍVEIS"}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading &&
              results.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-serif font-medium text-foreground">
                          {entry.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-sans tracking-wider ${
                            TYPE_COLORS[entry.person_type || "other"]
                          }`}
                        >
                          {TYPE_LABELS[entry.person_type || "other"]}
                        </span>
                      </div>
                      {entry.strongs_number && (
                        <span className="text-[10px] font-mono text-primary">
                          {entry.strongs_number}
                        </span>
                      )}
                    </div>
                  </div>

                  {expanded === entry.id && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      {entry.description && (
                        <p className="text-sm font-serif leading-relaxed text-foreground/90">
                          {entry.description}
                        </p>
                      )}
                      {entry.references_list &&
                        Array.isArray(entry.references_list) &&
                        entry.references_list.length > 0 && (
                          <div>
                            <p className="text-[9px] tracking-[0.2em] text-muted-foreground font-sans mb-1">
                              REFERÊNCIAS
                            </p>
                            <p className="text-xs font-mono text-muted-foreground">
                              {(entry.references_list as string[]).slice(0, 15).join("; ")}
                              {(entry.references_list as string[]).length > 15 && "..."}
                            </p>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ))}

            {!loading && search.length < 2 && (
              <div className="text-center py-12 space-y-3">
                <Users className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground font-sans">
                  Pesquise nomes de pessoas, lugares e títulos bíblicos
                </p>
                <p className="text-xs text-muted-foreground/60 font-sans">
                  Dados do STEPBible TIPNR (CC BY 4.0) — Tyndale House Cambridge
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default PeoplePanel;
