/**
 * Small inline badge indicating a property is experimental or undocumented.
 * Shows "Experimental" by default, or "Undocumented" when `isUndocumented` is true.
 */

interface ExperimentalBadgeProps {
  readonly isUndocumented?: boolean;
}

export function ExperimentalBadge({ isUndocumented }: ExperimentalBadgeProps) {
  const label = isUndocumented ? "Undocumented" : "Experimental";

  return (
    <span
      className="inline-block px-1.5 py-0.5 text-tertiary rounded bg-tje-badge-bg text-tje-badge-fg ml-2"
      title={`This property is ${label.toLowerCase()} and may change without notice.`}
    >
      {label}
    </span>
  );
}
