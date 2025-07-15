// Level configurations organized in sections for easy access and iteration
// Each section is an array of levels; each level is a plain object

export const levelSections = [
  // Section 1: Basic Mechanics
  [
    {
      name: "Level 1: It's Too Easy",
      width: 1320, height: 720,
      startPosition: { x: 50, y: 300 },
      // Platforms: minimal structure, only essential properties
      platforms: [
        { x: 0, y: 400, width: 192, height: 48, terrainType: 'dirt' },
        { x: 300, y: 350, width: 144, height: 48, terrainType: 'wood' },
        { x: 550, y: 300, width: 96, height: 48, terrainType: 'stone' },
        { x: 750, y: 250, width: 192, height: 48, terrainType: 'dirt' },
        { x: 1050, y: 350, width: 144, height: 48, terrainType: 'wood' }
      ],
      // Fruits: array of collectible items
      fruits: [
        { x: 100, y: 275, fruitType: 'fruit_apple' },
        { x: 375, y: 300, fruitType: 'fruit_bananas' },
        { x: 600, y: 250, fruitType: 'fruit_cherries' },
        { x: 850, y: 200, fruitType: 'fruit_kiwi' },
        { x: 1000, y: 150, fruitType: 'fruit_melon' },
        { x: 225, y: 320, fruitType: 'fruit_orange' },
        { x: 475, y: 270, fruitType: 'fruit_pineapple' },
        { x: 675, y: 220, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1125, y: 334 }
    },
    {
      name: "Level 2: Big Drop",
      width: 1320, height: 720,
      startPosition: { x: 50, y: 350 },
      platforms: [
        { x: 0, y: 400, width: 192, height: 48, terrainType: 'dirt' },
        { x: 300, y: 320, width: 96, height: 48, terrainType: 'stone' },
        { x: 450, y: 240, width: 144, height: 48, terrainType: 'wood' },
        { x: 700, y: 160, width: 144, height: 48, terrainType: 'dirt' },
        { x: 1000, y: 600, width: 144, height: 48, terrainType: 'stone' }
      ],
      fruits: [
        { x: 75, y: 250, fruitType: 'fruit_apple' },
        { x: 300, y: 270, fruitType: 'fruit_bananas' },
        { x: 525, y: 190, fruitType: 'fruit_cherries' },
        { x: 800, y: 110, fruitType: 'fruit_kiwi' },
        { x: 1000, y: 100, fruitType: 'fruit_melon' },
        { x: 250, y: 500, fruitType: 'fruit_orange' },
        { x: 650, y: 110, fruitType: 'fruit_pineapple' },
        { x: 950, y: 190, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1120, y: 584 }
    },
    {
      name: "Level 3: Ups & Downs",
      width: 1400, height: 720,
      startPosition: { x: 50, y: 350 },
      platforms: [
        { x: 0, y: 400, width: 144, height: 48, terrainType: 'dirt' },
        { x: 200, y: 350, width: 96, height: 48, terrainType: 'wood' },
        { x: 350, y: 500, width: 96, height: 48, terrainType: 'stone' }, 
        { x: 600, y: 350, width: 96, height: 48, terrainType: 'dirt' },   
        { x: 800, y: 200, width: 144, height: 48, terrainType: 'wood' },
        { x: 1050, y: 300, width: 192, height: 48, terrainType: 'stone' }
      ],
      fruits: [
        { x: 50, y: 250, fruitType: 'fruit_apple' },
        { x: 240, y: 300, fruitType: 'fruit_bananas' },
        { x: 230, y: 500, fruitType: 'fruit_cherries' },
        { x: 650, y: 300, fruitType: 'fruit_kiwi' },
        { x: 850, y: 150, fruitType: 'fruit_melon' },
        { x: 1150, y: 250, fruitType: 'fruit_orange' },
        { x: 500, y: 450, fruitType: 'fruit_pineapple' },
        { x: 1000, y: 300, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1200, y: 284 }
    },
    {
      name: "Level 4: Sky Climb",
      width: 1280, height: 720,
      startPosition: { x: 50, y: 600 },
      platforms: [
        { x: 0, y: 650, width: 192, height: 48, terrainType: 'dirt' },
        { x: 200, y: 550, width: 96, height: 48, terrainType: 'stone' },
        { x: 350, y: 450, width: 144, height: 48, terrainType: 'wood' },
        { x: 550, y: 350, width: 96, height: 48, terrainType: 'dirt' },
        { x: 700, y: 250, width: 192, height: 48, terrainType: 'stone' },
        { x: 950, y: 150, width: 144, height: 48, terrainType: 'wood' }
      ],
      fruits: [
        { x: 100, y: 450, fruitType: 'fruit_apple' },
        { x: 240, y: 500, fruitType: 'fruit_bananas' },
        { x: 400, y: 600, fruitType: 'fruit_cherries' },
        { x: 600, y: 300, fruitType: 'fruit_kiwi' },
        { x: 800, y: 200, fruitType: 'fruit_melon' },
        { x: 1020, y: 50, fruitType: 'fruit_orange' },
        { x: 500, y: 400, fruitType: 'fruit_pineapple' },
        { x: 900, y: 100, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1020, y: 134 }
    },
    {
      name: "Level 5: Colorful Blocks",
      width: 1400, height: 720,
      startPosition: { x: 50, y: 350 },
      platforms: [
        { x: 0, y: 400, width: 144, height: 48, terrainType: 'green_block' },
        { x: 350, y: 300, width: 144, height: 48, terrainType: 'pink_dirt' },
        { x: 550, y: 400, width: 96, height: 48, terrainType: 'red_brick' },
        { x: 800, y: 250, width: 144, height: 48, terrainType: 'orange_dirt' },
        { x: 1050, y: 300, width: 96, height: 48, terrainType: 'dirt' }
      ],
      fruits: [
        { x: 80, y: 300, fruitType: 'fruit_apple' },
        { x: 240, y: 300, fruitType: 'fruit_bananas' },
        { x: 420, y: 250, fruitType: 'fruit_cherries' },
        { x: 630, y: 350, fruitType: 'fruit_kiwi' },
        { x: 870, y: 200, fruitType: 'fruit_melon' },
        { x: 1200, y: 175, fruitType: 'fruit_orange' },
        { x: 800, y: 350, fruitType: 'fruit_pineapple' },
        { x: 1000, y: 100, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1080, y: 284 }
    },
    {
      name: "Level 6: Narrow Paths",
      width: 1280, height: 720,
      startPosition: { x: 50, y: 350 },
      platforms: [
        { x: 0, y: 400, width: 96, height: 48, terrainType: 'dirt' },
        { x: 150, y: 350, width: 48, height: 48, terrainType: 'stone' },
        { x: 250, y: 300, width: 48, height: 48, terrainType: 'wood' },
        { x: 350, y: 500, width: 48, height: 48, terrainType: 'red_brick' },
        { x: 450, y: 250, width: 48, height: 48, terrainType: 'green_block' },
        { x: 600, y: 400, width: 48, height: 48, terrainType: 'pink_dirt' },
        { x: 750, y: 300, width: 96, height: 48, terrainType: 'orange_dirt' },
        { x: 950, y: 200, width: 144, height: 48, terrainType: 'stone' }
      ],
      fruits: [
        { x: 180, y: 300, fruitType: 'fruit_apple' },
        { x: 280, y: 250, fruitType: 'fruit_bananas' },
        { x: 380, y: 450, fruitType: 'fruit_cherries' },
        { x: 480, y: 200, fruitType: 'fruit_kiwi' },
        { x: 630, y: 350, fruitType: 'fruit_melon' },
        { x: 800, y: 250, fruitType: 'fruit_orange' },
        { x: 950, y: 300, fruitType: 'fruit_pineapple' },
        { x: 550, y: 350, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1020, y: 184 }
    },
    {
      name: "Level 7: Stairway",
      width: 1280, height: 720,
      startPosition: { x: 50, y: 600 },
      platforms: [
        { x: 0, y: 650, width: 144, height: 48, terrainType: 'dirt' },
        { x: 200, y: 550, width: 144, height: 48, terrainType: 'wood' },
        { x: 400, y: 450, width: 144, height: 48, terrainType: 'stone' },
        { x: 600, y: 350, width: 144, height: 48, terrainType: 'green_block' },
        { x: 800, y: 250, width: 144, height: 48, terrainType: 'orange_dirt' },
        { x: 1000, y: 150, width: 144, height: 48, terrainType: 'red_brick' }
      ],
      fruits: [
        { x: 80, y: 500, fruitType: 'fruit_apple' },
        { x: 270, y: 650, fruitType: 'fruit_bananas' },
        { x: 470, y: 600, fruitType: 'fruit_cherries' },
        { x: 300, y: 250, fruitType: 'fruit_kiwi' },
        { x: 870, y: 220, fruitType: 'fruit_melon' },
        { x: 1070, y: 250, fruitType: 'fruit_orange' },
        { x: 350, y: 400, fruitType: 'fruit_pineapple' },
        { x: 600, y: 100, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1070, y: 134 }
    },
    {
      name: "Level 8: Bottomless",
      width: 1320, height: 720,
      startPosition: { x: 50, y: 350 },
      platforms: [
        { x: 0, y: 400, width: 96, height: 48, terrainType: 'dirt' },
        { x: 200, y: 500, width: 96, height: 48, terrainType: 'stone' },  
        { x: 350, y: 350, width: 96, height: 48, terrainType: 'wood' },    
        { x: 500, y: 500, width: 96, height: 48, terrainType: 'red_brick' },
        { x: 700, y: 300, width: 48, height: 48, terrainType: 'green_block' },
        { x: 900, y: 450, width: 96, height: 48, terrainType: 'pink_dirt' },
        { x: 1100, y: 350, width: 144, height: 48, terrainType: 'orange_dirt' }
      ],
      fruits: [
        { x: 40, y: 300, fruitType: 'fruit_apple' },
        { x: 240, y: 450, fruitType: 'fruit_bananas' },
        { x: 390, y: 300, fruitType: 'fruit_cherries' },
        { x: 540, y: 450, fruitType: 'fruit_kiwi' },
        { x: 770, y: 250, fruitType: 'fruit_melon' },
        { x: 950, y: 400, fruitType: 'fruit_orange' },
        { x: 1170, y: 200, fruitType: 'fruit_pineapple' },
        { x: 650, y: 450, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1170, y: 334 }
    },
    {
      name: "Level 9: Aerial Mastery",
      width: 1320, height: 720,
      startPosition: { x: 50, y: 250 },
      platforms: [
        { x: 0, y: 300, width: 96, height: 48, terrainType: 'dirt' },
        { x: 150, y: 200, width: 48, height: 48, terrainType: 'stone' },   
        { x: 250, y: 350, width: 48, height: 48, terrainType: 'wood' },   
        { x: 400, y: 150, width: 96, height: 48, terrainType: 'green_block' },
        { x: 600, y: 250, width: 48, height: 48, terrainType: 'red_brick' },   
        { x: 750, y: 180, width: 96, height: 48, terrainType: 'orange_dirt' },
        { x: 950, y: 300, width: 48, height: 48, terrainType: 'pink_dirt' },
        { x: 1100, y: 220, width: 144, height: 48, terrainType: 'stone' }
      ],
      fruits: [
        { x: 180, y: 150, fruitType: 'fruit_apple' },
        { x: 280, y: 300, fruitType: 'fruit_bananas' },
        { x: 440, y: 100, fruitType: 'fruit_cherries' },
        { x: 630, y: 200, fruitType: 'fruit_kiwi' },
        { x: 790, y: 130, fruitType: 'fruit_melon' },
        { x: 980, y: 250, fruitType: 'fruit_orange' },
        { x: 1150, y: 350, fruitType: 'fruit_pineapple' },
        { x: 500, y: 300, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1170, y: 204 }
    },
    {
      name: "Level 10: Introduction Finale",
      width: 1320, height: 720,
      startPosition: { x: 50, y: 350 },
      platforms: [
        { x: 0, y: 400, width: 96, height: 48, terrainType: 'dirt' },
        { x: 200, y: 500, width: 96, height: 48, terrainType: 'stone' },
        { x: 350, y: 350, width: 48, height: 48, terrainType: 'wood' },      
        { x: 500, y: 150, width: 144, height: 48, terrainType: 'red_brick' }, 
        { x: 700, y: 400, width: 96, height: 48, terrainType: 'green_block' },
        { x: 900, y: 300, width: 144, height: 48, terrainType: 'orange_dirt' },
        { x: 1100, y: 200, width: 96, height: 48, terrainType: 'pink_dirt' } 
      ],
      fruits: [
        { x: 40, y: 300, fruitType: 'fruit_apple' },
        { x: 240, y: 450, fruitType: 'fruit_bananas' },
        { x: 380, y: 300, fruitType: 'fruit_cherries' },
        { x: 570, y: 100, fruitType: 'fruit_kiwi' },
        { x: 740, y: 350, fruitType: 'fruit_melon' },
        { x: 970, y: 250, fruitType: 'fruit_orange' },
        { x: 1150, y: 150, fruitType: 'fruit_pineapple' },
        { x: 600, y: 350, fruitType: 'fruit_strawberry' }
      ],
      trophy: { x: 1140, y: 184 }
    },
  ],
  // Section 2: Cloud 9 and Beyond
  [
    {
      name: "Level 11: Cloud 7",
      width: 1280,
      height: 2160,
      startPosition: { x: 600, y: 2050 }, // Start near the bottom
      platforms: [
        { x: 400, y: 2100, width: 480, height: 60, terrainType: 'stone' },
      ],
      fruits: [
        null
      ],
      // Trophy at the very top
      trophy: { x: null, y: null }
    }
  ]
];