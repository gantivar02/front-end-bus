import NegCard from "./NegCard";

export default function NegFilterBar({ children, actions, className = "" }) {
  return (
    <NegCard
      variant="subtle"
      padding="sm"
      className={`flex flex-col gap-3 md:flex-row md:items-end md:gap-4 ${className}`}
    >
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {children}
      </div>
      {actions && (
        <div className="flex items-center gap-2 md:self-end">{actions}</div>
      )}
    </NegCard>
  );
}
