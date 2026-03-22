interface StatCardProps {
  emoji: string;
  label: string;
  value: number | string;
  color?: "purple" | "blue" | "green" | "yellow" | "orange" | "pink" | "indigo";
  subtitle?: string;
}

const COLOR_MAP = {
  purple: "bg-purple-50 border-purple-100 text-purple-700",
  blue: "bg-blue-50 border-blue-100 text-blue-700",
  green: "bg-green-50 border-green-100 text-green-700",
  yellow: "bg-yellow-50 border-yellow-100 text-yellow-700",
  orange: "bg-orange-50 border-orange-100 text-orange-700",
  pink: "bg-pink-50 border-pink-100 text-pink-700",
  indigo: "bg-indigo-50 border-indigo-100 text-indigo-700",
};

export default function StatCard({
  emoji,
  label,
  value,
  color = "indigo",
  subtitle,
}: StatCardProps) {
  const colorClass = COLOR_MAP[color];

  return (
    <div className={`rounded-2xl p-5 border shadow-sm ${colorClass}`}>
      <div className="text-3xl mb-3">{emoji}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-1 opacity-80">{label}</div>
      {subtitle && <div className="text-xs opacity-60 mt-1">{subtitle}</div>}
    </div>
  );
}
