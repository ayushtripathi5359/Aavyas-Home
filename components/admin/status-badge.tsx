const STYLE: Record<string, string> = {
  NEW: "bg-terracotta/15 text-terracotta-dark",
  CONTACTED: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-olive/20 text-olive-dark",
  CANCELLED: "bg-stone-200 text-stone-700",
  COMPLETED: "bg-espresso text-ivory",
};

export const STATUS_LABEL: Record<string, string> = { NEW: "New", CONTACTED: "Contacted", CONFIRMED: "Confirmed", CANCELLED: "Cancelled", COMPLETED: "Completed" };

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLE[status] ?? ""}`}>{STATUS_LABEL[status] ?? status}</span>;
}
