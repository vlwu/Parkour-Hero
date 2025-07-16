// Level configurations organized in sections for easy access and iteration
// Each section is an object containing a name and an array of level configurations.

export const levelSections = [
  {
    name: "Basic Mechanics",
    levels: [
      {
        name: "Level 1: It's Too Easy",
        jsonPath: "levels/basic-mechanics/01.json"
      },
      {
        name: "Level 2: Big Drop",
        jsonPath: "levels/basic-mechanics/02.json"
      },
      {
        name: "Level 3: Downs & Ups",
        jsonPath: "levels/basic-mechanics/03.json"
      },
      {
        name: "Level 4: Sky Climb",
        jsonPath: "levels/basic-mechanics/04.json"
      },
      {
        name: "Level 5: Colorful Blocks",
        jsonPath: "levels/basic-mechanics/05.json"
      },
      {
        name: "Level 6: Narrow Paths",
        jsonPath: "levels/basic-mechanics/06.json"
      },
      {
        name: "Level 7: Stairway",
        jsonPath: "levels/basic-mechanics/07.json"
      },
      {
        name: "Level 8: Bottomless",
        jsonPath: "levels/basic-mechanics/08.json"
      },
      {
        name: "Level 9: Aerial Mastery",
        jsonPath: "levels/basic-mechanics/09.json"
      },
      {
        name: "Level 10: Introduction Finale",
        jsonPath: "levels/basic-mechanics/10.json"
      },
    ]
  },
  {
    name: "Sky High",
    levels: [
      {
        name: "Level 1: Cloud Rise",
        width: 1280,
        height: 2200,
        background: 'backgroundTile', // Explicitly define the background asset
        startPosition: { x: 100, y: 1950 },
        platforms: [
          { x: 50, y: 2050, width: 192, height: 48, terrainType: 'stone' },
          { x: 300, y: 1900, width: 144, height: 48, terrainType: 'dirt' },
          { x: 150, y: 1750, width: 96, height: 48, terrainType: 'wood' },
          { x: 400, y: 1600, width: 192, height: 48, terrainType: 'stone' },
          { x: 650, y: 1480, width: 48, height: 48, terrainType: 'green_block' },
          { x: 800, y: 1350, width: 144, height: 48, terrainType: 'pink_dirt' },
          { x: 600, y: 1200, width: 96, height: 48, terrainType: 'dirt' },
          { x: 400, y: 1050, width: 144, height: 48, terrainType: 'red_brick' },
          { x: 150, y: 900, width: 192, height: 48, terrainType: 'stone' },
          { x: 300, y: 750, width: 48, height: 48, terrainType: 'orange_dirt' },
          { x: 500, y: 600, width: 96, height: 48, terrainType: 'wood' },
          { x: 750, y: 500, width: 144, height: 48, terrainType: 'dirt' },
          { x: 1000, y: 350, width: 192, height: 48, terrainType: 'stone' }
        ],
        checkpoints: [
          { x: 500, y: 1568 },
          { x: 300, y: 868 },
        ],
        fruits: [
          { x: 350, y: 1850, fruitType: 'fruit_apple' },
          { x: 180, y: 1700, fruitType: 'fruit_bananas' },
          { x: 450, y: 1550, fruitType: 'fruit_cherries' },
          { x: 830, y: 1300, fruitType: 'fruit_kiwi' },
          { x: 450, y: 1000, fruitType: 'fruit_melon' },
          { x: 180, y: 850, fruitType: 'fruit_orange' },
          { x: 530, y: 550, fruitType: 'fruit_pineapple' },
          { x: 800, y: 450, fruitType: 'fruit_strawberry' }
        ],
        trophy: { x: 1096, y: 334 }
      },
      {
        name: "Level 2: Stratosphere Hop",
        width: 1280,
        height: 2500,
        startPosition: { x: 640, y: 2300 },
        platforms: [
          { x: 550, y: 2400, width: 192, height: 48, terrainType: 'red_brick' },
          { x: 800, y: 2280, width: 96, height: 48, terrainType: 'wood' },
          { x: 600, y: 2150, width: 144, height: 48, terrainType: 'green_block' },
          { x: 350, y: 2000, width: 192, height: 48, terrainType: 'dirt' },
          { x: 150, y: 1850, width: 96, height: 48, terrainType: 'pink_dirt' },
          { x: 400, y: 1700, width: 48, height: 48, terrainType: 'stone' },
          { x: 650, y: 1550, width: 144, height: 48, terrainType: 'orange_dirt' },
          { x: 900, y: 1400, width: 96, height: 48, terrainType: 'dirt' },
          { x: 700, y: 1250, width: 144, height: 48, terrainType: 'stone' },
          { x: 450, y: 1100, width: 96, height: 48, terrainType: 'wood' },
          { x: 200, y: 950, width: 192, height: 48, terrainType: 'red_brick' },
          { x: 450, y: 775, width: 48, height: 48, terrainType: 'green_block' },
          { x: 650, y: 650, width: 144, height: 48, terrainType: 'dirt' },
          { x: 950, y: 475, width: 192, height: 48, terrainType: 'stone' }
        ],
        fruits: [
          { x: 850, y: 2230, fruitType: 'fruit_apple' },
          { x: 400, y: 1950, fruitType: 'fruit_bananas' },
          { x: 180, y: 1800, fruitType: 'fruit_cherries' },
          { x: 700, y: 1500, fruitType: 'fruit_kiwi' },
          { x: 750, y: 1200, fruitType: 'fruit_melon' },
          { x: 250, y: 900, fruitType: 'fruit_orange' },
          { x: 700, y: 550, fruitType: 'fruit_pineapple' },
          { x: 1050, y: 400, fruitType: 'fruit_strawberry' }
        ],
        trophy: { x: 1046, y: 459 }
      },
      {
        name: "Level 3: Celestial Ascent",
        width: 1320,
        height: 3000,
        startPosition: { x: 100, y: 2800 },
        platforms: [
          { x: 50, y: 2900, width: 144, height: 48, terrainType: 'stone' },
          { x: 300, y: 2750, width: 96, height: 48, terrainType: 'orange_dirt' },
          { x: 500, y: 2600, width: 144, height: 48, terrainType: 'wood' },
          { x: 300, y: 2450, width: 96, height: 48, terrainType: 'pink_dirt' },
          { x: 100, y: 2300, width: 144, height: 48, terrainType: 'dirt' },
          { x: 400, y: 2150, width: 48, height: 48, terrainType: 'red_brick' },
          { x: 650, y: 2000, width: 96, height: 48, terrainType: 'green_block' },
          { x: 900, y: 1850, width: 144, height: 48, terrainType: 'stone' },
          { x: 1100, y: 1700, width: 96, height: 48, terrainType: 'wood' },
          { x: 900, y: 1550, width: 96, height: 48, terrainType: 'dirt' },
          { x: 1100, y: 1400, width: 96, height: 48, terrainType: 'orange_dirt' },
          { x: 850, y: 1250, width: 96, height: 48, terrainType: 'stone' },
          { x: 700, y: 1100, width: 144, height: 48, terrainType: 'pink_dirt' },
          { x: 300, y: 950, width: 192, height: 48, terrainType: 'red_brick' },
          { x: 50, y: 800, width: 144, height: 48, terrainType: 'green_block' },
          { x: 300, y: 650, width: 192, height: 48, terrainType: 'stone' }
        ],
        fruits: [
          { x: 350, y: 2700, fruitType: 'fruit_apple' },
          { x: 150, y: 2250, fruitType: 'fruit_bananas' },
          { x: 700, y: 1950, fruitType: 'fruit_cherries' },
          { x: 950, y: 1800, fruitType: 'fruit_kiwi' },
          { x: 1150, y: 1600, fruitType: 'fruit_melon' },
          { x: 900, y: 1150, fruitType: 'fruit_orange' },
          { x: 350, y: 750, fruitType: 'fruit_pineapple' },
          { x: 100, y: 550, fruitType: 'fruit_strawberry' }
        ],
        trophy: { x: 396, y: 634 }
      },
      {
        name: "Level 4: Dash Gauntlet",
        width: 1400, height: 2000,
        startPosition: { x: 100, y: 1800 },
        platforms: [
          { x: 50, y: 1900, width: 192, height: 48, terrainType: 'dirt' },
          { x: 400, y: 1850, width: 144, height: 48, terrainType: 'red_brick' },
          { x: 700, y: 1780, width: 96, height: 48, terrainType: 'stone' },
          { x: 1000, y: 1700, width: 192, height: 48, terrainType: 'wood' },
          { x: 800, y: 1550, width: 144, height: 48, terrainType: 'green_block' },
          { x: 500, y: 1450, width: 96, height: 48, terrainType: 'pink_dirt' },
          { x: 200, y: 1350, width: 192, height: 48, terrainType: 'orange_dirt' },
          { x: 500, y: 1200, width: 144, height: 48, terrainType: 'dirt' },
          { x: 850, y: 1100, width: 96, height: 48, terrainType: 'stone' }
        ],
        fruits: [
          { x: 450, y: 1800, fruitType: 'fruit_apple' },
          { x: 750, y: 1730, fruitType: 'fruit_bananas' },
          { x: 1050, y: 1650, fruitType: 'fruit_cherries' },
          { x: 850, y: 1500, fruitType: 'fruit_kiwi' },
          { x: 250, y: 1300, fruitType: 'fruit_melon' },
          { x: 550, y: 1150, fruitType: 'fruit_orange' },
          { x: 80, y: 1800, fruitType: 'fruit_pineapple' },
          { x: 900, y: 1050, fruitType: 'fruit_strawberry' }
        ],
        trophy: { x: 900, y: 1084 }
      },
      {
        name: "Level 5: Leaps of Faith",
        width: 1280, height: 2800,
        startPosition: { x: 1100, y: 2600 },
        platforms: [
          { x: 1000, y: 2700, width: 192, height: 48, terrainType: 'stone' },
          { x: 750, y: 2600, width: 96, height: 48, terrainType: 'pink_dirt' },
          { x: 500, y: 2480, width: 144, height: 48, terrainType: 'wood' },
          { x: 200, y: 2350, width: 192, height: 48, terrainType: 'red_brick' },
          { x: 500, y: 2200, width: 96, height: 48, terrainType: 'dirt' },
          { x: 800, y: 2050, width: 144, height: 48, terrainType: 'green_block' },
          { x: 1050, y: 1900, width: 48, height: 48, terrainType: 'orange_dirt' },
          { x: 800, y: 1750, width: 192, height: 48, terrainType: 'stone' },
          { x: 450, y: 1650, width: 144, height: 48, terrainType: 'wood' },
          { x: 150, y: 1550, width: 96, height: 48, terrainType: 'dirt' }
        ],
        fruits: [
          { x: 800, y: 2550, fruitType: 'fruit_apple' },
          { x: 250, y: 2300, fruitType: 'fruit_bananas' },
          { x: 850, y: 2000, fruitType: 'fruit_cherries' },
          { x: 1100, y: 1850, fruitType: 'fruit_kiwi' },
          { x: 500, y: 1600, fruitType: 'fruit_melon' },
          { x: 200, y: 1500, fruitType: 'fruit_orange' },
          { x: 1050, y: 2650, fruitType: 'fruit_pineapple' },
          { x: 550, y: 2430, fruitType: 'fruit_strawberry' }
        ],
        trophy: { x: 200, y: 1534 }
      },
      {
        name: "Level 6: Zigging and Zagging",
        width: 1320, height: 3200,
        startPosition: { x: 150, y: 3000 },
        platforms: [
          { x: 100, y: 3100, width: 144, height: 48, terrainType: 'green_block' },
          { x: 400, y: 2980, width: 192, height: 48, terrainType: 'wood' },
          { x: 100, y: 2850, width: 144, height: 48, terrainType: 'stone' },
          { x: 400, y: 2700, width: 192, height: 48, terrainType: 'orange_dirt' },
          { x: 100, y: 2550, width: 144, height: 48, terrainType: 'red_brick' },
          { x: 400, y: 2400, width: 192, height: 48, terrainType: 'dirt' },
          { x: 100, y: 2250, width: 144, height: 48, terrainType: 'pink_dirt' },
          { x: 600, y: 2150, width: 96, height: 48, terrainType: 'stone' },
          { x: 1000, y: 2050, width: 192, height: 48, terrainType: 'wood' }
        ],
        fruits: [
          { x: 450, y: 2930, fruitType: 'fruit_apple' },
          { x: 150, y: 2800, fruitType: 'fruit_bananas' },
          { x: 450, y: 2650, fruitType: 'fruit_cherries' },
          { x: 150, y: 2500, fruitType: 'fruit_kiwi' },
          { x: 450, y: 2350, fruitType: 'fruit_melon' },
          { x: 750, y: 2100, fruitType: 'fruit_orange' },
          { x: 150, y: 3050, fruitType: 'fruit_pineapple' },
          { x: 1050, y: 2000, fruitType: 'fruit_strawberry' }
        ],
        trophy: { x: 1096, y: 2034 }
      },
      {
        name: "Level 7: Precision Drops",
        width: 1280, height: 2500,
        startPosition: { x: 100, y: 300 },
        platforms: [
          { x: 50, y: 400, width: 144, height: 48, terrainType: 'stone' },
          { x: 300, y: 550, width: 96, height: 48, terrainType: 'dirt' },
          { x: 500, y: 700, width: 144, height: 48, terrainType: 'wood' },
          { x: 300, y: 850, width: 96, height: 48, terrainType: 'red_brick' },
          { x: 500, y: 1000, width: 144, height: 48, terrainType: 'green_block' },
          { x: 750, y: 1150, width: 96, height: 48, terrainType: 'pink_dirt' },
          { x: 950, y: 1300, width: 144, height: 48, terrainType: 'orange_dirt' },
          { x: 750, y: 1450, width: 96, height: 48, terrainType: 'stone' },
          { x: 500, y: 1600, width: 192, height: 48, terrainType: 'dirt' },
          { x: 800, y: 1750, width: 144, height: 48, terrainType: 'wood' }
        ],
        fruits: [
          { x: 350, y: 500, fruitType: 'fruit_apple' },
          { x: 350, y: 800, fruitType: 'fruit_bananas' },
          { x: 550, y: 950, fruitType: 'fruit_cherries' },
          { x: 1000, y: 1250, fruitType: 'fruit_kiwi' },
          { x: 550, y: 1550, fruitType: 'fruit_melon' },
          { x: 850, y: 1700, fruitType: 'fruit_orange' },
          { x: 80, y: 350, fruitType: 'fruit_pineapple' },
          { x: 800, y: 1400, fruitType: 'fruit_strawberry' }
        ],
        trophy: { x: 850, y: 1734 }
      },
      {
        name: "Level 8: Final Ascent",
        width: 1400, height: 3500,
        startPosition: { x: 100, y: 3300 },
        platforms: [
          { x: 50, y: 3400, width: 192, height: 48, terrainType: 'dirt' },
          { x: 350, y: 3250, width: 144, height: 48, terrainType: 'stone' },
          { x: 600, y: 3100, width: 96, height: 48, terrainType: 'wood' },
          { x: 850, y: 2950, width: 192, height: 48, terrainType: 'red_brick' },
          { x: 1100, y: 2800, width: 144, height: 48, terrainType: 'green_block' },
          { x: 850, y: 2650, width: 96, height: 48, terrainType: 'pink_dirt' },
          { x: 600, y: 2500, width: 192, height: 48, terrainType: 'orange_dirt' },
          { x: 350, y: 2350, width: 144, height: 48, terrainType: 'stone' },
          { x: 100, y: 2200, width: 96, height: 48, terrainType: 'dirt' },
          { x: 350, y: 2050, width: 192, height: 48, terrainType: 'wood' },
          { x: 650, y: 1900, width: 144, height: 48, terrainType: 'red_brick' },
          { x: 950, y: 1750, width: 192, height: 48, terrainType: 'green_block' }
        ],
        fruits: [
          { x: 400, y: 3200, fruitType: 'fruit_apple' },
          { x: 900, y: 2900, fruitType: 'fruit_bananas' },
          { x: 900, y: 2600, fruitType: 'fruit_cherries' },
          { x: 400, y: 2300, fruitType: 'fruit_kiwi' },
          { x: 150, y: 2150, fruitType: 'fruit_melon' },
          { x: 700, y: 1850, fruitType: 'fruit_orange' },
          { x: 100, y: 3350, fruitType: 'fruit_pineapple' },
          { x: 1000, y: 1700, fruitType: 'fruit_strawberry' }
        ],
        trophy: { x: 1046, y: 1734 }
      },
      {
        name: "Level 9: The Summit",
        width: 1280, height: 2000,
        startPosition: { x: 600, y: 1800 },
        platforms: [
          { x: 550, y: 1900, width: 192, height: 48, terrainType: 'stone' },
          { x: 300, y: 1780, width: 144, height: 48, terrainType: 'wood' },
          { x: 550, y: 1660, width: 96, height: 48, terrainType: 'dirt' },
          { x: 800, y: 1540, width: 192, height: 48, terrainType: 'red_brick' },
          { x: 550, y: 1420, width: 144, height: 48, terrainType: 'green_block' },
          { x: 300, y: 1300, width: 96, height: 48, terrainType: 'pink_dirt' },
          { x: 50, y: 1180, width: 192, height: 48, terrainType: 'orange_dirt' },
          { x: 300, y: 1030, width: 144, height: 48, terrainType: 'stone' },
          { x: 550, y: 880, width: 96, height: 48, terrainType: 'dirt' },
          { x: 800, y: 730, width: 192, height: 48, terrainType: 'wood' },
          { x: 1050, y: 580, width: 144, height: 48, terrainType: 'stone' },
        ],
        fruits: [
          { x: 350, y: 1730, fruitType: 'fruit_apple' },
          { x: 850, y: 1490, fruitType: 'fruit_bananas' },
          { x: 350, y: 1250, fruitType: 'fruit_cherries' },
          { x: 100, y: 1130, fruitType: 'fruit_kiwi' },
          { x: 600, y: 830, fruitType: 'fruit_melon' },
          { x: 850, y: 680, fruitType: 'fruit_orange' },
          { x: 600, y: 1850, fruitType: 'fruit_pineapple' },
          { x: 1100, y: 530, fruitType: 'fruit_strawberry' }
        ],
        trophy: { x: 1120, y: 564 }
      },
      {
        name: "Level 10: Defying Gravity",
        width: 1500, height: 1500,
        startPosition: { x: 100, y: 1300 },
        platforms: [
          { x: 50, y: 1400, width: 144, height: 48, terrainType: 'red_brick' },
          { x: 300, y: 1250, width: 96, height: 48, terrainType: 'stone' },
          { x: 500, y: 1100, width: 192, height: 48, terrainType: 'green_block' },
          { x: 800, y: 950, width: 144, height: 48, terrainType: 'pink_dirt' },
          { x: 1100, y: 800, width: 96, height: 48, terrainType: 'orange_dirt' },
          { x: 1300, y: 650, width: 144, height: 48, terrainType: 'wood' },
          { x: 1100, y: 500, width: 192, height: 48, terrainType: 'dirt' },
          { x: 800, y: 350, width: 96, height: 48, terrainType: 'stone' }
        ],
        fruits: [
          { x: 350, y: 1200, fruitType: 'fruit_apple' },
          { x: 850, y: 900, fruitType: 'fruit_bananas' },
          { x: 1350, y: 600, fruitType: 'fruit_cherries' },
          { x: 1150, y: 450, fruitType: 'fruit_kiwi' },
          { x: 850, y: 300, fruitType: 'fruit_melon' },
          { x: 100, y: 1200, fruitType: 'fruit_orange' },
          { x: 550, y: 1050, fruitType: 'fruit_pineapple' },
          { x: 1150, y: 750, fruitType: 'fruit_strawberry' }
        ],
        trophy: { x: 848, y: 334 }
      }
    ]
  },
  {
    name: "Jungle Journey",
    levels: [
      {
        name: "Level 1: Placeholder",
        width: 1600, height: 720,
        startPosition: { x: 100, y: 550 },
        platforms: [
          { x: 0, y: 600, width: 288, height: 48, terrainType: 'dirt' },
          { x: 450, y: 550, width: 96, height: 48, terrainType: 'wood' },
          { x: 700, y: 500, width: 192, height: 48, terrainType: 'stone' },
          { x: 1100, y: 600, width: 48, height: 48, terrainType: 'red_brick' },
          { x: 1250, y: 550, width: 48, height: 48, terrainType: 'red_brick' },
          { x: 1400, y: 500, width: 192, height: 48, terrainType: 'dirt' }
        ],
        fruits: [
          { x: 200, y: 550, fruitType: 'fruit_apple' },
          { x: 498, y: 500, fruitType: 'fruit_bananas' },
          { x: 1124, y: 550, fruitType: 'fruit_cherries' },
          { x: 1274, y: 500, fruitType: 'fruit_kiwi' },
        ],
        checkpoints: [
          { x: 796, y: 468 } 
        ],
        trophy: { x: 1496, y: 484 }
      }
    ]
  }
];

export const characterConfig = { // Unlock a character every 10 levels
  PinkMan: {
    name: "Pink Man",
    unlockRequirement: 0, // Default character
  },
  NinjaFrog: {
    name: "Ninja Frog",
    unlockRequirement: 10, 
  },
  MaskDude: {
    name: "Mask Dude",
    unlockRequirement: 20, 
  },
  VirtualGuy: {
    name: "Virtual Guy",
    unlockRequirement: 30, 
  },
};