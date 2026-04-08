import type { ComponentType } from "react";
import { AppWindow, Share2, Sparkles, Smartphone, ExternalLink, BookOpen, WandSparkles, Brain, MonitorUp } from "lucide-react";
import { SiWhatsapp, SiTelegram, SiGmail, SiNotion, SiGoogledrive, SiYoutube, SiGooglecalendar, SiDiscord } from "react-icons/si";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type AppIcon = ComponentType<{ className?: string }>;

interface AppActionProps {
  icon: AppIcon;
  title: string;
  description: string;
  onClick: () => void;
  color?: string;
}

const AppAction = ({ icon: Icon, title, description, onClick, color }: AppActionProps) => (
  <button
    onClick={onClick}
    className="manus-app-card group text-left"
    type="button"
  >
    <div className={cn("p-2 rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white", color)}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-semibold text-foreground truncate">{title}</h4>
      <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
    </div>
    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
  </button>
);

export const BibleApplications = () => {
  const { toast } = useToast();

  const openExternal = (url: string, label: string) => {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (win) {
      toast({ title: `${label} aberto`, description: "Nova aba iniciada com sucesso." });
      return;
    }

    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Pop-up bloqueado", description: `Link de ${label} copiado para a área de transferência.` });
    });
  };

  const shareCurrentChapter = async () => {
    const shareText = `📖 ${document.title}\n${window.location.href}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Bíblia Alpha",
          text: "Compartilhar capítulo atual",
          url: window.location.href,
        });
        toast({ title: "Compartilhado", description: "Capítulo enviado com sucesso." });
        return;
      } catch {
        // cancelado pelo usuário
      }
    }

    await navigator.clipboard.writeText(shareText);
    toast({ title: "Copiado para compartilhar", description: "Texto pronto para WhatsApp, e-mail ou rede social." });
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`📖 Estudo bíblico\n${window.location.href}`);
    openExternal(`https://wa.me/?text=${text}`, "WhatsApp");
  };

  const copyAiStudyPrompt = async () => {
    const prompt = `Faça um resumo prático de ${document.title}. Inclua: tema central, aplicações e uma oração final.`;
    await navigator.clipboard.writeText(prompt);
    toast({ title: "Prompt copiado", description: "Prompt de estudo com IA pronto para colar." });
  };

  const togglePresentationMode = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      toast({ title: "Modo apresentação", description: "Tela cheia ativada para leitura." });
      return;
    }

    await document.exitFullscreen();
    toast({ title: "Modo apresentação", description: "Tela cheia desativada." });
  };

  const runButtonChecks = () => {
    const hasShare = !!navigator.share || !!navigator.clipboard;
    const checks = [
      { label: "WhatsApp", ok: true },
      { label: "Telegram", ok: true },
      { label: "Gmail", ok: true },
      { label: "Notion", ok: true },
      { label: "Google Drive", ok: true },
      { label: "Prompt IA", ok: !!navigator.clipboard },
      { label: "Apresentação", ok: !!document.documentElement.requestFullscreen },
      { label: "Compartilhar", ok: hasShare },
    ];

    const failed = checks.filter((c) => !c.ok);
    if (failed.length === 0) {
      toast({
        title: "Ferramentas verificadas",
        description: "Conexões sociais e produtividade prontas para uso.",
      });
      return;
    }

    toast({
      title: "Verificação parcial",
      description: `Ajustar: ${failed.map((f) => f.label).join(", ")}`,
      variant: "destructive",
    });
  };

  const socialActions: AppActionProps[] = [
    {
      icon: SiWhatsapp,
      title: "WhatsApp",
      description: "Compartilhe rapidamente o capítulo atual no WhatsApp.",
      onClick: shareToWhatsApp,
      color: "bg-emerald-500/15 text-emerald-500",
    },
    {
      icon: SiTelegram,
      title: "Telegram",
      description: "Abra o Telegram Web para enviar insights e referências.",
      onClick: () => openExternal("https://web.telegram.org/", "Telegram"),
      color: "bg-sky-500/15 text-sky-500",
    },
    {
      icon: SiGmail,
      title: "Gmail",
      description: "Crie um e-mail novo para compartilhar seu estudo.",
      onClick: () => openExternal("https://mail.google.com/mail/u/0/#inbox?compose=new", "Gmail"),
      color: "bg-rose-500/15 text-rose-500",
    },
    {
      icon: SiNotion,
      title: "Notion",
      description: "Abra seu workspace e documente os tópicos do capítulo.",
      onClick: () => openExternal("https://www.notion.so/", "Notion"),
      color: "bg-zinc-500/15 text-zinc-400",
    },
    {
      icon: SiGoogledrive,
      title: "Google Drive",
      description: "Guarde markdown, PDFs e materiais de aula no Drive.",
      onClick: () => openExternal("https://drive.google.com/", "Google Drive"),
      color: "bg-indigo-500/15 text-indigo-400",
    },
    {
      icon: SiGooglecalendar,
      title: "Google Agenda",
      description: "Planeje seu cronograma de leitura e revisão bíblica.",
      onClick: () => openExternal("https://calendar.google.com/", "Google Agenda"),
      color: "bg-blue-500/15 text-blue-400",
    },
    {
      icon: SiYoutube,
      title: "YouTube",
      description: "Abra conteúdos em vídeo para aprofundar o estudo.",
      onClick: () => openExternal("https://www.youtube.com/results?search_query=estudo+b%C3%ADblico", "YouTube"),
      color: "bg-red-500/15 text-red-500",
    },
    {
      icon: SiDiscord,
      title: "Discord",
      description: "Converse com sua comunidade em canais de discipulado.",
      onClick: () => openExternal("https://discord.com/app", "Discord"),
      color: "bg-violet-500/15 text-violet-400",
    },
  ];

  const utilityActions: AppActionProps[] = [
    {
      icon: Smartphone,
      title: "Conectar dispositivos",
      description: "Abra a central de conexão e sincronize sua leitura.",
      onClick: () => openExternal("https://bibliaalpha.com/shelf", "Central de conexão"),
      color: "bg-cyan-500/15 text-cyan-400",
    },
    {
      icon: Share2,
      title: "Compartilhar capítulo",
      description: "Use compartilhamento nativo com fallback de cópia.",
      onClick: shareCurrentChapter,
      color: "bg-green-500/15 text-green-400",
    },
    {
      icon: AppWindow,
      title: "Exportar para ferramentas",
      description: "Acesse integrações e fluxo externo da plataforma.",
      onClick: () => openExternal("https://bibliaalpha.com/", "Integrações"),
      color: "bg-purple-500/15 text-purple-400",
    },
    {
      icon: WandSparkles,
      title: "Ferramentas avançadas",
      description: "Atalhos para produtividade e automações de estudo.",
      onClick: () => openExternal("https://bibliaalpha.com/biblia", "Ferramentas avançadas"),
      color: "bg-amber-500/15 text-amber-400",
    },
    {
      icon: Brain,
      title: "Prompt de estudo com IA",
      description: "Copie um prompt pronto para gerar resumo e aplicações.",
      onClick: copyAiStudyPrompt,
      color: "bg-fuchsia-500/15 text-fuchsia-400",
    },
    {
      icon: MonitorUp,
      title: "Modo apresentação",
      description: "Ative tela cheia para leitura em grupo e projeção.",
      onClick: togglePresentationMode,
      color: "bg-slate-500/15 text-slate-300",
    },
  ];

  return (
    <div className="mt-12 mb-8 border-t border-border/50 pt-8 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold tracking-tight">Conexões BrowserOS</h3>
      </div>

      <div className="reader-surface p-4 md:p-5 mb-5 bg-gradient-to-br from-background/80 via-card/70 to-background/70">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground mb-3">REDES E PLATAFORMAS</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {socialActions.map((action) => (
            <AppAction key={action.title} {...action} />
          ))}
        </div>
      </div>

      <div className="reader-surface p-4 md:p-5 bg-gradient-to-br from-background/80 via-card/70 to-background/70">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground mb-3">FERRAMENTAS RÁPIDAS</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {utilityActions.map((action) => (
            <AppAction key={action.title} {...action} />
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Teste rápido das conexões e ferramentas</p>
            <p className="text-xs text-muted-foreground">Valide redes sociais, compartilhamento e integrações em 1 clique.</p>
          </div>
        </div>
        <button
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          onClick={runButtonChecks}
          type="button"
        >
          Executar teste
        </button>
      </div>
    </div>
  );
};

export default BibleApplications;
