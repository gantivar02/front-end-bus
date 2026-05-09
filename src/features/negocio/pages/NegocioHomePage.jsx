import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  NegPageHeader,
  NegCard,
  NegChip,
  NegKpiCard,
} from "../../../components/negocio";

const QUICK_ACCESS = [
  {
    to: "/negocio/incidentes/reportar",
    icon: "report",
    title: "Reporte rápido",
    description: "Registra un incidente con foto y gravedad en segundos.",
  },
  {
    to: "/negocio/incidentes/bus",
    icon: "directions_bus",
    title: "Incidentes por bus",
    description: "Consulta, comenta y resuelve los incidentes de cada bus.",
  },
  {
    to: "/negocio/recargas/nueva",
    icon: "credit_card",
    title: "Recargar tarjeta",
    description: "Procesa recargas con ePayco de forma segura.",
  },
  {
    to: "/negocio/reportes/tendencia-incidentes",
    icon: "trending_up",
    title: "Tendencia de incidentes",
    description: "Analiza la evolución mensual y detecta picos.",
  },
];

export default function NegocioHomePage() {
  const { user, roles } = useAuth();
  const nombre = user?.name ?? "Usuario";

  return (
    <div className="max-w-6xl">
      <NegPageHeader
        eyebrow="Panel de operaciones"
        title={`Bienvenido, ${nombre}`}
        subtitle="Resumen del módulo de negocio: incidentes, recargas y reportes operativos."
      />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <NegKpiCard
          label="Incidentes abiertos"
          value="12"
          delta="+3 vs ayer"
          deltaTone="down"
          icon="report"
          iconTone="danger"
        />
        <NegKpiCard
          label="Resueltos hoy"
          value="8"
          delta="+22% semana"
          deltaTone="up"
          icon="check_circle"
          iconTone="primary"
        />
        <NegKpiCard
          label="Recargas hoy"
          value="$1.240.000"
          delta="96 transacciones"
          icon="paid"
          iconTone="secondary"
        />
        <NegKpiCard
          label="Buses activos"
          value="47"
          hint="de 52 en flota"
          icon="directions_bus"
          iconTone="tertiary"
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {QUICK_ACCESS.map((q) => (
          <Link key={q.to} to={q.to} className="group">
            <NegCard variant="elevated" className="h-full transition-shadow group-hover:shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-neg-primary-container text-neg-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined">{q.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-neg-on-surface">
                      {q.title}
                    </h3>
                    <span className="material-symbols-outlined text-neg-on-surface-variant group-hover:text-neg-primary transition-colors">
                      arrow_forward
                    </span>
                  </div>
                  <p className="text-sm text-neg-on-surface-variant mt-1">
                    {q.description}
                  </p>
                </div>
              </div>
            </NegCard>
          </Link>
        ))}
      </section>

      <NegCard variant="outlined">
        <h2 className="font-headline text-lg font-bold text-neg-on-surface mb-3">
          Tus roles
        </h2>
        {roles.length === 0 ? (
          <p className="text-sm text-neg-on-surface-variant">
            Sin roles asignados.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <NegChip key={r} tone="primary">
                {r}
              </NegChip>
            ))}
          </div>
        )}
      </NegCard>
    </div>
  );
}
