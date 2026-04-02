import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Mail, Instagram, Sparkles, Crown, BookOpen, Copy, Check, MessageCircle } from "lucide-react";
import ShelfProductCard from "@/components/ShelfProductCard";
import bibleCover from "@/assets/bible-cover.png";
import financeAppCover from "@/assets/finance-app-cover.png";
import logoSrc from "@/assets/star-of-david-logo.png";
import promoBanner from "@/assets/promo-bible-banner.jpg";
import pixQr from "@/assets/pix-qr.png";

const Shelf = () => {
  const { user, loading, isApproved, isAdmin, signOut } = useAuth();

  const [pixCopied, setPixCopied] = useState(false);

  const pixCode = "00020126850014br.gov.bcb.pix0129analista.ericksilva@gmail.com0230Acesso exclusivo 1 ano B.ALPHA520400005303986540549.905802BR5922Erick Pereira da Silva6002NA62070503***6304EFEE";

  const copyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  const [pixCopiedFinance, setPixCopiedFinance] = useState(false);

  const pixCodeFinance = "00020126890014br.gov.bcb.pix0129analista.ericksilva@gmail.com0234Plataforma Inteligência Financeira520400005303986540579.905802BR5922Erick Pereira da Silva6002NA62070503***6304140B";

  const copyPixFinance = () => {
    navigator.clipboard.writeText(pixCodeFinance);
    setPixCopiedFinance(true);
    setTimeout(() => setPixCopiedFinance(false), 3000);
  };

  const handleProductClick = () => {
    const loginUrl = `${window.location.origin}/login`;
    const loginWindow = window.open(
      loginUrl,
      "alpha-login",
      "width=560,height=780,resizable=yes,scrollbars=yes"
    );
    loginWindow?.focus();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm tracking-[0.3em] font-sans text-muted-foreground animate-fade-in">
          CARREGANDO...
        </p>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Premium header */}
      <header className="w-full flex flex-col items-center pt-10 pb-6 px-6 sm:px-10 relative">
        {/* Sign out */}
        {user && (
          <button
            onClick={signOut}
            className="absolute top-6 right-6 sm:right-10 text-muted-foreground/50 hover:text-foreground transition-colors duration-300 p-2"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}

        {/* Logo */}
        <div className="mb-4">
          <img
            src={logoSrc}
            alt="Alpha Studio"
            className="w-10 h-10 sm:w-12 sm:h-12 opacity-70"
            width={48}
            height={48}
          />
        </div>

        {/* Brand name */}
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide text-foreground/90 leading-tight">
          Alpha <span className="italic font-display text-primary">Studio</span>
        </h1>
        <p className="font-elegant text-sm sm:text-base tracking-[0.25em] uppercase text-muted-foreground/60 mt-2 font-light">
          Plataforma Digital de Conhecimento
        </p>

        {/* Ornamental divider */}
        <div className="flex items-center gap-3 mt-6">
          <div className="w-12 h-px bg-primary/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
          <div className="w-12 h-px bg-primary/20" />
        </div>
      </header>

      {/* Products */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 sm:py-12 gap-10">
        <div className="animate-fade-in flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-16">
          <ShelfProductCard
            title="Bíblia Alpha"
            subtitle="Edição de Estudo"
            coverImage={bibleCover}
            route="#"
            badge={user && (isApproved || isAdmin) ? "Acessar" : undefined}
            onCustomClick={handleProductClick}
          />
          <ShelfProductCard
            title="Inteligência Financeira"
            subtitle="Plataforma Digital"
            coverImage={financeAppCover}
            route="https://inteligenciafinanceira.tech/"
            badge="Acessar"
            onCustomClick={() => window.open("https://inteligenciafinanceira.tech/", "_blank")}
          />
        </div>

        {/* ===== PROMO SECTION ===== */}
        <div className="w-full max-w-5xl mx-auto mt-6">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0f172a] shadow-[0_20px_60px_-15px_rgba(212,175,55,0.15)]">
            {/* Animated glow effects */}
            <div className="absolute -top-20 left-1/3 w-96 h-96 bg-primary/8 blur-[100px] rounded-full animate-pulse" />
            <div className="absolute -bottom-20 -right-10 w-72 h-72 bg-primary/5 blur-[80px] rounded-full" />
            <div className="absolute top-1/2 left-0 w-40 h-40 bg-primary/3 blur-[60px] rounded-full" />

            {/* Top urgency bar */}
            <div className="relative z-10 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-b border-primary/15 px-4 py-2.5 flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-[10px] sm:text-[11px] tracking-[0.25em] uppercase font-sans font-semibold text-primary">
                🔥 Oferta Exclusiva — Vagas Limitadas
              </span>
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 p-6 sm:p-8 lg:p-12">
              {/* Left: Banner image */}
              <div className="w-full lg:w-[38%] flex-shrink-0 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <img
                    src={promoBanner}
                    alt="Bíblia Alpha de Estudos"
                    className="w-full rounded-2xl shadow-2xl border border-primary/10 group-hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                    width={800}
                    height={512}
                  />
                </div>
              </div>

              {/* Right: Promo content */}
              <div className="flex-1 text-center lg:text-left space-y-5">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                  <span className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-sans font-bold text-primary">
                    Condição Especial por Tempo Limitado
                  </span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl text-white leading-tight">
                  Bíblia Alpha{" "}
                  <span className="italic bg-gradient-to-r from-primary to-yellow-500 bg-clip-text text-transparent">
                    de Estudos
                  </span>
                </h2>

                <p className="font-elegant text-sm sm:text-base text-white/50 leading-relaxed max-w-lg">
                  A plataforma de estudos bíblicos mais completa do Brasil. Mergulhe nas Escrituras com ferramentas 
                  profissionais de análise textual que antes só estavam disponíveis em seminários.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                  {[
                    { icon: BookOpen, label: "Interlinear Heb-Gr" },
                    { icon: Crown, label: "Léxico Strong's" },
                    { icon: Sparkles, label: "Notas de Estudo IA" },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] tracking-wider uppercase font-sans text-white/50">
                      <Icon className="w-3 h-3 text-primary/70" /> {label}
                    </span>
                  ))}
                </div>

                {/* Price block */}
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <div className="flex flex-col items-end mr-1">
                    <span className="text-[10px] line-through text-white/25 font-sans">R$ 149,90</span>
                    <span className="text-[9px] tracking-wider uppercase text-green-400/80 font-sans font-semibold">-67% OFF</span>
                  </div>
                  <span className="font-display text-5xl sm:text-6xl font-bold bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                    R$ 49<span className="text-3xl">,90</span>
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="text-xs text-white/40 font-sans font-medium">/ano</span>
                    <span className="text-[9px] text-white/25 font-sans">acesso completo</span>
                  </div>
                </div>

                {/* QR Code + Copy section */}
                <div className="flex flex-col sm:flex-row items-center gap-5 pt-3 pb-1">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-yellow-500/30 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-white rounded-xl p-2.5 shadow-2xl">
                      <img src={pixQr} alt="QR Code Pix" className="w-32 h-32 sm:w-36 sm:h-36" width={144} height={144} />
                    </div>
                    <p className="text-center text-[8px] tracking-wider uppercase text-white/30 font-sans mt-2">Pix • Pagamento Instantâneo</p>
                  </div>
                  <div className="space-y-3 text-center sm:text-left">
                    <p className="text-[11px] tracking-wide font-sans text-white/60 leading-relaxed">
                      📱 Escaneie o <strong className="text-white/80">QR Code</strong> com seu banco<br />
                      ou copie o código Pix abaixo:
                    </p>
                    <button
                      onClick={copyPix}
                      className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-sans text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-lg ${
                        pixCopied
                          ? "bg-green-500 text-white shadow-green-500/20"
                          : "bg-gradient-to-r from-primary to-yellow-600 hover:from-primary/90 hover:to-yellow-600/90 text-primary-foreground shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02]"
                      }`}
                    >
                      {pixCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {pixCopied ? "Código Copiado!" : "Copiar Código Pix"}
                    </button>
                    <a
                      href="https://wa.me/5519993586153?text=Ol%C3%A1%21%20Fiz%20o%20pagamento%20da%20B%C3%ADblia%20Alpha%20de%20Estudos.%20Segue%20meu%20comprovante."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-sans text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-lg shadow-[#25D366]/20 hover:scale-[1.02]"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Confirmar pelo WhatsApp
                    </a>
                    <p className="text-[10px] text-white/35 font-sans flex items-center gap-1 justify-center sm:justify-start">
                      <Mail className="w-3 h-3" />
                      Envie o comprovante para liberar seu acesso
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom trust bar */}
            <div className="relative z-10 border-t border-white/5 px-6 py-3 flex items-center justify-center gap-4 sm:gap-8 text-[9px] tracking-wider uppercase font-sans text-white/25">
              <span className="flex items-center gap-1">🔒 Pagamento Seguro</span>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1">⚡ Acesso Imediato</span>
              <span className="w-px h-3 bg-white/10 hidden sm:block" />
              <span className="hidden sm:flex items-center gap-1">✨ Suporte Dedicado</span>
            </div>
          </div>
        </div>

        {/* ===== FINANCE PROMO (compact) ===== */}
        <div className="w-full max-w-3xl mx-auto mt-6">
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/15 bg-gradient-to-r from-[#0c1220] to-[#111827] p-5 sm:p-6">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/5 blur-[60px] rounded-full" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
              {/* Info */}
              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                  <span className="text-[9px] tracking-[0.2em] uppercase font-sans font-semibold text-blue-400">Plataforma Digital</span>
                </div>
                <h3 className="font-display text-lg sm:text-xl text-white">
                  Inteligência <span className="italic text-blue-400">Financeira</span>
                </h3>
                <p className="font-sans text-[11px] text-white/40 leading-relaxed max-w-sm">
                  Domine suas finanças com ferramentas profissionais de gestão e planejamento financeiro.
                </p>
              </div>
              {/* Price + CTA */}
              <div className="flex flex-col items-center gap-3 flex-shrink-0">
                <div className="flex items-end gap-1">
                  <span className="font-display text-3xl font-bold text-white">R$ 79<span className="text-lg">,90</span></span>
                  <span className="text-[10px] text-white/35 font-sans mb-1">/ano</span>
                </div>
                <button
                  onClick={copyPixFinance}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-sans text-[10px] tracking-[0.2em] uppercase transition-all duration-300 ${
                    pixCopiedFinance
                      ? "bg-green-500 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/15 hover:scale-[1.02]"
                  }`}
                >
                  {pixCopiedFinance ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {pixCopiedFinance ? "Copiado!" : "Copiar Pix"}
                </button>
                <a
                  href="https://wa.me/5519993586153?text=Ol%C3%A1%21%20Fiz%20o%20pagamento%20da%20Plataforma%20Intelig%C3%AAncia%20Financeira.%20Segue%20meu%20comprovante."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[9px] tracking-wider uppercase font-sans text-[#25D366] hover:text-[#20bd5a] transition-colors"
                >
                  <MessageCircle className="w-3 h-3" /> Confirmar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Premium footer */}
      <footer className="pb-8 pt-6 flex flex-col items-center gap-5">
        {/* Social & contact */}
        <div className="flex items-center gap-6 flex-wrap justify-center">
          <a
            href="mailto:analista.ericksilva@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground/50 hover:text-primary transition-colors duration-300 text-[11px] tracking-[0.15em] font-sans"
          >
            <Mail className="w-3.5 h-3.5" />
            Contato
          </a>
          <a
            href="https://www.instagram.com/bibliaalphadigital?igsh=Ym91YmlyNzNzZDU0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground/50 hover:text-primary transition-colors duration-300 text-[11px] tracking-[0.15em] font-sans"
          >
            <Instagram className="w-3.5 h-3.5" />
            @bibliaalphadigital
          </a>
          <a
            href="https://www.instagram.com/analista.erick?igsh=YnE1aDRibHlqZXpta"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground/50 hover:text-primary transition-colors duration-300 text-[11px] tracking-[0.15em] font-sans"
          >
            <Instagram className="w-3.5 h-3.5" />
            @analista.erick
          </a>
        </div>

        {/* Divider */}
        <div className="w-20 h-px bg-border/60" />

        {/* Copyright */}
        <div className="flex flex-col items-center gap-1">
          <p className="font-elegant text-xs tracking-[0.15em] text-muted-foreground/40">
            © {currentYear} Alpha Studio. Todos os direitos reservados.
          </p>
          <p className="font-sans text-[9px] tracking-[0.25em] uppercase text-muted-foreground/30">
            Alpha Digital Library
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Shelf;
