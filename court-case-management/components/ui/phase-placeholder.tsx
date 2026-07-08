import { Card, CardContent } from "@/components/ui/card";

export function PhasePlaceholder({ title, phase, detail }: { title: string; phase: string; detail: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink-900">{title}</h1>
      <Card className="mt-6 border-dashed">
        <CardContent>
          <p className="font-mono text-xs uppercase tracking-wide text-brass-500">{phase}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{detail}</p>
        </CardContent>
      </Card>
    </div>
  );
}
