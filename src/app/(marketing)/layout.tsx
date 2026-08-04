export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The marketing route renders as a raw page — the floating nav is
  // rendered inside the page itself, so this layout is intentionally
  // a bare passthrough.
  return <>{children}</>;
}
