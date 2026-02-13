import { isValidElement, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { MermaidDiagram } from '@/components/MermaidDiagram';

interface ProjectMarkdownProps {
  markdown: string;
}

export function ProjectMarkdown({ markdown }: ProjectMarkdownProps) {
  return (
    <article
      className="prose prose-neutral max-w-none
        prose-headings:font-medium
        prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
        prose-p:text-neutral-700 prose-p:leading-relaxed
        prose-code:text-sm prose-code:bg-neutral-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-pre:border prose-pre:border-neutral-800
        prose-ul:text-neutral-700
        prose-strong:text-neutral-900 prose-strong:font-medium"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
        components={{
          code({ className, children, ...rest }: ComponentPropsWithoutRef<'code'>) {
            if (className?.includes('language-mermaid')) {
              return <MermaidDiagram chart={String(children)} />;
            }
            return <code className={className} {...rest}>{children}</code>;
          },
          pre({ children, ...rest }) {
            if (isValidElement(children) && children.type === MermaidDiagram) {
              return children;
            }
            return <pre {...rest}>{children}</pre>;
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
