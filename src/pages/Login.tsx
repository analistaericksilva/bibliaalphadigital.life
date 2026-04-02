import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import logoSrc from "@/assets/star-of-david-logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-auto px-6 animate-fade-in">
        <div className="text-center mb-16">
          <img src={logoSrc} alt="Bíblia Alpha" className="w-36 h-36 mx-auto mb-8 drop-shadow-xl" width={144} height={144} />
          <h1 className="text-5xl tracking-[0.4em] font-serif font-medium text-foreground leading-tight">
            BÍBLIA
          </h1>
          <p className="text-2xl tracking-[0.6em] font-sans font-light text-primary mt-2">
            ALPHA
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
            disabled={loading}
            className="w-full tracking-[0.3em] text-[10px] font-bold py-6 rounded-none"
          >
            {loading ? "ENTRANDO..." : "ENTRAR"}
          </Button>
        </form>

        <div className="text-center mt-8">
          <Link
            to="/signup"
            className="text-[9px] tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            SOLICITAR ACESSO
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Login;
