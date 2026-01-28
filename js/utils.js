// D&D 5E NPC Generator - Utility Functions (random, dice, modifiers)

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Weighted random choice - weights object maps items to their relative weights
function weightedRandomChoice(items, weights) {
    const totalWeight = items.reduce((sum, item) => sum + (weights[item] || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
        random -= weights[item] || 1;
        if (random <= 0) {
            return item;
        }
    }
    return items[items.length - 1];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollAbilityScore() {
    // Roll 4d6, drop lowest
    const rolls = [];
    for (let i = 0; i < 4; i++) {
        rolls.push(randomInt(1, 6));
    }
    rolls.sort((a, b) => b - a);
    return rolls[0] + rolls[1] + rolls[2];
}

function getModifier(score) {
    return Math.floor((score - 10) / 2);
}

function formatModifier(mod) {
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Maturity ages from D&D 5e lore - when each race is considered a young adult
const maturityAges = {
    'aarakocra': 3,
    'aasimar': 18,
    'astral elf': 100,
    'autognome': 2,
    'bugbear': 16,
    'centaur': 15,
    'changeling': 15,
    'deep gnome': 25,
    'dhampir': 18,
    'dragonborn': 15,
    'duergar': 50,
    'dwarf': 50,
    'eladrin': 100,
    'elf': 100,
    'fairy': 20,
    'firbolg': 30,
    'genasi': 18,
    'giff': 18,
    'githyanki': 18,
    'githzerai': 18,
    'gnome': 40,
    'goblin': 8,
    'goliath': 18,
    'grung': 1,
    'hadozee': 14,
    'half-elf': 20,
    'half-orc': 14,
    'halfling': 20,
    'harengon': 20,
    'hexblood': 18,
    'hobgoblin': 14,
    'human': 18,
    'kalashtar': 18,
    'kender': 20,
    'kenku': 12,
    'kobold': 6,
    'leonin': 17,
    'lizardfolk': 14,
    'locathah': 10,
    'loxodon': 60,
    'minotaur': 17,
    'orc': 12,
    'owlin': 18,
    'plasmoid': 1,
    'reborn': 18,
    'satyr': 20,
    'sea elf': 100,
    'shadar-kai': 100,
    'shifter': 10,
    'simic hybrid': 18,
    'tabaxi': 15,
    'thri-kreen': 7,
    'tiefling': 18,
    'tortle': 15,
    'triton': 15,
    'vedalken': 40,
    'verdan': 24,
    'warforged': 2,
    'yuan-ti': 12
};

