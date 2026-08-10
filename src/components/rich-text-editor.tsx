import { useEffect, useRef } from "react";
import {
  Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Quote, Link2, Eraser,
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

  const cmd = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    onChange(ref.current?.innerHTML ?? "");
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
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
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        onBlur={() => onChange(ref.current?.innerHTML ?? "")}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
        className="prose-none min-h-[22rem] w-full px-4 py-3 text-[0.975rem] leading-8 outline-none [&_a]:text-brand [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-2xl [&_h3]:mt-3 [&_h3]:font-display [&_h3]:text-xl [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
      />
    </div>
  );
}
