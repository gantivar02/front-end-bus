function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

const SIZES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const TONES = {
  primary: "bg-neg-primary-container text-neg-on-primary-container",
  secondary: "bg-neg-secondary-container text-neg-on-secondary-container",
  tertiary: "bg-neg-tertiary-container text-neg-on-tertiary-container",
};

export default function NegAvatar({ name, tone = "primary", size = "md" }) {
  return (
    <div
      className={`${SIZES[size]} ${TONES[tone]} rounded-full flex items-center justify-center font-bold font-headline`}
      aria-label={name}
    >
      {initials(name) || "?"}
    </div>
  );
}
