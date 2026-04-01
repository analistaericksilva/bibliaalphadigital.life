import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import logoSrc from "@/assets/star-of-david-logo.png";

const PendingApproval = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-auto px-6 text-center animate-fade-in">
        <img src={logoSrc} alt="Bíblia Alpha" className="w-16 h-16 mx-auto mb-6" width={64} height={64} />
        <h2 className="text-lg tracking-[0.2em] font-sans mb-4 text-foreground">AGUARDANDO APROVAÇÃO</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          Seu cadastro está sendo analisado pelo administrador. Você receberá acesso assim que for aprovado.
        </p>
        <Button
          variant="outline"
          onClick={signOut}
          className="tracking-[0.2em] text-[10px] rounded-none"
        >
          SAIR
        </Button>
      </div>
    </div>
  );
};

export default PendingApproval;
