# Audit FAI mapy a doporučené pokračování

Kontrola 9. 9. 2026. Výchozí veřejná verze: https://stepa-dla.github.io/fai-map/, repozitář stepa-dla/fai-map, commit 270c2d831b8e3cd814ee23e5f41c6e9a8b46d81b. Opravy uvedené níže jsou v přiložené aktualizaci; na GitHub se dostanou po nahrání souborů.

## Výsledek

Základ aplikace funguje: vyhledávání, volba podlaží, navigace od vchodu i mezi místnostmi, obě varianty přesunu, WC i statické nasazení. Největší praktický problém byl prostor zabraný mobilním panelem. Aktualizace jej řeší úzkou lištou.

## Opravy v tomto balíčku

- Mobilní panel lze stáhnout dolů na 88 px plus bezpečnou oblast telefonu. Začíná v této poloze. Úchyt reaguje na tah nahoru/dolů; šipky nabízejí ovládání bez tažení. Tři polohy: lišta, běžný panel, rozbalený seznam.
- Lišta nabízí hledání a navigaci. Po výpočtu se panel stáhne a ukáže celou dostupnou mapu. Rozpracované hledání i trasa zůstávají při sbalení zachované.
- Vchod U53/107 je vlevo nahoře, napojený na severní chodbu. Značka dveří [129.33, 497.52], přístupový bod 13209 [128.38, 492.84].
- Při novém hledání se zavře starý detail; na displeji na šířku už neodtlačí výsledky mimo viditelnou oblast.
- Ztmavení pomocných textů odstranilo nalezené problémy kontrastu. Tlačítka pro vymazání výběru mají název pro čtečky obrazovky. Krok trasy se oznamuje jako živá oblast. Nastavení omezených animací vypíná příslušné pohyby.
- Info je určené studentům. Nečitelné místnosti zůstávají prázdné; interní poznámky jsou jen v dokumentaci.

## Co bylo ověřeno

- Ve výchozím navigačním grafu 31 250 kombinací (125 × 125 × schody/výtah), bez chyby: konce tras, patra, navazující přechody, platné souřadnice a požadovaný způsob přesunu. Sedm interních nejasných položek je v grafu, ale není ve veřejném výběru.
- Po opravě dveří znovu všech 498 kombinací do i z U53/107 v obou režimech, bez chyby.
- 98 číslovaných místností, žádná duplicitní čísla. Původních 183 tvarů se touto aktualizací nemění.
- Mobilní a desktopový prohlížeč Chromium/Edge v rozměrech 320 × 640, 390 × 844, 844 × 390 a 1440 × 1000. Ověřena lišta, detail, hledání další místnosti, schody/výtah, přepínání podlaží, WC 6/6/2 a informační okno.
- Dotykové události úchytu prošly všemi třemi polohami oběma směry.
- Kontrola TypeScriptu a produkční export pod cestou /fai-map/. Automatická kontrola přístupnosti axe-core se zaměřením na WCAG A/AA v testovaných stavech.

Automatické výsledky neověřují skutečné dveře a průchodnost v budově. Safari na fyzickém iPhonu a systémová čtečka obrazovky v tomto kole nebyly samostatně testovány.

## Nejbližší technická údržba

### 1. Pročistit a aktualizovat knihovny

npm audit nad aktuálním lockfile ohlásil 11 zasažených balíčků: 8 high, 2 moderate, 1 low, bez critical. Čísla zahrnují přenesená hlášení mezi závislostmi, nejsou počtem nezávislých útoků na mapu. Týkají se hlavně vývojového/serverového řetězce (Vite, Vinext, Cloudflare nástroje, React Server Components a jejich závislosti). GitHub Pages provozuje hotové statické soubory a žádný tento Node server.

Doporučený další zásah: ponechat potřebnou sestavu React + Vite, odstranit nepoužívané serverové a hostingové balíčky a aktualizovat ponechané nástroje. Potom ověřit čistou instalaci a nasazení. Balíčky nebyly v této funkční aktualizaci automaticky přepsány.

Příklady ověřených hlášení: [Vite – vývojový server na Windows](https://github.com/advisories/GHSA-fx2h-pf6j-xcff), [React Server Functions](https://github.com/advisories/GHSA-wx67-qw84-cm4g).

### 2. Přidat trvalé automatické kontroly do GitHub Actions

Současný workflow sestavuje a publikuje web. Doplnit kontrolu jedinečnosti čísel, dosažitelnosti místností, správného počtu WC a klíčové mobilní interakce. Dnešní auditovací skripty běžely při vývoji; nejsou zatím součástí CI repozitáře.

### 3. Zjednodušit zdroj a odlehčit první načtení

Rozhraní a jeho stav jsou soustředěné v app/page.tsx. CSS obsahuje několik historických vrstev přepisování. Rozdělení na mapu, panel a navigaci sníží riziko dalších vizuálních regresí. Produkční JavaScript má přibližně 1,21 MB před kompresí, CSS 214 kB. Zvážit odložené načtení navigačního grafu až při první trase a odstranění nepoužívaných stylů a komponent; přínos ověřit měřením na pomalejším telefonu.

## Funkce s největším přínosem pro studenty

1. **Odkaz přímo na místnost nebo trasu + QR kódy.** Odkaz otevře konkrétní cíl; QR u vchodu může rovnou nastavit začátek. Nyní se stav do adresy neukládá a obnovení stránky vrací výchozí mapu.
2. **Uložená poslední trasa a oblíbené učebny.** Lokálně v telefonu, bez účtu. Obnovení stránky pak nepřeruší navigaci.
3. **Offline mapa a přidání na plochu.** PWA s řízeným ukládáním dat a oznámením nové verze. Nyní chybí manifest i service worker; fungování po načtení bez sítě není totéž jako spolehlivé offline otevření.
4. **Praktické pokyny na přechodech.** U schodiště či výtahu ukázat srozumitelnou orientační informaci nebo fotografii. Nejprve fyzicky ověřit přístupy a výtahy. Režim „Výtahem“ sám nepotvrzuje celou bezbariérovou cestu.
5. **Volitelná lepší čitelnost.** Zachovat současný kompaktní vzhled a nabídnout větší popisky nebo zvýraznění vyhledané místnosti. Současné maximum 10 obrazových pixelů vychází z požadovaného vzhledu.

Jako první produktové rozšíření doporučuji odkaz na místnost/trasu a navazující QR kódy. Rozvrhy, obsazenost místností a automatická poloha uvnitř budovy by vyžadovaly další spolehlivá data nebo infrastrukturu; pro tuto fázi mají vyšší náklady.

Přístupnost byla posuzována s oporou v [WCAG 2.2](https://www.w3.org/TR/WCAG22/) a [pravidlech velikosti ovládacích prvků](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum). Automatický test pokrývá jen část požadavků.
