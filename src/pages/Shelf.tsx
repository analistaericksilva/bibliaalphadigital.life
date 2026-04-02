import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Mail, Instagram, Sparkles, Crown, BookOpen, Copy, Check } from "lucide-react";
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
        <div className="w-full max-w-4xl mx-auto mt-4">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-[#0f1729] via-[#141e33] to-[#1a1a2e] shadow-2xl">
            {/* Glow effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 blur-3xl rounded-full" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary/5 blur-3xl rounded-full" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 p-6 sm:p-8 lg:p-10">
              {/* Left: Banner image */}
              <div className="w-full lg:w-2/5 flex-shrink-0">
                <img
                  src={promoBanner}
                  alt="Bíblia Alpha de Estudos"
                  className="w-full rounded-xl shadow-lg border border-primary/10"
                  loading="lazy"
                  width={800}
                  height={512}
                />
              </div>

              {/* Right: Promo content */}
              <div className="flex-1 text-center lg:text-left space-y-4">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[10px] tracking-[0.2em] uppercase font-sans font-semibold text-primary">
                    Condição Especial por Tempo Limitado
                  </span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl text-white leading-snug">
                  Bíblia Alpha <span className="italic text-primary">de Estudos</span>
                </h2>

                <p className="font-elegant text-sm sm:text-base text-white/60 leading-relaxed max-w-md">
                  Acesso completo à plataforma de estudos bíblicos mais avançada. Interlinear Hebraico-Grego, 
                  léxico Strong's, notas de estudo, mapas e muito mais.
                </p>

                {/* Features */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 text-[10px] tracking-wider uppercase font-sans text-white/40">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-primary/60" /> Interlinear</span>
                  <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-primary/60" /> Léxico Strong's</span>
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-primary/60" /> Notas de Estudo</span>
                </div>

                {/* Price */}
                <div className="flex items-end gap-2 justify-center lg:justify-start">
                  <span className="font-display text-4xl sm:text-5xl font-bold text-white">R$ 49<span className="text-2xl">,90</span></span>
                  <span className="text-xs text-white/40 font-sans mb-2">/ano</span>
                </div>

                {/* QR Code + Copy */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                  <div className="bg-white rounded-xl p-2 shadow-lg">
                    <img src={pixQr} alt="QR Code Pix" className="w-28 h-28 sm:w-32 sm:h-32" width={128} height={128} />
                  </div>
                  <div className="space-y-2 text-center sm:text-left">
                    <p className="text-[10px] tracking-[0.15em] uppercase font-sans text-white/50">
                      Escaneie o QR Code ou copie o código Pix
                    </p>
                    <button
                      onClick={copyPix}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-xs tracking-widest uppercase transition-all duration-300 shadow-lg shadow-primary/20"
                    >
                      {pixCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {pixCopied ? "CÓDIGO COPIADO!" : "COPIAR CÓDIGO PIX"}
                    </button>
                    <p className="text-[9px] text-white/30 font-sans">
                      Após o pagamento, envie o comprovante para ativar seu acesso.
                    </p>
                  </div>
                </div>
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
