// ============================================================
// Malý pomocník pro napojení na Sanity (bez nutnosti npm balíčku).
// Data se čtou přímo přes veřejné GROQ API - žádný build krok,
// web zůstává čistý statický HTML/JS jako doteď.
// ============================================================

const SANITY_PROJECT_ID = '7m8r1a9l';
const SANITY_DATASET = 'production';

// Sestaví adresu obrázku ze Sanity image reference (asset._ref).
function sanityImageUrl(imgField) {
  if (!imgField || !imgField.asset || !imgField.asset._ref) return '';
  const ref = imgField.asset._ref; // formát: image-<id>-<sirka>x<vyska>-<format>
  const parts = ref.split('-');
  const assetId = parts[1];
  const dimensions = parts[2];
  const format = parts[3];
  return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${assetId}-${dimensions}.${format}`;
}

// Zavolá GROQ dotaz na veřejné (CDN) API Sanity a vrátí výsledek.
async function sanityFetch(query) {
  const url = `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Sanity dotaz selhal: ' + res.status);
  }
  const json = await res.json();
  return json.result;
}
