import React from "react";

/**
 * Minimal, safe markdown renderer. Produces React elements only — no
 * dangerouslySetInnerHTML — so post bodies can never inject HTML or scripts.
 * Supports: headings, paragraphs, bullet/numbered lists, blockquotes,
 * horizontal rules, images, links, bold, italic and inline code.
 */

function isSafeHref(href: string) {
  const v = href.trim().toLowerCase();
  return v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/") || v.startsWith("mailto:");
}

function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-i${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={key} className="rounded bg-secondary px-1.5 py-0.5 text-[0.9em]">{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("[")) {
      const label = tok.slice(1, tok.indexOf("]"));
      const href = tok.slice(tok.indexOf("](") + 2, -1);
      out.push(
        isSafeHref(href) ? (
          <a key={key} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-brand underline underline-offset-4">
            {label}
          </a>
        ) : (
          <span key={key}>{label}</span>
        ),
      );
    } else out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];
  let k = 0;

  const flushPara = () => {
    if (!para.length) return;
    const key = `p${k++}`;
    blocks.push(<p key={key} className="mt-5 leading-8 text-foreground/90">{inline(para.join(" "), key)}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const key = `l${k++}`;
    const items = list.items.map((it, idx) => <li key={`${key}-${idx}`}>{inline(it, `${key}-${idx}`)}</li>);
    blocks.push(
      list.ordered ? (
        <ol key={key} className="mt-5 list-decimal space-y-2 pl-6 leading-8 text-foreground/90">{items}</ol>
      ) : (
        <ul key={key} className="mt-5 list-disc space-y-2 pl-6 leading-8 text-foreground/90">{items}</ul>
      ),
    );
    list = null;
  };
  const flushQuote = () => {
    if (!quote.length) return;
    const key = `q${k++}`;
    blocks.push(
      <blockquote key={key} className="mt-6 border-l-2 border-brand pl-5 font-display text-xl leading-relaxed text-foreground/80">
        {inline(quote.join(" "), key)}
      </blockquote>,
    );
    quote = [];
  };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushAll(); continue; }

    const img = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (img && isSafeHref(img[2])) {
      flushAll();
      blocks.push(
        <img key={`img${k++}`} src={img[2]} alt={img[1]} loading="lazy" className="mt-8 w-full rounded-2xl border border-border object-cover" />,
      );
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      const key = `h${k++}`;
      const content = inline(heading[2], key);
      if (level <= 2) blocks.push(<h2 key={key} className="mt-12 font-display text-3xl leading-tight">{content}</h2>);
      else if (level === 3) blocks.push(<h3 key={key} className="mt-8 font-display text-2xl">{content}</h3>);
      else blocks.push(<h4 key={key} className="mt-6 text-lg font-semibold">{content}</h4>);
      continue;
    }

    if (/^(---|\*\*\*)$/.test(line.trim())) { flushAll(); blocks.push(<hr key={`hr${k++}`} className="mt-10 border-border" />); continue; }

    const q = line.match(/^>\s?(.*)$/);
    if (q) { flushPara(); flushList(); quote.push(q[1]); continue; }

    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      flushPara(); flushQuote();
      const ordered = !!ol;
      if (!list || list.ordered !== ordered) { flushList(); list = { ordered, items: [] }; }
      list.items.push((ul ? ul[1] : ol![1]));
      continue;
    }

    flushList(); flushQuote();
    para.push(line.trim());
  }
  flushAll();

  return <div className="text-[1.05rem]">{blocks}</div>;
}

export function readingTime(md: string) {
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
