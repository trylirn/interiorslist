import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Quote, Link2, Eraser,
  Table as TableIcon, Rows3, Columns3, Trash2, Image as ImageIcon, Minus,
  Rows2, Columns2, Type, Captions, CaptionsOff, Link, Unlink, X,
} from "lucide-react";


type Props = {
  value: string;
  onChange: (html: string) => void;
  /** Uploads a picked file and resolves to a public URL (null on failure). */
  onUploadImage?: (file: File) => Promise<string | null>;
};

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
export function RichTextEditor({ value, onChange, onUploadImage }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);

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

  function deleteRow() {
    const cell = currentCell();
    const row = cell?.parentElement as HTMLTableRowElement | undefined;
    const table = cell?.closest("table");
    if (!row || !table) return;
    if (table.rows.length <= 1) table.remove();
    else row.remove();
    emit();
  }

  function deleteColumn() {
    const cell = currentCell();
    const table = cell?.closest("table");
    if (!cell || !table) return;
    const index = cell.cellIndex;
    if ((table.rows[0]?.cells.length ?? 0) <= 1) {
      table.remove();
    } else {
      Array.from(table.rows).forEach((row) => row.cells[index]?.remove());
    }
    emit();
  }

  const esc = (v: string) => v.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function insertImage(url: string, alt: string, caption: string) {
    const fig = caption.trim()
      ? `<figure><img src="${esc(url)}" alt="${esc(alt)}" /><figcaption>${esc(caption.trim())}</figcaption></figure>`
      : `<figure><img src="${esc(url)}" alt="${esc(alt)}" /></figure>`;
    cmd("insertHTML", `${fig}<p><br></p>`);
  }

  function askImageMeta(url: string) {
    const alt = window.prompt("Describe this image (for accessibility & SEO)") ?? "";
    const caption = window.prompt("Caption to show beneath the image (optional)") ?? "";
    insertImage(url, alt, caption);
  }

  async function pickImage(file: File | undefined) {
    if (!file || !onUploadImage) return;
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      if (url) askImageMeta(url);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function imageByUrl() {
    const url = window.prompt("Image URL (https://…)");
    if (!url || !/^https?:\/\//i.test(url)) return;
    askImageMeta(url);
  }

  /* ---- selected-image actions ---- */

  function figureOf(img: HTMLImageElement) {
    return img.closest("figure");
  }

  function editAlt() {
    if (!selectedImg) return;
    const next = window.prompt("Alt text (describes the image)", selectedImg.alt);
    if (next === null) return;
    selectedImg.alt = next;
    emit();
  }

  function editCaption() {
    if (!selectedImg) return;
    const fig = figureOf(selectedImg);
    if (!fig) return;
    const existing = fig.querySelector("figcaption");
    const next = window.prompt("Caption", existing?.textContent ?? "");
    if (next === null) return;
    if (!next.trim()) {
      existing?.remove();
    } else if (existing) {
      existing.textContent = next.trim();
    } else {
      const cap = document.createElement("figcaption");
      cap.textContent = next.trim();
      fig.appendChild(cap);
    }
    emit();
  }

  function removeCaption() {
    if (!selectedImg) return;
    figureOf(selectedImg)?.querySelector("figcaption")?.remove();
    emit();
  }

  function toggleImageLink() {
    if (!selectedImg) return;
    const anchor = selectedImg.closest("a");
    if (anchor) {
      anchor.replaceWith(selectedImg);
    } else {
      const url = window.prompt("Link this image to (https://… or /path)");
      if (!url || !/^(https?:\/\/|\/)/i.test(url)) return;
      const a = document.createElement("a");
      a.setAttribute("href", url);
      a.setAttribute("rel", "noopener noreferrer");
      selectedImg.replaceWith(a);
      a.appendChild(selectedImg);
    }
    emit();
  }

  function deleteImage() {
    if (!selectedImg) return;
    (figureOf(selectedImg) ?? selectedImg.closest("a") ?? selectedImg).remove();
    setSelectedImg(null);
    emit();
  }

  function addLink() {
    const sel = window.getSelection();
    const hasSelection = !!sel && !sel.isCollapsed && !!sel.toString().trim();
    const url = window.prompt("Link URL (https://…)");
    if (!url || !/^(https?:\/\/|mailto:|\/)/i.test(url)) return;
    if (hasSelection) {
      cmd("createLink", url);
      return;
    }
    const label = window.prompt("Link text", url) ?? url;
    cmd("insertHTML", `<a href="${esc(url)}" rel="noopener noreferrer">${esc(label)}</a>&nbsp;`);
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
        <Btn title="Delete row" onClick={deleteRow}><Rows2 className="h-4 w-4" /></Btn>
        <Btn title="Delete column" onClick={deleteColumn}><Columns2 className="h-4 w-4" /></Btn>
        <Btn title="Delete table" onClick={deleteTable}><Trash2 className="h-4 w-4" /></Btn>

        <span className="mx-1 h-5 w-px bg-border" />
        <Btn
          title={uploading ? "Uploading image…" : "Insert image"}
          onClick={() => (onUploadImage ? fileRef.current?.click() : imageByUrl())}
        >
          <ImageIcon className={`h-4 w-4 ${uploading ? "animate-pulse" : ""}`} />
        </Btn>
        <Btn title="Image from URL" onClick={imageByUrl}><Link2 className="h-4 w-4 rotate-45" /></Btn>
        <Btn title="Horizontal line" onClick={() => cmd("insertHTML", "<hr /><p><br></p>")}><Minus className="h-4 w-4" /></Btn>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickImage(e.target.files?.[0])}
        />
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn title="Add link" onClick={addLink}>
          <Link2 className="h-4 w-4" />
        </Btn>
        <Btn title="Clear formatting" onClick={() => cmd("removeFormat")}><Eraser className="h-4 w-4" /></Btn>
      </div>
      {selectedImg && (
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-secondary/40 px-2 py-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">Image</span>
          <Btn title="Edit alt text" onClick={editAlt}><Type className="h-4 w-4" /></Btn>
          <Btn title="Edit caption" onClick={editCaption}><Captions className="h-4 w-4" /></Btn>
          <Btn title="Remove caption" onClick={removeCaption}><CaptionsOff className="h-4 w-4" /></Btn>
          <Btn
            title={selectedImg.closest("a") ? "Remove link" : "Link image"}
            onClick={toggleImageLink}
          >
            {selectedImg.closest("a") ? <Unlink className="h-4 w-4" /> : <Link className="h-4 w-4" />}
          </Btn>
          <Btn title="Delete image" onClick={deleteImage}><Trash2 className="h-4 w-4" /></Btn>
          <Btn title="Deselect" onClick={() => setSelectedImg(null)}><X className="h-4 w-4" /></Btn>
        </div>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Article body"
        onInput={emit}
        onBlur={emit}
        onClick={(e) => {
          const t = e.target as HTMLElement;
          setSelectedImg(t instanceof HTMLImageElement ? t : null);
        }}

        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
        className="prose-none max-h-[60vh] min-h-[22rem] overflow-y-auto w-full px-4 py-3 text-[0.975rem] leading-7 outline-none [&_a]:text-brand [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_blockquote]:italic [&_figcaption]:mt-1.5 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-muted-foreground [&_figure]:my-4 [&_hr]:my-6 [&_hr]:border-t [&_hr]:border-border [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-xl [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-2xl [&_h3]:mt-3 [&_h3]:font-display [&_h3]:text-xl [&_li]:mt-0.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-2 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-border [&_th]:bg-secondary/40 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-6"
      />
    </div>
  );
}
