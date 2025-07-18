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
        jsonPath: "levels/sky-high/01.json"
      },
      {
        name: "Level 2: Stratosphere Hop",
        jsonPath: "levels/sky-high/02.json"
      },
      {
        name: "Level 3: Celestial Ascent",
        jsonPath: "levels/sky-high/03.json"
      },
      {
        name: "Level 4: Dash Gauntlet",
        jsonPath: "levels/sky-high/04.json"
      },
      {
        name: "Level 5: Leaps of Faith",
        jsonPath: "levels/sky-high/05.json"
      },
      {
        name: "Level 6: Zigging and Zagging",
        jsonPath: "levels/sky-high/06.json"
      },
      {
        name: "Level 7: Precision Drops",
        jsonPath: "levels/sky-high/07.json"
      },
      {
        name: "Level 8: Final Ascent",
        jsonPath: "levels/sky-high/08.json"
      },
      {
        name: "Level 9: The Summit",
        jsonPath: "levels/sky-high/09.json"
      },
      {
        name: "Level 10: Defying Gravity",
        jsonPath: "levels/sky-high/10.json"
      }
    ]
  },
  {
    name: "Jungle Journey",
    levels: [
      {
        name: "Level 1: Test Level",
        width: 1800, height: 720,
        startPosition: { x: 100, y: 550 },
        platforms: [
          // Start area
          { x: 0, y: 600, width: 288, height: 120, terrainType: 'dirt' },
          // Sand pit
          { x: 350, y: 650, width: 384, height: 70, terrainType: 'sand' },
          // Mud slope
          { x: 800, y: 600, width: 288, height: 120, terrainType: 'mud' },
          { x: 950, y: 550, width: 192, height: 170, terrainType: 'mud' },
          // Ice bridge
          { x: 1250, y: 500, width: 400, height: 48, terrainType: 'ice' },
          // End platform
          { x: 1700, y: 450, width: 96, height: 270, terrainType: 'stone' }
        ],
        fruits: [
          { x: 542, y: 600, fruitType: 'fruit_pineapple' },
          { x: 1046, y: 500, fruitType: 'fruit_orange' },
          { x: 1450, y: 450, fruitType: 'fruit_strawberry' },
        ],
        checkpoints: [
          { x: 896, y: 568 },
          { x: 1298, y: 468 }
        ],
        trophy: { x: 1748, y: 434 }
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