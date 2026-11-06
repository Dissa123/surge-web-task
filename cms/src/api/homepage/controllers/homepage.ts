import { factories } from '@strapi/strapi';

// Editors never need to think about populate: the public API always returns the full page.
const POPULATE = {
  seo: { populate: { ogImage: true } },
  sections: {
    on: {
      'sections.hero': { populate: { image: true, callouts: true } },
      'sections.specifications': { populate: { groups: { populate: { items: true } }, markers: true, image: true } },
      'sections.audience': { populate: { cards: true, image: true } },
      'sections.feature-block': { populate: { image: true, secondImage: true, coverImage: true, paperImage: true } },
      'sections.works-with': { populate: { slides: { populate: { desktopImage: true, mobileImage: true } } } },
      'sections.inside-box': { populate: { tiles: { populate: { image: true } }, products: { populate: { image: true } }, colors: { populate: { image: true } } } },
      'sections.closing': { populate: '*' },
    },
  },
};

export default factories.createCoreController('api::homepage.homepage', () => ({
  async find(ctx) {
    ctx.query = { ...ctx.query, populate: POPULATE as any };
    return super.find(ctx);
  },
}));
