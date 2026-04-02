import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import PendingApproval from "./PendingApproval";
import ShelfProductCard from "@/components/ShelfProductCard";
import bibleCover from "@/assets/bible-cover.png";

const Shelf = () => {
  const { user, loading, isApproved, isAdmin, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm tracking-[0.3em] font-sans text-muted-foreground animate-fade-in">
          CARREGANDO...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isApproved && !isAdmin) {
    return <PendingApproval />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header */}
      <header className="w-full flex items-center justify-between px-6 sm:px-10 pt-8 pb-4">
        <div />
        <h1 className="font-serif text-sm sm:text-base tracking-[0.4em] uppercase text-foreground/60 select-none">
          Minha Estante
        </h1>
        <button
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground transition-colors duration-300 p-2"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Subtle divider */}
      <div className="w-16 h-px bg-border mx-auto" />

      {/* Shelf area */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 sm:py-16">
        <div
          className="animate-fade-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 sm:gap-16 max-w-5xl"
        >
          {/* Main product */}
          <ShelfProductCard
            title="Bíblia Alpha"
            subtitle="Edição de Estudo"
            coverImage={bibleCover}
            route="/biblia"
            badge="Principal"
          />

          {/* Future product slots - uncomment when ready
          <ShelfProductCard
            title="Devocional Diário"
            subtitle="365 reflexões"
            coverImage={devocionalCover}
            route="/devocional"
            comingSoon
          />
          <ShelfProductCard
            title="Comentários Bíblicos"
            subtitle="Análise versículo a versículo"
            coverImage={comentariosCover}
            route="/comentarios"
            comingSoon
          />
          */}
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="pb-8 pt-4 text-center">
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground/50">
          Alpha Digital Library
        </p>
      </footer>
    </div>
  );
};

export default Shelf;
