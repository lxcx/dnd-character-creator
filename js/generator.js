// D&D 5E NPC Generator - NPC Generation (age, stats, backstory)

function generateAge(category, race) {
    // Get lifespan and maturity age for the race
    const raceKey = race.toLowerCase();
    const lifespan = races[raceKey]?.lifespan || 80;
    const maturity = maturityAges[raceKey] || 18;
    
    // Calculate age ranges based on maturity and lifespan
    // Young Adult starts at maturity, other stages scale from there
    const adultEnd = maturity + Math.floor((lifespan - maturity) * 0.35);      // ~35% into adult life
    const matureEnd = maturity + Math.floor((lifespan - maturity) * 0.70);     // ~70% into adult life
    
    // Age ranges based on maturity
    const ageRanges = {
        'infant': [0, Math.floor(maturity * 0.25)],                            // 0-25% of maturity
        'child': [Math.floor(maturity * 0.25), Math.floor(maturity * 0.85)],   // 25-85% of maturity
        'young-adult': [maturity, adultEnd],                                    // Maturity to 35% of adult life
        'adult': [adultEnd, matureEnd],                                         // 35-70% of adult life
        'mature': [matureEnd, Math.floor(lifespan * 0.90)],                     // 70-90% of lifespan
        'elderly': [Math.floor(lifespan * 0.90), lifespan]                      // 90-100% of lifespan
    };
    
    if (category === 'random') {
        category = randomChoice(Object.keys(ageRanges));
    }
    
    let [minAge, maxAge] = ageRanges[category];
    
    // Ensure minimum reasonable ages that make narrative sense
    // Even for short-lived races, these categories should feel appropriate
    const minimums = { 
        'infant': 0,       // Newborns are fine
        'child': 2,        // Old enough to walk and communicate
        'young-adult': 6,  // Old enough to be somewhat independent
        'adult': 12,       // Old enough to have responsibilities
        'mature': 25,      // Old enough to have life experience
        'elderly': 40      // Old enough to feel aged
    };
    minAge = Math.max(minAge, minimums[category]);
    maxAge = Math.max(maxAge, minAge + 1);
    
    return randomInt(minAge, maxAge);
}

function generateNPC() {
    // Get form values
    const race = document.getElementById('race').value;
    const npcClass = document.getElementById('npcClass').value;
    const occupation = document.getElementById('occupation').value;
    const ageCategory = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const alignment = document.getElementById('alignment').value;
    // Determine values, respecting locks (use locked value if available)
    let selectedRace, selectedClass, selectedOccupation, selectedGender, selectedAlignment, age;
    let selectedAgeCategory;

    // Race - locked or generate new
    if (lockStates.race && currentNPC) {
        selectedRace = currentNPC.race;
    } else {
        selectedRace = race === 'random' ? randomChoice(Object.keys(races)) : race;
    }

    // Gender - locked or generate new (needed for name generation)
    if (lockStates.gender && currentNPC) {
        selectedGender = currentNPC.gender;
    } else {
        selectedGender = gender === 'random' ? randomChoice(['male', 'female', 'non-binary']) : gender;
    }

    // Alignment - locked or generate new
    if (lockStates.alignment && currentNPC) {
        selectedAlignment = currentNPC.alignment;
    } else {
        selectedAlignment = alignment === 'random' ? randomChoice(alignments) : alignment;
    }

    // Background (for PC mode)
    let selectedBackground = null;
    let backgroundData = null;
    if (isPCMode()) {
        const bgSelect = document.getElementById('background');
        const bgValue = bgSelect ? bgSelect.value : 'random';
        selectedBackground = bgValue === 'random' ? randomChoice(Object.keys(backgrounds)) : bgValue;
        backgroundData = backgrounds[selectedBackground];
    }

    // Determine if infant is allowed based on class and occupation selections
    // Infant is NOT allowed if:
    // - Class is explicitly set to non-commoner (not random, not commoner)
    // - Occupation is explicitly set to non-infant (not random, not infant)
    // - Any multiclasses are set (adventurer training means no infants)
    const classBlocksInfant = npcClass !== 'random' && npcClass !== 'commoner';
    const occupationBlocksInfant = occupation !== 'random' && occupation !== 'infant';
    const hasMulticlasses = multiclasses.length > 0;
    const infantAllowed = !classBlocksInfant && !occupationBlocksInfant && !hasMulticlasses;

    // Age - locked or generate new (determine before class and occupation)
    if (lockStates.age && currentNPC) {
        age = currentNPC.age;
        selectedAgeCategory = determineAgeCategory(age, selectedRace);
        // If locked age is infant but infant not allowed, regenerate
        if (selectedAgeCategory === 'infant' && !infantAllowed) {
            selectedAgeCategory = 'child'; // Fall back to child
            age = generateAge(selectedAgeCategory, selectedRace);
        }
    } else {
        // Build list of allowed age categories
        let allowedAgeCategories = ['infant', 'child', 'young-adult', 'adult', 'mature', 'elderly'];
        if (!infantAllowed) {
            allowedAgeCategories = allowedAgeCategories.filter(a => a !== 'infant');
        }
        
        // Age category weights: 10% infant, 10% child, 20% for others
        const ageCategoryWeights = {
            'infant': 10,
            'child': 10,
            'young-adult': 20,
            'adult': 20,
            'mature': 20,
            'elderly': 20
        };
        
        if (ageCategory === 'random') {
            selectedAgeCategory = weightedRandomChoice(allowedAgeCategories, ageCategoryWeights);
        } else if (ageCategory === 'infant' && !infantAllowed) {
            // User selected infant but it's not allowed, fall back to child
            selectedAgeCategory = 'child';
        } else {
            selectedAgeCategory = ageCategory;
        }
        age = generateAge(selectedAgeCategory, selectedRace);
    }

    // Class - locked or generate new
    // Infants are always commoners
    let characterClasses = []; // Array of {className, level}
    
    if (selectedAgeCategory === 'infant') {
        selectedClass = 'commoner';
        characterClasses = [{ className: 'commoner', level: 0 }];
    } else if (lockStates.npcClass && currentNPC && currentNPC.characterClasses) {
        characterClasses = [...currentNPC.characterClasses];
        selectedClass = characterClasses[0]?.className || 'commoner';
    } else {
        const adventurerClasses = Object.keys(classes).filter(c => c !== 'commoner');
        selectedClass = npcClass === 'random' ? randomChoice(adventurerClasses) : npcClass;
        
        if (selectedClass === 'commoner') {
            characterClasses = [{ className: 'commoner', level: 0, subclass: null }];
            
            // Add multiclasses for commoners (retired adventurers, etc.)
            multiclasses.forEach(mc => {
                const mcSubclassData = subclasses[mc.className];
                let mcSubclass = mc.subclass;
                // If random or not set, pick a random subclass if level is high enough
                if ((!mcSubclass || mcSubclass === 'random') && mcSubclassData && mc.level >= mcSubclassData.level) {
                    mcSubclass = randomChoice(mcSubclassData.options).id;
                } else if (!mcSubclassData || mc.level < mcSubclassData.level) {
                    mcSubclass = null;
                }
                characterClasses.push({ className: mc.className, level: mc.level, subclass: mcSubclass });
            });
        } else {
            // Get main class level from form
            const mainLevel = parseInt(document.getElementById('npcClassLevel').value) || 1;
            
            // Get subclass
            const subclassSelect = document.getElementById('npcSubclass');
            let selectedSubclass = subclassSelect.value;
            const subclassData = subclasses[selectedClass];
            
            // If random or level not high enough, pick a random one
            if (selectedSubclass === 'random' && subclassData && mainLevel >= subclassData.level) {
                selectedSubclass = randomChoice(subclassData.options).id;
            } else if (!subclassData || mainLevel < subclassData.level) {
                selectedSubclass = null;
            }
            
            characterClasses = [{ className: selectedClass, level: mainLevel, subclass: selectedSubclass }];
            
            // Add multiclasses (with random subclasses)
            multiclasses.forEach(mc => {
                const mcSubclassData = subclasses[mc.className];
                let mcSubclass = mc.subclass;
                // If random or not set, pick a random subclass if level is high enough
                if ((!mcSubclass || mcSubclass === 'random') && mcSubclassData && mc.level >= mcSubclassData.level) {
                    mcSubclass = randomChoice(mcSubclassData.options).id;
                } else if (!mcSubclassData || mc.level < mcSubclassData.level) {
                    mcSubclass = null;
                }
                characterClasses.push({ className: mc.className, level: mc.level, subclass: mcSubclass });
            });
        }
    }

    // Occupation - locked or generate new
    // Infants are always locked to "infant" occupation
    // Characters with Commoner class get an occupation, pure adventurers use "adventurer"
    const hasCommoner = characterClasses.some(cc => cc.className === 'commoner');
    
    if (selectedAgeCategory === 'infant') {
        selectedOccupation = 'infant';
    } else if (!hasCommoner) {
        // Pure adventurers use "adventurer" as their occupation
        selectedOccupation = 'adventurer';
    } else if (lockStates.occupation && currentNPC) {
        selectedOccupation = currentNPC.occupation;
        // If previously was infant but now isn't, regenerate occupation
        if (selectedOccupation === 'infant') {
            const validOccupations = Object.keys(occupations).filter(o => o !== 'infant' && o !== 'adventurer');
            selectedOccupation = occupation === 'random' ? randomChoice(validOccupations) : occupation;
        }
    } else {
        const validOccupations = Object.keys(occupations).filter(o => o !== 'infant' && o !== 'adventurer');
        selectedOccupation = occupation === 'random' ? randomChoice(validOccupations) : occupation;
    }

    // Name - locked or generate new
    let fullName;
    if (lockStates.name && currentNPC) {
        fullName = currentNPC.name;
    } else {
        const firstName = getRaceName(selectedRace, selectedGender);
        const lastName = getRaceSurname(selectedRace);
        fullName = `${firstName} ${lastName}`;
    }

    // Get class and occupation data
    const classData = classes[selectedClass];
    const occData = occupations[selectedOccupation];
    
    // Stats - locked or generate new
    let abilities, modifiers;
    if (lockStates.stats && currentNPC) {
        abilities = { ...currentNPC.abilities };
        modifiers = { ...currentNPC.modifiers };
    } else {
        // Generate 6 ability scores
        let rawScores = [];
        const isInfant = selectedAgeCategory === 'infant';
        const hasAdventurerClass = characterClasses.some(cc => cc.className !== 'commoner');
        const isPureCommoner = selectedClass === 'commoner' && !hasAdventurerClass;
        
        // PC mode uses standard array, NPC mode uses rolled dice
        if (isPCMode() && !isInfant) {
            rawScores = [15, 14, 13, 12, 10, 8];
        } else {
            for (let i = 0; i < 6; i++) {
                rawScores.push(isInfant ? rollInfantScore() : (isPureCommoner ? rollCommonerScore() : rollAbilityScore()));
            }
            rawScores.sort((a, b) => b - a);
        }
        
        abilities = {
            str: 0,
            dex: 0,
            con: 0,
            int: 0,
            wis: 0,
            cha: 0
        };
        
        if (classData.primaryStat !== 'none') {
            const primary = classData.primaryStat;
            const secondary = (classData.secondaryStat && classData.secondaryStat !== 'none') 
                ? classData.secondaryStat 
                : ({ 'str': 'con', 'dex': 'con', 'con': 'str', 'int': 'wis', 'wis': 'con', 'cha': 'dex' }[primary] || 'con');
            const dump = (classData.dumpStat && classData.dumpStat !== 'none') 
                ? classData.dumpStat 
                : ({ 'str': 'int', 'dex': 'str', 'con': 'int', 'int': 'str', 'wis': 'str', 'cha': 'str' }[primary] || 'str');
            
            abilities[primary] = rawScores[0];
            abilities[secondary] = rawScores[1];
            abilities[dump] = rawScores[5];
            
            const assignedStats = [primary, secondary, dump];
            const remainingStats = Object.keys(abilities).filter(stat => !assignedStats.includes(stat));
            remainingStats.forEach((stat, index) => {
                abilities[stat] = rawScores[index + 2];
            });
        } else {
            const stats = Object.keys(abilities);
            const shuffledStats = stats.sort(() => Math.random() - 0.5);
            rawScores.forEach((score, index) => {
                abilities[shuffledStats[index]] = score;
            });
        }

        // Apply race bonuses
        const raceData = races[selectedRace];
        const hasAnyBonus = raceData.abilityBonus.any !== undefined;
        const fixedBonuses = Object.keys(raceData.abilityBonus).filter(a => a !== 'any');
        
        if (hasAnyBonus && fixedBonuses.length === 0) {
            Object.keys(abilities).forEach(ability => {
                abilities[ability] += raceData.abilityBonus.any;
            });
        } else if (Object.keys(raceData.abilityBonus).length === 0) {
            const sortedAbilities = Object.entries(abilities).sort((a, b) => b[1] - a[1]);
            abilities[sortedAbilities[0][0]] += 2;
            if (sortedAbilities.length > 1) {
                abilities[sortedAbilities[1][0]] += 1;
            }
        } else {
            Object.keys(raceData.abilityBonus).forEach(ability => {
                if (ability !== 'any') {
                    abilities[ability] += raceData.abilityBonus[ability];
                }
            });
            if (hasAnyBonus) {
                const sortedAbilities = Object.entries(abilities).sort((a, b) => b[1] - a[1]);
                abilities[sortedAbilities[0][0]] += raceData.abilityBonus.any;
            }
        }

        modifiers = {};
        Object.keys(abilities).forEach(ability => {
            modifiers[ability] = getModifier(abilities[ability]);
        });
    }

    // Skills - locked or generate new (combine from all classes)
    let skills;
    if (lockStates.skills && currentNPC) {
        skills = [...currentNPC.skills];
    } else {
        let allClassSkills = [];
        characterClasses.forEach(cc => {
            const cd = classes[cc.className];
            if (cd && cd.skills) {
                allClassSkills = [...allClassSkills, ...cd.skills];
            }
        });
        const occSkills = occData.skills || [];
        skills = [...new Set([...allClassSkills, ...occSkills])];
    }

    // Equipment - locked or generate new
    let equipment;
    if (lockStates.equipment && currentNPC) {
        equipment = [...currentNPC.equipment];
    } else {
        equipment = occData.equipment || [];
    }

    // Calculate total level and proficiency bonus (commoner is level 0, doesn't count)
    const totalLevel = characterClasses.reduce((sum, cc) => cc.className === 'commoner' ? sum : sum + cc.level, 0) || 1;
    const proficiencyBonus = getProficiencyBonus(totalLevel);

    // Calculate hit points from all classes (level 0 classes like commoner don't contribute)
    const hitDieMap = { 'd4': 4, 'd6': 6, 'd8': 8, 'd10': 10, 'd12': 12 };
    let hitPoints = 0;
    let hitDiceStr = [];
    let firstAdventurerClass = true;
    
    characterClasses.forEach((cc, index) => {
        // Skip level 0 classes (like commoner)
        if (cc.level <= 0) return;
        
        const cd = classes[cc.className];
        const hitDieMax = hitDieMap[cd.hitDie] || 4;
        const hitDieAvg = Math.floor(hitDieMax / 2) + 1;
        
        if (firstAdventurerClass) {
            // First adventurer class, first level: max hit die + CON
            hitPoints += hitDieMax + modifiers.con;
            // Additional levels of first class: average + CON
            for (let lvl = 2; lvl <= cc.level; lvl++) {
                hitPoints += hitDieAvg + modifiers.con;
            }
            firstAdventurerClass = false;
        } else {
            // Multiclass levels: average + CON per level
            for (let lvl = 1; lvl <= cc.level; lvl++) {
                hitPoints += hitDieAvg + modifiers.con;
            }
        }
        
        hitDiceStr.push(`${cc.level}${cd.hitDie}`);
    });
    
    // For pure commoners (level 0), give them 1 HP + CON modifier
    if (hitPoints === 0) {
        hitPoints = Math.max(1, 1 + modifiers.con);
    } else {
        // Ensure minimum 1 HP
        hitPoints = Math.max(1, hitPoints);
    }
    
    // Get saving throws from first (primary) class only
    const primaryClassData = classes[characterClasses[0]?.className] || classData;

    // Backstory - locked or generate new (always generated, checkbox only affects PDF export)
    let backstory;
    if (lockStates.backstory && currentNPC && currentNPC.backstory) {
        backstory = currentNPC.backstory;
    } else {
        backstory = generateBackstory(fullName, selectedRace, selectedOccupation, age, selectedAlignment, selectedAgeCategory, selectedGender, characterClasses);
    }

    // Get race data for display
    const raceData = races[selectedRace];

    // Calculate spells for spellcasting classes
    let spellData = null;
    if (!lockStates.spells || !currentNPC || !currentNPC.spellData) {
        // Check primary class for spellcasting
        const primaryClass = characterClasses[0];
        if (primaryClass) {
            spellData = calculateSpells(
                primaryClass.className, 
                primaryClass.level, 
                modifiers, 
                primaryClass.subclass
            );
        }
    } else {
        spellData = currentNPC.spellData;
    }

    // Generate weapons
    let characterWeapons = null;
    if (!lockStates.weapons || !currentNPC || !currentNPC.weapons) {
        const primaryClassName = characterClasses[0]?.className || 'commoner';
        characterWeapons = getCharacterWeapons(primaryClassName, selectedOccupation);
        
        // Add attack bonus and damage bonus to each weapon
        characterWeapons = characterWeapons.map(weapon => ({
            ...weapon,
            attackBonus: calculateAttackBonus(weapon, modifiers, proficiencyBonus, weapon.isProficient),
            damageBonus: calculateDamageBonus(weapon, modifiers)
        }));
    } else {
        characterWeapons = currentNPC.weapons;
    }

    // Display NPC
    displayNPC({
        name: fullName,
        race: selectedRace,
        npcClass: selectedClass,
        characterClasses: characterClasses,
        occupation: selectedOccupation,
        age: age,
        ageCategory: selectedAgeCategory,
        gender: selectedGender,
        alignment: selectedAlignment,
        abilities: abilities,
        modifiers: modifiers,
        skills: skills,
        equipment: equipment,
        backstory: backstory,
        size: raceData.size,
        speed: raceData.speed,
        hitPoints: hitPoints,
        hitDice: hitDiceStr.join(' + '),
        totalLevel: totalLevel,
        proficiencyBonus: proficiencyBonus,
        hitDie: classData.hitDie,
        savingThrows: primaryClassData.savingThrows || [],
        // New stats
        initiative: modifiers.dex,
        passivePerception: 10 + modifiers.wis + (skills.includes('Perception') ? proficiencyBonus : 0),
        languages: raceData.languages || ['Common'],
        traits: raceData.traits || [],
        senses: raceData.senses || [],
        spellData: spellData,
        weapons: characterWeapons,
        background: selectedBackground,
        backgroundData: backgroundData,
        personalityTrait: backgroundData ? randomChoice(backgroundData.traits) : null,
        ideal: backgroundData ? randomChoice(backgroundData.ideals) : null,
        bond: backgroundData ? randomChoice(backgroundData.bonds) : null,
        flaw: backgroundData ? randomChoice(backgroundData.flaws) : null,
        ...calculateAC(characterClasses[0]?.className || 'commoner', modifiers)
    });
}

// Helper to determine age category from an age value
function determineAgeCategory(age, race) {
    const raceKey = race.toLowerCase();
    const lifespan = races[raceKey]?.lifespan || 80;
    const maturity = maturityAges[raceKey] || 18;
    
    const adultEnd = maturity + Math.floor((lifespan - maturity) * 0.35);
    const matureEnd = maturity + Math.floor((lifespan - maturity) * 0.70);
    const elderlyStart = Math.floor(lifespan * 0.90);
    const childStart = Math.floor(maturity * 0.25);
    const childEnd = Math.floor(maturity * 0.85);
    
    if (age < childStart) return 'infant';
    if (age < childEnd) return 'child';
    if (age < adultEnd) return 'young-adult';
    if (age < matureEnd) return 'adult';
    if (age < elderlyStart) return 'mature';
    return 'elderly';
}

// Roll 4d4 drop lowest for commoner stats (lower average than adventurers)
function rollCommonerScore() {
    const rolls = [
        Math.floor(Math.random() * 4) + 1,
        Math.floor(Math.random() * 4) + 1,
        Math.floor(Math.random() * 4) + 1,
        Math.floor(Math.random() * 4) + 1
    ];
    rolls.sort((a, b) => b - a);
    return rolls[0] + rolls[1] + rolls[2]; // Drop lowest
}

// Roll 1d4 for infant stats (very low scores)
function rollInfantScore() {
    return Math.floor(Math.random() * 4) + 1;
}

// Race-specific lore for backstory generation (D&D 5e accurate)
const raceLore = {
    'aarakocra': {
        homeland: 'the high mountain peaks near the Elemental Plane of Air',
        culture: 'values freedom above all else and feels most at home soaring through open skies',
        childhood: 'learning to fly and hunt in the thin mountain air',
        challenge: 'adapting to life among the wingless ground-dwellers',
        tradition: 'the sacred sky-dances of their aerie',
        elder: 'keeper of the ancient wind-songs'
    },
    'aasimar': {
        homeland: 'a family blessed by celestial heritage',
        culture: 'feels the weight of divine purpose guiding their actions',
        childhood: 'experiencing strange celestial visions and dreams',
        challenge: 'living up to the expectations of their divine heritage',
        tradition: 'communion with their celestial guide',
        elder: 'beacon of divine light to those who have lost their way'
    },
    'astral elf': {
        homeland: 'the silvery void of the Astral Sea',
        culture: 'carries the timeless perspective of one born among the stars',
        childhood: 'drifting through the endless silver expanse',
        challenge: 'understanding the urgency of those bound by time',
        tradition: 'the starlight meditations of the Astral realm',
        elder: 'living repository of eons of astral knowledge'
    },
    'autognome': {
        homeland: 'the workshop of a brilliant gnomish inventor',
        culture: 'seeks to understand their purpose and place in the world',
        childhood: 'being calibrated and learning basic functions',
        challenge: 'proving they are more than just a construct',
        tradition: 'the maintenance rituals taught by their creator',
        elder: 'well-maintained automaton with centuries of accumulated experience'
    },
    'bugbear': {
        homeland: 'the shadowy goblinoid territories',
        culture: 'combines surprising stealth with brutal strength',
        childhood: 'learning to move silently despite their bulk',
        challenge: 'overcoming the fearsome reputation of their kind',
        tradition: 'the hunt-stalking techniques passed down through generations',
        elder: 'grizzled veteran of countless ambushes and raids'
    },
    'centaur': {
        homeland: 'the vast open plains and rolling grasslands',
        culture: 'values the freedom of the open run and the bonds of the herd',
        childhood: 'racing across the grasslands with the other foals',
        challenge: 'navigating a world built for two-legged folk',
        tradition: 'the sacred gallop under the full moon',
        elder: 'wise keeper of the herd\'s oral histories'
    },
    'changeling': {
        homeland: 'wherever they chose to make their hidden life',
        culture: 'understands identity as fluid and self-determined',
        childhood: 'learning to control their shapeshifting abilities',
        challenge: 'finding their true self among countless masks',
        tradition: 'the secret gatherings where changelings reveal their true forms',
        elder: 'master of a thousand faces and identities'
    },
    'deep gnome': {
        homeland: 'the hidden cities of the Underdark',
        culture: 'values secrecy, caution, and the treasures of the deep earth',
        childhood: 'learning to move silently through lightless tunnels',
        challenge: 'adjusting to the blinding brightness of the surface',
        tradition: 'the gem-cutting ceremonies of their hidden community',
        elder: 'keeper of the secret paths through the Underdark'
    },
    'dragonborn': {
        homeland: 'the proud dragonborn clans',
        culture: 'carries the honor of their clan and the legacy of dragonkind',
        childhood: 'learning the history and traditions of their draconic ancestors',
        challenge: 'upholding clan honor while forging their own path',
        tradition: 'the sacred recitation of clan lineage',
        elder: 'honored elder whose scales have silvered with age and wisdom'
    },
    'drow': {
        homeland: 'the treacherous cities of the Underdark',
        culture: 'has learned to survive in a society where trust is rare',
        childhood: 'navigating the deadly politics of drow society',
        challenge: 'escaping the shadow of Lolth\'s influence',
        tradition: 'the dangerous rites of drow coming-of-age',
        elder: 'survivor of centuries of Underdark intrigue'
    },
    'duergar': {
        homeland: 'the fortress-cities deep beneath the mountains',
        culture: 'values hard work, discipline, and self-reliance above all',
        childhood: 'toiling in the forges from a young age',
        challenge: 'overcoming the bitterness that defines their people',
        tradition: 'the solemn craft-rites of duergar smithing',
        elder: 'master craftsperson whose creations are legendary'
    },
    'dwarf': {
        homeland: 'the great mountain halls of the dwarven kingdoms',
        culture: 'honors clan traditions and the mastery of stone and steel',
        childhood: 'learning the craft-secrets of their clan',
        challenge: 'living up to the legendary standards of dwarven craftsmanship',
        tradition: 'the sacred smithing rites of their ancestors',
        elder: 'venerated keeper of clan history and tradition'
    },
    'eladrin': {
        homeland: 'the ever-shifting beauty of the Feywild',
        culture: 'experiences emotions with fey intensity, shifting with the seasons',
        childhood: 'dancing through the eternal twilight of the Feywild',
        challenge: 'containing the wild fey magic that surges within',
        tradition: 'the seasonal festivals of the fey courts',
        elder: 'ancient fey who has seen countless seasons turn'
    },
    'elf': {
        homeland: 'the ancient elven forests and hidden realms',
        culture: 'takes the long view, shaped by centuries of elven tradition',
        childhood: 'spending decades in the patient ways of elven learning',
        challenge: 'watching shorter-lived friends age while they remain unchanged',
        tradition: 'the moonlit reveries that connect elves to their ancestors',
        elder: 'living link to elven history stretching back millennia'
    },
    'fairy': {
        homeland: 'the whimsical glades of the Feywild',
        culture: 'approaches life with fey wonder and mischievous delight',
        childhood: 'flitting among the enchanted flowers of the Feywild',
        challenge: 'understanding why the material world takes itself so seriously',
        tradition: 'the moonlight dances and playful tricks of fairy-kind',
        elder: 'ancient sprite whose magic has grown subtle and deep'
    },
    'firbolg': {
        homeland: 'the deep and ancient forests',
        culture: 'serves as a gentle guardian of the natural world',
        childhood: 'learning to speak with the beasts and plants of the forest',
        challenge: 'venturing into the noisy, crowded world beyond the trees',
        tradition: 'the sacred duty of forest stewardship',
        elder: 'wise druid-like guardian the forest itself seems to obey'
    },
    'genasi': {
        homeland: 'a family touched by elemental power',
        culture: 'feels the pull of their elemental heritage in everything they do',
        childhood: 'learning to control the elemental power within',
        challenge: 'finding acceptance despite their otherworldly appearance',
        tradition: 'meditation on their elemental nature',
        elder: 'being of elemental wisdom who has mastered their inner power'
    },
    'giff': {
        homeland: 'the militant hippo-folk society',
        culture: 'appreciates military discipline and the proper use of firearms',
        childhood: 'drilling in formation and learning weapons maintenance',
        challenge: 'finding worthy causes to apply their martial expertise',
        tradition: 'the sacred cleaning and maintenance of weaponry',
        elder: 'decorated veteran of countless military campaigns'
    },
    'githyanki': {
        homeland: 'the fortresses of Tu\'narath in the Astral Plane',
        culture: 'was raised as a warrior against the mind flayer menace',
        childhood: 'training relentlessly in the arts of war',
        challenge: 'questioning the rigid hierarchy of githyanki society',
        tradition: 'the sacred raids against illithid strongholds',
        elder: 'silver-sword wielding veteran of the eternal war'
    },
    'githzerai': {
        homeland: 'the monasteries of Limbo',
        culture: 'has achieved inner calm through rigorous mental discipline',
        childhood: 'mastering the mind through endless meditation',
        challenge: 'maintaining inner peace amid the chaos of the material world',
        tradition: 'the mental exercises that shape reality in Limbo',
        elder: 'master of psionic discipline whose mind is an unassailable fortress'
    },
    'gnome': {
        homeland: 'the busy burrows and workshops of the gnomish community',
        culture: 'approaches life with boundless curiosity and inventive spirit',
        childhood: 'tinkering with contraptions and asking endless questions',
        challenge: 'being taken seriously despite their small stature',
        tradition: 'the great invention festivals of gnomish society',
        elder: 'master inventor with centuries of accumulated knowledge'
    },
    'goblin': {
        homeland: 'the scrappy goblin warrens',
        culture: 'has learned cunning and resourcefulness through necessity',
        childhood: 'scrapping for survival among the chaos of the warren',
        challenge: 'proving their worth beyond the stereotypes of their kind',
        tradition: 'the clever tricks passed down through goblin generations',
        elder: 'cunning survivor who has outlived countless rivals'
    },
    'goliath': {
        homeland: 'the harsh peaks of the highest mountains',
        culture: 'measures worth through personal achievement and fair competition',
        childhood: 'testing themselves against the unforgiving mountain environment',
        challenge: 'finding worthy challenges to prove their strength',
        tradition: 'the competitive trials that determine goliath standing',
        elder: 'legendary champion whose deeds are sung around mountain campfires'
    },
    'grung': {
        homeland: 'the poisonous swamps of the grung tribes',
        culture: 'understands their place in the strict color-based caste system',
        childhood: 'developing their poisonous skin and learning tribal ways',
        challenge: 'the constant need to stay hydrated away from water',
        tradition: 'the ritualistic ceremonies of the grung hierarchy',
        elder: 'revered elder whose wisdom guides the tribe'
    },
    'hadozee': {
        homeland: 'the wildspace-sailing ships of the hadozee',
        culture: 'lives for adventure among the stars and the thrill of wildspace',
        childhood: 'learning to glide between ship rigging in the void',
        challenge: 'staying grounded when the call of wildspace beckons',
        tradition: 'the shipboard traditions of hadozee spacefarers',
        elder: 'veteran spacefarer with tales from a hundred crystal spheres'
    },
    'half-elf': {
        homeland: 'the borderlands between human and elven society',
        culture: 'bridges two worlds while fully belonging to neither',
        childhood: 'navigating between human and elven relatives',
        challenge: 'finding a community that truly accepts all of who they are',
        tradition: 'creating new traditions that honor both heritages',
        elder: 'wise mediator between the human and elven worlds'
    },
    'half-orc': {
        homeland: 'the frontier lands where orc and human territories meet',
        culture: 'channels the strength of their orcish blood toward their own ends',
        childhood: 'learning to harness their fierce inner strength',
        challenge: 'facing prejudice from those who fear their orcish heritage',
        tradition: 'proving themselves through deeds rather than words',
        elder: 'respected warrior whose strength and wisdom are beyond question'
    },
    'halfling': {
        homeland: 'the cozy villages and warm hearths of halfling communities',
        culture: 'cherishes good food, good company, and a comfortable home',
        childhood: 'running barefoot through pastoral halfling lands',
        challenge: 'finding adventure while staying true to halfling values',
        tradition: 'the great feasts and storytelling of halfling gatherings',
        elder: 'beloved elder whose stories and recipes are village treasures'
    },
    'harengon': {
        homeland: 'the ever-changing realms of the Feywild',
        culture: 'lives by luck and quick reflexes, always ready to leap',
        childhood: 'bounding through the Feywild with restless energy',
        challenge: 'sitting still long enough for others to keep up',
        tradition: 'the lucky charms and superstitions of harengon culture',
        elder: 'remarkably fortunate elder who has hopped out of countless dangers'
    },
    'hobgoblin': {
        homeland: 'the disciplined legions of the hobgoblin military',
        culture: 'values martial excellence and strategic thinking above all',
        childhood: 'drilling in formation from the moment they could walk',
        challenge: 'finding purpose outside the rigid hobgoblin hierarchy',
        tradition: 'the military codes of honor that govern hobgoblin society',
        elder: 'strategic mastermind whose tactical knowledge is unparalleled'
    },
    'human': {
        homeland: 'the diverse and ever-expanding human settlements',
        culture: 'embodies the adaptability and ambition of humankind',
        childhood: 'growing up amid the bustling energy of human society',
        challenge: 'making their mark in the brief span of a human life',
        tradition: 'the varied customs of their particular human culture',
        elder: 'respected figure whose lifetime of experience guides the community'
    },
    'kalashtar': {
        homeland: 'a lineage bonded with spirits from the Region of Dreams',
        culture: 'carries a quori spirit that whispers wisdom from the dream realm',
        childhood: 'learning to hear and understand their bonded spirit',
        challenge: 'protecting their spirit from the forces of Dal Quor',
        tradition: 'the meditation practices that strengthen the spirit bond',
        elder: 'serene sage whose spirit bond has deepened over decades'
    },
    'kender': {
        homeland: 'the curious and wandering communities of Krynn',
        culture: 'approaches the world with boundless curiosity and fearlessness',
        childhood: 'exploring every nook and cranny, collecting "found" treasures',
        challenge: 'understanding why others get so upset about "borrowing"',
        tradition: 'the wanderlust that drives kender to explore new places',
        elder: 'legendary wanderer whose tales of adventure span the entire world'
    },
    'kenku': {
        homeland: 'the urban shadows where the cursed kenku gather',
        culture: 'communicates through mimicked sounds and remembered voices',
        childhood: 'collecting sounds and voices to build their vocabulary',
        challenge: 'expressing original thoughts without the gift of true speech',
        tradition: 'the shared sounds that form kenku community identity',
        elder: 'keeper of countless voices and sounds from across the years'
    },
    'kobold': {
        homeland: 'the trap-filled warrens of the kobold tribes',
        culture: 'serves the glory of dragonkind with clever devotion',
        childhood: 'learning to craft traps and honor their draconic masters',
        challenge: 'earning respect despite their small and underestimated stature',
        tradition: 'the dragon-worship ceremonies of kobold society',
        elder: 'cunning trap-master whose ingenious designs are legendary'
    },
    'leonin': {
        homeland: 'the golden prides of the savanna',
        culture: 'carries the fierce pride and loyalty of the leonin people',
        childhood: 'learning to hunt and protect the pride',
        challenge: 'balancing personal honor with duty to the pride',
        tradition: 'the roaring ceremonies that celebrate leonin victories',
        elder: 'silver-maned elder whose roar commands respect'
    },
    'lizardfolk': {
        homeland: 'the swamps and marshlands of their tribal territories',
        culture: 'approaches the world with cold practicality and survival instinct',
        childhood: 'learning to hunt and survive in the harsh swamplands',
        challenge: 'understanding the emotional complexities of warm-blooded folk',
        tradition: 'the practical rituals that ensure tribal survival',
        elder: 'ancient survivor whose practical wisdom has kept the tribe alive'
    },
    'locathah': {
        homeland: 'the underwater communities of the locathah',
        culture: 'values community cooperation above individual achievement',
        childhood: 'swimming with their school from earliest memory',
        challenge: 'adapting to the dry world above the waves',
        tradition: 'the communal gatherings that strengthen locathah bonds',
        elder: 'wise keeper of the school\'s collective memory'
    },
    'loxodon': {
        homeland: 'the close-knit loxodon herds',
        culture: 'values community, tradition, and the wisdom of the ancestors',
        childhood: 'learning from the elders and memorizing family histories',
        challenge: 'balancing tradition with the need for change',
        tradition: 'the memory-sharing rituals that preserve loxodon history',
        elder: 'living library of generations of loxodon wisdom'
    },
    'minotaur': {
        homeland: 'the labyrinthine halls of minotaur civilization',
        culture: 'channels their fierce nature toward honorable goals',
        childhood: 'navigating the winding passages of their home',
        challenge: 'controlling the rage that burns within their blood',
        tradition: 'the maze-running trials that prove minotaur worth',
        elder: 'battle-scarred veteran whose horns have grown mighty with age'
    },
    'orc': {
        homeland: 'the fierce orc tribes of the wild lands',
        culture: 'embraces strength, endurance, and the bonds of the tribe',
        childhood: 'proving themselves through contests of strength and will',
        challenge: 'channeling their fierce nature toward constructive ends',
        tradition: 'the strength-trials that determine orcish standing',
        elder: 'mighty elder whose battle-wisdom is sought by all'
    },
    'owlin': {
        homeland: 'the mysterious reaches of the Feywild',
        culture: 'sees the world with owl-like wisdom and patience',
        childhood: 'learning to fly silently through moonlit forests',
        challenge: 'staying awake during the bright hours of day',
        tradition: 'the nighttime gatherings where owlin share knowledge',
        elder: 'ancient sage whose wide eyes have seen centuries of secrets'
    },
    'plasmoid': {
        homeland: 'the far realms where plasmoids originate',
        culture: 'experiences the world through their unique amorphous form',
        childhood: 'learning to hold a stable shape',
        challenge: 'relating to creatures bound by rigid forms',
        tradition: 'the flowing dances that celebrate plasmoid nature',
        elder: 'elder whose form has stabilized into dignified patterns'
    },
    'satyr': {
        homeland: 'the festive glades of the Feywild',
        culture: 'lives for revelry, music, and the pleasures of life',
        childhood: 'learning music and mischief among the fey',
        challenge: 'taking anything too seriously for too long',
        tradition: 'the wild revels and musical gatherings of satyr-kind',
        elder: 'master musician whose songs can move even the coldest heart'
    },
    'sea elf': {
        homeland: 'the underwater kingdoms of the sea elves',
        culture: 'feels the pull of both the ocean depths and the surface world',
        childhood: 'swimming through coral palaces and sunken ruins',
        challenge: 'spending extended time away from the sea',
        tradition: 'the tidal ceremonies that honor the ocean',
        elder: 'ancient keeper of secrets from the ocean floor'
    },
    'shadar-kai': {
        homeland: 'the gray realm of the Shadowfell',
        culture: 'seeks intense experiences to feel anything at all',
        childhood: 'enduring the numbing gloom of the Shadowfell',
        challenge: 'finding meaning in a world that seems colorless',
        tradition: 'the painful rituals that remind them they are alive',
        elder: 'scarred survivor who has found purpose despite the shadow'
    },
    'shifter': {
        homeland: 'the wild frontiers where civilization meets the beast',
        culture: 'embraces the primal nature that runs in their blood',
        childhood: 'learning to channel their bestial heritage',
        challenge: 'controlling the beast within during times of stress',
        tradition: 'the moonlit rites that honor their lycanthropic ancestors',
        elder: 'wise elder who has achieved harmony with their beast-self'
    },
    'simic hybrid': {
        homeland: 'the biomancy laboratories of the Simic Combine',
        culture: 'sees themselves as an evolution of multiple forms',
        childhood: 'adapting to their enhanced body after the procedure',
        challenge: 'remembering who they were before the changes',
        tradition: 'regular check-ins with Simic researchers',
        elder: 'veteran hybrid whose adaptations have proven remarkably stable'
    },
    'tabaxi': {
        homeland: 'the distant jungles where tabaxi clans roam',
        culture: 'is driven by insatiable curiosity and wanderlust',
        childhood: 'chasing butterflies and collecting stories',
        challenge: 'staying interested once the mystery is solved',
        tradition: 'the story-sharing gatherings of the clan',
        elder: 'legendary collector of tales from across the world'
    },
    'thri-kreen': {
        homeland: 'the arid wastes where thri-kreen hunt in packs',
        culture: 'thinks in practical, communal terms foreign to most humanoids',
        childhood: 'learning to hunt in perfect coordination with the clutch',
        challenge: 'understanding the strange individual focus of other races',
        tradition: 'the silent hunts that bond the clutch together',
        elder: 'ancient hunter whose carapace has hardened with age'
    },
    'tiefling': {
        homeland: 'a lineage marked by infernal heritage',
        culture: 'has learned self-reliance in the face of prejudice',
        childhood: 'dealing with the stares and whispers of the fearful',
        challenge: 'proving their infernal blood does not define their character',
        tradition: 'forging their own path despite the expectations of others',
        elder: 'wise figure who has turned prejudice into strength'
    },
    'tortle': {
        homeland: 'the coastal regions where tortles hatch',
        culture: 'approaches life as a journey of experiences to collect',
        childhood: 'wandering from the nesting beach to see the world',
        challenge: 'feeling the pull to settle as their years advance',
        tradition: 'the return to ancestral beaches to share wisdom',
        elder: 'ancient wanderer whose shell bears the marks of countless journeys'
    },
    'triton': {
        homeland: 'the deep ocean trenches guarded by triton cities',
        culture: 'carries the proud duty of protecting the world from deep-sea threats',
        childhood: 'training to guard against the horrors of the deep',
        challenge: 'understanding that surface-dwellers don\'t know of their sacrifices',
        tradition: 'the solemn oaths of protection sworn by all tritons',
        elder: 'veteran guardian of the deep whose tales of undersea battles are legend'
    },
    'vedalken': {
        homeland: 'the methodical society of the vedalken',
        culture: 'pursues perfection through careful analysis and improvement',
        childhood: 'cataloging flaws and planning improvements',
        challenge: 'accepting that perfection may be unattainable',
        tradition: 'the peer review councils that evaluate vedalken work',
        elder: 'master analyst whose critiques have improved countless endeavors'
    },
    'verdan': {
        homeland: 'the strange circumstances of their recent creation',
        culture: 'is curious about a world they are only beginning to understand',
        childhood: 'rapidly growing and changing in unexpected ways',
        challenge: 'making sense of their mysterious goblinoid origins',
        tradition: 'sharing discoveries with other verdan',
        elder: 'one of the oldest of their young race, full of hard-won wisdom'
    },
    'warforged': {
        homeland: 'the forges where they were created for war',
        culture: 'seeks purpose and meaning beyond their original design',
        childhood: 'being activated and learning their initial functions',
        challenge: 'understanding emotions and finding their place in peace',
        tradition: 'the maintenance rituals that keep them functioning',
        elder: 'ancient construct who has found purpose beyond their original programming'
    },
    'yuan-ti': {
        homeland: 'the serpent kingdoms of yuan-ti civilization',
        culture: 'approaches the world with cold, calculating logic',
        childhood: 'being taught to suppress emotion as weakness',
        challenge: 'understanding why others let feelings guide them',
        tradition: 'the serpent rites that honor their transformation',
        elder: 'cold strategist whose schemes span generations'
    }
};

function generateBackstory(name, race, occupation, age, alignment, ageCategory, gender, characterClasses) {
    const pronoun = gender === 'male' ? 'he' : gender === 'female' ? 'she' : 'they';
    const Pronoun = pronoun.charAt(0).toUpperCase() + pronoun.slice(1);
    const possessive = gender === 'male' ? 'his' : gender === 'female' ? 'her' : 'their';
    const Possessive = possessive.charAt(0).toUpperCase() + possessive.slice(1);
    const reflexive = gender === 'non-binary' ? 'themselves' : (gender === 'male' ? 'himself' : 'herself');
    const object = gender === 'non-binary' ? 'them' : (gender === 'male' ? 'him' : 'her');
    const verbS = gender === 'non-binary' ? '' : 's';
    const hasHave = gender === 'non-binary' ? 'have' : 'has';
    
    // Format occupation: replace underscores with spaces and capitalize each word
    const formattedOccupation = occupation.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    
    const raceKey = race.toLowerCase();
    const lore = raceLore[raceKey] || raceLore['human'];
    const yearWord = age === 1 ? 'year' : 'years';
    
    // Special phrasing for newborns (age 0)
    const agePhrase = age === 0 ? 'this year' : `${age} ${yearWord} ago`;
    const ageDescription = age === 0 ? 'newborn' : `${age} ${yearWord} old`;
    const ageOf = age === 0 ? 'newborn' : `${age} ${yearWord}`;
    const justBorn = age === 0 ? 'recently' : `just ${age} ${yearWord} ago`;
    
    // Check for commoner with adventurer classes (various scenarios)
    const hasCommoner = characterClasses?.some(cc => cc.className === 'commoner');
    const adventurerClasses = characterClasses?.filter(cc => cc.className !== 'commoner') || [];
    const hasAdventurerTraining = hasCommoner && adventurerClasses.length > 0;
    
    // Build adventurer class description and scenario for commoners with training
    let adventurerDescription = '';
    let adventurerScenario = '';
    if (hasAdventurerTraining) {
        const classDescriptions = adventurerClasses.map(cc => {
            let desc = capitalize(cc.className);
            if (cc.subclass && subclasses[cc.className]) {
                const subclassData = subclasses[cc.className];
                const subclassOption = subclassData.options.find(o => o.id === cc.subclass);
                if (subclassOption) {
                    desc = subclassOption.name + ' ' + desc;
                }
            }
            return desc;
        });
        adventurerDescription = classDescriptions.join(' and ');
        
        // Random scenario for why a trained adventurer is living as a commoner
        const scenarios = [
            `a retired ${adventurerDescription} who now lives a quieter life`,
            `secretly a trained ${adventurerDescription}, hiding ${possessive} abilities from the world`,
            `a former ${adventurerDescription} in hiding, avoiding those who might recognize ${object}`,
            `an undercover ${adventurerDescription}, using ${possessive} cover as a ${formattedOccupation} to gather information`,
            `once a promising ${adventurerDescription}, but trauma has led ${object} to abandon that life`,
            `a ${adventurerDescription} who left adventuring behind after a personal loss`,
            `an aspiring ${adventurerDescription}, training in secret while working as a ${formattedOccupation}`,
            `a ${adventurerDescription} laying low after a job gone wrong`,
            `a former ${adventurerDescription} who found peace in the simple life of a ${formattedOccupation}`,
            `secretly a ${adventurerDescription}, waiting for the right moment to reveal ${possessive} true skills`
        ];
        adventurerScenario = randomChoice(scenarios);
    }
    
    // Get subclass backstory hooks from all classes
    let subclassHook = '';
    let allSubclassHooks = [];
    if (characterClasses && characterClasses.length > 0) {
        characterClasses.forEach(cc => {
            if (cc.subclass && subclasses[cc.className]) {
                const subclassData = subclasses[cc.className];
                const subclassOption = subclassData.options.find(o => o.id === cc.subclass);
                if (subclassOption && subclassOption.backstoryHook) {
                    allSubclassHooks.push(subclassOption.backstoryHook);
                }
            }
        });
        // Use primary subclass hook for templates, store all for potential use
        subclassHook = allSubclassHooks[0] || '';
    }
    
    const backstoryTemplates = {
        'infant': [
            `${name} was born ${justBorn} in ${lore.homeland}. Even at this tender age, ${pronoun} already show${verbS} signs of ${possessive} ${race} heritage. ${Possessive} family watches over ${object} with great love.`,
            `A ${ageDescription}, ${name} is just beginning life in ${lore.homeland}. The infant's ${race} features are already evident, and ${possessive} family hopes ${pronoun} will grow to embody ${alignment} values.`,
            `${name} is a ${ageOf} ${race} infant, born into a family from ${lore.homeland}. ${Possessive} parents pray ${pronoun} will grow strong and true.`,
            `The tiny ${race} known as ${name} came into this world ${agePhrase} in ${lore.homeland}. ${Possessive} future is unwritten, full of possibility and promise.`,
            `${name}, a ${ageOf} ${race} infant, sleeps peacefully while ${possessive} family tends to ${object}. Born in ${lore.homeland}, ${possessive} journey has only just begun.`
        ],
        'child': [
            `${name} is a ${age}-year-old ${race} child from ${lore.homeland}. ${Pronoun} spend${verbS} ${possessive} days ${lore.childhood}, while dreaming of becoming a ${formattedOccupation}.`,
            `Young ${name}, at ${age} ${yearWord} old, is ${lore.childhood}. This curious ${race} child ${lore.culture}, already showing a ${alignment} temperament.`,
            `At ${age}, ${name} is still ${lore.childhood}. The young ${race} idolizes the local ${formattedOccupation}s and ${lore.culture}.`,
            `${name} is a ${race} child of ${age} who grew up in ${lore.homeland}. While ${lore.childhood}, ${pronoun} dream${verbS} of one day working as a ${formattedOccupation}.`,
            `The ${age}-year-old ${race} named ${name} is known for ${possessive} ${alignment} nature. Currently ${lore.childhood}, ${pronoun} show${verbS} promise for a future as a ${formattedOccupation}.`
        ],
        'young-adult': hasAdventurerTraining ? [
            `${name} is a ${age}-year-old ${race} from ${lore.homeland} who works as a ${formattedOccupation}, while secretly being ${adventurerScenario}. ${Pronoun} ${lore.culture}, balancing ${possessive} ambitions carefully.`,
            `At ${age}, ${name} appears to be a simple ${formattedOccupation}, but is ${adventurerScenario}. This young ${race} from ${lore.homeland} ${lore.culture}, hiding ${possessive} true potential.`,
            `${name} is a young ${race} of ${age} ${yearWord}, ${adventurerScenario} while working as a ${formattedOccupation}. ${Possessive} ${alignment} values guide both paths ${pronoun} walk${verbS}.`,
            `Fresh from ${lore.homeland}, the ${age}-year-old ${name} maintains a cover as a ${formattedOccupation}. In reality, ${pronoun} ${gender === 'non-binary' ? 'are' : 'is'} ${adventurerScenario}, full of untapped potential.`,
            `${name}, a ${age}-year-old ${race}, lives a double life as ${formattedOccupation} and ${adventurerScenario}. ${Pronoun} ${lore.culture}, but ${possessive} true journey is just beginning.`
        ] : [
            `${name} is a ${age}-year-old ${race} from ${lore.homeland} who recently began training as a ${formattedOccupation}${subclassHook ? `, ${subclassHook}` : ''}. ${Pronoun} ${lore.culture}, and face${verbS} the challenge of ${lore.challenge}.`,
            `At ${age}, ${name} has just left ${lore.homeland} to pursue a career as a ${formattedOccupation}. As a young ${race}${subclassHook ? ` ${subclassHook}` : ''} who ${lore.culture}, ${pronoun} approach${verbS === 's' ? 'es' : ''} ${possessive} new life with ${alignment} determination.`,
            `${name} is a young ${race} of ${age} ${yearWord}, newly apprenticed to a ${formattedOccupation}${subclassHook ? ` ${subclassHook}` : ''}. Having grown up ${lore.childhood}, ${pronoun} now face${verbS} ${lore.challenge}.`,
            `Fresh from ${lore.homeland}, the ${age}-year-old ${name}${subclassHook ? ` ${subclassHook}` : ''} ${lore.culture}. This young ${race} ${hasHave} chosen the path of a ${formattedOccupation}, bringing ${possessive} ${alignment} values.`,
            `${name}, a ${age}-year-old ${race}${subclassHook ? ` ${subclassHook}` : ''}, still honors ${lore.tradition} while training as a ${formattedOccupation}. ${Pronoun} ${lore.culture} and ${hasHave} much to prove.`
        ],
        'adult': hasAdventurerTraining ? [
            `${name} is a ${race} ${formattedOccupation} of ${age} ${yearWord} from ${lore.homeland}, but is also ${adventurerScenario}. ${Pronoun} ${lore.culture}, balancing ${possessive} dual life with ${alignment} integrity.`,
            `At ${age} ${yearWord} old, ${name} works as a ${formattedOccupation}, though ${pronoun} ${gender === 'non-binary' ? 'are' : 'is'} ${adventurerScenario}. This ${race} from ${lore.homeland} ${lore.culture}, keeping ${possessive} past close to ${possessive} chest.`,
            `${name}, a ${race} of ${age}, appears to be a simple ${formattedOccupation}. In truth, ${pronoun} ${gender === 'non-binary' ? 'are' : 'is'} ${adventurerScenario}. Few know of ${possessive} ${alignment} convictions or true capabilities.`,
            `The ${age}-year-old ${race} known as ${name} serves as a ${formattedOccupation} in ${lore.homeland}. However, ${pronoun} ${gender === 'non-binary' ? 'are' : 'is'} ${adventurerScenario}, and ${possessive} skills run far deeper than most realize.`,
            `${name} lives as a ${formattedOccupation} at ${age}. This ${race} from ${lore.homeland} is ${adventurerScenario}, carrying ${possessive} ${alignment} values quietly while ${lore.culture}.`
        ] : [
            `${name} is a ${race} ${formattedOccupation} of ${age} ${yearWord} from ${lore.homeland}${subclassHook ? `, ${subclassHook}` : ''}. ${Pronoun} ${lore.culture}, and ${hasHave} learned to navigate ${lore.challenge}. ${Possessive} ${alignment} reputation is well-established.`,
            `At ${age} ${yearWord} old, ${name} has established ${reflexive} as a capable ${formattedOccupation}${subclassHook ? ` ${subclassHook}` : ''}. This ${race} from ${lore.homeland} ${lore.culture}, while still honoring ${lore.tradition}.`,
            `${name}, a ${race} of ${age}${subclassHook ? ` ${subclassHook}` : ''}, has spent years honing ${possessive} craft as a ${formattedOccupation}. Despite ${lore.challenge}, ${pronoun} ${hasHave} built a ${alignment} reputation.`,
            `The ${age}-year-old ${race} known as ${name} is a respected ${formattedOccupation}${subclassHook ? ` ${subclassHook}` : ''}. ${Pronoun} ${lore.culture}, never forgetting ${possessive} roots in ${lore.homeland}.`,
            `${name} is in the prime of ${possessive} career at ${age}. This ${race} ${formattedOccupation} from ${lore.homeland}${subclassHook ? ` ${subclassHook}` : ''} ${hasHave} overcome ${lore.challenge} through ${possessive} ${alignment} approach to life.`
        ],
        'mature': hasAdventurerTraining ? [
            `${name} is a seasoned ${race} ${formattedOccupation} of ${age} ${yearWord}, though ${pronoun} ${gender === 'non-binary' ? 'are' : 'is'} ${adventurerScenario}. Originally from ${lore.homeland}, ${pronoun} ${lore.culture}, drawing on both ${possessive} adventuring experience and ${alignment} wisdom.`,
            `At ${age}, ${name} has seen much in ${possessive} time. On the surface a ${formattedOccupation}, ${pronoun} ${gender === 'non-binary' ? 'are' : 'is'} ${adventurerScenario}. Few suspect the depth of skill this ${race} possesses.`,
            `${name}, a ${race} of ${age} ${yearWord}, maintains a life as a ${formattedOccupation} while being ${adventurerScenario}. From ${lore.homeland}, ${pronoun} ${lore.culture}, though ${possessive} past holds more than ${pronoun} let${verbS} on.`,
            `The ${age}-year-old ${race} ${name} appears to be a simple ${formattedOccupation}, but is ${adventurerScenario}. ${Possessive} ${alignment} character guides both aspects of ${possessive} life.`,
            `${name} has lived ${age} ${yearWord} as both ${formattedOccupation} and ${adventurerScenario}. This ${race} from ${lore.homeland} ${lore.culture}, carrying secrets that few would believe.`
        ] : [
            `${name} is a seasoned ${race} ${formattedOccupation} of ${age} ${yearWord}${subclassHook ? `, ${subclassHook}` : ''}. Originally from ${lore.homeland}, ${pronoun} ${lore.culture}. Years of ${lore.challenge} have only strengthened ${possessive} ${alignment} convictions.`,
            `At ${age}, ${name}${subclassHook ? ` ${subclassHook}` : ''} has seen much in ${possessive} time as a ${race} ${formattedOccupation}. ${Pronoun} still honors ${lore.tradition}, while mentoring younger folk with ${possessive} ${alignment} wisdom.`,
            `${name}, a ${race} of ${age} ${yearWord}${subclassHook ? ` ${subclassHook}` : ''}, has decades of experience as a ${formattedOccupation}. From ${lore.homeland}, ${pronoun} ${lore.culture}. Many seek ${possessive} counsel on important matters.`,
            `The ${age}-year-old ${race} ${formattedOccupation} ${name}${subclassHook ? ` ${subclassHook}` : ''} has weathered many storms since leaving ${lore.homeland}. ${Possessive} ${alignment} character has been tested by ${lore.challenge} and proven over the years.`,
            `${name} is a master ${formattedOccupation} at ${age}${subclassHook ? `, ${subclassHook}` : ''}. As a ${race} who ${lore.culture}, ${pronoun} ${hasHave} become a ${lore.elder}, still practicing ${lore.tradition}.`
        ],
        'elderly': hasAdventurerTraining ? [
            `${name} is a venerable ${race} of ${age} ${yearWord}, living as a ${formattedOccupation} though ${pronoun} ${gender === 'non-binary' ? 'are' : 'is'} ${adventurerScenario}. Now a ${lore.elder}, ${pronoun} guards ${possessive} secrets with ${alignment} wisdom.`,
            `At ${age}, ${name} has lived many lives - ${formattedOccupation} to most, but ${adventurerScenario} to those who know the truth. This ${race} ${lore.elder} ${lore.culture}, carrying stories few would believe.`,
            `${name}, an elderly ${race} of ${age}, appears to be a simple ${formattedOccupation}. Yet ${pronoun} ${gender === 'non-binary' ? 'are' : 'is'} ${adventurerScenario}. Even now, ${possessive} skills remain sharp.`,
            `The ${age}-year-old ${race} ${name} is known locally as a ${formattedOccupation}, but is secretly ${adventurerScenario}. From ${lore.homeland}, this ${lore.elder} keeps ${possessive} true nature hidden.`,
            `${name} has seen ${age} ${yearWord} come and go, living as ${formattedOccupation} while being ${adventurerScenario}. This ${race} ${lore.elder} ${lore.culture}, ${possessive} past a closely guarded secret.`
        ] : [
            `${name} is a venerable ${race} of ${age} ${yearWord}, a retired ${formattedOccupation} from ${lore.homeland}. Now a ${lore.elder}, ${pronoun} shares ${possessive} ${alignment} wisdom with the next generation.`,
            `At ${age}, ${name} has lived a full life as a ${race} ${formattedOccupation}. ${Pronoun} ${lore.culture}, and reflect${verbS} on a lifetime of ${lore.challenge}. ${Possessive} legacy is secure.`,
            `${name}, an elderly ${race} of ${age}, was once a renowned ${formattedOccupation}. This ${lore.elder} from ${lore.homeland} now spend${verbS} ${possessive} twilight years honoring ${lore.tradition}.`,
            `The ${age}-year-old ${race} ${name} is a living legend among ${formattedOccupation}s. From ${lore.homeland}, this ${lore.elder} ${hasHave} earned great respect through ${possessive} ${alignment} deeds.`,
            `${name} has seen ${age} ${yearWord} come and go. This elderly ${race} ${formattedOccupation} is treasured as a ${lore.elder}, ${possessive} stories of ${lore.challenge} inspiring all who listen.`
        ]
    };
    
    const templates = backstoryTemplates[ageCategory] || backstoryTemplates['adult'];
    return randomChoice(templates);
}

// Store current NPC data and lock states globally
