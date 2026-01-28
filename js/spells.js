// D&D 5E NPC Generator - Spell Functions

function getClassSpells(className) {
    return Object.keys(spells).filter(spellId => {
        const spell = spells[spellId];
        return spell.classes.includes(className);
    });
}

// Get spells filtered by level
function getSpellsByLevel(spellList, level) {
    return spellList.filter(spellId => spells[spellId].level === level);
}

// Get max spell level a caster can cast
function getMaxSpellLevel(classLevel, casterType) {
    if (casterType === 'full') {
        if (classLevel >= 17) return 9;
        if (classLevel >= 15) return 8;
        if (classLevel >= 13) return 7;
        if (classLevel >= 11) return 6;
        if (classLevel >= 9) return 5;
        if (classLevel >= 7) return 4;
        if (classLevel >= 5) return 3;
        if (classLevel >= 3) return 2;
        return 1;
    } else if (casterType === 'half') {
        if (classLevel >= 17) return 5;
        if (classLevel >= 13) return 4;
        if (classLevel >= 9) return 3;
        if (classLevel >= 5) return 2;
        if (classLevel >= 2) return 1;
        return 0;
    } else if (casterType === 'third') {
        if (classLevel >= 19) return 4;
        if (classLevel >= 13) return 3;
        if (classLevel >= 7) return 2;
        if (classLevel >= 3) return 1;
        return 0;
    } else if (casterType === 'pact') {
        if (classLevel >= 9) return 5;
        if (classLevel >= 7) return 4;
        if (classLevel >= 5) return 3;
        if (classLevel >= 3) return 2;
        return 1;
    }
    return 0;
}

// Calculate spells for a character
function calculateSpells(characterClass, level, modifiers, subclassId = null) {
    // Check if this class/subclass can cast spells
    let spellRules = null;
    let spellClassName = characterClass;
    
    // Check for subclass spellcasting (Eldritch Knight, Arcane Trickster)
    if (subclassId === 'eldritch-knight') {
        spellRules = spellcastingRules['eldritch-knight'];
        spellClassName = 'wizard'; // Uses wizard spell list with restrictions
    } else if (subclassId === 'arcane-trickster') {
        spellRules = spellcastingRules['arcane-trickster'];
        spellClassName = 'wizard'; // Uses wizard spell list with restrictions
    } else if (spellcastingRules[characterClass]) {
        spellRules = spellcastingRules[characterClass];
    }
    
    // Not a spellcaster
    if (!spellRules || level < spellRules.startLevel) {
        return null;
    }

    const casterLevel = level;
    const abilityMod = modifiers[spellRules.ability] || 0;
    
    // Calculate spell slots
    const slotTable = spellSlotTable[spellRules.casterType];
    const spellSlots = slotTable[casterLevel - 1] || [0,0,0,0,0,0,0,0,0];
    
    // Calculate cantrips known
    const cantripsKnown = spellRules.cantripsKnown[casterLevel - 1] || 0;
    
    // Calculate spells known/prepared
    let spellsKnownCount;
    if (spellRules.spellsKnown) {
        spellsKnownCount = spellRules.spellsKnown[casterLevel - 1] || 0;
    } else if (spellRules.spellsKnownFormula) {
        spellsKnownCount = spellRules.spellsKnownFormula(casterLevel, abilityMod);
    } else {
        spellsKnownCount = Math.max(1, abilityMod + casterLevel);
    }
    
    // Get available spells for this class
    const classSpells = getClassSpells(spellClassName);
    const maxSpellLevel = getMaxSpellLevel(casterLevel, spellRules.casterType);
    
    // Filter by school restrictions if any (for Eldritch Knight, Arcane Trickster)
    let availableSpells = classSpells.filter(spellId => {
        const spell = spells[spellId];
        if (spell.level > maxSpellLevel) return false;
        if (spell.level === 0) return true; // Cantrips always allowed
        if (spellRules.restrictedSchools) {
            // Most spells must be from restricted schools, but some can be from any school
            return spellRules.restrictedSchools.includes(spell.school);
        }
        return true;
    });
    
    // Select cantrips
    const availableCantrips = availableSpells.filter(id => spells[id].level === 0);
    const selectedCantrips = [];
    const cantripsCopy = [...availableCantrips];
    for (let i = 0; i < cantripsKnown && cantripsCopy.length > 0; i++) {
        const idx = Math.floor(Math.random() * cantripsCopy.length);
        selectedCantrips.push(cantripsCopy.splice(idx, 1)[0]);
    }
    
    // Select leveled spells (distribute across available levels)
    const selectedSpells = [];
    const availableLeveledSpells = availableSpells.filter(id => spells[id].level > 0 && spells[id].level <= maxSpellLevel);
    
    // Try to get a mix of spell levels, favoring lower levels
    const leveledCopy = [...availableLeveledSpells];
    for (let i = 0; i < spellsKnownCount && leveledCopy.length > 0; i++) {
        // Weight towards lower level spells
        const weights = leveledCopy.map(id => Math.max(1, maxSpellLevel - spells[id].level + 1));
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        let idx = 0;
        for (let j = 0; j < weights.length; j++) {
            random -= weights[j];
            if (random <= 0) {
                idx = j;
                break;
            }
        }
        selectedSpells.push(leveledCopy.splice(idx, 1)[0]);
    }
    
    // Calculate spell save DC and spell attack bonus
    const spellSaveDC = 8 + modifiers[spellRules.ability] + getProficiencyBonus(level);
    const spellAttackBonus = modifiers[spellRules.ability] + getProficiencyBonus(level);
    
    return {
        ability: spellRules.ability,
        abilityMod: abilityMod,
        saveDC: spellSaveDC,
        attackBonus: spellAttackBonus,
        casterType: spellRules.casterType,
        spellSlots: spellSlots,
        cantrips: selectedCantrips,
        spells: selectedSpells,
        cantripsKnown: cantripsKnown,
        spellsKnownCount: spellsKnownCount,
        maxSpellLevel: maxSpellLevel
    };
}

