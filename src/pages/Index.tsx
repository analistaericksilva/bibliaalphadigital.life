import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isApproved && !isAdmin) {
    return <PendingApproval />;
  }

  return <Reader />;
};

export default Index;
