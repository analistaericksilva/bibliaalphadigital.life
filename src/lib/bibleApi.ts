import { supabase } from "@/integrations/supabase/client";

export interface BibleVersion {
  version: string;
  verses: number;
}

export interface ApiVerse {
  number: number;
  text: string;
}

export interface ApiChapter {
  book: {
    abbrev: { pt: string; en: string };
    name: string;
    author: string;
    group: string;
    version: string;
  };
  chapter: { number: number; verses: number };
  verses: ApiVerse[];
}

export interface ApiBookDetail {
  abbrev: { pt: string; en: string };
  author: string;
  chapters: number;
  comment: string;
  group: string;
  name: string;
  testament: string;
}

export interface RandomVerse {
  book: {
    abbrev: { pt: string; en: string };
    name: string;
    author: string;
    group: string;
    version: string;
  };
  chapter: number;
  number: number;
  text: string;
}

async function callApi(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("bible-api", { body });
  if (error) throw new Error(error.message);
  if (!data.success) throw new Error(data.error || "API error");
  return data.data;
}

export const bibleApi = {
  async getVersions(): Promise<BibleVersion[]> {
    return callApi({ action: "versions" });
  },

  async getChapter(version: string, abbrev: string, chapter: number): Promise<ApiChapter> {
    return callApi({ action: "chapter", version, abbrev, chapter });
  },

  async getRandomVerse(version = "nvi"): Promise<RandomVerse> {
    return callApi({ action: "random", version });
  },

  async getBooks(): Promise<ApiBookDetail[]> {
    return callApi({ action: "books" });
  },

  async getBook(abbrev: string): Promise<ApiBookDetail> {
    return callApi({ action: "book", abbrev });
  },

  async searchVerses(version: string, search: string) {
    return callApi({ action: "search", version, search });
  },
};

// Available versions with friendly names
export const VERSION_LABELS: Record<string, string> = {
  nvi: "NVI",
  acf: "ACF",
  ra: "RA",
  kjv: "KJV",
  bbe: "BBE",
  rvr: "RVR",
  apee: "APEE",
};
