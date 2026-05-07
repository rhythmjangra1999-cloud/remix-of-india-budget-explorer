import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import glossary from "@/data/glossary.json";

type GlossaryKey = keyof typeof glossary;

interface DefinitionProps {
  term: GlossaryKey;
  children?: React.ReactNode;
  inline?: boolean;
}

export function Definition({ term, children, inline = true }: DefinitionProps) {
  const entry = glossary[term];
  if (!entry) return <>{children}</>;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`${inline ? "inline-flex" : "flex"} items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-primary transition-colors`}
        >
          {children ?? entry.term}
          <Info className="h-3 w-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm">
        <div className="font-semibold font-serif">{entry.term}</div>
        <div className="mt-1 text-xs text-muted-foreground">{entry.short}</div>
        <div className="mt-2 text-xs leading-relaxed">{entry.long}</div>
      </PopoverContent>
    </Popover>
  );
}
