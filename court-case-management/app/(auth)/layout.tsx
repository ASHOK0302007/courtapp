import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-ink-800 font-display text-sm font-semibold text-ink-800">
          D
        </div>
        <span className="font-display text-lg font-medium text-ink-900">Docket</span>
      </Link>
      <div className="w-full max-w-sm rounded-lg border border-ink-100 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
