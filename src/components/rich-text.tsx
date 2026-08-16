const ALLOWED = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li",
  "h2", "h3", "h4", "blockquote", "hr", "img", "div", "span", "code", "pre",
  "table", "thead", "tbody", "tr", "th", "td",
]);

/** Collapses empty paragraph / <br> runs produced by contenteditable. */
export function collapseEmptyBlocks(html: string): string {
  return html
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/(?:<br\s*\/?>\s*){2,}/gi, "<br />")
    .replace(/(\s*<br\s*\/?>\s*)+<\/p>/gi, "</p>")
    .trim();
}

function safeHref(v: string) {
  const s = v.trim().toLowerCase();
  return s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/") || s.startsWith("mailto:");
}

/** Allowlist sanitizer — runs on server and client, no DOM required. */
export function sanitizeHtml(input: string): string {
  let html = input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?(script|style|iframe|object|embed)[^>]*>/gi, "");

  html = html.replace(/<([a-zA-Z0-9]+)((?:\s[^>]*)?)\/?>|<\/([a-zA-Z0-9]+)\s*>/g, (_m, open, attrs = "", close) => {
    const tag = (open || close || "").toLowerCase();
    if (!ALLOWED.has(tag)) return "";
    if (close) return `</${tag}>`;

    const kept: string[] = [];
    const attrRe = /([a-zA-Z-]+)\s*=\s*"([^"]*)"|([a-zA-Z-]+)\s*=\s*'([^']*)'/g;
    let a: RegExpExecArray | null;
    while ((a = attrRe.exec(attrs))) {
      const name = (a[1] || a[3] || "").toLowerCase();
      const val = a[2] ?? a[4] ?? "";
      if (name === "href" && tag === "a" && safeHref(val)) kept.push(`href="${val}" rel="noopener noreferrer"`);
      else if (name === "src" && tag === "img" && safeHref(val)) kept.push(`src="${val}" loading="lazy"`);
      else if (name === "alt" && tag === "img") kept.push(`alt="${val.replace(/"/g, "")}"`);
      else if (name === "style") {
        const m = val.match(/text-align:\s*(left|center|right|justify)/i);
        if (m) kept.push(`style="text-align:${m[1].toLowerCase()}"`);
      }
    }
    const selfClose = tag === "br" || tag === "hr" || tag === "img";
    return `<${tag}${kept.length ? " " + kept.join(" ") : ""}${selfClose ? " /" : ""}>`;
  });

  return html;
}

export function isHtmlBody(body: string) {
  return /^\s*</.test(body);
}

export function RichText({ html }: { html: string }) {
  return (
    <div
      className="text-[1.05rem] leading-7 text-foreground/90 [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:mt-4 [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-5 [&_blockquote]:font-display [&_blockquote]:text-xl [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-3xl [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-2xl [&_h4]:mt-4 [&_h4]:text-lg [&_h4]:font-semibold [&_hr]:mt-6 [&_hr]:border-border [&_img]:mt-6 [&_img]:w-full [&_img]:rounded-2xl [&_li]:mt-0.5 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_table]:mt-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-border [&_th]:bg-secondary/40 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(collapseEmptyBlocks(html)) }}
    />
  );
}
