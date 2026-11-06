export interface MediaFormat {
  url: string;
  width: number;
  height: number;
}

export interface Media {
  url: string;
  width: number | null;
  height: number | null;
  alternativeText: string | null;
  mime: string;
  formats?: Record<string, MediaFormat> | null;
}

export interface Link { label: string; url: string }
export interface TextItem { text: string }
export interface Card { title: string; text: string }
export interface TeamMember { name: string; url: string | null }

export interface Seo {
  metaTitle: string;
  metaDescription: string;
  ogImage: Media | null;
  noIndex: boolean;
}

export interface SiteSetting {
  siteName: string;
  logo: Media | null;
  navLinks: Link[];
  orderLabel: string;
  productName: string;
  price: string;
  orderUrl: string | null;
  orderPopupImage: Media | null;
  orderPopupImageTablet: Media | null;
  orderPopupImageMobile: Media | null;
  closeLabel: string;
  subscribeTitle: string;
  subscribeText: string | null;
  subscribePlaceholder: string;
  subscribeButton: string;
  subscribeSuccess: string;
  subscribeError: string;
  subscribeRequiredMessage: string;
  subscribeInvalidMessage: string;
  team: TeamMember[];
  footerYearLabel: string;
  footerYear: string | null;
  copyright: string | null;
  credits: Link[];
}

export interface HeroSection {
  __component: "sections.hero";
  eyebrow: string | null;
  title: string;
  scrollLabel: string | null;
  image: Media | null;
  imageAlt: string | null;
  callouts: { label: string; text: string | null }[];
}

export interface SpecificationsSection {
  __component: "sections.specifications";
  anchor: string | null;
  eyebrow: string | null;
  title: string;
  groups: { title: string; items: TextItem[] }[];
  markers: { part: string; label: string; text: string | null }[];
  image: Media | null;
  imageAlt: string | null;
}

export interface AudienceSection {
  __component: "sections.audience";
  anchor: string | null;
  lede: string | null;
  title: string;
  intro: string | null;
  image: Media | null;
  imageAlt: string | null;
  cards: Card[];
}

export interface FeatureBlockSection {
  __component: "sections.feature-block";
  anchor: string | null;
  depthScene: boolean;
  bookScene: boolean;
  paperScene: boolean;
  paperImage: Media | null;
  coverImage: Media | null;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  body: string | null;
  image: Media | null;
  imageAlt: string | null;
  secondImage: Media | null;
  secondImageAlt: string | null;
}

export interface WorksWithSection {
  __component: "sections.works-with";
  anchor: string | null;
  title: string;
  subtitle: string | null;
  body: string | null;
  label: string | null;
  slides: { desktopImage: Media; mobileImage: Media | null; alt: string }[];
}

export interface InsideBoxSection {
  __component: "sections.inside-box";
  anchor: string | null;
  title: string;
  heading: string | null;
  intro: string | null;
  description: string | null;
  tiles: { label: string; image: Media }[];
  products: (Card & { image: Media | null })[];
  colors: { name: string; caption: string; swatch: string | null; image: Media }[];
}

export interface ClosingSection {
  __component: "sections.closing";
  text: string;
}

export type Section =
  | HeroSection
  | SpecificationsSection
  | AudienceSection
  | FeatureBlockSection
  | WorksWithSection
  | InsideBoxSection
  | ClosingSection;

export interface Homepage {
  seo: Seo;
  sections: Section[];
}
