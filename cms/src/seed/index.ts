import fs from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';
import { homepage, siteSetting } from './content';

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const IMAGE_FIELDS = new Set([
  'logo', 'image', 'secondImage', 'coverImage', 'paperImage', 'desktopImage', 'mobileImage', 'ogImage',
  'orderPopupImage', 'orderPopupImageTablet', 'orderPopupImageMobile',
]);

/** Uploads /seed/images once and replaces filename strings in the content tree with media ids. */
async function resolveImages(strapi: Core.Strapi, node: any, cache: Map<string, number>): Promise<any> {
  if (Array.isArray(node)) return Promise.all(node.map((n) => resolveImages(strapi, n, cache)));
  if (node && typeof node === 'object') {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(node)) {
      if (IMAGE_FIELDS.has(key) && typeof value === 'string') {
        out[key] = await upload(strapi, value, cache);
      } else {
        out[key] = await resolveImages(strapi, value, cache);
      }
    }
    return out;
  }
  return node;
}

async function upload(strapi: Core.Strapi, name: string, cache: Map<string, number>) {
  if (cache.has(name)) return cache.get(name)!;
  // Reuse a file that is already in the Media Library (keeps re-seeding from duplicating uploads).
  const existing = await strapi.db.query('plugin::upload.file').findOne({ where: { name } });
  if (existing) {
    cache.set(name, existing.id);
    return existing.id as number;
  }
  const filepath = path.join(process.cwd(), 'seed', 'images', name);
  const ext = path.extname(name).toLowerCase();
  const [file] = await strapi.plugin('upload').service('upload').upload({
    data: { fileInfo: { name, alternativeText: name } },
    files: { filepath, originalFilename: name, mimetype: MIME[ext] ?? 'application/octet-stream', size: fs.statSync(filepath).size },
  });
  cache.set(name, file.id);
  return file.id as number;
}

async function seedSingle(strapi: Core.Strapi, uid: 'api::homepage.homepage' | 'api::site-setting.site-setting', data: any) {
  const existing = await strapi.documents(uid).findFirst();
  if (existing && process.env.SEED_FORCE !== 'true') return;
  // SEED_FORCE=true (dev only): replace the singleton with the seed content; admin users are untouched.
  if (existing) await strapi.documents(uid).delete({ documentId: existing.documentId });
  const resolved = await resolveImages(strapi, data, (seedSingle as any).cache ??= new Map());
  await strapi.documents(uid).create({ data: resolved, status: 'published' });
  strapi.log.info(`Seeded ${uid}`);
}

export async function seed(strapi: Core.Strapi) {
  await seedSingle(strapi, 'api::site-setting.site-setting', siteSetting);
  await seedSingle(strapi, 'api::homepage.homepage', homepage);
}

/** Public role: read the two singletons, create subscribers. Nothing else is exposed. */
export async function grantPublicPermissions(strapi: Core.Strapi) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  if (!role) return;
  const actions = [
    'api::homepage.homepage.find',
    'api::site-setting.site-setting.find',
    'api::subscriber.subscriber.create',
  ];
  for (const action of actions) {
    const found = await strapi.db.query('plugin::users-permissions.permission').findOne({ where: { action, role: role.id } });
    if (!found) await strapi.db.query('plugin::users-permissions.permission').create({ data: { action, role: role.id } });
  }
}
