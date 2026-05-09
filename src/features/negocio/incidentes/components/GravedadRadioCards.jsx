import NegRadioCard from "../../../../components/negocio/NegRadioCard";
import { GRAVEDADES } from "../../_mocks/catalogos";

const ACCENT_BY_TONE = {
  success: "primary",
  warning: "warning",
  danger: "danger",
};

export default function GravedadRadioCards({ value, onChange, name = "gravedad" }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {GRAVEDADES.map((opt) => (
        <NegRadioCard
          key={opt.value}
          name={name}
          value={opt.value}
          checked={value === opt.value}
          onChange={onChange}
          icon={opt.icon}
          title={opt.label}
          description={
            opt.value === "critico"
              ? "Notifica al supervisor"
              : opt.value === "alto"
              ? "Prioridad alta"
              : undefined
          }
          accent={ACCENT_BY_TONE[opt.tone] ?? "primary"}
        />
      ))}
    </div>
  );
}
