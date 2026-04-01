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

    // Fetch the verse text
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

    // Also fetch surrounding verses for context (2 before, 2 after)
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

    const prompt = `Você é um teólogo evangélico protestante experiente. Gere uma nota explicativa concisa e edificante para o versículo abaixo, no estilo de Matthew Henry (devocional e prático) combinado com insights teológicos de Augustus Hopkins Strong (teologia sistemática reformada).

Livro: ${bookName}
Capítulo: ${chapter}
Versículo: ${verse}
Texto: "${verseText}"

Contexto (versículos ao redor):
${contextText}

Instruções:
- Escreva em português brasileiro
- Máximo 3 parágrafos curtos
- Inclua aplicação prática para a vida cristã
- Mencione conexões teológicas relevantes quando apropriado
- Não cite fontes, não mencione Matthew Henry nem Strong
- Tom reverente mas acessível
- Não repita o texto do versículo, apenas explique e aplique`

    const response = await fetch('https://lovable-ai.lovable.dev/chat/completions', {
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
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('AI API error:', errText)
      return new Response(
        JSON.stringify({ error: 'Failed to generate note' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiData = await response.json()
    const note = aiData.choices?.[0]?.message?.content || ''

    return new Response(
      JSON.stringify({ note }),
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
