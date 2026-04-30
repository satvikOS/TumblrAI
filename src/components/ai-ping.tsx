"use client";
import { useState } from "react";
import { Plug, CheckCircle2, AlertCircle } from "lucide-react";
import { LogoSpinner } from "@/components/logo-3d";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PingResult = {
  ok: boolean;
  configured: boolean;
  adapter: "openai-v1" | "azure-deployment" | "none";
  endpoint: string | null;
  isV1: boolean;
  apiVersion: string;
  deployments: {
    primary: string;
    pro: string;
    reasoning: string;
    embedding: string | null;
    image: string | null;
  };
  response?: string;
  latencyMs?: number;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  error?: string;
  statusCode?: number;
  responseBody?: string;
  hint?: string;
};

export function AiPing() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PingResult | null>(null);

  async function run() {
    setBusy(true);
    try {
      const r = await fetch("/api/ai/ping");
      const j = (await r.json()) as PingResult;
      setResult(j);
    } catch (err) {
      setResult({
        ok: false,
        configured: false,
        adapter: "none",
        endpoint: null,
        isV1: false,
        apiVersion: "",
        deployments: { primary: "", pro: "", reasoning: "", embedding: null, image: null },
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Live model test</div>
        <Button size="sm" variant="outline" onClick={run} disabled={busy}>
          {busy ? <LogoSpinner size={14} /> : <Plug />}
          Test connection
        </Button>
      </div>

      {result && (
        <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3 text-xs">
          <div className="flex items-center gap-2">
            {result.ok ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </Badge>
            ) : (
              <Badge variant="danger" className="gap-1">
                <AlertCircle className="h-3 w-3" /> Failed
              </Badge>
            )}
            <span className="text-muted-foreground">
              adapter <code className="text-foreground">{result.adapter}</code>
              {" · "}
              {result.isV1 ? "OpenAI v1 path" : "deployment path"}
            </span>
            {result.latencyMs != null && (
              <span className="ml-auto text-muted-foreground">{result.latencyMs}ms</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
            <div>
              <div className="text-[10px] uppercase tracking-wider">Endpoint</div>
              <code className="text-[11px] text-foreground">{result.endpoint ?? "—"}</code>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider">Primary deployment</div>
              <code className="text-[11px] text-foreground">{result.deployments.primary}</code>
            </div>
          </div>

          {result.ok && result.response && (
            <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
              ↩ {result.response}
              {result.usage?.totalTokens != null && (
                <span className="ml-2 opacity-70">({result.usage.totalTokens} tokens)</span>
              )}
            </div>
          )}

          {result.error && (
            <div className="space-y-1 rounded border border-red-500/30 bg-red-500/5 p-2 text-[11px] text-red-700 dark:text-red-400">
              <div className="font-medium">{result.error}</div>
              {result.statusCode && <div>HTTP {result.statusCode}</div>}
              {result.responseBody && (
                <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap font-mono text-[10px] opacity-80">
                  {result.responseBody}
                </pre>
              )}
              {result.hint && (
                <div className="mt-1 rounded bg-background/40 p-1.5 text-[11px] text-foreground">
                  💡 {result.hint}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
