// D&D 5E NPC Generator - UI Functions (display, edit, modals)

let currentNPC = null;
const lockStates = {
    name: false,
    race: false,
    npcClass: false,
    occupation: false,
    age: false,
    gender: false,
    alignment: false,
    stats: false,
    skills: false,
    equipment: false,
    languages: false,
    backstory: false,
    spells: false,
    weapons: false
};

function toggleLock(field) {
    lockStates[field] = !lockStates[field];
    updateLockButton(field);
    updateFormFieldState(field);
}

function updateLockButton(field) {
    const btn = document.getElementById(`lock-${field}`);
    if (btn) {
        btn.classList.toggle('locked', lockStates[field]);
        btn.innerHTML = lockStates[field] ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-lock-open"></i>';
        btn.title = lockStates[field] ? 'Click to unlock' : 'Click to lock';
    }
}

function updateFormFieldState(field) {
    // Map NPC fields to form element IDs
    const fieldToFormId = {
        'race': 'race',
        'npcClass': 'npcClass',
        'occupation': 'occupation',
        'age': 'age',
        'gender': 'gender',
        'alignment': 'alignment'
    };

    const formId = fieldToFormId[field];
    if (formId) {
        const formGroup = document.getElementById(formId)?.closest('.form-group');
        if (formGroup) {
            formGroup.classList.toggle('disabled', lockStates[field]);
        }
    }
}

function updateAllFormStates() {
    ['race', 'npcClass', 'occupation', 'age', 'gender', 'alignment'].forEach(field => {
        updateFormFieldState(field);
    });
}

function regenerateNPC() {
    generateNPC();
}

function displayNPC(npc) {
    // Store NPC data globally
    currentNPC = npc;
    
    const resultDiv = document.getElementById('npcResult');
    const placeholder = document.getElementById('placeholder');
    const regenerateBtn = document.getElementById('regenerateBtn');

    placeholder.classList.add('hidden');
    resultDiv.classList.remove('hidden');
    regenerateBtn.style.display = 'flex';

    // Format class name nicely (showing all classes with levels and subclasses)
    // Commoner is always level 0 and doesn't show a level number
    let className;
    if (npc.characterClasses && npc.characterClasses.length > 0) {
        className = npc.characterClasses.map(cc => {
            const name = cc.className === 'commoner' ? 'Commoner' : capitalize(cc.className);
            // Show level for adventurer classes, but not for commoner (which is level 0)
            let displayName = (cc.className !== 'commoner' && (cc.level > 1 || npc.characterClasses.length > 1)) 
                ? `${name} ${cc.level}` 
                : name;
            // Add subclass if present
            if (cc.subclass && subclasses[cc.className]) {
                const subclassData = subclasses[cc.className];
                const subclassOption = subclassData.options.find(o => o.id === cc.subclass);
                if (subclassOption) {
                    displayName += ` (${subclassOption.name})`;
                }
            }
            return displayName;
        }).join(' / ');
    } else {
        className = npc.npcClass === 'commoner' ? 'Commoner' : capitalize(npc.npcClass);
    }
    const occupationName = npc.occupation.replace(/_/g, ' ').split(' ').map(w => capitalize(w)).join(' ');

    // Helper to create lock button
    const lockBtn = (field) => `
        <button class="lock-btn ${lockStates[field] ? 'locked' : ''}" 
                id="lock-${field}" 
                onclick="toggleLock('${field}')"
                title="${lockStates[field] ? 'Click to unlock' : 'Click to lock'}">
            ${lockStates[field] ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-lock-open"></i>'}
        </button>
    `;

    let html = `
        <div class="npc-card">
            <!-- Name Row -->
            <div class="npc-field-row" style="background: none; padding: 0; margin-bottom: 5px;">
                <div class="npc-name-section">
                    <div class="npc-name editable" id="editable-name" onclick="editTextField('name', '${npc.name.replace(/'/g, "\\'")}', event)">${npc.name}</div>
                </div>
                ${lockBtn('name')}
            </div>

            <!-- Race Row -->
            <div class="npc-field-row">
                <div class="npc-field-content">
                    <span class="npc-field-label">Race:</span>
                    <span class="npc-field-value editable" id="editable-race" onclick="editSelectField('race', '${npc.race}', getRaceOptions(), event)">${capitalize(npc.race)}</span>
                </div>
                ${lockBtn('race')}
            </div>

            <!-- Class Row -->
            <div class="npc-field-row">
                <div class="npc-field-content">
                    <span class="npc-field-label">Class:</span>
                    <span class="npc-field-value editable" id="editable-npcClass" onclick="editClassField(event)">${className}</span>
                    ${npc.totalLevel > 1 ? `<span class="level-badge">Level ${npc.totalLevel}</span>` : ''}
                </div>
                ${lockBtn('npcClass')}
            </div>

            ${npc.characterClasses?.some(cc => cc.className === 'commoner') ? `
            <!-- Occupation Row (for characters with Commoner class) -->
            <div class="npc-field-row">
                <div class="npc-field-content">
                    <span class="npc-field-label">Occupation:</span>
                    <span class="npc-field-value editable" id="editable-occupation" onclick="editSelectField('occupation', '${npc.occupation}', getOccupationOptions(), event)">${occupationName}</span>
                </div>
                ${lockBtn('occupation')}
            </div>
            ` : ''}

            <!-- Age Row -->
            <div class="npc-field-row">
                <div class="npc-field-content">
                    <span class="npc-field-label">Age:</span>
                    <span class="npc-field-value editable" id="editable-age" onclick="editAgeField(event)">${npc.age === 0 ? 'Newborn' : npc.age + ' years old'}</span>
                </div>
                ${lockBtn('age')}
            </div>

            <!-- Gender Row -->
            <div class="npc-field-row">
                <div class="npc-field-content">
                    <span class="npc-field-label">Gender:</span>
                    <span class="npc-field-value editable" id="editable-gender" onclick="editSelectField('gender', '${npc.gender}', getGenderOptions(), event)">${capitalize(npc.gender)}</span>
                </div>
                ${lockBtn('gender')}
            </div>

            <!-- Alignment Row -->
            <div class="npc-field-row">
                <div class="npc-field-content">
                    <span class="npc-field-label">Alignment:</span>
                    <span class="npc-field-value editable" id="editable-alignment" onclick="editSelectField('alignment', '${npc.alignment}', getAlignmentOptions(), event)">${capitalize(npc.alignment)}</span>
                </div>
                ${lockBtn('alignment')}
            </div>

            <!-- Ability Scores Section with Lock -->
            <div class="section-header">
                <div class="section-title" style="border-bottom: none; padding-bottom: 0;"><i class="fa-solid fa-chart-simple"></i> Ability Scores</div>
                ${lockBtn('stats')}
            </div>
            <div style="border-bottom: 2px solid #e9ecef; margin-bottom: 10px;"></div>
            <div class="stat-grid">
    `;

    Object.keys(npc.abilities).forEach(ability => {
        const isProficient = npc.savingThrows && npc.savingThrows.includes(ability);
        html += `
            <div class="stat-item" ${isProficient ? 'style="border: 2px solid #58180d;"' : ''}>
                <div class="stat-label">${abilityNames[ability]}</div>
                <div class="stat-value editable" id="editable-stat-${ability}" onclick="event.stopPropagation(); editStatField('${ability}')">${npc.abilities[ability]}</div>
                <div class="stat-modifier">${formatModifier(npc.modifiers[ability])}</div>
            </div>
        `;
    });

    html += `
            </div>

            <!-- Combat Stats Section -->
            <div class="section-title"><i class="fa-solid fa-shield-halved"></i> Combat Stats</div>
            <div class="info-item">
                <span class="info-label">Hit Points:</span><span class="editable" id="editable-hp" onclick="event.stopPropagation(); editHPField()">${npc.hitPoints}</span> ${npc.customHP ? '(Custom)' : (npc.hitDice ? `(${npc.hitDice})` : '')}
            </div>
            <div class="info-item">
                <span class="info-label">Armor Class:</span><span class="editable" id="editable-ac" onclick="event.stopPropagation(); editACField()">${npc.ac}</span> ${npc.customAC ? '(Custom)' : `(${npc.armorName})`}
            </div>
            <div class="info-item">
                <span class="info-label">Initiative:</span>${npc.initiative >= 0 ? '+' : ''}${npc.initiative}
            </div>
            <div class="info-item">
                <span class="info-label">Passive Perception:</span>${npc.passivePerception}
            </div>
            ${npc.proficiencyBonus ? `
            <div class="info-item">
                <span class="info-label">Proficiency Bonus:</span>+${npc.proficiencyBonus}
            </div>
            ` : ''}
    `;
    
    // Saving Throws with actual values
    const savingThrowValues = Object.keys(npc.modifiers).map(ability => {
        const isProficient = npc.savingThrows && npc.savingThrows.includes(ability);
        const value = npc.modifiers[ability] + (isProficient ? npc.proficiencyBonus : 0);
        const prefix = value >= 0 ? '+' : '';
        const profMark = isProficient ? '*' : '';
        return `${abilityNames[ability].substring(0, 3)} ${prefix}${value}${profMark}`;
    });
    
    html += `
        <div class="info-item">
            <span class="info-label">Saving Throws:</span><span style="font-size: 0.9em;">${savingThrowValues.join(', ')}</span>
        </div>
    `;
    
    // Senses
    if (npc.senses && npc.senses.length > 0) {
        html += `
            <div class="info-item">
                <span class="info-label">Senses:</span>${npc.senses.join(', ')}
            </div>
        `;
    }
    
    // Languages (editable)
    html += `
        <div class="section-header" style="margin-top: 10px;">
            <div class="info-item" style="flex: 1; margin-bottom: 0;">
                <span class="info-label">Languages:</span>
                <span class="editable" style="cursor: pointer;" onclick="event.stopPropagation(); openMultiSelectModal('languages', 'Languages', getAllLanguages(), currentNPC.languages)">${npc.languages && npc.languages.length > 0 ? npc.languages.join(', ') : 'None'}</span>
            </div>
            ${lockBtn('languages')}
        </div>
    `;

    // Weapons Section
    html += `
        <div class="section-header" style="margin-top: 15px;">
            <div class="section-title" style="border-bottom: none; padding-bottom: 0;"><i class="fa-solid fa-khanda"></i> Weapons</div>
            ${lockBtn('weapons')}
        </div>
        <div class="weapons-list">
    `;
    
    // Show Tiny Fists for infants, Unarmed Strike for others
    const isInfant = npc.ageCategory === 'infant';
    
    if (isInfant) {
        // Tiny Fists for infants - does 0 damage
        html += `
            <div class="weapon-card" title="The flailing fists of an infant. Adorable but ineffective." style="opacity: 0.85; border-style: dashed;">
                <div class="weapon-header">
                    <span class="weapon-name"><i class="fa-solid fa-hand" style="margin-right: 5px;"></i>Tiny Fists</span>
                    <span class="weapon-type">Natural</span>
                </div>
                <div class="weapon-stats">
                    <div class="weapon-stat">
                        <span class="weapon-stat-label">Attack:</span>
                        <span class="weapon-stat-value">+0</span>
                    </div>
                    <div class="weapon-stat">
                        <span class="weapon-stat-label">Damage:</span>
                        <span class="weapon-stat-value">No Damage</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        const unarmedStrike = getUnarmedStrike(
            npc.characterClasses?.[0]?.className || 'commoner',
            npc.totalLevel || 1,
            npc.modifiers,
            npc.proficiencyBonus || 2
        );
        
        const unarmedAttackSign = unarmedStrike.attackBonus >= 0 ? '+' : '';
        const unarmedDamageSign = unarmedStrike.damageBonus >= 0 ? '+' : '';
        const unarmedDamageBonus = unarmedStrike.damageBonus !== 0 ? ` ${unarmedDamageSign}${unarmedStrike.damageBonus}` : '';
        const unarmedProperties = unarmedStrike.properties && unarmedStrike.properties.length > 0 ? unarmedStrike.properties.join(', ') : '';
        
        html += `
            <div class="weapon-card" title="${unarmedStrike.description}" style="opacity: 0.85; border-style: dashed;">
                <div class="weapon-header">
                    <span class="weapon-name"><i class="fa-solid fa-hand-fist" style="margin-right: 5px;"></i>${unarmedStrike.name}</span>
                    <span class="weapon-type">Natural</span>
                </div>
                <div class="weapon-stats">
                    <div class="weapon-stat">
                        <span class="weapon-stat-label">Attack:</span>
                        <span class="weapon-stat-value">${unarmedAttackSign}${unarmedStrike.attackBonus}</span>
                    </div>
                    <div class="weapon-stat">
                        <span class="weapon-stat-label">Damage:</span>
                        <span class="weapon-stat-value">${unarmedStrike.damage}${unarmedDamageBonus} ${unarmedStrike.damageType}</span>
                    </div>
                </div>
                ${unarmedProperties ? `<div class="weapon-properties">${unarmedProperties}</div>` : ''}
            </div>
        `;
    }
    
    // Show racial natural weapon if applicable
    const racialWeapon = getRacialNaturalWeapon(npc.race, npc.modifiers);
    if (racialWeapon) {
        // Infants deal only 1 damage with no modifier, others use normal stats
        const racialAttackBonus = isInfant ? 0 : npc.modifiers.str + (npc.proficiencyBonus || 2);
        const racialAttackSign = racialAttackBonus >= 0 ? '+' : '';
        const racialDamage = isInfant ? '1' : racialWeapon.damage;
        const racialDamageSign = racialWeapon.damageBonus >= 0 ? '+' : '';
        const racialDamageBonus = isInfant ? '' : (racialWeapon.damageBonus !== 0 ? ` ${racialDamageSign}${racialWeapon.damageBonus}` : '');
        
        html += `
            <div class="weapon-card" title="${racialWeapon.description}" style="border-style: dashed; border-color: #8b6914;${isInfant ? ' opacity: 0.85;' : ''}">
                <div class="weapon-header">
                    <span class="weapon-name"><i class="fa-solid fa-paw" style="margin-right: 5px;"></i>${racialWeapon.name}</span>
                    <span class="weapon-type">Racial</span>
                </div>
                <div class="weapon-stats">
                    <div class="weapon-stat">
                        <span class="weapon-stat-label">Attack:</span>
                        <span class="weapon-stat-value">${racialAttackSign}${racialAttackBonus}</span>
                    </div>
                    <div class="weapon-stat">
                        <span class="weapon-stat-label">Damage:</span>
                        <span class="weapon-stat-value">${racialDamage}${racialDamageBonus} ${racialWeapon.damageType}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Then show equipped weapons
    if (npc.weapons && npc.weapons.length > 0) {
        npc.weapons.forEach((weapon, index) => {
            const modifier = weapon.modifier || 0;
            const totalAttackBonus = weapon.attackBonus + modifier;
            const totalDamageBonus = weapon.damageBonus + modifier;
            const attackSign = totalAttackBonus >= 0 ? '+' : '';
            const damageSign = totalDamageBonus >= 0 ? '+' : '';
            const damageBonus = totalDamageBonus !== 0 ? ` ${damageSign}${totalDamageBonus}` : '';
            const properties = weapon.properties && weapon.properties.length > 0 ? weapon.properties.join(', ') : '';
            const modifierBadge = modifier > 0 ? `<span class="weapon-modifier-badge">+${modifier}</span>` : '';
            
            html += `
                <div class="weapon-card" title="${weapon.description || ''}">
                    <div class="weapon-header">
                        <span class="weapon-name">${weapon.name}${modifierBadge}</span>
                        <span class="weapon-type">${weapon.type === 'improvised' ? 'Improvised' : (weapon.type === 'custom' ? 'Custom' : (weapon.type === 'natural' ? 'Natural' : (weapon.type + ' ' + weapon.category)))}</span>
                    </div>
                    <div class="weapon-stats">
                        <div class="weapon-stat">
                            <span class="weapon-stat-label">Attack:</span>
                            <span class="weapon-stat-value">${attackSign}${totalAttackBonus}</span>
                        </div>
                        <div class="weapon-stat">
                            <span class="weapon-stat-label">Damage:</span>
                            <span class="weapon-stat-value">${weapon.damage === '0' || weapon.damage === 'none' || weapon.damageType === 'none' ? 'No Damage' : `${weapon.damage}${damageBonus} ${weapon.damageType}`}</span>
                        </div>
                    </div>
                    ${properties ? `<div class="weapon-properties">${properties}</div>` : ''}
                    <div class="weapon-card-actions">
                        <button class="weapon-action-btn modifier" onclick="event.stopPropagation(); setWeaponModifier(${index})">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> ${modifier > 0 ? 'Change +' + modifier : 'Add Modifier'}
                        </button>
                        <button class="weapon-action-btn remove" onclick="event.stopPropagation(); removeWeapon(${index})">
                            <i class="fa-solid fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    html += `
        </div>
        <div class="weapon-add-buttons">
            <button class="weapon-add-btn" onclick="event.stopPropagation(); openWeaponModal()">
                <i class="fa-solid fa-plus"></i> Add Weapon
            </button>
            <button class="weapon-add-btn" onclick="event.stopPropagation(); openCustomWeaponModal()">
                <i class="fa-solid fa-hammer"></i> Custom Weapon
            </button>
        </div>
    `;

    html += `
            <div class="section-title"><i class="fa-solid fa-person"></i> Physical Traits</div>
            <div class="info-item">
                <span class="info-label">Size:</span>${capitalize(npc.size)}
            </div>
            <div class="info-item">
                <span class="info-label">Speed:</span>${npc.speed} feet
            </div>
    `;
    
    // Racial Traits
    if (npc.traits && npc.traits.length > 0) {
        html += `
            <div class="section-title"><i class="fa-solid fa-star"></i> Racial Traits</div>
            <div class="traits-list">
                ${npc.traits.map(trait => `<span class="trait-tag">${trait}</span>`).join('')}
            </div>
        `;
    }
    
    // Class Features
    const characterFeatures = getCharacterFeatures(npc.characterClasses || [{ className: npc.npcClass, level: npc.totalLevel || 1 }]);
    if (characterFeatures.length > 0) {
        html += `
            <div class="section-title"><i class="fa-solid fa-scroll"></i> Class Features</div>
            <div class="features-list">
                ${characterFeatures.map(f => `<span class="feature-tag" title="${f.description.replace(/"/g, '&quot;')}">${f.name} <span class="feature-level">(Lv ${f.level})</span></span>`).join('')}
            </div>
        `;
    }
    
    // Spells Section (only for spellcasters)
    if (npc.spellData) {
        const abilityNames = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };
        const spellAbilityName = abilityNames[npc.spellData.ability] || 'Unknown';
        
        html += `
            <div class="section-header">
                <div class="section-title" style="border-bottom: none; padding-bottom: 0;"><i class="fa-solid fa-hat-wizard"></i> Spellcasting</div>
                ${lockBtn('spells')}
            </div>
            <div class="spell-stats">
                <div class="spell-stat"><span class="spell-stat-label">Ability:</span> ${spellAbilityName}</div>
                <div class="spell-stat"><span class="spell-stat-label">Save DC:</span> ${npc.spellData.saveDC}</div>
                <div class="spell-stat"><span class="spell-stat-label">Attack:</span> +${npc.spellData.attackBonus}</div>
            </div>
        `;
        
        // Spell Slots
        const slotLabels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
        const activeSlots = npc.spellData.spellSlots.map((count, idx) => ({ level: idx + 1, label: slotLabels[idx], count })).filter(s => s.count > 0);
        
        if (activeSlots.length > 0) {
            html += `
                <div class="spell-slots-display">
                    ${activeSlots.map(s => `<span class="spell-slot-badge">${s.label}: ${s.count}</span>`).join('')}
                </div>
            `;
        }
        
        // Cantrips
        if (npc.spellData.cantrips && npc.spellData.cantrips.length > 0) {
            html += `
                <div class="spell-section-title">Cantrips</div>
                <div class="spells-list editable" onclick="event.stopPropagation(); openSpellModal('cantrips')">
                    ${npc.spellData.cantrips.map(spellId => {
                        const spell = spells[spellId];
                        return spell ? `<span class="spell-tag cantrip" title="${spell.description.substring(0, 200).replace(/"/g, '&quot;')}...">${spell.name}</span>` : '';
                    }).join('')}
                </div>
            `;
        }
        
        // Leveled Spells (grouped by level)
        if (npc.spellData.spells && npc.spellData.spells.length > 0) {
            // Group spells by level
            const spellsByLevel = {};
            npc.spellData.spells.forEach(spellId => {
                const spell = spells[spellId];
                if (spell) {
                    if (!spellsByLevel[spell.level]) spellsByLevel[spell.level] = [];
                    spellsByLevel[spell.level].push({ id: spellId, ...spell });
                }
            });
            
            html += `
                <div class="spell-section-title">Spells Known</div>
                <div class="spells-list editable" onclick="event.stopPropagation(); openSpellModal('spells')">
            `;
            
            // Sort levels and display
            Object.keys(spellsByLevel).sort((a, b) => a - b).forEach(level => {
                spellsByLevel[level].forEach(spell => {
                    html += `<span class="spell-tag level-${spell.level}" title="${spell.description.substring(0, 200).replace(/"/g, '&quot;')}...">${spell.name} <span class="spell-level-label">(${slotLabels[spell.level - 1]})</span></span>`;
                });
            });
            
            html += `</div>`;
        }
    }
    
    html += `
            <!-- Skills Section with Lock -->
            <div class="section-header">
                <div class="section-title" style="border-bottom: none; padding-bottom: 0;"><i class="fa-solid fa-book"></i> Skill Proficiencies</div>
                ${lockBtn('skills')}
            </div>
            <div style="border-bottom: 2px solid #e9ecef; margin-bottom: 10px;"></div>
            <div class="skills-list editable" style="padding: 5px; margin: -5px; border-radius: 6px;" onclick="event.stopPropagation(); openMultiSelectModal('skills', 'Skill Proficiencies', getAllSkills(), currentNPC.skills)">
    `;

    const allSkills = [
        'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History',
        'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception',
        'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'
    ];
    const proficiencyBonus = npc.proficiencyBonus || 2;
    
    allSkills.forEach(skill => {
        const isProficient = npc.skills.includes(skill);
        const ability = skillAbilities[skill] || 'int';
        const abilityMod = npc.modifiers[ability] || 0;
        const skillMod = isProficient ? abilityMod + proficiencyBonus : abilityMod;
        const modStr = skillMod >= 0 ? `+${skillMod}` : `${skillMod}`;
        html += `<span class="skill-tag ${isProficient ? 'proficient' : ''}">${skill} <span class="skill-modifier">(${modStr})</span></span>`;
    });

    html += `
            </div>

            <!-- Equipment Section with Lock -->
            <div class="section-header">
                <div class="section-title" style="border-bottom: none; padding-bottom: 0;"><i class="fa-solid fa-toolbox"></i> Equipment</div>
                ${lockBtn('equipment')}
            </div>
            <div style="border-bottom: 2px solid #e9ecef; margin-bottom: 10px;"></div>
            <div class="editable" id="editable-equipment" style="padding: 5px; margin: -5px; border-radius: 6px;" onclick="event.stopPropagation(); openMultiSelectModal('equipment', 'Equipment', getAllEquipment(), currentNPC.equipment)">
    `;

    if (npc.equipment.length > 0) {
        npc.equipment.forEach(item => {
            html += `<div class="info-item">${item}</div>`;
        });
    } else {
        html += `<div class="info-item" style="color: #6c757d; font-style: italic;">No notable equipment (click to add)</div>`;
    }

    html += `</div>`;

    if (npc.backstory) {
        html += `
            <!-- Backstory Section with Lock -->
            <div class="section-header">
                <div class="section-title" style="border-bottom: none; padding-bottom: 0;"><i class="fa-solid fa-scroll"></i> Backstory</div>
                ${lockBtn('backstory')}
            </div>
            <div style="border-bottom: 2px solid #e9ecef; margin-bottom: 10px;"></div>
            <div class="info-item editable" id="editable-backstory" onclick="editTextareaField('backstory', currentNPC.backstory, event)">${npc.backstory}</div>
        `;
    }

    // Portrait section
    html += `
        <div class="portrait-section" id="portraitSection">
            <div class="section-title"><i class="fa-solid fa-image"></i> Character Portrait</div>
            <div id="portraitContainer" class="portrait-container">
                <div class="portrait-placeholder" id="portraitPlaceholder">
                    <i class="fa-solid fa-user-circle"></i>
                    <span>Click below to generate a portrait</span>
                </div>
                <img id="portraitImage" class="portrait-image" style="display: none;" alt="Character Portrait">
                <div id="portraitLoading" class="portrait-loading" style="display: none;">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Generating portrait...</span>
                </div>
            </div>
            <div class="portrait-actions">
                <button class="generate-portrait-btn" onclick="generatePortrait()">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Generate Portrait
                </button>
                <button class="view-prompt-btn" onclick="generatePortraitPrompt()">
                    <i class="fa-solid fa-eye"></i> View Prompt
                </button>
            </div>
        </div>
        
        <!-- Export Actions -->
        <div class="export-section">
            <button class="export-pdf-btn" onclick="exportCharacterSheet()">
                <i class="fa-solid fa-file-pdf"></i> Export Character Sheet
            </button>
            <div class="checkbox-group" style="margin-top: 10px; justify-content: center;">
                <input type="checkbox" id="includeBackstory" checked>
                <label for="includeBackstory" style="margin: 0;"><i class="fa-solid fa-scroll"></i> Include Backstory in PDF</label>
            </div>
        </div>
    `;

    html += `</div>`;

    resultDiv.innerHTML = html;
    
    // Update form field states based on locks
    updateAllFormStates();
}

function capitalize(str) {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function toggleCharacterType() {
    const toggle = document.getElementById('characterTypeToggle');
    const isPC = toggle.checked;
    
    document.getElementById('npcLabel').style.fontWeight = isPC ? 'normal' : 'bold';
    document.getElementById('npcLabel').style.color = isPC ? '#888' : '#58180d';
    document.getElementById('pcLabel').style.fontWeight = isPC ? 'bold' : 'normal';
    document.getElementById('pcLabel').style.color = isPC ? '#1e7b34' : '#888';
    
    document.getElementById('statMethodNote').innerHTML = isPC 
        ? '<i class="fa-solid fa-list-ol"></i> Stats: Standard Array (15, 14, 13, 12, 10, 8)'
        : '<i class="fa-solid fa-dice"></i> Stats: Rolled (4d6 drop lowest)';
    
    document.getElementById('backgroundGroup').style.display = isPC ? 'block' : 'none';
    
    const classSelect = document.getElementById('npcClass');
    if (isPC && classSelect.value === 'commoner') {
        classSelect.value = 'random';
        onClassChange();
    }
}

function isPCMode() {
    const toggle = document.getElementById('characterTypeToggle');
    return toggle && toggle.checked;
}

function showRaceDescription() {
    const raceSelect = document.getElementById('race');
    const descriptionDiv = document.getElementById('raceDescription');
    const selectedRace = raceSelect.value;

    if (selectedRace === 'random' || !selectedRace) {
        descriptionDiv.classList.add('hidden');
        return;
    }

    const raceData = races[selectedRace];
    if (raceData && raceData.description) {
        const raceName = capitalize(selectedRace);
        descriptionDiv.innerHTML = `<strong>${raceName}</strong>${raceData.description}`;
        descriptionDiv.classList.remove('hidden');
    } else {
        descriptionDiv.classList.add('hidden');
    }
}

function showClassDescription() {
    const classSelect = document.getElementById('npcClass');
    const descriptionDiv = document.getElementById('classDescription');
    const selectedClass = classSelect.value;

    if (selectedClass === 'random' || !selectedClass) {
        descriptionDiv.classList.add('hidden');
        return;
    }

    const classData = classes[selectedClass];
    if (classData && classData.description) {
        const className = capitalize(selectedClass);
        const hitDie = classData.hitDie || 'd4';
        descriptionDiv.innerHTML = `<strong>${className}</strong> (${hitDie}) - ${classData.description}`;
        descriptionDiv.classList.remove('hidden');
    } else {
        descriptionDiv.classList.add('hidden');
    }
}

// Multiclass tracking
let multiclasses = []; // Array of {class: string, level: number}

function onClassChange() {
    showClassDescription();
    
    const classSelect = document.getElementById('npcClass');
    const levelSelect = document.getElementById('npcClassLevel');
    const subclassSelect = document.getElementById('npcSubclass');
    const occupationSelect = document.getElementById('occupation');
    const occupationDesc = document.getElementById('occupationDescription');
    const multiclassSection = document.getElementById('multiclassSection');
    const selectedClass = classSelect.value;
    
    const isCommoner = selectedClass === 'commoner';
    const isAdventurer = selectedClass !== 'commoner' && selectedClass !== 'random';
    
    // Show/hide level selector (for adventurers only, commoner is always level 0)
    levelSelect.style.display = isAdventurer ? 'block' : 'none';
    
    // Show multiclass section for both commoners and adventurers (commoners can be retired adventurers)
    multiclassSection.style.display = (isCommoner || isAdventurer) ? 'block' : 'none';
    
    // Show/hide occupation (for commoner only)
    occupationSelect.style.display = isCommoner ? 'block' : 'none';
    if (!isCommoner && occupationDesc) {
        occupationDesc.classList.add('hidden');
    }
    
    // Update subclass options
    updateSubclassOptions();
}

function onLevelChange() {
    updateSubclassOptions();
}

function updateSubclassOptions() {
    const classSelect = document.getElementById('npcClass');
    const levelSelect = document.getElementById('npcClassLevel');
    const subclassSelect = document.getElementById('npcSubclass');
    
    const selectedClass = classSelect.value;
    const selectedLevel = parseInt(levelSelect.value) || 1;
    
    // Get subclass data for this class
    const subclassData = subclasses[selectedClass];
    
    // Check if subclass is available at this level
    if (!subclassData || selectedLevel < subclassData.level || selectedClass === 'commoner' || selectedClass === 'random') {
        subclassSelect.style.display = 'none';
        return;
    }
    
    // Build subclass options
    let optionsHtml = '<option value="random">Random ' + subclassData.name + '</option>';
    subclassData.options.forEach(opt => {
        optionsHtml += `<option value="${opt.id}">${opt.name} (${opt.source})</option>`;
    });
    
    subclassSelect.innerHTML = optionsHtml;
    subclassSelect.style.display = 'block';
}

function addMulticlass() {
    const mainClass = document.getElementById('npcClass').value;
    
    // Get list of available classes (exclude commoner, random, and already selected classes)
    const usedClasses = [mainClass, ...multiclasses.map(m => m.className)];
    const availableClasses = Object.keys(classes).filter(c => 
        c !== 'commoner' && !usedClasses.includes(c)
    );
    
    if (availableClasses.length === 0) {
        alert('No more classes available for multiclassing!');
        return;
    }
    
    // Add a new multiclass with the first available class
    multiclasses.push({
        className: availableClasses[0],
        level: 1
    });
    
    renderMulticlasses();
}

function removeMulticlass(index) {
    multiclasses.splice(index, 1);
    renderMulticlasses();
}

function updateMulticlass(index, field, value) {
    if (field === 'class') {
        multiclasses[index].className = value;
        // Reset subclass when class changes
        multiclasses[index].subclass = 'random';
        renderMulticlasses(); // Re-render to show/hide subclass dropdown
    } else if (field === 'level') {
        multiclasses[index].level = parseInt(value);
        // Check if subclass should now appear/disappear
        const subclassData = subclasses[multiclasses[index].className];
        if (subclassData && parseInt(value) < subclassData.level) {
            multiclasses[index].subclass = null;
        }
        renderMulticlasses(); // Re-render to show/hide subclass dropdown
    } else if (field === 'subclass') {
        multiclasses[index].subclass = value;
    }
}

function renderMulticlasses() {
    const container = document.getElementById('multiclassContainer');
    const mainClass = document.getElementById('npcClass').value;
    const usedClasses = [mainClass, ...multiclasses.map(m => m.className)];
    
    let html = '';
    
    multiclasses.forEach((mc, index) => {
        // Available classes for this dropdown (current selection + unused classes)
        const availableForThis = Object.keys(classes).filter(c => 
            c !== 'commoner' && (c === mc.className || !usedClasses.includes(c))
        );
        
        // Check if subclass is available for this class and level
        const subclassData = subclasses[mc.className];
        const showSubclass = subclassData && mc.level >= subclassData.level;
        
        html += `
            <div class="multiclass-row">
                <select onchange="updateMulticlass(${index}, 'class', this.value)">
                    ${availableForThis.map(c => `
                        <option value="${c}" ${c === mc.className ? 'selected' : ''}>${capitalize(c)}</option>
                    `).join('')}
                </select>
                <select class="level-select" onchange="updateMulticlass(${index}, 'level', this.value)">
                    ${Array.from({length: 20}, (_, i) => i + 1).map(lvl => `
                        <option value="${lvl}" ${lvl === mc.level ? 'selected' : ''}>Lvl ${lvl}</option>
                    `).join('')}
                </select>
                <button type="button" class="remove-multiclass-btn" onclick="removeMulticlass(${index})">
                    <i class="fa-solid fa-times"></i>
                </button>
                ${showSubclass ? `
                    <select class="subclass-select" onchange="updateMulticlass(${index}, 'subclass', this.value)">
                        <option value="random" ${!mc.subclass || mc.subclass === 'random' ? 'selected' : ''}>Random ${subclassData.name}</option>
                        ${subclassData.options.map(opt => `
                            <option value="${opt.id}" ${mc.subclass === opt.id ? 'selected' : ''}>${opt.name}</option>
                        `).join('')}
                    </select>
                ` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function getTotalLevel() {
    const mainLevel = parseInt(document.getElementById('npcClassLevel').value) || 1;
    const multiLevels = multiclasses.reduce((sum, mc) => sum + mc.level, 0);
    return mainLevel + multiLevels;
}

function getProficiencyBonus(totalLevel) {
    if (totalLevel <= 4) return 2;
    if (totalLevel <= 8) return 3;
    if (totalLevel <= 12) return 4;
    if (totalLevel <= 16) return 5;
    return 6;
}

// Get class features for a character based on their classes and levels
function getCharacterFeatures(characterClasses) {
    if (!characterClasses || characterClasses.length === 0) return [];
    
    const features = [];
    characterClasses.forEach(cc => {
        const classFeatureList = classFeatures[cc.className] || [];
        classFeatureList.forEach(feature => {
            if (feature.level <= cc.level) {
                features.push({
                    ...feature,
                    className: cc.className
                });
            }
        });
    });
    
    // Sort by level, then by class name
    features.sort((a, b) => a.level - b.level || a.className.localeCompare(b.className));
    return features;
}

function calculateAC(primaryClassName, modifiers) {
    const classData = classes[primaryClassName];
    if (!classData || !classData.armor) {
        return { ac: 10 + modifiers.dex, armorName: 'Unarmored' };
    }
    
    const armor = classData.armor;
    let ac = armor.baseAC;
    let armorName = armor.name;
    
    // Add DEX modifier if applicable
    if (armor.addDex) {
        let dexBonus = modifiers.dex;
        if (armor.maxDex !== null) {
            dexBonus = Math.min(dexBonus, armor.maxDex);
        }
        ac += dexBonus;
    }
    
    // Handle special unarmored defense calculations
    if (armor.special === 'barbarian') {
        // Barbarian: 10 + DEX + CON
        ac = 10 + modifiers.dex + modifiers.con;
        armorName = 'Unarmored Defense';
    } else if (armor.special === 'monk') {
        // Monk: 10 + DEX + WIS
        ac = 10 + modifiers.dex + modifiers.wis;
        armorName = 'Unarmored Defense';
    }
    
    return { ac, armorName };
}

function showOccupationDescription() {
    const occSelect = document.getElementById('occupation');
    const descriptionDiv = document.getElementById('occupationDescription');
    const selectedOcc = occSelect.value;

    if (selectedOcc === 'random' || !selectedOcc) {
        descriptionDiv.classList.add('hidden');
        return;
    }

    const occData = occupations[selectedOcc];
    if (occData && occData.description) {
        const occName = selectedOcc.replace(/_/g, ' ').split(' ').map(w => capitalize(w)).join(' ');
        descriptionDiv.innerHTML = `<strong>${occName}</strong> - ${occData.description}`;
        descriptionDiv.classList.remove('hidden');
    } else {
        descriptionDiv.classList.add('hidden');
    }
}

// Show descriptions on page load if values are already selected
window.addEventListener('DOMContentLoaded', function() {
    showRaceDescription();
    showClassDescription();
    showOccupationDescription();
    onClassChange(); // Set initial state for occupation/subclass visibility
});

// ============================================
// INLINE EDITING FUNCTIONS
// ============================================

// Prevent multiple edits at once
let isEditing = false;

// Edit text field (Name)
function editTextField(field, currentValue, event) {
    if (event) event.stopPropagation();
    if (isEditing) return;
    isEditing = true;
    
    const element = document.getElementById(`editable-${field}`);
    if (!element) { isEditing = false; return; }
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-edit-input';
    input.value = currentValue;
    
    element.innerHTML = '';
    element.appendChild(input);
    element.classList.remove('editable');
    
    // Use setTimeout to ensure focus happens after DOM update
    setTimeout(() => {
        input.focus();
        input.select();
    }, 10);
    
    let saved = false;
    const saveEdit = () => {
        if (saved) return;
        saved = true;
        const newValue = input.value.trim();
        if (newValue && newValue !== currentValue) {
            currentNPC[field] = newValue;
            regenerateBackstoryIfNeeded();
        }
        isEditing = false;
        displayNPC(currentNPC);
    };
    
    // Delay blur handler attachment
    setTimeout(() => {
        input.addEventListener('blur', saveEdit);
    }, 100);
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            saved = true;
            isEditing = false;
            displayNPC(currentNPC);
        }
    });
}

// Edit age field (number input)
function editAgeField(event) {
    if (event) event.stopPropagation();
    if (isEditing) return;
    isEditing = true;
    
    const element = document.getElementById('editable-age');
    if (!element || !currentNPC) { isEditing = false; return; }
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'inline-edit-input';
    input.value = currentNPC.age;
    input.min = 0;
    input.max = 10000;
    input.style.width = '100px';
    
    element.innerHTML = '';
    element.appendChild(input);
    element.classList.remove('editable');
    
    setTimeout(() => {
        input.focus();
        input.select();
    }, 10);
    
    let saved = false;
    const saveEdit = () => {
        if (saved) return;
        saved = true;
        const newValue = parseInt(input.value);
        if (!isNaN(newValue) && newValue >= 0) {
            currentNPC.age = newValue;
            // Update age category based on new age
            currentNPC.ageCategory = determineAgeCategory(newValue, currentNPC.race);
            regenerateBackstoryIfNeeded();
        }
        isEditing = false;
        displayNPC(currentNPC);
    };
    
    setTimeout(() => {
        input.addEventListener('blur', saveEdit);
    }, 100);
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            saved = true;
            isEditing = false;
            displayNPC(currentNPC);
        }
    });
}

// Edit stat field (Ability Scores)
function editStatField(ability) {
    if (isEditing) return;
    isEditing = true;
    
    const element = document.getElementById(`editable-stat-${ability}`);
    if (!element || !currentNPC) { isEditing = false; return; }
    
    const currentValue = currentNPC.abilities[ability];
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'inline-edit-input';
    input.value = currentValue;
    input.min = 1;
    input.max = 30;
    input.style.width = '60px';
    input.style.textAlign = 'center';
    input.style.fontSize = '1.3em';
    input.style.fontWeight = 'bold';
    input.style.padding = '6px 4px';
    input.style.MozAppearance = 'textfield';  // Hide spinners in Firefox
    input.classList.add('stat-input');
    
    element.innerHTML = '';
    element.appendChild(input);
    element.classList.remove('editable');
    
    setTimeout(() => {
        input.focus();
        input.select();
    }, 10);
    
    let saved = false;
    const saveEdit = () => {
        if (saved) return;
        saved = true;
        let newValue = parseInt(input.value);
        // Clamp value between 1 and 30
        if (isNaN(newValue) || newValue < 1) newValue = 1;
        if (newValue > 30) newValue = 30;
        
        currentNPC.abilities[ability] = newValue;
        // Recalculate modifier
        currentNPC.modifiers[ability] = Math.floor((newValue - 10) / 2);
        
        // Recalculate HP if CON changed (unless custom HP is set)
        if (ability === 'con' && !currentNPC.customHP) {
            const classData = classes[currentNPC.npcClass];
            if (classData) {
                const hitDieMap = { 'd4': 4, 'd6': 6, 'd8': 8, 'd10': 10, 'd12': 12 };
                const hitDieMax = hitDieMap[classData.hitDie] || 4;
                currentNPC.hitPoints = hitDieMax + currentNPC.modifiers.con;
            }
        }
        
        isEditing = false;
        displayNPC(currentNPC);
    };
    
    setTimeout(() => {
        input.addEventListener('blur', saveEdit);
    }, 100);
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            saved = true;
            isEditing = false;
            displayNPC(currentNPC);
        }
    });
}

// Edit HP field
function editHPField() {
    if (isEditing) return;
    isEditing = true;
    
    const element = document.getElementById('editable-hp');
    if (!element || !currentNPC) { isEditing = false; return; }
    
    const currentValue = currentNPC.hitPoints;
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'inline-edit-input';
    input.value = currentValue;
    input.min = 1;
    input.max = 999;
    input.style.width = '60px';
    input.style.textAlign = 'center';
    input.style.MozAppearance = 'textfield';
    input.classList.add('stat-input');
    
    element.innerHTML = '';
    element.appendChild(input);
    element.classList.remove('editable');
    
    setTimeout(() => {
        input.focus();
        input.select();
    }, 10);
    
    let saved = false;
    const saveEdit = () => {
        if (saved) return;
        saved = true;
        let newValue = parseInt(input.value);
        if (isNaN(newValue) || newValue < 1) newValue = 1;
        if (newValue > 999) newValue = 999;
        
        currentNPC.hitPoints = newValue;
        currentNPC.customHP = true; // Mark as custom
        
        isEditing = false;
        displayNPC(currentNPC);
    };
    
    setTimeout(() => {
        input.addEventListener('blur', saveEdit);
    }, 100);
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            saved = true;
            isEditing = false;
            displayNPC(currentNPC);
        }
    });
}

// Edit AC field
function editACField() {
    if (isEditing) return;
    isEditing = true;
    
    const element = document.getElementById('editable-ac');
    if (!element || !currentNPC) { isEditing = false; return; }
    
    const currentValue = currentNPC.ac;
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'inline-edit-input';
    input.value = currentValue;
    input.min = 1;
    input.max = 30;
    input.style.width = '60px';
    input.style.textAlign = 'center';
    input.style.MozAppearance = 'textfield';
    input.classList.add('stat-input');
    
    element.innerHTML = '';
    element.appendChild(input);
    element.classList.remove('editable');
    
    setTimeout(() => {
        input.focus();
        input.select();
    }, 10);
    
    let saved = false;
    const saveEdit = () => {
        if (saved) return;
        saved = true;
        let newValue = parseInt(input.value);
        if (isNaN(newValue) || newValue < 1) newValue = 1;
        if (newValue > 30) newValue = 30;
        
        currentNPC.ac = newValue;
        currentNPC.customAC = true; // Mark as custom
        
        isEditing = false;
        displayNPC(currentNPC);
    };
    
    setTimeout(() => {
        input.addEventListener('blur', saveEdit);
    }, 100);
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            saved = true;
            isEditing = false;
            displayNPC(currentNPC);
        }
    });
}

// Edit class field with multiclass support
function editClassField(event) {
    if (event) event.stopPropagation();
    if (isEditing) return;
    if (!currentNPC) return;
    isEditing = true;
    
    const element = document.getElementById('editable-npcClass');
    if (!element) { isEditing = false; return; }
    
    // Build the class editor HTML
    const characterClasses = currentNPC.characterClasses || [{ className: currentNPC.npcClass, level: 1 }];
    
    let editorHtml = '<div class="inline-class-editor">';
    
    characterClasses.forEach((cc, index) => {
        const availableClasses = Object.keys(classes).filter(c => c !== 'commoner');
        const subclassData = subclasses[cc.className];
        const showSubclass = subclassData && cc.level >= subclassData.level;
        
        editorHtml += `
            <div class="inline-class-row" data-index="${index}">
                <select class="inline-class-select" data-index="${index}">
                    ${index === 0 ? '<option value="commoner">Commoner</option>' : ''}
                    ${availableClasses.map(c => `
                        <option value="${c}" ${c === cc.className ? 'selected' : ''}>${capitalize(c)}</option>
                    `).join('')}
                </select>
                <select class="inline-level-select" data-index="${index}">
                    ${Array.from({length: 20}, (_, i) => i + 1).map(lvl => `
                        <option value="${lvl}" ${lvl === cc.level ? 'selected' : ''}>Lvl ${lvl}</option>
                    `).join('')}
                </select>
                ${showSubclass ? `
                    <select class="inline-subclass-select" data-index="${index}">
                        ${subclassData.options.map(opt => `
                            <option value="${opt.id}" ${opt.id === cc.subclass ? 'selected' : ''}>${opt.name}</option>
                        `).join('')}
                    </select>
                ` : ''}
                ${index > 0 ? `<button type="button" class="inline-remove-class" data-index="${index}"><i class="fa-solid fa-times"></i></button>` : ''}
            </div>
        `;
    });
    
    editorHtml += `
        <div class="inline-class-actions">
            <button type="button" class="inline-add-class"><i class="fa-solid fa-plus"></i> Add Class</button>
            <button type="button" class="inline-save-class"><i class="fa-solid fa-check"></i> Done</button>
        </div>
    </div>`;
    
    element.innerHTML = editorHtml;
    element.classList.remove('editable');
    
    // Add event listeners
    const editor = element.querySelector('.inline-class-editor');
    
    // Class select changes
    editor.querySelectorAll('.inline-class-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.index);
            const newClassName = e.target.value;
            currentNPC.characterClasses[idx].className = newClassName;
            if (idx === 0) currentNPC.npcClass = newClassName;
            
            // Reset subclass when class changes and set random if eligible
            const newSubclassData = subclasses[newClassName];
            const currentLevel = currentNPC.characterClasses[idx].level;
            if (newSubclassData && currentLevel >= newSubclassData.level) {
                currentNPC.characterClasses[idx].subclass = newSubclassData.options[0].id;
            } else {
                currentNPC.characterClasses[idx].subclass = null;
            }
            
            // Re-render editor to show/hide subclass
            recalculateNPCFromClasses();
            isEditing = false;
            displayNPC(currentNPC);
            setTimeout(() => editClassField(null), 50);
        });
    });
    
    // Level select changes
    editor.querySelectorAll('.inline-level-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.index);
            const newLevel = parseInt(e.target.value);
            const className = currentNPC.characterClasses[idx].className;
            currentNPC.characterClasses[idx].level = newLevel;
            
            // Check if subclass should now be shown/hidden
            const subclassData = subclasses[className];
            if (subclassData) {
                if (newLevel >= subclassData.level && !currentNPC.characterClasses[idx].subclass) {
                    // Reached subclass level, pick first option
                    currentNPC.characterClasses[idx].subclass = subclassData.options[0].id;
                    // Re-render to show subclass
                    recalculateNPCFromClasses();
                    isEditing = false;
                    displayNPC(currentNPC);
                    setTimeout(() => editClassField(null), 50);
                } else if (newLevel < subclassData.level && currentNPC.characterClasses[idx].subclass) {
                    // Below subclass level, remove it
                    currentNPC.characterClasses[idx].subclass = null;
                    recalculateNPCFromClasses();
                    isEditing = false;
                    displayNPC(currentNPC);
                    setTimeout(() => editClassField(null), 50);
                }
            }
        });
    });
    
    // Subclass select changes
    editor.querySelectorAll('.inline-subclass-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.index);
            currentNPC.characterClasses[idx].subclass = e.target.value;
        });
    });
    
    // Remove class buttons
    editor.querySelectorAll('.inline-remove-class').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.closest('.inline-remove-class').dataset.index);
            currentNPC.characterClasses.splice(idx, 1);
            recalculateNPCFromClasses();
            isEditing = false;
            displayNPC(currentNPC);
            // Re-open editor
            setTimeout(() => editClassField(null), 50);
        });
    });
    
    // Add class button
    editor.querySelector('.inline-add-class').addEventListener('click', () => {
        const usedClasses = currentNPC.characterClasses.map(cc => cc.className);
        const availableClasses = Object.keys(classes).filter(c => 
            c !== 'commoner' && !usedClasses.includes(c)
        );
        if (availableClasses.length > 0) {
            const newClass = availableClasses[0];
            const newSubclassData = subclasses[newClass];
            // New multiclass starts at level 1, check if subclass available at level 1
            const newSubclass = (newSubclassData && newSubclassData.level <= 1) ? newSubclassData.options[0].id : null;
            currentNPC.characterClasses.push({ className: newClass, level: 1, subclass: newSubclass });
            recalculateNPCFromClasses();
            isEditing = false;
            displayNPC(currentNPC);
            setTimeout(() => editClassField(null), 50);
        }
    });
    
    // Done button
    const doneBtn = editor.querySelector('.inline-save-class');
    if (doneBtn) {
        doneBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            recalculateNPCFromClasses();
            isEditing = false;
            displayNPC(currentNPC);
        });
    }
}

function recalculateNPCFromClasses() {
    if (!currentNPC || !currentNPC.characterClasses) return;
    
    const characterClasses = currentNPC.characterClasses;
    currentNPC.npcClass = characterClasses[0]?.className || 'commoner';
    
    // Recalculate total level (commoner is level 0, doesn't count)
    currentNPC.totalLevel = characterClasses.reduce((sum, cc) => cc.className === 'commoner' ? sum : sum + cc.level, 0) || 1;
    
    // Recalculate proficiency bonus
    currentNPC.proficiencyBonus = getProficiencyBonus(currentNPC.totalLevel);
    
    // Recalculate HP (level 0 classes like commoner don't contribute)
    const hitDieMap = { 'd4': 4, 'd6': 6, 'd8': 8, 'd10': 10, 'd12': 12 };
    let hitPoints = 0;
    let hitDiceStr = [];
    let firstAdventurerClass = true;
    
    characterClasses.forEach((cc, index) => {
        // Skip level 0 classes (like commoner)
        if (cc.level <= 0) return;
        
        const cd = classes[cc.className];
        if (!cd) return;
        const hitDieMax = hitDieMap[cd.hitDie] || 4;
        const hitDieAvg = Math.floor(hitDieMax / 2) + 1;
        
        if (firstAdventurerClass) {
            hitPoints += hitDieMax + currentNPC.modifiers.con;
            for (let lvl = 2; lvl <= cc.level; lvl++) {
                hitPoints += hitDieAvg + currentNPC.modifiers.con;
            }
            firstAdventurerClass = false;
        } else {
            for (let lvl = 1; lvl <= cc.level; lvl++) {
                hitPoints += hitDieAvg + currentNPC.modifiers.con;
            }
        }
        
        hitDiceStr.push(`${cc.level}${cd.hitDie}`);
    });
    
    // Only update HP if not custom
    if (!currentNPC.customHP) {
        // For pure commoners (level 0), give them 1 HP + CON modifier
        if (hitPoints === 0) {
            currentNPC.hitPoints = Math.max(1, 1 + currentNPC.modifiers.con);
            currentNPC.hitDice = '';
        } else {
            currentNPC.hitPoints = Math.max(1, hitPoints);
            currentNPC.hitDice = hitDiceStr.join(' + ');
        }
    }
    
    // Update saving throws from primary class
    const primaryClassData = classes[characterClasses[0]?.className];
    currentNPC.savingThrows = primaryClassData?.savingThrows || [];
    
    // Recalculate AC based on primary class (only if not custom)
    if (!currentNPC.customAC) {
        const acData = calculateAC(characterClasses[0]?.className || 'commoner', currentNPC.modifiers);
        currentNPC.ac = acData.ac;
        currentNPC.armorName = acData.armorName;
    }
    
    // Combine skills from all classes
    let allClassSkills = [];
    characterClasses.forEach(cc => {
        const cd = classes[cc.className];
        if (cd && cd.skills) {
            allClassSkills = [...allClassSkills, ...cd.skills];
        }
    });
    const occData = occupations[currentNPC.occupation];
    const occSkills = occData?.skills || [];
    currentNPC.skills = [...new Set([...allClassSkills, ...occSkills])];
    
    // Recalculate passive perception
    currentNPC.passivePerception = 10 + currentNPC.modifiers.wis + (currentNPC.skills.includes('Perception') ? currentNPC.proficiencyBonus : 0);
    
    // Regenerate backstory if not locked
    regenerateBackstoryIfNeeded();
}

// Edit textarea field (Backstory)
function editTextareaField(field, currentValue, event) {
    if (event) event.stopPropagation();
    if (isEditing) return;
    isEditing = true;
    
    const element = document.getElementById(`editable-${field}`);
    if (!element) { isEditing = false; return; }
    
    const textarea = document.createElement('textarea');
    textarea.className = 'inline-edit-textarea';
    textarea.value = currentValue;
    
    element.innerHTML = '';
    element.appendChild(textarea);
    element.classList.remove('editable');
    
    setTimeout(() => {
        textarea.focus();
    }, 10);
    
    let saved = false;
    const saveEdit = () => {
        if (saved) return;
        saved = true;
        const newValue = textarea.value.trim();
        if (newValue) {
            currentNPC[field] = newValue;
        }
        isEditing = false;
        displayNPC(currentNPC);
    };
    
    setTimeout(() => {
        textarea.addEventListener('blur', saveEdit);
    }, 100);
    
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            saved = true;
            isEditing = false;
            displayNPC(currentNPC);
        }
    });
}

// Edit single-select field (Race, Class, Occupation, Gender, Alignment)
function editSelectField(field, currentValue, options, event) {
    if (event) event.stopPropagation();
    if (isEditing) return;
    isEditing = true;
    
    const element = document.getElementById(`editable-${field}`);
    if (!element) { isEditing = false; return; }
    
    const select = document.createElement('select');
    select.className = 'inline-edit-select';
    
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        if (opt.value === currentValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    element.innerHTML = '';
    element.appendChild(select);
    element.classList.remove('editable');
    
    const finishEdit = () => {
        if (!isEditing) return;
        // Save the current value
        const newValue = select.value;
        if (newValue !== currentValue) {
            updateNPCField(field, newValue);
        }
        isEditing = false;
        displayNPC(currentNPC);
    };
    
    // Only close on blur (when clicking outside)
    select.addEventListener('blur', finishEdit);
    
    select.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            isEditing = false;
            displayNPC(currentNPC);
        } else if (e.key === 'Enter') {
            finishEdit();
        }
    });
    
    // Focus the select
    select.focus();
}

// Update NPC field with recalculations if needed
function updateNPCField(field, newValue) {
    currentNPC[field] = newValue;
    
    // Recalculate dependent fields
    if (field === 'race') {
        const raceData = races[newValue];
        if (raceData) {
            currentNPC.size = raceData.size;
            currentNPC.speed = raceData.speed;
        }
    }
    
    if (field === 'npcClass') {
        const classData = classes[newValue];
        if (classData) {
            currentNPC.hitDie = classData.hitDie;
            currentNPC.savingThrows = classData.savingThrows || [];
            // Recalculate HP
            const hitDieMap = { 'd4': 4, 'd6': 6, 'd8': 8, 'd10': 10, 'd12': 12 };
            const hitDieMax = hitDieMap[classData.hitDie] || 4;
            currentNPC.hitPoints = hitDieMax + currentNPC.modifiers.con;
        }
    }
    
    if (field === 'occupation') {
        const occData = occupations[newValue];
        if (occData && !lockStates.equipment) {
            currentNPC.equipment = occData.equipment || [];
        }
    }
    
    // Regenerate backstory if not locked
    regenerateBackstoryIfNeeded();
}

// Regenerate backstory if not locked
function regenerateBackstoryIfNeeded() {
    if (!currentNPC || lockStates.backstory) return;
    
    currentNPC.backstory = generateBackstory(
        currentNPC.name,
        currentNPC.race,
        currentNPC.occupation,
        currentNPC.age,
        currentNPC.alignment,
        currentNPC.ageCategory,
        currentNPC.gender,
        currentNPC.characterClasses
    );
}

// Get options for select fields
function getRaceOptions() {
    return Object.keys(races).map(r => ({
        value: r,
        label: capitalize(r)
    })).sort((a, b) => a.label.localeCompare(b.label));
}

function getClassOptions() {
    return Object.keys(classes).map(c => ({
        value: c,
        label: capitalize(c)
    })).sort((a, b) => a.label.localeCompare(b.label));
}

function getOccupationOptions() {
    // Filter out auto-assigned occupations (infant, adventurer)
    return Object.keys(occupations)
        .filter(o => o !== 'infant' && o !== 'adventurer')
        .map(o => ({
            value: o,
            label: o.replace(/_/g, ' ').split(' ').map(w => capitalize(w)).join(' ')
        })).sort((a, b) => a.label.localeCompare(b.label));
}

function getGenderOptions() {
    return [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'non-binary', label: 'Non-Binary' }
    ];
}

function getAlignmentOptions() {
    return alignments.map(a => ({
        value: a,
        label: capitalize(a)
    }));
}

// ============================================
// MODAL FUNCTIONS FOR MULTI-SELECT
// ============================================

let currentModalField = null;
let currentModalSelections = [];
let currentMaxSkills = 0;
let currentLockedSkills = [];

// Get skills that are locked (granted by race/class and cannot be unselected)
function getLockedSkills() {
    if (!currentNPC) return [];
    
    let locked = [];
    
    // Add class skills (from all classes)
    if (currentNPC.characterClasses) {
        currentNPC.characterClasses.forEach(cc => {
            const classData = classes[cc.className];
            if (classData && classData.skills) {
                locked = [...locked, ...classData.skills];
            }
        });
    }
    
    // Add racial trait skills (only traits that grant SPECIFIC skills, not choices)
    const raceData = races[currentNPC.race];
    if (raceData && raceData.traits) {
        raceData.traits.forEach(trait => {
            // Keen Senses (Elf variants) → Perception
            if (trait.includes('Keen Senses')) {
                locked.push('Perception');
            }
            // Menacing (Half-Orc) → Intimidation
            if (trait.includes('Menacing')) {
                locked.push('Intimidation');
            }
            // Kender Ace → Sleight of Hand
            if (trait.includes('Kender Ace')) {
                locked.push('Sleight of Hand');
            }
            // Silent Feathers (Owlin) → Stealth
            if (trait.includes('Silent Feathers')) {
                locked.push('Stealth');
            }
            // Cat's Talent (Tabaxi) → Perception + Stealth
            if (trait.includes('Cat\'s Talent')) {
                locked.push('Perception', 'Stealth');
            }
            // Observant & Athletic (Locathah) → Athletics + Perception
            if (trait.includes('Observant & Athletic')) {
                locked.push('Athletics', 'Perception');
            }
            // Reveler (Satyr) → Performance + Persuasion
            if (trait.includes('Reveler')) {
                locked.push('Performance', 'Persuasion');
            }
            // Note: Hunter's Instincts, Primal Intuition, Kenku Training, Skill Versatility, 
            // Extra Skill, Specialized Design grant CHOICES, so they're not locked to specific skills
        });
    }
    
    // Add occupation skills
    const occData = occupations[currentNPC.occupation];
    if (occData && occData.skills) {
        locked = [...locked, ...occData.skills];
    }
    
    return [...new Set(locked)]; // Remove duplicates
}

// Calculate maximum allowed skill proficiencies
function getMaxSkillProficiencies() {
    if (!currentNPC || !currentNPC.characterClasses) return 2;
    
    let maxSkills = 0;
    
    // Get skill choices from primary class only (first in list)
    const primaryClass = currentNPC.characterClasses[0];
    if (primaryClass && classes[primaryClass.className]) {
        maxSkills = classes[primaryClass.className].skillChoices || 2;
    }
    
    // Add racial skill bonuses based on traits
    const raceData = races[currentNPC.race];
    if (raceData && raceData.traits) {
        raceData.traits.forEach(trait => {
            // Traits that grant 2 skill proficiencies
            if (trait.includes('Skill Versatility') ||     // Half-Elf: 2 skills of choice
                trait.includes('Kenku Training') ||        // Kenku: 2 from Acrobatics/Deception/Stealth/Sleight of Hand
                trait.includes('Cat\'s Talent') ||         // Tabaxi: Perception + Stealth
                trait.includes('Hunter\'s Instincts') ||   // Leonin: choice from Athletics/Intimidation/Perception/Survival
                trait.includes('Primal Intuition') ||      // Orc: 2 from Animal Handling/Insight/Intimidation/Medicine/Nature/Perception/Survival
                trait.includes('Observant & Athletic') ||  // Locathah: Athletics + Perception
                trait.includes('Reveler')) {               // Satyr: Performance + Persuasion
                maxSkills += 2;
            }
            // Traits that grant 1 skill proficiency
            else if (trait.includes('Keen Senses') ||      // Elf/variants: Perception
                trait.includes('Menacing') ||              // Half-Orc: Intimidation
                trait.includes('Kender Ace') ||            // Kender: Sleight of Hand
                trait.includes('Silent Feathers') ||       // Owlin: Stealth
                trait.includes('Extra Skill') ||           // Human: 1 skill of choice
                trait.includes('Specialized Design')) {    // Warforged/Autognome: 1 skill of choice
                maxSkills += 1;
            }
        });
    }
    
    return maxSkills;
}

// Update the skill count display
function updateSkillCountDisplay() {
    const warningDiv = document.getElementById('skillCountWarning');
    const countText = document.getElementById('skillCountText');
    
    if (currentModalField !== 'skills' || !warningDiv) {
        warningDiv.style.display = 'none';
        return;
    }
    
    const selected = currentModalSelections.length;
    const locked = currentLockedSkills.length;
    const max = currentMaxSkills;
    
    warningDiv.style.display = 'flex';
    
    if (selected <= max) {
        warningDiv.className = 'skill-count-warning ok';
        const lockedNote = locked > 0 ? ` (${locked} from race/class/occupation)` : '';
        countText.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${selected} of ${max} proficiencies selected${lockedNote}`;
    } else {
        warningDiv.className = 'skill-count-warning error';
        const lockedNote = locked > 0 ? ` (${locked} locked)` : '';
        countText.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${selected} selected — exceeds limit of ${max}${lockedNote}`;
    }
}

// Spell Modal Variables
let currentSpellModalType = null; // 'cantrips' or 'spells'
let currentSpellSelections = [];

function openSpellModal(type) {
    if (!currentNPC || !currentNPC.spellData) return;
    
    currentSpellModalType = type;
    const isCantrips = type === 'cantrips';
    
    // Get current selections
    currentSpellSelections = isCantrips ? [...currentNPC.spellData.cantrips] : [...currentNPC.spellData.spells];
    
    // Get primary class for spell list
    const primaryClass = currentNPC.characterClasses[0];
    let spellClassName = primaryClass.className;
    
    // Handle subclass spellcasters
    if (primaryClass.subclass === 'eldritch-knight') {
        spellClassName = 'wizard';
    } else if (primaryClass.subclass === 'arcane-trickster') {
        spellClassName = 'wizard';
    }
    
    // Get available spells for this class
    const maxLevel = currentNPC.spellData.maxSpellLevel;
    const availableSpells = Object.keys(spells).filter(spellId => {
        const spell = spells[spellId];
        if (!spell.classes.includes(spellClassName)) return false;
        if (isCantrips) return spell.level === 0;
        return spell.level > 0 && spell.level <= maxLevel;
    }).sort((a, b) => {
        const spellA = spells[a];
        const spellB = spells[b];
        if (spellA.level !== spellB.level) return spellA.level - spellB.level;
        return spellA.name.localeCompare(spellB.name);
    });
    
    const modal = document.getElementById('spellSelectModal');
    const modalTitle = document.getElementById('spellModalTitle');
    const modalOptions = document.getElementById('spellModalOptions');
    const maxCount = isCantrips ? currentNPC.spellData.cantripsKnown : currentNPC.spellData.spellsKnownCount;
    
    modalTitle.innerHTML = `<i class="fa-solid fa-hat-wizard"></i> Edit ${isCantrips ? 'Cantrips' : 'Spells'} (${currentSpellSelections.length}/${maxCount})`;
    
    // Build options HTML grouped by level
    let optionsHtml = '';
    const slotLabels = ['Cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
    let currentLevel = -1;
    
    availableSpells.forEach(spellId => {
        const spell = spells[spellId];
        if (spell.level !== currentLevel) {
            currentLevel = spell.level;
            optionsHtml += `<div class="spell-modal-level-header">${slotLabels[currentLevel]} Level</div>`;
        }
        
        const isSelected = currentSpellSelections.includes(spellId);
        optionsHtml += `
            <div class="modal-option ${isSelected ? 'selected' : ''}" onclick="toggleSpellOption(this, '${spellId}')" title="${spell.description.substring(0, 300).replace(/"/g, '&quot;')}...">
                <span class="modal-option-checkbox"></span>
                <span>${spell.name}</span>
                <span class="spell-school">${spell.school}</span>
            </div>
        `;
    });
    
    modalOptions.innerHTML = optionsHtml;
    modal.classList.add('active');
    updateSpellModalCount();
}

function toggleSpellOption(element, spellId) {
    element.classList.toggle('selected');
    
    if (element.classList.contains('selected')) {
        if (!currentSpellSelections.includes(spellId)) {
            currentSpellSelections.push(spellId);
        }
    } else {
        currentSpellSelections = currentSpellSelections.filter(s => s !== spellId);
    }
    
    updateSpellModalCount();
}

function updateSpellModalCount() {
    const isCantrips = currentSpellModalType === 'cantrips';
    const maxCount = isCantrips ? currentNPC.spellData.cantripsKnown : currentNPC.spellData.spellsKnownCount;
    const modalTitle = document.getElementById('spellModalTitle');
    const count = currentSpellSelections.length;
    
    let statusClass = count <= maxCount ? 'ok' : 'over';
    modalTitle.innerHTML = `<i class="fa-solid fa-hat-wizard"></i> Edit ${isCantrips ? 'Cantrips' : 'Spells'} <span class="spell-count-${statusClass}">(${count}/${maxCount})</span>`;
}

function closeSpellModal() {
    const modal = document.getElementById('spellSelectModal');
    modal.classList.remove('active');
    currentSpellModalType = null;
    currentSpellSelections = [];
}

function saveSpellSelections() {
    if (currentSpellModalType && currentNPC && currentNPC.spellData) {
        if (currentSpellModalType === 'cantrips') {
            currentNPC.spellData.cantrips = [...currentSpellSelections];
        } else {
            currentNPC.spellData.spells = [...currentSpellSelections];
        }
        displayNPC(currentNPC);
    }
    closeSpellModal();
}

// ============================================
// WEAPON MODAL FUNCTIONS
// ============================================

let selectedWeaponId = null;
let currentWeaponModifierIndex = null;

function openWeaponModal() {
    if (!currentNPC) return;
    
    selectedWeaponId = null;
    document.getElementById('weaponSearchInput').value = '';
    document.getElementById('weaponTypeFilter').value = 'all';
    document.getElementById('weaponCategoryFilter').value = 'all';
    document.getElementById('weaponModifierSelect').value = '0';
    
    renderWeaponList();
    
    const modal = document.getElementById('weaponSelectModal');
    modal.classList.add('active');
}

function renderWeaponList() {
    const searchTerm = document.getElementById('weaponSearchInput').value.toLowerCase();
    const typeFilter = document.getElementById('weaponTypeFilter').value;
    const categoryFilter = document.getElementById('weaponCategoryFilter').value;
    
    const container = document.getElementById('weaponModalOptions');
    
    // Filter weapons
    const filteredWeapons = Object.keys(weapons).filter(weaponId => {
        const weapon = weapons[weaponId];
        
        // Search filter
        if (searchTerm && !weapon.name.toLowerCase().includes(searchTerm)) return false;
        
        // Type filter
        if (typeFilter !== 'all' && weapon.type !== typeFilter) return false;
        
        // Category filter
        if (categoryFilter !== 'all' && weapon.category !== categoryFilter) return false;
        
        return true;
    }).sort((a, b) => {
        const weaponA = weapons[a];
        const weaponB = weapons[b];
        // Sort by type, then category, then name
        if (weaponA.type !== weaponB.type) return weaponA.type.localeCompare(weaponB.type);
        if (weaponA.category !== weaponB.category) return weaponA.category.localeCompare(weaponB.category);
        return weaponA.name.localeCompare(weaponB.name);
    });
    
    if (filteredWeapons.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 20px;">No weapons match your filters</div>';
        return;
    }
    
    let html = '';
    filteredWeapons.forEach(weaponId => {
        const weapon = weapons[weaponId];
        const isSelected = selectedWeaponId === weaponId;
        const isProficient = currentNPC ? isWeaponProficient(currentNPC.characterClasses?.[0]?.className || 'commoner', weaponId) : false;
        const profBadge = isProficient ? '<span style="color: #28a745; font-size: 0.75em; margin-left: 5px;">(Proficient)</span>' : '';
        
        html += `
            <div class="weapon-modal-item ${isSelected ? 'selected' : ''}" onclick="selectWeaponInModal('${weaponId}')">
                <div class="weapon-modal-item-info">
                    <div class="weapon-modal-item-name">${weapon.name}${profBadge}</div>
                    <div class="weapon-modal-item-details">${capitalize(weapon.type)} ${weapon.category} • ${weapon.properties.length > 0 ? weapon.properties.join(', ') : 'No special properties'}</div>
                </div>
                <div class="weapon-modal-item-stats">
                    <div>${weapon.damage === '0' || weapon.damage === 'none' || weapon.damageType === 'none' ? '<strong>No Damage</strong>' : `<strong>${weapon.damage}</strong> ${weapon.damageType}`}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function filterWeaponList() {
    renderWeaponList();
}

function selectWeaponInModal(weaponId) {
    selectedWeaponId = weaponId;
    renderWeaponList();
}

function addSelectedWeapon() {
    if (!selectedWeaponId || !currentNPC) {
        alert('Please select a weapon first');
        return;
    }
    
    const weapon = weapons[selectedWeaponId];
    const modifier = parseInt(document.getElementById('weaponModifierSelect').value) || 0;
    const profBonus = currentNPC.proficiencyBonus || 2;
    const isProficient = isWeaponProficient(currentNPC.characterClasses?.[0]?.className || 'commoner', selectedWeaponId);
    
    const newWeapon = {
        ...weapon,
        id: selectedWeaponId,
        isProficient: isProficient,
        modifier: modifier,
        attackBonus: calculateAttackBonus(weapon, currentNPC.modifiers, profBonus, isProficient),
        damageBonus: calculateDamageBonus(weapon, currentNPC.modifiers)
    };
    
    if (!currentNPC.weapons) currentNPC.weapons = [];
    currentNPC.weapons.push(newWeapon);
    
    closeWeaponModal();
    displayNPC(currentNPC);
}

function closeWeaponModal() {
    const modal = document.getElementById('weaponSelectModal');
    modal.classList.remove('active');
    selectedWeaponId = null;
}

// Custom Weapon Modal
function openCustomWeaponModal() {
    if (!currentNPC) return;
    
    // Reset form
    document.getElementById('customWeaponName').value = '';
    document.getElementById('customWeaponDamage').value = '';
    document.getElementById('customWeaponDamageType').value = 'slashing';
    document.getElementById('customWeaponCategory').value = 'melee';
    document.getElementById('customWeaponAbility').value = 'str';
    document.getElementById('customWeaponModifier').value = '0';
    document.getElementById('customWeaponProperties').value = '';
    document.getElementById('customWeaponDescription').value = '';
    
    const modal = document.getElementById('customWeaponModal');
    modal.classList.add('active');
}

function closeCustomWeaponModal() {
    const modal = document.getElementById('customWeaponModal');
    modal.classList.remove('active');
}

function addCustomWeapon() {
    const name = document.getElementById('customWeaponName').value.trim();
    const damage = document.getElementById('customWeaponDamage').value.trim();
    const damageType = document.getElementById('customWeaponDamageType').value;
    const category = document.getElementById('customWeaponCategory').value;
    const ability = document.getElementById('customWeaponAbility').value;
    const modifier = parseInt(document.getElementById('customWeaponModifier').value) || 0;
    const propertiesStr = document.getElementById('customWeaponProperties').value.trim();
    const description = document.getElementById('customWeaponDescription').value.trim();
    
    if (!name || !damage) {
        alert('Please enter at least a weapon name and damage');
        return;
    }
    
    const properties = propertiesStr ? propertiesStr.split(',').map(p => p.trim()).filter(p => p) : [];
    if (ability === 'finesse' && !properties.includes('finesse')) {
        properties.push('finesse');
    }
    
    const profBonus = currentNPC.proficiencyBonus || 2;
    
    // Calculate attack bonus based on ability
    let attackBonus;
    if (ability === 'finesse') {
        attackBonus = Math.max(currentNPC.modifiers.str, currentNPC.modifiers.dex) + profBonus;
    } else if (ability === 'dex' || category === 'ranged') {
        attackBonus = currentNPC.modifiers.dex + profBonus;
    } else {
        attackBonus = currentNPC.modifiers.str + profBonus;
    }
    
    // Calculate damage bonus
    let damageBonus;
    if (ability === 'finesse') {
        damageBonus = Math.max(currentNPC.modifiers.str, currentNPC.modifiers.dex);
    } else if (ability === 'dex' || category === 'ranged') {
        damageBonus = currentNPC.modifiers.dex;
    } else {
        damageBonus = currentNPC.modifiers.str;
    }
    
    const newWeapon = {
        id: 'custom-' + Date.now(),
        name: name,
        type: 'custom',
        category: category,
        damage: damage,
        damageType: damageType,
        properties: properties,
        description: description || 'A custom weapon.',
        isProficient: true,
        modifier: modifier,
        attackBonus: attackBonus,
        damageBonus: damageBonus
    };
    
    if (!currentNPC.weapons) currentNPC.weapons = [];
    currentNPC.weapons.push(newWeapon);
    
    closeCustomWeaponModal();
    displayNPC(currentNPC);
}

// Weapon Modifier Modal
function setWeaponModifier(index) {
    if (!currentNPC || !currentNPC.weapons || !currentNPC.weapons[index]) return;
    
    currentWeaponModifierIndex = index;
    const weapon = currentNPC.weapons[index];
    
    document.getElementById('weaponModifierName').textContent = weapon.name;
    document.getElementById('weaponModifierValue').value = weapon.modifier || 0;
    
    const modal = document.getElementById('weaponModifierModal');
    modal.classList.add('active');
}

function closeWeaponModifierModal() {
    const modal = document.getElementById('weaponModifierModal');
    modal.classList.remove('active');
    currentWeaponModifierIndex = null;
}

function saveWeaponModifier() {
    if (currentWeaponModifierIndex === null || !currentNPC || !currentNPC.weapons) return;
    
    const modifier = parseInt(document.getElementById('weaponModifierValue').value) || 0;
    currentNPC.weapons[currentWeaponModifierIndex].modifier = modifier;
    
    closeWeaponModifierModal();
    displayNPC(currentNPC);
}

// Remove Weapon
function removeWeapon(index) {
    if (!currentNPC || !currentNPC.weapons) return;
    
    currentNPC.weapons.splice(index, 1);
    displayNPC(currentNPC);
}

function openMultiSelectModal(field, title, options, currentSelections) {
    currentModalField = field;
    currentModalSelections = [...currentSelections];
    currentMaxSkills = getMaxSkillProficiencies();
    currentLockedSkills = field === 'skills' ? getLockedSkills() : [];
    
    // Ensure locked skills are always selected
    currentLockedSkills.forEach(skill => {
        if (!currentModalSelections.includes(skill)) {
            currentModalSelections.push(skill);
        }
    });
    
    const modal = document.getElementById('multiSelectModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalOptions = document.getElementById('modalOptions');
    
    const iconMap = { skills: 'book', equipment: 'toolbox', languages: 'language' };
    const icon = iconMap[field] || 'list';
    modalTitle.innerHTML = `<i class="fa-solid fa-${icon}"></i> Edit ${title}`;
    
    // Build options HTML
    let optionsHtml = '';
    options.forEach(opt => {
        const isSelected = currentModalSelections.includes(opt);
        const isLocked = currentLockedSkills.includes(opt);
        const lockedClass = isLocked ? 'locked' : '';
        const lockedIcon = isLocked ? '<i class="fa-solid fa-lock" title="Granted by race/class"></i>' : '';
        
        optionsHtml += `
            <div class="modal-option ${isSelected ? 'selected' : ''} ${lockedClass}" onclick="toggleModalOption(this, '${opt.replace(/'/g, "\\'")}')">
                <span class="modal-option-checkbox"></span>
                <span>${opt}</span>
                ${lockedIcon}
            </div>
        `;
    });
    
    modalOptions.innerHTML = optionsHtml;
    
    // Hide custom input for skills, show for equipment and languages
    const customInputSection = document.querySelector('.modal-custom-input');
    if (customInputSection) {
        customInputSection.style.display = field === 'skills' ? 'none' : 'flex';
    }
    
    // Update skill count display
    updateSkillCountDisplay();
    
    modal.classList.add('active');
}

function toggleModalOption(element, value) {
    // Don't allow toggling locked skills
    if (element.classList.contains('locked')) {
        return;
    }
    
    element.classList.toggle('selected');
    
    if (element.classList.contains('selected')) {
        if (!currentModalSelections.includes(value)) {
            currentModalSelections.push(value);
        }
    } else {
        currentModalSelections = currentModalSelections.filter(s => s !== value);
    }
    
    // Update skill count if we're editing skills
    updateSkillCountDisplay();
}

function closeModal() {
    const modal = document.getElementById('multiSelectModal');
    modal.classList.remove('active');
    currentModalField = null;
    currentModalSelections = [];
    currentMaxSkills = 0;
    currentLockedSkills = [];
    
    // Hide skill count warning
    const warningDiv = document.getElementById('skillCountWarning');
    if (warningDiv) {
        warningDiv.style.display = 'none';
    }
}

function saveModalSelections() {
    if (currentModalField && currentNPC) {
        currentNPC[currentModalField] = [...currentModalSelections];
        displayNPC(currentNPC);
    }
    closeModal();
}

function addCustomItem() {
    const input = document.getElementById('customItemInput');
    const value = input.value.trim();
    
    if (value && !currentModalSelections.includes(value)) {
        currentModalSelections.push(value);
        
        // Add new option to the list
        const modalOptions = document.getElementById('modalOptions');
        const newOption = document.createElement('div');
        newOption.className = 'modal-option selected';
        newOption.onclick = function() { toggleModalOption(this, value); };
        newOption.innerHTML = `
            <span class="modal-option-checkbox"></span>
            <span>${value}</span>
        `;
        modalOptions.appendChild(newOption);
        
        input.value = '';
    }
}

// Get all available skills
function getAllSkills() {
    const skills = new Set();
    // Standard D&D 5e skills
    const standardSkills = [
        'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
        'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
        'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
        'Sleight of Hand', 'Stealth', 'Survival'
    ];
    standardSkills.forEach(s => skills.add(s));
    
    // Add skills from classes and occupations
    Object.values(classes).forEach(c => {
        if (c.skills) c.skills.forEach(s => skills.add(s));
    });
    Object.values(occupations).forEach(o => {
        if (o.skills) o.skills.forEach(s => skills.add(s));
    });
    
    return Array.from(skills).sort();
}

// Get all available languages
function getAllLanguages() {
    return [
        // Standard Languages
        'Common', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Orc',
        // Exotic Languages
        'Abyssal', 'Celestial', 'Draconic', 'Deep Speech', 'Infernal', 'Primordial', 'Sylvan', 'Undercommon',
        // Primordial Dialects
        'Aquan', 'Auran', 'Ignan', 'Terran',
        // Rare/Unusual Languages
        'Aarakocra', 'Druidic', 'Gith', 'Grung', 'Leonin', 'Loxodon', 'Minotaur', 'Quori', 'Thri-kreen', 'Vedalken'
    ].sort();
}

// Get all available equipment
function getAllEquipment() {
    const equipment = new Set();
    
    // Add equipment from occupations
    Object.values(occupations).forEach(o => {
        if (o.equipment) o.equipment.forEach(e => equipment.add(e));
    });
    
    // Add some common items
    const commonItems = [
        'Backpack', 'Bedroll', 'Tinderbox', 'Torch', 'Rations (1 day)',
        'Waterskin', 'Rope (50 feet)', 'Dagger', 'Quarterstaff',
        'Clothes (common)', 'Clothes (traveler\'s)', 'Pouch'
    ];
    commonItems.forEach(e => equipment.add(e));
    
    return Array.from(equipment).sort();
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('multiSelectModal');
    if (e.target === modal) {
        closeModal();
    }
    const promptModal = document.getElementById('portraitPromptModal');
    if (e.target === promptModal) {
        closePromptModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closePromptModal();
    }
});

// ============================================
// PORTRAIT GENERATOR (Pollinations.ai)
// ============================================

function generatePortrait() {
    if (!currentNPC) return;

    const prompt = buildPortraitPrompt(currentNPC);
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Pollinations.ai URL with parameters for quality
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;
    
    // Show loading state
    const placeholder = document.getElementById('portraitPlaceholder');
    const loading = document.getElementById('portraitLoading');
    const image = document.getElementById('portraitImage');
    const btn = document.querySelector('.generate-portrait-btn');
    
    if (placeholder) placeholder.style.display = 'none';
    if (loading) loading.style.display = 'flex';
    if (image) image.style.display = 'none';
    if (btn) btn.disabled = true;
    
    // Create new image to load
    const newImage = new Image();
    newImage.onload = function() {
        if (image) {
            image.src = imageUrl;
            image.style.display = 'block';
        }
        if (loading) loading.style.display = 'none';
        if (btn) btn.disabled = false;
    };
    newImage.onerror = function() {
        if (loading) loading.style.display = 'none';
        if (placeholder) {
            placeholder.style.display = 'flex';
            placeholder.innerHTML = `
                <i class="fa-solid fa-exclamation-triangle"></i>
                <span>Failed to generate. Try again.</span>
            `;
        }
        if (btn) btn.disabled = false;
    };
    newImage.src = imageUrl;
}

function buildPortraitPrompt(npc) {
    const className = npc.npcClass === 'commoner' ? 'commoner' : npc.npcClass;
    const occupationName = npc.occupation.replace(/_/g, ' ');
    
    // Determine age description
    let ageDesc = '';
    if (npc.age < 5) ageDesc = 'infant';
    else if (npc.age < 15) ageDesc = 'young child';
    else if (npc.age < 25) ageDesc = 'young adult';
    else if (npc.age < 50) ageDesc = 'adult';
    else if (npc.age < 80) ageDesc = 'middle-aged';
    else ageDesc = 'elderly';

    // Get race-specific features
    const raceFeatures = getRaceVisualFeatures(npc.race);
    
    // Build the prompt
    let prompt = `Fantasy portrait of a ${ageDesc} ${npc.gender} ${npc.race} ${occupationName}`;
    
    if (className !== 'commoner') {
        prompt += ` and ${className}`;
    }
    
    prompt += `. ${raceFeatures}`;
    
    // Add alignment-based expression/demeanor
    const alignmentVibes = getAlignmentVisuals(npc.alignment);
    prompt += ` ${alignmentVibes}`;
    
    // Add occupation-based attire
    const attireHints = extractBackstoryVisuals(npc.backstory || '', npc.race, occupationName);
    if (attireHints) {
        prompt += ` ${attireHints}`;
    }

    // Art style
    prompt += ` Detailed fantasy art, dramatic lighting, character portrait, Dungeons and Dragons style, digital painting.`;

    return prompt;
}

// ============================================
// PORTRAIT PROMPT VIEWER
// ============================================

function generatePortraitPrompt() {
    if (!currentNPC) return;

    const prompt = buildPortraitPrompt(currentNPC);

    // Show the modal with the prompt
    const modal = document.getElementById('portraitPromptModal');
    const textarea = document.getElementById('portraitPromptText');
    textarea.value = prompt;
    modal.classList.add('active');
    
    // Reset copy button state
    const copyBtn = document.getElementById('copyPromptBtn');
    copyBtn.classList.remove('copied');
    copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy to Clipboard';
}

function getRaceVisualFeatures(race) {
    const features = {
        'human': 'Human with varied features.',
        'elf': 'Elegant elven features with pointed ears and graceful build.',
        'high elf': 'High elf with refined features, pointed ears, and an air of arcane nobility.',
        'wood elf': 'Wood elf with earthy skin tones, pointed ears, and wild, natural appearance.',
        'dark elf': 'Drow with dark purple-black skin, white hair, and piercing red eyes.',
        'dwarf': 'Stout dwarven build with thick beard and sturdy features.',
        'hill dwarf': 'Hill dwarf with ruddy complexion, thick beard, and keen eyes.',
        'mountain dwarf': 'Mountain dwarf with powerful build, braided beard, and stern expression.',
        'halfling': 'Small halfling with cheerful features and curly hair.',
        'lightfoot halfling': 'Nimble lightfoot halfling with quick eyes and friendly smile.',
        'stout halfling': 'Sturdy stout halfling with rosy cheeks and determined expression.',
        'gnome': 'Small gnome with large eyes, pointed ears, and curious expression.',
        'forest gnome': 'Forest gnome with earthy tones, large eyes, and connection to nature.',
        'rock gnome': 'Rock gnome with clever eyes, wild hair, and inventive spark.',
        'half-elf': 'Half-elf combining human and elven features with slightly pointed ears.',
        'half-orc': 'Half-orc with grayish-green skin, prominent jaw, and tusks.',
        'tiefling': 'Tiefling with reddish skin, horns, and a long tail. Infernal heritage visible.',
        'dragonborn': 'Dragonborn with scaled skin, draconic features, and proud bearing.',
        'aasimar': 'Aasimar with celestial beauty, glowing eyes, and ethereal presence.',
        'goliath': 'Massive goliath with gray skin, bald head, and tribal markings.',
        'firbolg': 'Tall firbolg with bovine-like features, large nose, and gentle eyes.',
        'kenku': 'Kenku with black feathered body, beak, and corvid features.',
        'lizardfolk': 'Lizardfolk with scaled green skin, reptilian features, and cold eyes.',
        'tabaxi': 'Tabaxi with feline features, fur patterns, and cat-like eyes.',
        'tortle': 'Tortle with shell on back, reptilian features, and wise eyes.',
        'aarakocra': 'Aarakocra with bird-like features, feathered body, and wings.',
        'genasi': 'Genasi with elemental features reflecting their heritage.',
        'warforged': 'Warforged with mechanical body, glowing eyes, and constructed appearance.',
        'changeling': 'Changeling with pale features and slightly unsettling androgynous appearance.',
        'kalashtar': 'Kalashtar with serene human-like features and distant, dreamlike gaze.',
        'shifter': 'Shifter with bestial features, sharp teeth, and animalistic traits.',
        'yuan-ti': 'Yuan-ti with snake-like features, scales, and serpentine eyes.',
        'triton': 'Triton with blue-green skin, webbed fingers, and aquatic features.',
        'bugbear': 'Bugbear with hulking furry body, pointed ears, and menacing presence.',
        'goblin': 'Small goblin with green skin, pointed ears, and sharp features.',
        'hobgoblin': 'Hobgoblin with orange-red skin, military bearing, and disciplined expression.',
        'kobold': 'Small kobold with reptilian features, scales, and dragon-like appearance.',
        'orc': 'Full orc with green skin, tusks, and powerful savage features.',
        'centaur': 'Centaur with human upper body and horse lower body.',
        'minotaur': 'Minotaur with bull head, horns, and powerful humanoid body.',
        'satyr': 'Satyr with goat legs, small horns, and mischievous features.',
        'fairy': 'Tiny fairy with delicate features, gossamer wings, and ethereal glow.',
        'harengon': 'Harengon with rabbit-like features, long ears, and alert expression.',
        'owlin': 'Owlin with owl-like features, feathers, and large wise eyes.'
    };
    return features[race.toLowerCase()] || `${capitalize(race)} with distinctive racial features.`;
}

function getAlignmentVisuals(alignment) {
    const visuals = {
        'lawful good': 'Noble and righteous bearing, warm and trustworthy expression.',
        'neutral good': 'Kind and approachable demeanor, gentle eyes.',
        'chaotic good': 'Free-spirited expression with a hint of mischief, warm smile.',
        'lawful neutral': 'Disciplined and composed expression, measuring gaze.',
        'true neutral': 'Balanced and calm expression, observant eyes.',
        'chaotic neutral': 'Unpredictable glint in eyes, carefree expression.',
        'lawful evil': 'Cold calculating expression, cruel sophistication.',
        'neutral evil': 'Selfish and cunning expression, untrustworthy eyes.',
        'chaotic evil': 'Wild and dangerous expression, hint of madness.'
    };
    return visuals[alignment] || 'Neutral expression.';
}

function extractBackstoryVisuals(backstory, race, occupation) {
    let hints = [];
    
    // Look for clothing/equipment hints based on occupation
    if (occupation.includes('blacksmith') || occupation.includes('smith')) {
        hints.push('Wearing a leather apron, muscular arms.');
    } else if (occupation.includes('merchant') || occupation.includes('trader')) {
        hints.push('Well-dressed in merchant attire, calculating expression.');
    } else if (occupation.includes('guard') || occupation.includes('soldier')) {
        hints.push('Wearing armor or uniform, vigilant stance.');
    } else if (occupation.includes('priest') || occupation.includes('cleric')) {
        hints.push('Wearing religious vestments, holy symbol visible.');
    } else if (occupation.includes('mage') || occupation.includes('wizard')) {
        hints.push('Wearing robes, arcane symbols, mystical presence.');
    } else if (occupation.includes('thief') || occupation.includes('rogue')) {
        hints.push('Hooded cloak, shadowy appearance, alert eyes.');
    } else if (occupation.includes('farmer') || occupation.includes('laborer')) {
        hints.push('Simple working clothes, weathered hands.');
    } else if (occupation.includes('noble') || occupation.includes('aristocrat')) {
        hints.push('Fine clothing, jewelry, aristocratic bearing.');
    } else if (occupation.includes('innkeeper') || occupation.includes('tavern')) {
        hints.push('Friendly tavern attire, welcoming demeanor.');
    } else if (occupation.includes('baker') || occupation.includes('cook')) {
        hints.push('Flour-dusted apron, warm friendly expression.');
    } else if (occupation.includes('healer') || occupation.includes('herbalist')) {
        hints.push('Carrying herbs or medical supplies, caring expression.');
    } else if (occupation.includes('hunter') || occupation.includes('ranger')) {
        hints.push('Woodland attire, bow or hunting gear, keen eyes.');
    } else if (occupation.includes('sailor') || occupation.includes('fisher')) {
        hints.push('Maritime clothing, weathered by sea and sun.');
    } else if (occupation.includes('entertainer') || occupation.includes('bard')) {
        hints.push('Colorful performer attire, charismatic presence.');
    } else if (occupation.includes('scholar') || occupation.includes('scribe')) {
        hints.push('Scholarly robes, spectacles, books or scrolls.');
    }
    
    return hints.join(' ');
}

function closePromptModal() {
    const modal = document.getElementById('portraitPromptModal');
    modal.classList.remove('active');
}

function copyPromptToClipboard() {
    const textarea = document.getElementById('portraitPromptText');
    const copyBtn = document.getElementById('copyPromptBtn');
    
    navigator.clipboard.writeText(textarea.value).then(() => {
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy to Clipboard';
        }, 2000);
    }).catch(err => {
        // Fallback for older browsers
        textarea.select();
        document.execCommand('copy');
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy to Clipboard';
        }, 2000);
    });
}

// Export Character Sheet to PDF (opens printable view)
