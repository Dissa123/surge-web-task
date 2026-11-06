import { factories } from '@strapi/strapi';

const POPULATE = {
  logo: true,
  navLinks: true,
  orderPopupImage: true,
  orderPopupImageTablet: true,
  orderPopupImageMobile: true,
  team: true,
  credits: true,
};

export default factories.createCoreController('api::site-setting.site-setting', () => ({
  async find(ctx) {
    ctx.query = { ...ctx.query, populate: POPULATE as any };
    return super.find(ctx);
  },
}));
