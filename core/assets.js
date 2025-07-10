export async function loadAssets() {
  const images = {};
  const paths = {
    backgroundTile: 'assets/Background/Blue.png',
    block: 'assets/Terrain/Terrain.png',
    playerJump: 'assets/MainCharacters/PinkMan/jump.png',
    playerFall: 'assets/MainCharacters/PinkMan/fall.png',

    // Fruit spritesheets (animated)
    fruit_apple: 'assets/Fruits/Apple.png',
    fruit_bananas: 'assets/Fruits/Bananas.png',
    fruit_cherries: 'assets/Fruits/Cherries.png',
    fruit_kiwi: 'assets/Fruits/Kiwi.png',
    fruit_melon: 'assets/Fruits/Melon.png',
    fruit_orange: 'assets/Fruits/Orange.png',
    fruit_pineapple: 'assets/Fruits/Pineapple.png',
    fruit_strawberry: 'assets/Fruits/Strawberry.png',

    // Collected animation (applies to all fruits)
    fruit_collected: 'assets/Fruits/Collected.png'
  };

  const promises = Object.entries(paths).map(([key, src]) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        images[key] = img;
        resolve();
      };
      img.onerror = () => reject(`Failed to load image: ${src}`);
    });
  });

  await Promise.all(promises);
  return images;
}
