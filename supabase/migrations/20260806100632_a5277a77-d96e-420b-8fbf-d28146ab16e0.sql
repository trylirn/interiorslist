-- 1. Wipe medspa data
DELETE FROM public.review_responses;
DELETE FROM public.reviews;
DELETE FROM public.provider_faqs;
DELETE FROM public.provider_update_requests;
DELETE FROM public.claims;
DELETE FROM public.favorites;
DELETE FROM public.provider_views;
DELETE FROM public.contact_messages;
DELETE FROM public.submissions;
DELETE FROM public.providers;
DELETE FROM public.brands;
DELETE FROM public.services;
DELETE FROM public.testimonials;
DELETE FROM public.analytics_events;
DELETE FROM public.analytics_sessions;

-- 2. New columns for design studios
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS styles text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS project_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price_tier text,
  ADD COLUMN IF NOT EXISTS typical_project_budget text,
  ADD COLUMN IF NOT EXISTS remote_services boolean NOT NULL DEFAULT false;

-- 3. Services taxonomy
INSERT INTO public.services (name, slug, description) VALUES
 ('Full-Home Design','full-home-design','End-to-end design for an entire residence, from space planning to final styling.'),
 ('Kitchen Design','kitchen-design','Layout, cabinetry, finishes and appliance planning for kitchens.'),
 ('Bathroom Design','bathroom-design','Tile, fixtures, vanities and lighting for primary and guest baths.'),
 ('Living & Dining','living-dining','Furniture layout, seating plans and styling for shared living spaces.'),
 ('Bedroom Design','bedroom-design','Restful primary suites, guest rooms and children''s rooms.'),
 ('Home Office','home-office','Functional, camera-ready workspaces built into the home.'),
 ('Outdoor & Patio','outdoor-patio','Porches, patios, decks and outdoor rooms.'),
 ('Commercial & Office','commercial-office','Workplace interiors, meeting rooms and reception areas.'),
 ('Retail & Hospitality','retail-hospitality','Stores, restaurants, cafes, salons and boutique hotels.'),
 ('Home Staging','home-staging','Styling a property to sell faster and for more.'),
 ('E-Design / Virtual','e-design','Remote design packages delivered digitally.'),
 ('Space Planning','space-planning','Floor plans, circulation and furniture layouts.'),
 ('Custom Millwork','custom-millwork','Built-ins, paneling, cabinetry and joinery detailing.'),
 ('Lighting Design','lighting-design','Layered lighting plans, fixture selection and controls.'),
 ('Window Treatments','window-treatments','Drapery, shades, blinds and motorization.'),
 ('Furniture Sourcing','furniture-sourcing','Trade sourcing, procurement and delivery management.'),
 ('Color Consultation','color-consultation','Paint palettes, finishes and material coordination.'),
 ('Renovation Management','renovation-management','Contractor coordination and construction oversight.');

-- 4. Seed 20 design studios
INSERT INTO public.providers
 (place_id, slug, name, city, city_slug, state, address, postal_code, phone, website, rating, review_count,
  services, styles, project_types, price_tier, typical_project_budget, remote_services, specialists, credentials,
  about_description, business_status, is_verified, published, featured, hero_photo_url)
VALUES
 ('il-nyc-001','atelier-north-nyc','Atelier North','New York','new-york','NY','412 W 21st St','10011','(212) 555-0142','https://ateliernorth.example.com',4.9,86,
  ARRAY['full-home-design','kitchen-design','custom-millwork','lighting-design','renovation-management'],ARRAY['modern','minimalist','contemporary-luxury'],ARRAY['full-renovation','new-build'],'premium','$150k+',false,'Nora Ellis','NCIDQ, ASID',
  'A Chelsea-based studio known for calm, gallery-like interiors and meticulous millwork detailing across Manhattan and Brooklyn.','OPERATIONAL',true,true,true,null),
 ('il-nyc-002','brownstone-and-co','Brownstone & Co.','New York','new-york','NY','88 Dean St','11201','(718) 555-0119','https://brownstoneandco.example.com',4.7,54,
  ARRAY['full-home-design','living-dining','bedroom-design','window-treatments','furniture-sourcing'],ARRAY['traditional','transitional','eclectic'],ARRAY['full-renovation','single-room','furnishing-only'],'moderate','$25k–$75k',true,'Marcus Reed','ASID',
  'Brooklyn townhouse specialists blending period architecture with warm, layered, family-friendly interiors.','OPERATIONAL',true,true,false,null),
 ('il-la-001','canyon-house-studio','Canyon House Studio','Los Angeles','los-angeles','CA','7420 Beverly Blvd','90036','(323) 555-0177','https://canyonhouse.example.com',4.8,112,
  ARRAY['full-home-design','outdoor-patio','kitchen-design','furniture-sourcing'],ARRAY['mid-century','modern','eclectic'],ARRAY['full-renovation','new-build','furnishing-only'],'premium','$75k–$150k',true,'Isabel Ruiz','NCIDQ',
  'Indoor-outdoor living for hillside homes, with a signature mid-century-meets-desert material palette.','OPERATIONAL',true,true,true,null),
 ('il-la-002','sunset-and-sage','Sunset & Sage Interiors','Los Angeles','los-angeles','CA','1102 Abbot Kinney Blvd','90291','(310) 555-0163','https://sunsetandsage.example.com',4.6,71,
  ARRAY['e-design','living-dining','bedroom-design','color-consultation','home-staging'],ARRAY['coastal','minimalist','scandinavian'],ARRAY['single-room','furnishing-only','rental'],'budget','$10k–$25k',true,'Dana Whitfield',null,
  'Venice-based studio offering fast, affordable room refreshes and remote e-design packages nationwide.','OPERATIONAL',false,true,false,null),
 ('il-chi-001','lakeshore-design-group','Lakeshore Design Group','Chicago','chicago','IL','215 W Huron St','60654','(312) 555-0186','https://lakeshoredesign.example.com',4.8,93,
  ARRAY['full-home-design','commercial-office','space-planning','renovation-management','lighting-design'],ARRAY['contemporary-luxury','modern','industrial'],ARRAY['full-renovation','commercial-fitout','new-build'],'premium','$150k+',false,'Priya Malhotra','NCIDQ, IIDA',
  'River North studio working across high-rise residences and boutique workplace interiors.','OPERATIONAL',true,true,true,null),
 ('il-chi-002','graystone-interiors','Graystone Interiors','Chicago','chicago','IL','1841 N Damen Ave','60647','(773) 555-0128','https://graystoneinteriors.example.com',4.5,38,
  ARRAY['kitchen-design','bathroom-design','custom-millwork','renovation-management'],ARRAY['traditional','transitional','farmhouse'],ARRAY['full-renovation','single-room'],'moderate','$25k–$75k',false,'Tom Vasquez','ASID',
  'Kitchen and bath renovation specialists for Chicago''s classic greystones and bungalows.','OPERATIONAL',false,true,false,null),
 ('il-hou-001','bayou-bend-interiors','Bayou Bend Interiors','Houston','houston','TX','2410 Westheimer Rd','77098','(713) 555-0154','https://bayoubendinteriors.example.com',4.7,64,
  ARRAY['full-home-design','living-dining','window-treatments','furniture-sourcing','color-consultation'],ARRAY['traditional','transitional','contemporary-luxury'],ARRAY['full-renovation','furnishing-only','new-build'],'premium','$75k–$150k',false,'Caroline Beaumont','ASID, NCIDQ',
  'River Oaks studio designing gracious, collected homes with an emphasis on custom drapery and art.','OPERATIONAL',true,true,false,null),
 ('il-hou-002','third-ward-design-co','Third Ward Design Co.','Houston','houston','TX','3120 Emancipation Ave','77004','(713) 555-0191','https://thirdwarddesign.example.com',4.4,29,
  ARRAY['e-design','space-planning','home-staging','bedroom-design'],ARRAY['eclectic','modern','maximalist'],ARRAY['single-room','furnishing-only','rental'],'budget','Under $10k',true,'Andre Simms',null,
  'Approachable design for first-time homeowners, rentals and short-term rental hosts.','OPERATIONAL',false,true,false,null),
 ('il-dal-001','preston-hollow-studio','Preston Hollow Studio','Dallas','dallas','TX','4514 Travis St','75205','(214) 555-0133','https://prestonhollowstudio.example.com',4.9,77,
  ARRAY['full-home-design','custom-millwork','lighting-design','renovation-management','kitchen-design'],ARRAY['contemporary-luxury','transitional','modern'],ARRAY['new-build','full-renovation'],'premium','$150k+',false,'Elena Cortez','NCIDQ, ASID',
  'Ground-up new build and whole-home renovation work for North Dallas families.','OPERATIONAL',true,true,true,null),
 ('il-dal-002','bishop-arts-interiors','Bishop Arts Interiors','Dallas','dallas','TX','408 N Bishop Ave','75208','(214) 555-0170','https://bishopartsinteriors.example.com',4.6,45,
  ARRAY['living-dining','bedroom-design','color-consultation','furniture-sourcing','retail-hospitality'],ARRAY['eclectic','mid-century','industrial'],ARRAY['single-room','furnishing-only','commercial-fitout'],'moderate','$10k–$25k',true,'Jules Kim',null,
  'Playful, colour-forward interiors for homes, cafés and small retail spaces in Oak Cliff.','OPERATIONAL',false,true,false,null),
 ('il-aus-001','hill-country-house','Hill Country House','Austin','austin','TX','1209 S Congress Ave','78704','(512) 555-0149','https://hillcountryhouse.example.com',4.8,68,
  ARRAY['full-home-design','outdoor-patio','custom-millwork','renovation-management'],ARRAY['modern','farmhouse','minimalist'],ARRAY['new-build','full-renovation'],'premium','$75k–$150k',false,'Wren Alvarado','NCIDQ',
  'Warm modern architecture-led interiors using Texas limestone, white oak and blackened steel.','OPERATIONAL',true,true,true,null),
 ('il-aus-002','east-side-edit','East Side Edit','Austin','austin','TX','2210 E 6th St','78702','(512) 555-0122','https://eastsideedit.example.com',4.5,33,
  ARRAY['e-design','space-planning','home-office','home-staging'],ARRAY['scandinavian','minimalist','modern'],ARRAY['single-room','furnishing-only','rental'],'budget','$10k–$25k',true,'Sofia Brandt',null,
  'Remote-first studio delivering fixed-fee design packages for condos, offices and rentals.','OPERATIONAL',false,true,false,null),
 ('il-mia-001','coral-way-collective','Coral Way Collective','Miami','miami','FL','3800 Coral Way','33145','(305) 555-0111','https://coralwaycollective.example.com',4.7,82,
  ARRAY['full-home-design','retail-hospitality','lighting-design','furniture-sourcing'],ARRAY['coastal','contemporary-luxury','maximalist'],ARRAY['full-renovation','commercial-fitout','new-build'],'premium','$150k+',false,'Valentina Cruz','ASID',
  'Bold tropical modernism for waterfront residences, restaurants and boutique hotels.','OPERATIONAL',true,true,false,null),
 ('il-mia-002','breeze-block-studio','Breeze Block Studio','Miami','miami','FL','7100 Biscayne Blvd','33138','(305) 555-0195','https://breezeblockstudio.example.com',4.4,26,
  ARRAY['e-design','bedroom-design','living-dining','color-consultation'],ARRAY['mid-century','coastal','eclectic'],ARRAY['single-room','furnishing-only','rental'],'budget','Under $10k',true,'Ramon Diaz',null,
  'MiMo-inspired refreshes for condos and vacation rentals, in person or fully virtual.','OPERATIONAL',false,true,false,null),
 ('il-atl-001','peachtree-and-pine','Peachtree & Pine','Atlanta','atlanta','GA','1145 Peachtree St NE','30309','(404) 555-0158','https://peachtreeandpine.example.com',4.8,59,
  ARRAY['full-home-design','kitchen-design','window-treatments','renovation-management'],ARRAY['transitional','traditional','farmhouse'],ARRAY['full-renovation','new-build','single-room'],'moderate','$25k–$75k',false,'Harriet Boone','NCIDQ, ASID',
  'Southern classicism updated for how families actually live, from Buckhead to Decatur.','OPERATIONAL',true,true,false,null),
 ('il-sea-001','cedar-and-fog','Cedar & Fog','Seattle','seattle','WA','1420 12th Ave','98122','(206) 555-0104','https://cedarandfog.example.com',4.9,71,
  ARRAY['full-home-design','custom-millwork','lighting-design','space-planning'],ARRAY['scandinavian','minimalist','modern'],ARRAY['full-renovation','new-build'],'premium','$75k–$150k',true,'Anneke Voss','NCIDQ',
  'Pacific Northwest studio working in cedar, wool and daylight-driven layouts.','OPERATIONAL',true,true,true,null),
 ('il-den-001','front-range-interiors','Front Range Interiors','Denver','denver','CO','2500 Larimer St','80205','(303) 555-0137','https://frontrangeinteriors.example.com',4.6,48,
  ARRAY['full-home-design','outdoor-patio','renovation-management','furniture-sourcing'],ARRAY['modern','industrial','farmhouse'],ARRAY['full-renovation','new-build','furnishing-only'],'moderate','$25k–$75k',false,'Grant Holloway','ASID',
  'Mountain-modern homes and lofts designed for entertaining and durable everyday use.','OPERATIONAL',false,true,false,null),
 ('il-phx-001','saguaro-design-house','Saguaro Design House','Phoenix','phoenix','AZ','4400 N Scottsdale Rd','85251','(602) 555-0166','https://saguarodesignhouse.example.com',4.7,52,
  ARRAY['full-home-design','outdoor-patio','kitchen-design','color-consultation'],ARRAY['modern','minimalist','eclectic'],ARRAY['new-build','full-renovation','single-room'],'moderate','$25k–$75k',true,'Marisol Vega','NCIDQ',
  'Desert-modern interiors with shaded courtyards, plaster walls and heat-smart materials.','OPERATIONAL',true,true,false,null),
 ('il-bos-001','back-bay-atelier','Back Bay Atelier','Boston','boston','MA','160 Newbury St','02116','(617) 555-0182','https://backbayatelier.example.com',4.8,63,
  ARRAY['full-home-design','custom-millwork','window-treatments','renovation-management','bathroom-design'],ARRAY['traditional','transitional','contemporary-luxury'],ARRAY['full-renovation','single-room'],'premium','$150k+',false,'Charlotte Finn','NCIDQ, ASID',
  'Historic brownstone and penthouse renovations with a respect for original architectural detail.','OPERATIONAL',true,true,false,null),
 ('il-bos-002','harborline-workplace','Harborline Workplace Design','Boston','boston','MA','75 State St','02109','(617) 555-0147','https://harborlineworkplace.example.com',4.5,31,
  ARRAY['commercial-office','space-planning','lighting-design','furniture-sourcing'],ARRAY['modern','industrial','minimalist'],ARRAY['commercial-fitout','full-renovation'],'moderate','$75k–$150k',false,'Devin Osei','IIDA',
  'Workplace and lab interiors for growing Boston and Cambridge companies.','OPERATIONAL',false,true,false,null);

-- 5. Testimonials
INSERT INTO public.testimonials (author, location, treatment, quote, rating, featured) VALUES
 ('Amanda R.','Austin, TX','Full-home design','I found three studios in my budget in about five minutes. We hired the second one and our whole downstairs is unrecognisable.',5,true),
 ('Devon P.','Chicago, IL','Kitchen design','The match quiz actually asked about my timeline and budget, so nobody wasted my time. Great shortlist.',5,true),
 ('Lena M.','Miami, FL','E-design','I rent, so I needed something light-touch. The virtual package I found here was perfect.',4,true),
 ('Chris T.','Seattle, WA','Renovation management','Being able to compare credentials side by side made the decision much easier.',5,false);
