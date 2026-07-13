# Portfolio – Kristýna Salonová

Tahle složka je kompletní, hotový web. Dá se nahrát na hosting tak, jak je.

## Struktura

- `index.html` – hlavní stránka (Hero, Moje práce, O mně, Služby, Spolupráce, Patička)
- `projekt.html` – šablona pro detail jednoho projektu (obsah se dosazuje podle adresy, např. `projekt.html?p=datalook`)
- `css/style.css` – veškerý vzhled (barvy, fonty, rozvržení)
- `js/main.js` – vykreslení hlavní stránky z dat
- `js/projekt.js` – vykreslení stránky projektu z dat
- `content/projects.json` – **všechna data o projektech** (název, popis, obrázky, videa...). Tenhle soubor upravuje administrace (`/admin`) – v běžném provozu do něj nikdy nesaháš ručně.
- `content/site.json` – texty a kontakty mimo projekty (O mně, služby, e-mail, telefon...) – taky editovatelné přes administraci.
- `media/` – všechny obrázky, videa a PDF
- `admin/` – vizuální administrace (Decap CMS), kde přidáváš a upravuješ projekty přes formulář

## Jak přidat nový projekt (po spuštění webu)

1. Jdi na `tvojedomena.cz/admin`
2. Přihlas se
3. V sekci **Projekty** klikni na **Přidej novou položku** (v seznamu "Projekty")
4. Vyplň pole a přidej "bloky" obsahu stránky (nadpis, text, obrázek, video, galerie...)
5. Ulož a publikuj – web se sám aktualizuje během cca minuty

Žádné psaní kódu.

## Rozložení karet na hlavní stránce

Karty projektů se vykreslují ve skupinách po 5: **2 velké nahoře, 3 menší pod nimi**, a tenhle vzor se automaticky opakuje pro jakýkoli počet projektů (6., 7., 8. projekt zase začne novou "velkou" dvojicí atd.). Funguje to samo bez zásahu do kódu.

Jediné, co se oproti původnímu designu ztratilo: originál měl u těch dvou velkých karet ručně doladěné oříznutí/pozici přesně pro dva konkrétní obrázky (jeden přiblížený, druhý posunutý). To se nedá zobecnit na libovolný budoucí obrázek – nové fotky v těch slotech se zobrazí se standardním vystředěným ořezem. Pokud budeš chtít u konkrétního projektu obrázek v "velkém" slotu doladit na míru, napiš mi.

## Co se ještě změnilo oproti původnímu souboru

- Přidal jsem filtrovací tlačítka a pak je zase na tvoje přání odebral – aktuální verze žádné filtry nemá.
- Velké obrázky (hlavně u projektu Datalook, původně 30–43 MB na obrázek) jsem zmenšil a zkomprimoval – jinak by se stránka hrozně pomalu načítala.
- `HP.png` je doplněný (zkomprimovaný a použitý na stránce projektu "Tvorba webu prvnipomoczive.cz"). `krivka_vinova.png` se v designu nepoužívá – ozdobný prvek v navigaci na stránkách projektů byl odstraněný.

## Další kroky

Viz `NAVOD-GITHUB-NETLIFY.md` (jak dostat web live) a `NAVOD-DOMENA.md` (jak připojit vlastní doménu).
