// MAP OBJECT STRUCTURES
on('ready', () => {
    // Retrieve the first NPC character in the list
    const firstNPC = findObjs({ type: 'character' }).filter(c => getAttrByName(c.id, 'npc') === '1')[0];
    
    // Retrieve all attributes belonging to the `firstNPC`
    const npcAttributes = findObjs({ type: 'attribute', characterid: firstNPC.id });

    // Use `_.omit` to exclude problematic fields that require callbacks
    const excludedKeys = ['bio', 'gmnotes', '_defaulttoken'];

    // Create a new mapped object for the character properties
    const mappedCharacter = _.mapObject(_.omit(firstNPC.attributes, excludedKeys), (value) => {
        return Array.isArray(value) ? 'array' :
               typeof value === 'object' ? 'object' :
               typeof value;
    });

    // Create a mapped object for the attributes of the NPC character
    const mappedAttr = _.reduce(npcAttributes, (result, attr) => {
        result[attr.get('name')] = typeof attr.get('current'); // Map each attribute name to its type
        return result;
    }, {});

    // Convert to clean JSON object literals with the correct structure
    const characterJSON = JSON.stringify(mappedCharacter, null, 2); // `null, 2` adds indentation for readability
    const attrJSON = JSON.stringify(mappedAttr, null, 2); // `null, 2` adds indentation for readability

    // Log the structures for inspection
    log('Character Structure');
    log(characterJSON);
    log('Attribute Structure');
    log(attrJSON);
});

// CACHE CHARACTER & ATTRIBUTE DATA
on('ready', () => {
    // state.npcList = {};
    let updatedNum = 0;
    state.npcList = state.npcList || {};
    const npcs = [...findObjs({ type: 'character' }).filter(c => getAttrByName(c.id, 'npc') === '1')];
    npcs.forEach(npc => {
        if (!state.npcList[npc.id]) {
            npc.linkedAttr = findObjs({ type: 'attribute', characterid: npc.id });
            state.npcList[npc.id] = npc;
            updatedNum++;
        }
    });
    log(`npcList length: ${Object.keys(state.npcList).length}`);
    log(`npcs updated: ${updatedNum}`);
});




/*
NOTES ON ROLL20 OBJECT STRUCTURES
1. attribute Object
An attribute object usually represents a single character attribute, such as hit points, armor class, or spell slots.

Encapsulated Attributes:
name — Name of the attribute (e.g., strength).
current — Current value of the attribute.
max — Maximum value of the attribute.
characterid — ID of the parent character.
id — Unique ID of the attribute itself (read-only).
Example Access:

javascript
Copy code
attr.get('name');
attr.get('current');
attr.get('characterid');
2. character Object
The character object represents a full character sheet, including attributes, abilities, and other metadata.

Encapsulated Attributes:
name — Name of the character.
avatar — URL for the character's avatar image.
bio — Biography text (rich text format).
gmnotes — Notes visible only to the GM.
controlledby — User ID(s) of the players who control this character.
archived — Whether the character is archived or not.
inplayerjournals — User ID(s) of the players who can view the character in their journals.
defaulttoken — Default token image for the character (as base64 data or URL).
id — Unique ID of the character (read-only).
Example Access:

javascript
Copy code
character.get('name');
character.get('controlledby');
character.get('defaulttoken');
3. ability Object
Represents a macro or ability tied to a specific character.

Encapsulated Attributes:
name — Name of the ability.
description — Description or details of the ability.
action — Macro text to be executed when the ability is triggered.
istokenaction — Boolean value indicating if the ability is a token action.
characterid — ID of the parent character.
id — Unique ID of the ability (read-only).
Example Access:

javascript
Copy code
ability.get('name');
ability.get('action');
4. graphic Object
Represents any graphic object on the tabletop, including tokens, map elements, and decorations.

Encapsulated Attributes:
name — Name of the token or graphic.
represents — ID of the character it represents (for tokens).
left — X-coordinate position on the tabletop.
top — Y-coordinate position on the tabletop.
width — Width of the graphic.
height — Height of the graphic.
layer — Layer on which the graphic resides (map, objects, gmlayer).
imgsrc — URL of the image source.
bar1_value / bar2_value / bar3_value — Value of the three primary token bars.
statusmarkers — List of status markers currently on the token.
aura1_radius / aura2_radius — Radius values for the two token auras.
id — Unique ID of the graphic (read-only).
Example Access:

javascript
Copy code
graphic.get('left');
graphic.get('layer');
graphic.get('statusmarkers');
5. text Object
Represents a text object on the tabletop, typically used for labels or notes.

Encapsulated Attributes:
left — X-coordinate position on the tabletop.
top — Y-coordinate position on the tabletop.
width — Width of the text box.
height — Height of the text box.
text — Actual text content.
font_size — Font size of the text.
rotation — Rotation of the text box.
layer — Layer of the text (map, objects, gmlayer).
id — Unique ID of the text (read-only).
Example Access:

javascript
Copy code
text.get('text');
text.get('layer');
6. page Object
Represents a single page in a Roll20 campaign. This includes information like map size, grid configuration, and lighting settings.

Encapsulated Attributes:
name — Name of the page.
width — Width of the page (in units).
height — Height of the page (in units).
showgrid — Whether the grid is visible.
grid_type — Type of the grid (square, hex, etc.).
scale_number — Grid unit scale (e.g., 5 for 5 ft. squares).
dynamic_lighting_enabled — Boolean for whether dynamic lighting is enabled.
lighting — Complex lighting settings for dynamic lighting.
id — Unique ID of the page (read-only).
Example Access:

javascript
Copy code
page.get('name');
page.get('width');


CHARACTER STRUCTURE
{
    "name": "string",
    "archived": "boolean",
    "inplayerjournals": "string",
    "controlledby": "string",
    "_id": "string",
    "_type": "string",
    "avatar": "string"
  }


ATTRIBUTE STRUCTURE
{
    "version": "string",
    "already_transitioned": "string",
    "tab": "string",
    "npc": "string",
    "npc_toggle": "number",
    "npc_name": "string",
    "npc_speed": "string",
    "strength": "number",
    "dexterity": "number",
    "constitution": "number",
    "intelligence": "number",
    "wisdom": "number",
    "charisma": "number",
    "npc_languages": "string",
    "npc_challenge": "string",
    "npc_sizebase": "string",
    "npc_typebase": "string",
    "npc_alignmentbase": "string",
    "npc_acbase": "string",
    "npc_hpbase": "string",
    "npc_savingthrowsbase": "string",
    "npc_passiveperceptionbase": "string",
    "npc_skillsbase": "string",
    "npc_content": "string",
    "npcd_name": "string",
    "npcd_type": "string",
    "npcd_ac": "string",
    "npcd_actype": "string",
    "npcd_hp": "number",
    "npcd_hpformula": "string",
    "npcd_speed": "string",
    "npcd_str": "string",
    "npcd_str_mod": "string",
    "npcd_dex": "string",
    "npcd_dex_mod": "string",
    "npcd_con": "string",
    "npcd_con_mod": "string",
    "npcd_int": "string",
    "npcd_int_mod": "string",
    "npcd_wis": "string",
    "npcd_wis_mod": "string",
    "npcd_cha": "string",
    "npcd_cha_mod": "string",
    "npcd_str_save": "string",
    "npc_str_save_flag": "number",
    "npcd_dex_save": "string",
    "npc_dex_save_flag": "number",
    "npcd_con_save": "string",
    "npc_con_save_flag": "number",
    "npcd_int_save": "string",
    "npc_int_save_flag": "number",
    "npcd_wis_save": "string",
    "npc_wis_save_flag": "number",
    "npcd_cha_save": "string",
    "npc_cha_save_flag": "number",
    "npc_saving_flag": "string",
    "npcd_acrobatics": "string",
    "npc_acrobatics_flag": "number",
    "npcd_animal_handling": "string",
    "npc_animal_handling_flag": "number",
    "npcd_arcana": "string",
    "npc_arcana_flag": "number",
    "npcd_athletics": "string",
    "npc_athletics_flag": "number",
    "npcd_deception": "string",
    "npc_deception_flag": "number",
    "npcd_history": "string",
    "npc_history_flag": "number",
    "npcd_insight": "string",
    "npc_insight_flag": "number",
    "npcd_intimidation": "string",
    "npc_intimidation_flag": "number",
    "npcd_investigation": "string",
    "npc_investigation_flag": "number",
    "npcd_medicine": "string",
    "npc_medicine_flag": "number",
    "npcd_nature": "string",
    "npc_nature_flag": "number",
    "npcd_perception": "string",
    "npc_perception_flag": "number",
    "npcd_performance": "string",
    "npc_performance_flag": "number",
    "npcd_persuasion": "string",
    "npc_persuasion_flag": "number",
    "npcd_religion": "string",
    "npc_religion_flag": "number",
    "npcd_sleight_of_hand": "string",
    "npc_sleight_of_hand_flag": "number",
    "npcd_stealth": "string",
    "npc_stealth_flag": "number",
    "npcd_survival": "string",
    "npc_survival_flag": "number",
    "npc_skills_flag": "string",
    "npcd_vulnerabilities": "number",
    "npc_vulnerabilities_flag": "number",
    "npcd_resistances": "number",
    "npc_resistances_flag": "number",
    "npcd_immunities": "number",
    "npc_immunities_flag": "number",
    "npcd_condition_immunities": "number",
    "npc_condition_immunities_flag": "number",
    "npcd_senses": "string",
    "npcd_languages": "string",
    "npcd_challenge": "string",
    "npcd_xp": "string",
    "legendary_flag": "number",
    "reaction_flag": "number",
    "npcspell_flag": "number",
    "encumberance": "string",
    "npc_xp": "string",
    "npc_options-flag": "string",
    "npc_type": "string",
    "npc_ac": "string",
    "npc_actype": "string",
    "hp": "string",
    "npc_hpformula": "string",
    "npc_senses": "string",
    "npc_con_save": "string",
    "npc_wis_save": "string",
    "npc_cha_save": "string",
    "npc_insight": "string",
    "npc_perception": "number",
    "repeating_npctrait_-KOpjZgWU8waE0n1CqzH_name": "string",
    "repeating_npctrait_-KOpjZgWU8waE0n1CqzH_desc": "string",
    "repeating_npctrait_-KOpjZgXnynvfoj0WdRv_name": "string",
    "repeating_npctrait_-KOpjZgXnynvfoj0WdRv_desc": "string"
  }
  
*/