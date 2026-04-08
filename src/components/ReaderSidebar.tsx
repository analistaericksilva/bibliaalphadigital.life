import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Book, Search, Shield, LogOut, Calendar, BookOpen, BookText,
  FileText, Clock, Heart, Navigation, MapPin, Share2,
  Languages, Users, RotateCcw, StickyNote,
} from "lucide-react";
import logoSrc from "@/assets/star-of-david-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

interface ReaderSidebarProps {
  onToggleSearch: () => void;
  onToggleBookSelector: () => void;
  onToggleNotes?: () => void;
  onToggleDictionary?: () => void;
  onToggleHistory?: () => void;
  onToggleFavorites?: () => void;
  onToggleGoTo?: () => void;
  onToggleReset?: () => void;
  onToggleMap?: () => void;
  onShare?: () => void;
  onToggleLexicon?: () => void;
  onTogglePeople?: () => void;
  onToggleNotepad?: () => void;
}

const ReaderSidebar = ({
  onToggleSearch,
  onToggleBookSelector,
  onToggleNotes,
  onToggleDictionary,
  onToggleHistory,
  onToggleFavorites,
  onToggleGoTo,
  onToggleReset,
  onToggleMap,
  onShare,
  onToggleLexicon,
  onTogglePeople,
  onToggleNotepad,
}: ReaderSidebarProps) => {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";

  // Wrap each action to close the sidebar on mobile before executing
  const act = (fn?: () => void) => () => {
    if (isMobile) setOpenMobile(false);
    fn?.();
  };

  const readingItems = [
    { title: "Livros", icon: Book, onClick: act(onToggleBookSelector) },
    { title: "Buscar", icon: Search, onClick: act(onToggleSearch) },
    onToggleGoTo ? { title: "Ir Para", icon: Navigation, onClick: act(onToggleGoTo) } : null,
  ].filter(Boolean) as { title: string; icon: any; onClick: () => void }[];

  const studyItems = [
    onToggleNotes ? { title: "Notas de Estudo", icon: BookOpen, onClick: act(onToggleNotes) } : null,
    onToggleDictionary ? { title: "Dicionário Bíblico", icon: BookText, onClick: act(onToggleDictionary) } : null,
    onToggleLexicon ? { title: "Léxico Strong's", icon: Languages, onClick: act(onToggleLexicon) } : null,
    onTogglePeople ? { title: "Nomes Bíblicos", icon: Users, onClick: act(onTogglePeople) } : null,
    onToggleMap ? { title: "Mapa Bíblico", icon: MapPin, onClick: act(onToggleMap) } : null,
  ].filter(Boolean) as { title: string; icon: any; onClick: () => void }[];

  const userItems = [
    onToggleHistory ? { title: "Histórico", icon: Clock, onClick: act(onToggleHistory) } : null,
    onToggleFavorites ? { title: "Favoritos", icon: Heart, onClick: act(onToggleFavorites) } : null,
    onToggleNotepad ? { title: "Bloco de notas", icon: StickyNote, onClick: act(onToggleNotepad) } : null,
    onToggleReset ? { title: "Resetar dados", icon: RotateCcw, onClick: act(onToggleReset) } : null,
    onShare ? { title: "Compartilhar", icon: Share2, onClick: act(onShare) } : null,
  ].filter(Boolean) as { title: string; icon: any; onClick: () => void }[];

  const navItems = [
    { title: "Prefácio", icon: FileText, onClick: act(() => navigate("/prefacio")) },
    { title: "Planos de Leitura", icon: Calendar, onClick: act(() => navigate("/planos")) },
    isAdmin ? { title: "Administração", icon: Shield, onClick: act(() => navigate("/admin")) } : null,
  ].filter(Boolean) as { title: string; icon: any; onClick: () => void }[];

  return (
    <Sidebar variant="floating" collapsible="icon" className="border-r-0 manus-sidebar">
      <SidebarHeader className="p-4 border-b border-border/40 bg-background/40 backdrop-blur-xl">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img src={logoSrc} alt="Bíblia Alpha" className="w-8 h-8 shrink-0 drop-shadow-md" width={32} height={32} />
          {!collapsed && (
              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-sm lg:text-base tracking-[0.16em] title-strong text-sidebar-foreground">
                  BÍBLIA
                </span>
                <span className="text-[10px] lg:text-[11px] tracking-[0.22em] font-sans font-semibold text-primary/90">
                  ALPHA
                </span>
              </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-bold px-2 mb-2">Leitura</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {readingItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={item.onClick} 
                    tooltip={item.title} 
                    className="rounded-xl px-3 py-2.5 h-auto transition-all duration-200 hover:bg-primary/5 hover:text-primary active:scale-95"
                  >
                    <item.icon className="h-4.5 w-4.5 stroke-[1.5]" />
                    {!collapsed && <span className="font-medium text-[14px] ml-2">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-bold px-2 mb-2">Estudo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {studyItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={item.onClick} 
                    tooltip={item.title} 
                    className="rounded-xl px-3 py-2.5 h-auto transition-all duration-200 hover:bg-primary/5 hover:text-primary active:scale-95"
                  >
                    <item.icon className="h-4.5 w-4.5 stroke-[1.5]" />
                    {!collapsed && <span className="font-medium text-[14px] ml-2">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] lg:text-[11px] tracking-[0.16em] uppercase text-sidebar-foreground font-bold">Pessoal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={item.onClick} tooltip={item.title} className="rounded-lg menu-strong data-[active=true]:bg-sidebar-accent/80 hover:bg-sidebar-accent/80">
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span className="menu-strong text-[13px] lg:text-[14px]">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] lg:text-[11px] tracking-[0.16em] uppercase text-sidebar-foreground font-bold">Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={item.onClick} tooltip={item.title} className="rounded-lg menu-strong data-[active=true]:bg-sidebar-accent/80 hover:bg-sidebar-accent/80">
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span className="menu-strong text-[13px] lg:text-[14px]">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2.5 border-t border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={act(signOut)} tooltip="Sair" className="rounded-lg font-semibold text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="menu-strong">Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ReaderSidebar;
