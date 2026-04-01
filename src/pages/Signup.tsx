import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import logoSrc from "@/assets/star-of-david-logo.png";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm mx-auto px-6 text-center animate-fade-in">
          <img src={logoSrc} alt="Bíblia Alpha" className="w-24 h-24 mx-auto mb-6 drop-shadow-lg" width={96} height={96} />
          <h2 className="text-lg tracking-[0.2em] font-sans mb-4 text-foreground">SOLICITAÇÃO ENVIADA</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sua solicitação de acesso foi enviada. Aguarde a aprovação do administrador para acessar a plataforma.
          </p>
          <Link to="/login" className="inline-block mt-8">
            <Button variant="outline" className="tracking-[0.2em] text-[10px] rounded-none">
              VOLTAR AO LOGIN
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-auto px-6 animate-fade-in">
        <div className="text-center mb-16">
          <img src={logoSrc} alt="Bíblia Alpha" className="w-24 h-24 mx-auto mb-8 drop-shadow-lg" width={96} height={96} />
          <h1 className="text-4xl tracking-[0.4em] font-serif font-medium text-foreground">
            SOLICITAR
          </h1>
          <p className="text-xl tracking-[0.6em] font-sans font-light text-primary mt-2">
            ACESSO
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            type="text"
            placeholder="NOME COMPLETO"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="text-center tracking-widest text-sm border-0 border-b rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary"
            required
          />
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
            placeholder="CRIAR SENHA"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-center tracking-widest text-sm border-0 border-b rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary"
            required
            minLength={6}
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full tracking-[0.3em] text-[10px] font-bold py-6 rounded-none"
          >
            {loading ? "ENVIANDO..." : "SOLICITAR ACESSO"}
          </Button>
        </form>

        <div className="text-center mt-8">
          <Link
            to="/login"
            className="text-[9px] tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            JÁ TENHO ACESSO
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
