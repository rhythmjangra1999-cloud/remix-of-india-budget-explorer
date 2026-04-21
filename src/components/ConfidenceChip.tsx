import { cn } from "@/lib/utils";
import type { ConfidenceLevel } from "@/data/types";

const labels: Record<ConfidenceLevel | "missing", string> = {
  validated: "Validated",
  parsed: "Parsed",
  "ocr-needed": "OCR pending",
  missing: "Not yet",
};

const styles: Record<ConfidenceLevel | "missing", string> = {
  validated: "bg-conf-validated/12 text-conf-validated border-conf-validated/30",
  parsed: "bg-conf-parsed/12 text-conf-parsed border-conf-parsed/30",
  "ocr-needed": "bg-conf-ocr/12 text-conf-ocr border-conf-ocr/30",
  missing: "bg-muted text-muted-foreground border-border",
};

export function ConfidenceChip({
  level,
  className,
}: {
  level: ConfidenceLevel | "missing";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        styles[level],
        className,
      )}
      title={`Data confidence: ${labels[level]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[level]}
    </span>
  );
}
