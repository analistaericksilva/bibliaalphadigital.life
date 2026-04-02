import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Mail, Instagram } from "lucide-react";
import ShelfProductCard from "@/components/ShelfProductCard";
import bibleCover from "@/assets/bible-cover.png";
import financeAppCover from "@/assets/finance-app-cover.png";

const Shelf = () => {
  const { user, loading, isApproved, isAdmin, signOut } = useAuth();

  const handleProductClick = () => {
    const loginUrl = `${window.location.origin}/login`;
    const loginWindow = window.open(
      loginUrl,
      "alpha-login",
      "width=560,height=780,resizable=yes,scrollbars=yes"
    );

    loginWindow?.focus();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm tracking-[0.3em] font-sans text-muted-foreground animate-fade-in">
          CARREGANDO...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header */}
      <header className="w-full flex items-center justify-between px-6 sm:px-10 pt-8 pb-4">
        <div />
        <h1 className="font-serif text-sm sm:text-base tracking-[0.4em] uppercase text-foreground/60 select-none">
          Plataforma Alpha de Estudo
        </h1>
        {user ? (
          <button
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground transition-colors duration-300 p-2"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <div />
        )}
      </header>

      {/* Subtle divider */}
      <div className="w-16 h-px bg-border mx-auto" />

      {/* Shelf area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 sm:py-12 gap-10">
        {/* Products grid */}
        <div className="animate-fade-in flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-16">
          <ShelfProductCard
            title="Bíblia Alpha"
            subtitle="Edição de Estudo"
            coverImage={bibleCover}
            route="#"
            badge={user && (isApproved || isAdmin) ? "Acessar" : undefined}
            onCustomClick={handleProductClick}
          />
          <ShelfProductCard
            title="Inteligência Financeira"
            subtitle="Plataforma Digital"
            coverImage={financeAppCover}
            route="https://inteligenciafinanceira.tech/"
            badge="Acessar"
            onCustomClick={() => window.open("https://inteligenciafinanceira.tech/", "_blank")}
          />
        </div>

      </main>

      {/* Footer with support email */}
      <footer className="pb-8 pt-4 flex flex-col items-center gap-4">
        <div className="flex items-center gap-5 flex-wrap justify-center">
          <a
            href="mailto:analista.ericksilva@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground/60 hover:text-primary transition-colors duration-300 text-[11px] tracking-[0.1em]"
          >
            <Mail className="w-4 h-4" />
            Contato
          </a>
          <a
            href="https://www.instagram.com/bibliaalphadigital?igsh=Ym91YmlyNzNzZDU0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground/60 hover:text-primary transition-colors duration-300 text-[11px] tracking-[0.1em]"
          >
            <Instagram className="w-4 h-4" />
            @bibliaalphadigital
          </a>
          <a
            href="https://www.instagram.com/analista.erick?igsh=YnE1aDRibHlqZXpta"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground/60 hover:text-primary transition-colors duration-300 text-[11px] tracking-[0.1em]"
          >
            <Instagram className="w-4 h-4" />
            @analista.erick
          </a>
        </div>
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground/40">
          Alpha Digital Library
        </p>
      </footer>
    </div>
  );
};

export default Shelf;
