import { Router } from "express";
import { callAI } from "../lib/ai";
const router = Router();

router.post("/ai/generate-description", async (req, res) => {
  try {
    const { keywords, lang = "fr" } = req.body;
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0)
      return res.status(400).json({ error: "Mots-cles requis" });

    const prompt = lang === "ar"
      ? `���� ����� ������ ������ ����� ������ ������� ����� ��� ������� �������: ${keywords.join(", ")}. ���� ����� ������ �� 3 ��� ��ء ��� �����.`
      : `Redige une description professionnelle et convaincante pour un service universitaire algerien base sur ces mots-cles: ${keywords.join(", ")}. Ecris directement la description en 3 phrases claires, sans introduction ni titre, sans emojis.`;

    const description = await callAI(prompt, 200);
    res.json({ description });
  } catch (e) {
    console.log("ai-description error:", e);
    res.status(500).json({ error: "Tous les services IA sont indisponibles" });
  }
});

export default router;
