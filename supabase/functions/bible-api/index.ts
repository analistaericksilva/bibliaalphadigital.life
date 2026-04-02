import { corsHeaders } from "@supabase/supabase-js/cors";

const API_BASE = "https://www.abibliadigital.com.br/api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, version, abbrev, chapter, number, search } = await req.json();

    let url: string;

    switch (action) {
      case "versions":
        url = `${API_BASE}/versions`;
        break;
      case "books":
        url = `${API_BASE}/books`;
        break;
      case "book":
        if (!abbrev) throw new Error("abbrev is required");
        url = `${API_BASE}/books/${abbrev}`;
        break;
      case "chapter":
        if (!version || !abbrev || !chapter) throw new Error("version, abbrev, chapter required");
        url = `${API_BASE}/verses/${version}/${abbrev}/${chapter}`;
        break;
      case "verse":
        if (!version || !abbrev || !chapter || !number) throw new Error("version, abbrev, chapter, number required");
        url = `${API_BASE}/verses/${version}/${abbrev}/${chapter}/${number}`;
        break;
      case "random":
        url = version
          ? abbrev
            ? `${API_BASE}/verses/${version}/${abbrev}/random`
            : `${API_BASE}/verses/${version}/random`
          : `${API_BASE}/verses/nvi/random`;
        break;
      case "search":
        if (!version || !search) throw new Error("version and search required");
        url = `${API_BASE}/verses/search`;
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const fetchOptions: RequestInit = {
      method: action === "search" ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
    };

    if (action === "search") {
      fetchOptions.body = JSON.stringify({ version, search });
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: data.msg || `API error ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
