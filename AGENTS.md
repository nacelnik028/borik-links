# Kontext projektu pro další chaty

Poslední aktualizace: 15. 11. 2026. Tento soubor čti při zahájení práce v projektu. Po podstatných změnách aktualizuj příslušné části, zejména aktuální stav a rozpracované návrhy. Je to mapa projektu; před úpravou ověř skutečný stav dotčeného kódu a `git status`, protože soubory se mohou mezitím změnit.

## Druhé kolo observatoře — 15. 11. 2026

Pravidlo od uživatele: hotové změny vždy commitnout a hned pushnout přímo na `main` (produkce na Netlify), bez samostatné větve.

Stav po sloučení: uživatel sloučil větev `observator` do `main` (2b2e773). `index.html`, `css/style.css`, `js/app.js` a `js/presence.js` jsou z observatoře, `js/top-three.js` a `config.js` z produkční verze. Sloučením vypadly úpravy `presence.js` z 21.–23. 10. (odkaz avataru na Discord profil, klikatelný obal a název skladby s kontrolou track ID, rozlišení her a aplikací, střízlivější texty stavů). Nevrácené; při zájmu je vzít z commitu 59461c3.

Úpravy tohoto kola na žádost uživatele:

- **TOP 3:** vrácené styly ztracené při sloučení (`.favorite-status`, `.favorite-group-note`, `.has-statistics`) a subgrid nad 660 px, takže řádky obou panelů mají stejnou výšku. Velká čísla pořadí (první plné v barvě akcentu, další obrysová), odkaz „Steam ↗“ / „Spotify ↗“ jako pilulka vpravo, u her proužek `.favorite-meter` s odehraným časem v poměru k první hře (`createCard(..., share)`). Obrázky zůstávají 48 × 48 s `cover`.
- **Bio:** nadpis „Hry, hudba / a trocha lenosti.“ (v `index.html`).
- **Dlaždice:** hodiny mají denní osu `.day-track` s tečkou podle pražského času a datum v záhlaví; věk je „LEVEL“ s dvanáctidílným proužkem do narozenin; Discord má radar `.radar`, který pulzuje jen při stavu online, nečinný a nerušit. Ručička `.clock-face` zrušena.
- **Barvy podle hudby:** šedý nebo nečitelný obal už web nepřebarvuje na zelenou, zůstává vybraný motiv. Vzorkovací obrázek má vlastní adresu (`?tune=1`), protože stejný obal načtený bez CORS se vracel z cache a nešel přečíst. Ruční volba motivu při naladění ladění vypne jen do konce návštěvy (neukládá se) a ukáže toast. Tlačítko „Podle hudby“ uživatel nechtěl a bylo odstraněno; nevracet. Trvalé vypnutí a zapnutí zůstává jen v paletě příkazů („Barvy podle hudby zap/vyp“), stav je v localStorage `borik-tune` (`off` = vypnuto, výchozí zapnuto). API: `window.siteTune.enabled`, `.set(on, instant, persist)`, `.toggle()`. Tečka v radaru je vycentrovaná a popisky v záhlaví dlaždic mají neutrální `--dim` místo zelené.
- **Logo:** planeta s prstencem jako inline SVG `.logo-mark` v liště a patičce, stejný motiv ve favikoně. Barvy bere z motivu.
- **Další efekty:** úvodní sekvence skládá jméno po písmenech (`#typed span`, jen se třídou `intro`), Spotify panel má rozmazaný obal jako podsvícení (`#sp-backdrop`), na mobilu po odjetí úvodu nahradí odkazy v liště stavový pásek.

Ověření: headless Edge přes Python Playwright se simulovaným WebSocketem a simulovanými odpověďmi obou funkcí TOP 3. Šířky 1440, 850, 661, 660, 390 a 360 px × tři motivy × běžný a klidný režim bez přetékání. Ověřeno naladění z barevného obalu, vypnutí ruční volbou motivu, zapnutí a vypnutí přepínačem, šedý i chybějící obal, návrat po dohrání, příkaz v paletě, shodná výška řádků a panelů TOP 3, proužky, mobilní pásek, reduced motion. Konzole bez chyb kromě záměrně chybějícího obalu. Prohlédnuty screenshoty. Prošlo 18 Node testů, build a `node --check`.

Neověřeno: skutečné obaly ze Spotify CDN (oprava cache vychází z rozboru, ne z živého testu), skutečný Lanyard, produkční odpovědi funkcí po nasazení, plynulost na reálném hardwaru.

## Účel a styl

Osobní český web Víta (Boříka), značka `borik.space`: představení, hudba, hry, živý Discord/Spotify stav a odkazy na sociální sítě. Tmavý vzhled, barevné akcenty, polární záře, hvězdy, orbitální dekorace kolem avataru a karty. Texty jsou neformální a osobní. S uživatelem komunikuj česky.

## Technologie a spuštění

- Statický HTML/CSS/vanilla JavaScript. Bez frameworku, balíčků, backendu a build kroku; v projektu není nastavený automatický testovací runner.
- Pro základní náhled otevři `index.html` v prohlížeči. Pro schránku je vhodné HTTPS nebo localhost; při selhání kopírování existuje ruční fallback.
- Hosting může být libovolný statický server. Konkrétní nasazení ani vlastnictví domény nebyly při tomto průchodu ověřeny; `borik.space` je značka v HTML.
- Externí služby: Google Fonts (DM Sans, Space Grotesk), Lanyard WebSocket a obrázky z Discord CDN / služby pro ikony aplikací, obaly Spotify.
- Soubory čti a zapisuj jako UTF-8. Ve Windows PowerShell použij u `Get-Content` explicitně `-Encoding UTF8`, jinak může být český text v terminálu zkomolený.

## Mapa souborů a vazby

| Soubor | Odpovědnost |
| --- | --- |
| `README.md` | Návod pro vlastníka: úpravy konfigurace, ovládání a omezení živých údajů. |
| `index.html` | Struktura, výchozí texty, inline SVG, sociální odkazy, dialog rychlého menu a prvky pro JS. |
| `config.js` | `window.SITE_CONFIG`: osobní texty, datum narození, přezdívky, zájmy, top 3, Discord a výchozí motiv. |
| `css/style.css` | Kompletní vzhled, tři motivy, animace a responzivita. |
| `js/app.js` | Vykreslení bia a zájmů, věk, psaní jmen, motivy, schránka, dialog, čas a klidný režim. |
| `js/top-three.js` | Generování dvou žebříčků a karet z `SITE_CONFIG.topThree`. |
| `js/presence.js` | Discord avatar/stav, poslední online, herní aktivita a Spotify přes Lanyard. |
| `js/aurora.js` | Polární záře jako WebGL shader (čisté WebGL); bez WebGL zůstává SVG záře. |
| `js/effects.js` | Canvas hvězdy s parallaxem a warpem, meteory, hyperprostor, vlastní kurzor, světlo karet. |
| `js/interactions.js` | Plovoucí lišta, příjezd sekcí, odpočet čísel, magnet, náklon avataru, souhvězdí, easter eggy. |

Skripty se načítají přes `defer` v pořadí config → app → top-three → presence → aurora → effects → interactions. `app.js` poskytuje ostatním `window.siteStorage`, `window.siteCalm`, `window.siteTicker.set(klíč, text)`, `window.siteActions` (toast, setTheme, toggleCalm, openMenu) a události `motionchange` a `themechange`. `effects.js` poskytuje `window.siteEffects` (`meteorShower()`, `hyperspace()`; v klidném režimu vrací `false`). Zachovej potřebné ID elementů při změně HTML, nebo současně uprav jejich použití v JS.

## Obsah a rozložení

1. Horní lišta: značka, O mně, Odkazy, rychlé menu.
2. Hero: psaný nadpis, slogan, tlačítka a Discord avatar s orbitální dekorací.
3. `#about`: bio vlevo, Spotify a aktuální aktivita v pravém sloupci.
4. `#top-three`: „Moje top 3“, panely Hry a Interpreti / kapely vedle sebe, na mobilu pod sebou.
5. `#links`: Instagram, GitHub, Steam, Discord, Spotify, TikTok.
6. Volba motivu a patička s klidným režimem.

Aktuální hry v pořadí: Kingdom Come: Deliverance II, Cyberpunk 2077, RimWorld. Interpreti: Connor Kauffman, Bohnes, Autumn Kings. Všech šest položek má lokální obrázek a prázdný popis a URL. Zdroj pravdy je `config.js`; sociální URL jsou přímo v `index.html` a nejsou automaticky odvozené z konfigurace.

`topThree` je pole skupin `{ title, category, items }`. Položky mají `title`, volitelné `description`, `url` a podporují vlastní `category`. Renderer z každé skupiny zobrazí přesně tři položky; chybějící titul má placeholder „Výběr už brzy.“. Platné HTTP(S) URL vytvoří odkaz, jinak je karta článkem. Obsah se vkládá přes textové DOM API. Bio podporuje `**zvýraznění**`, `{age}` a odstavce oddělené prázdným řádkem, nikoli vlastní HTML.

## Ovládání a živá data

- Motivy: `violet`, `aurora`, `sunset`; uložená volba přebíjí `defaultTheme`.
- LocalStorage klíče: `borik-theme`, `borik-calm`, `borik-intro` (úvodní sekvence už proběhla), `_lo` (čas posledního online stavu zaznamenaného tímto prohlížečem). Přístup k úložišti je ošetřen pro případ blokování.
- Ctrl+K / Cmd+K přepíná nativní dialog, Esc jej zavře. Dialog nabízí kotvy, kopírování Discordu a změnu motivu.
- Čas se zobrazuje pro `Europe/Prague`; věk se počítá z narozenin v konfiguraci podle data prohlížeče.
- Klidný režim i `prefers-reduced-motion` omezují pohyb. Systémové omezení pohybu nelze tlačítkem přebít. Animace reagují na skrytí karty, vlastní kurzor na jemný ukazatel.
- Lanyard: `wss://api.lanyard.rest/socket`, odběr podle `discordId`, heartbeat, timeout 12 s a opakování spojení s prodlevou rostoucí od 3 do 30 s.
- Rozlišují se načítání, neaktivita a nedostupnost služby. „Naposledy online“ není úplná historie Discordu. Spotify progress běží po sekundě; živá data vyžadují internet a profil dostupný přes Lanyard.

## Aktuální stav: směr „Kosmická observatoř“ (15. 11. 2026)

Uživatel si ze tří návrhů vybral směr Kosmická observatoř. Realizováno v jednom průchodu, commitnuto ve větvi `observator` (do `main` zatím nesloučeno). Nová pravidla jsou v `css/style.css` v bloku za komentářem „Observatoř“ na konci souboru; pozdější pravidla tam záměrně přebíjejí starší včetně starších media queries.

- **Typografie:** základ 16 px, bio 15 px, drobné popisky v systémovém monospace (`--mono`, žádný nový font). Jméno v hero má `--name-size` (až 148 px), dlouhá jména 54 %. Písmo jména má gradient motivu s pomalým posunem (`background-clip: text`, bez podpory zůstává barva akcentu). Šedé texty pod AA byly sjednoceny na `--dim` (#9495a3, nejméně 5,7:1).
- **Záře:** `#aurora-gl` kreslí tři závoje v různé hloubce, reaguje na myš a scroll, pod úvodem zeslábne. Kreslí v 50 % rozlišení (33 % a zhruba 30 fps na dotykových zařízeních), při skryté kartě stojí, v klidném režimu vykreslí jeden statický snímek. Barvy čte z `--accent-rgb` a `--secondary-rgb` (každý motiv je musí mít) při `themechange`. Když WebGL není (nebo `?nogl` v URL pro test), chybí třída `has-gl` a zůstává původní SVG záře.
- **Hero:** avatar je `<button id="avatar-core">` v `#avatar-tilt` (3D náklon přes `--tilt-x/y`, odlesk `--shine-x/y`), orbity jsou ve vrstvách `.orbit-layer[data-depth]` posouvaných podle kurzoru, tři planetky s odlesky. Při odjezdu se hero zavírá přes `animation-timeline: view()`.
- **Úvodní sekvence:** třída `intro` na `<html>` jen při první návštěvě, nejdéle 1,5 s, přeskočí ji klik, klávesa, kolečko i dotyk. V klidném režimu se nespouští.
- **Lišta:** sticky; po odjetí `#topbar-sentinel` dostane `.is-scrolled` (plovoucí panel) a ukáže `#ticker-text` („Praha 21:37 · online · hraju … · poslouchám …“). Do 660 px je ticker i odkaz Top 3 skrytý.
- **Bento:** šestisloupcová mřížka: bio, Spotify, aktivita a tři dlaždice (`.clock-tile` s vteřinami a ručičkou, `.age-tile` s roky, dny a postupem k narozeninám, `.online-tile` se stavem a „naposledy online“). Do 660 px dva sloupce, hodiny přes celou šířku. `.live-column` už neexistuje.
- **Naladění podle Spotify:** `presence.js` vzorkuje obal alba přes canvas (samostatný `Image` s `crossOrigin`), vybere nejsytější odstín a nastaví inline `--accent`, `--accent-rgb`, `--secondary`, `--secondary-rgb` a třídu `is-tuned`. Světlost akcentu je pevná kvůli kontrastu. Šedý obal nebo selhání CORS dá zelenou. Při neaktivitě a odpojení se vrací barvy motivu. Přechod jde přes View Transitions, pokud není klidný režim.
- **Odkazy:** `.constellation` s SVG spojnicí mezi hvězdami `.si-star` (hadovitě po řádcích, přepočet při resize), karty mají barvu sítě v `--brand` (RGB složky v inline stylu). Karty nejsou vertikálně posunuté, jinak by spojnice vedla přes text.
- **Interakce:** okraj a světlo karet sledují kurzor (`--card-x/y` na `.panel` i `.si`), `[data-magnetic]` se přitahuje přes `--mx/--my`, sekce s `[data-reveal]` přijíždějí přes scroll timeline (fallback třída `io-reveal` + IntersectionObserver), pořadí favoritů a věk se odpočítají, hvězdy mají parallax a při rychlém scrollu se protáhnou, přes stránku je jemné zrno (`.grain`).
- **Motivy:** změna z kliknutí se rozlije kruhem z místa kliknutí (`vt-circle`, View Transitions API); bez podpory se přepne hned.
- **Paleta příkazů:** dialog má `#command-input`, filtrování bez diakritiky, šipky a Enter. Položky s `data-run` spouští příkazy z `app.js` (motivy, klidný režim, warp, meteory, nahoru), položky s `data-hidden` (sudo, 42, kafe, ahoj, neofetch) se ukážou až po napsání aspoň dvou znaků. ID `cycle-theme` a `close-menu` zůstávají; skript nesmí přepisovat existující ID položek.
- **Easter eggy:** pět rychlých kliknutí na avatar spustí meteorický roj, Konami kód hyperprostor.
- Klidný režim a `prefers-reduced-motion` vypínají intro, warp, hyperprostor, meteory, magnet, náklon, animaci záře i odpočty.

Ověření (headless Edge přes Python Playwright, softwarové WebGL): šířky 1440, 850, 660, 390 a 360 px × tři motivy × běžný a klidný režim bez vodorovného přetékání; konzole bez chyb; simulovaný WebSocket pro poslech, neaktivitu a odpojení včetně naladění barvy a návratu; paleta klávesnicí včetně skrytého příkazu a prázdného výsledku; Konami kód; pět kliknutí na avatar; náklon a magnet; focus; emulace dotyku; reduced motion; `?nogl`; stránka bez JavaScriptu. Při scrollu medián snímku 16,7 ms, 95. percentil 33 ms, žádná dlouhá úloha. Prohlédnuty screenshoty desktopu i mobilu. Prošel `node --check` všech JS a `git diff --check`.

Neověřeno: plynulost na skutečné grafické kartě a na reálném telefonu, skutečné spojení s Lanyardem, CORS skutečných obalů ze Spotify CDN, čtečka obrazovky, Firefox a Safari.

## Starší stav: kompaktní favorité

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
- Mobilní hero do 660 px má avatar 120 px, orbitální část 220 px a menší odstupy. Dekorativní popisky kolem avataru se na mobilu skrývají. Na šířce 390 px se úvod v klidném režimu zkrátil přibližně o 83 px.
- Doplňkové popisky sekcí a avataru v HTML jsou česky: Za obrazovkou, Moji favorité, Ozvi se, Můj malý vesmír, Od roku 2010 / CZ a Česko. Osobní obsah konfigurace zůstává zachovaný.
- Spotify panel při poslechu dostává `.is-playing`: jemné zelené pozadí, rámeček, záři u obalu a výraznější spodní zvukovou vlnu. `js/presence.js` třídu přepíná podle dat Spotify a odstraňuje při nedostupnosti spojení. Obal má pevnou šířku i při dlouhém názvu.

Ověření doladění: headless Edge/Playwright na šířkách 1440, 850, 660, 390 a 360 px ve všech motivech bez přetékání; vizuálně prohlédnuty screenshoty mobilní stránky, favoritů a aktivního Spotify. Ověřeny dlouhé texty, placeholdery, focus, rychlé menu, omezený i běžný pohyb. Pomocí simulovaného WebSocketu ověřeny přechody Spotify poslech → neaktivita a poslech → odpojení. Skutečné spojení s Lanyardem se tímto netestovalo. Bez chyb JavaScriptu; syntaktická kontrola obou změněných JS souborů prošla.

## Ověřování změn

Animace živých panelů (19. 10. 2026): spodní `.sound-wave` obsahuje 48 dekorativních sloupků vytvořených jednou v `js/presence.js`; CSS mění jejich výšku přes `scaleY` s různými délkami a posuny animace jen při `.music-panel.is-playing`. Jde o dekoraci, nikoli analýzu skutečného zvuku (Lanyard zvuk neposkytuje). Malý `.equalizer` Spotify je zelený a animuje sloupky od spodní hrany. Herní aktivita má samostatný `.activity-pulse`: tři postupně pulzující tečky v barvě motivu. V klidném režimu a při systémovém omezení pohybu jsou statické. `presence.js` přepíná na HTML `.presence-paused` podle `document.hidden`; pauzovací CSS musí mít vyšší specificitu než pravidla `.is-playing` s animation shorthand. Ověřeno přes simulovaný WebSocket: skutečná změna transformace v čase, odlišná barva a animace indikátorů, neaktivita/odpojení, skrytí a obnovení karty, ruční i systémové omezení pohybu a pět šířek ve třech motivech. Bez chyb JS a přetékání; prohlédnut screenshot obou aktivních panelů.

Obrázky favoritů byly doplněny 19. 10. 2026: šest lokálních JPEG v `assets/favorites/`, zdroje v `assets/favorites/SOURCES.md` (Steam, Spotify, oficiální SoundCloud Bohnes a Hopeless Records). Opravena původní chybná podoba jména na Connor Kauffman podle jeho Spotify profilu. Ověřeno načtení všech šesti souborů v Edge, screenshot desktopu a mobilu, šířky 1440/850/660/390/360 px ve všech motivech, dlouhý text, klávesnicový focus, placeholdery a chybějící soubor. Bez vodorovného přetékání a chyb JavaScriptu. Prošla syntaktická kontrola `config.js` a `js/top-three.js`.

Před změnami zkontroluj pracovní strom a zachovej cizí úpravy. Pro úpravy layoutu ověř desktop i šířky přibližně 850, 660, 390 a 360 px, dlouhé názvy, přetékání, všechny motivy a klidný režim. Při zásahu do JS ověř konzoli, ovládání klávesnicí a dotčené funkce. U živých karet ověř dostupný i nedostupný stav, pokud to prostředí umožňuje. Nevydávej kontrolu zdrojů za test v prohlížeči.

Ověření realizace: headless Microsoft Edge přes Python Playwright, šířky 1440, 850, 660, 390 a 360 px, všechny tři motivy bez vodorovného přetékání. Zkontrolovány screenshoty desktopu a mobilu, reduced motion, otevření/zavření menu klávesnicí, dlouhé názvy a popisy, vlastní kategorie, platný i zakázaný protokol odkazu, focus odkazu a prázdná položka. Bez chyb JavaScriptu. Prošel `node --check js/top-three.js` a `git diff --check`. Dostupný živý stav Lanyardu nebyl tímto testem ověřován.
