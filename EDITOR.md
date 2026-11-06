# Rychlé popisky akcí

Mapa dál běží na GitHub Pages. Není potřeba Supabase ani další hosting. Návštěvníci se nepřihlašují. Popisek akce doplňuje číslo místnosti; půdorys, dveře a navigační síť se nemění.

## První spuštění

1. Nahraj obsah aktualizačního ZIPu do kořene repozitáře `stepa-dla/fai-map` a počkej na úspěšné nasazení v Actions. Nový soubor `public/room-events.json` musí být součástí aktualizace.
2. Vytvoř [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new?name=FAI%20mapa&target_name=stepa-dla&contents=write). Vyber vlastníka `stepa-dla`, **Only select repositories → fai-map**, oprávnění **Contents → Read and write** a datum vypršení. Ostatní oprávnění nejsou potřeba.
3. Otevři [správu mapy](https://stepa-dla.github.io/fai-map/#sprava), případně tlačítko **i → Správa popisků akcí**. Vlož klíč přímo do editoru a zvol **Připojit editor**. Klíč nikomu neposílej a neukládej do repozitáře.

Klíč zůstává jen v paměti aktuální otevřené stránky. Po obnovení stránky nebo odpojení ho zadáš znovu. Editor ho posílá pouze na `api.github.com` v autorizační hlavičce. Neukládá ho do místního úložiště prohlížeče, souboru s popisky ani adresy stránky.

## Běžná úprava

1. Vyber místnost v nabídce nebo zvol **Vybrat v mapě** a klepni na učebnu.
2. Napiš název akce (nejvýše 48 znaků). Volitelně nastav **Platnost do**; jde o místní čas zařízení.
3. Zvol **Uložit a zveřejnit**. Editor upraví pouze `public/room-events.json` a vytvoří commit v `main`. Stávající workflow následně zveřejní novou verzi mapy.

Zveřejnění může podle GitHubu trvat až 10 minut. Editor proto rozlišuje uložení do repozitáře a zveřejnění. Odkaz **Stav zveřejnění na GitHubu** otevře Actions; neúspěšné nasazení vyžaduje opravu workflow. Vlastní náhled po uložení se zobrazí ihned, ostatní návštěvníci dostanou data až po úspěšném nasazení. Jejich otevřené mapy kontrolují změny každých 30 sekund a při návratu na kartu.

Akce jsou oranžově zvýrazněné. Název se zobrazuje v mapě podle dostupného místa, v detailu místnosti a ve výsledcích hledání. Hledání prochází všechny podlaží a názvy akcí bez ohledu na velikost písmen a diakritiku. Názvy fungují i ve výběru začátku a cíle navigace. Čísla učeben zůstávají vyhledatelná vždy.

Po dosažení konce platnosti název automaticky přestane být vidět i vyhledatelný; není potřeba další nasazení. Bez data zůstane aktivní do ručního odstranění. **Vrátit původní popisek** odstraní pouze akci u vybrané místnosti. Odstranění potvrdíš a zveřejní se stejným postupem.

Při přepnutí místnosti se rozepsaný text zachová do zavření stránky či odpojení. Pokud někdo mezitím upraví stejnou místnost, editor odmítne přepsání. Tlačítkem **Načíst aktuální verzi** načteš současný stav, porovnáš ho se svým textem a poté můžeš uložit. Úpravy různých místností se slučují.

## Správa a aktualizace

- Při dalších aktualizacích aplikace zachovej aktuální `public/room-events.json` z GitHubu. Nepřepisuj ho prázdným souborem ze starého ZIPu.
- Pro jiný repozitář uprav veřejné konstanty `EVENT_REPOSITORY`, `EVENT_BRANCH` a `PUBLISHED_EVENTS_URL` v `lib/github-events.ts` a odkaz na vytvoření klíče v editoru.
- Náhled v Sites načítá zveřejněné popisky ze stejné GitHub Pages adresy; do GitHubu ukládá stejným editorem. Samotný náhled nenahrazuje první nahrání aktualizace do GitHubu.
- Soubor obsahuje pouze veřejné názvy akcí, čas konce a čas úpravy. Neuváděj v něm neveřejné informace.
- Obnova předchozí verze je možná přes historii souboru na GitHubu.
- Kontroly spustíš pomocí `npm run test:events`; ověřují validaci, češtinu, ukončení platnosti, souběžné změny a chyby GitHub API. Testy používají simulované odpovědi a nic nepublikují.

Zdroj: [GitHub Contents API](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents), [přístupové klíče](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens), [prodleva GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site#viewing-your-published-site).
