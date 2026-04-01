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

    const prompt = `Você é um teólogo evangélico experiente. Gere notas de estudo para o versículo abaixo, organizadas em seções claramente separadas.

Livro: ${bookName}
Capítulo: ${chapter}
Versículo: ${verse}
Texto: "${verseText}"

Contexto (versículos ao redor):
${contextText}

Formato obrigatório (use exatamente estes títulos de seção):

**📖 Matthew Henry**
Escreva uma nota devocional e prática no estilo característico de Matthew Henry. Inclua aplicação espiritual para a vida cristã. Cite como se fosse do Comentário Bíblico de Matthew Henry. 2-3 parágrafos.

**📚 Augustus H. Strong**
Escreva uma nota teológica sistemática no estilo de Augustus Hopkins Strong (Teologia Sistemática). Aborde aspectos doutrinários e teológicos relevantes do versículo. 1-2 parágrafos.

**🔥 Nota Pentecostal**
Uma breve nota (2-3 frases) com perspectiva pentecostal/carismática sobre o versículo. Cite a fonte (ex: "Bíblia de Estudo Pentecostal", "Comentário Pentecostal do NT").

Instruções gerais:
- Escreva em português brasileiro
- Não repita o texto do versículo
- Tom reverente mas acessível
- Cada seção deve ser claramente identificada com o título em negrito`

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
