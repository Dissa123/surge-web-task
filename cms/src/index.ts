import type { Core } from '@strapi/strapi';
import { grantPublicPermissions, seed } from './seed';

const WATCHED = new Set(['api::homepage.homepage', 'api::site-setting.site-setting']);
const ACTIONS = new Set(['create', 'update', 'publish', 'unpublish', 'discardDraft', 'delete']);

export default {
  /**
   * Publishing in Strapi must update the live site with no code deploy. After any write to the
   * homepage / site settings we ping the Next.js revalidate endpoint, which busts its cache tag.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.documents.use(async (context, next) => {
      const result = await next();
      if (WATCHED.has(context.uid) && ACTIONS.has(context.action)) {
        const url = process.env.FRONTEND_URL;
        if (url) {
          fetch(`${url.replace(/\/$/, '')}/api/revalidate`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-revalidate-secret': process.env.REVALIDATE_SECRET ?? '' },
            body: JSON.stringify({ model: context.uid }),
          }).catch((err) => strapi.log.warn(`Revalidate ping failed: ${err.message}`));
        }
      }
      return result;
    });
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicPermissions(strapi);
    if (process.env.SEED_ON_BOOT !== 'false') await seed(strapi);
  },
};
