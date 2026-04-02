import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Check, X, Clock, Users, Shield, Ban, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);

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
        await supabase.from("user_roles").upsert({ user_id: userId, role: "subscriber" as any });
      }
      const msg = status === "approved" ? "aprovado" : "bloqueado";
      toast({ title: "Atualizado", description: `Usuário ${msg} com sucesso.` });
      fetchUsers();
    }
  };

  const deleteUser = async (userId: string) => {
    const { data, error } = await supabase.functions.invoke("delete-user", {
      body: { user_id: userId },
    });

    if (error || data?.error) {
      toast({ title: "Erro", description: error?.message || data?.error, variant: "destructive" });
    } else {
      toast({ title: "Excluído", description: "Usuário removido com sucesso." });
      fetchUsers();
    }
    setDeleteTarget(null);
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
                {key === "all" ? "TOTAL" : key === "pending" ? "PENDENTES" : key === "approved" ? "APROVADOS" : "BLOQUEADOS"}
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
                  ) : user.status === "approved" ? (
                    <>
                      <span className="text-[9px] tracking-[0.2em] font-sans px-3 py-1 rounded bg-green-50 text-green-700">
                        APROVADO
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateUserStatus(user.user_id, "rejected")}
                        className="text-[9px] tracking-widest rounded-none h-8 border-orange-300 text-orange-600 hover:bg-orange-50"
                      >
                        <Ban className="w-3 h-3 mr-1" /> BLOQUEAR
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteTarget(user)}
                        className="text-[9px] tracking-widest rounded-none h-8 border-destructive/30 text-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> EXCLUIR
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-[9px] tracking-[0.2em] font-sans px-3 py-1 rounded bg-red-50 text-red-700">
                        BLOQUEADO
                      </span>
                      <Button
                        size="sm"
                        onClick={() => updateUserStatus(user.user_id, "approved")}
                        className="text-[9px] tracking-widest rounded-none h-8"
                      >
                        <Check className="w-3 h-3 mr-1" /> DESBLOQUEAR
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteTarget(user)}
                        className="text-[9px] tracking-widest rounded-none h-8 border-destructive/30 text-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> EXCLUIR
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.full_name || deleteTarget?.email}</strong>? 
              Esta ação é irreversível e todos os dados do usuário serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteUser(deleteTarget.user_id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
