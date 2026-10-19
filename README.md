# Vít · osobní web

Statický web bez buildu a závislostí. Otevři `index.html` v prohlížeči nebo nahraj projekt na statický hosting.

Kontext pro další chaty a úpravy projektu je v [AGENTS.md](AGENTS.md): mapa souborů, fungování webu a návrhy dalšího vývoje.

## Jak změnit úvodní text

Otevři **`config.js`**. Texty jsou na jednom místě:

- `greeting` – první řádek nadpisu („Ahojkyy, já jsem“).
- `rotatingNames` – slova, která se postupně píšou v nadpisu. Další slovo přidej jako položku v uvozovkách.
- `tagline` – krátký text pod nadpisem.
- `bio` – celý text „o mně“. Může mít více odstavců. `**slovo**` zvýrazní slovo, `{age}` doplní aktuální věk.
- `birthday` – datum narození ve formátu `2010-02-20`.
- `interests` – malé štítky pod biem.
- `topThree` – samostatné žebříčky her a interpretů / kapel. Každá skupina má `title` (nadpis), `category` (štítek na kartách) a `items` (tři položky od prvního místa). U položky uprav `title` (název), případně `description` (vlastní komentář) a `url` (odkaz začínající `https://`). Komentář ani odkaz nejsou povinné. Pořadí změníš přesunutím položek uvnitř `items`; každá skupina se čísluje znovu od 1. Prázdný název zobrazí „Výběr už brzy.“
- `defaultTheme` – výchozí barvy: `violet`, `aurora` nebo `sunset`. Uložená volba návštěvníka má přednost.
- `discordId` a `discordUsername` – profil pro živý stav a jméno ke kopírování.

Po uložení obnov stránku. Texty se vykreslují jako text, HTML do konfigurace nepatří. Uvozovku uvnitř textu zapsaného v jednoduchých uvozovkách napiš jako `\'`.

## Soubory

- `index.html` – struktura stránky a odkazy na sociální sítě.
- `config.js` – snadno upravitelný obsah.
- `css/style.css` – vzhled, motivy a mobilní rozložení.
- `js/app.js` – obsah, psaní nadpisu, motivy, čas, kopírování a rychlé menu.
- `js/top-three.js` – karty osobních favoritů z konfigurace.
- `js/presence.js` – živý Discord profil, herní aktivita a Spotify přes Lanyard.
- `js/effects.js` – kurzor, částice, hvězdné pozadí, padající hvězdy a jemná reakce polární záře na myš.

## Ovládání

Moje top 3 tvoří dva kompaktní panely s očíslovanými řádky: hry a interpreti / kapely. Na počítači jsou vedle sebe, na mobilu pod sebou. Volitelné popisy a odkazy se zobrazí pod názvem; vlastní kategorie položky se ukáže, pokud se liší od kategorie skupiny.

Obrázky favoritů jsou uložené v `assets/favorites/`; jejich zdroje najdeš v [SOURCES.md](assets/favorites/SOURCES.md). U položky v `config.js` uprav `image` (cestu k obrázku). Všechny aktuální obrázky vyplňují celý rámeček s ořezem okrajů (`cover`). Volitelné `imageFit: 'contain'` by zobrazilo celý obrázek bez ořezu, ale s volným místem po stranách. Bez obrázku nebo při chybě načtení zůstane číslo a název, bez náhradních iniciál.

Mobilní úvod má menší avatar a oběžné kruhy. Při poslechu se Spotify panel jemně zeleně zvýrazní; při neaktivitě nebo výpadku se vrátí do základního vzhledu.

Spotify při poslechu animuje zelený ekvalizér a spodní zvukovou vlnu. Vlna je dekorativní, nereaguje na skutečný zvuk skladby. Herní aktivitu odlišují tři pomalu pulzující tečky v barvě motivu. V klidném režimu jsou indikátory statické a při skrytí karty se jejich pohyb pozastaví.

Motiv se mění dole na stránce a zůstane uložený v prohlížeči. **Ctrl+K** (na Macu **⌘K**) otevře rychlé menu; **Esc** ho zavře. Klidný režim vypne pohyb včetně psaní nadpisu. Respektuje se také systémové nastavení omezeného pohybu.

Polární záře v pozadí přebírá barvy vybraného motivu. Na počítači jemně reaguje na myš, na dotykových zařízeních je tlumenější. V klidném režimu zůstane statická a při skrytí karty prohlížeče se její animace pozastaví. Intenzitu upravíš v `css/style.css` u `.aurora-background` pomocí `opacity`.

Živé údaje vyžadují dostupný profil v Lanyardu a internetové připojení. Při výpadku se zobrazí nedostupnost a spojení se automaticky obnovuje. „Naposledy online“ vychází z posledního online stavu zaznamenaného tímto prohlížečem. Kopírování používá schránku na HTTPS/localhost; při nedostupnosti nabídne jméno k ručnímu zkopírování.
