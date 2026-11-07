# Kontext projektu pro další chaty

Poslední aktualizace: 7. 11. 2026. Tento soubor čti při zahájení práce v projektu. Po podstatných změnách aktualizuj příslušné části, zejména aktuální stav a rozpracované návrhy. Je to mapa projektu; před úpravou ověř skutečný stav dotčeného kódu a `git status`, protože soubory se mohou mezitím změnit.

## Vizuální navázání 6. 11. 2026 — původní nadpisy a zarovnané řádky TOP 3

Uživatel dvěma screenshoty požádal o návrat názvů a sjednocení řádků. Nadpisy jsou opět „Hry“ a „Interpreti / kapely“ z config.js. U čerstvých statistik má nadpis původní spodní linku a odsazení. Zdroj, období a čas zůstávají v title nadpisu. Od navazující úpravy 7. 11. 2026 je při prvním načítání vidět jen stav v řádcích žebříčku. Stavový `<p>` pod nadpisem se vkládá až při selhání dotazu a po úspěšné obnově se odstraní z DOM. Uložené výsledky se při startu drží jako záloha pro případ výpadku.

Na šířkách nad 660 px oba panely používají sdílené CSS subgrid řádky pro nadpis, stav a tři místa. Každá dvojice položek roste podle delšího obsahu a oddělovací linky i obrázky lícují. Nezavádí se pevná výška ani náhradní texty k interpretům. Mobil si ponechává přirozenou výšku panelů pod sebou; bez podpory subgrid je zachované původní rozložení.

Ověření této úpravy: 60 kontrol pěti šířek × tři motivy × běžný/klidný režim nad čerstvými i uloženými výsledky; dalších 30 kontrol dlouhých názvů a výpadku jen jednoho zdroje. Na desktopu mají dvojice všech tří řádků shodnou výšku i svislou pozici s přesností pod 1 px. Bez přetékání a JS výjimek, zachovaný focus a Ctrl+K/Esc, stav bez cache zůstává srozumitelný. Vizuálně prohlédnut desktop i mobil; prošly build, syntaktická kontrola a git diff --check. Kontrola známých tajných hodnot v pracovních/publikačních souborech a historii bez shody. Pomocné testy a screenshoty v %TEMP%/borik-production-qa/.

Po odstranění skrytých prvků prošlo 60 místních kontrol zarovnání a přetékání s dlouhými názvy a částečným výpadkem. Ověřeno načítání, odstranění obou prvků při čerstvých i prázdných výsledcích, návrat hlášky při výpadku, obnova s fokusem a expirace uložených výsledků. Prošel build i 18 Node testů.

Při navazující opravě bylo původní probliknutí zopakováno s uloženými údaji i bez nich. Na pěti šířkách po opravě během zpomaleného načítání nevznikl žádný stavový `<p>`, ani když odpovědi dorazily v různou dobu. Ověřen také částečný výpadek s cache i bez ní a odstranění hlášky po obnově.

## Dokončeno 6. 11. 2026 — skutečné TOP 3 nasazené na Netlify

Tato část má přednost před historickými popisy záložního osobního výběru níže. Uživatel výslovně změnil požadavek: ruční favorité se veřejně nepoužívají při načítání ani výpadku. Z konfigurace byly odstraněny položky obou skupin; zachované panely načítají pouze Steam / Spotify. Obrázky v assets zůstaly archivně, bez náhradních iniciál.

- Frontend ukazuje načítání, skutečné výsledky, prázdný žebříček, uložené statistiky se stářím nebo nedostupnost. Nikdy nedoplňuje chybějící výsledky. Cache v2 má 7 dnů a expiruje i bez reloadu; kontrola po 15 minutách jen při viditelné stránce. Změna seznamu čeká na odchod fokusu.
- Server: GET/HEAD bez query parametrů, 8s upstream timeout, redirect:error, ověřené odpovědi a obrázkové hosty. Steam obsahuje číselné minutes a řadí podle celkového času. CDN má pouze zbývající životnost hodinové cache, ne další hodinu. Selhání má prodlevu a 429 respektuje Retry-After.
- Spotify přijímá přesně user-top-read a Bearer token. Rotovaný refresh token se ukládá před použitím access tokenu do privátního Netlify Blobs, navíc AES-256-GCM; místně do ignorované .netlify/spotify/. Jediná přímá serverová závislost @netlify/blobs je připnutá v package-lock.json. Podmíněný zámek koordinuje refresh mezi instancemi. Odvolaný/neplatný refresh token se deaktivuje i pro další instance; návštěvník se nikdy nepřihlašuje. Změna počátečního nastavení vytvoří nový záznam.
- Build má povolené typy souborů, vynechává skryté soubory, symlinky, dokumentaci a mapy; scripts/check-public.mjs porovnává dostupné tajné hodnoty s veřejným výstupem a při shodě build zastaví bez hodnot ve výpisu. Frontend dál nemá balíčky ani framework.
- Netlify CLI byl přihlášen. Ověřen existující projekt borik-links (6193889f-c200-43b6-b638-0aa87be17fb9), GitHub nacelnik028/borik-links a produkční main. Nastaven build node scripts/build.mjs, publish dist, functions netlify/functions. Všechny přístupové proměnné jsou pouze v Production, preview deploye vypnuté (skip_prs:true), allowed_branches:[main], private_logs:true. I již existující nepoužívané Upstash proměnné byly omezené z All contexts na Production.
- Tarif Netlify Free odmítl Functions-only scope (403: tarif) a is_secret při povinném post_processing scope (422). Bez placené změny tedy hodnoty zůstávají dostupné oprávněným správcům Netlify ve všech scopes **pouze v kontextu Production**. Neslibovat skrytí před vlastníkem účtu nebo Functions-only. Žádný tarif nebyl změněn.
- Uživatel místně doplnil Steam API klíč. Skutečné místní handlery obou služeb vrátily 200 a po třech výsledcích (Spotify short_term, Steam all_time). Hodnoty nebyly vypsané. Veřejné nasazení je dokončené a ověřené: implementace 1002764 byla přes existující GitHub → Netlify propojení publikována 6. 11. 2026 v 19:18 českého času, deploy 6aee19ffa81e221c910359c1. Oba veřejné endpointy vracejí 200 a tři skutečné výsledky; pořadí i položky se shodovaly s přímými oficiálními odpověďmi zachycenými při skutečné místní kontrole. Skutečný vydaný Spotify token měl přesně user-top-read. Žádné nové přihlášení Spotify nebylo potřeba.

Dosavadní ověření: 18 Node testů včetně oprávnění, odmítnutého tokenu bez opakování po restartu, šifrované rotace, zámku, cache bez sčítání, rate limitu, proxy, validace a blokace úniku při buildu. OAuth simulace ověřila state/Host, scope, uložení bez výpisu, reload i opakovaný callback bez výměny kódu. Headless Edge/Python Playwright: 90 kombinací pěti šířek, tří motivů, běžného/klidného CSS a úspěchu/výpadku/dlouhých názvů; také načítání, částečný výpadek, cache/expirace, prázdné/méně výsledků, HTML jako text, odkazy/Enter/opener, focus, obnovování/skrytí, menu a blokované úložiště. Bez přetékání a JS výjimek. Screenshoty desktopu, mobilu a nedostupného stavu vizuálně prohlédnuty. První běh měl systémové omezení pohybu, druhý bez něj. Pomocné skripty a důkazy jsou mimo projekt v %TEMP%/borik-production-qa/.

Kontrola známých aktuálních tajných hodnot před odesláním zahrnula pracovní soubory, 72 blobů dostupné Git historie a 13 veřejných souborů; po implementačním commitu opakována nad 89 bloby. Žádná shoda, žádný sledovaný .env a žádný zakázaný veřejný soubor. Kontrola zahrnula také Netlify přístup a původní Upstash token, bez jejich výpisu. Nejde o záruku odhalení všech neznámých starých tajemství.

Produkční kontrola: 19 citlivých cest včetně alternativních .env cest, Git metadat, místního stavu, helperu, zdrojů serveru, dokumentace a balíčků vrátilo 404 bez kontrolovaných údajů. Oba endpointy mají jen zamýšlené veřejné položky, období a čas; POST 405, query proxy 400, HEAD 200 s prázdným tělem. Skutečná Netlify Durable cache vykázala hit a ubývající TTL; prohlížeč dostává no-store. Veřejné JS/CSS/config se shodují s místním zdrojem po sjednocení CRLF/LF.

Headless Edge nad veřejným webem: 30 kombinací pěti šířek × tři motivy × běžný/klidný režim; všech šest skutečných obrázků se načetlo s cover, bez přetékání a JS/nečekaných konzolových chyb, menu funguje. Skutečný Lanyard načetl online stav a avatar, aktuální poslech ani aktivitu v tu chvíli neukazoval. Lokálně simulovaný výpadek na produkčním frontendu ověřil nezávislost zdrojů, uložené výsledky a nedostupnost po expiraci, bez ručních favoritů. Screenshoty skutečných statistik na desktopu i mobilu a celého mobilu vizuálně prohlédnuty.

Dostupné produkční function logy (3 záznamy) a deploy logy (106 záznamů) byly zkontrolovány v paměti vůči známým tajným hodnotám: žádná shoda ani chybový záznam. Netlify build a sestavení obou funkcí prošly místně i na Netlify. Obnova po 15 minutách a selhání/odvolání/rotace byly cíleně testovány simulací; nečekalo se hodinu na přirozenou expiraci CDN ani šest měsíců na refresh token. Nezaměňovat simulaci s odvoláním skutečného účtu. Uživatel může Spotify odvolat v připojených aplikacích a Steam klíč zrušit/vyměnit na oficiální stránce apikey, podrobnosti v README. Bezpečnost účtů a zařízení jako celku nebyla prověřována.

## Účel a styl

Osobní český web Víta (Boříka), značka `borik.space`: představení, hudba, hry, živý Discord/Spotify stav a odkazy na sociální sítě. Tmavý vzhled, barevné akcenty, polární záře, hvězdy, orbitální dekorace kolem avataru a karty. Texty jsou neformální a osobní. S uživatelem komunikuj česky.

## Technologie a spuštění

- HTML/CSS/vanilla JavaScript bez frontendového frameworku a balíčků; server má @netlify/blobs (npm ci). Automatické TOP 3 mají volitelný backend v Netlify Functions. `node scripts/build.mjs` zkopíruje pouze veřejné soubory do `dist/`; Netlify podle `netlify.toml` publikuje tuto složku a zvlášť sestaví funkce. Potřebuje Node.js 22+. Serverové testy používají vestavěný Node test runner (`node --test tests/top-three.test.mjs`).
- Pro základní náhled otevři `index.html` v prohlížeči. Pro schránku je vhodné HTTPS nebo localhost; při selhání kopírování existuje ruční fallback.
- Uživatel 6. 11. potvrdil hosting Netlify a Spotify Premium; ve formuláři Spotify aplikace uvedl `https://borik-links.netlify.app/`. Propojení s repozitářem a produkční main je nyní ověřené, aktuální nasazení viz výše; vlastnictví domény není ověřené; `borik.space` je značka v HTML. Statický server bez funkcí zobrazí nedostupnost statistik.
- Externí služby: Google Fonts (DM Sans, Space Grotesk), Lanyard WebSocket, Spotify Web API, Steam Web API a obrázky z Discord CDN / služby pro ikony aplikací, obaly Spotify.
- Soubory čti a zapisuj jako UTF-8. Ve Windows PowerShell použij u `Get-Content` explicitně `-Encoding UTF8`, jinak může být český text v terminálu zkomolený.

## Mapa souborů a vazby

| Soubor | Odpovědnost |
| --- | --- |
| `README.md` | Návod pro vlastníka: úpravy konfigurace, ovládání a omezení živých údajů. |
| `index.html` | Struktura, výchozí texty, inline SVG, sociální odkazy, dialog rychlého menu a prvky pro JS. |
| `config.js` | `window.SITE_CONFIG`: osobní texty, datum narození, přezdívky, zájmy, zdroje top 3, Discord a výchozí motiv. |
| `css/style.css` | Kompletní vzhled, tři motivy, animace a responzivita. |
| `js/app.js` | Vykreslení bia a zájmů, věk, psaní jmen, motivy, schránka, dialog, čas a klidný režim. |
| `js/top-three.js` | Karty skutečných statistik, načítání, uložené výsledky a nedostupnost. |
| `netlify/functions/top-artists.mjs`, `top-games.mjs` | Samostatné endpointy Spotify a Steamu. |
| `netlify/lib/response.mjs` | Timeouty, bezpečné chybové odpovědi a cache funkcí. |
| `netlify.toml`, `scripts/build.mjs` | Netlify build a oddělení veřejných souborů od serverového kódu a tajných hodnot. |
| `scripts/connect-spotify.mjs`, `.env.example` | Místní propojení Spotify a předloha nastavení. Skutečný `.env` je ignorovaný Gitem. |
| `tests/top-three.test.mjs` | Serverové testy se simulovanými odpověďmi API. |
| `js/presence.js` | Discord avatar/stav, poslední online, herní aktivita a Spotify přes Lanyard. |
| `js/effects.js` | Canvas hvězdy, padající hvězdy, vlastní kurzor a reakce záře na myš. |

Skripty se načítají přes `defer` v pořadí config → app → top-three → presence → effects. `app.js` poskytuje ostatním `window.siteStorage`, `window.siteCalm` a událost `motionchange`. Zachovej potřebné ID elementů při změně HTML, nebo současně uprav jejich použití v JS.

## Obsah a rozložení

1. Horní lišta: značka, O mně, Odkazy, rychlé menu.
2. Hero: psaný nadpis, krátké „Hudba, hry a něco o mně.“, tlačítka a klikatelný Discord avatar s orbitální dekorací; cíl profilu se odvozuje z `SITE_CONFIG.discordId`.
3. `#about`: bio vlevo, Spotify a aktuální aktivita v pravém sloupci. Sloupce jsou zarovnané nahoru a mají přirozenou výšku podle obsahu, bio se nenatahuje podle živých panelů.
4. `#top-three`: „Moje top 3“, panely Hry a Interpreti / kapely vedle sebe, na mobilu pod sebou.
5. `#links`: Instagram, GitHub, Steam, Discord, Spotify, TikTok.
6. Volba motivu a patička s klidným režimem.

Dvě skupiny `topThree` mají `title`, `category` a povinný známý `source` (`steam` / `spotify`). Pořadí a obsah vrací server. Zobrazují se nejvýše tři skutečné položky; při prázdném výsledku stav bez žebříčku, při chybě použitelná cache nebo nedostupnost. Původní ruční favorité nejsou veřejná záloha. Obrázky se ověřují pro oficiální CDN a používají cover, bez iniciál.

Bio podporuje `**zvýraznění**`, `{age}` a odstavce oddělené prázdným řádkem, nikoli vlastní HTML. Texty statistik se vkládají přes textové DOM API. Sociální URL jsou přímo v index.html a neodvozují se z konfigurace.

## Ovládání a živá data

- Motivy: `violet`, `aurora`, `sunset`; uložená volba přebíjí `defaultTheme`.
- LocalStorage klíče: `borik-theme`, `borik-calm`, `_lo` (čas posledního online stavu zaznamenaného tímto prohlížečem), `borik-top-three-v2-steam` a `borik-top-three-v2-spotify` (nejvýše 7 dnů starý poslední výsledek statistik). Přístup k úložišti je ošetřen pro případ blokování.
- Ctrl+K / Cmd+K přepíná nativní dialog, Esc jej zavře. Dialog nabízí kotvy, kopírování Discordu a změnu motivu.
- Čas se zobrazuje pro `Europe/Prague`; věk se počítá z narozenin v konfiguraci podle data prohlížeče.
- Klidný režim i `prefers-reduced-motion` omezují pohyb. Systémové omezení pohybu nelze tlačítkem přebít. Animace reagují na skrytí karty, vlastní kurzor na jemný ukazatel.
- Lanyard: `wss://api.lanyard.rest/socket`, odběr podle `discordId`, heartbeat, timeout 12 s a opakování spojení s prodlevou rostoucí od 3 do 30 s.
- Rozlišují se načítání, neaktivita a nedostupnost služby. „Naposledy online“ není úplná historie Discordu. Spotify progress běží po sekundě; živá data vyžadují internet a profil dostupný přes Lanyard.
- Obal, název skladby a „Otevřít ve Spotify“ sdílejí cíl `https://open.spotify.com/track/{track_id}`. `updateSpotifyLinks` přijímá ID jako řetězec 22 alfanumerických znaků; při chybějícím/neplatném ID odebere všem třem prvkům `href` i přístupný název odkazu a skryje pouze „Otevřít ve Spotify“. Obal a název zůstávají viditelné, bez role odkazu a bez zastávky Tab. Při neaktivitě nebo výpadku se cíle také vymažou. Avatar i všechny tři Spotify odkazy otevírají novou kartu přes `target="_blank" rel="noopener noreferrer"`.

## Historie původní implementace TOP 3 z 6. 11. 2026 — překonaná aktuální částí výše

Pracovní strom byl před úpravou čistý. Uživatel chce pořadí z poslechu a herních statistik, potvrdil Premium a Netlify. Výchozí návrh z konverzace: Spotify přibližně za 4 týdny a Steam podle celkových hodin. Původní karty a jejich osobní obsah zůstávají jako záloha, označená „Osobní výběr“; není vydávána za statistiky. Vzhled rozšířen jen o zdroj/období pod nadpisem, u her hodiny v popisu.

- `/.netlify/functions/top-artists`: refresh Spotify access tokenu na serveru, `GET /v1/me/top/artists?limit=3&time_range=…`, pořadí podle Spotify, bez přesných počtů přehrání. Proměnné `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, volitelně `SPOTIFY_TIME_RANGE` (`short_term`, `medium_term`, `long_term`). Veřejná odpověď obsahuje jen položky, zdroj, období a čas načtení.
- `/.netlify/functions/top-games`: Steam GetOwnedGames, včetně hraných free-to-play her, řazení sestupně podle `playtime_forever`, první tři hry s nenulovým časem. Proměnné `STEAM_API_KEY`, `STEAM_ID`; ID z existujícího odkazu je `76561198879183063`. Herní detaily a čas musí být přístupné; soukromá knihovna se neinterpretuje jako prázdná. Hodiny mají české formátování. Obrázek je ikona z API, bez ní nebo při chybě načtení nejsou žádné náhradní iniciály.
- Oba zdroje selhávají nezávisle. HTTP 503 = nedoplněné nastavení, 502 = nedostupnost/neplatný přístup/skryté údaje. Chybové odpovědi neposílají upstream tělo, URL s klíčem ani interní výjimky. Upstream timeout 8 s, frontend 20 s. Hodinová cache v instanci funkce a Netlify CDN, sdílený souběžný dotaz. Kombinace cache může odložit novější data až přibližně o dvě hodiny; není to plánovaná úloha a bez návštěv se nic nenačítá.
- Viditelná stránka kontroluje výsledky po 15 minutách. Při chybě ponechá poslední výsledek stejného zdroje v prohlížeči do stáří 7 dnů s označením „uložené údaje“, jinak osobní výběr. Odpovědi i uložené údaje se validují, neplatné cíle odkazů se odmítají. Méně než tři skutečné výsledky se nedoplňují osobními favority. Aktualizace počká, pokud je focus uvnitř seznamu, a provede se po jeho opuštění. `file://` nespouští požadavky na funkce.
- `scripts/connect-spotify.mjs` načte přístupové údaje z ignorovaného `.env` a spustí místní callback `http://127.0.0.1:8888/callback` (stejný URI musí být v nastavení Spotify aplikace). Žádá pouze `user-top-read`, kontroluje náhodný OAuth state i Host a má pětiminutový limit. Token zapíše do `.env`, nevypisuje jej. Podle aktuální dokumentace Spotify refresh token vyprší po 6 měsících; propojení je pak potřeba zopakovat a aktualizovat v Netlify.
- `scripts/build.mjs` publikuje pouze `index.html`, `config.js`, `css/`, `js/`, `assets/` do ignorované `dist/`. Funkce, pomocné skripty, testy, `.env` ani dokumentace se veřejně nekopírují. Serverové údaje se nastavují v Netlify Environment variables se scope Functions; úplný postup je v README. Funguje nasazení z repozitáře/CLI, samotný Netlify Drop nestačí pro sestavení funkcí.

Ověření: 7 testů Node runneru (obnova tokenu a oprávnění, tři položky a období, řazení hodin a filtrace, veřejná/prázdná/soukromá knihovna, chybové odpovědi bez tajných hodnot, nezávislé zdroje, sdílení souběžných požadavků, cache a HTTP metody). Headless Edge/Python Playwright na localhostu nad sestavenou `dist/`: 1440/850/660/390/360 px × tři motivy × běžný/klidný vzhled × dostupné/nedostupné/dlouhé názvy (90 kombinací), bez přetékání. Dále uložené/poškozené/staré údaje, výpadek jen jednoho zdroje, neplatné odkazy, HTML v názvu jako prostý text, prázdné výsledky, blokované úložiště, Tab, Enter s novou kartou a nulovým openerem, Ctrl+K/Esc a zachování fokusu při opožděné odpovědi. Bez JS výjimek. Vizuálně prohlédnut desktop i mobil s načtenými daty a mobil se záložním výběrem. Místní OAuth pomocník ověřen simulovaným token endpointem: rozsah oprávnění, platný callback, odmítnutí cizího state/Hostu, zápis tokenu pouze do souboru i odmítnutí přihlášení. Prošly build, syntaktické kontroly a `git diff --check`.

Původní kontroly použily simulované odpovědi; navazující skutečné ověření Spotify je uvedené níže. Steam není nakonfigurovaný a běh funkcí na Netlify není ověřený ani nasazený. Následuje Steam API klíč a doplnění proměnných na Netlify. Simulované testy nepovažovat za ověření skutečných statistik. Kontrolní skripty a screenshoty jsou mimo projekt v `%TEMP%/borik-netlify-qa/`.

### Navazující kontrola ochrany Spotify 6. 11. 2026

Uživatel vytvořil Spotify aplikaci a doplnil lokální Client ID/Secret; požádal o kontrolu, že veřejný web neumožní přihlášení do jeho Spotify. Hodnoty tajných údajů se při kontrole nevypisovaly. `.env` není sledovaný Gitem a je ignorovaný. Aktuální tajný klíč nebyl nalezen v neignorovaných souborech, textové historii repozitáře ani ve 14 veřejných souborech `dist/`. Živý Netlify web vracel 404 pro `/.env`, `/.env.production`, `/netlify/functions/top-artists.mjs` i pro dosud nenasazený endpoint `/.netlify/functions/top-artists`; těla odpovědí neobsahovala kontrolované přístupové údaje.

Zpřísněna kontrola oprávnění: místní helper a serverová obnova přijmou pouze přesný rozsah `user-top-read`, širší nebo chybějící rozsah odmítnou. Přidán regresní test proti tokenu s právem ovládat přehrávání či upravovat playlisty; serverový soubor má nyní 8 procházejících testů. Ověřeny také původní OAuth kontroly state, Host a nevypisování tokenu. Scope je pouze na čtení žebříčků, heslo není součástí projektu; nelze slibovat absolutní bezpečnost účtu nebo zaměňovat tuto kontrolu za prověření celé infrastruktury. Přihlašovací callback se spouští jen na loopback adrese a pouze pro jednorázové propojení vlastníka, na veřejném webu žádné přihlašovací rozhraní není. Po nasazení je potřeba znovu ověřit skutečné nasazení a Netlify proměnné.

### Dokončené místní propojení Spotify 6. 11. 2026

Uživatel dokončil skutečný souhlas Spotify. Původní helper skončil úspěšně a uložil refresh token do ignorovaného `.env`. Následný obrázek `ERR_CONNECTION_REFUSED` neznamenal neúspěšné propojení: callback už neběžel po dokončení. Skutečný serverový handler pak přes nový access token načetl HTTP 200, ověřil přesné oprávnění `user-top-read` a obdržel tři interprety pro `short_term`. Hodnoty tokenů se nevypisovaly. Opakovaná kontrola zahrnující i uložený refresh token nenašla jeho ani Client Secret v neignorovaných souborech, textové historii repozitáře nebo veřejné složce. Živý Netlify endpoint stále vrací 404, přenesení proměnných a nasazení teprve následuje; `STEAM_API_KEY` zůstává prázdné.

Pro další přihlášení upraveno dokončení helperu: po uložení tokenu HTTP 303 na kořenovou potvrzovací stránku bez jednorázového kódu; dvě minuty umožňuje reload i opakovaný callback, aniž znovu mění kód za token, poté se vypne. Potvrzení výslovně uvádí dočasnost stránky. Doplněno bezpečné odmítnutí neplatné URL požadavku. Místní simulovaný OAuth test ověřuje úspěch, reload, opakovaný callback, cizí state/Host, odmítnutí souhlasu a odmítnutí širšího oprávnění; token zůstává jen ve fixture souboru, ne v odpovědích a výstupech.

## Klikatelné živé údaje a rozložení 23. 10. 2026

Realizovány tři požadované úpravy v HTML, CSS a `presence.js`. Při prvním čtení byly AGENTS.md a presence.js necommitnuté; po přerušení a pokračování už byl pracovní strom čistý a opravy byly v commitu `81c56f8`. Všechny předchozí opravy jsou zachované.

- `#discord-profile` obaluje původní avatar včetně iniciály a stavové tečky. Odkaz se nastavuje z konfigurace při inicializaci, nezávisle na dostupnosti Lanyardu. Má český přístupný název, původní jemný hover a 3px focus v barvě motivu; orbity a popisek stavu zůstávají.
- `#sp-art-link` a `#sp-song` jsou stabilní elementy, které získávají/pozbývají `href` podle aktuální skladby. Při změně platné skladby se zachovává focus a aktualizují se cíle i přístupné názvy všech tří odkazů. Obal má samostatný 63px wrapper, název se dál zkracuje výpustkou. Hover a 2px focus jsou viditelné. Progress, animace a všechny stavy panelů zůstávají.
- `.bento-grid` používá `align-items: start`, `.live-column` dvě automaticky vysoké řádky. Bio už nepřebírá výšku pravého sloupce; při kontrolním aktivním stavu na 1440 px se zkrátilo přibližně o 100 px bez změny obsahu. Hero má na desktopu menší spodní odsazení (26 px) a nemá pevnou minimální výšku; odstraněna i vyšší výšková výjimka pro tablet. Mobilní hero a pořadí panelů pod sebou zůstávají.

Ověření: headless Microsoft Edge přes Python Playwright na localhostu, 1440/850/660/390/360 px × Violet/Aurora/Sunset × běžný/klidný režim. Aktivní, neaktivní, nedostupné a kombinované stavy panelů, dlouhé názvy včetně textu bez mezer; bez přetékání, překryvů či chyb JS/konzole. Výška bia se nemění podle stavu pravého sloupce. Ověřeny přístupné názvy, viditelný focus, pořadí Tab, Enter i kliknutí na avatar a všechny tři Spotify odkazy: cíle nové karty a nulový `window.opener` (externí cílová stránka při tomto testu nahrazena testovací odpovědí). Změna konfigurace Discord ID mění cíl avataru. Simulovaným WebSocketem ověřeny přechody skladeb i se zaměřeným názvem, platné → chybějící/neplatné ID, neaktivita, výpadek a obnova; žádný starý cíl ani nechtěná zastávka Tab. Obal a název bez platného ID zůstávají viditelné.

Dále prošly kontroly progressu, animací, systémového omezení pohybu, skrytí/obnovení dokumentu, menu a klávesnice, schránky, preferencí a mobilního dotyku. Regrese potvrdily odstranění/opakované načtení avataru, ochranu před starou chybou obrázku aktivity, poslední online, reconnect/heartbeat/timeout i blokované úložiště. Skutečné spojení Lanyard načetlo online stav, avatar a Visual Studio Code; skutečný Spotify poslech v době kontroly neběžel, jeho přechody byly simulované. Vizuálně prohlédnuty screenshoty desktopu, tabletu, mobilu, nedostupných panelů a detaily focusu avataru/obalu/názvu. Prošly kontroly ID, kotev, lokálních souborů, `node --check` a `git diff --check`. Pomocné skripty, výsledky a screenshoty jsou mimo projekt v `%TEMP%/borik-links-qa/`.

## Kontrola projektu a opravy živého stavu 23. 10. 2026

Prohlédnuty všechny zdrojové soubory a ověřeno chování v prohlížeči. Pracovní strom byl před kontrolou čistý. V `js/presence.js` opraveny tři reprodukované chyby:

- Čas posledního online stavu se při trvajícím online spojení obnovuje i každou minutu a při změně viditelnosti stránky. Při přímém přechodu online / nečinný / nerušit → offline se uloží okamžik přechodu; dříve se zobrazovala doba od poslední změny aktivity (například „před 2 h“ ihned po odpojení). Výpadek spojení ani první offline údaj po novém připojení si nevymýšlí novější online čas. Neznámý Discord stav se sjednotí na offline i pro tento výpočet.
- Odstranění Discord avataru vrátí iniciálu a vymaže starý obrázek. Při změně obrázku se do načtení zobrazí fallback; po neúspěšném načtení další aktualizace umožní opakovat i stejnou URL.
- Opožděná chyba obrázku předchozí aktivity už nesmaže obrázek nové aktivity ani jej nepřepíše starou náhradní ikonou. Fallback se použije pouze u obrázku, který právě patří do panelu.

Ověření: headless Microsoft Edge přes Python Playwright na localhostu. Pět šířek 1440/850/660/390/360 px, všechny tři motivy, běžný i klidný režim, aktivní/neaktivní/nedostupné panely, dlouhé názvy a šest obrázků favoritů bez přetékání. Ověřeny odkazy favoritů a Enter, hover/focus, Ctrl+K / Cmd+K / Esc, návrat fokusu, kotvy, skutečná schránka i ruční fallback, uložení preferencí, dotykové menu, Spotify progress a animace, systémové omezení pohybu a simulované skrytí stránky. Cílené regresní testy ověřily všechny tři opravy, opakované načtení chybného avataru, průběh času včetně výpadku a návratu spojení, neznámý stav a blokované localStorage. Simulovaným WebSocketem ověřeno přihlášení odběru, heartbeat, 12s timeout, rostoucí prodlevy obnovení a jejich reset po přijetí dat, ignorování neplatného JSON. Skutečný Lanyard načetl online stav, avatar, Visual Studio Code a aktivní Spotify poslech. Vizuálně prohlédnuty screenshoty desktopu a mobilu. Bez chyb JS/konzole v hlavní kontrole i při skutečném spojení; cílené regrese bez chyb JS. Staticky ověřeny unikátní ID, kotvy a existence lokálních skriptů/stylů; prošlo `node --check` všech pěti JS souborů a `git diff --check`. Pomocné skripty, výsledky a screenshoty jsou mimo projekt v `%TEMP%/borik-audit-qa/`.

## Doladění 21. 10. 2026: aktivita, čitelnost a odkazy

Druhá úprava 21. 10. 2026 podle konkrétních šesti bodů uživatele. Předchozí necommitnuté změny v AGENTS.md, config.js, CSS, HTML, app.js a presence.js byly zkontrolovány a zachovány.

- Nadpis střídá pouze `Vít`, `Bořík`, `nacelnik028`. `.name-line` rezervuje výšku přes `--name-size` a `height`, nezávisle na menším písmu `.long-name`; nepřidávat zpět různé výšky v `em`, které při přepnutí velikosti textu posouvají okolí.
- Z bia odstraněna pouze věta „Rád dělám nejrůznější věci, které mě baví.“ a závěr nahrazen požadovaným „Jsem přátelský a společenský člověk, rád se učím nové věci. Ale taky jsem docela líný.“. Ostatní osobní texty zůstaly.
- Discord `type: 0` sám o sobě nerozlišuje hru a aplikaci. `knownActivityKinds` v `presence.js` používá přesné známé názvy: Visual Studio Code → „Právě používám“, Kingdom Come: Deliverance II / Cyberpunk 2077 / RimWorld → „Právě hraju“. Neznámé názvy a typy → „Právě běží“, bez odhadování podle částí názvu, obrázků nebo chybějícího ID. Jde o malý explicitní seznam, nikoli obecný katalog aplikací. Streamování, sledování a soutěžení mají vlastní text. Náhradní ikona je počítač pro aplikaci, ovladač pro hru, neutrální symbol pro nerozpoznanou aktivitu.
- `.activity-panel.is-active` se přepíná podle aktivity a při výpadku se odstraní. Spotify nadále používá `.is-playing`. Do 660 px panely nemají pevnou minimální výšku; neaktivní/načítané/nedostupné stavy mají padding 18 × 20 px a menší dekorativní ikony. U neaktivního Spotify se na mobilu skryje neanimovaná spodní vlna. Aktivní panely mají padding 22 × 20 px, větší odstup pod nadpisem a přirozenou výšku podle obsahu. Aktivní zvuková vlna, equalizer a tečky zůstaly funkční.
- Drobné obsahové texty (sociální přezdívky, zájmy, čas, živé stavy, popisy a odkazy) mají nejméně 12 px i na mobilu. `--muted` je nyní `#b0aebb`, sociální popisky a čas ji používají místo samostatných tmavších šedých. Zájmy se mohou zalomit a spodní řádek bia má `flex-wrap`. Menší zůstávají jen dekorativní čísla pořadí či klávesové značky.
- Všech šest favoritů je odkazem přes existující `url` v konfiguraci. Renderer zobrazuje „Steam ↗“ / „Spotify ↗“ podle hostname; pro jiný HTTP(S) cíl „Otevřít ↗“. Celý řádek má hover pozadí a podtržení názvu, klávesnicový focus má navíc 2px outline. Obrázky zůstaly 48 × 48 px s `cover`, popisy jsou prázdné. URL ověřeny otevřením příslušných stránek Steamu/Spotify, viz `assets/favorites/SOURCES.md`.

Ověření druhé úpravy 21. 10. 2026: headless Microsoft Edge / Python Playwright na localhostu, 1440/850/660/390/360 px, všechny tři motivy a běžný i klidný režim. V každé kombinaci kontrolován aktivní, neaktivní i nedostupný stav, bez přetékání; panely se nepřekrývají a aktivní Spotify obsah zůstává uvnitř panelu. Neaktivní mobilní panely jsou pod původními 195 px. Ověřeny dlouhé názvy, minimální 12px obsahové texty, načtení a 48px `cover` všech obrázků, všech šest URL, hover, klávesnicový focus a Enter na favoritovi (cíl nového okna ověřen s testovací odpovědí, nezávisle na externím přihlášení). Skutečná animace nadpisu sledována 16 sekund na každé šířce: všechna tři jména se vystřídala, nulový posun textu/tlačítek/avataru/sekce pod hero, bez přetékání nejdelší přezdívky. Screenshoty desktopu, tabletu, mobilu, nedostupného stavu a nejdelší přezdívky vizuálně prohlédnuty.

Simulovaným WebSocketem ověřeno rozlišení všech čtyř známých názvů, neznámého názvu i podobného názvu „Visual Studio Code clone“, neznámého typu, streamování/sledování/soutěžení. Dále animace vlny/equalizeru/teček, Spotify čas a odkaz, přechody do neaktivity a výpadku, Discord stavy a poslední online, ruční/systémové omezení pohybu i simulované skrytí dokumentu. Ověřeny Ctrl+K / Cmd+K / Esc, návrat a viditelnost fokusu, kotvy, menu na dotyku, skutečná schránka z hero/menu i fallback, uložení motivu a klidného režimu. Skutečné spojení Lanyard načetlo avatar, online stav a Visual Studio Code s textem „Právě používám“; skutečný poslech Spotify při kontrole neprobíhal. Bez chyb JS/konzole. Prošlo `node --check` změněných JS a `git diff --check`. Pomocné skripty, výsledky a screenshoty jsou mimo projekt v `%TEMP%/borik-refine-qa/`.

## Předchozí úprava: osobnější texty a jasnější hierarchie

Úprava 21. 10. 2026: cílené zjednodušení doprovodných textů a dekorací, nikoli kompletní redesign. Pracovní strom byl před úpravou čistý.

- Odstraněny slogany „Vlastní tempo. Vlastní soundtrack.“, „Tvůj vibe. Tvoje barvy.“ a obdobné texty v patičce, rychlém menu, sociálních odkazech a živých panelech. Úvodní věta v `config.js`, HTML a meta popisu nyní zní „Hudba, hry a něco o mně.“. Vlastní bio, přezdívky, zájmy a favorité v této první úpravě zůstaly beze změny; pozdější výslovné úpravy jsou popsané výše. Nevymýšlet osobní postoje ani důvody obliby.
- Sekce a odkazy v rychlém menu nemají dekorativní číslování. Zmizely opakované doplňkové popisky sekcí, uvítací štítek, „OSOBNÍ SOUBOR“, texty kolem avataru a hvězdičky u textových nadpisů. Čísla pořadí v top 3 zůstávají. Polární záře, hvězdné pozadí, orbity, dvě drobné ozdoby u avataru i vlastní kurzor zůstaly.
- Bio začíná přímo osobním textem, má 14px písmo a vyšší kontrast. Nadpisy sekcí mají 20 px / na mobilu 18 px. Hero má menší svislé odsazení. Bio článek je přístupně pojmenovaný přes `about-heading`; kotva `#about` zůstala.
- Spotify má nadpis „Co poslouchám“, druhý panel „Aktivita na Discordu“. Načítání, prázdný stav a výpadek mají věcné a odlišné texty. Prázdná aktivita neprohlašuje, že uživatel nic nehraje: pouze že Discord nic neukazuje. Změny JS se v této první úpravě omezily na texty; následné rozlišení aktivity a mobilních stavů je popsané výše.
- Sociální karty ukazují přezdívky z existujících odkazů nebo typ profilu. Volba „Barvy webu“ je jednodušší řádek s horní linkou. Rychlé menu má přímý název bez sloganu. Odstraněno související nepoužívané CSS.
- Kompaktní favorité a jejich šest lokálních obrázků 48 × 48 px s `object-fit: cover` zůstávají beze změn. Nevracet marketingové slogany ani dekorativní štítky pouze pro zaplnění místa.

Ověření 21. 10. 2026: headless Microsoft Edge přes Python Playwright na localhostu. Šířky 1440/850/660/390/360 px ve všech třech motivech, v běžném i klidném režimu, s aktivními i neaktivními panely bez vodorovného přetékání. Samostatně dlouhé názvy favoritů, skladeb, interpretů a aktivity, načtení všech šesti obrázků a jejich rozměry/ořez. Vizuálně prohlédnuty screenshoty desktopu, tabletu a mobilu v motivech Violet, Aurora a Sunset, mobilního menu a nedostupných panelů. Ověřeno Ctrl+K / Cmd+K / Esc, klávesnicový průchod dialogem bez zaměření obsahu pod ním, návrat a viditelnost fokusu, kotva z menu, změna motivu, skutečný zápis/čtení schránky z hero i menu a ruční fallback při odmítnutí schránky, uložení motivu a klidného režimu po reloadu, ovládání menu dotykem. Simulovanými daty ověřeno aktivní Spotify, postup času, odkaz, skutečná změna transformací zvukové vlny/equalizeru/teček aktivity, přechody do neaktivity a výpadku, všechny Discord stavy a poslední online. Ověřeno ruční i systémové omezení animací a simulované skrytí/obnovení dokumentu. Skutečný Lanyard načetl avatar, nečinný Discord stav a aktivitu Visual Studio Code; skutečný aktivní poslech Spotify při kontrole dostupný nebyl. Bez chyb JS a konzole. Prošlo `node --check` pro `config.js`, `js/app.js`, `js/presence.js` a `git diff --check`. Dočasné kontrolní skripty a screenshoty jsou mimo projekt v `%TEMP%/borik-personal-qa/`; automatický runner do projektu nebyl přidán.

## Kompaktní favorité

Na žádost uživatele bylo 19. 10. 2026 realizováno zhutnění sekce Moje top 3:

- Hry a Interpreti / kapely jsou dva panely vedle sebe; do 660 px se skládají pod sebe.
- Každý panel obsahuje tři řádky s drobným číslem a názvem, oddělené linkami. První místo má číslo v barvě motivu.
- Velké dekorativní plochy byly odstraněny. Řádky mají minimální výšku 64 px a rostou podle obsahu; s obrázky 48 px a svislým odsazením mají nejméně 72 px.
- Opakovaný štítek kategorie se nezobrazuje u každé položky; vlastní kategorie odlišná od skupiny se zobrazí. Volitelné popisy, odkazy a placeholdery zůstávají podporované.
- Odstup před favority a odkazy je 32 px místo 42 px.
- Změny jsou v `css/style.css` a `js/top-three.js`. Třídu `.panel` má celá skupina, jednotlivé řádky používají `.favorite-card`. Grid dvou panelů řídí `#top-three-groups`.

## Vizuální doladění

Kurzor (19. 10. 2026): tečka 4 px, tenký kroužek 22 px, při hoveru odkazu nebo aktivního tlačítka 32 px s průhlednou výplní motivu. Levé tlačítko kroužek stáhne na 72 %. Sledování myši je rychlejší (časová konstanta 35 ms); částice i jejich CSS byly odstraněny. Vlastní kurzor se zobrazí až po pohybu jemného ukazatele (`cursor-visible`), při návratu hned skočí na správné místo. Odchod, blur, pointercancel, skrytí karty a klidný režim resetují stav. Dotyk ho neaktivuje. Otevřený dialog používá nativní kurzor a vlastní tečku/kroužek skrývá. Ověřeno v Edge: pohyb, hover, stisk/uvolnění/zrušení, odchod/návrat, blur, dialog, oba režimy omezeného pohybu, tři motivy a emulované dotykové zařízení; bez chyb JS. Screenshot vizuálně zkontrolován.

Aktuální preference uživatele: všechny obrázky favoritů mají vyplňovat celý rámeček bez pruhů. Z položek v `config.js` byly odstraněny výjimky `imageFit: 'contain'`, takže všechny používají `object-fit: cover` s ořezem okrajů. Podpora volitelného `contain` v rendereru zůstává, ale aktuálně se nepoužívá.

Další úprava 19. 10. 2026 na základě uživatelova zadání „udělej to, co uznáš za vhodné“:

- Favorité mají skutečné obaly her a fotografie interpretů v rámečku 48 × 48 px. Původní automatické iniciály uživatel odmítl; nevracet je ani jako fallback. `js/top-three.js` čte volitelné `image` a `imageFit` z konfigurace. `imageFit: 'contain'` zachovává celý obal nebo skupinovou fotku; výchozí `cover` ořezává portréty do čtverce. Bez obrázku nebo při chybě načtení zůstává jen číslo a obsah. Obrázky se načítají líně, mají pevné rozměry a prázdný alt, protože jméno je hned vedle.
- Mobilní hero do 660 px má avatar 120 px, orbitální část 220 px a menší odstupy. Dekorativní popisky kolem avataru se tehdy na mobilu skrývaly; od 21. 10. jsou odstraněné i na desktopu. Na šířce 390 px se úvod při úpravě 19. 10. v klidném režimu zkrátil přibližně o 83 px.
- Doplňkové popisky sekcí a avataru byly přeloženy do češtiny. Při úpravě 21. 10. byly nadbytečné popisky odstraněny, údaj Česko pod biem zůstává. Osobní obsah konfigurace zůstává zachovaný.
- Spotify panel při poslechu dostává `.is-playing`: jemné zelené pozadí, rámeček, záři u obalu a výraznější spodní zvukovou vlnu. `js/presence.js` třídu přepíná podle dat Spotify a odstraňuje při nedostupnosti spojení. Obal má pevnou šířku i při dlouhém názvu.

Ověření doladění: headless Edge/Playwright na šířkách 1440, 850, 660, 390 a 360 px ve všech motivech bez přetékání; vizuálně prohlédnuty screenshoty mobilní stránky, favoritů a aktivního Spotify. Ověřeny dlouhé texty, placeholdery, focus, rychlé menu, omezený i běžný pohyb. Pomocí simulovaného WebSocketu ověřeny přechody Spotify poslech → neaktivita a poslech → odpojení. Skutečné spojení s Lanyardem se tímto netestovalo. Bez chyb JavaScriptu; syntaktická kontrola obou změněných JS souborů prošla.

## Ověřování změn

Animace živých panelů (19. 10. 2026): spodní `.sound-wave` obsahuje 48 dekorativních sloupků vytvořených jednou v `js/presence.js`; CSS mění jejich výšku přes `scaleY` s různými délkami a posuny animace jen při `.music-panel.is-playing`. Jde o dekoraci, nikoli analýzu skutečného zvuku (Lanyard zvuk neposkytuje). Malý `.equalizer` Spotify je zelený a animuje sloupky od spodní hrany. Herní aktivita má samostatný `.activity-pulse`: tři postupně pulzující tečky v barvě motivu. V klidném režimu a při systémovém omezení pohybu jsou statické. `presence.js` přepíná na HTML `.presence-paused` podle `document.hidden`; pauzovací CSS musí mít vyšší specificitu než pravidla `.is-playing` s animation shorthand. Ověřeno přes simulovaný WebSocket: skutečná změna transformace v čase, odlišná barva a animace indikátorů, neaktivita/odpojení, skrytí a obnovení karty, ruční i systémové omezení pohybu a pět šířek ve třech motivech. Bez chyb JS a přetékání; prohlédnut screenshot obou aktivních panelů.

Obrázky favoritů byly doplněny 19. 10. 2026: šest lokálních JPEG v `assets/favorites/`, zdroje v `assets/favorites/SOURCES.md` (Steam, Spotify, oficiální SoundCloud Bohnes a Hopeless Records). Opravena původní chybná podoba jména na Connor Kauffman podle jeho Spotify profilu. Ověřeno načtení všech šesti souborů v Edge, screenshot desktopu a mobilu, šířky 1440/850/660/390/360 px ve všech motivech, dlouhý text, klávesnicový focus, placeholdery a chybějící soubor. Bez vodorovného přetékání a chyb JavaScriptu. Prošla syntaktická kontrola `config.js` a `js/top-three.js`.

Před změnami zkontroluj pracovní strom a zachovej cizí úpravy. Pro úpravy layoutu ověř desktop i šířky přibližně 850, 660, 390 a 360 px, dlouhé názvy, přetékání, všechny motivy a klidný režim. Při zásahu do JS ověř konzoli, ovládání klávesnicí a dotčené funkce. U živých karet ověř dostupný i nedostupný stav, pokud to prostředí umožňuje. Nevydávej kontrolu zdrojů za test v prohlížeči.

Ověření realizace: headless Microsoft Edge přes Python Playwright, šířky 1440, 850, 660, 390 a 360 px, všechny tři motivy bez vodorovného přetékání. Zkontrolovány screenshoty desktopu a mobilu, reduced motion, otevření/zavření menu klávesnicí, dlouhé názvy a popisy, vlastní kategorie, platný i zakázaný protokol odkazu, focus odkazu a prázdná položka. Bez chyb JavaScriptu. Prošel `node --check js/top-three.js` a `git diff --check`. Dostupný živý stav Lanyardu nebyl tímto testem ověřován.
