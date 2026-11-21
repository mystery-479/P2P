import { TrendUp, TrendDown } from "./icons";

type StatCardProps = {
  title: string;
  value: string | number;
  trend: {
    label: string;
    direction: "up" | "down";
  };
  icon: React.ReactNode;
  variant?: "default" | "critical" | "resolved" | "pending";
};

export function StatCard({ title, value, trend, icon, variant = "default" }: StatCardProps) {
  const variantClass = {
    default: "stat-card__icon",
    critical: "stat-card__icon--critical",
    resolved: "stat-card__icon--resolved",
    pending: "stat-card__icon--pending",
  }[variant];

  return (
    <article className="stat-card">
      <div className={variantClass}>{icon}</div>
      <div className="stat-card__body">
        <p className="stat-card__label">{title}</p>
        <div className="stat-card__value">{value}</div>
        <div className={`stat-card__trend stat-card__trend--${trend.direction}`}>
          {trend.direction === "up" ? <TrendUp size={12} className="stat-card__trend-icon" /> : <TrendDown size={12} className="stat-card__trend-icon" />}
          <span>{trend.label}</span>
        </div>
      </div>
    </article>
  );
}
