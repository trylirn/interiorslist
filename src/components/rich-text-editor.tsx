import { useEffect, useRef } from "react";
import {
  Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Quote, Link2, Eraser,
  Table as TableIcon, Rows3, Columns3, Trash2,
} from "lucide-react";

type Props = { value: string; onChange: (html: string) => void };

function Btn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-foreground/70 hover:border-border hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

/** Simple visual editor — no markdown needed. Produces basic HTML. */
export function RichTextEditor({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || "";
  }, [value]);

  const emit = () => onChange(ref.current?.innerHTML ?? "");

  const cmd = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  /** Cell the caret currently sits in, if any. */
  function currentCell(): HTMLTableCellElement | null {
    const sel = window.getSelection();
    const node = sel?.anchorNode;
    if (!node || !ref.current) return null;
    let el: Node | null = node;
    while (el && el !== ref.current) {
      if (el instanceof HTMLTableCellElement) return el;
      el = el.parentNode;
    }
    return null;
  }

  function insertTable() {
    const head = `<tr>${Array.from({ length: 3 }, (_, i) => `<th>Heading ${i + 1}</th>`).join("")}</tr>`;
    const rows = Array.from({ length: 2 }, () => `<tr>${"<td>&nbsp;</td>".repeat(3)}</tr>`).join("");
    cmd("insertHTML", `<table><thead>${head}</thead><tbody>${rows}</tbody></table><p><br></p>`);
  }

  function addRow() {
    const cell = currentCell();
    const table = cell?.closest("table");
    if (!table) return;
    const body = table.tBodies[0] ?? table;
    const cols = table.rows[0]?.cells.length ?? 3;
    const tr = document.createElement("tr");
    for (let i = 0; i < cols; i++) {
      const td = document.createElement("td");
      td.innerHTML = "&nbsp;";
      tr.appendChild(td);
    }
    body.appendChild(tr);
    emit();
  }

  function addColumn() {
    const cell = currentCell();
    const table = cell?.closest("table");
    if (!table) return;
    Array.from(table.rows).forEach((row) => {
      const isHead = row.parentElement?.tagName === "THEAD";
      const c = document.createElement(isHead ? "th" : "td");
      c.innerHTML = isHead ? "Heading" : "&nbsp;";
      row.appendChild(c);
    });
    emit();
  }

  function deleteTable() {
    const table = currentCell()?.closest("table");
    if (!table) return;
    table.remove();
    emit();
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 rounded-t-2xl border-b border-border bg-card/95 p-2 backdrop-blur">
        <Btn title="Bold" onClick={() => cmd("bold")}><Bold className="h-4 w-4" /></Btn>
        <Btn title="Italic" onClick={() => cmd("italic")}><Italic className="h-4 w-4" /></Btn>
        <Btn title="Underline" onClick={() => cmd("underline")}><Underline className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn title="Heading" onClick={() => cmd("formatBlock", "H2")}><Heading2 className="h-4 w-4" /></Btn>
        <Btn title="Subheading" onClick={() => cmd("formatBlock", "H3")}><Heading3 className="h-4 w-4" /></Btn>
        <Btn title="Quote" onClick={() => cmd("formatBlock", "BLOCKQUOTE")}><Quote className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn title="Bulleted list" onClick={() => cmd("insertUnorderedList")}><List className="h-4 w-4" /></Btn>
        <Btn title="Numbered list" onClick={() => cmd("insertOrderedList")}><ListOrdered className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn title="Align left" onClick={() => cmd("justifyLeft")}><AlignLeft className="h-4 w-4" /></Btn>
        <Btn title="Align centre" onClick={() => cmd("justifyCenter")}><AlignCenter className="h-4 w-4" /></Btn>
        <Btn title="Align right" onClick={() => cmd("justifyRight")}><AlignRight className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn title="Insert table" onClick={insertTable}><TableIcon className="h-4 w-4" /></Btn>
        <Btn title="Add row" onClick={addRow}><Rows3 className="h-4 w-4" /></Btn>
        <Btn title="Add column" onClick={addColumn}><Columns3 className="h-4 w-4" /></Btn>
        <Btn title="Delete table" onClick={deleteTable}><Trash2 className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn
          title="Add link"
          onClick={() => {
            const url = window.prompt("Link URL (https://…)");
            if (url && /^https?:\/\//i.test(url)) cmd("createLink", url);
          }}
        >
          <Link2 className="h-4 w-4" />
        </Btn>
        <Btn title="Clear formatting" onClick={() => cmd("removeFormat")}><Eraser className="h-4 w-4" /></Btn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Article body"
        onInput={emit}
        onBlur={emit}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
        className="prose-none max-h-[60vh] min-h-[22rem] overflow-y-auto w-full px-4 py-3 text-[0.975rem] leading-7 outline-none [&_a]:text-brand [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-2xl [&_h3]:mt-3 [&_h3]:font-display [&_h3]:text-xl [&_li]:mt-0.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-2 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-border [&_th]:bg-secondary/40 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-6"
      />
    </div>
  );
}
