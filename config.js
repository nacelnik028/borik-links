// TADY SI UPRAVÍŠ WEB. Stačí změnit text mezi uvozovkami a uložit soubor.
// V biu: **text** = zvýraznění, {age} = automaticky vypočítaný věk.
// Více odstavců odděl prázdným řádkem uvnitř zpětných uvozovek `…`.
window.SITE_CONFIG = {
  name: 'Vít',
  greeting: 'Ahojkyy, já jsem',
  rotatingNames: ['Vít', 'Bořík', 'nacelnik028'],
  tagline: 'Hudba, hry a něco o mně.',
  bio: `Ahojkyy, já jsem **Vít** a momentálně studuji střední školu. Je mi **{age} let**.

  Miluji poslouchání **hudby** a rád hraju **hry**. Nejraději poslouchám hudební žánry **rock**, **rock-pop**, **metal** a **alternativní rock**, ale někdy si pustím i **white girl music** nebo **lofi**.

  Jsem přátelský a společenský člověk, rád se učím nové věci. Ale taky jsem docela líný.`,
  birthday: '2010-02-20', // RRRR-MM-DD; věk se mění automaticky.
  interests: ['rock & metal', 'gaming', 'late night vibes'],
  // MOJE TOP 3 – každá skupina má vlastní žebříček od 1. do 3. místa.
  // title = název, category = štítek na kartách, items = tři položky v pořadí.
  // U položky můžeš doplnit description (komentář) a url (https:// odkaz).
  // image = cesta k obrázku; imageFit: 'contain' zobrazí celý obrázek bez ořezu.
  topThree: [
    {
      title: 'Hry',
      category: 'Hra',
      items: [
        { title: 'Kingdom Come: Deliverance II', description: '', url: 'https://store.steampowered.com/app/1771300/', image: 'assets/favorites/kingdom-come-deliverance-2.jpg' },
        { title: 'Cyberpunk 2077', description: '', url: 'https://store.steampowered.com/app/1091500/', image: 'assets/favorites/cyberpunk-2077.jpg' },
        { title: 'RimWorld', description: '', url: 'https://store.steampowered.com/app/294100/', image: 'assets/favorites/rimworld.jpg' },
      ],
    },
    {
      title: 'Interpreti / kapely',
      category: 'Hudba',
      items: [
        { title: 'Connor Kauffman', description: '', url: 'https://open.spotify.com/artist/0bFEOKy3T1knA0g7ZaPnHe', image: 'assets/favorites/connor-kauffman.jpg' },
        { title: 'Bohnes', description: '', url: 'https://open.spotify.com/artist/4aN7T7NNFFMRJgVbRPne8q', image: 'assets/favorites/bohnes.jpg' },
        { title: 'Autumn Kings', description: '', url: 'https://open.spotify.com/artist/7BYLAgXd3LygQ9aJupZ6p8', image: 'assets/favorites/autumn-kings.jpg' },
      ],
    },
  ],
  discordId: '794089788289712130',
  discordUsername: 'nacelnik028',
  defaultTheme: 'violet', // violet, aurora, sunset
};
