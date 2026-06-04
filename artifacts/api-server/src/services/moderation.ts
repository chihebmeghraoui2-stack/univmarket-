export async function checkToxicity(text: string): Promise<number> {
  try {
    const apiKey = process.env.PERSPECTIVE_API_KEY;
    if (!apiKey) return 0;

    const response = await fetch(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: { text },
          languages: ["fr", "ar", "en"],
          requestedAttributes: { TOXICITY: {} }
        })
      }
    );

    if (!response.ok) return 0;
    const data = await response.json();
    return data.attributeScores?.TOXICITY?.summaryScore?.value ?? 0;
  } catch {
    return 0;
  }
}

export async function isToxic(text: string, threshold = 0.85): Promise<boolean> {
  const score = await checkToxicity(text);
  return score > threshold;
}

