import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoSrc from "@/assets/star-of-david-logo.png";

const Preface = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 w-full h-16 bg-background/95 backdrop-blur-sm border-b border-border z-50 flex items-center px-4 md:px-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="ml-3 text-sm tracking-[0.2em] font-sans text-muted-foreground">PREFÁCIO</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 md:px-12 pt-32 pb-48">
        <div className="bg-paper page-shadow rounded p-8 md:p-16 animate-fade-in">
          {/* Logo & Title */}
          <div className="text-center mb-16">
            <img src={logoSrc} alt="Bíblia Alpha" className="w-16 h-16 mx-auto mb-6 drop-shadow" />
            <p className="text-[9px] tracking-[0.5em] font-sans text-muted-foreground mb-4">PREFÁCIO</p>
            <h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-2">
              Bíblia Alpha de Estudo
            </h1>
            <div className="w-16 h-px bg-primary mx-auto mt-6" />
          </div>

          {/* Content */}
          <div className="reader-content space-y-6 text-base font-serif leading-[2] text-foreground/90">
            <p>
              Em um tempo marcado por excessos de informação e escassez de profundidade espiritual, a{" "}
              <strong className="text-foreground">Bíblia Alpha de Estudo</strong> nasce como um convite ao retorno às
              Escrituras — com reverência, equilíbrio e centralidade no texto sagrado.
            </p>

            <p>
              Este projeto está fundamentado no <em>Textus Receptus</em>, preservando a tradição textual que sustentou
              gerações de cristãos fiéis, e se inspira na riqueza clássica da Almeida de 1611, buscando resgatar a
              beleza, a fidelidade e a solenidade da leitura bíblica histórica.
            </p>

            <p>
              A proposta da Bíblia Alpha é clara e intencional: uma experiência de leitura limpa, profunda e sem
              distrações, onde o leitor é conduzido a um encontro direto com a Palavra de Deus. Aqui, o texto é o
              protagonista. Tudo foi cuidadosamente desenvolvido para que nada concorra com a voz das Escrituras.
            </p>

            <div className="w-8 h-px bg-border mx-auto my-10" />

            <p>
              Teologicamente, esta obra se posiciona em um ponto de convergência raro e necessário: a solidez
              doutrinária da tradição reformada aliada à vitalidade espiritual da experiência pentecostal.
            </p>

            <div className="pl-6 border-l-2 border-primary/30 space-y-4 my-8">
              <p>
                Da <strong className="text-foreground">tradição reformada</strong>, herdamos o compromisso com a exposição fiel do texto, a
                centralidade das Escrituras (<em>Sola Scriptura</em>), a soberania de Deus e a seriedade da teologia
                bíblica.
              </p>
              <p>
                Da <strong className="text-foreground">tradição pentecostal</strong>, abraçamos a realidade viva do Espírito Santo, a atualidade
                dos dons, a experiência transformadora e a dimensão prática da fé no cotidiano.
              </p>
            </div>

            <p>Não se trata de uma fusão superficial, mas de uma integração madura:</p>

            <div className="text-center space-y-1 my-8 font-serif italic text-foreground/80">
              <p>profundidade teológica com fervor espiritual.</p>
              <p>verdade bíblica com experiência viva.</p>
            </div>

            <p>
              As notas explicativas foram cuidadosamente elaboradas com esse equilíbrio — respeitando o texto, iluminando
              seu contexto e conduzindo o leitor à aplicação pessoal, sem distorcer a mensagem original. Cada recurso
              existe com um único propósito: levar você a compreender mais profundamente e viver mais intensamente a
              Palavra de Deus.
            </p>

            <p>
              A Bíblia Alpha de Estudo não é apenas uma ferramenta digital — é um instrumento a serviço do Reino. Um
              espaço onde o leitor não apenas adquire conhecimento, mas é confrontado, edificado e transformado.
            </p>

            <div className="w-8 h-px bg-border mx-auto my-10" />

            <div className="text-center space-y-2 my-8 font-serif italic text-foreground/80">
              <p>Que, ao acessar esta obra, você encontre mais do que informação:</p>
              <p className="text-foreground font-medium not-italic">encontre revelação.</p>
              <p>Mais do que leitura:</p>
              <p className="text-foreground font-medium not-italic">encontre comunhão.</p>
            </div>

            <p className="text-center mt-12">
              Que a Palavra seja lâmpada para os seus pés e luz para o seu caminho.
            </p>

            <p className="text-center text-primary font-medium tracking-[0.2em] text-sm mt-8">
              SOLI DEO GLORIA
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Preface;
