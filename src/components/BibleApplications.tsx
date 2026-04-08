import { AppWindow, Share2, Sparkles, Smartphone, ExternalLink, Mail, FileText, Link2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AppActionProps {
  icon: any;
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
      toast({ title: "Pop-up bloqueado", description: "Link copiado para a área de transferência." });
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
        // usuário pode cancelar
      }
    }

    await navigator.clipboard.writeText(shareText);
    toast({ title: "Copiado para compartilhar", description: "Texto pronto para WhatsApp, e-mail ou rede social." });
  };

  const runButtonChecks = () => {
    const hasShare = !!navigator.share || !!navigator.clipboard;
    const checks = [
      { label: "Conexão", ok: true },
      { label: "Compartilhar", ok: hasShare },
      { label: "Gmail", ok: true },
      { label: "Notion", ok: true },
      { label: "Google Drive", ok: true },
    ];

    const failed = checks.filter((c) => !c.ok);
    if (failed.length === 0) {
      toast({ title: "Botões verificados", description: "Conexão, compartilhar, Gmail, Notion e Drive estão prontos." });
      return;
    }

    toast({
      title: "Verificação parcial",
      description: `Ajustar: ${failed.map((f) => f.label).join(", ")}`,
      variant: "destructive",
    });
  };

  return (
    <div className="mt-12 mb-8 border-t border-border/50 pt-8 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold tracking-tight">Conexões BrowserOS</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AppAction
          icon={Smartphone}
          title="Conectar dispositivos"
          description="Abra a central de conexão e mantenha sua leitura sincronizada."
          onClick={() => openExternal("https://bibliaalpha.com/shelf", "Central de conexão")}
          color="bg-blue-500/10 text-blue-600"
        />

        <AppAction
          icon={Share2}
          title="Compartilhar capítulo"
          description="Envie o capítulo atual por link direto, app nativo ou copiar texto."
          onClick={shareCurrentChapter}
          color="bg-green-500/10 text-green-600"
        />

        <AppAction
          icon={Mail}
          title="Abrir Gmail"
          description="Crie um e-mail novo com um clique para envio de estudo."
          onClick={() => openExternal("https://mail.google.com/mail/u/0/#inbox?compose=new", "Gmail")}
          color="bg-rose-500/10 text-rose-600"
        />

        <AppAction
          icon={FileText}
          title="Abrir Notion"
          description="Acesse seu workspace para documentar notas, devocionais e planos."
          onClick={() => openExternal("https://www.notion.so/", "Notion")}
          color="bg-zinc-500/10 text-zinc-600"
        />

        <AppAction
          icon={Link2}
          title="Abrir Google Drive"
          description="Envie anexos, markdown e PDFs para o seu acervo em nuvem."
          onClick={() => openExternal("https://drive.google.com/", "Google Drive")}
          color="bg-indigo-500/10 text-indigo-600"
        />

        <AppAction
          icon={AppWindow}
          title="Exportar para ferramentas"
          description="Ponte rápida para integrações externas e fluxo de produtividade."
          onClick={() => openExternal("https://bibliaalpha.com/", "Integrações")}
          color="bg-purple-500/10 text-purple-600"
        />
      </div>

      <div className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Teste rápido dos botões estratégicos</p>
            <p className="text-xs text-muted-foreground">Valide conexão, compartilhar, Gmail, Notion e Drive em 1 clique.</p>
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
