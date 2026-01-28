// D&D 5E NPC Generator - PDF Export

function exportCharacterSheet() {
    if (!currentNPC) return;
    
    const npc = currentNPC;
    const profBonus = npc.proficiencyBonus || 2;
    
    // Calculate saving throw values
    const savingThrows = Object.keys(npc.modifiers).map(ability => {
        const isProficient = npc.savingThrows && npc.savingThrows.includes(ability);
        const value = npc.modifiers[ability] + (isProficient ? profBonus : 0);
        const prefix = value >= 0 ? '+' : '';
        const profMark = isProficient ? ' *' : '';
        return `<tr><td>${abilityNames[ability]}</td><td style="text-align:right; width: 30px;">${prefix}${value}</td><td style="width: 10px;">${profMark}</td></tr>`;
    }).join('');
    
    // Calculate all skill values
    const allSkills = [
        'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History',
        'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception',
        'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'
    ];
    
    const skillRows = allSkills.map(skill => {
        const isProficient = npc.skills.includes(skill);
        const ability = skillAbilities[skill] || 'int';
        const abilityMod = npc.modifiers[ability] || 0;
        const skillMod = isProficient ? abilityMod + profBonus : abilityMod;
        const modStr = skillMod >= 0 ? `+${skillMod}` : `${skillMod}`;
        const profMark = isProficient ? '*' : '';
        return `<tr><td>${skill} (${ability.toUpperCase()})</td><td style="text-align:right; width: 30px;">${modStr}</td><td style="width: 10px;">${profMark}</td></tr>`;
    }).join('');
    
    // Build trait descriptions HTML
    const traitsHtml = npc.traits && npc.traits.length > 0 ? npc.traits.map(trait => {
        const description = traitDescriptions[trait] || 'No description available.';
        return `<div class="trait-block"><strong>${trait}.</strong> ${description}</div>`;
    }).join('') : '<p>None</p>';
    
    // Get portrait if available
    const portraitImg = document.getElementById('portraitImage');
    const hasPortrait = portraitImg && portraitImg.style.display !== 'none' && portraitImg.src;
    const portraitHtml = hasPortrait ? 
        `<img src="${portraitImg.src}" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-bottom: 15px;">` : '';
    
    // Build multiclass display with subclasses (commoner doesn't show level since it's 0)
    const classDisplay = npc.characterClasses && npc.characterClasses.length > 0 ?
        npc.characterClasses.map(c => {
            // Commoner is level 0, so don't show level number
            let display = c.className === 'commoner' 
                ? 'Commoner' 
                : `${capitalize(c.className)} ${c.level}`;
            if (c.subclass && subclasses[c.className]) {
                const subclassData = subclasses[c.className];
                const subclassOption = subclassData.options.find(o => o.id === c.subclass);
                if (subclassOption) display += ` (${subclassOption.name})`;
            }
            return display;
        }).join(' / ') :
        capitalize(npc.npcClass);
    
    // Create printable HTML
    const printHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>${npc.name} - Character Sheet</title>
    <link href="https://db.onlinewebfonts.com/c/c391b9f3d65d9f9e311c80d964b696e1?family=Nodesto+Caps+Condensed" rel="stylesheet">
    <link href="https://db.onlinewebfonts.com/c/b9b59f3d31d975e265c5ed4c5433326f?family=Bookinsanity" rel="stylesheet">
    <style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: 'Bookinsanity', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #333;
    padding: 20px;
    max-width: 8.5in;
    margin: 0 auto;
}
h1 { font-family: 'Nodesto Caps Condensed', serif; font-size: 28pt; margin-bottom: 5px; color: #58180d; border-bottom: 3px solid #c9ad6a; padding-bottom: 5px; letter-spacing: 2px; }
h2 { font-family: 'Nodesto Caps Condensed', serif; font-size: 16pt; margin: 15px 0 8px 0; color: #58180d; border-bottom: 2px solid #c9ad6a; padding-bottom: 3px; letter-spacing: 1px; }
h3 { font-family: 'Nodesto Caps Condensed', serif; font-size: 13pt; margin: 10px 0 5px 0; color: #58180d; }
.header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
.header-info { flex: 1; }
.header-portrait { text-align: right; }
.subtitle { font-size: 12pt; color: #58180d; margin-bottom: 10px; font-style: italic; }
.columns { display: flex; gap: 20px; }
.column { flex: 1; }
.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; }
.stat-box { border: 2px solid #58180d; border-radius: 8px; padding: 8px; text-align: center; background: #fdf1dc; }
.stat-box.proficient { border-color: #28a745; background: #f0fff0; }
.stat-name { font-family: 'Nodesto Caps Condensed', serif; font-size: 10pt; font-weight: bold; color: #58180d; text-transform: uppercase; letter-spacing: 1px; }
.stat-score { font-size: 18pt; font-weight: bold; color: #58180d; }
.stat-mod { font-size: 11pt; color: #58180d; }
table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10pt; }
table td { padding: 3px 6px; border-bottom: 1px solid #eee; }
table tr:last-child td { border-bottom: none; }
.combat-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; }
.combat-box { border: 2px solid #58180d; border-radius: 8px; padding: 10px; text-align: center; background: #e0c9a0; }
.combat-label { font-family: 'Nodesto Caps Condensed', serif; font-size: 9pt; font-weight: bold; color: #58180d; text-transform: uppercase; letter-spacing: 1px; }
.combat-value { font-size: 16pt; font-weight: bold; color: #58180d; }
.trait-block { margin-bottom: 8px; text-align: justify; }
.trait-block strong { font-family: 'Nodesto Caps Condensed', serif; color: #58180d; }
.backstory { text-align: justify; background: #fdf1dc; padding: 10px; border-radius: 8px; font-style: italic; border: 1px solid #c9ad6a; }
.info-row { margin-bottom: 5px; }
.info-label { font-weight: bold; color: #58180d; }
.equipment-list { padding-left: 20px; }
.proficient-note { font-size: 9pt; color: #666; margin-top: 5px; font-style: italic; }
@media print {
    body { padding: 0; }
    @page { margin: 0.5in; }
}
    </style>
</head>
<body>
    <div class="header-row">
<div class="header-info">
    <h1>${npc.name}</h1>
    <div class="subtitle">
        ${capitalize(npc.gender)} ${capitalize(npc.race)} ${classDisplay} | Level ${npc.totalLevel || 1}<br>
        ${npc.characterClasses?.some(cc => cc.className === 'commoner') ? capitalize(npc.occupation) + ' | ' : ''}${capitalize(npc.alignment)}
    </div>
</div>
<div class="header-portrait">
    ${portraitHtml}
</div>
    </div>

    <div class="columns">
<div class="column">
    <h2>Ability Scores</h2>
    <div class="stat-grid">
        ${Object.keys(npc.abilities).map(ability => {
            const isProficient = npc.savingThrows && npc.savingThrows.includes(ability);
            return `
            <div class="stat-box ${isProficient ? 'proficient' : ''}">
                <div class="stat-name">${abilityNames[ability]}</div>
                <div class="stat-score">${npc.abilities[ability]}</div>
                <div class="stat-mod">${formatModifier(npc.modifiers[ability])}</div>
            </div>`;
        }).join('')}
    </div>

    <h2>Combat</h2>
    <div class="combat-stats">
        <div class="combat-box">
            <div class="combat-label">HP</div>
            <div class="combat-value">${npc.hitPoints}</div>
        </div>
        <div class="combat-box">
            <div class="combat-label">AC</div>
            <div class="combat-value">${npc.ac}</div>
        </div>
        <div class="combat-box">
            <div class="combat-label">Initiative</div>
            <div class="combat-value">${npc.initiative >= 0 ? '+' : ''}${npc.initiative}</div>
        </div>
        <div class="combat-box">
            <div class="combat-label">Prof. Bonus</div>
            <div class="combat-value">+${profBonus}</div>
        </div>
    </div>
    <div class="info-row"><span class="info-label">Hit Dice:</span> ${getHitDiceString(npc.characterClasses || [])}</div>
    <div class="info-row"><span class="info-label">Armor:</span> ${npc.armorName}</div>
    <div class="info-row"><span class="info-label">Speed:</span> ${npc.speed} ft</div>
    <div class="info-row"><span class="info-label">Passive Perception:</span> ${npc.passivePerception}</div>

    <h2>Saving Throws</h2>
    <table>${savingThrows}</table>
    <div class="proficient-note">* = proficient</div>

    <h2>Senses</h2>
    <p>${npc.senses && npc.senses.length > 0 ? npc.senses.join(', ') : 'None'}</p>

    <h2>Languages</h2>
    <p>${npc.languages && npc.languages.length > 0 ? npc.languages.join(', ') : 'Common'}</p>

    <h2>Proficiencies</h2>
    <div class="info-row"><span class="info-label">Armor:</span> ${getArmorProficiencyText(npc.characterClasses || [])}</div>
    <div class="info-row"><span class="info-label">Weapons:</span> ${getWeaponProficiencyText(npc.characterClasses || [])}</div>
</div>

<div class="column">
    <h2>Skills</h2>
    <table>${skillRows}</table>
    <div class="proficient-note">* = proficient</div>

    <h2>Weapons</h2>
    ${(() => {
        const isInfant = npc.ageCategory === 'infant';
        let weaponRows = '';
        
        // Show Tiny Fists for infants, Unarmed Strike for others
        if (isInfant) {
            weaponRows = '<tr style="background: #f0e6d2;"><td style="padding: 5px; border: 1px solid #c9ad6a;"><strong>Tiny Fists</strong><br><span style="font-size: 0.8em; color: #6c757d;">Natural</span></td><td style="padding: 5px; text-align: center; border: 1px solid #c9ad6a;">+0</td><td style="padding: 5px; text-align: center; border: 1px solid #c9ad6a;">No Damage</td><td style="padding: 5px; border: 1px solid #c9ad6a; font-size: 0.85em;">—</td></tr>';
        } else {
            const unarmed = getUnarmedStrike(
                npc.characterClasses?.[0]?.className || 'commoner',
                npc.totalLevel || 1,
                npc.modifiers,
                npc.proficiencyBonus || 2
            );
            const unarmedAttackSign = unarmed.attackBonus >= 0 ? '+' : '';
            const unarmedDamageSign = unarmed.damageBonus >= 0 ? '+' : '';
            const unarmedDamageBonus = unarmed.damageBonus !== 0 ? ' ' + unarmedDamageSign + unarmed.damageBonus : '';
            const unarmedProps = unarmed.properties && unarmed.properties.length > 0 ? unarmed.properties.join(', ') : '—';
            
            weaponRows = '<tr style="background: #f0e6d2;"><td style="padding: 5px; border: 1px solid #c9ad6a;"><strong>Unarmed Strike</strong><br><span style="font-size: 0.8em; color: #6c757d;">Natural</span></td><td style="padding: 5px; text-align: center; border: 1px solid #c9ad6a;">' + unarmedAttackSign + unarmed.attackBonus + '</td><td style="padding: 5px; text-align: center; border: 1px solid #c9ad6a;">' + unarmed.damage + unarmedDamageBonus + ' ' + unarmed.damageType + '</td><td style="padding: 5px; border: 1px solid #c9ad6a; font-size: 0.85em;">' + unarmedProps + '</td></tr>';
        }
        
        // Add racial natural weapon if applicable
        const racialWeapon = getRacialNaturalWeapon(npc.race, npc.modifiers);
        if (racialWeapon) {
            // Infants deal only 1 damage with no modifier
            const racialAttackBonus = isInfant ? 0 : npc.modifiers.str + (npc.proficiencyBonus || 2);
            const racialAttackSign = racialAttackBonus >= 0 ? '+' : '';
            const racialDamage = isInfant ? '1' : racialWeapon.damage;
            const racialDamageSign = racialWeapon.damageBonus >= 0 ? '+' : '';
            const racialDamageBonus = isInfant ? '' : (racialWeapon.damageBonus !== 0 ? ' ' + racialDamageSign + racialWeapon.damageBonus : '');
            weaponRows += '<tr style="background: #f5ecd4;"><td style="padding: 5px; border: 1px solid #c9ad6a;"><strong>' + racialWeapon.name + '</strong><br><span style="font-size: 0.8em; color: #8b6914;">Racial</span></td><td style="padding: 5px; text-align: center; border: 1px solid #c9ad6a;">' + racialAttackSign + racialAttackBonus + '</td><td style="padding: 5px; text-align: center; border: 1px solid #c9ad6a;">' + racialDamage + racialDamageBonus + ' ' + racialWeapon.damageType + '</td><td style="padding: 5px; border: 1px solid #c9ad6a; font-size: 0.85em;">—</td></tr>';
        }
        
        if (npc.weapons && npc.weapons.length > 0) {
            weaponRows += npc.weapons.map(weapon => {
                const modifier = weapon.modifier || 0;
                const totalAttack = weapon.attackBonus + modifier;
                const totalDamage = weapon.damageBonus + modifier;
                const attackSign = totalAttack >= 0 ? '+' : '';
                const damageSign = totalDamage >= 0 ? '+' : '';
                const damageBonus = totalDamage !== 0 ? ' ' + damageSign + totalDamage : '';
                const properties = weapon.properties && weapon.properties.length > 0 ? weapon.properties.join(', ') : '—';
                const modifierText = modifier > 0 ? ' <span style="color: #28a745; font-weight: bold;">+' + modifier + '</span>' : '';
                const typeText = weapon.type === 'improvised' ? 'Improvised' : (weapon.type === 'custom' ? 'Custom' : (weapon.type === 'natural' ? 'Natural' : weapon.type + ' ' + weapon.category));
                const damageDisplay = (weapon.damage === '0' || weapon.damage === 'none' || weapon.damageType === 'none') ? 'No Damage' : weapon.damage + damageBonus + ' ' + weapon.damageType;
                return '<tr style="background: #fdf1dc;"><td style="padding: 5px; border: 1px solid #c9ad6a;"><strong>' + weapon.name + modifierText + '</strong><br><span style="font-size: 0.8em; color: #6c757d;">' + typeText + '</span></td><td style="padding: 5px; text-align: center; border: 1px solid #c9ad6a;">' + attackSign + totalAttack + '</td><td style="padding: 5px; text-align: center; border: 1px solid #c9ad6a;">' + damageDisplay + '</td><td style="padding: 5px; border: 1px solid #c9ad6a; font-size: 0.85em;">' + properties + '</td></tr>';
            }).join('');
        }
        
        return '<table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;"><thead><tr style="background: #c9ad6a; color: #3e0c02;"><th style="padding: 5px; text-align: left; border: 1px solid #a08050;">Weapon</th><th style="padding: 5px; text-align: center; border: 1px solid #a08050;">Attack</th><th style="padding: 5px; text-align: center; border: 1px solid #a08050;">Damage</th><th style="padding: 5px; text-align: left; border: 1px solid #a08050;">Properties</th></tr></thead><tbody>' + weaponRows + '</tbody></table>';
    })()}

    <h2>Equipment</h2>
    <ul class="equipment-list">
        ${npc.equipment.map(item => `<li>${item}</li>`).join('')}
    </ul>

    <h2>Physical Traits</h2>
    <div class="info-row"><span class="info-label">Age:</span> ${npc.age === 0 ? 'Newborn' : npc.age + ' years (' + capitalize(npc.ageCategory) + ')'}</div>
    <div class="info-row"><span class="info-label">Size:</span> ${capitalize(npc.size)}</div>
</div>
    </div>

    <h2>Racial Traits</h2>
    ${traitsHtml}

    <h2>Class Features</h2>
    ${(() => {
const features = getCharacterFeatures(npc.characterClasses || [{ className: npc.npcClass, level: npc.totalLevel || 1 }]);
if (features.length === 0) return '<p>None</p>';
return features.map(f => `<div class="trait-block"><strong>${f.name} (Level ${f.level} ${capitalize(f.className)}).</strong> ${f.description}</div>`).join('');
    })()}

    ${npc.spellData ? `
    <h2>Spellcasting</h2>
    <div class="spellcasting-header" style="margin-bottom: 15px; padding: 10px; background: #fdf1dc; border-radius: 5px; border: 1px solid #c9ad6a;">
<div><strong>Spellcasting Ability:</strong> ${({str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma'})[npc.spellData.ability]} (+${npc.spellData.abilityMod})</div>
<div><strong>Spell Save DC:</strong> ${npc.spellData.saveDC} | <strong>Spell Attack Bonus:</strong> +${npc.spellData.attackBonus}</div>
${(() => {
    const slotLabels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
    const activeSlots = npc.spellData.spellSlots.map((count, idx) => ({ label: slotLabels[idx], count })).filter(s => s.count > 0);
    if (activeSlots.length === 0) return '';
    return '<div style="margin-top: 5px;"><strong>Spell Slots:</strong> ' + activeSlots.map(s => s.label + ': ' + s.count).join(' | ') + '</div>';
})()}
    </div>
    
    ${npc.spellData.cantrips && npc.spellData.cantrips.length > 0 ? `
    <h3 style="color: #58180d; border-bottom: 1px solid #c9ad6a; padding-bottom: 5px;">Cantrips</h3>
    ${npc.spellData.cantrips.map(spellId => {
const spell = spells[spellId];
if (!spell) return '';
const components = [];
if (spell.components.v) components.push('V');
if (spell.components.s) components.push('S');
if (spell.components.m) components.push('M (' + spell.components.m + ')');
return '<div class="trait-block"><strong>' + spell.name + '</strong> <em style="color: #6c757d;">(' + spell.school + ' cantrip)</em><br>' +
    '<span style="font-size: 0.9em; color: #495057;"><strong>Casting Time:</strong> ' + spell.castingTime + ' | <strong>Range:</strong> ' + spell.range + ' | <strong>Components:</strong> ' + components.join(', ') + ' | <strong>Duration:</strong> ' + spell.duration + '</span><br>' +
    spell.description + '</div>';
    }).join('')}
    ` : ''}
    
    ${npc.spellData.spells && npc.spellData.spells.length > 0 ? `
    ${(() => {
const slotLabels = ['', '1st Level', '2nd Level', '3rd Level', '4th Level', '5th Level', '6th Level', '7th Level', '8th Level', '9th Level'];
const spellsByLevel = {};
npc.spellData.spells.forEach(spellId => {
    const spell = spells[spellId];
    if (spell) {
        if (!spellsByLevel[spell.level]) spellsByLevel[spell.level] = [];
        spellsByLevel[spell.level].push({ id: spellId, ...spell });
    }
});

let html = '';
Object.keys(spellsByLevel).sort((a, b) => a - b).forEach(level => {
    html += '<h3 style="color: #58180d; border-bottom: 1px solid #c9ad6a; padding-bottom: 5px;">' + slotLabels[level] + ' Spells</h3>';
    spellsByLevel[level].forEach(spell => {
        const components = [];
        if (spell.components.v) components.push('V');
        if (spell.components.s) components.push('S');
        if (spell.components.m) components.push('M (' + spell.components.m + ')');
        html += '<div class="trait-block"><strong>' + spell.name + '</strong> <em style="color: #6c757d;">(' + spell.school + ')</em><br>' +
            '<span style="font-size: 0.9em; color: #495057;"><strong>Casting Time:</strong> ' + spell.castingTime + ' | <strong>Range:</strong> ' + spell.range + ' | <strong>Components:</strong> ' + components.join(', ') + ' | <strong>Duration:</strong> ' + spell.duration + (spell.concentration ? ' (C)' : '') + '</span><br>' +
            spell.description + '</div>';
    });
});
return html;
    })()}
    ` : ''}
    ` : ''}

    ${npc.background ? `
    <h2>Background: ${capitalize(npc.background)}</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
<div class="trait-block"><strong>Personality Trait:</strong> ${npc.personalityTrait || 'None'}</div>
<div class="trait-block"><strong>Ideal:</strong> ${npc.ideal || 'None'}</div>
<div class="trait-block"><strong>Bond:</strong> ${npc.bond || 'None'}</div>
<div class="trait-block"><strong>Flaw:</strong> ${npc.flaw || 'None'}</div>
    </div>
    ` : ''}

    ${document.getElementById('includeBackstory')?.checked ? `
    <h2>Backstory</h2>
    <div class="backstory">${npc.backstory}</div>
    ` : ''}

    <scr` + `ipt>
// Auto-print when opened
window.onload = function() {
    window.print();
};
    <\/script>
</body>
</html>`;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHtml);
    printWindow.document.close();
}
    
