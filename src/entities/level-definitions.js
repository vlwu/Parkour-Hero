// Level configurations organized in sections for easy access and iteration
// Each section is an object containing a name and an array of level configurations.

export const levelSections = [
  {
    name: "Basic Mechanics",
    levels: [
      {
        name: "Level 1",
        jsonPath: "levels/basic-mechanics/01.json"
      },
      {
        name: "Level 2",
        jsonPath: "levels/basic-mechanics/02.json"
      },
      {
        name: "Level 3",
        jsonPath: "levels/basic-mechanics/03.json"
      },
      {
        name: "Level 4",
        jsonPath: "levels/basic-mechanics/04.json"
      },
      {
        name: "Level 5",
        jsonPath: "levels/basic-mechanics/05.json"
      },
      {
        name: "Level 6",
        jsonPath: "levels/basic-mechanics/06.json"
      },
      {
        name: "Level 7",
        jsonPath: "levels/basic-mechanics/07.json"
      },
      {
        name: "Level 8",
        jsonPath: "levels/basic-mechanics/08.json"
      },
      {
        name: "Level 9",
        jsonPath: "levels/basic-mechanics/09.json"
      },
      {
        name: "Level 10",
        jsonPath: "levels/basic-mechanics/10.json"
      },
    ]
  },
  {
    name: "Sky High",
    levels: [
      {
        name: "Level 1",
        jsonPath: "levels/sky-high/01.json"
      },
      {
        name: "Level 2",
        jsonPath: "levels/sky-high/02.json"
      },
      {
        name: "Level 3",
        jsonPath: "levels/sky-high/03.json"
      },
      {
        name: "Level 4",
        jsonPath: "levels/sky-high/04.json"
      },
      {
        name: "Level 5",
        jsonPath: "levels/sky-high/05.json"
      },
      {
        name: "Level 6",
        jsonPath: "levels/sky-high/06.json"
      },
      {
        name: "Level 7",
        jsonPath: "levels/sky-high/07.json"
      },
      {
        name: "Level 8",
        jsonPath: "levels/sky-high/08.json"
      },
      {
        name: "Level 9",
        jsonPath: "levels/sky-high/09.json"
      },
      {
        name: "Level 10",
        jsonPath: "levels/sky-high/10.json"
      }
    ]
  },
  {
    name: "Jungle Journey",
    levels: [
      {
        name: "Wall Jump Test Chamber",
        width: 1280, height: 720,
        startPosition: { x: 100, y: 600 },
        platforms: [
          // Floor
          { x: 0, y: 680, width: 1280, height: 48, terrainType: 'dirt' },
          
          // First wall jump section
          { x: 350, y: 400, width: 48, height: 288, terrainType: 'stone' },
          { x: 550, y: 200, width: 48, height: 288, terrainType: 'stone' },
          
          // Landing platform
          { x: 350, y: 150, width: 240, height: 48, terrainType: 'wood' },

          // A non-climbable wall for testing
          { x: 800, y: 400, width: 48, height: 288, terrainType: 'dirt' },
          
          // Trophy platform
          { x: 1000, y: 632, width: 128, height: 48, terrainType: 'stone' },
        ],
        fruits: [
          { x: 474, y: 100, fruitType: 'fruit_cherries' }
        ],
        checkpoints: [
          { x: 1190, y: 640 }
        ],
        trophy: { x: 1064, y: 616 }
      }
    ]
  },
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