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
  // Pořadí, obrázky a odkazy pocházejí výhradně ze skutečných statistik.
  // Přístupové údaje sem nikdy nepatří; nastavují se pouze na serveru.
  topThree: [
    {
      title: 'Hry',
      category: 'Hra',
      source: 'steam',
    },
    {
      title: 'Interpreti / kapely',
      category: 'Hudba',
      source: 'spotify',
    },
  ],
  discordId: '794089788289712130',
  discordUsername: 'nacelnik028',
  defaultTheme: 'violet', // violet, aurora, sunset
};
