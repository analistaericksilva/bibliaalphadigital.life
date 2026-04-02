import { useAuth } from "@/contexts/AuthContext";
import Reader from "./Reader";
import PendingApproval from "./PendingApproval";

const Index = () => {
  const { user, loading, isApproved, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <p className="text-sm tracking-[0.3em] font-sans text-muted-foreground">CARREGANDO...</p>
        </div>
      </div>
    );
  }

  // Se o usuário estiver logado mas não aprovado/admin, mostra tela de pendente
  if (user && !isApproved && !isAdmin) {
    return <PendingApproval />;
  }

  // Caso contrário (não logado ou logado/aprovado), mostra o Reader
  // O Reader deve lidar com funcionalidades restritas se o usuário não estiver logado
  return <Reader />;
};

export default Index;
