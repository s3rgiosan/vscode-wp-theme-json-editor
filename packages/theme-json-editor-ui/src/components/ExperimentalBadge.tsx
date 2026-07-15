/**
 * Small inline badge indicating a property is experimental or undocumented.
 * Shows "Experimental" by default, or "Undocumented" when `isUndocumented` is true.
 */

interface ExperimentalBadgeProps {
  readonly isUndocumented?: boolean;
}

export function ExperimentalBadge({ isUndocumented }: ExperimentalBadgeProps) {
  const label = isUndocumented ? "Undocumented" : "Experimental";
  const title = isUndocumented
    ? "Valid in WordPress core but not yet in the published theme.json schema; may change without notice."
    : "Experimental WordPress API (prefixed __experimental); may change or be removed without notice.";

  return (
    <span
      className="inline-block px-1.5 py-0.5 text-tertiary rounded bg-tje-badge-bg text-tje-badge-fg ml-2"
      title={title}
    >
      {label}
    </span>
  );
}
