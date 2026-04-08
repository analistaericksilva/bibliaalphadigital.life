import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles"> | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile;
  isAdmin: boolean;
  isApproved: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  isApproved: false,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsApproved(false);
  }, []);

  const fetchProfileAndRole = useCallback(async (userId: string) => {
    try {
      const [profileRes, adminRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase.rpc("has_role", {
          _user_id: userId,
          _role: "admin",
        }),
      ]);

      if (profileRes.error) {
        console.error("Erro ao buscar perfil:", profileRes.error.message);
      }

      if (adminRes.error) {
        console.error("Erro ao verificar role admin:", adminRes.error.message);
      }

      const profileData = profileRes.data ?? null;

      setProfile(profileData);
      setIsApproved(profileData?.status === "approved");
      setIsAdmin(adminRes.data === true);
    } catch (error) {
      console.error("Falha inesperada ao carregar perfil/permissões:", error);
      setProfile(null);
      setIsApproved(false);
      setIsAdmin(false);
    }
  }, []);

  const hydrateFromSession = useCallback(
    async (nextSession: Session) => {
      setSession(nextSession);
      setUser(nextSession.user ?? null);

      if (nextSession.user) {
        await fetchProfileAndRole(nextSession.user.id);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsApproved(false);
      }
    },
    [fetchProfileAndRole]
  );

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error || !data.session) {
          clearAuthState();
          return;
        }

        await hydrateFromSession(data.session);
      } catch (error) {
        console.error("Falha ao inicializar autenticação:", error);
        clearAuthState();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      if (!nextSession || event === "SIGNED_OUT") {
        clearAuthState();
        setLoading(false);
        return;
      }

      // Atualizações de token não devem quebrar a experiência com loading longo
      if (event === "TOKEN_REFRESHED") {
        setSession(nextSession);
        setUser(nextSession.user ?? null);
        return;
      }

      // Importante: não chamar consultas Supabase diretamente dentro do callback
      // para evitar travamentos no fluxo de autenticação.
      setSession(nextSession);
      setUser(nextSession.user ?? null);
      setLoading(true);

      const sessionSnapshot = nextSession;
      window.setTimeout(() => {
        if (!mounted) return;

        hydrateFromSession(sessionSnapshot)
          .catch((error) => {
            console.error("Falha ao processar mudança de autenticação:", error);
          })
          .finally(() => {
            if (mounted) setLoading(false);
          });
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearAuthState, hydrateFromSession]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isAdmin, isApproved, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
