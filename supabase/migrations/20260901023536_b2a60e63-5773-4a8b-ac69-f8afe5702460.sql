
-- ===== enums =====
create type public.app_role as enum ('admin','customer');
create type public.order_status as enum ('pending','confirmed','processing','ready','out_for_delivery','completed','cancelled');
create type public.service_request_status as enum ('submitted','under_review','contacted','scheduled','in_progress','completed','cancelled');

-- ===== helpers =====
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- ===== profiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create trigger t_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin')
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (true);
create policy "roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.email, new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'customer') on conflict do nothing;
  insert into public.notifications (user_id, title, body, kind)
  values (new.id, 'Welcome to AD Security Camera Solution', 'Your account has been created successfully.', 'account');
  return new;
end; $$;

-- ===== notifications (created before trigger use) =====
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  kind text not null default 'general',
  link text,
  is_admin boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create index on public.notifications (user_id, created_at desc);
create policy "notif read" on public.notifications for select to authenticated using (user_id = auth.uid() or (is_admin and public.is_admin()));
create policy "notif update" on public.notifications for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (true);
create policy "notif admin all" on public.notifications for all to authenticated using (public.is_admin()) with check (public.is_admin());

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ===== catalog =====
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text,
  category_id uuid references public.product_categories(id) on delete set null,
  brand text,
  short_description text,
  description text,
  price numeric(12,2) not null default 0,
  sale_price numeric(12,2),
  stock_quantity int not null default 0,
  stock_status text not null default 'in_stock',
  images jsonb not null default '[]'::jsonb,
  specifications jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  warranty text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.products (category_id);
create index on public.products (is_published, is_featured);

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_id uuid references public.service_categories(id) on delete set null,
  icon text,
  short_description text,
  description text,
  image_url text,
  features jsonb not null default '[]'::jsonb,
  starting_price numeric(12,2),
  is_featured boolean not null default true,
  is_published boolean not null default true,
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== commerce =====
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  full_name text,
  phone text,
  address_line text not null,
  city text,
  notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create sequence public.order_number_seq start 1001;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('ORD-' || nextval('public.order_number_seq')),
  user_id uuid references auth.users(id) on delete set null,
  status public.order_status not null default 'pending',
  full_name text not null,
  phone text not null,
  email text,
  address_line text not null,
  city text,
  delivery_notes text,
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders (user_id, created_at desc);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity int not null,
  line_total numeric(12,2) not null,
  image_url text,
  created_at timestamptz not null default now()
);
create index on public.order_items (order_id);

-- ===== service requests =====
create sequence public.service_request_seq start 1001;
create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique default ('SR-' || nextval('public.service_request_seq')),
  user_id uuid references auth.users(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  service_type text not null,
  status public.service_request_status not null default 'submitted',
  full_name text not null,
  phone text not null,
  email text,
  location text not null,
  property_type text,
  preferred_date date,
  preferred_time text,
  device_count int,
  current_system text,
  description text,
  additional_notes text,
  files jsonb not null default '[]'::jsonb,
  internal_notes text,
  assigned_to text,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.service_requests (user_id, created_at desc);

-- ===== content =====
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  is_read boolean not null default false,
  admin_notes text,
  created_at timestamptz not null default now()
);
create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  image_url text not null,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  company text,
  image_url text,
  rating int not null default 5 check (rating between 1 and 5),
  content text not null,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text,
  subtitle text,
  body text,
  image_url text,
  cta_label text,
  cta_link text,
  cta2_label text,
  cta2_link text,
  items jsonb not null default '[]'::jsonb,
  draft jsonb,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  content jsonb not null default '{}'::jsonb,
  hero_image_url text,
  seo_title text,
  seo_description text,
  is_published boolean not null default true,
  draft jsonb,
  updated_at timestamptz not null default now()
);
create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  location text not null default 'header',
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.footer_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  links jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  is_visible boolean not null default true
);
create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  username text,
  url text not null,
  icon text,
  is_visible boolean not null default true,
  sort_order int not null default 0
);
create table public.media (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  url text not null,
  mime_type text,
  size_bytes bigint,
  alt_text text,
  folder text default 'general',
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  image_url text,
  cta_label text,
  cta_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  entity text,
  entity_id text,
  description text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_logs (created_at desc);

-- ===== updated_at triggers =====
do $$
declare t text;
begin
  foreach t in array array['product_categories','products','service_categories','services','addresses','cart_items','orders','service_requests','gallery_items','testimonials','faqs','homepage_sections','pages','announcements','site_settings']
  loop
    execute format('create trigger t_%s_updated before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ===== grants =====
do $$
declare t text;
begin
  foreach t in array array['product_categories','products','service_categories','services','gallery_items','testimonials','faqs','homepage_sections','pages','navigation_items','footer_sections','social_links','media','announcements','site_settings','audit_logs','addresses','cart_items','orders','order_items','service_requests','contact_messages']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
  foreach t in array array['product_categories','products','service_categories','services','gallery_items','testimonials','faqs','homepage_sections','pages','navigation_items','footer_sections','social_links','announcements','site_settings']
  loop
    execute format('grant select on public.%I to anon', t);
  end loop;
end $$;
grant insert on public.contact_messages to anon;
grant usage, select on sequence public.order_number_seq to authenticated, anon, service_role;
grant usage, select on sequence public.service_request_seq to authenticated, anon, service_role;

-- ===== public content policies =====
create policy "pub read" on public.product_categories for select to anon, authenticated using (is_published or public.is_admin());
create policy "pub read" on public.products for select to anon, authenticated using (is_published or public.is_admin());
create policy "pub read" on public.service_categories for select to anon, authenticated using (is_published or public.is_admin());
create policy "pub read" on public.services for select to anon, authenticated using (is_published or public.is_admin());
create policy "pub read" on public.gallery_items for select to anon, authenticated using (is_published or public.is_admin());
create policy "pub read" on public.testimonials for select to anon, authenticated using (is_published or public.is_admin());
create policy "pub read" on public.faqs for select to anon, authenticated using (is_published or public.is_admin());
create policy "pub read" on public.homepage_sections for select to anon, authenticated using (true);
create policy "pub read" on public.pages for select to anon, authenticated using (is_published or public.is_admin());
create policy "pub read" on public.navigation_items for select to anon, authenticated using (true);
create policy "pub read" on public.footer_sections for select to anon, authenticated using (true);
create policy "pub read" on public.social_links for select to anon, authenticated using (true);
create policy "pub read" on public.announcements for select to anon, authenticated using (is_published or public.is_admin());
create policy "pub read" on public.site_settings for select to anon, authenticated using (true);

do $$
declare t text;
begin
  foreach t in array array['product_categories','products','service_categories','services','gallery_items','testimonials','faqs','homepage_sections','pages','navigation_items','footer_sections','social_links','media','announcements','site_settings','audit_logs']
  loop
    execute format('create policy "admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;
create policy "media read" on public.media for select to authenticated using (public.is_admin());

-- ===== user-owned policies =====
create policy "own addresses" on public.addresses for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid());
create policy "own cart" on public.cart_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own orders read" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "own orders insert" on public.orders for insert to authenticated with check (user_id = auth.uid());
create policy "admin orders write" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin orders delete" on public.orders for delete to authenticated using (public.is_admin());
create policy "order items read" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "order items insert" on public.order_items for insert to authenticated with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "order items admin" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "own requests read" on public.service_requests for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "own requests insert" on public.service_requests for insert to authenticated with check (user_id = auth.uid());
create policy "admin requests" on public.service_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "messages insert" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "messages admin" on public.contact_messages for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ===== seed =====
insert into public.site_settings (key, value) values
('branding', '{"company_name":"AD Security Camera Solution","tagline":"Complete Security Solutions","logo_url":"","favicon_url":"","description":"AD Security Camera Solution supplies, installs and maintains professional security systems: CCTV, access control, time attendance, video intercom, networking and IT solutions."}'),
('contact', '{"email":"adsecuritycamerasolution@gmail.com","phone":"","address":"","working_hours":"Mon - Sat, 8:30 AM - 6:00 PM"}'),
('seo', '{"title":"AD Security Camera Solution | CCTV, Access Control & Networking","description":"Professional CCTV systems, access control, time attendance, video intercom, networking and IT solutions with expert installation and maintenance.","og_image":""}'),
('appearance', '{"primary":"#12324f","accent":"#e0491f","radius":"0.25rem","button_style":"square"}'),
('footer', '{"description":"Professional security systems, installation and technology solutions for homes and businesses.","copyright":"AD Security Camera Solution. All rights reserved."}');

insert into public.social_links (platform, username, url, icon, sort_order) values
('Instagram','@adsecuritycamera','https://instagram.com/adsecuritycamera','instagram',1),
('Telegram','@adsecuritycamera','https://t.me/adsecuritycamera','send',2),
('TikTok','@adsecuritycamera','https://tiktok.com/@adsecuritycamera','music',3);

insert into public.navigation_items (label, url, sort_order) values
('Home','/',1),('Products','/products',2),('Services','/services',3),('About','/about',4),('Gallery','/gallery',5),('Contact','/contact',6);

insert into public.footer_sections (title, links, sort_order) values
('Company','[{"label":"About Us","url":"/about"},{"label":"Gallery","url":"/gallery"},{"label":"FAQ","url":"/faq"},{"label":"Contact","url":"/contact"}]',1),
('Shop','[{"label":"All Products","url":"/products"},{"label":"CCTV Cameras","url":"/products?category=cctv-cameras"},{"label":"Access Control","url":"/products?category=access-control"},{"label":"Cart","url":"/cart"}]',2),
('Services','[{"label":"CCTV Systems","url":"/services/cctv-systems"},{"label":"Access Control","url":"/services/access-control"},{"label":"Networking","url":"/services/network-solutions"},{"label":"Request Service","url":"/request-service"}]',3);

insert into public.product_categories (name, slug, sort_order) values
('CCTV Cameras','cctv-cameras',1),('IP Cameras','ip-cameras',2),('Analog Cameras','analog-cameras',3),
('DVR','dvr',4),('NVR','nvr',5),('Hard Drives','hard-drives',6),('Network Equipment','network-equipment',7),
('Access Control','access-control',8),('Time Attendance','time-attendance',9),('Video Intercom','video-intercom',10),
('Cables & Accessories','cables-accessories',11),('Power Supplies','power-supplies',12),('Security Accessories','security-accessories',13);

insert into public.service_categories (name, slug, sort_order) values
('Installation','installation',1),('Maintenance','maintenance',2),('Consultation','consultation',3),('IT Solutions','it-solutions',4);

insert into public.services (name, slug, icon, short_description, description, features, sort_order, category_id) values
('CCTV Systems','cctv-systems','cctv','Professional surveillance systems for homes, offices, shops and businesses.','We design and deploy surveillance systems sized to your site — from single-shop setups to multi-building installations with remote monitoring.','["Site survey and camera placement","HD and 4K camera options","Remote mobile viewing","Recording and storage planning"]',1,(select id from public.service_categories where slug='installation')),
('Network Solutions','network-solutions','network','Networking infrastructure and connectivity solutions.','Structured cabling, switching, routing and Wi-Fi coverage engineered for reliable security and business traffic.','["Structured cabling","Managed switches and routers","Wi-Fi coverage design","Network troubleshooting"]',2,(select id from public.service_categories where slug='installation')),
('Time Attendance','time-attendance','fingerprint','Biometric attendance and employee management systems.','Fingerprint, card and face-recognition attendance terminals with reporting and payroll-ready exports.','["Fingerprint and face terminals","Shift and roster configuration","Attendance reporting","Staff enrollment support"]',3,(select id from public.service_categories where slug='installation')),
('Video Intercom','video-intercom','door','Video communication and entrance monitoring systems.','Audio and video door entry systems for villas, apartment blocks and office receptions.','["Villa and apartment kits","Door release integration","Indoor and outdoor stations","Mobile answering options"]',4,(select id from public.service_categories where slug='installation')),
('Web & IT Solutions','web-it-solutions','monitor','Professional websites, IT services and technology solutions.','Business websites, IT support, and technology consulting delivered by the same team that secures your premises.','["Business websites","IT support and setup","Systems consulting","Maintenance contracts"]',5,(select id from public.service_categories where slug='it-solutions')),
('Access Control','access-control','lock','Door access, biometric access and secure entry systems.','Card, PIN and biometric access control with door hardware, anti-passback and audit reporting.','["Card, PIN and biometric readers","Electric locks and door hardware","Access levels and schedules","Entry audit reports"]',6,(select id from public.service_categories where slug='installation')),
('CCTV Maintenance','cctv-maintenance','wrench','Scheduled servicing and cleaning for existing camera systems.','Preventive maintenance visits keeping cameras, recorders and storage in working order.','["Scheduled service visits","Camera cleaning and realignment","Recorder health checks","Firmware updates"]',7,(select id from public.service_categories where slug='maintenance')),
('Security Consultation','security-consultation','shield','Expert assessment and security system design.','On-site assessment and a written system design with equipment list and budget.','["Site risk assessment","System design and drawings","Equipment specification","Budget planning"]',8,(select id from public.service_categories where slug='consultation'));

insert into public.products (name, slug, sku, category_id, brand, short_description, description, price, sale_price, stock_quantity, is_featured, specifications, features, warranty) values
('4MP IP Dome Camera','4mp-ip-dome-camera','ADC-IPD4MP',(select id from public.product_categories where slug='ip-cameras'),'Hikvision','Indoor/outdoor 4MP dome camera with night vision.','A weather-rated 4MP dome camera with 30m infrared night vision, suitable for shopfronts, corridors and reception areas.',4800,4350,42,true,'[{"label":"Resolution","value":"4MP (2560x1440)"},{"label":"Lens","value":"2.8mm fixed"},{"label":"IR Range","value":"30 m"},{"label":"Rating","value":"IP67"}]','["30m night vision","IP67 weather rated","PoE powered","H.265+ compression"]','2 years'),
('8MP 4K Bullet Camera','8mp-4k-bullet-camera','ADC-IPB8MP',(select id from public.product_categories where slug='ip-cameras'),'Dahua','4K outdoor bullet camera for perimeters and gates.','High-detail 8MP bullet camera built for perimeter, gate and parking coverage with 60m IR.',7900,null,18,true,'[{"label":"Resolution","value":"8MP (3840x2160)"},{"label":"Lens","value":"3.6mm fixed"},{"label":"IR Range","value":"60 m"},{"label":"Rating","value":"IP67"}]','["4K resolution","60m IR range","Motion detection","PoE powered"]','2 years'),
('2MP Analog HD Camera','2mp-analog-hd-camera','ADC-AN2MP',(select id from public.product_categories where slug='analog-cameras'),'Hikvision','Cost-effective 2MP HD analog camera.','Reliable 1080p analog camera for upgrading existing coax installations without recabling.',1850,1650,90,false,'[{"label":"Resolution","value":"1080p"},{"label":"Signal","value":"HD-TVI/AHD/CVI/CVBS"},{"label":"IR Range","value":"20 m"}]','["Works on existing coax","Four-in-one signal","20m night vision"]','1 year'),
('8 Channel NVR (4K)','8-channel-nvr-4k','ADC-NVR8',(select id from public.product_categories where slug='nvr'),'Dahua','8-channel 4K network video recorder with PoE ports.','Records up to eight IP cameras at 4K with built-in PoE switching and mobile app access.',12500,11800,12,true,'[{"label":"Channels","value":"8"},{"label":"PoE Ports","value":"8"},{"label":"Max Resolution","value":"4K"},{"label":"HDD Bays","value":"2"}]','["Built-in PoE","Mobile app access","Dual HDD bays","H.265+"]','2 years'),
('16 Channel DVR','16-channel-dvr','ADC-DVR16',(select id from public.product_categories where slug='dvr'),'Hikvision','16-channel hybrid DVR for analog and IP cameras.','Hybrid recorder supporting analog and IP inputs with remote playback.',15400,null,8,false,'[{"label":"Channels","value":"16"},{"label":"Inputs","value":"Analog + IP"},{"label":"HDD Bays","value":"2"}]','["Hybrid analog and IP","Remote playback","Two HDD bays"]','2 years'),
('4TB Surveillance Hard Drive','4tb-surveillance-hard-drive','ADC-HDD4TB',(select id from public.product_categories where slug='hard-drives'),'Seagate','Surveillance-rated 4TB drive for 24/7 recording.','Purpose-built drive rated for continuous video writing in recorders.',6200,5900,25,false,'[{"label":"Capacity","value":"4 TB"},{"label":"Interface","value":"SATA 6Gb/s"},{"label":"Workload","value":"24/7 surveillance"}]','["24/7 rated","Low power","Optimised for video"]','3 years'),
('8 Port PoE Switch','8-port-poe-switch','ADC-SW8POE',(select id from public.product_categories where slug='network-equipment'),'TP-Link','Powers and connects up to 8 IP cameras.','Unmanaged PoE switch with 8 powered ports and uplink, ideal for small camera networks.',4300,null,30,false,'[{"label":"Ports","value":"8 PoE + 2 Uplink"},{"label":"PoE Budget","value":"120 W"}]','["120W PoE budget","Plug and play","Metal housing"]','2 years'),
('Fingerprint Access Control Terminal','fingerprint-access-control-terminal','ADC-ACF01',(select id from public.product_categories where slug='access-control'),'ZKTeco','Fingerprint and card door access terminal.','Standalone access terminal supporting fingerprint, card and PIN with door relay output.',8900,8200,15,true,'[{"label":"Users","value":"3000 fingerprints"},{"label":"Methods","value":"Fingerprint / Card / PIN"},{"label":"Output","value":"Door relay"}]','["Three unlock methods","Standalone or networked","Door relay output"]','1 year'),
('Biometric Time Attendance Device','biometric-time-attendance-device','ADC-TA200',(select id from public.product_categories where slug='time-attendance'),'ZKTeco','Fingerprint attendance terminal with reporting software.','Attendance terminal with desktop reporting software and USB/network export.',7400,null,20,true,'[{"label":"Users","value":"1000"},{"label":"Records","value":"100,000"},{"label":"Export","value":"USB / TCP-IP"}]','["Reporting software included","USB and network export","Fast recognition"]','1 year'),
('7 inch Video Intercom Kit','7-inch-video-intercom-kit','ADC-VI7',(select id from public.product_categories where slug='video-intercom'),'Hikvision','Video door entry kit with 7 inch indoor monitor.','Complete villa kit with outdoor station, 7 inch indoor monitor and door release support.',13200,12400,10,true,'[{"label":"Monitor","value":"7 inch colour"},{"label":"Outdoor Station","value":"Weatherproof"},{"label":"Door Release","value":"Supported"}]','["Two-way audio","Night vision outdoor unit","Door release output"]','2 years'),
('305m CAT6 Cable Box','305m-cat6-cable-box','ADC-CAT6',(select id from public.product_categories where slug='cables-accessories'),'D-Link','Pure copper CAT6 cable, 305m box.','Solid copper CAT6 cable for camera and network runs.',7800,null,35,false,'[{"label":"Length","value":"305 m"},{"label":"Conductor","value":"Solid copper"},{"label":"Category","value":"CAT6"}]','["Pure copper","305m box","Indoor rated"]','—'),
('12V 10A CCTV Power Supply','12v-10a-cctv-power-supply','ADC-PSU10',(select id from public.product_categories where slug='power-supplies'),'Generic','Centralised power supply box for up to 9 cameras.','Metal boxed power supply with individually fused outputs.',2600,2350,48,false,'[{"label":"Output","value":"12V DC 10A"},{"label":"Channels","value":"9 fused"}]','["Fused outputs","Metal enclosure","Lockable"]','1 year');

insert into public.faqs (question, answer, sort_order) values
('What CCTV system should I choose?','It depends on the site size, lighting and whether you need remote viewing. We carry out a free assessment and recommend a system with a written equipment list and price.',1),
('Do you provide installation?','Yes. Every system we supply can be installed by our own technicians, including cabling, configuration, mobile access setup and handover training.',2),
('Do you provide maintenance?','Yes. We offer one-off service visits and scheduled maintenance contracts covering cleaning, realignment, recorder health checks and firmware updates.',3),
('Can you install systems for businesses?','Yes. We work with shops, offices, warehouses, schools, hotels and multi-site businesses, including access control and time attendance integration.',4),
('Do you provide access control?','Yes. We supply and install card, PIN and biometric access control with door hardware, access schedules and entry reporting.',5),
('Do you provide networking services?','Yes. Structured cabling, switching, routing and Wi-Fi coverage are part of our core services and are often installed alongside camera systems.',6);

insert into public.testimonials (customer_name, company, rating, content, sort_order) values
('Samuel Bekele','Bekele Trading PLC',5,'They surveyed our warehouse, proposed a sensible camera layout and finished the installation in two days. The remote access works exactly as promised.',1),
('Hanna Girma','Vista Apartments',5,'The video intercom and access control setup solved our entrance problems. Clean cabling and very professional technicians.',2),
('Yonas Tesfaye','Yonas Electronics',4,'Good pricing on the recorder and cameras, and they came back for a free adjustment after the first week.',3),
('Meron Alemu','Alemu Guest House',5,'Our old analog system was failing. They upgraded it without recabling the whole building and trained our staff on the app.',4);

insert into public.gallery_items (title, category, image_url, is_featured, sort_order) values
('Retail store camera installation','CCTV Installation','',true,1),
('Office access control deployment','Access Control','',true,2),
('Structured cabling for warehouse','Networking','',true,3),
('Staff attendance terminal setup','Time Attendance','',true,4),
('Apartment video intercom','Video Intercom','',true,5),
('Multi-site security project','Security Projects','',true,6);

insert into public.homepage_sections (key, title, subtitle, body, cta_label, cta_link, cta2_label, cta2_link, items, sort_order) values
('hero','Complete Security Solutions for Your Home & Business','AD Security Camera Solution supplies security systems and delivers professional installation, maintenance and technology services.',null,'Explore Products','/products','Request a Service','/request-service','[]',1),
('trust','Trusted by homes and businesses',null,null,null,null,null,null,'[{"title":"Professional Installation","text":"Certified technicians and clean cabling on every job."},{"title":"Quality Equipment","text":"Genuine products from established manufacturers."},{"title":"Technical Support","text":"Real people who answer when something needs attention."},{"title":"Reliable Service","text":"Scheduled maintenance that keeps systems running."}]',2),
('services','Our Services','From cameras to complete technology infrastructure.',null,'View All Services','/services',null,null,'[]',3),
('featured_products','Featured Equipment','Cameras, recorders and access hardware ready to order.',null,'Browse All Products','/products',null,null,'[]',4),
('installation','Installation & Service, Done Properly','From first site visit to long-term support.','Every installation follows the same disciplined process so your system works on day one and keeps working.','Book Installation','/request-service',null,null,'[{"title":"Site inspection"},{"title":"System design"},{"title":"Installation"},{"title":"Configuration"},{"title":"Testing"},{"title":"Maintenance"},{"title":"Support"}]',5),
('why_us','Why Choose Us','Security work is only as good as the people who install it.',null,null,null,null,null,'[{"title":"Professional Installation","text":"Neat, standards-based work you can inspect."},{"title":"Quality Security Equipment","text":"Genuine hardware with real warranties."},{"title":"Experienced Technical Support","text":"Direct access to technicians who know your site."},{"title":"Reliable Maintenance","text":"Planned visits, not emergency-only response."},{"title":"Customized Security Solutions","text":"Designs sized to your building and budget."},{"title":"Customer-focused Service","text":"Clear quotes, clear timelines, no surprises."}]',6),
('how_it_works','How It Works','A straightforward process from first contact to ongoing support.',null,null,null,null,null,'[{"title":"Contact Us","text":"Call, message or submit a request."},{"title":"Discuss Your Needs","text":"We learn what you need to protect."},{"title":"Site Assessment","text":"We visit and assess the property."},{"title":"Solution & Quote","text":"You receive a design and a price."},{"title":"Installation","text":"Our technicians install and configure."},{"title":"Support & Maintenance","text":"We stay available afterwards."}]',7),
('testimonials','What Our Customers Say',null,null,null,null,null,null,'[]',8),
('gallery','Recent Work','A sample of installations we have completed.','','View Full Gallery','/gallery',null,null,'[]',9),
('faq','Frequently Asked Questions',null,null,'See All FAQs','/faq',null,null,'[]',10),
('final_cta','Protect What Matters Most','Talk to us about a security system designed for your property, installed by technicians who do this every day.',null,'Request Service','/request-service','Shop Products','/products','[]',11);

insert into public.pages (slug, title, subtitle, content, seo_title, seo_description) values
('about','About AD Security Camera Solution','Security and technology specialists serving homes and businesses.','{"story":"AD Security Camera Solution began as a small camera installation team and grew into a full security and technology provider. Today we supply equipment, install and maintain complete systems, and support the networks and IT that sit behind them.","mission":"To make professional-grade security accessible, properly installed and reliably maintained for every customer we serve.","vision":"To be the security partner businesses and families call first when protection matters.","values":[{"title":"Do the work properly","text":"Neat installations, correct components, no shortcuts."},{"title":"Be reachable","text":"Support does not end when the invoice is paid."},{"title":"Be honest about cost","text":"Quotes reflect what the site actually needs."}],"stats":[{"label":"Systems installed","value":"500+"},{"label":"Business clients","value":"120+"},{"label":"Years of experience","value":"10+"},{"label":"Support response","value":"24 hrs"}]}','About Us | AD Security Camera Solution','Learn about AD Security Camera Solution — our story, mission and approach to professional security installation and support.'),
('services','Our Services','Security systems, installation, maintenance and technology solutions.','{}','Security Services | AD Security Camera Solution','CCTV, access control, time attendance, video intercom, networking and IT services with professional installation.'),
('products','Security Products','Cameras, recorders, access control and accessories.','{}','Security Products | AD Security Camera Solution','Browse CCTV cameras, recorders, access control, time attendance and networking equipment.'),
('gallery','Our Work','Installations and projects completed by our team.','{}','Project Gallery | AD Security Camera Solution','See CCTV, access control and networking projects completed by AD Security Camera Solution.'),
('faq','Frequently Asked Questions','Answers to the questions we hear most.','{}','FAQ | AD Security Camera Solution','Answers about CCTV selection, installation, maintenance, access control and networking services.'),
('contact','Contact Us','Talk to our team about your security requirements.','{}','Contact | AD Security Camera Solution','Contact AD Security Camera Solution for CCTV, access control and networking enquiries.');
