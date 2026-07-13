// ============================================================
// Homepage: načte content/site.json a content/projects.json
// a vykreslí nav/hero/about/služby/CTA/patičku + mřížku projektů.
// Karty se vykreslují ve skupinách po 5: 2 velké nahoře, 3 menší
// pod tím, pořád dokola - funguje automaticky s libovolným
// počtem projektů. Nový projekt v content/projects.json (přes
// /admin) se zobrazí automaticky, bez zásahu do tohoto souboru.
// ============================================================

function el(tag, opts) {
  const e = document.createElement(tag);
  if (opts) Object.assign(e, opts);
  return e;
}

function renderSite(site) {
  document.getElementById('nav-mail-btn').href = 'mailto:' + site.email;
  document.getElementById('hero-sub').textContent = site.hero_subtitle;

  document.getElementById('about-title').textContent = site.about_title;
  const aboutText = document.getElementById('about-text');
  aboutText.innerHTML = '';
  (site.about_paragraphs || []).forEach(p => {
    const para = el('p');
    para.textContent = p;
    aboutText.appendChild(para);
  });

  const servicesGrid = document.getElementById('services-grid');
  servicesGrid.innerHTML = '';
  (site.services || []).forEach(s => {
    const item = el('div', { className: 'service-item' });
    item.innerHTML = `<h3 class="service-name"></h3><p class="service-desc"></p>`;
    item.querySelector('.service-name').textContent = s.name;
    item.querySelector('.service-desc').textContent = s.desc;
    servicesGrid.appendChild(item);
  });

  document.getElementById('cta-label').textContent = site.cta_label;
  document.getElementById('cta-title').textContent = site.cta_title;
  document.getElementById('cta-tagline').textContent = site.cta_tagline;
  document.getElementById('cta-btn').href = 'mailto:' + site.email;

  const ctaContact = document.getElementById('cta-contact');
  ctaContact.innerHTML = '';
  const mail = el('a', { href: 'mailto:' + site.email, textContent: site.email });
  const tel = el('a', { href: 'tel:' + (site.phone_href || site.phone), textContent: site.phone });
  ctaContact.appendChild(mail);
  ctaContact.appendChild(tel);

  const footerCol = document.getElementById('footer-contact-col');
  const links = [
    ['mailto:' + site.email, site.email],
    ['tel:' + (site.phone_href || site.phone), site.phone],
    [site.linkedin_url || '#', 'LinkedIn'],
    [site.instagram_url || '#', 'Instagram']
  ];
  links.forEach(([href, text]) => {
    const a = el('a', { href, textContent: text });
    if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
    footerCol.appendChild(a);
  });
}

function projectCard(p) {
  const card = el('div', { className: 'card' });
  card.dataset.category = p.category;
  card.innerHTML = `
    <div class="card-top">
      <div class="card-header">
        <span class="badge badge-red"></span>
        <span class="badge badge-tools"></span>
      </div>
      <img class="card-img" src="${p.cover_image}" alt="${p.title}">
    </div>
    <div class="card-body">
      <h3 class="card-title"></h3>
      <p class="card-company"></p>
      <p class="card-desc"></p>
      <div class="card-footer">
        <a class="card-link" href="projekt.html?p=${encodeURIComponent(p.slug)}">
          Zobrazit projekt
          <img src="media/sipka-bezova.png" alt="">
        </a>
        <span class="card-year"></span>
      </div>
    </div>
  `;
  card.querySelector('.badge-red').textContent = p.category;
  card.querySelector('.badge-tools').textContent = p.tools;
  card.querySelector('.card-title').textContent = p.title;
  card.querySelector('.card-company').textContent = p.card_subtitle || '';
  card.querySelector('.card-desc').textContent = p.summary || '';
  card.querySelector('.card-year').textContent = p.year || '';
  const img = card.querySelector('.card-img');
  if (p.image_fit === 'cover') {
    img.classList.add('card-img-cover');
  }
  const posX = p.image_position_x || 'center';
  const posY = p.image_position_y || 'center';
  img.style.objectPosition = `${posX} ${posY}`;
  const zoom = Number(p.image_zoom) || 100;
  if (zoom !== 100) {
    img.style.transform = `scale(${zoom / 100})`;
    img.style.transformOrigin = `${posX} ${posY}`;
  }
  return card;
}

// Skupiny po 5: pozice 0,1 v rámci skupiny = velká řada; 2,3,4 = malá řada
function renderProjects(projects) {
  const grid = document.getElementById('works-grid');
  grid.innerHTML = '';

  let bigRow = null;
  let smallRow = null;

  projects.forEach((p, i) => {
    const posInGroup = i % 5;
    const card = projectCard(p);

    if (posInGroup === 0) {
      bigRow = el('div', { className: 'works-row-big' });
      grid.appendChild(bigRow);
      smallRow = null;
      bigRow.appendChild(card);
    } else if (posInGroup === 1) {
      bigRow.appendChild(card);
    } else {
      if (!smallRow) {
        smallRow = el('div', { className: 'works-row-small' });
        grid.appendChild(smallRow);
      }
      smallRow.appendChild(card);
    }
  });
}

Promise.all([
  fetch('content/site.json').then(r => r.json()),
  fetch('content/projects.json').then(r => r.json())
]).then(([site, data]) => {
  renderSite(site);
  renderProjects(data.projects || []);
}).catch(err => {
  console.error('Nepodařilo se načíst obsah webu:', err);
});
