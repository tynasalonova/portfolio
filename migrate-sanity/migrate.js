const fs = require('fs');
const path = require('path');

const PROJECT_ID = '7m8r1a9l';
const DATASET = 'production';
const TOKEN = process.env.SANITY_TOKEN;
const SITE_BASE = 'https://portfolio-482.pages.dev';
const MEDIA_DIR = path.join(__dirname, '..', 'media');

if (!TOKEN) { console.error('Missing SANITY_TOKEN env var'); process.exit(1); }

const mimeFor = (file) => {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
};

const CACHE_FILE = path.join(__dirname, 'asset-cache.json');
let assetCache = {};
if (fs.existsSync(CACHE_FILE)) {
  assetCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
}
function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(assetCache, null, 2));
}

async function uploadImage(relPath) {
  if (!relPath) return null;
  if (assetCache[relPath]) return assetCache[relPath];
  const filePath = path.join(MEDIA_DIR, relPath.replace(/^media\//, ''));
  if (!fs.existsSync(filePath)) {
    console.error('MISSING FILE:', filePath);
    return null;
  }
  const buf = fs.readFileSync(filePath);
  const mime = mimeFor(filePath);
  const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/${DATASET}?filename=${encodeURIComponent(path.basename(filePath))}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': mime,
    },
    body: buf,
  });
  const json = await res.json();
  if (!res.ok) {
    console.error('UPLOAD FAILED', relPath, JSON.stringify(json));
    return null;
  }
  const assetId = json.document._id;
  assetCache[relPath] = assetId;
  saveCache();
  console.log('uploaded', relPath, '->', assetId);
  return assetId;
}

function imgRef(assetId) {
  if (!assetId) return undefined;
  return { _type: 'image', asset: { _type: 'reference', _ref: assetId } };
}

function videoUrl(relPath) {
  if (!relPath) return undefined;
  return `${SITE_BASE}/${relPath}`;
}

async function convertBlock(b) {
  const type = b.type;
  if (type === 'heading' || type === 'subheading' || type === 'paragraph' || type === 'highlight') {
    return { _type: type, _key: randKey(), text: b.text };
  }
  if (type === 'image') {
    const asset = await uploadImage(b.src);
    return { _type: 'image_block', _key: randKey(), src: imgRef(asset), alt: b.alt || '' };
  }
  if (type === 'featured_video') {
    const poster = await uploadImage(b.poster);
    return { _type: 'featured_video', _key: randKey(), video: videoUrl(b.video), poster: imgRef(poster), caption: b.caption || '' };
  }
  if (type === 'video_row') {
    const items = [];
    for (const it of (b.items || [])) {
      const poster = await uploadImage(it.poster);
      items.push({ _key: randKey(), video: videoUrl(it.video), poster: imgRef(poster), caption: it.caption || '' });
    }
    return { _type: 'video_row', _key: randKey(), items };
  }
  if (type === 'figma_viewer') {
    const pages = [];
    for (const p of (b.pages || [])) {
      const asset = await uploadImage(p.image);
      pages.push({ _key: randKey(), image: imgRef(asset), label: p.label || '' });
    }
    return { _type: 'figma_viewer', _key: randKey(), pages };
  }
  if (type === 'gallery_lightbox') {
    const items = [];
    for (const it of (b.items || [])) {
      const asset = await uploadImage(it.src);
      items.push({ _key: randKey(), src: imgRef(asset), alt: it.alt || '' });
    }
    return { _type: 'gallery_lightbox', _key: randKey(), heading: b.heading || '', items };
  }
  if (type === 'lightbox_row') {
    const items = [];
    for (const it of (b.items || [])) {
      const thumb = await uploadImage(it.thumb);
      const full = await uploadImage(it.full);
      items.push({ _key: randKey(), thumb: imgRef(thumb), full: imgRef(full), caption: it.caption || '' });
    }
    return { _type: 'lightbox_row', _key: randKey(), items };
  }
  if (type === 'link_button') {
    return { _type: 'link_button', _key: randKey(), url: b.url, text: b.text };
  }
  console.error('unknown block type', type);
  return null;
}

function randKey() {
  return Math.random().toString(36).slice(2, 10);
}

async function mutate(mutations) {
  const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mutations }),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error('MUTATE FAILED', JSON.stringify(json, null, 2));
    process.exit(1);
  }
  return json;
}

async function main() {
  const projectsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'projects.json'), 'utf8'));
  const siteData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'site.json'), 'utf8'));

  let order = 10;
  for (const p of projectsData.projects) {
    console.log('--- processing project', p.slug);
    const cover = await uploadImage(p.cover_image);
    const blocks = [];
    for (const b of (p.blocks || [])) {
      const converted = await convertBlock(b);
      if (converted) blocks.push(converted);
    }
    const doc = {
      _id: `project-${p.slug}`,
      _type: 'project',
      order,
      slug: p.slug,
      title: p.title,
      category: p.category,
      tools: p.tools,
      client: p.client || '',
      card_subtitle: p.card_subtitle || '',
      year: p.year || '',
      summary: p.summary || '',
      cover_image: imgRef(cover),
      image_fit: p.image_fit || 'contain',
      image_zoom: Number(p.image_zoom) || 100,
      image_position_x: p.image_position_x || 'center',
      image_position_y: p.image_position_y || 'center',
      blocks,
    };
    await mutate([{ createOrReplace: doc }]);
    console.log('saved project', p.slug);
    order += 10;
  }

  const siteDoc = {
    _id: 'siteSettings',
    _type: 'siteSettings',
    hero_subtitle: siteData.hero_subtitle || '',
    about_title: siteData.about_title || '',
    about_paragraphs: siteData.about_paragraphs || [],
    services: (siteData.services || []).map(s => ({ _key: randKey(), name: s.name, desc: s.desc })),
    cta_label: siteData.cta_label || '',
    cta_title: siteData.cta_title || '',
    cta_tagline: siteData.cta_tagline || '',
    email: siteData.email || '',
    phone: siteData.phone || '',
    phone_href: siteData.phone_href || '',
    linkedin_url: siteData.linkedin_url || '',
    instagram_url: siteData.instagram_url || '',
  };
  await mutate([{ createOrReplace: siteDoc }]);
  console.log('saved site settings');
  console.log('DONE');
}

main().catch(e => { console.error(e); process.exit(1); });
