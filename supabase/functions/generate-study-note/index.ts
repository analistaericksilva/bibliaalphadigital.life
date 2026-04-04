import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookId, bookName, chapter, verse } = await req.json()

    if (!bookId || !bookName || !chapter || !verse) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: verseData } = await supabase
      .from('bible_verses')
      .select('text')
      .eq('book_id', bookId)
      .eq('chapter', chapter)
      .eq('verse_number', verse)
      .single()

    const verseText = verseData?.text || ''

    const { data: contextVerses } = await supabase
      .from('bible_verses')
      .select('verse_number, text')
      .eq('book_id', bookId)
      .eq('chapter', chapter)
      .gte('verse_number', Math.max(1, verse - 2))
      .lte('verse_number', verse + 2)
      .order('verse_number')

    const contextText = contextVerses
      ?.map((v: any) => `${v.verse_number}. ${v.text}`)
      .join('\n') || verseText

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine testament for Scofield context
    const otBooks = ['gn','ex','lv','nm','dt','js','jz','rt','1sm','2sm','1rs','2rs','1cr','2cr','ed','ne','et','jo','sl','pv','ec','ct','is','jr','lm','ez','dn','os','jl','am','ob','jn','mq','na','hc','sf','ag','zc','ml']
    const isOT = otBooks.includes(bookId)

    const prompt = `Você é um teólogo evangélico experiente com profundo conhecimento da Scofield Reference Bible (edição revisada de 1917, domínio público) e dos grandes comentaristas reformados e puritanos.

Gere notas de estudo para o versículo abaixo.

Livro: ${bookName}
Capítulo: ${chapter}
Versículo: ${verse}
Texto: "${verseText}"
Testamento: ${isOT ? 'Antigo Testamento' : 'Novo Testamento'}

Contexto (versículos ao redor):
${contextText}

Responda EXATAMENTE no formato JSON abaixo, sem nenhum texto fora do JSON, sem markdown, sem backticks:
{"matthewHenry":"<nota devocional e prática no estilo de Matthew Henry, 2-3 parágrafos, cite como do Comentário Bíblico de Matthew Henry>","strong":"<nota teológica sistemática no estilo de Augustus Hopkins Strong, 1-2 parágrafos, aborde aspectos doutrinários>","pentecostal":"<nota breve 2-3 frases com perspectiva pentecostal/wesleyana, pode incluir John Wesley, Charles Finney ou R.A. Torrey>","scofield":"<nota no estilo da Scofield Reference Bible 1917. Inclua: (1) explicação dispensacionalista quando pertinente, (2) referências cruzadas importantes, (3) notas sobre tipos e figuras, (4) contexto histórico-profético. TRADUZA TUDO para português brasileiro. 2-3 parágrafos substanciais. Se o versículo não tiver nota relevante no estilo Scofield, escreva 'null'>","reformada":"<nota breve no estilo reformado/puritano, pode referenciar João Calvino, Martinho Lutero, John Owen, Thomas Watson ou Richard Baxter. 2-3 frases com aplicação espiritual prática>","devocional":"<devocional pessoal breve, máximo 5 linhas, reflexão espiritual>","aplicacao":"<aplicação prática direta, máximo 3 linhas, comece com verbo de ação>"}

Instruções:
- Escreva TUDO em português brasileiro
- Não repita o texto do versículo
- Tom reverente mas acessível
- Não use emojis, asteriscos ou markdown
- Devocional + Aplicação juntos não devem exceder 7 linhas
- Para a nota Scofield: traduza fielmente o conteúdo e estilo da Scofield Reference Bible 1917 para português. Mantenha as referências cruzadas no formato "Livro Capítulo:Versículo"
- Para a nota reformada: use apenas autores em domínio público (Calvino, Lutero, Owen, Watson, Baxter, Agostinho com filtro evangélico)
- Evite viés católico ou sacramental
- Priorize interpretação bíblica reformada com aplicação espiritual prática
- Responda SOMENTE o JSON, nada mais`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 2500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('AI API error:', errText)
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate note' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiData = await response.json()
    const rawContent = aiData.choices?.[0]?.message?.content || ''

    let sections = null
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        sections = JSON.parse(jsonMatch[0])
        // Remove null scofield
        if (sections?.scofield === 'null' || sections?.scofield === null) {
          delete sections.scofield
        }
      }
    } catch (e) {
      console.error('Failed to parse AI JSON, returning raw:', e)
    }

    return new Response(
      JSON.stringify({ note: rawContent, sections }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
