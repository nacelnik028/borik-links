# Vít · osobní web

Statický frontend bez frameworku a klientských balíčků. Server používá jedinou přímou závislost `@netlify/blobs` pro bezpečné uchování případného rotovaného Spotify tokenu. Otevři `index.html` v prohlížeči. Na Netlify navíc fungují automatické žebříčky Spotify a Steamu přes dvě serverové funkce. Publikační krok pouze zkopíruje veřejné soubory do `dist/`.

Kontext pro další chaty a úpravy projektu je v [AGENTS.md](AGENTS.md): mapa souborů, fungování webu a návrhy dalšího vývoje.

## Jak změnit úvodní text

Otevři **`config.js`**. Texty jsou na jednom místě:

- `greeting` – první řádek nadpisu („Ahojkyy, já jsem“).
- `rotatingNames` – slova, která se postupně píšou v nadpisu. Další slovo přidej jako položku v uvozovkách.
- `tagline` – krátký text pod nadpisem.
- `bio` – celý text „o mně“. Může mít více odstavců. `**slovo**` zvýrazní slovo, `{age}` doplní aktuální věk.
- `birthday` – datum narození ve formátu `2010-02-20`.
- `interests` – malé štítky pod biem.
- `topThree` – dvě skupiny skutečných statistik. `source: 'steam'` / `source: 'spotify'` určuje zdroj. Pořadí, názvy, obrázky a odkazy vrací serverové funkce; ruční favorité se nepoužívají ani při výpadku. Přístupové údaje do této konfigurace nikdy nepatří.
- `defaultTheme` – výchozí barvy: `violet`, `aurora` nebo `sunset`. Uložená volba návštěvníka má přednost.
- `discordId` a `discordUsername` – profil pro živý stav a jméno ke kopírování.

Po uložení obnov stránku. Texty se vykreslují jako text, HTML do konfigurace nepatří. Uvozovku uvnitř textu zapsaného v jednoduchých uvozovkách napiš jako `\'`.

## Soubory

- `index.html` – struktura stránky a odkazy na sociální sítě.
- `config.js` – snadno upravitelný obsah.
- `css/style.css` – vzhled, motivy a mobilní rozložení.
- `js/app.js` – obsah, psaní nadpisu, motivy, čas, kopírování a rychlé menu.
- `js/top-three.js` – karty skutečných statistik, načítání, uložená data a nedostupnost.
- `netlify/functions/top-artists.mjs`, `top-games.mjs` – veřejné výsledky statistik; přístupové údaje čtou pouze na serveru.
- `netlify/lib/response.mjs` – společné odpovědi, timeouty, rate limit a cache funkcí.
- `netlify/lib/spotify-vault.mjs` – serverové šifrované úložiště rotovaného refresh tokenu a záznamu o nutném novém propojení.
- `scripts/check-public.mjs` – zastaví build při nalezení dostupného tajného údaje ve veřejných souborech.
- `netlify.toml`, `scripts/build.mjs` – nastavení Netlify a sestavení veřejné složky `dist/`.
- `scripts/connect-spotify.mjs` – místní jednorázové propojení Spotify účtu.
- `.env.example` – prázdná předloha nastavení; skutečný `.env` je ignorovaný Gitem a nikdy se nekopíruje do `dist/`.
- `tests/top-three.test.mjs` – ověření serverových funkcí pomocí vestavěného Node test runneru.
- `js/presence.js` – živý Discord profil, herní aktivita a Spotify přes Lanyard.
- `js/effects.js` – kurzor, hvězdné pozadí, padající hvězdy a jemná reakce polární záře na myš.

## Ovládání

Na počítači myš doprovází malá tečka s tenkým kroužkem bez částic. Nad odkazem nebo tlačítkem se kroužek mírně zvětší a vyplní barvou motivu, při stisku se stáhne. V rychlém menu a klidném režimu se používá běžný kurzor; na dotykových zařízeních se vlastní kurzor nezobrazuje.

Moje top 3 tvoří dva kompaktní panely s očíslovanými řádky: hry a interpreti / kapely. Po propojení účtů ukazují „Nejhranější hry“ a „Nejposlouchanější interpreti“ se zdrojem a obdobím. Na počítači jsou vedle sebe, na mobilu pod sebou. Hry obsahují český počet hodin; každá skutečná položka odkazuje na Steam nebo Spotify. Chybějící výsledky se ničím nedoplňují.

Obrázky statistik přicházejí z oficiálních odpovědí služeb a vyplňují 48px rámeček s ořezem (`cover`). Bez platného obrázku nebo při chybě načtení zůstane číslo a název, bez náhradních iniciál. Původní obrázky v `assets/favorites/` zůstávají archivním obsahem projektu a nejsou zálohou statistik.

Mobilní úvod má menší avatar a oběžné kruhy. Při poslechu se Spotify panel jemně zeleně zvýrazní; při neaktivitě nebo výpadku se vrátí do základního vzhledu.

Spotify při poslechu animuje zelený ekvalizér a spodní zvukovou vlnu. Vlna je dekorativní, nereaguje na skutečný zvuk skladby. Herní aktivitu odlišují tři pomalu pulzující tečky v barvě motivu. V klidném režimu jsou indikátory statické a při skrytí karty se jejich pohyb pozastaví.

Motiv se mění dole na stránce a zůstane uložený v prohlížeči. **Ctrl+K** (na Macu **⌘K**) otevře rychlé menu; **Esc** ho zavře. Klidný režim vypne pohyb včetně psaní nadpisu. Respektuje se také systémové nastavení omezeného pohybu.

Polární záře v pozadí přebírá barvy vybraného motivu. Na počítači jemně reaguje na myš, na dotykových zařízeních je tlumenější. V klidném režimu zůstane statická a při skrytí karty prohlížeče se její animace pozastaví. Intenzitu upravíš v `css/style.css` u `.aurora-background` pomocí `opacity`.

Živé údaje vyžadují dostupný profil v Lanyardu a internetové připojení. Při výpadku se zobrazí nedostupnost a spojení se automaticky obnovuje. „Naposledy online“ vychází z posledního online stavu zaznamenaného tímto prohlížečem. Kopírování používá schránku na HTTPS/localhost; při nedostupnosti nabídne jméno k ručnímu zkopírování.

## Propojení automatických TOP 3 na Netlify

Výchozí nastavení je Spotify za přibližně poslední 4 týdny a Steam podle celkového odehraného času. Pořadí interpretů počítá Spotify vlastním algoritmem; nejde o přesné počty přehrání. Steam pokrývá hry ve zpřístupněné knihovně, včetně hraných free-to-play her, a zobrazuje také hodiny. Hry z jiných platforem se nezapočítávají. Stačí propojit vlastní účet; návštěvníci se nepřihlašují.

### 1. Spotify

Potřebuješ Spotify Premium pro účet vlastníka aplikace a Node.js 22 nebo novější na počítači. Jednorázově spusť `npm ci` pro serverovou závislost.

1. Přihlas se do [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) a vytvoř aplikaci pro svůj web s přístupem k Web API.
2. V nastavení aplikace přidej přesně tento **Redirect URI**: `http://127.0.0.1:8888/callback`. Použij tuto IP adresu, ne `localhost`. Nejde o adresu veřejného webu, ale o místního pomocníka pro jednorázové přihlášení.
3. V části pro přístup uživatelů přidej svůj Spotify účet, pokud tam ještě není.
4. Zkopíruj soubor `.env.example` do `.env`. Z nastavení Spotify aplikace do něj doplň `SPOTIFY_CLIENT_ID` a `SPOTIFY_CLIENT_SECRET`.
5. V kořenové složce projektu spusť `node scripts/connect-spotify.mjs`. Otevři odkaz, který vypíše, a povol čtení svého žebříčku. Po dokončení se `SPOTIFY_REFRESH_TOKEN` doplní přímo do `.env`; pomocník jej nevypisuje do terminálu. Na přihlášení čeká nejvýše 5 minut. Po úspěchu přesměruje na potvrzení bez jednorázového kódu v adrese; potvrzení lze ještě dvě minuty znovu načíst a pak se místní pomocník vypne. Vypnutí této dočasné stránky propojení neruší.

Pomocník potřebuje jen oprávnění `user-top-read`. Při propojení i při serverové obnově se ověřuje, že token nemá další oprávnění; širší nebo neznámé oprávnění se odmítne. Toto oprávnění umožňuje čtení žebříčků, nikoli změnu playlistů, ovládání přehrávání nebo přihlášení do účtu. Heslo zadáváš pouze na oficiální stránce Spotify, náš web jej nezískává. Přístup lze kdykoli odebrat v [připojených aplikacích Spotify](https://www.spotify.com/account/apps/).

`.env` se nepublikuje a není součástí Gitu. Pokud už běží jiný program na portu 8888, nejprve jej ukonči.

Období se vybírá proměnnou `SPOTIFY_TIME_RANGE`: `short_term` = přibližně 4 týdny (výchozí), `medium_term` = přibližně 6 měsíců, `long_term` = přibližně rok. [Dokumentace žebříčku](https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks).

Spotify může vyžadovat nové propojení po odvolání přístupu nebo vypršení refresh tokenu. Podle [aktuální dokumentace](https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens) má refresh token životnost 6 měsíců; pak spusť pomocníka znovu a aktualizuj token na Netlify. Odvolaný nebo neplatný refresh token se přestane používat i po restartu funkce; návštěvníkům se nespouští přihlášení. Pokud Spotify při obnově vrátí nový refresh token, server jej uloží před použitím nového access tokenu. Na Netlify je záznam v privátním Blobs úložišti, navíc šifrovaný AES-256-GCM klíčem odvozeným z původního serverového nastavení; místně v ignorované `.netlify/spotify/`. Do veřejné cache se token nedostává. Obnovování mezi instancemi koordinuje podmíněný zámek v Blobs. Nové propojení a změna serverového nastavení vytvoří nový oddělený záznam.

### 2. Steam

1. Na [stránce Steam Web API key](https://steamcommunity.com/dev/apikey) si vytvoř vlastní klíč; pro doménu uveď `borik-links.netlify.app`. Doména není bezpečnostním omezením jeho použití.
2. V nastavení soukromí Steamu zpřístupni **Herní detaily / Game details** a nezakrývej odehraný čas.
3. Do `.env` doplň `STEAM_API_KEY`. `STEAM_ID=76561198879183063` už odpovídá Steam profilu, na který odkazuje tento web; při použití jiného účtu změň i tuto hodnotu.

Steam klíč není OAuth token omezený jen na GetOwnedGames. Web používá pouze toto čtecí volání, ale samotný uživatelský klíč lze použít i u jiných povolených metod API. Nezpřístupňuje heslo ani automaticky neobchází soukromí, přesto je citlivý a [podmínky Steamu](https://steamcommunity.com/dev/apiterms) požadují důvěrnost. Klíč lze zrušit pomocí **Revoke My Steam Web API Key** na stejné oficiální stránce a případně vytvořit nový; následně aktualizuj `.env`, Netlify a proveď nový deploy. Nikdy nepřenášej heslo, Steam Guard ani cookies.

### 3. Nastavení Netlify a zveřejnění

V projektu na Netlify otevři **Project configuration → Environment variables** a přidej hodnoty z `.env`:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`
- `SPOTIFY_TIME_RANGE` (například `short_term`)
- `STEAM_API_KEY`
- `STEAM_ID`

Proměnné patří pouze do kontextu **Production**, nikoli All contexts / Deploy Previews. Nejmenší preferovaný scope je **Functions**. Na aktuálním tarifu Free však Netlify odmítá granulární scope a používá všechny scopes; současně nepovoluje `is_secret` pro povinný scope `post_processing`. Bez placené změny tedy hodnoty může zobrazit oprávněný správce účtu. Na vyšším tarifu omez scope na Functions a zapni označení tajné hodnoty. Produkční klíče jsou teď pouze v Production, preview deploye jsou vypnuté (`skip_prs: true`), povolená větev je `main` a build logy jsou soukromé. Také dříve existující proměnné Upstash jsou omezené na Production; tato funkce je nepoužívá. [Rozsahy Netlify](https://docs.netlify.com/build/functions/environment-variables/). Přístupové údaje patří do Netlify proměnných, ne do `config.js` nebo `netlify.toml`.

Nahraj změny přes připojený Git repozitář a spusť nový deploy. `netlify.toml` nastaví příkaz `node scripts/build.mjs`, veřejnou složku `dist` a složku funkcí `netlify/functions`. Přetáhnutí samotné HTML složky do Netlify Drop serverové funkce nesestaví; použij propojený repozitář nebo Netlify CLI s buildem.

Po nasazení budou dostupné adresy `/.netlify/functions/top-artists` a `/.netlify/functions/top-games`. Úspěšná odpověď obsahuje jen veřejné názvy, obrázky, odkazy, období a čas aktualizace, u her také hodiny. Kód 503 znamená nedoplněné nastavení nebo nutnost nového propojení Spotify, 502 nedostupnou službu či skryté herní údaje, 429 rate limit s bezpečným Retry-After. Přijímá se jen GET/HEAD bez parametrů; ostatní metody vracejí 405 a query parametry 400. Každá služba funguje nezávisle.

### Obnovování a výpadky

Nejde o živé počítadlo poslechu. Výsledky určuje Spotify vlastním agregovaným žebříčkem. Server má hodinovou cache; CDN dostává jen její **zbývající** životnost, takže se cache nesčítají do dvou hodin. Viditelná stránka ověřuje výsledek každých 15 minut, skrytá karta dotazy nezahajuje. Po návratu se případně obnoví. Změna dostupná v API se při návštěvnosti obvykle projeví do přibližně 75 minut; samotné Spotify může agregované pořadí aktualizovat později. Bez návštěv nejsou plánované úlohy.

Prohlížeč si pamatuje poslední úspěšná data nejvýše 7 dnů (`borik-top-three-v2-steam` / `borik-top-three-v2-spotify`). Při výpadku je označí jako uložená včetně viditelného stáří a přesného času v popisku. Expirace se kontroluje i na otevřené stránce. Bez použitelných dat zobrazí nedostupnost, při prvním načtení načítání. Prázdný žebříček není soukromá knihovna a nenahrazuje se ručními favority. Zablokované úložiště nebrání načítání. Přes `file://` se funkce nevolají a statistiky jsou nedostupné.

Chyby mají krátkou prodlevu opakování, rate limit respektuje Retry-After; frontend nikdy nezrychlí běžné kontroly pod 15 minut. Aktualizace počká, pokud někdo právě ovládá odkaz v seznamu klávesnicí.

### Ochrana přístupových údajů

Skutečný `.env` i `.netlify/` jsou ignorované Gitem. `.env.example` obsahuje jen prázdné předlohy. Build kopíruje pouze HTML, klientský JS/CSS a povolené typy obrázků/fontů; vynechává skryté soubory, symlinky, dokumentaci a source mapy. Navíc v paměti porovnává dostupné přístupové údaje s výstupem a při shodě zastaví publikování, bez vypsání hodnoty. Kontrola shody aktuálních hodnot nemůže odhalit všechny neznámé historické klíče.

Veřejné funkce mají pevné účty a oficiální API adresy, zakazují přesměrování, ověřují ID, názvy, časy, obrázky i rozsah tokenu a neposkytují univerzální proxy. Veřejná cache obsahuje pouze žebříček. Texty se vkládají přes textové DOM API. Hlavičky zakazují vložení do rámu a přístup ke kameře/mikrofonu/poloze, zachovávají fonty, obrázky a Lanyard.

Spotify přístup odvolej v [připojených aplikacích](https://www.spotify.com/account/apps/). Steam klíč zruš na [oficiální stránce klíče](https://steamcommunity.com/dev/apikey). Odebrání přístupu zastaví budoucí načítání; již zveřejněné statistiky mohou být ještě v hodinové CDN cache a v prohlížečích až 7 dnů. Ochrany tohoto propojení nejsou prověřením celého účtu, zařízení nebo infrastruktury.

## Ověření změn

`npm ci` nainstaluje přesně připnuté serverové závislosti, `npm test` ověří serverové funkce a ochranu publikačních souborů bez skutečných účtů. `node --env-file=.env scripts/build.mjs` sestaví veřejnou složku a porovná místní přístupové údaje s výstupem bez jejich vypsání. Netlify načte produkční prostředí automaticky. Pro místní běh funkcí lze použít `netlify dev`; běžný statický server bez funkcí zobrazí jejich nedostupnost.

Veřejné nasazení na [borik-links.netlify.app](https://borik-links.netlify.app/) bylo 6. 11. 2026 ověřeno s oběma skutečnými zdroji. Prošlo 18 Node testů, 90 simulovaných prohlížečových kombinací a 30 produkčních kombinací rozložení. Konkrétní výsledky, ochrany a omezení jsou v aktuální části [AGENTS.md](AGENTS.md). Simulované testy samy nedokazují dostupnost skutečných služeb.
