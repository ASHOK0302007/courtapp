"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DownloadButton({
  endpoint,
  label = "Download",
}: {
  endpoint: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not generate a download link.");
      window.open(json.data.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span>
      <Button size="sm" variant="secondary" onClick={handleDownload} disabled={loading}>
        {loading ? "Preparing…" : label}
      </Button>
      {error && <span className="ml-2 text-sm text-danger-400">{error}</span>}
    </span>
  );
}
