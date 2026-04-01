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

    const prompt = `Você é um teólogo evangélico experiente. Gere notas de estudo para o versículo abaixo.

Livro: ${bookName}
Capítulo: ${chapter}
Versículo: ${verse}
Texto: "${verseText}"

Contexto (versículos ao redor):
${contextText}

Responda EXATAMENTE no formato JSON abaixo, sem nenhum texto fora do JSON, sem markdown, sem backticks:
{"matthewHenry":"<nota devocional e prática no estilo de Matthew Henry, 2-3 parágrafos, cite como do Comentário Bíblico de Matthew Henry>","strong":"<nota teológica sistemática no estilo de Augustus Hopkins Strong, 1-2 parágrafos, aborde aspectos doutrinários>","pentecostal":"<nota breve 2-3 frases com perspectiva pentecostal, sem citar fontes>","devocional":"<devocional pessoal breve, máximo 5 linhas, reflexão espiritual>","aplicacao":"<aplicação prática direta, máximo 3 linhas, comece com verbo de ação>"}

Instruções:
- Escreva em português brasileiro
- Não repita o texto do versículo
- Tom reverente mas acessível
- Não use emojis, asteriscos ou markdown
- Devocional + Aplicação juntos não devem exceder 7 linhas
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
        max_tokens: 1500,
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
    const rawContent = aiData.choices?.[0]?.message?.content || ''

    // Try to parse structured JSON from AI response
    let sections = null
    try {
      // Extract JSON from response (handle possible markdown wrapping)
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        sections = JSON.parse(jsonMatch[0])
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
