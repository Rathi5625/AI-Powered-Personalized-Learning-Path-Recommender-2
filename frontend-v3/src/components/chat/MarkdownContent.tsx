import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

function CodeBlock({ language, code }: { language?: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Graceful fallback for clipboard failure
    }
  };

  return (
    <div className="my-2.5 overflow-hidden rounded-control border border-dark-2 bg-dark shadow-sm">
      <div className="flex items-center justify-between border-b border-dark-3/60 bg-dark-2/75 px-3 py-1 text-dark-text">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-dark-text/70">
          {(language || 'code').toUpperCase()}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium text-dark-text/70 transition-colors hover:bg-white/10 hover:text-white"
          title="Copy code"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-ok" aria-hidden />
              <span className="text-ok">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" aria-hidden />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-dark-text">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  if (!content) return null;

  return (
    <div className={cn('markdown-body text-sm leading-relaxed', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1({ children }) {
            return (
              <h1 className="mt-3.5 mb-2 text-lg font-bold tracking-tight text-text first:mt-0">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="mt-3 mb-1.5 text-base font-bold tracking-tight text-text first:mt-0">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="mt-2.5 mb-1 text-sm font-bold tracking-tight text-text first:mt-0">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="mt-2 mb-1 text-sm font-semibold text-text first:mt-0">
                {children}
              </h4>
            );
          },
          h5({ children }) {
            return (
              <h5 className="mt-2 mb-1 text-xs font-semibold uppercase tracking-wider text-muted first:mt-0">
                {children}
              </h5>
            );
          },
          h6({ children }) {
            return (
              <h6 className="mt-2 mb-1 text-xs font-semibold uppercase tracking-wider text-muted first:mt-0">
                {children}
              </h6>
            );
          },
          p({ children }) {
            return <p className="mb-2.5 leading-relaxed last:mb-0">{children}</p>;
          },
          strong({ children }) {
            return <strong className="font-semibold text-text">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          },
          ul({ children }) {
            return (
              <ul className="my-2 ml-4 list-disc space-y-1 marker:text-ion">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="my-2 ml-4 list-decimal space-y-1 marker:font-mono marker:text-xs marker:text-muted">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return <li className="leading-relaxed pl-0.5">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-2.5 border-l-2 border-ion/50 bg-accent-tint/30 py-1 pl-3.5 pr-2 italic text-ink-soft rounded-r">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-ion underline decoration-ion/40 underline-offset-2 transition-colors hover:text-ion-deep hover:decoration-ion"
              >
                {children}
              </a>
            );
          },
          hr() {
            return <hr className="my-3 border-line" />;
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-control border border-line">
                <table className="min-w-full divide-y divide-line text-xs">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-surface-alt font-semibold text-text">{children}</thead>;
          },
          th({ children }) {
            return <th className="px-3 py-2 text-left font-semibold">{children}</th>;
          },
          td({ children }) {
            return <td className="border-t border-line px-3 py-2 text-ink-soft">{children}</td>;
          },
          pre({ children }) {
            // Let the code component handle formatting without double pre wrappers
            return <>{children}</>;
          },
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const codeString = String(children).replace(/\n$/, '');
            const isBlock = Boolean(match) || codeString.includes('\n');

            if (isBlock) {
              return (
                <CodeBlock
                  language={match ? match[1] : undefined}
                  code={codeString}
                />
              );
            }

            return (
              <code
                className="rounded border border-ion/15 bg-accent-tint/60 px-1.5 py-0.5 font-mono text-[12.5px] font-medium text-ion-deep"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
