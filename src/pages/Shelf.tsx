import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Mail, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import ShelfProductCard from "@/components/ShelfProductCard";
import bibleCover from "@/assets/bible-cover.png";
import financeAppCover from "@/assets/finance-app-cover.png";

type AuthMode = "login" | "signup";

const Shelf = () => {
  const { user, loading, isApproved, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showPending, setShowPending] = useState(false);

  const handleProductClick = () => {
    if (user && (isApproved || isAdmin)) {
      navigate("/biblia");
      return;
    }
    if (user && !isApproved && !isAdmin) {
      setShowPending(true);
      setShowAuth(false);
      return;
    }
    setShowAuth(true);
    setShowPending(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      setShowAuth(false);
      // Auth state will update, next click will navigate
      toast({ title: "Bem-vindo de volta!" });
    }
    setAuthLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu e-mail para confirmar. Após isso, aguarde a aprovação do administrador.",
      });
      setShowAuth(false);
      setShowPending(true);
    }
    setAuthLoading(false);
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

        {/* Auth panel - appears below the book */}
        {showAuth && !user && (
          <div className="w-full max-w-sm animate-fade-in space-y-6">
            <div className="w-12 h-px bg-border mx-auto" />

            <div className="text-center">
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">
                {authMode === "login" ? "Entrar na plataforma" : "Solicitar acesso"}
              </p>
            </div>

            <form
              onSubmit={authMode === "login" ? handleLogin : handleSignup}
              className="space-y-4"
            >
              {authMode === "signup" && (
                <Input
                  type="text"
                  placeholder="NOME COMPLETO"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="text-center tracking-widest text-sm border-0 border-b rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary"
                  required
                />
              )}
              <Input
                type="email"
                placeholder="E-MAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-center tracking-widest text-sm border-0 border-b rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary"
                required
              />
              <Input
                type="password"
                placeholder="SENHA"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center tracking-widest text-sm border-0 border-b rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary"
                required
              />
              <Button
                type="submit"
                disabled={authLoading}
                className="w-full tracking-[0.3em] text-[10px] font-bold py-6 rounded-none"
              >
                {authLoading
                  ? "AGUARDE..."
                  : authMode === "login"
                  ? "ENTRAR"
                  : "SOLICITAR ACESSO"}
              </Button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                className="text-[10px] tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
              >
                {authMode === "login"
                  ? "AINDA NÃO TEM ACESSO? SOLICITAR CADASTRO"
                  : "JÁ POSSUI CONTA? ENTRAR"}
              </button>
            </div>
          </div>
        )}

        {/* Pending approval message */}
        {showPending && user && !isApproved && !isAdmin && (
          <div className="w-full max-w-sm animate-fade-in text-center space-y-4">
            <div className="w-12 h-px bg-border mx-auto" />
            <p className="font-sans text-xs tracking-[0.15em] uppercase text-muted-foreground">
              Aguardando aprovação
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Seu cadastro está sendo analisado pelo administrador. Você receberá acesso assim que for aprovado.
            </p>
          </div>
        )}
      </main>

      {/* Footer with support email */}
      <footer className="pb-8 pt-4 flex flex-col items-center gap-3">
        <a
          href="mailto:analista.ericksilva@gmail.com"
          className="inline-flex items-center gap-2 text-muted-foreground/60 hover:text-primary transition-colors duration-300 text-xs tracking-[0.1em]"
        >
          <Mail className="w-3.5 h-3.5" />
          analista.ericksilva@gmail.com
        </a>
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground/40">
          Alpha Digital Library
        </p>
      </footer>
    </div>
  );
};

export default Shelf;
