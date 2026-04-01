import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Check, X, Clock, Users, Shield } from "lucide-react";
import logoSrc from "@/assets/star-of-david-logo.png";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  status: string;
  created_at: string;
}

const Admin = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const updateUserStatus = async (userId: string, status: string) => {
    const { error } = await supabase.from("profiles").update({ status }).eq("user_id", userId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      if (status === "approved") {
        // Also add subscriber role
        await supabase.from("user_roles").upsert({ user_id: userId, role: "subscriber" as any });
      }
      toast({ title: "Atualizado", description: `Usuário ${status === "approved" ? "aprovado" : "rejeitado"} com sucesso.` });
      fetchUsers();
    }
  };

  const filteredUsers = filter === "all" ? users : users.filter((u) => u.status === filter);

  const statusCounts = {
    all: users.length,
    pending: users.filter((u) => u.status === "pending").length,
    approved: users.filter((u) => u.status === "approved").length,
    rejected: users.filter((u) => u.status === "rejected").length,
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full h-16 bg-background/95 backdrop-blur-sm border-b border-border z-50 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <img src={logoSrc} alt="Admin" className="w-6 h-6" width={24} height={24} />
          <span className="text-xs tracking-[0.3em] font-sans font-light text-foreground">ADMINISTRAÇÃO</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-[10px] tracking-widest text-muted-foreground font-sans">ADMIN</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {(["all", "pending", "approved", "rejected"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`p-4 rounded border transition-colors text-left ${
                filter === key ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {key === "all" && <Users className="w-3.5 h-3.5 text-muted-foreground" />}
                {key === "pending" && <Clock className="w-3.5 h-3.5 text-primary" />}
                {key === "approved" && <Check className="w-3.5 h-3.5 text-green-600" />}
                {key === "rejected" && <X className="w-3.5 h-3.5 text-destructive" />}
              </div>
              <p className="text-2xl font-sans font-semibold text-foreground">{statusCounts[key]}</p>
              <p className="text-[9px] tracking-[0.2em] text-muted-foreground font-sans mt-1">
                {key === "all" ? "TOTAL" : key === "pending" ? "PENDENTES" : key === "approved" ? "APROVADOS" : "REJEITADOS"}
              </p>
            </button>
          ))}
        </div>

        {/* User list */}
        <div className="space-y-2">
          {loadingUsers ? (
            <p className="text-center text-muted-foreground text-sm font-sans py-12">Carregando...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm font-sans py-12">Nenhum usuário encontrado.</p>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-card border border-border rounded">
                <div>
                  <p className="text-sm font-sans font-medium text-foreground">{user.full_name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground font-sans">{user.email}</p>
                  <p className="text-[9px] text-muted-foreground font-sans mt-1">
                    {new Date(user.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {user.status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateUserStatus(user.user_id, "approved")}
                        className="text-[9px] tracking-widest rounded-none h-8"
                      >
                        <Check className="w-3 h-3 mr-1" /> APROVAR
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateUserStatus(user.user_id, "rejected")}
                        className="text-[9px] tracking-widest rounded-none h-8"
                      >
                        <X className="w-3 h-3 mr-1" /> REJEITAR
                      </Button>
                    </>
                  ) : (
                    <span className={`text-[9px] tracking-[0.2em] font-sans px-3 py-1 rounded ${
                      user.status === "approved" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}>
                      {user.status === "approved" ? "APROVADO" : "REJEITADO"}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
