import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AgriRow, HierNode } from "@/lib/agri";
import { formatCr } from "@/lib/format";

interface Props {
  root: HierNode;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}

// Linked hierarchical table. When sunburst selects a key:
//   - the matching row is auto-expanded and scrolled into view
//   - sibling branches are collapsed
export function AgriTable({ root, selectedKey, onSelect }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");

  // Auto-expand ancestors of the selected key
  const effectiveExpanded = useMemo(() => {
    const s = new Set(expanded);
    if (selectedKey) {
      const parts = selectedKey.split(".");
      for (let i = 1; i <= parts.length; i++) s.add(parts.slice(0, i).join("."));
    }
    return s;
  }, [expanded, selectedKey]);

  const filtered = useMemo(() => {
    if (!q.trim()) return root;
    const needle = q.toLowerCase();
    function filter(n: HierNode): HierNode | null {
      const selfMatch = n.name.toLowerCase().includes(needle);
      if (!n.children) return selfMatch ? n : null;
      const kids = n.children
        .map(filter)
        .filter((x): x is HierNode => x !== null);
      if (selfMatch || kids.length) return { ...n, children: kids };
      return null;
    }
    return filter(root) ?? root;
  }, [root, q]);

  function toggle(key: string) {
    setExpanded((s) => {
      const n = new Set(s);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search heads…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      <div className="overflow-y-auto rounded-sm border border-border bg-card flex-1 min-h-[400px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card border-b border-border z-10">
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">Head</th>
              <th className="px-3 py-2 font-medium text-right tnum">BE 26-27</th>
              <th className="px-3 py-2 font-medium text-right tnum">YoY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.children?.map((major) => (
              <Branch
                key={major.key}
                node={major}
                depth={0}
                expanded={effectiveExpanded}
                selectedKey={selectedKey}
                toggle={toggle}
                onSelect={onSelect}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Branch({
  node,
  depth,
  expanded,
  selectedKey,
  toggle,
  onSelect,
}: {
  node: HierNode;
  depth: number;
  expanded: Set<string>;
  selectedKey: string | null;
  toggle: (k: string) => void;
  onSelect: (k: string | null) => void;
}) {
  const isOpen = expanded.has(node.key);
  const isSelected = selectedKey === node.key;
  const hasKids = !!node.children?.length;
  const yoy = node.prevValue ? ((node.value - node.prevValue) / node.prevValue) * 100 : 0;

  return (
    <>
      <tr
        className={`hover:bg-muted/40 cursor-pointer transition-colors ${
          isSelected ? "bg-primary/10" : ""
        }`}
        onClick={() => {
          if (hasKids) toggle(node.key);
          onSelect(isSelected ? null : node.key);
        }}
        ref={(el) => {
          if (el && isSelected) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }}
      >
        <td className="px-3 py-1.5" style={{ paddingLeft: 12 + depth * 16 }}>
          <div className="flex items-start gap-1.5">
            {hasKids ? (
              isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
              )
            ) : (
              <span className="w-3.5 shrink-0" />
            )}
            <span
              className={`leading-tight ${
                depth === 0 ? "font-semibold" : depth === 1 ? "font-medium" : ""
              } ${isSelected ? "text-primary" : ""}`}
            >
              {node.name}
            </span>
          </div>
        </td>
        <td className="px-3 py-1.5 text-right tnum font-mono text-xs">
          {formatCr(node.value, { compact: true })}
        </td>
        <td
          className={`px-3 py-1.5 text-right tnum font-mono text-xs ${
            yoy >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
          }`}
        >
          {node.prevValue ? `${yoy >= 0 ? "+" : ""}${yoy.toFixed(1)}%` : "—"}
        </td>
      </tr>

      {/* Children */}
      {isOpen && node.children?.map((c) => (
        <Branch
          key={c.key}
          node={c}
          depth={depth + 1}
          expanded={expanded}
          selectedKey={selectedKey}
          toggle={toggle}
          onSelect={onSelect}
        />
      ))}

      {/* Sub-Head leaves: render object-head detail when expanded */}
      {isOpen && node.level === "sub" && node.rows?.map((r) => (
        <tr key={r.id} className="bg-secondary/20 text-xs">
          <td className="py-1 text-muted-foreground" style={{ paddingLeft: 12 + (depth + 1) * 16 }}>
            <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/40 mr-2 align-middle" />
            {r.objectHead} · {r.objectHeadName}
            <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-card border border-border">
              {r.section === "Revenue" ? "Rev" : "Cap"}
            </span>
            {r.gapFlag && (
              <span className={`ml-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                r.gapFlag === "NEW" ? "bg-green-500/15 text-green-700 dark:text-green-400" :
                r.gapFlag === "DISCONTINUED" ? "bg-red-500/15 text-red-700 dark:text-red-400" :
                "bg-muted text-muted-foreground"
              }`}>{r.gapFlag.toLowerCase()}</span>
            )}
          </td>
          <td className="px-3 py-1 text-right tnum font-mono">
            {r.be2627 != null ? formatCr(r.be2627, { compact: true }) : "—"}
          </td>
          <td className="px-3 py-1 text-right tnum font-mono text-muted-foreground">
            {r.be2526 ? `${(((r.be2627 ?? 0) - r.be2526) / r.be2526 * 100).toFixed(0)}%` : "—"}
          </td>
        </tr>
      ))}
    </>
  );
}

export type _AgriRowRef = AgriRow;  // keep import alive
