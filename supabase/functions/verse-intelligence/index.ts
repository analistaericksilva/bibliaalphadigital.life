import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const emptyPayload = (bookId: string, chapter: number, verse: number) => ({
  reference: { book_id: bookId, chapter, verse },
  cross_references: [] as Record<string, unknown>[],
  legacy_cross_references: [] as string[],
  study_notes: [] as Record<string, unknown>[],
  external_commentary: [] as Record<string, unknown>[],
  macula_words: [] as Record<string, unknown>[],
  macula_relations: [] as Record<string, unknown>[],
  datasets: [] as Record<string, unknown>[],
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const bookId = String(body?.bookId || "").trim();
    const chapter = Number(body?.chapter);
    const verse = Number(body?.verse);
    const crossLimit = Number(body?.crossLimit || 40);

    if (!bookId || !Number.isInteger(chapter) || !Number.isInteger(verse)) {
      return new Response(
        JSON.stringify({ success: false, error: "bookId, chapter e verse são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Configuração do Supabase ausente" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") || "",
        },
      },
    });

    // Caminho principal: função SQL unificada
    const rpc = await supabase.rpc("get_verse_super_insights", {
      p_book_id: bookId,
      p_chapter: chapter,
      p_verse: verse,
      p_cross_limit: crossLimit,
    });

    if (!rpc.error && rpc.data) {
      return new Response(
        JSON.stringify({
          success: true,
          data: rpc.data,
          source: "rpc:get_verse_super_insights",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fallback defensivo: projeto ainda sem migration aplicada
    const [
      legacyCrossRefsRes,
      studyNotesRes,
      interlinearRes,
      maculaWordsRes,
      maculaRelationsRes,
      externalCommentaryRes,
      datasetsRes,
    ] = await Promise.all([
      supabase
        .from("bible_cross_references")
        .select("refs")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .eq("verse", verse)
        .limit(1),
      supabase
        .from("study_notes")
        .select("id,title,content,source,note_type,verse_start,verse_end")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .lte("verse_start", verse)
        .or(`verse_end.gte.${verse},verse_end.is.null`)
        .order("verse_start", { ascending: true })
        .limit(8),
      supabase
        .from("interlinear_words")
        .select("word_num,language,original_word,transliteration,strongs_number,grammar,english")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .eq("verse", verse)
        .order("word_num", { ascending: true })
        .limit(80),
      supabase
        .from("macula_word_features")
        .select("token_index,language,surface,lemma,transliteration,strongs,morphology,pos,semantic_role,semantic_domain,semantic_frame,gloss,contextual_gloss,source_dataset")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .eq("verse", verse)
        .order("token_index", { ascending: true })
        .limit(120),
      supabase
        .from("macula_syntactic_relations")
        .select("language,relation_type,frame,subject_ref,participant_ref,target_ref,token_xml_id,source_dataset")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .eq("verse", verse)
        .limit(120),
      supabase
        .from("verse_commentary_sources")
        .select("id,title,content,author,tradition,tags,source_dataset,source_url,verse_start,verse_end")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .lte("verse_start", verse)
        .or(`verse_end.gte.${verse},verse_end.is.null`)
        .order("verse_start", { ascending: true })
        .limit(8),
      supabase
        .from("bible_dataset_sources")
        .select("id,name,category,repository_url,license,priority")
        .eq("enabled", true)
        .order("priority", { ascending: true }),
    ]);

    const payload = emptyPayload(bookId, chapter, verse);

    const legacyRefs = legacyCrossRefsRes.data?.[0]?.refs
      ? String(legacyCrossRefsRes.data[0].refs)
        .split(";")
        .map((value) => value.trim())
        .filter(Boolean)
      : [];

    payload.legacy_cross_references = legacyRefs;
    payload.study_notes = studyNotesRes.data || [];
    payload.external_commentary = externalCommentaryRes.data || [];
    payload.datasets = datasetsRes.data || [];

    const fallbackInterlinearWords = (interlinearRes.data || []).map((item: Record<string, unknown>) => ({
      token_index: Number(item.word_num || 0),
      language: item.language || "",
      surface: item.original_word || "",
      lemma: null,
      transliteration: item.transliteration || null,
      strongs: item.strongs_number || null,
      morphology: item.grammar || null,
      pos: null,
      semantic_role: null,
      semantic_domain: null,
      semantic_frame: null,
      gloss: item.english || null,
      contextual_gloss: null,
      dataset: "interlinear_words",
    }));

    payload.macula_words = (maculaWordsRes.data && maculaWordsRes.data.length > 0)
      ? maculaWordsRes.data
      : fallbackInterlinearWords;

    payload.macula_relations = maculaRelationsRes.data || [];

    return new Response(
      JSON.stringify({
        success: true,
        data: payload,
        source: "fallback:direct-table-reads",
        warning: rpc.error ? rpc.error.message : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
