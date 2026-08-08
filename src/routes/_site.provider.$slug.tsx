import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient, useQuery } from "@tanstack/react-query";
import { getProviderBySlug } from "@/lib/providers.functions";
import { sendContactMessage, submitReview } from "@/lib/contact.functions";
import { listProviderFaqs, listReviewResponses, recordProviderView } from "@/lib/brand-extra.functions";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Globe, Mail, ExternalLink, BadgeCheck, Building2, ShieldCheck, HelpCircle, Star, Send, Instagram, Facebook, Youtube, Award, FileText, Video, Newspaper } from "lucide-react";
import { RelatedProviders } from "@/components/related-providers";
import { NearbyProviders } from "@/components/nearby-providers";
import { ProviderMap } from "@/components/provider-map";

import { CITY_NEIGHBORS } from "@/lib/cities";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trackLeadAction } from "@/lib/analytics";


export const Route = createFileRoute("/_site/provider/$slug")({
  head: ({ params, loaderData }) => {
    const path = `/provider/${params.slug}`;
    const canonical = `https://interiorslist.lovable.app${path}`;
    const p = (loaderData as { provider?: any; reviews?: any[] } | undefined)?.provider;
    const reviews = (loaderData as { reviews?: any[] } | undefined)?.reviews ?? [];
    const displayName = p?.name ?? params.slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    const city = p?.city ?? "the US";
    const stateCode = (p?.state ?? "").toUpperCase();
    const loc = stateCode ? `${city}, ${stateCode}` : city;
    const topServices: string[] = Array.isArray(p?.services)
      ? p!.services.slice(0, 3).map((s: string) => s.replace(/-/g, " "))
      : [];
    const serviceBlurb = topServices.length ? topServices.join(", ") : "full-home design, kitchens & renovations";
    const title = p
      ? `${displayName} — Interior Designer in ${loc}`
      : `${displayName} — Intearior`;
    const description = p
      ? `${p.name} in ${loc}. ${serviceBlurb}. See portfolio details, services, reviews and request a consultation with this interior design studio.`
      : `Interior design studio profile on Intearior. Services, contact and reviews.`;
    const keywords = p
      ? [
          `${city} interior designer`,
          `interior design ${loc}`,
          `${city} design studio`,
          `interior decorator ${city}`,
          `${displayName} ${city}`,
          ...topServices.map((s) => `${s} ${city}`),
        ].join(", ")
      : "interior designers, interior design studios";

    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: keywords },
      { name: "geo.placename", content: loc },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { property: "og:type", content: "business.business" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { property: "business:contact_data:locality", content: city },
      { property: "business:contact_data:country_name", content: "United States" },
    ];
    if (stateCode) meta.push({ property: "business:contact_data:region", content: stateCode });
    if (p?.address) meta.push({ property: "business:contact_data:street_address", content: p.address });
    if (p?.latitude != null && p?.longitude != null) {
      meta.push({ property: "place:location:latitude", content: String(p.latitude) });
      meta.push({ property: "place:location:longitude", content: String(p.longitude) });
      meta.push({ name: "geo.position", content: `${p.latitude};${p.longitude}` });
      meta.push({ name: "ICBM", content: `${p.latitude}, ${p.longitude}` });
    }

    const scripts: Array<{ type: string; children: string }> = [];
    if (p) {
      const ld: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": ["HomeAndConstructionBusiness", "ProfessionalService", "LocalBusiness"],
        "@id": canonical,
        name: p.name,
        url: canonical,
        description,
        priceRange: "$$",
        areaServed: [
          { "@type": "City", name: city, containedInPlace: { "@type": "State", name: stateCode || "United States" } },
        ],
      };
      if (p.hero_photo_url) ld.image = p.hero_photo_url;
      if (p.address) ld.address = { "@type": "PostalAddress", streetAddress: p.address, addressLocality: p.city, addressRegion: stateCode, addressCountry: "US" };
      if (p.latitude != null && p.longitude != null) ld.geo = { "@type": "GeoCoordinates", latitude: p.latitude, longitude: p.longitude };
      if (p.website) ld.sameAs = [p.website, ...Object.values((p.social_links ?? {}) as Record<string, string>)].filter(Boolean);
      else if (p.social_links) ld.sameAs = Object.values(p.social_links as Record<string, string>).filter(Boolean);
      if (p.email) ld.email = p.email;
      if (p.phone) ld.telephone = p.phone;
      if (Array.isArray(p.services) && p.services.length) {
        ld.hasOfferCatalog = {
          "@type": "OfferCatalog",
          name: `Services offered by ${p.name}`,
          itemListElement: p.services.map((s: string) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) },
          })),
        };
      }
      const numRatings = reviews.length;
      if (numRatings > 0) {
        const avg = reviews.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / numRatings;
        ld.aggregateRating = { "@type": "AggregateRating", ratingValue: Number(avg.toFixed(1)), reviewCount: numRatings };
      } else if (p.rating && p.review_count) {
        ld.aggregateRating = { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.review_count };
      }
      scripts.push({ type: "application/ld+json", children: JSON.stringify(ld) });

      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://interiorslist.lovable.app/" },
            { "@type": "ListItem", position: 2, name: loc, item: `https://interiorslist.lovable.app/designers/${(p.state ?? "").toLowerCase()}/${p.city_slug}` },
            { "@type": "ListItem", position: 3, name: p.name, item: canonical },
          ],
        }),
      });
    }
    return { meta, links: [{ rel: "canonical", href: canonical }], scripts };
  },


  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      queryOptions({
        queryKey: ["provider", params.slug],
        queryFn: () => getProviderBySlug({ data: { slug: params.slug } }),
      }),
    ),
  component: ProviderPage,
});

function ProviderPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(
    queryOptions({
      queryKey: ["provider", slug],
      queryFn: () => getProviderBySlug({ data: { slug } }),
    }),
  );

  const placeId = data.provider?.place_id;

  // Track view (best-effort, fire and forget)
  useEffect(() => {
    if (!placeId) return;
    recordProviderView({ data: { placeId } }).catch(() => {});
  }, [placeId]);

  // Coordinates for this provider (geocoding is triggered from authenticated admin flows only).
  const hasCoords = data.provider?.latitude != null && data.provider?.longitude != null;

  const reviewIds = (data.reviews ?? []).map((r) => r.id);
  const { data: faqsData } = useQuery({
    queryKey: ["provider-faqs", placeId],
    queryFn: () => listProviderFaqs({ data: { placeId: placeId! } }),
    enabled: !!placeId,
  });
  const { data: responsesData } = useQuery({
    queryKey: ["review-responses", reviewIds.join(",")],
    queryFn: () => listReviewResponses({ data: { reviewIds } }),
    enabled: reviewIds.length > 0,
  });
  const responseMap = new Map((responsesData?.responses ?? []).map((r) => [r.review_id, r.body]));

  if (!data.provider) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Provider not found</h1>
        <Button asChild className="mt-6"><Link to="/">Back home</Link></Button>
      </div>
    );
  }

  const p = data.provider;
  const mapsHref = p.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${p.address}`)}`
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link to="/tx/$city" params={{ city: p.city_slug }} className="text-sm text-muted-foreground hover:text-brand">← Back to {p.city}</Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {/* Hero card */}
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand/10 font-display text-3xl text-brand">{p.name.charAt(0)}</div>
              <div className="flex-1">
                {p.services?.[0] && <span className="inline-block rounded-full bg-brand/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand">{p.services[0].replace(/-/g, " ")}</span>}
                <h1 className="mt-2 font-display text-4xl md:text-5xl leading-tight">{p.name}</h1>
                {p.branch_label && <p className="mt-1 flex items-center gap-1 text-sm text-brand"><Building2 className="h-4 w-4" /> {p.branch_label}</p>}
              </div>
              {p.is_verified && (
                <span className="flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
                  <BadgeCheck className="h-4 w-4" /> Verified
                </span>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-y-4 border-t border-border pt-6 md:grid-cols-4">
              <Meta label="Based In" value={p.city ? `${p.city}, TX` : "—"} icon={<MapPin className="h-4 w-4" />} />
              <Meta label="Serves" value="Texas" icon={<Globe className="h-4 w-4" />} />
              {p.phone && <Meta label="Contact" value="Phone available" icon={<Mail className="h-4 w-4" />} />}
              
            </div>

            {p.address && (
              <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {p.address}, {p.city}, TX</p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {p.phone && <Button asChild><a href={`tel:${p.phone}`} onClick={() => trackLeadAction(p.place_id, "phone", p.city_slug)}><Mail className="mr-2 h-4 w-4" />Call</a></Button>}
              {p.website && <Button asChild variant="outline"><a href={p.website} target="_blank" rel="noopener noreferrer" onClick={() => trackLeadAction(p.place_id, "website", p.city_slug)}><Globe className="mr-2 h-4 w-4" />Website</a></Button>}
              {mapsHref && <Button asChild variant="outline"><a href={mapsHref} target="_blank" rel="noopener noreferrer" onClick={() => trackLeadAction(p.place_id, "directions", p.city_slug)}><ExternalLink className="mr-2 h-4 w-4" />Directions</a></Button>}
            </div>
          </div>

          {p.gallery_urls && p.gallery_urls.length > 0 && (
            <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
              <h2 className="font-display text-2xl">Photo gallery</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {p.gallery_urls.map((url: string) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden rounded-xl border border-border bg-secondary/30">
                    <img src={url} alt={`${p.name} treatment room and clinic interior in ${p.city ?? "Texas"}`} loading="lazy" className="h-full w-full object-cover transition hover:scale-105" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {(p.about_description || p.specialists) && (
            <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
              <h2 className="font-display text-2xl">About</h2>
              {p.about_description && <p className="mt-3 text-foreground/85 leading-relaxed whitespace-pre-line">{p.about_description}</p>}
              {p.specialists && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Practitioners</p>
                  <p className="mt-1 text-foreground/85 leading-relaxed whitespace-pre-line">{p.specialists}</p>
                </div>
              )}
              {p.credentials && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Credentials</p>
                  <p className="mt-1 text-foreground/85 leading-relaxed">{p.credentials}</p>
                </div>
              )}
              {p.social_links && Object.keys(p.social_links).length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {Object.entries(p.social_links as Record<string, string>).filter(([k]) => k !== "website2").map(([key, url]) => (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium capitalize hover:border-brand hover:text-brand">
                      {key === "instagram" && <Instagram className="h-3.5 w-3.5" />}
                      {key === "facebook" && <Facebook className="h-3.5 w-3.5" />}
                      {key === "youtube" && <Youtube className="h-3.5 w-3.5" />}
                      {!["instagram","facebook","youtube"].includes(key) && <Globe className="h-3.5 w-3.5" />}
                      {key}
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}

          <PracticeDetails p={p} />



          <ProviderMap lat={p.latitude} lng={p.longitude} name={p.name} address={p.address} city={p.city} />

          {p.city_slug && CITY_NEIGHBORS[p.city_slug] && (
            <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
              <h2 className="font-display text-2xl">Serving {p.city} and nearby areas</h2>
              <p className="mt-3 text-foreground/85 leading-relaxed">
                {p.name} welcomes patients from {p.city} and the surrounding communities of{" "}
                {CITY_NEIGHBORS[p.city_slug].slice(0, 5).join(", ")}. Search for other {p.city}, TX injectors
                nearby or explore related treatments below.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/tx/$city" params={{ city: p.city_slug }} className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-sm hover:border-brand">More in {p.city}</Link>
                <Link to="/best/$city" params={{ city: p.city_slug }} className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-sm hover:border-brand">Best of {p.city}</Link>
              </div>
            </section>
          )}



          {p.video_urls && p.video_urls.length > 0 && (
            <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
              <h2 className="font-display text-2xl flex items-center gap-2"><Video className="h-5 w-5 text-brand" /> Videos</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {p.video_urls.map((url: string) => {
                  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{6,})/);
                  if (yt) {
                    return <div key={url} className="aspect-video overflow-hidden rounded-xl border border-border bg-black"><iframe src={`https://www.youtube.com/embed/${yt[1]}`} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Video" /></div>;
                  }
                  if (url.match(/\.(mp4|webm|mov)$/i)) {
                    return <video key={url} src={url} controls className="aspect-video w-full rounded-xl border border-border bg-black" />;
                  }
                  return <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="flex aspect-video items-center justify-center gap-2 rounded-xl border border-border bg-secondary/40 text-sm hover:border-brand"><Video className="h-4 w-4" /> Watch video</a>;
                })}
              </div>
            </section>
          )}

          {p.certificate_urls && p.certificate_urls.length > 0 && (
            <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
              <h2 className="font-display text-2xl flex items-center gap-2"><Award className="h-5 w-5 text-brand" /> Certifications</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {p.certificate_urls.map((url: string, i: number) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm hover:border-brand">
                    <FileText className="h-4 w-4 text-brand" />
                    <span className="truncate">Certificate {i + 1}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {p.services && p.services.length > 0 && (
            <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
              <h2 className="font-display text-2xl">Services Offered</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {p.services.map((s: string) => (
                  <Link key={s} to="/treatment/$slug" params={{ slug: s }} className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm capitalize hover:border-brand">
                    <BadgeCheck className="h-4 w-4 text-brand" />
                    {s.replace(/-/g, " ")}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {p.notes && (
            <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
              <h2 className="font-display text-2xl">Additional notes</h2>
              <p className="mt-3 text-foreground/85 leading-relaxed">{p.notes}</p>
            </section>
          )}





          {/* Reviews */}
          <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Reviews ({data.reviews.length})</h2>
              <Button asChild variant="outline" className="rounded-full"><Link to="/review/$slug" params={{ slug }}>Write a Review</Link></Button>
            </div>
            {data.reviews.length === 0 ? (
              <p className="mt-6 text-center text-muted-foreground">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="mt-6 space-y-4">
                {data.reviews.map((r) => {
                  const ownerResp = responseMap.get(r.id);
                  return (
                    <div key={r.id} className="rounded-xl border border-border bg-secondary/20 p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{r.author_name}</div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < (r.rating ?? 0) ? "fill-rating text-rating" : "text-border"}`} />
                          ))}
                        </div>
                      </div>
                      {r.text && <p className="mt-2 text-sm leading-relaxed">{r.text}</p>}
                      <p className="mt-2 text-xs text-muted-foreground">{r.relative_time}</p>
                      {ownerResp && (
                        <div className="mt-3 rounded-lg border-l-2 border-brand bg-card p-3">
                          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Response from {p.name}</p>
                          <p className="mt-1 text-sm whitespace-pre-line">{ownerResp}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {(faqsData?.faqs ?? []).length > 0 && (
            <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
              <h2 className="font-display text-2xl flex items-center gap-2"><HelpCircle className="h-5 w-5" /> Frequently asked</h2>
              <div className="mt-4 space-y-3">
                {(faqsData?.faqs ?? []).map((f) => <FaqItem key={f.id} q={f.question} a={f.answer} />)}
              </div>
            </section>
          )}


          <section className="mt-8 rounded-2xl border border-border bg-secondary/40 p-6">
            <p className="flex items-center gap-2 text-sm text-foreground/80">
              <ShieldCheck className="h-4 w-4 text-brand" />
              Always verify a provider's licensure with the Texas Medical Board or Texas Board of Nursing before treatment.
            </p>
          </section>

          {!p.claimed_by && (
            <section className="mt-8 rounded-3xl border border-border bg-secondary/50 p-8 text-center">
              <p className="font-display text-xl">Is this your business?</p>
              <p className="mt-1 text-sm text-muted-foreground">Claim this listing to enable contact requests, update info, photos, and services.</p>
              <Button asChild className="mt-4 rounded-full"><Link to="/claim/$slug" params={{ slug }}>Claim this listing</Link></Button>
            </section>
          )}
        </div>

        {/* Sticky contact rail */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {p.claimed_by ? (
            <ContactForm placeId={p.place_id} name={p.name} />
          ) : (
            <UnclaimedSidebar slug={slug} website={p.website} mapsHref={mapsHref} />
          )}
        </aside>
      </div>

      {Array.isArray((p as any).articles) && (p as any).articles.length > 0 && (
        <section className="mt-12 rounded-3xl border border-border bg-card p-6 md:p-8">
          <h2 className="font-display text-2xl flex items-center gap-2"><Newspaper className="h-5 w-5 text-brand" /> Latest from {p.name}</h2>
          <ul className="mt-4 space-y-2">
            {((p as any).articles as Array<{ title: string; url: string }>).map((a) => (
              <li key={a.url}>
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm hover:border-brand">
                  <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span><span className="font-medium">{a.title}</span> <span className="text-muted-foreground">→ Read on {p.name}</span></span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <NearbyProviders placeId={p.place_id} />
      <RelatedProviders placeId={p.place_id} />
    </div>
  );
}



function UnclaimedSidebar({ slug, website, mapsHref }: { slug: string; website: string | null; mapsHref: string | null }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-display text-lg">Listing not yet claimed</h3>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        This business hasn't claimed their Discover Medspa listing yet, so we can't deliver messages on their behalf. You can still reach them directly:
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {website && <Button asChild variant="outline" className="w-full rounded-full"><a href={website} target="_blank" rel="noopener noreferrer"><Globe className="mr-2 h-4 w-4" />Visit website</a></Button>}
        {mapsHref && <Button asChild variant="outline" className="w-full rounded-full"><a href={mapsHref} target="_blank" rel="noopener noreferrer"><MapPin className="mr-2 h-4 w-4" />Get directions</a></Button>}
      </div>
      <div className="mt-6 rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand">For business owners</p>
        <p className="mt-2 text-sm text-foreground/85">Is this your business?</p>
        <Button asChild className="mt-3 w-full rounded-full"><Link to="/claim/$slug" params={{ slug }}>Claim this listing</Link></Button>
      </div>
    </div>
  );
}

function Meta({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm">{icon}{value}</p>
    </div>
  );
}

const SERVICE_AREA_LABEL: Record<string, string> = {
  local: "Local area",
  regional: "Regional",
  nationwide: "Nationwide",
};

function PracticeDetails({ p }: { p: any }) {
  const packages = Array.isArray(p.price_ranges) ? (p.price_ranges as any[]).filter((x) => x && (x.name || x.price)) : [];
  const stats: { label: string; value: string }[] = [];
  if (p.founded_year) stats.push({ label: "Founded", value: String(p.founded_year) });
  if (p.years_in_business) stats.push({ label: "Years in business", value: `${p.years_in_business}+` });
  if (p.team_size) stats.push({ label: "Team size", value: String(p.team_size) });
  if (p.service_area) stats.push({ label: "Serves", value: SERVICE_AREA_LABEL[p.service_area] ?? String(p.service_area) });

  const hasAny = stats.length > 0 || packages.length > 0 || p.client_types || p.not_a_fit || p.service_area_note;
  if (!hasAny) return null;

  return (
    <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
      <h2 className="font-display text-2xl">About this practice</h2>
      {stats.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-secondary/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-xl">{s.value}</p>
            </div>
          ))}
        </div>
      )}
      {p.service_area_note && <p className="mt-4 text-sm text-foreground/80">{p.service_area_note}</p>}

      {packages.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pricing &amp; packages</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {packages.map((pkg: any, i: number) => (
              <div key={`${pkg.name}-${i}`} className="rounded-xl border border-border bg-secondary/20 px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{pkg.name}</span>
                  {pkg.price && <span className="text-sm text-brand">{pkg.price}</span>}
                </div>
                {pkg.note && <p className="mt-1 text-xs text-muted-foreground">{pkg.note}</p>}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Prices are provided by the practice and may change — confirm at consultation.</p>
        </div>
      )}

      {p.client_types && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Who we serve</p>
          <p className="mt-1 whitespace-pre-line text-foreground/85 leading-relaxed">{p.client_types}</p>
        </div>
      )}

      {p.not_a_fit && (
        <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Not a good fit if…</p>
          <p className="mt-1 whitespace-pre-line text-sm text-foreground/80">{p.not_a_fit}</p>
        </div>
      )}
    </section>
  );
}


function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-border bg-secondary/20 p-4">
      <summary className="cursor-pointer font-medium">{q}</summary>
      <p className="mt-2 text-sm text-foreground/80">{a}</p>
    </details>
  );
}

function ContactForm({ placeId, name }: { placeId: string; name: string }) {
  const send = useServerFn(sendContactMessage);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const valid =
    form.firstName &&
    form.lastName &&
    /.+@.+\..+/.test(form.email) &&
    form.phone.replace(/\D/g, "").length >= 7 &&
    form.message.length > 5;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    try {
      await send({ data: { placeId, ...form } });
      setSent(true);
      toast.success("Message sent");
    } catch {
      toast.error("Couldn't send message");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-center">
        <Send className="mx-auto h-8 w-8 text-brand" />
        <h3 className="mt-3 font-display text-xl">Message sent</h3>
        <p className="mt-2 text-sm text-muted-foreground">{name} will be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-6">
      <h3 className="flex items-center gap-2 font-display text-lg"><Mail className="h-4 w-4 text-brand" /> Contact {name}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs"><span className="font-medium">First Name</span><Input className="mt-1" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required maxLength={80} /></label>
        <label className="text-xs"><span className="font-medium">Last Name</span><Input className="mt-1" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required maxLength={80} /></label>
      </div>
      <label className="mt-3 block text-xs"><span className="font-medium">Email</span><Input type="email" className="mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={255} /></label>
      <label className="mt-3 block text-xs"><span className="font-medium">Phone *</span><Input type="tel" className="mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required maxLength={40} placeholder="(555) 555-5555" /></label>
      <label className="mt-3 block text-xs"><span className="font-medium">Message</span><Textarea className="mt-1 min-h-28" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell them about your situation, goals, or questions..." required maxLength={4000} /></label>
      <Button type="submit" disabled={!valid || busy} className="mt-4 w-full rounded-full">{busy ? "Sending…" : "Send message →"}</Button>
    </form>
  );
}

function ReviewDialog({ placeId, slug }: { placeId: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = useServerFn(submitReview);
  const qc = useQueryClient();

  const valid = author.trim().length >= 1 && /.+@.+\..+/.test(email) && rating >= 1;

  async function send() {
    if (!valid) return;
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        toast.error("Please sign in to post a review");
        setOpen(false);
        window.location.href = `/login?next=/provider/${slug}`;
        return;
      }
      await submit({ data: { placeId, authorName: author.trim(), email: email.trim(), rating, text } });
      toast.success("Review posted");
      setOpen(false);
      setText("");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["provider", slug] });
    } catch {
      toast.error("Couldn't post review");
    } finally {
      setBusy(false);
    }
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">Write a Review</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display text-2xl">Share your experience</DialogTitle></DialogHeader>
        <div className="mt-2 space-y-4">
          <label className="block text-sm"><span className="font-medium">Your name</span><Input className="mt-1" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={120} placeholder="Jane D." /></label>
          <label className="block text-sm"><span className="font-medium">Email</span><Input type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} placeholder="you@example.com" required /><span className="mt-1 block text-xs text-muted-foreground">Kept private. Never shown on the review.</span></label>
          <div>
            <p className="text-sm font-medium">Rating</p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                  <Star className={`h-7 w-7 ${n <= rating ? "fill-rating text-rating" : "text-border"}`} />
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm"><span className="font-medium">Review (optional)</span><Textarea className="mt-1 min-h-28" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} placeholder="What stood out about your experience?" /></label>
        </div>
        <Button onClick={send} disabled={!valid || busy} className="mt-4 rounded-full">{busy ? "Posting…" : "Post review"}</Button>
      </DialogContent>
    </Dialog>
  );
}

