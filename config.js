// TADY SI UPRAVÍŠ WEB. Stačí změnit text mezi uvozovkami a uložit soubor.
// V biu: **text** = zvýraznění, {age} = automaticky vypočítaný věk.
// Více odstavců odděl prázdným řádkem uvnitř zpětných uvozovek `…`.
window.SITE_CONFIG = {
  name: 'Vít',
  greeting: 'Ahojkyy, já jsem',
  rotatingNames: ['Vít', 'music lover', 'gamer', 'Bořík', 'nacelnk028'],
  tagline: 'Hudba ve sluchátkách. Vlastní svět v hlavě.',
  bio: `Ahojkyy, já jsem **Vít** a momentálně studuji střední školu. Je mi **{age} let**. Rád dělám nejrůznější věci, které mě baví.

  Miluji poslouchání **hudby** a rád hraju **hry**. Nejraději poslouchám hudební žánry **rock**, **rock-pop**, **metal** a **alternativní rock**, ale někdy si pustím i **white girl music** nebo **lofi**.

  Jsem přátelský a společenský člověk, který se rád učí nové věci. Ale docela liny.`,
  birthday: '2010-02-20', // RRRR-MM-DD; věk se mění automaticky.
  interests: ['rock & metal', 'gaming', 'late night vibes'],
  // MOJE TOP 3 – každá skupina má vlastní žebříček od 1. do 3. místa.
  // title = název, category = štítek na kartách, items = tři položky v pořadí.
  // U položky můžeš doplnit description (komentář) a url (https:// odkaz).
  topThree: [
    {
      title: 'Hry',
      category: 'Hra',
      items: [
        { title: 'Kingdom Come: Deliverance II', description: '', url: '' },
        { title: 'Cyberpunk 2077', description: '', url: '' },
        { title: 'RimWorld', description: '', url: '' },
      ],
    },
    {
      title: 'Interpreti / kapely',
      category: 'Hudba',
      items: [
        { title: 'Connor Kaufmann', description: '', url: '' },
        { title: 'Bohnes', description: '', url: '' },
        { title: 'Autumn Kings', description: '', url: '' },
      ],
    },
  ],
  discordId: '794089788289712130',
  discordUsername: 'nacelnik028',
  defaultTheme: 'violet', // violet, aurora, sunset
};
