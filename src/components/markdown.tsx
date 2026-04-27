"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// Tightly-styled markdown renderer for chat + agent output.
// Inherits the surrounding text color/size; only adds typographic structure.
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("prose-content space-y-2 leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="font-display text-xl font-semibold tracking-tight" {...p} />,
          h2: (p) => <h2 className="font-display text-lg font-semibold tracking-tight" {...p} />,
          h3: (p) => <h3 className="font-display text-base font-semibold tracking-tight" {...p} />,
          p: (p) => <p className="leading-relaxed" {...p} />,
          a: (p) => <a className="text-primary underline-offset-2 hover:underline" target="_blank" rel="noreferrer" {...p} />,
          strong: (p) => <strong className="font-semibold" {...p} />,
          em: (p) => <em className="italic" {...p} />,
          ul: (p) => <ul className="ml-4 list-disc space-y-1" {...p} />,
          ol: (p) => <ol className="ml-4 list-decimal space-y-1" {...p} />,
          li: (p) => <li className="leading-relaxed" {...p} />,
          blockquote: (p) => (
            <blockquote className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground" {...p} />
          ),
          code: ({ className: codeClass, children, ...rest }) => {
            const isBlock = /language-/.test(codeClass ?? "");
            if (isBlock) {
              return (
                <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-[12px] leading-relaxed">
                  <code className={cn("text-foreground", codeClass)} {...rest}>
                    {children}
                  </code>
                </pre>
              );
            }
            return (
              <code
                className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground"
                {...rest}
              >
                {children}
              </code>
            );
          },
          hr: () => <hr className="my-3 border-border-soft" />,
          table: (p) => <table className="w-full border-collapse text-left text-xs" {...p} />,
          th: (p) => <th className="border-b border-border px-2 py-1 font-semibold" {...p} />,
          td: (p) => <td className="border-b border-border-soft px-2 py-1" {...p} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
