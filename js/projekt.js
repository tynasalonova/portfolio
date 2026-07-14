// ============================================================
// Stránka jednotlivého projektu (projekt.html?p=slug).
// Čte data ze Sanity, najde projekt podle "slug" v URL a
// vykreslí ho pomocí "bloků" (blocks). Nový projekt / nový blok
// přidaný v administraci se zobrazí automaticky - tenhle soubor
// se kvůli tomu upravovat nemusí.
// ============================================================

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('active');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}

// ── Renderery jednotlivých typů bloků ──────────────────────
const TEXT_BLOCKS = new Set(['heading', 'subheading', 'paragraph', 'highlight']);

function renderTextBlock(b) {
  if (b._type === 'heading') return `<h2>${b.text}</h2>`;
  if (b._type === 'subheading') return `<h3>${b.text}</h3>`;
  if (b._type === 'paragraph') return `<p>${b.text}</p>`;
  if (b._type === 'highlight') return `<p class="project-highlight">${b.text}</p>`;
  return '';
}

function renderShowcaseBlock(b) {
  if (b._type === 'image_block') {
    return `<img src="${sanityImageUrl(b.src)}" alt="${b.alt || ''}">`;
  }
  if (b._type === 'featured_video') {
    return `
      <div class="video-box featured">
        <img class="video-poster-img" src="${sanityImageUrl(b.poster)}" alt="${b.caption || ''}">
        <video preload="none" playsinline style="display:none">
          <source src="${b.video}" type="video/mp4">
        </video>
        <div class="play-overlay" data-play><div class="play-btn"></div></div>
        <div class="video-caption">${b.caption || ''}</div>
      </div>`;
  }
  return '';
}

function renderFullWidthBlock(b) {
  if (b._type === 'video_row') {
    const items = (b.items || []).map(v => `
      <div class="video-box">
        <img class="video-poster-img" src="${sanityImageUrl(v.poster)}" alt="${v.caption || ''}">
        <video preload="none" playsinline style="display:none">
          <source src="${v.video}" type="video/mp4">
        </video>
        <div class="play-overlay" data-play><div class="play-btn"></div></div>
        <div class="video-caption">${v.caption || ''}</div>
      </div>`).join('');
    return `<section class="videos-row">${items}</section>`;
  }

  if (b._type === 'figma_viewer') {
    const pages = (b.pages || []).map(p => ({ image: sanityImageUrl(p.image), label: p.label || '' }));
    const multi = pages.length > 1;
    const arrows = multi ? `<button class="figma-arrow" data-figma-prev aria-label="Předchozí stránka">←</button>` : '';
    const arrowsRight = multi ? `<button class="figma-arrow" data-figma-next aria-label="Další stránka">→</button>` : '';
    const label = multi ? `<p class="figma-page-label" id="figma-page-label"></p>` : '';
    return `
      <section class="figma-window-wrap" data-figma='${JSON.stringify(pages).replace(/'/g, "&#39;")}'>
        <p class="figma-window-hint">↕ Scrolluj v okně a prohlédni si celou stránku</p>
        <div class="figma-window-row">
          ${arrows}
          <div class="figma-window">
            <div class="figma-window-scroll" id="figma-scroll">
              <img id="figma-page-img" src="${pages[0] ? pages[0].image : ''}" alt="${pages[0] ? pages[0].label || '' : ''}">
            </div>
          </div>
          ${arrowsRight}
        </div>
        ${label}
      </section>`;
  }

  if (b._type === 'gallery_lightbox') {
    const items = (b.items || []).map(i => `
      <div class="dashboard-card" data-lightbox="${sanityImageUrl(i.src)}">
        <img src="${sanityImageUrl(i.src)}" alt="${i.alt || ''}">
      </div>`).join('');
    return `
      <section class="dashboard-section">
        ${b.heading ? `<h2 class="dashboard-heading">${b.heading}</h2>` : ''}
        <div class="dashboard-row">${items}</div>
      </section>`;
  }

  if (b._type === 'lightbox_row') {
    const items = (b.items || []).map(i => `
      <div class="pdf-card" data-lightbox="${sanityImageUrl(i.full)}">
        <img src="${sanityImageUrl(i.thumb)}" alt="${i.caption || ''}">
        <div class="pdf-caption"><span>${i.caption || ''}</span></div>
      </div>`).join('');
    return `<section class="pdf-row">${items}</section>`;
  }

  if (b._type === 'link_button') {
    return `
      <div class="figma-link-wrap">
        <a class="figma-link-btn" href="${b.url}" target="_blank" rel="noopener">${b.text || 'Odkaz'}</a>
      </div>`;
  }

  return '';
}

function wireUpInteractivity(root) {
  root.querySelectorAll('[data-play]').forEach(overlay => {
    overlay.addEventListener('click', () => {
      const box = overlay.closest('.video-box');
      const poster = box.querySelector('.video-poster-img');
      const video = box.querySelector('video');
      overlay.style.display = 'none';
      if (poster) poster.style.display = 'none';
      video.style.display = 'block';
      video.setAttribute('controls', '');
      video.setAttribute('preload', 'auto');
      video.load();
      video.play();
    });
  });

  root.querySelectorAll('[data-lightbox]').forEach(node => {
    node.addEventListener('click', () => openLightbox(node.dataset.lightbox));
  });

  root.querySelectorAll('[data-figma]').forEach(wrap => {
    const pages = JSON.parse(wrap.dataset.figma);
    if (pages.length <= 1) return;
    let index = 0;
    const img = wrap.querySelector('#figma-page-img');
    const label = wrap.querySelector('#figma-page-label');
    const scroll = wrap.querySelector('#figma-scroll');
    function show() {
      img.src = pages[index].image;
      img.alt = pages[index].label || '';
      if (label) label.innerHTML = `${pages[index].label || ''} <span class="figma-page-count">${index + 1} / ${pages.length}</span>`;
      scroll.scrollTop = 0;
    }
    wrap.querySelector('[data-figma-prev]').addEventListener('click', () => { index = (index - 1 + pages.length) % pages.length; show(); });
    wrap.querySelector('[data-figma-next]').addEventListener('click', () => { index = (index + 1) % pages.length; show(); });
    show();
  });
}

function render(site, projects) {
  const slug = qs('p');
  const idx = projects.findIndex(p => p.slug === slug);
  const project = idx >= 0 ? projects[idx] : projects[0];
  if (!project) {
    document.body.innerHTML = '<p style="padding:8rem 4rem;color:#EBE5D3;">Projekt nenalezen.</p>';
    return;
  }
  const realIdx = idx >= 0 ? idx : 0;

  document.getElementById('page-title').textContent = project.title + ' – Kristýna Salonová';

  document.getElementById('project-badges').innerHTML = `
    <span class="badge badge-red">${project.category}</span>
    <span class="badge badge-tools">${project.tools}</span>`;
  document.getElementById('project-title').textContent = project.title;

  document.getElementById('project-info-box').innerHTML = `
    <div class="project-info-item"><div class="project-info-label">Klient</div><div class="project-info-value">${project.client || ''}</div></div>
    <div class="project-info-item"><div class="project-info-label">Kategorie</div><div class="project-info-value">${project.category || ''}</div></div>
    <div class="project-info-item"><div class="project-info-label">Nástroje</div><div class="project-info-value">${project.tools || ''}</div></div>
    <div class="project-info-item"><div class="project-info-label">Rok</div><div class="project-info-value">${project.year || ''}</div></div>`;

  const blocks = project.blocks || [];
  const leftHTML = [];
  let rightHTML = '';
  const fullWidthHTML = [];

  blocks.forEach(b => {
    if (TEXT_BLOCKS.has(b._type)) {
      leftHTML.push(renderTextBlock(b));
    } else if ((b._type === 'image_block' || b._type === 'featured_video') && !rightHTML) {
      rightHTML = renderShowcaseBlock(b);
    } else {
      fullWidthHTML.push(renderFullWidthBlock(b));
    }
  });

  document.getElementById('project-desc').innerHTML = leftHTML.join('\n');
  const contentSection = document.getElementById('project-content');
  contentSection.classList.add('project-' + project.slug);
  if (rightHTML) {
    const showcase = document.createElement('div');
    showcase.className = 'project-showcase';
    showcase.innerHTML = rightHTML;
    contentSection.appendChild(showcase);
  } else {
    contentSection.classList.add('no-side');
  }

  document.getElementById('project-extra').innerHTML = fullWidthHTML.join('\n');

  // pagination – automaticky podle pořadí projektů v datech
  const prev = projects[(realIdx - 1 + projects.length) % projects.length];
  const next = projects[(realIdx + 1) % projects.length];
  document.getElementById('project-pagination').innerHTML = `
    <a href="projekt.html?p=${encodeURIComponent(prev.slug)}">← Předchozí projekt</a>
    <a href="projekt.html?p=${encodeURIComponent(next.slug)}">Další projekt →</a>`;

  // patička – kontakty ze site.json
  const footerCol = document.getElementById('footer-contact-col');
  const links = [
    ['mailto:' + site.email, site.email],
    ['tel:' + (site.phone_href || site.phone), site.phone],
    [site.linkedin_url || '#', 'LinkedIn'],
    [site.instagram_url || '#', 'Instagram']
  ];
  links.forEach(([href, text]) => {
    const a = document.createElement('a');
    a.href = href; a.textContent = text;
    if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
    footerCol.appendChild(a);
  });

  wireUpInteractivity(document);

  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target.id === 'lightbox') closeLightbox();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
}

Promise.all([
  sanityFetch('*[_type == "siteSettings"][0]'),
  sanityFetch('*[_type == "project"] | order(order asc)')
]).then(([site, projects]) => render(site || {}, projects || []))
  .catch(err => console.error('Nepodařilo se načíst obsah projektu:', err));
