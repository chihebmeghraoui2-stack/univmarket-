export async function callAI(prompt: string, maxTokens: number = 400): Promise<string> {
  // 1. Essai GROQ
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) { console.log("AI: GROQ ok"); return text; }
      } else {
        console.log("GROQ failed:", res.status, await res.text());
      }
    } catch (e) { console.log("GROQ exception:", e); }
  }

  // 2. Fallback Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
          })
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) { console.log("AI: Gemini fallback ok"); return text; }
      } else {
        console.log("Gemini failed:", res.status, await res.text());
      }
    } catch (e) { console.log("Gemini exception:", e); }
  }

  // 3. Fallback HuggingFace
  const hfKey = process.env.HF_API_KEY;
  if (hfKey) {
    try {
      const res = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${hfKey}` },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { max_new_tokens: maxTokens, temperature: 0.7, return_full_text: false }
          })
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = Array.isArray(data) ? data[0]?.generated_text?.trim() : data?.generated_text?.trim();
        if (text) { console.log("AI: HuggingFace fallback ok"); return text; }
      } else {
        console.log("HuggingFace failed:", res.status, await res.text());
      }
    } catch (e) { console.log("HuggingFace exception:", e); }
  }

  throw new Error("Tous les services IA sont indisponibles");
}
