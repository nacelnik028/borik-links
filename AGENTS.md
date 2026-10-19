# Kontext projektu pro další chaty

Poslední aktualizace: 19. 10. 2026. Tento soubor čti při zahájení práce v projektu. Po podstatných změnách aktualizuj příslušné části, zejména aktuální stav a rozpracované návrhy. Je to mapa projektu; před úpravou ověř skutečný stav dotčeného kódu a `git status`, protože soubory se mohou mezitím změnit.

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
| `js/effects.js` | Canvas hvězdy, padající hvězdy, vlastní kurzor a reakce záře na myš. |

Skripty se načítají přes `defer` v pořadí config → app → top-three → presence → effects. `app.js` poskytuje ostatním `window.siteStorage`, `window.siteCalm` a událost `motionchange`. Zachovej potřebné ID elementů při změně HTML, nebo současně uprav jejich použití v JS.

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
- LocalStorage klíče: `borik-theme`, `borik-calm`, `_lo` (čas posledního online stavu zaznamenaného tímto prohlížečem). Přístup k úložišti je ošetřen pro případ blokování.
- Ctrl+K / Cmd+K přepíná nativní dialog, Esc jej zavře. Dialog nabízí kotvy, kopírování Discordu a změnu motivu.
- Čas se zobrazuje pro `Europe/Prague`; věk se počítá z narozenin v konfiguraci podle data prohlížeče.
- Klidný režim i `prefers-reduced-motion` omezují pohyb. Systémové omezení pohybu nelze tlačítkem přebít. Animace reagují na skrytí karty, vlastní kurzor na jemný ukazatel.
- Lanyard: `wss://api.lanyard.rest/socket`, odběr podle `discordId`, heartbeat, timeout 12 s a opakování spojení s prodlevou rostoucí od 3 do 30 s.
- Rozlišují se načítání, neaktivita a nedostupnost služby. „Naposledy online“ není úplná historie Discordu. Spotify progress běží po sekundě; živá data vyžadují internet a profil dostupný přes Lanyard.

## Aktuální stav: kompaktní favorité

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
