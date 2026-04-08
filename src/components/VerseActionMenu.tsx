import { useState } from "react";
import { Heart, Highlighter, MessageSquarePlus, Share2, X, Sparkles, Zap, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface VerseActionMenuProps {
  verse: number;
  verseText: string;
  bookName: string;
  chapter: number;
  x: number;
  y: number;
  isFavorite: boolean;
  highlightColor: string | null;
  existingNote: string;
  onClose: () => void;
  onToggleFavorite: () => void;
  onHighlight: (color: string) => void;
  onSaveNote: (content: string) => void;
}

const HIGHLIGHT_COLORS = [
  { name: "Amarelo", value: "yellow", class: "bg-yellow-400 shadow-yellow-400/50" },
  { name: "Verde", value: "green", class: "bg-green-400 shadow-green-400/50" },
  { name: "Azul", value: "blue", class: "bg-blue-400 shadow-blue-400/50" },
  { name: "Rosa", value: "pink", class: "bg-pink-400 shadow-pink-400/50" },
  { name: "Laranja", value: "orange", class: "bg-orange-400 shadow-orange-400/50" },
];

const VerseActionMenu = ({
  verse,
  verseText,
  bookName,
  chapter,
  x,
  y,
  isFavorite,
  highlightColor,
  existingNote,
  onClose,
  onToggleFavorite,
  onHighlight,
  onSaveNote,
}: VerseActionMenuProps) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState(existingNote);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isHovering, setIsHovering] = useState<string | null>(null);

  const shareText = `"${verseText}"\n— ${bookName} ${chapter}:${verse} (Bíblia Alpha)`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareText);
    onClose();
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    onClose();
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`, "_blank");
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-50 bg-gradient-to-br from-background/98 via-background/95 to-primary/5 backdrop-blur-xl border border-border/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.05)] p-4 min-w-[280px] animate-in fade-in zoom-in-95 duration-200"
        style={{
          left: Math.min(x, window.innerWidth - 300),
          top: Math.min(y, window.innerHeight - 400),
        }}
      >
        {/* Header com gradiente AI-style */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/80 to-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-primary tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3" />
                VERSÍCULO {verse}
              </span>
              <p className="text-[10px] text-muted-foreground font-medium">{bookName} {chapter}:{verse}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-muted/50" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Botões de ação com estilo AI */}
        <div className="space-y-2">
          {/* Favorite */}
          <button
            onClick={() => { onToggleFavorite(); onClose(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isFavorite 
                ? "bg-gradient-to-r from-pink-500/20 to-red-500/20 border border-pink-500/30 text-pink-600" 
                : "hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 border border-transparent"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isFavorite ? "bg-pink-500/20" : "bg-muted"}`}>
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-pink-500 text-pink-500" : ""}`} />
            </div>
            {isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          </button>

          {/* Highlight colors - AI Style pill buttons */}
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Highlighter className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex gap-1.5">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { onHighlight(c.value); onClose(); }}
                  onMouseEnter={() => setIsHovering(c.value)}
                  onMouseLeave={() => setIsHovering(null)}
                  className={`w-7 h-7 rounded-full border-2 transition-all duration-200 shadow-lg ${
                    highlightColor === c.value 
                      ? `border-foreground scale-110 ring-2 ring-primary/30 ${c.class}` 
                      : `border-white/30 hover:border-white/60 hover:scale-105 ${c.class}`
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Note com estilo AI */}
          {!showNoteInput ? (
            <button
              onClick={() => setShowNoteInput(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 border border-transparent transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <MessageSquarePlus className="w-4 h-4" />
              </div>
              {existingNote ? "Editar minha nota" : "Adicionar nota pessoal"}
            </button>
          ) : (
            <div className="space-y-3 p-2 bg-gradient-to-br from-muted/30 to-transparent rounded-xl border border-border/20">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Escreva sua reflexão sobre este versículo..."
                className="text-sm min-h-[80px] font-sans bg-background/60 border-border/30 rounded-lg resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-lg text-xs font-medium"
                  onClick={() => { onSaveNote(noteText); onClose(); }}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Salvar nota
                </Button>
                {existingNote && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs rounded-lg border-red-500/30 text-red-500 hover:bg-red-500/10"
                    onClick={() => { onSaveNote(""); onClose(); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs rounded-lg"
                  onClick={() => setShowNoteInput(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Compartilhamento */}
          {!showShareOptions ? (
            <button
              onClick={() => setShowShareOptions(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 border border-transparent transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              Compartilhar versículo
            </button>
          ) : (
            <div className="space-y-2 p-2 bg-gradient-to-br from-muted/20 to-transparent rounded-xl border border-border/20">
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-sm font-medium transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copiar texto
              </button>
              <button
                onClick={shareWhatsApp}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-sm font-medium transition-colors"
              >
                <span className="w-5 h-5 flex items-center justify-center">💬</span>
                WhatsApp
              </button>
              <button
                onClick={shareFacebook}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-sm font-medium transition-colors"
              >
                <span className="w-5 h-5 flex items-center justify-center">📘</span>
                Facebook
              </button>
            </div>
          )}
        </div>

        {/* Footer estilo AI */}
        <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Bíblia Alpha • IA bíblica
          </span>
        </div>
      </div>
    </>
  );
};

export default VerseActionMenu;
