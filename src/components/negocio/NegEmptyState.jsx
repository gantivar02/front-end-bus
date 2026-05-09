export default function NegEmptyState({ icon = "inbox", title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="w-14 h-14 rounded-full bg-neg-surface-container-high text-neg-on-surface-variant flex items-center justify-center">
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <div>
        <p className="font-semibold text-neg-on-surface">{title}</p>
        {description && (
          <p className="text-sm text-neg-on-surface-variant max-w-sm mx-auto mt-1">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
