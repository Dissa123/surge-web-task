/**
 * Initial content, copied from the reference homepage so the editor starts with a working page.
 * After the first boot everything here lives in Strapi and is edited there; this file is only
 * read when the Homepage / Site Setting singletons are empty.
 * Image keys map to files in /seed/images (uploaded to the Media Library on first boot).
 */
export const siteSetting = {
  siteName: 'Nōta',
  logo: 'logo.svg',
  navLinks: [
    { label: 'Specifications', url: '#specifications' },
    { label: "Who it's for", url: '#who-its-for' },
    { label: 'About', url: '#about' },
    { label: 'Inside the box', url: '#inside-the-box' },
  ],
  orderLabel: 'Order',
  productName: 'Nota One',
  price: '$300',
  orderUrl: '',
  orderPopupImage: 'popup-order.png',
  orderPopupImageTablet: 'popup-order-480.png',
  orderPopupImageMobile: 'popup-order-320.png',
  closeLabel: 'Close',
  subscribeTitle: 'Stay ahead',
  subscribeText: 'Launching soon. Get early access and insider updates',
  subscribePlaceholder: 'Your email',
  subscribeButton: 'Notify me',
  subscribeSuccess: 'All set. We’ll keep you posted',
  subscribeError: 'Something went wrong! Try again',
  subscribeRequiredMessage: 'This field is required',
  subscribeInvalidMessage: 'Enter a valid email address',
  team: [
    { name: 'Alexandra Kazimirskaya', url: 'https://telegram.me/lunary_me' },
    { name: 'Daria Zubareva', url: 'https://telegram.me/mi_shunia' },
    { name: 'Olga Kopyeva', url: 'https://telegram.me/imkopyova' },
    { name: 'Stefania Orlova', url: 'https://telegram.me/whybitchcry' },
    { name: 'Dobrinya Karepin', url: 'https://telegram.me/donkarepin' },
    { name: 'Maya Melnichuk', url: 'https://telegram.me/MYaroslavovna' },
    { name: 'Valeria Yalova-Chernova', url: 'https://telegram.me/Yalova_Valeriya' },
    { name: 'Natalia Borovkova', url: 'https://telegram.me/NatalieMeribel' },
    { name: 'Anastasia Voronova', url: 'https://telegram.me/Anastasia_coin' },
  ],
  footerYearLabel: 'Year',
  footerYear: '2026',
  copyright: '@2026 Nōta Team',
  credits: [
    { label: 'Made in Taptop', url: 'https://taptop.pro/' },
    { label: 'Designed by Alice', url: 'https://www.behance.net/alicem' },
    { label: '& UPROCK Studio', url: 'https://www.uprock.ru/' },
  ],
};

export const homepage = {
  seo: {
    metaTitle: 'NŌTA | Writing Infrastructure for Modern Thinking',
    metaDescription:
      'Nota is a smart pen that keeps handwriting natural and syncs every note to an app where it is organised, searchable and ready to work with AI.',
    noIndex: true,
  },
  sections: [
    {
      __component: 'sections.hero',
      eyebrow: 'Smart pen',
      title: 'for real thinking',
      scrollLabel: 'Scroll',
      image: 'hero.png',
      imageAlt: 'Black smart pen',
      // Anchored to the nib tip, the grip and the cap while the visitor scrolls (in this order).
      callouts: [
        { label: 'Fountain pen nib', text: 'Designed for precise, expressive handwriting' },
        { label: 'High-precision optical tracking', text: 'Real-time stroke capture' },
        { label: 'Aluminum body', text: 'Flush-fit precision cap' },
      ],
    },
    {
      __component: 'sections.specifications',
      anchor: 'specifications',
      eyebrow: 'Nota pen',
      title: 'Specifications',
      image: 'scene2.webp',
      imageAlt: 'Black smart pen',
      // Animated 3D marks pinned to parts of the pen (part: nib | grip | button | body | clip | cap).
      markers: [
        { part: 'nib', label: 'Fountain pen nib', text: 'Natural ink flow' },
        { part: 'grip', label: 'Replaceable ink cartridge', text: 'Designed for precise, expressive handwriting' },
        { part: 'button', label: 'High-precision optical tracking', text: 'Real-time stroke capture' },
        { part: 'body', label: 'Line-by-line accuracy', text: 'Supports handwriting, diagrams, sketches' },
        { part: 'clip', label: 'Notes sync automatically', text: 'Searchable over time' },
        { part: 'cap', label: 'Structured with AI support', text: 'Ready when you return' },
      ],
      groups: [
        {
          title: 'Writing System',
          items: [
            { text: 'Fountain pen nib' },
            { text: 'Natural ink flow' },
            { text: 'Replaceable fountain-pen ink cartridge' },
            { text: 'Designed for precise, expressive handwriting' },
          ],
        },
        {
          title: 'Capture Technology',
          items: [
            { text: 'High-precision optical tracking' },
            { text: 'Real-time stroke capture' },
            { text: 'Line-by-line accuracy' },
            { text: 'Supports handwriting, diagrams, sketches' },
          ],
        },
        {
          title: 'Digital Continuity',
          items: [
            { text: 'Notes sync automatically' },
            { text: 'Searchable over time' },
            { text: 'Structured with AI support' },
            { text: 'Ready when you return' },
          ],
        },
      ],
    },
    {
      __component: 'sections.audience',
      anchor: 'who-its-for',
      lede: 'Some thoughts need time, space, and a physical trace to exist. Writing by hand creates focus, presence, and a deeper connection with ideas. This tool is built around that simple truth.',
      title: 'Who it’s for',
      image: 'scene5-2.jpg',
      imageAlt: 'Smart pen nib on a white surface',
      intro:
        'This tool is made for people who think on paper. It keeps handwriting natural and focused, letting you write the way you always have without distractions or screens getting in the way. Everything you write syncs to the app, where your notes are organized, searchable, and ready to work with AI when you need more clarity or structure.',
      cards: [
        {
          title: 'Students & Learners',
          text: 'Handwritten notes stay personal and intuitive, but become searchable, organized, and easy to study. Lectures, ideas, and revisions are captured as they are — then supported by AI summaries, text recognition, and quick navigation when it matters most.',
        },
        {
          title: 'Creators, Designers & Architects',
          text: 'Sketches, diagrams, concepts, and fragments of ideas belong on paper. This tool makes sure they don’t disappear. Everything drawn or written is safely stored, easy to revisit, and ready to evolve into something bigger — without interrupting the creative flow.',
        },
        {
          title: 'Managers & Product Thinkers',
          text: 'Meetings start on paper and end with structure. Notes turn into clear summaries, tasks, and follow-ups. The pen captures everything quietly, while the app helps organize decisions without pulling attention away from the room.',
        },
      ],
    },
    {
      __component: 'sections.feature-block',
      depthScene: true, // premium 3D depth + sync-stream effect (tuned for this photograph)
      eyebrow: 'Everything you write is synced to your phone in real time',
      title: 'Your notes. Already there.',
      body: 'Every note is instantly transferred to your device and safely stored in your personal space. Access your thoughts anytime, organize them effortlessly, and continue working across devices. Your handwriting becomes part of a system that is searchable, structured, and always available.',
      image: 'scene4-4.jpg',
      imageAlt: 'Phone displaying synced handwritten notes from the notebook',
    },
    {
      __component: 'sections.feature-block',
      bookScene: true, // scroll-driven 3D notebook: closed cover -> opens to the pages (image)
      coverImage: 'scene4-1.jpg',
      title: 'No delays. No glitches. No random effects.',
      subtitle: 'AI-powered structure',
      body: 'Handwriting is processed in real time and enriched quietly in the background. AI recognizes text, structure, and context to organize notes, highlight key ideas, and connect thoughts over time. The technology stays invisible, so your focus remains fully on writing.',
      image: 'scene4-3.jpg',
      imageAlt: 'Open notebook with handwritten notes and sketches',
    },
    {
      __component: 'sections.feature-block',
      paperScene: true, // scroll-driven real-paper scene (image = dimmed backdrop, paperImage = the page photograph)
      paperImage: 'scene4-3.jpg',
      title: 'Looks like paper. Works like a system.',
      subtitle: 'For you, it’s just a blank sheet',
      body: 'You write freely, without grids, guides, or visible markers. The paper feels clean and familiar, keeping your focus on ideas instead of tools. Nothing distracts you from the act of writing. Nothing changes in how you write — only what becomes possible after.',
      image: 'scene4-2.jpg',
      imageAlt: 'Open smart notebook',
      secondImage: 'scene4-1.jpg',
      secondImageAlt: 'Black smart notebook with an elastic band',
    },
    {
      __component: 'sections.works-with',
      anchor: 'about',
      title: 'We use special paper with a nearly invisible pattern',
      subtitle: 'For the pen, it’s a precise map',
      body: 'The pattern defines exact coordinates across the page, allowing the pen to capture every stroke with precision and consistency. For you, it feels like ordinary paper. For the system, it becomes a stable reference that turns handwriting into structured, accurate digital data.',
      label: 'Works with smart paper',
      slides: [
        { desktopImage: 'slide1.jpg', mobileImage: 'slide1-m.jpg', alt: 'Smart paper detail 1' },
        { desktopImage: 'slide2.jpg', mobileImage: 'slide2-m.jpg', alt: 'Smart paper detail 2' },
        { desktopImage: 'slide3.jpg', mobileImage: 'slide3-m.jpg', alt: 'Smart paper detail 3' },
      ],
    },
    {
      __component: 'sections.inside-box',
      anchor: 'inside-the-box',
      title: 'Inside the box',
      heading: 'A complete, ready-to-use set',
      intro: 'Smart pen, Smartpaper notepad, charging cable, and instructions — carefully packaged for a hassle-free start.',
      description:
        'A precision smart pen with a solid aluminum body, designed for natural handwriting and accurate digital capture. Seamlessly connects to smart paper, translating every stroke into structured digital data — no screens, no distractions, just writing.',
      tiles: [
        { label: 'Flush-fit precision cap', image: 'scene6-1.jpg' },
        { label: 'Refined colors. Personal expression', image: 'scene6-2.jpg' },
        { label: 'Durable metal nib, low-profile control button', image: 'scene6-3.jpg' },
        { label: 'Aluminum body', image: 'scene6-card5.png' },
      ],
      products: [
        {
          title: 'The NŌTA Smart Pen',
          text: 'Aluminum body, USB-C charging, physical control button, and Bluetooth connectivity. Up to 8 hours of active use with a lightweight, balanced design for everyday writing.',
          image: 'scene5-1.jpg',
        },
        {
          title: 'Charging Adapter',
          text: 'Compact USB-C power adapter with stable output for everyday charging. Designed for safe, efficient power delivery with minimal heat.',
          image: 'scene5_adapter.jpg',
        },
      ],
      colors: [
        { name: 'Silver', caption: 'Impossible to overthink', swatch: '#c9ccd3', image: 'color1.jpg' },
        { name: 'Graphite Black', caption: 'Graphite Black. Clarity in silence.', swatch: '#2b2b2e', image: 'color2.jpg' },
        { name: 'Mist Blue', caption: 'Mist Blue. Light thinking.', swatch: '#8fa8d8', image: 'color3.jpg' },
        { name: 'Precision Red', caption: 'Precision Red. Form follows thought.', swatch: '#d8322b', image: 'color4.jpg' },
        { name: 'Bright Orange', caption: 'Bright Orange. Steady focus.', swatch: '#f2701d', image: 'color5.jpg' },
      ],
    },
    {
      __component: 'sections.closing',
      text: 'NŌTA creates tools that respect the way people think and write. Natural handwriting, quietly connected to digital structure.',
    },
  ],
};
