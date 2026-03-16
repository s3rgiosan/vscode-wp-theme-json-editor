/**
 * Renders a schema description with proper formatting.
 * Handles newlines, dash-prefixed lists, and inline code backticks.
 */
export function Description({
  text,
  className = "",
}: {
  readonly text: string;
  readonly className?: string;
}) {
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  const listLines: string[] = [];
  const proseLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      listLines.push(trimmed.slice(2));
    } else {
      // If we were accumulating list items, flush them
      if (listLines.length > 0 && proseLines.length > 0) {
        // mixed content — treat the dash line as a list item anyway
      }
      proseLines.push(trimmed);
    }
  }

  // Simple case: no list items
  if (listLines.length === 0) {
    return (
      <p className={`text-[11px] text-vscode-description-fg ${className}`}>
        {formatInlineCode(text)}
      </p>
    );
  }

  // Mixed prose + list
  return (
    <div className={`text-[11px] text-vscode-description-fg ${className}`}>
      {proseLines.length > 0 && (
        <p className="mb-1">{formatInlineCode(proseLines.join(" "))}</p>
      )}
      <ul className="list-disc pl-4 space-y-0.5">
        {listLines.map((item, i) => (
          <li key={i}>{formatInlineCode(item)}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Replace backtick-wrapped text with styled <code> elements.
 */
function formatInlineCode(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-vscode-input-bg text-[10px] font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
