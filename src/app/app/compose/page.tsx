import { Composer } from "@/components/composer";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Composer" };

export default function ComposePage() {
  return (
    <div>
      <PageHeader
        title="Composer"
        description="Write, score, and let the agent rewrite — all in one canvas."
      />
      <Composer />
    </div>
  );
}
