const GROS_MOTS_EXACT: string[] = [
  "connard","merde","putain","salope","enculé","batard","fdp","niquer","bite","con","cul",
  "fuck","shit","bitch","asshole","damn","bastard","dick","cunt","whore","nigger",
  "يلعن","كلب","حمار","زبالة","منيوك","قحبة","وليد الحرام","عاهرة","كس",
  "kahba","zemel","hmar","weld el kahba","tboun","3erse","qahba","ma9na3","sharmouta",
  "zob","nyak","ntayak","bezdek","la3net","ta9a7ba","yel3an","7mar","9a7ba"
];

// Variantes phonetiques et fautes d ecriture deliberees
const VARIANTES: Record<string, string[]> = {
  "connard": ["konnar","konar","c0nnard","c0nnar","konard","connar"],
  "merde":   ["merd","m3rde","merd3","m€rde","mèrde"],
  "putain":  ["ptn","p1tain","p*tain","putn","putain","poutain"],
  "fuck":    ["f*ck","fu*k","fuk","f.u.c.k","phuck","fvck"],
  "shit":    ["sh1t","$hit","sh!t","sht"],
  "kahba":   ["ka7ba","k@hba","k4hba","kahb@","kah8a"],
  "zemel":   ["z3mel","z€mel","zml","7zemel"],
  "hmar":    ["7mar","h.m.a.r","hm@r","5mar"],
  "qahba":   ["q@hba","qa7ba","q4hba","9ahba","9a7ba"],
  "niquer":  ["niké","n1quer","nik3r","n*quer","niké"],
  "tboun":   ["tb0un","t.b.o.u.n","tb9un"],
};

// Distance de Levenshtein pour detecter les fautes proches
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

// Normaliser le texte : supprimer espaces, remplacer caracteres speciaux
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[0-9@$€*!.]/g, c => ({
      '0':'o','3':'e','4':'a','1':'i','$':'s','@':'a','€':'e','*':'','!':'i','.':''
    }[c] ?? c))
    .replace(/\s+/g, '')
    .replace(/(.)\1{2,}/g, '$1'); // reduire les repetitions: "meerdeee" -> "merde"
}

// Extraire les mots du texte
function extractWords(text: string): string[] {
  return text.toLowerCase().split(/[\s,;.!?'"()\[\]{}/\\]+/).filter(w => w.length > 1);
}

export function containsProfanity(text: string): { found: boolean; word?: string; confidence: number } {
  const words = extractWords(text);
  const normalizedText = normalize(text);

  for (const word of words) {
    const normWord = normalize(word);

    // 1. Verification exacte
    for (const bad of GROS_MOTS_EXACT) {
      if (normWord === normalize(bad)) {
        return { found: true, word: bad, confidence: 1.0 };
      }
    }

    // 2. Verification variantes connues
    for (const [base, variants] of Object.entries(VARIANTES)) {
      for (const variant of variants) {
        if (normWord === normalize(variant)) {
          return { found: true, word: base, confidence: 0.95 };
        }
      }
    }

    // 3. Detection fuzzy (Levenshtein) pour mots de 5+ lettres
    if (normWord.length >= 5) {
      for (const bad of GROS_MOTS_EXACT) {
        const normBad = normalize(bad);
        if (normBad.length >= 4) {
          const dist = levenshtein(normWord, normBad);
          const maxLen = Math.max(normWord.length, normBad.length);
          const similarity = 1 - dist / maxLen;
          if (similarity >= 0.80) {
            return { found: true, word: bad, confidence: similarity };
          }
        }
      }
    }

    // 4. Detection par inclusion (mot contenu dans un autre)
    for (const bad of GROS_MOTS_EXACT) {
      const normBad = normalize(bad);
      if (normBad.length >= 4 && normalizedText.includes(normBad)) {
        return { found: true, word: bad, confidence: 0.85 };
      }
    }
  }

  return { found: false, confidence: 0 };
}

// Version simple pour les anciens appels
export function hasProfanity(text: string): boolean {
  return containsProfanity(text).found;
}

