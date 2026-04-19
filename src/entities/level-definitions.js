export const characterConfig = { 
  PinkMan: {
    name: "Pink Man",
    unlockRequirement: 0,
    description: "The reliable all-rounder.",
    stats: {
        maxJumps: 2,
        jumpForceMult: 1.0,
        maxDashes: 1,
        dashCooldownMult: 1.0,
        dashDurationMult: 1.0,
        ignoreSurfaceEffects: false,
        detectTraps: false
    }
  },
  NinjaFrog: {
    name: "Ninja Frog",
    unlockRequirement: 10, 
    description: "Triple Jump, -20% Jump Height.",
    stats: {
        maxJumps: 3,
        jumpForceMult: 0.8,
        maxDashes: 1,
        dashCooldownMult: 1.0,
        dashDurationMult: 1.0,
        ignoreSurfaceEffects: false,
        detectTraps: false
    }
  },
  MaskDude: {
    name: "Mask Dude",
    unlockRequirement: 20, 
    description: "Double Dash, Fast Cooldown, Short Dash.",
    stats: {
        maxJumps: 2,
        jumpForceMult: 1.0,
        maxDashes: 2,
        dashCooldownMult: 0.5,
        dashDurationMult: 0.8,
        ignoreSurfaceEffects: false,
        detectTraps: false
    }
  },
  VirtualGuy: {
    name: "Virtual Guy",
    unlockRequirement: 30, 
    description: "Immune to Ice/Mud, Sees Hidden Traps.",
    stats: {
        maxJumps: 2,
        jumpForceMult: 1.0,
        maxDashes: 1,
        dashCooldownMult: 1.0,
        dashDurationMult: 1.0,
        ignoreSurfaceEffects: true,
        detectTraps: true
    }
  },
};

export const levelSections = [
  {
    name: "Mechanical Mastery",
    levels: [
      { name: "Level 1", jsonPath: "/levels/mechanical-mastery/01.json" },
      { name: "Level 2", jsonPath: "/levels/mechanical-mastery/02.json" },
      { name: "Level 3", jsonPath: "/levels/mechanical-mastery/03.json" },
      { name: "Level 4", jsonPath: "/levels/mechanical-mastery/04.json" },
      { name: "Level 5", jsonPath: "/levels/mechanical-mastery/05.json" },
      { name: "Level 6", jsonPath: "/levels/mechanical-mastery/06.json" },
      { name: "Level 7", jsonPath: "/levels/mechanical-mastery/07.json" },
      { name: "Level 8", jsonPath: "/levels/mechanical-mastery/08.json" },
      { name: "Level 9", jsonPath: "/levels/mechanical-mastery/09.json" },
      { name: "Level 10", jsonPath: "/levels/mechanical-mastery/10.json" },
    ]
  },
  {
    name: "Sky High",
    levels: [
      { name: "Level 1", jsonPath: "/levels/sky-high/01.json" },
      { name: "Level 2", jsonPath: "/levels/sky-high/02.json" },
      { name: "Level 3", jsonPath: "/levels/sky-high/03.json" },
      { name: "Level 4", jsonPath: "/levels/sky-high/04.json" },
      { name: "Level 5", jsonPath: "/levels/sky-high/05.json" },
      { name: "Level 6", jsonPath: "/levels/sky-high/06.json" },
      { name: "Level 7", jsonPath: "/levels/sky-high/07.json" },
      { name: "Level 8", jsonPath: "/levels/sky-high/08.json" },
      { name: "Level 9", jsonPath: "/levels/sky-high/09.json" },
      { name: "Level 10", jsonPath: "/levels/sky-high/10.json" }
    ]
  },
  {
    name: "Jungle Journey",
    levels: [
      { name: "Level 1", jsonPath: "/levels/jungle-journey/01.json" },
      { name: "Level 2", jsonPath: "/levels/jungle-journey/02.json" },
      { name: "Level 3", jsonPath: "/levels/jungle-journey/03.json" },
      { name: "Level 4", jsonPath: "/levels/jungle-journey/04.json" },
      { name: "Level 5", jsonPath: "/levels/jungle-journey/05.json" },
      { name: "Level 6", jsonPath: "/levels/jungle-journey/06.json" },
      { name: "Level 7", jsonPath: "/levels/jungle-journey/07.json" },
      { name: "Level 8", jsonPath: "/levels/jungle-journey/08.json" },
      { name: "Level 9", jsonPath: "/levels/jungle-journey/09.json" },
      { name: "Level 10", jsonPath: "/levels/jungle-journey/10.json" },
    ]
  },
  /* 
  {
    name: "Crystal Caverns",
    levels: [
      { name: "Level 1", jsonPath: "/levels/crystal-caverns/01.json" },
      { name: "Level 2", jsonPath: "/levels/crystal-caverns/02.json" },
      { name: "Level 3", jsonPath: "/levels/crystal-caverns/03.json" },
      { name: "Level 4", jsonPath: "/levels/crystal-caverns/04.json" },
      { name: "Level 5", jsonPath: "/levels/crystal-caverns/05.json" },
      { name: "Level 6", jsonPath: "/levels/crystal-caverns/06.json" },
      { name: "Level 7", jsonPath: "/levels/crystal-caverns/07.json" },
      { name: "Level 8", jsonPath: "/levels/crystal-caverns/08.json" },
      { name: "Level 9", jsonPath: "/levels/crystal-caverns/09.json" },
      { name: "Level 10", jsonPath: "/levels/crystal-caverns/10.json" },
    ]
  },
  */
  {
    name: "DIY",
    levels: []
  }
];