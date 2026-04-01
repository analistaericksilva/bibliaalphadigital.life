import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Book, Search, Settings, Shield, LogOut, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoSrc from "@/assets/star-of-david-logo.png";

interface ReaderHeaderProps {
  onToggleSearch: () => void;
  onToggleBookSelector: () => void;
}

const ReaderHeader = ({ onToggleSearch, onToggleBookSelector }: ReaderHeaderProps) => {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-background/95 backdrop-blur-sm border-b border-border z-50 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-3">
        <img src={logoSrc} alt="Bíblia Alpha" className="w-10 h-10 drop-shadow" width={40} height={40} />
        <div className="hidden sm:block">
          <span className="text-base tracking-[0.3em] font-serif font-medium text-foreground">
            BÍBLIA
          </span>
          <span className="text-xs tracking-[0.4em] font-sans font-light text-primary ml-2">
            ALPHA
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onToggleBookSelector} title="Livros">
          <Book className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleSearch} title="Buscar">
          <Search className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate("/planos")} title="Planos de Leitura">
          <Calendar className="w-4 h-4" />
        </Button>
        {isAdmin && (
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} title="Administração">
            <Shield className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default ReaderHeader;
