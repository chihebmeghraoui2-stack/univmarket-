import { CheckCircle, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OnboardingStep {
  id: number;
  label: string;
  description: string;
  completed: boolean;
  href: string;
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
}

export default function OnboardingChecklist({ steps }: OnboardingChecklistProps) {
  const completedCount = steps.filter((step) => step.completed).length;
  const allCompleted = completedCount === steps.length && steps.length > 0;
  const nextStep = steps.find((step) => !step.completed) ?? steps[0];
  const progress = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <Card className={allCompleted ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Checklist d'onboarding</CardTitle>
            <p className="text-sm text-muted-foreground">{completedCount}/{steps.length} étapes complétées</p>
          </div>
          <Badge variant={allCompleted ? "secondary" : "outline"}>{allCompleted ? "Terminé" : "En cours"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
        </div>
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-start gap-4 rounded-2xl border border-slate-200 p-4">
              <div className="mt-1">
                {step.completed ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-slate-400" />}
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{step.label}</p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <Button asChild>
          <a href={nextStep.href}>{allCompleted ? "Revoir" : "Commencer"}</a>
        </Button>
      </CardContent>
    </Card>
  );
}
