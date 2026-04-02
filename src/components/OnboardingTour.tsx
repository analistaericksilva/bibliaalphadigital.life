import { useState, useEffect } from "react";
import {
  Book, Search, BookOpen, BookText, Languages, Users, MapPin,
  Clock, Heart, Calendar, Share2, ChevronRight, ChevronLeft, X, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  icon: typeof Book;
  title: string;
  description: string;
  color: string;
}

const tourSteps: TourStep[] = [
  {
    icon: Sparkles,
    title: "Bem-vindo à Bíblia Alpha",
    description:
      "Uma experiência de leitura bíblica completa com ferramentas de estudo profundo, notas de grandes teólogos e recursos interativos. Vamos conhecer as principais funcionalidades!",
    color: "text-primary",
  },
  {
    icon: Book,
    title: "Navegação por Livros",
    description:
      "Acesse qualquer livro e capítulo da Bíblia pelo menu lateral. Toque em \"Livros\" para abrir o seletor completo com todos os 66 livros organizados por Antigo e Novo Testamento.",
    color: "text-blue-500",
  },
  {
    icon: Search,
    title: "Busca Inteligente",
    description:
      "Encontre qualquer palavra ou expressão em toda a Bíblia. Os resultados mostram o versículo completo com contexto, e você pode clicar para ir diretamente ao texto.",
    color: "text-emerald-500",
  },
  {
    icon: BookOpen,
    title: "Notas de Estudo",
    description:
      "Cada versículo pode conter notas de grandes teólogos como Matthew Henry, Martinho Lutero, João Calvino, Charles Spurgeon e John Wesley. Toque no ícone de nota ao lado do versículo para acessá-las.",
    color: "text-amber-500",
  },
  {
    icon: BookText,
    title: "Dicionário Bíblico",
    description:
      "Consulte definições de termos bíblicos importantes diretamente durante a leitura. O dicionário inclui referências em hebraico e grego para estudo aprofundado.",
    color: "text-violet-500",
  },
  {
    icon: Languages,
    title: "Léxico Strong's",
    description:
      "Acesse o significado original das palavras em hebraico e grego com o sistema de numeração Strong's. Ideal para quem deseja estudar o texto nas línguas originais.",
    color: "text-cyan-500",
  },
  {
    icon: Users,
    title: "Nomes Bíblicos",
    description:
      "Explore informações sobre personagens bíblicos: significado do nome, contexto histórico, família e referências. Um verdadeiro dicionário de pessoas da Bíblia.",
    color: "text-rose-500",
  },
  {
    icon: MapPin,
    title: "Mapa Bíblico",
    description:
      "Visualize os lugares mencionados no texto em um mapa interativo. Veja onde aconteceram os eventos bíblicos e explore a geografia das Escrituras.",
    color: "text-teal-500",
  },
  {
    icon: Heart,
    title: "Favoritos e Destaques",
    description:
      "Toque e segure em qualquer versículo para abrir o menu de ações: marque como favorito, destaque com cores diferentes ou adicione suas notas pessoais.",
    color: "text-red-500",
  },
  {
    icon: Clock,
    title: "Histórico de Leitura",
    description:
      "Seu progresso de leitura é salvo automaticamente. Acesse o histórico a qualquer momento para retomar de onde parou ou revisitar capítulos já lidos.",
    color: "text-orange-500",
  },
  {
    icon: Calendar,
    title: "Planos de Leitura",
    description:
      "Siga planos de leitura temáticos: Vida de Abraão, Mulheres da Bíblia, O Espírito Santo, Profetas Menores e muito mais. Acompanhe seu progresso dia a dia.",
    color: "text-indigo-500",
  },
  {
    icon: Share2,
    title: "Compartilhe a Palavra",
    description:
      "Compartilhe versículos com amigos e familiares diretamente pelo menu de ações do versículo. A Palavra de Deus merece ser espalhada!",
    color: "text-green-500",
  },
];

const ONBOARDING_KEY = "biblia-alpha-onboarding-done";

interface OnboardingTourProps {
  forceShow?: boolean;
}

const OnboardingTour = ({ forceShow }: OnboardingTourProps) => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      setStep(0);
      return;
    }
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      setVisible(true);
    }
  }, [forceShow]);

  const close = () => {
    setVisible(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  };

  const next = () => {
    if (step < tourSteps.length - 1) setStep(step + 1);
    else close();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!visible) return null;

  const current = tourSteps[step];
  const Icon = current.icon;
  const isLast = step === tourSteps.length - 1;
  const isFirst = step === 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      {/* Card */}
      <div className="relative w-full max-w-md bg-paper rounded-lg page-shadow animate-fade-in overflow-hidden">
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon section */}
        <div className="pt-10 pb-6 flex flex-col items-center bg-gradient-to-b from-primary/5 to-transparent">
          <div className={`w-16 h-16 rounded-2xl bg-background flex items-center justify-center page-shadow mb-4`}>
            <Icon className={`w-8 h-8 ${current.color}`} />
          </div>
          <h2 className="text-lg font-serif font-semibold text-foreground text-center px-6">
            {current.title}
          </h2>
        </div>

        {/* Content */}
        <div className="px-8 pb-4">
          <p className="text-sm font-sans text-muted-foreground leading-relaxed text-center">
            {current.description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 py-3">
          {tourSteps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? "bg-primary w-5"
                  : i < step
                  ? "bg-primary/40"
                  : "bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 pb-6 pt-2">
          {isFirst ? (
            <Button variant="ghost" size="sm" onClick={close} className="text-muted-foreground text-xs">
              Pular tour
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={prev} className="text-muted-foreground text-xs gap-1">
              <ChevronLeft className="w-3 h-3" />
              Anterior
            </Button>
          )}

          <span className="text-[10px] font-sans text-muted-foreground tracking-wider">
            {step + 1} / {tourSteps.length}
          </span>

          <Button size="sm" onClick={next} className="gap-1 text-xs">
            {isLast ? "Começar" : "Próximo"}
            {!isLast && <ChevronRight className="w-3 h-3" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
