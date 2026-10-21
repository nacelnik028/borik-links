# Kontext projektu pro další chaty

Poslední aktualizace: 21. 10. 2026. Tento soubor čti při zahájení práce v projektu. Po podstatných změnách aktualizuj příslušné části, zejména aktuální stav a rozpracované návrhy. Je to mapa projektu; před úpravou ověř skutečný stav dotčeného kódu a `git status`, protože soubory se mohou mezitím změnit.

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
2. Hero: psaný nadpis, krátké „Hudba, hry a něco o mně.“, tlačítka a Discord avatar s orbitální dekorací.
3. `#about`: bio vlevo, Spotify a aktuální aktivita v pravém sloupci.
4. `#top-three`: „Moje top 3“, panely Hry a Interpreti / kapely vedle sebe, na mobilu pod sebou.
5. `#links`: Instagram, GitHub, Steam, Discord, Spotify, TikTok.
6. Volba motivu a patička s klidným režimem.

Aktuální hry v pořadí: Kingdom Come: Deliverance II, Cyberpunk 2077, RimWorld. Interpreti: Connor Kauffman, Bohnes, Autumn Kings. Všech šest položek má lokální obrázek, prázdný popis a ověřený odkaz: hry na základní hru na Steamu, interpreti na profil Spotify. Cíle jsou zdokumentované v `assets/favorites/SOURCES.md`. Zdroj pravdy je `config.js`; sociální URL jsou přímo v `index.html` a nejsou automaticky odvozené z konfigurace.

`topThree` je pole skupin `{ title, category, items }`. Položky mají `title`, volitelné `description`, `url` a podporují vlastní `category`. Renderer z každé skupiny zobrazí přesně tři položky; chybějící titul má placeholder „Výběr už brzy.“. Platné HTTP(S) URL vytvoří odkaz, jinak je karta článkem. Obsah se vkládá přes textové DOM API. Bio podporuje `**zvýraznění**`, `{age}` a odstavce oddělené prázdným řádkem, nikoli vlastní HTML.

## Ovládání a živá data

- Motivy: `violet`, `aurora`, `sunset`; uložená volba přebíjí `defaultTheme`.
- LocalStorage klíče: `borik-theme`, `borik-calm`, `_lo` (čas posledního online stavu zaznamenaného tímto prohlížečem). Přístup k úložišti je ošetřen pro případ blokování.
- Ctrl+K / Cmd+K přepíná nativní dialog, Esc jej zavře. Dialog nabízí kotvy, kopírování Discordu a změnu motivu.
- Čas se zobrazuje pro `Europe/Prague`; věk se počítá z narozenin v konfiguraci podle data prohlížeče.
- Klidný režim i `prefers-reduced-motion` omezují pohyb. Systémové omezení pohybu nelze tlačítkem přebít. Animace reagují na skrytí karty, vlastní kurzor na jemný ukazatel.
- Lanyard: `wss://api.lanyard.rest/socket`, odběr podle `discordId`, heartbeat, timeout 12 s a opakování spojení s prodlevou rostoucí od 3 do 30 s.
- Rozlišují se načítání, neaktivita a nedostupnost služby. „Naposledy online“ není úplná historie Discordu. Spotify progress běží po sekundě; živá data vyžadují internet a profil dostupný přes Lanyard.

## Aktuální doladění: aktivita, čitelnost a odkazy

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
