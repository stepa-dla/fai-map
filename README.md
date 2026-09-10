# FAI · Mapa učeben U5

Mobilní interaktivní mapa Fakulty aplikované informatiky UTB. Zachovává 183 původních polygonů digitálního layoutu ve třech podlažích. Datový podklad obsahuje 125 položek; 118 ověřených nebo pojmenovaných míst je dostupných v aplikaci. Sedm nečitelných či sporných položek zůstává jen v interních datech.

## Spuštění a nasazení

Vyžaduje Node.js 22.13 nebo novější.

- `npm ci`
- `npm run dev` – místní vývojový náhled.
- `npm run build` – vytvoří statický web; výstup je v adresáři `dist/client`.
- Nahrajte obsah adresáře `dist/client` na statický webhosting. Web používá absolutní cesty od kořene domény, např. `mapa.example.cz`.

Mapa nepotřebuje účet Mappedin, API klíč ani databázi. Veškeré mapové a navigační podklady používá lokálně.

## Ovládání

Vyberte místnost klepnutím nebo hledáním. Tlačítko **Odtud** nastaví začátek trasy, **Navigovat sem** cíl. Výchozím začátkem je hlavní vchod. Trasu lze vést po schodech nebo výtahem. Šipky nad mapou přepínají mezi jednotlivými podlažími trasy. Mapu lze posunovat a přibližovat dvěma prsty, kolečkem i tlačítky. Popisky se přizpůsobují místu a zoomu, mají maximálně 10 obrazových pixelů a polotučný řez.

## Úprava dat

- `lib/fai-source-plan.json`: původní tvary, přiřazení čísel z brožury, cíle navigace, schodiště a výtahy.
- `public/navigation.json`: původní síť navigačních bodů.
- `lib/navigation.ts`: výpočet trasy a odvozená propojení výtahů.
- `app/page.tsx`: ovládání mapy a dynamické popisky.
- `app/globals.css`: mobilní rozložení a barvy FAI.

## Přesnost podkladů

Půdorysy pocházejí z veřejného digitálního layoutu zadaného uživatelem. Tvary zůstávají beze změny; čísla vycházejí z dodané Příručky pro prváka. Původní digitální mapa někde spojuje více místností do jedné plochy. Takové místnosti sdílejí původní tvar; vysvětlení je pouze v této dokumentaci. Nečitelná nebo sporná čísla jsou na mapě bez popisku.

Navigace vede po zdrojové síti chodeb. Cíle u místností jsou orientační body na přilehlé chodbě. Zdrojový export nepřipojoval všechny místnosti; cíle byly doplněny podle polohy a strany vstupu v brožuře. Vazby mezi výtahy a krátké návaznosti výtahových hal jsou odvozené. Před použitím pro skutečnou navigaci je potřeba v budově ověřit čísla sporných místností, polohy dveří, průchodnost chodeb a provoz výtahů. Volba výtahu není potvrzením bezbariérovosti.

Identita a oficiální logo vycházejí z https://vizual.utb.cz/index.php?p=fai. Zdroj layoutu: veřejná mapa 6960f936eb8b19000be79f5d dodaná uživatelem. Aplikace neobsahuje odkaz na Mappedin.

## Ověření

Ověřeno 274 kombinací tras včetně všech položek z hlavního vchodu v obou režimech, opačných směrů mezi místnostmi a navazujících podlaží. Prohlížečové ověření zahrnulo rozměry 320, 390, 768 a 1440 px, hledání, trasu mezi místnostmi přes tři podlaží, obě varianty přesunu, přepínání podlaží, dialog a dynamické popisky bez otazníků. Integrované WebMCP akce jsou registrovány, pokud je prohlížeč podporuje; v testovacím prohlížeči tato možnost dostupná nebyla.


## GitHub Pages

Projekt obsahuje hotový workflow `.github/workflows/static.yml`. Nahrajte zdrojový projekt do svého repozitáře (větev `main`). V nastavení repozitáře vyberte **Pages → Source → GitHub Actions**. Workflow používá Node.js 24, sestaví web a publikuje jej přes oficiální GitHub Pages akce. Není potřeba ukládat žádný přístupový klíč.

Pro GitHub Pages se používá `npm run build:pages`, výstup je `dist/client`. Cesta repozitáře se automaticky převezme z nastavení Pages do `NEXT_PUBLIC_BASE_PATH`, takže funguje projektová adresa `/nazev-repozitare/` i vlastní doména. Lokálně ověřeno na `/fai-mapa/` včetně všech souborů, loga, hledání a navigace. Tento export používá stejnou React aplikaci jako náhled, bez požadavku na běžící server.

Návod GitHub: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Opravy podle uživatelské kontroly

WC jsou v 1. NP a 2. NP vždy ve třech dvojicích (horní levá chodba, dolní levá chodba a pravé foyer). Ve 3. NP je jen dvojice vlevo nahoře. Pohlaví nebylo z podkladu určeno. V oddáleném přehledu má dvojice společný popisek WC, při přiblížení se popisky rozdělí. Označení šaten bylo odstraněno.

Na malých telefonech se po výpočtu trasy panel zmenší. Tlačítko Upravit zpřístupní nastavení trasy. Opraveno také pomalé posouvání mapy, které dříve mohlo otevřít místnost, a hledání na nízkém displeji na šířku.


Interní poznámky o brožuře, sdílených plochách a neověřených označeních jsou pouze v tomto README a v `K-OVERENI.md`. Uživatelské rozhraní je nezobrazuje. Nečíslované neověřené položky nejsou ve vyhledávání ani v nabídce navigace; jejich plochy zůstávají zakreslené bez popisku.

Produkční sestavení pro vlastní hosting i GitHub Pages nyní používá stejný statický export Vite. Na hostingu neběží Node.js ani serverové vykreslování. Po rozbalení ZIPu nahrajte obsah složky včetně skryté složky `.github` do svého repozitáře. V Settings → Pages zvolte GitHub Actions. Workflow se spustí při nahrání do větve main; poprvé jej lze spustit také ručně v Actions.


## Aktualizace po auditu

Mobilní panel má tři polohy: úzká lišta (88 px plus systémová bezpečná oblast), běžný panel a rozbalený seznam. Při otevření mapy je stažený dolů. Ovládá se tažením za úchyt, šipkami a tlačítky Hledat místnost / Navigace. Po výpočtu trasy se stáhne na lištu; vyhledávání a rozpracovaná trasa se při sbalení zachovají.

Vstup do U53/107 je podle uživatelského potvrzení v levém horním rohu původního polygonu. Značka dveří je na souřadnici [129.33, 497.52], přístupový bod 13209 v přilehlé severní chodbě. Zvýšen kontrast pomocných textů a respektována volba omezení animací.

## Orientační značky a vykreslení tras (10. 9. 2026)

Hlavní vchod v přízemí má zelenou šipku směřující zvenku nahoru do budovy a trvalý popisek. Pokud se při posunu mapy dostane mimo obraz, zůstane tlačítko pro jeho nalezení. Schody jsou tmavě modré, výtahy fialové a WC světle modrá. Značky se při oddálení nezmenšují, těsné páry výtahů se spojují a posunuté ikony mají vodicí čárku ke skutečné poloze.

Přestupní značky leží nad trasou. Pokyn „Pokračuj do 1. patra“ znamená 2. NP; v opačném směru je uvedeno přízemí. Klepnutí na ikonu nebo pokyn přepne správné podlaží. Učebny mají sytější teplou žlutou, zázemí modrošedou a WC výraznější modrou; chodby zůstávají téměř bílé. Při navigaci jsou ostatní místnosti mírně barevně utlumené, jejich rozlišení však zůstává viditelné. Původní polygony a umístění WC se nemění.

Parkoviště před budovou je pouze schematické orientační pozadí podle uživatelského zákresu. Neuvádí skutečný počet stání ani obsazenost a není cílem vnitřní navigace. Recepce je podle uživatele vlevo od hlavního vstupu; po dohodě není zakreslena, protože nemáme potvrzenou přesnou polohu.

Výpočet trasy používá Dijkstrův algoritmus nad 15 441 uzly původního grafu. Hledá nejnižší součet vah hran pro zvolený režim schodů/výtahu; nejde o záruku geometricky nejkratší cesty volným prostorem. Vykreslení následně odstraňuje drobné zlomy pomocí omezeného Douglasova–Peuckerova zjednodušení s odchylkou nejvýše 18 jednotek mapy (necelé 2 m). Každá nová spojnice musí celá zůstat ve známých polygonech chodeb včetně otvorů a nesmí protnout ani kopírovat původní stěnu. Nejisté úseky zůstávají původní. Začátky, cíle, přestupy ani samotná volba trasy se touto úpravou nemění.

- `lib/route-smoothing.ts`: kontrola průchodnosti a zjednodušení vykreslení.
- `lib/route-barriers.json`: úsečky stěn převedené ze zdrojového digitálního layoutu do souřadnic mapy.

Ověřeno 266 tras a 60 kontrol průniku stěnou, zachování koncových bodů a nejvyšší odchylky. 68 556 zdrojových bodů se pro kreslení zredukovalo na 5 407; 3 136 nových spojnic bylo také nezávisle vzorkováno uvnitř chodeb. Mobilní a desktopové testy zahrnují klepnutí i klávesnici na přestupech, zachování WC 6/6/2, hledání a panel ve čtyřech rozměrech displeje. Tyto kontroly potvrzují konzistenci mapových dat, nikoli skutečnou průchodnost budovy.
