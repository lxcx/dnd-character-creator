# D&D 5E NPC Generator

A web-based tool for generating unique non-player characters (NPCs) for Dungeons & Dragons 5th Edition campaigns.

## Features

- **Race Selection**: Choose from 9 different races (Human, Elf, Dwarf, Halfling, Dragonborn, Gnome, Half-Elf, Half-Orc, Tiefling) or random
- **Occupation/Class**: Select from 14 different occupations (Commoner, Merchant, Guard, Noble, Scholar, Priest, Rogue, Warrior, Bard, Wizard, Ranger, Blacksmith, Farmer, Innkeeper) or random
- **Age Categories**: Young, Adult, Middle-Aged, Old, Venerable, or Random
- **Gender Options**: Male, Female, Non-Binary, or Random
- **Alignment**: All 9 D&D alignments or Random
- **Automatic Stat Generation**: 
  - Ability scores rolled using 4d6 drop lowest method
  - Race ability bonuses applied automatically
  - Occupation-based stat bonuses
- **Complete NPC Details**:
  - Full name generation
  - All 6 ability scores with modifiers
  - Skills based on occupation
  - Equipment appropriate to occupation
  - Optional backstory generation
  - Physical traits (size, speed)

## How to Use

1. Open `index.html` in any modern web browser
2. Fill out the form with your desired NPC parameters (or select "Random" for any field)
3. Check or uncheck "Include Backstory" as desired
4. Click "Generate NPC"
5. View your generated NPC in the right panel

## Technical Details

- Pure HTML, CSS, and JavaScript - no dependencies required
- Responsive design that works on desktop and mobile
- All D&D 5E rules implemented:
  - Standard ability score generation (4d6 drop lowest)
  - Race ability score bonuses
  - Ability score modifiers calculated correctly
  - Size and speed based on race

## File Structure

```
dnd-npc-generator/
├── index.html    # Main application file (contains HTML, CSS, and JavaScript)
└── README.md     # This file
```

## Future Enhancements

Potential additions you might want to consider:
- More races and occupations
- Personality traits and quirks
- Physical appearance details
- Relationship connections
- Export to PDF or text file
- Save favorite NPCs
- Random personality traits table

Enjoy generating NPCs for your D&D campaigns!