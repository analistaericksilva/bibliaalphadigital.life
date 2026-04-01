import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, BookOpen, Calendar, Clock, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import logoSrc from "@/assets/star-of-david-logo.png";

interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  type: string;
  total_days: number;
}

interface PlanDay {
  id: string;
  day_number: number;
  title: string | null;
  readings: Array<{
    book_id: string;
    book_name: string;
    chapter_start: number;
    chapter_end: number;
  }>;
  devotional_text: string | null;
}

const typeIcons: Record<string, typeof Calendar> = {
  annual: Calendar,
  semester: Clock,
  thematic: BookOpen,
};

const typeLabels: Record<string, string> = {
  annual: "ANUAL",
  semester: "SEMESTRAL",
  thematic: "TEMÁTICO",
};

const ReadingPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ReadingPlan | null>(null);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingDays, setLoadingDays] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from("reading_plans")
        .select("*")
        .order("type")
        .order("total_days");
      if (data) setPlans(data);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const openPlan = async (plan: ReadingPlan) => {
    setSelectedPlan(plan);
    setLoadingDays(true);

    const [daysRes, progressRes] = await Promise.all([
      supabase
        .from("reading_plan_days")
        .select("*")
        .eq("plan_id", plan.id)
        .order("day_number"),
      user
        ? supabase
            .from("user_plan_progress")
            .select("day_number")
            .eq("plan_id", plan.id)
            .eq("user_id", user.id)
        : Promise.resolve({ data: [] }),
    ]);

    if (daysRes.data) {
      setDays(
        daysRes.data.map((d: any) => ({
          ...d,
          readings: Array.isArray(d.readings) ? d.readings : JSON.parse(d.readings || "[]"),
        }))
      );
    }
    if (progressRes.data) {
      setCompletedDays(new Set(progressRes.data.map((p: any) => p.day_number)));
    }
    setLoadingDays(false);
  };

  const toggleDay = async (dayNumber: number) => {
    if (!user || !selectedPlan) return;
    const isCompleted = completedDays.has(dayNumber);

    if (isCompleted) {
      await supabase
        .from("user_plan_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("plan_id", selectedPlan.id)
        .eq("day_number", dayNumber);
      setCompletedDays((prev) => {
        const next = new Set(prev);
        next.delete(dayNumber);
        return next;
      });
    } else {
      await supabase.from("user_plan_progress").insert({
        user_id: user.id,
        plan_id: selectedPlan.id,
        day_number: dayNumber,
      });
      setCompletedDays((prev) => new Set(prev).add(dayNumber));
    }
  };

  const goToReading = (bookId: string, chapter: number) => {
    navigate(`/?book=${bookId}&chapter=${chapter}`);
  };

  const progressPercent = selectedPlan
    ? Math.round((completedDays.size / selectedPlan.total_days) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full h-16 bg-background/95 backdrop-blur-sm border-b border-border z-50 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => (selectedPlan ? setSelectedPlan(null) : navigate("/"))}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <img src={logoSrc} alt="Bíblia Alpha" className="w-8 h-8 drop-shadow" />
          <span className="text-xs tracking-[0.3em] font-sans font-semibold text-foreground">
            {selectedPlan ? selectedPlan.name.toUpperCase() : "PLANOS DE LEITURA"}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 pt-24 pb-16">
        {!selectedPlan ? (
          /* Plan list */
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-2">
                Planos de Leitura
              </h1>
              <p className="text-sm text-muted-foreground font-sans">
                Escolha um plano e acompanhe seu progresso diário
              </p>
            </div>

            {/* Group by type */}
            {["annual", "semester", "thematic"].map((type) => {
              const typePlans = plans.filter((p) => p.type === type);
              if (typePlans.length === 0) return null;
              return (
                <div key={type} className="mb-8">
                  <h2 className="text-[10px] tracking-[0.4em] font-sans font-semibold text-muted-foreground mb-3">
                    {typeLabels[type]}
                  </h2>
                  <div className="space-y-3">
                    {typePlans.map((plan) => {
                      const Icon = typeIcons[plan.type] || BookOpen;
                      return (
                        <button
                          key={plan.id}
                          onClick={() => openPlan(plan)}
                          className="w-full text-left bg-paper page-shadow rounded p-5 hover:bg-primary/5 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-base font-serif font-medium text-foreground">
                                {plan.name}
                              </h3>
                              <p className="text-sm text-muted-foreground font-sans mt-1">
                                {plan.description}
                              </p>
                              <p className="text-[10px] tracking-[0.2em] text-muted-foreground font-sans mt-2">
                                {plan.total_days} DIAS
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Plan detail */
          <div className="animate-fade-in">
            {/* Progress */}
            <div className="bg-paper page-shadow rounded p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-sans font-medium text-foreground">Progresso</span>
                <span className="text-sm font-sans font-semibold text-primary">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground font-sans mt-2">
                {completedDays.size} de {selectedPlan.total_days} dias concluídos
              </p>
            </div>

            {loadingDays ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {days.map((day) => {
                  const done = completedDays.has(day.day_number);
                  return (
                    <div
                      key={day.day_number}
                      className={`bg-paper rounded p-4 border transition-colors ${
                        done ? "border-primary/30 bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleDay(day.day_number)}
                          className="mt-0.5 flex-shrink-0"
                        >
                          {done ? (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className="text-xs font-sans font-semibold text-muted-foreground mb-1">
                            DIA {day.day_number}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {day.readings.map((r, i) => (
                              <button
                                key={i}
                                onClick={() => goToReading(r.book_id, r.chapter_start)}
                                className="text-sm font-serif text-primary hover:underline"
                              >
                                {r.book_name} {r.chapter_start}
                                {r.chapter_end !== r.chapter_start ? `–${r.chapter_end}` : ""}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ReadingPlans;
