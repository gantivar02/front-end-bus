export default function NegTimeline({ items = [] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-neg-on-surface-variant">Sin movimientos.</p>
    );
  }

  return (
    <ol className="relative pl-6">
      <span
        aria-hidden
        className="absolute left-2 top-1 bottom-1 w-px bg-neg-outline-variant"
      />
      {items.map((item, idx) => (
        <li
          key={item.id ?? idx}
          className={`relative ${idx === items.length - 1 ? "" : "pb-5"}`}
        >
          <span
            className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full flex items-center justify-center ${
              item.tone === "danger"
                ? "bg-neg-error text-neg-on-error"
                : item.tone === "warning"
                ? "bg-amber-500 text-white"
                : "bg-neg-primary text-neg-on-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[10px]">
              {item.icon ?? "circle"}
            </span>
          </span>
          <p className="text-sm font-semibold text-neg-on-surface">
            {item.title}
          </p>
          {item.description && (
            <p className="text-xs text-neg-on-surface-variant mt-0.5">
              {item.description}
            </p>
          )}
          {item.timestamp && (
            <p className="text-[11px] text-neg-on-surface-variant/80 mt-0.5">
              {item.timestamp}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
