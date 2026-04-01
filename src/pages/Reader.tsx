import { useState, useEffect } from "react";
import { bibleBooks } from "@/data/bibleBooks";
import ReaderHeader from "@/components/ReaderHeader";
import BookSelector from "@/components/BookSelector";
import SearchPanel from "@/components/SearchPanel";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Sample Bible data (Genesis 1) - in production this would come from API
const sampleVerses: Record<string, Array<{ verse: number; text: string }>> = {
  "gn-1": [
    { verse: 1, text: "No princípio, criou Deus os céus e a terra." },
    { verse: 2, text: "E a terra era sem forma e vazia; e havia trevas sobre a face do abismo; e o Espírito de Deus se movia sobre a face das águas." },
    { verse: 3, text: "E disse Deus: Haja luz. E houve luz." },
    { verse: 4, text: "E viu Deus que a luz era boa; e fez Deus separação entre a luz e as trevas." },
    { verse: 5, text: "E Deus chamou à luz Dia; e às trevas chamou Noite. E foi a tarde e a manhã: o dia primeiro." },
    { verse: 6, text: "E disse Deus: Haja uma expansão no meio das águas, e haja separação entre águas e águas." },
    { verse: 7, text: "E fez Deus a expansão e fez separação entre as águas que estavam debaixo da expansão e as águas que estavam sobre a expansão. E assim foi." },
    { verse: 8, text: "E chamou Deus à expansão Céus; e foi a tarde e a manhã, o dia segundo." },
    { verse: 9, text: "E disse Deus: Ajuntem-se as águas debaixo dos céus num lugar; e apareça a porção seca. E assim foi." },
    { verse: 10, text: "E chamou Deus à porção seca Terra; e ao ajuntamento das águas chamou Mares. E viu Deus que era bom." },
    { verse: 11, text: "E disse Deus: Produza a terra erva verde, erva que dê semente, árvore frutífera que dê fruto segundo a sua espécie, cuja semente esteja nela sobre a terra. E assim foi." },
    { verse: 12, text: "E a terra produziu erva, erva dando semente conforme a sua espécie e árvore frutífera, cuja semente está nela conforme a sua espécie. E viu Deus que era bom." },
    { verse: 13, text: "E foi a tarde e a manhã, o dia terceiro." },
    { verse: 14, text: "E disse Deus: Haja luminares na expansão dos céus, para haver separação entre o dia e a noite; e sejam eles para sinais e para tempos determinados e para dias e anos." },
    { verse: 15, text: "E sejam para luminares na expansão dos céus, para alumiar a terra. E assim foi." },
    { verse: 16, text: "E fez Deus os dois grandes luminares: o luminar maior para governar o dia, e o luminar menor para governar a noite; e fez as estrelas." },
    { verse: 17, text: "E Deus os pôs na expansão dos céus para alumiar a terra," },
    { verse: 18, text: "e para governar o dia e a noite, e para fazer separação entre a luz e as trevas. E viu Deus que era bom." },
    { verse: 19, text: "E foi a tarde e a manhã, o dia quarto." },
    { verse: 20, text: "E disse Deus: Produzam as águas abundantemente répteis de alma vivente; e voem as aves sobre a face da expansão dos céus." },
    { verse: 21, text: "E Deus criou as grandes baleias, e todo réptil de alma vivente que as águas abundantemente produziram conforme as suas espécies, e toda ave de asas conforme a sua espécie. E viu Deus que era bom." },
    { verse: 22, text: "E Deus os abençoou, dizendo: Frutificai, e multiplicai-vos, e enchei as águas nos mares; e as aves se multipliquem na terra." },
    { verse: 23, text: "E foi a tarde e a manhã, o dia quinto." },
    { verse: 24, text: "E disse Deus: Produza a terra alma vivente conforme a sua espécie; gado, e répteis, e bestas-feras da terra conforme a sua espécie. E assim foi." },
    { verse: 25, text: "E fez Deus as bestas-feras da terra conforme a sua espécie, e o gado conforme a sua espécie, e todo o réptil da terra conforme a sua espécie. E viu Deus que era bom." },
    { verse: 26, text: "E disse Deus: Façamos o homem à nossa imagem, conforme a nossa semelhança; e domine sobre os peixes do mar, e sobre as aves dos céus, e sobre o gado, e sobre toda a terra, e sobre todo réptil que se move sobre a terra." },
    { verse: 27, text: "E criou Deus o homem à sua imagem; à imagem de Deus o criou; macho e fêmea os criou." },
    { verse: 28, text: "E Deus os abençoou e Deus lhes disse: Frutificai, e multiplicai-vos, e enchei a terra, e sujeitai-a; e dominai sobre os peixes do mar, e sobre as aves dos céus, e sobre todo o animal que se move sobre a terra." },
    { verse: 29, text: "E disse Deus: Eis que vos tenho dado toda erva que dá semente e que está sobre a face de toda a terra e toda árvore em que há fruto que dá semente; ser-vos-á para mantimento." },
    { verse: 30, text: "E a todo animal da terra, e a toda ave dos céus, e a todo réptil da terra, em que há alma vivente, toda a erva verde lhes será para mantimento. E assim foi." },
    { verse: 31, text: "E viu Deus tudo quanto tinha feito, e eis que era muito bom. E foi a tarde e a manhã, o dia sexto." },
  ],
};

const Reader = () => {
  const [currentBook, setCurrentBook] = useState("gn");
  const [currentChapter, setCurrentChapter] = useState(1);
  const [showBooks, setShowBooks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const book = bibleBooks.find((b) => b.id === currentBook);
  const verseKey = `${currentBook}-${currentChapter}`;
  const verses = sampleVerses[verseKey] || [
    { verse: 1, text: "Conteúdo em breve. Este capítulo será carregado quando a integração com a API bíblica estiver ativa." },
  ];

  const goToChapter = (bookId: string, chapter: number) => {
    setCurrentBook(bookId);
    setCurrentChapter(chapter);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateChapter = (direction: -1 | 1) => {
    if (!book) return;
    const newChapter = currentChapter + direction;
    if (newChapter >= 1 && newChapter <= book.chapters) {
      goToChapter(currentBook, newChapter);
    } else {
      const idx = bibleBooks.findIndex((b) => b.id === currentBook);
      if (direction === 1 && idx < bibleBooks.length - 1) {
        goToChapter(bibleBooks[idx + 1].id, 1);
      } else if (direction === -1 && idx > 0) {
        const prevBook = bibleBooks[idx - 1];
        goToChapter(prevBook.id, prevBook.chapters);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ReaderHeader
        onToggleSearch={() => setShowSearch(!showSearch)}
        onToggleBookSelector={() => setShowBooks(!showBooks)}
      />

      {/* Navigation zones */}
      <div
        className="fixed top-0 left-0 h-full w-[12%] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-30 cursor-pointer text-muted-foreground"
        onClick={() => navigateChapter(-1)}
      >
        <ChevronLeft className="w-8 h-8" />
      </div>
      <div
        className="fixed top-0 right-0 h-full w-[12%] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-30 cursor-pointer text-muted-foreground"
        onClick={() => navigateChapter(1)}
      >
        <ChevronRight className="w-8 h-8" />
      </div>

      {/* Reader content - PDF style */}
      <main className="max-w-3xl mx-auto px-6 md:px-12 pt-32 pb-48">
        <div className="bg-paper page-shadow rounded p-8 md:p-16 mb-8 animate-fade-in">
          {/* Chapter heading */}
          <div className="text-center mb-12">
            <p className="text-[9px] tracking-[0.4em] text-muted-foreground font-sans mb-2">
              {book?.testament === "old" ? "ANTIGO TESTAMENTO" : "NOVO TESTAMENTO"}
            </p>
            <h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-1">
              {book?.name}
            </h1>
            <p className="text-lg text-muted-foreground font-serif">Capítulo {currentChapter}</p>
          </div>

          {/* Verses */}
          <div className="reader-content">
            {verses.map((v) => (
              <span key={v.verse}>
                <sup className="verse-number">{v.verse}</sup>
                {v.text}{" "}
              </span>
            ))}
          </div>

          {/* Chapter navigation */}
          <div className="flex items-center justify-between mt-16 pt-8 border-t border-border">
            <button
              onClick={() => navigateChapter(-1)}
              className="text-[10px] tracking-[0.2em] font-sans text-muted-foreground hover:text-foreground transition-colors"
            >
              ← ANTERIOR
            </button>
            <span className="text-[10px] tracking-[0.2em] font-sans text-muted-foreground">
              {book?.abbrev} {currentChapter}
            </span>
            <button
              onClick={() => navigateChapter(1)}
              className="text-[10px] tracking-[0.2em] font-sans text-muted-foreground hover:text-foreground transition-colors"
            >
              PRÓXIMO →
            </button>
          </div>
        </div>
      </main>

      <BookSelector
        open={showBooks}
        onClose={() => setShowBooks(false)}
        onSelect={goToChapter}
        currentBook={currentBook}
        currentChapter={currentChapter}
      />

      <SearchPanel
        open={showSearch}
        onClose={() => setShowSearch(false)}
        verses={verses}
        onVerseClick={() => {}}
      />
    </div>
  );
};

export default Reader;
