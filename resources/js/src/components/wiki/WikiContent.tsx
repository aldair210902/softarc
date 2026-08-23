import React, { useMemo, useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { cn } from '../../lib/utils';

export type WikiBlock =
  | { type: 'h1' | 'h2' | 'h3'; text: string; id: string }
  | { type: 'p'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; lang: string; title?: string; desc?: string; code: string }
  | { type: 'hr' }
  | { type: 'callout'; text: string };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64) || 'sec';
}

/** Parsea markdown ligero: títulos, listas, hr, callouts > y bloques ``` con Copiar. */
export function parseWikiContent(raw: string): WikiBlock[] {
  const text = (raw || '').replace(/\r\n/g, '\n');
  if (!text.trim()) return [];

  const lines = text.split('\n');
  const blocks: WikiBlock[] = [];
  let i = 0;
  let slugCounts: Record<string, number> = {};

  const headingId = (label: string) => {
    const base = slugify(label);
    const n = (slugCounts[base] || 0) + 1;
    slugCounts[base] = n;
    return n === 1 ? base : `${base}-${n}`;
  };

  const flushParagraph = (buf: string[]) => {
    const t = buf.join('\n').trim();
    if (!t) return;
    blocks.push({ type: 'p', text: t });
    buf.length = 0;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code: ```lang title:Nombre desc:Para qué / cuándo
    const fenceOpen = line.match(/^```([a-zA-Z0-9_+-]*)?\s*(.*)$/);
    if (fenceOpen && line.startsWith('```')) {
      const lang = (fenceOpen[1] || 'text').trim();
      const meta = fenceOpen[2] || '';
      const title = meta.match(/title:\s*(.+?)(?=\s+desc:|$)/)?.[1]?.trim();
      const desc = meta.match(/desc:\s*(.+)$/)?.[1]?.trim();
      i += 1;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1; // closing ```
      blocks.push({ type: 'code', lang, title, desc, code: codeLines.join('\n').replace(/\n$/, '') });
      continue;
    }

    // Setext-style ALL CAPS title + =====
    if (
      line.trim() &&
      i + 1 < lines.length &&
      /^=+$/.test(lines[i + 1].trim()) &&
      line.trim().length < 120
    ) {
      const label = line.trim();
      blocks.push({ type: 'h1', text: label, id: headingId(label) });
      i += 2;
      continue;
    }

    // Subtitle + -----
    if (
      line.trim() &&
      i + 1 < lines.length &&
      /^-+$/.test(lines[i + 1].trim()) &&
      line.trim().length < 120 &&
      !line.trim().startsWith('- ')
    ) {
      const label = line.trim().replace(/^\d+\)\s*/, '');
      blocks.push({ type: 'h2', text: label, id: headingId(label) });
      i += 2;
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      const level = (line.match(/^#+/)?.[0].length || 1) as 1 | 2 | 3;
      const label = line.replace(/^#{1,3}\s+/, '').trim();
      const tag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
      blocks.push({ type: tag, text: label, id: headingId(label) });
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const note: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        note.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'callout', text: note.join('\n').trim() });
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, '').trim());
        i += 1;
      }
      blocks.push({ type: 'list', ordered: false, items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, '').trim());
        i += 1;
      }
      blocks.push({ type: 'list', ordered: true, items });
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Accumulate paragraph
    const buf: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !/^#{1,3}\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim()) &&
      !(i + 1 < lines.length && /^=+$/.test(lines[i + 1].trim())) &&
      !(i + 1 < lines.length && /^-+$/.test(lines[i + 1].trim()) && !lines[i].trim().startsWith('- '))
    ) {
      buf.push(lines[i]);
      i += 1;
    }
    flushParagraph(buf);
  }

  return blocks;
}

export function WikiCopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          // silencioso
        }
      }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors shrink-0',
        copied
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : 'bg-sa-border/60 text-sa-muted border-sa-border-strong hover:text-sa-text hover:bg-sa-border',
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copiado' : label}
    </button>
  );
}

function CodeBlock({ lang, title, desc, code }: { lang: string; title?: string; desc?: string; code: string }) {
  return (
    <div className="rounded-xl border border-sa-border bg-sa-canvas overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-3 py-2.5 border-b border-sa-border bg-sa-panel/80">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <Terminal className="h-3.5 w-3.5 text-sa-faint shrink-0" />
            <span className="text-[11px] font-bold text-sa-text truncate">
              {title || lang || 'código'}
            </span>
            {title && lang && lang !== 'text' && (
              <span className="text-[10px] font-mono text-sa-faint uppercase shrink-0">{lang}</span>
            )}
          </div>
          {desc && (
            <p className="mt-1.5 text-[12px] leading-snug text-sa-muted pl-5">
              {desc}
            </p>
          )}
        </div>
        <WikiCopyButton text={code} />
      </div>
      <pre className="p-3.5 overflow-x-auto text-[12.5px] leading-relaxed font-mono text-sa-muted custom-scrollbar whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

export function WikiContent({ content }: { content: string }) {
  const blocks = useMemo(() => parseWikiContent(content), [content]);
  const toc = blocks.filter((b): b is Extract<WikiBlock, { type: 'h1' | 'h2' | 'h3' }> =>
    b.type === 'h1' || b.type === 'h2' || b.type === 'h3',
  );

  if (blocks.length === 0) {
    return <p className="text-sm text-sa-faint">Sin contenido.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {toc.length >= 3 && (
        <nav className="rounded-xl border border-sa-border bg-sa-canvas/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint mb-2">En esta guía</p>
          <ul className="space-y-1">
            {toc.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className={cn(
                    'text-sm text-sa-muted hover:text-blue-400 transition-colors',
                    h.type === 'h1' && 'font-semibold text-sa-text',
                    h.type === 'h3' && 'pl-3 text-xs',
                    h.type === 'h2' && 'pl-1',
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {blocks.map((block, idx) => {
        if (block.type === 'h1') {
          return (
            <h2 key={idx} id={block.id} className="text-xl font-extrabold text-sa-text tracking-tight pt-2 scroll-mt-4">
              {block.text}
            </h2>
          );
        }
        if (block.type === 'h2') {
          return (
            <h3 key={idx} id={block.id} className="text-base font-bold text-sa-text pt-1 scroll-mt-4 border-l-2 border-blue-500/50 pl-3">
              {block.text}
            </h3>
          );
        }
        if (block.type === 'h3') {
          return (
            <h4 key={idx} id={block.id} className="text-sm font-bold text-sa-muted scroll-mt-4">
              {block.text}
            </h4>
          );
        }
        if (block.type === 'p') {
          return (
            <p key={idx} className="text-sm leading-relaxed text-sa-muted whitespace-pre-wrap">
              {block.text}
            </p>
          );
        }
        if (block.type === 'list') {
          const Tag = block.ordered ? 'ol' : 'ul';
          return (
            <Tag
              key={idx}
              className={cn(
                'text-sm text-sa-muted space-y-1.5 pl-5',
                block.ordered ? 'list-decimal' : 'list-disc',
              )}
            >
              {block.items.map((item, j) => (
                <li key={j} className="leading-relaxed pl-1">
                  {item}
                </li>
              ))}
            </Tag>
          );
        }
        if (block.type === 'code') {
          return <CodeBlock key={idx} lang={block.lang} title={block.title} desc={block.desc} code={block.code} />;
        }
        if (block.type === 'callout') {
          return (
            <div key={idx} className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90 leading-relaxed whitespace-pre-wrap">
              {block.text}
            </div>
          );
        }
        if (block.type === 'hr') {
          return <hr key={idx} className="border-sa-border" />;
        }
        return null;
      })}
    </div>
  );
}
