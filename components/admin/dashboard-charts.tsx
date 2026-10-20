"use client";

import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  New: "#A65332", Contacted: "#C9A24A", Confirmed: "#78816A", Cancelled: "#8B8178", Completed: "#29231F",
};

export function EnquiriesOverTime({ data }: { data: { date: string; count: number }[] }) {
  return (
    <div className="h-64" role="img" aria-label="Enquiries received per day over the last 30 days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E6D7C5" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Area type="monotone" dataKey="count" name="Enquiries" stroke="#A65332" fill="#A65332" fillOpacity={0.18} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusPie({ data }: { data: { name: string; value: number }[] }) {
  const nonZero = data.filter((d) => d.value > 0);
  if (nonZero.length === 0) return <p className="py-16 text-center text-sm text-espresso/60">No enquiries yet.</p>;
  return (
    <div className="h-64" role="img" aria-label="Enquiry status distribution">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={nonZero} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
            {nonZero.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name] ?? "#78816A"} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
