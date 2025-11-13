// Cloudflare Worker: secure gateway between your site and OpenAI
export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const apiKey = env.OPENAI_API_KEY; // set this as a Secret in Cloudflare
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Missing OPENAI_API_KEY in environment" }),
          { status: 500, headers: corsHeaders }
        );
      }

      // Expect { messages: [...] } from the front end
      const userInput = await request.json();

      const apiUrl = "https://api.openai.com/v1/chat/completions";
      const requestBody = {
        model: "gpt-4o-mini", // safe default for course keys
        messages: userInput.messages,
        max_tokens: 300
      };

      const openAIResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      const data = await openAIResponse.json();

      return new Response(JSON.stringify(data), {
        status: openAIResponse.status,
        headers: corsHeaders
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Worker error", message: String(err) }),
        { status: 500, headers: corsHeaders }
      );
    }
  }
};
