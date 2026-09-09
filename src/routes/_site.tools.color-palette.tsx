import { createFileRoute, Link } from "@tanstack/react-router";
import { PaletteGenerator } from "@/components/tools/palette-generator";

export const Route = createFileRoute("/_site/tools/color-palette")({
  head: () => ({
    meta: [
      { title: "Colour Palette Generator for Interior Designers | Intearior" },
      {
        name: "description",
        content:
          "A free colour wheel and palette tool for design studios: harmony rules, shade ladders, contrast checks, palettes from a photo, and saved schemes for client pitches.",
      },
      { property: "og:title", content: "Colour Palette Generator | Intearior" },
      { property: "og:description", content: "Build, lock and save cohesive colour schemes for client pitches — free." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/tools/color-palette" }],
  }),
  component: PalettePage,
});

function PalettePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">
        <Link to="/tools" className="hover:underline">Free tools</Link>
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">Colour Palette Generator</h1>
      <p className="mt-4 text-muted-foreground">
        Pick a base colour, choose a harmony rule, lock the shades you want to keep and shuffle the rest.
        Pull a palette straight out of a client's inspiration photo, then save or export it for the pitch.
      </p>

      <div className="mt-10">
        <PaletteGenerator />
      </div>

      <section className="mt-16 max-w-3xl space-y-4">
        <h2 className="font-display text-2xl">Using these palettes in a scheme</h2>
        <p className="text-muted-foreground">
          The old 60-30-10 rule still holds up: a dominant tone across walls and large surfaces, a secondary
          for upholstery and joinery, and a small accent for art, textiles and metals. The shade ladder gives
          you the lighter and deeper versions of a single hue, which is usually what a room needs rather than
          five unrelated colours.
        </p>
        <p className="text-muted-foreground">
          Contrast ratios are shown against white so you can check whether a colour will hold up as text on a
          board or signage — 4.5:1 or better is the accessible threshold for body text.
        </p>
      </section>
    </div>
  );
}
