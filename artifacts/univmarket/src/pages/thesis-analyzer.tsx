import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, BookOpen, FileText, Lightbulb, ChevronRight, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";

export default function ThesisAnalyzer() {
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfName, setPdfName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const handlePDF = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Fichier invalide", description: "Selectionnez un fichier PDF.", variant: "destructive" });
      return;
    }
    setPdfLoading(true);
    setPdfName(file.name);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item: any) => item.str).join(" ") + " ";
      }
      setText(fullText.trim());
      toast({ title: "PDF charge", description: pdf.numPages + " pages extraites avec succes." });
    } catch (e) {
      toast({ title: "Erreur PDF", description: "Impossible de lire ce PDF.", variant: "destructive" });
      setPdfName("");
    } finally {
      setPdfLoading(false);
    }
  };

  const analyzeThesis = async () => {
    if (text.trim().length < 100) {
      toast({ title: "Texte trop court", description: "Collez au moins 100 caracteres de votre memoire.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setAnalysis("");
    try {
      const res = await fetch("/api/ai/analyze-thesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        toast({ title: "Erreur IA", description: "Reessayez.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur de connexion", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatAnalysis = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.match(/^[1-9]\.|^#{1,3}/)) {
        return <p key={i} className="font-semibold text-teal-700 mt-3">{line.replace(/^#+\s*/, "")}</p>;
      }
      if (line.startsWith("-") || line.startsWith("â€¢")) {
        return <p key={i} className="text-sm text-slate-700 ml-4 mt-1">â€¢ {line.replace(/^[-â€¢]\s*/, "")}</p>;
      }
      if (line.trim()) {
        return <p key={i} className="text-sm text-slate-700 mt-1">{line}</p>;
      }
      return null;
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link href="/dashboard"><span className="hover:text-teal-700 cursor-pointer">Dashboard</span></Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-800 font-medium">Analyseur IA de Memoire</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-teal-600" />
            Analyseur IA de Memoire
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Collez votre texte ou importez un PDF pour obtenir une analyse academique professionnelle
          </p>
        </div>
        <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-xs">Propulse par Groq AI</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: BookOpen, label: "Resume structure", desc: "5 points cles" },
          { icon: FileText, label: "Chapitres identifies", desc: "Structure analysee" },
          { icon: Lightbulb, label: "Conseils soutenance", desc: "3 recommandations" },
        ].map((item, i) => (
          <Card key={i} className="border border-teal-100 bg-teal-50/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                <item.icon className="h-4 w-4 text-teal-700" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Votre texte de memoire / these</CardTitle>
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handlePDF(e.target.files[0])} />
              {pdfName ? (
                <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-3 py-1.5">
                  <FileText className="h-3.5 w-3.5 text-teal-600" />
                  <span className="text-xs text-teal-700 max-w-32 truncate">{pdfName}</span>
                  <button onClick={() => { setPdfName(""); setText(""); }} className="text-teal-500 hover:text-red-500"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={pdfLoading} className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50 text-xs h-8">
                  {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {pdfLoading ? "Extraction..." : "Importer PDF"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Collez ici votre introduction, resume, ou importez un PDF... (minimum 100 caracteres)"
            rows={10}
            className="resize-none text-sm"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{text.length} caracteres {text.length < 100 && <span className="text-red-500">(minimum 100)</span>}</p>
            <Button onClick={analyzeThesis} disabled={loading || text.trim().length < 100} className="bg-teal-700 hover:bg-teal-600 text-white gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Analyse en cours..." : "Analyser avec Groq AI"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <Card className="border-teal-200 bg-gradient-to-br from-teal-50/50 to-white">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-600" />
            <CardTitle className="text-base text-teal-800">Analyse Groq AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">{formatAnalysis(analysis)}</div>
            <div className="mt-6 pt-4 border-t border-teal-100 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Analyse generee par Groq AI - Llama 3.3 70B</p>
              <Button variant="outline" size="sm" onClick={() => { setText(""); setAnalysis(""); setPdfName(""); }} className="text-xs h-7">
                Nouvelle analyse
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
