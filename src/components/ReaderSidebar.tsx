import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Book, Search, Shield, LogOut, Calendar, BookOpen, BookText,
  FileText, Clock, Heart, Navigation, MapPin, Share2, ArrowLeftRight,
  Languages, Users,
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
  onToggleMap?: () => void;
  onShare?: () => void;
  onToggleCompare?: () => void;
  onToggleLexicon?: () => void;
  onTogglePeople?: () => void;
}

const ReaderSidebar = ({
  onToggleSearch,
  onToggleBookSelector,
  onToggleNotes,
  onToggleDictionary,
  onToggleHistory,
  onToggleFavorites,
  onToggleGoTo,
  onToggleMap,
  onShare,
  onToggleCompare,
  onToggleLexicon,
  onTogglePeople,
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
    onToggleCompare ? { title: "Comparar Versões", icon: ArrowLeftRight, onClick: act(onToggleCompare) } : null,
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
    onShare ? { title: "Compartilhar", icon: Share2, onClick: act(onShare) } : null,
  ].filter(Boolean) as { title: string; icon: any; onClick: () => void }[];

  const navItems = [
    { title: "Prefácio", icon: FileText, onClick: act(() => navigate("/prefacio")) },
    { title: "Planos de Leitura", icon: Calendar, onClick: act(() => navigate("/planos")) },
    isAdmin ? { title: "Administração", icon: Shield, onClick: act(() => navigate("/admin")) } : null,
  ].filter(Boolean) as { title: string; icon: any; onClick: () => void }[];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <img src={logoSrc} alt="Bíblia Alpha" className="w-8 h-8 shrink-0 drop-shadow" width={32} height={32} />
          {!collapsed && (
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-sm tracking-[0.2em] font-serif font-medium text-sidebar-foreground">
                BÍBLIA
              </span>
              <span className="text-[10px] tracking-[0.3em] font-sans font-light text-primary">
                ALPHA
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Leitura</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {readingItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={item.onClick} tooltip={item.title}>
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Estudo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studyItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={item.onClick} tooltip={item.title}>
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Pessoal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={item.onClick} tooltip={item.title}>
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={item.onClick} tooltip={item.title}>
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={act(signOut)} tooltip="Sair" className="text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ReaderSidebar;
