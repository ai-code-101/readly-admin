export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-wide ${className}`}>
      <svg width="24" height="20" viewBox="0 0 24 20" fill="none" aria-hidden>
        <path d="M2 3h12a5 5 0 0 1 0 10H8l7 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 8h9" stroke="#e3b23c" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      READLY
    </span>
  );
}
