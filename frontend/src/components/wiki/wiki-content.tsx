"use client";

import React from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function preprocessWikilinks(md: string): string {
  return md
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "[$2](/wiki/$1)")
    .replace(/\[\[([^\]]+)\]\]/g, "[$1](/wiki/$1)");
}

export function WikiContent({ markdown }: { markdown: string }) {
  const processed = preprocessWikilinks(markdown);

  return (
    <div className="prose-wiki">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-heading text-3xl font-normal leading-tight text-foreground mt-0 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-heading text-2xl font-normal mt-10 mb-3 pb-2 border-b border-border text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-heading text-xl font-normal mt-7 mb-2 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="font-heading text-lg font-normal mt-5 mb-1.5 text-foreground">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-7 text-foreground/90 mb-4">{children}</p>
          ),
          a: ({ href, children }) => {
            if (href?.startsWith("/wiki/")) {
              return (
                <Link
                  href={href}
                  className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                >
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                {children}
              </a>
            );
          },
          code: ({ children, className }) => {
            const isBlock = className?.startsWith("language-");
            if (isBlock) {
              return (
                <code className="block text-xs font-mono text-foreground/90 leading-6">
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-surface-variant text-primary px-1.5 py-0.5 rounded-sm font-mono text-[0.8em]">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-surface border border-border rounded-xl p-4 overflow-x-auto my-5 text-sm">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/40 pl-4 my-4 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 mb-4 space-y-1 text-sm text-foreground/90">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 mb-4 space-y-1 text-sm text-foreground/90">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-7">{children}</li>,
          hr: () => <hr className="border-border my-8" />,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          table: ({ children }) => (
            <div className="my-5 rounded-xl border border-border overflow-hidden shadow-sahara">
              <Table>{children}</Table>
            </div>
          ),
          thead: ({ children }) => <TableHeader>{children}</TableHeader>,
          tbody: ({ children }) => <TableBody>{children}</TableBody>,
          tr: ({ children }) => <TableRow>{children}</TableRow>,
          th: ({ children }) => (
            <TableHead className="text-xs uppercase tracking-wider">{children}</TableHead>
          ),
          td: ({ children }) => <TableCell className="text-sm">{children}</TableCell>,
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
