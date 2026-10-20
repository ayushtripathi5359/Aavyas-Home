/** Shown instantly while a public page's data loads, so tab changes feel immediate. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="h-56 bg-[linear-gradient(180deg,#f6eee2_0%,#faf6ef_100%)]">
        <div className="mx-auto max-w-[80rem] px-4 pt-16 sm:px-8">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton mt-5 h-14 w-72 max-w-full" />
          <div className="skeleton mt-5 h-4 w-96 max-w-full" />
        </div>
      </div>
      <div className="mx-auto grid max-w-[80rem] gap-4 px-4 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-40" />)}
      </div>
    </div>
  );
}
