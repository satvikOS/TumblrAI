import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth";
import { isAzureConfigured, deployments } from "@/lib/ai/azure";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = (await getSession())!;
  return (
    <div>
      <PageHeader title="Settings" description="Profile, integrations, and model configuration." />

      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row k="Name" v={user.name} />
            <Row k="Email" v={user.email} />
            <Row k="Tier" v={<Badge variant="outline" className="capitalize">{user.tier}</Badge>} />
            <SettingsClient currentUserId={user.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Azure AI Foundry</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row
              k="Status"
              v={
                isAzureConfigured ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Badge variant="warn">Not configured</Badge>
                )
              }
            />
            <Row k="Primary" v={<code className="text-xs">{deployments.primary}</code>} />
            <Row k="Pro" v={<code className="text-xs">{deployments.pro}</code>} />
            <Row k="Reasoning" v={<code className="text-xs">{deployments.reasoning}</code>} />
            <Row k="Embedding" v={<code className="text-xs">{deployments.embedding}</code>} />
            <Row k="Image" v={<code className="text-xs">{deployments.image}</code>} />
            <p className="border-t border-border pt-3 text-xs text-muted-foreground">
              Configure via env vars: <code>AZURE_OPENAI_ENDPOINT</code>,{" "}
              <code>AZURE_OPENAI_API_KEY</code>. Defaults assume gpt-5-mini / gpt-5 / o4-mini.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Engagement model</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Notecount runs a TypeScript port of the Group 14 model
              (VADER + LDA-style topic + length + tag features). Coefficients are
              calibrated to the published platform-specific findings:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Tumblr: neutral &gt; emotional, Natural Scenery / Artistic Expression dominate.</li>
              <li>Reddit (r/travel): emotional intensity &gt; neutral, Q&amp;A dominates.</li>
            </ul>
            <p>
              Replace with a Modal-hosted XGBoost endpoint by swapping{" "}
              <code className="text-xs">/api/predict</code>'s implementation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <div className="text-muted-foreground">{k}</div>
      <div>{v}</div>
    </div>
  );
}
