// REPLACE AVERAGE DAMAGE WITH [[ROLL]]
on('ready', () => {
    let cnt = 0;
    const npcs = findObjs({ _type: 'character' }).filter(c => getAttrByName(c.id, 'npc') === '1');
    npcs.forEach(npc => {
        findObjs({_type: 'attribute', _characterid: npc.id}).filter(attr => /^repeating_.*_description$/.test(attr.get('name'))).forEach(attr => {
            let desc = attr.get('current');
            desc = desc.replace(/(\d+) \((\d{1,2}d\d{1,2})\)/g, (match, number, dice) => `${number} [[${dice}]]`);
            attr.set('current', desc);
            cnt ++;
            log('updated ' + cnt);
        })
        
    });
});

// CREATE ABILITIES FOR REPEATING ACTIONS
on('ready', () => {
    log("Script to create abilities for all repeating action types started...");

    // Define patterns for repeating sections and their corresponding attribute suffixes
    const repeatingSectionDetails = {
        "repeating_npcaction": "npc_action",           // NPC Actions
        "repeating_spell-cantrip": "spell",            // Cantrip Spells
        "repeating_spell-[0-9]+": "spell",             // All spell levels (1-9)
        "repeating_attack": "attack",                  // Attacks (use _attack attribute)
        "repeating_npcreaction": "npc_action",         // NPC Reactions
        "repeating_npcaction-l": "npc_action"          // Additional custom actions (e.g., legendary actions)
    };

    // Build regex patterns based on the keys in repeatingSectionDetails
    const repeatingSectionPatterns = Object.keys(repeatingSectionDetails).map(section => new RegExp(`^${section}_`, 'i'));

    // Find all NPC characters in the game
    const npcs = findObjs({ _type: 'character' }).filter(c => getAttrByName(c.id, 'npc') === '1');

    npcs.forEach(npc => {
        // Track how many abilities we add for this NPC
        let abilitiesAdded = 0;

        // Find all existing abilities for this NPC to avoid duplicates
        let existingAbilities = findObjs({ _type: 'ability', _characterid: npc.id }).map(a => a.get('name'));

        // Find all attributes for the current NPC
        let attributes = findObjs({ _type: 'attribute', _characterid: npc.id });

        // Iterate through each attribute and check against defined patterns
        attributes.forEach(attr => {
            // Check if the attribute matches any of the defined repeating patterns
            let patternMatch = repeatingSectionPatterns.find(pattern => pattern.test(attr.get('name')));

            if (patternMatch && attr.get('name').endsWith('_name')) {
                // The attribute follows the repeating section structure: repeating_<section>_<id>_name
                let attrParts = attr.get('name').split('_');

                // Ensure the attribute name has at least 4 parts: "repeating", "<section>", "-row_id", "name"
                if (attrParts.length < 4) {
                    log(`Skipping malformed attribute name: ${attr.get('name')}`);
                    return;
                }

                let section = attrParts[0] + "_" + attrParts[1]; // Combine the section name and level/type (e.g., repeating_spell-1)
                let rowId = attrParts[2]; // Extract the row ID (e.g., -abcdefghijkl)
                
                // Confirm that the rowId is correctly formed
                if (!rowId.startsWith("-")) {
                    log(`Invalid row ID for attribute: ${attr.get('name')} in NPC: ${npc.get('name')}`);
                    return;
                }

                // Determine the correct attribute suffix based on the section name
                let sectionBase = section.split("_")[0] + (section.split("_")[1] ? "-" + section.split("_")[1] : "");
                let attributeSuffix = repeatingSectionDetails[sectionBase] || "action"; // Default to "action" if not found

                let actionName = attr.get('current'); // Get the action name (e.g., "Slam")
                let abilityName = actionName; // Use the value as the ability name

                if (existingAbilities.includes(abilityName)) {
                    findObjs({_type: 'ability', _characterid: npc.id, name: abilityName})[0].remove();
                    existingAbilities = existingAbilities.filter(a => a !== abilityName);
                    log('action removed');
                }
                if (!existingAbilities.includes(abilityName)) {
                    // Construct the full macro path using character ID, section, row ID, and attribute suffix
                    let actionReference = `%{${npc.id}|${section}_${rowId}_npc_action}`;

                    log(`Constructed Action Reference: ${actionReference}`);

                    // Create a macro button to call the repeating action using the correct format
                    createObj('ability', {
                        name: abilityName,
                        characterid: npc.id,
                        action: actionReference,  // Use constructed actionReference with character ID and formatted action
                        istokenaction: true
                    });

                    log(`Created ability '${abilityName}' for NPC: ${npc.get('name')}`);
                    abilitiesAdded++;
                } else {
                    log(`Ability '${abilityName}' already exists for NPC: ${npc.get('name')}. Skipping creation.`);
                }
            }
        });

        log(`NPC: ${npc.get('name')} - Total abilities added: ${abilitiesAdded}`);
    });

    log("Script to create abilities for all repeating action types completed.");
});

// INFO
on('ready', () => {
    // The target row ID and character ID
    const characterId = "-O8FBwK08dm3RTA3RsKH"; // Replace with the character ID
    const targetRowId = "repeating_npcaction_-O8FBwf0pYJcvKk0ROnF"; // Replace with the row ID

    // Find the character using its unique character ID
    let npc = getObj('character', characterId);

    if (npc) {
        // Find all attributes for this character
        let attributes = findObjs({ _type: 'attribute', _characterid: npc.id }).sort((a, b) => a.get('name').localeCompare(b.get('name')));

        // Use `filter` and a regex pattern to find attributes that contain the target row ID
        let matchingAttributes = attributes.filter(attr => attr.get('name').includes(targetRowId));

        // Log all matching attributes
        log(`Attributes for row ID ${targetRowId}:`);
        matchingAttributes.forEach(attr => {
            log(`${attr.get('name')} = ${attr.get('current')}`);
        });
    } else {
        log(`Character with ID '${characterId}' not found.`);
    }
});


{ /* NOTES ON ROLL20 OBJECT STRUCTURES*/
/* attribute Object
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
*/

/* character Object
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
*/

/* ability Object
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
*/

/* graphic Object
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
*/

/* text Object
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
*/

/* page Object
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
*/
}
/* CHARACTER STRUCTURE
{
    "name": "string",
    "archived": "boolean",
    "inplayerjournals": "string",
    "controlledby": "string",
    "_id": "string",
    "_type": "string",
    "avatar": "string"
  }
*/
/* ATTRIBUTE STRUCTURE
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
// ACTION NAME STRUCTURE: 'repeating_<action type>_-<action id>_<attribute name>'
/* ATTRIBUTE NAMES ACTION TYPES
[
    "repeating_npcaction",
    "repeating_spell-cantrip",
    "repeating_attack",
    "repeating_spell-1",
    "repeating_spell-2",
    "repeating_spell-3",
    "repeating_spell-4",
    "repeating_spell-5",
    "repeating_spell-6",
    "repeating_spell-7",
    "repeating_spell-8",
    "repeating_spell-9",
    "repeating_npcreaction",
    "repeating_npcaction-l",
    "repeating_spell-7",
    "repeating_spell-9"
]
*/
/* ATTRIBUTE NAMES FOR REPEATING TRAITS
[
    "atkbonus",
    "atkflag",
    "atkname",
    "atkdmgtype",
    "atkrange",
    "details-flag",
    "desc",
    "description",
    "dmg2attr",
    "dmg2base",
    "dmg2flag",
    "dmg2type",
    "dmgattr",
    "dmgbase",
    "dmgflag",
    "dmgtype",
    "hldmg",
    "innate",
    "name",
    "options-flag",
    "rollbase",
    "rollcontent",
    "saveattr",
    "saveeffect",
    "savedc",
    "saveflag",
    "spellathigherlevels",
    "spellattack",
    "spellattackid",
    "spellcastingtime",
    "spellconcentration",
    "spelldamage",
    "spelldamage2",
    "spelldamagetype",
    "spelldamagetype2",
    "spelldescription",
    "spelledmgmod",
    "spellhealing",
    "spellhlbonus",
    "spellhldie",
    "spellhldietype",
    "spellid",
    "spelllevel",
    "spellname",
    "spelloutput",
    "spellrange",
    "spellritual",
    "spellschool",
    "spellsave",
    "spellsavesuccess",
    "spelltarget",
    "spellduration",
    "spelldmgmod",
    "updateflag"
]

*/
/* ATTRIBUTE NAMES BY ACTION TYPE
{
  "attributes": {
    "attack": [
      "atkbonus",
      "atkflag",
      "atkname",
      "atkdmgtype",
      "atkrange",
      "dmg2attr",
      "dmg2base",
      "dmg2flag",
      "dmg2type",
      "dmgattr",
      "dmgbase",
      "dmgflag",
      "dmgtype",
      "hldmg",
      "options-flag",
      "rollbase",
      "saveattr",
      "saveeffect",
      "savedc",
      "saveflag",
      "spellid",
      "spelllevel"
    ],
    "npcaction": [
      "description",
      "name",
      "rollbase",
      "updateflag"
    ],
    "npcaction-l": [
      "description",
      "name",
      "rollbase",
      "updateflag"
    ],
    "npcreaction": [
      "desc",
      "description",
      "name"
    ],
    "spell-1": [
      "details-flag",
      "innate",
      "options-flag",
      "rollcontent",
      "spelldamage",
      "spelldamage2",
      "spelldamagetype",
      "spelldamagetype2",
      "spelldescription",
      "spelldmgmod",
      "spellduration",
      "spellathigherlevels",
      "spellattack",
      "spellattackid",
      "spellcastingtime",
      "spellconcentration",
      "spellhealing",
      "spellhlbonus",
      "spellhldie",
      "spellhldietype",
      "spelllevel",
      "spellname",
      "spelloutput",
      "spellrange",
      "spellritual",
      "spellschool",
      "spellsave",
      "spellsavesuccess",
      "spelltarget"
    ],
    "spell-2": [
      "details-flag",
      "innate",
      "options-flag",
      "rollcontent",
      "spelldamage",
      "spelldamage2",
      "spelldamagetype",
      "spelldamagetype2",
      "spelldescription",
      "spelldmgmod",
      "spellduration",
      "spellathigherlevels",
      "spellattack",
      "spellattackid",
      "spellcastingtime",
      "spellconcentration",
      "spellhealing",
      "spellhldie",
      "spellhldietype",
      "spelllevel",
      "spellname",
      "spelloutput",
      "spellrange",
      "spellritual",
      "spellschool",
      "spellsave",
      "spellsavesuccess",
      "spelltarget"
    ],
    "spell-3": [
      "details-flag",
      "innate",
      "options-flag",
      "rollcontent",
      "spelldamage",
      "spelldamage2",
      "spelldamagetype",
      "spelldamagetype2",
      "spelldescription",
      "spellduration",
      "spellathigherlevels",
      "spellattackid",
      "spellcastingtime",
      "spellconcentration",
      "spellhldie",
      "spellhldietype",
      "spelllevel",
      "spellname",
      "spelloutput",
      "spellrange",
      "spellritual",
      "spellschool",
      "spellsave",
      "spellsavesuccess",
      "spelltarget"
    ],
    "spell-4": [
      "details-flag",
      "innate",
      "options-flag",
      "rollcontent",
      "spelldamage",
      "spelldamage2",
      "spelldamagetype",
      "spelldamagetype2",
      "spelldescription",
      "spellduration",
      "spellathigherlevels",
      "spellattackid",
      "spellcastingtime",
      "spellconcentration",
      "spellhldie",
      "spellhldietype",
      "spelllevel",
      "spellname",
      "spelloutput",
      "spellrange",
      "spellritual",
      "spellschool",
      "spellsave",
      "spellsavesuccess",
      "spelltarget"
    ],
    "spell-5": [
      "details-flag",
      "innate",
      "options-flag",
      "rollcontent",
      "spelldamage",
      "spelldamage2",
      "spelldamagetype",
      "spelldamagetype2",
      "spelldescription",
      "spellduration",
      "spellathigherlevels",
      "spellattackid",
      "spellcastingtime",
      "spellconcentration",
      "spellhldie",
      "spellhldietype",
      "spelllevel",
      "spellname",
      "spelloutput",
      "spellrange",
      "spellritual",
      "spellschool",
      "spellsave",
      "spellsavesuccess",
      "spelltarget"
    ],
    "spell-6": [
      "details-flag",
      "innate",
      "options-flag",
      "rollcontent",
      "spelldamage",
      "spelldamage2",
      "spelldamagetype",
      "spelldamagetype2",
      "spelldescription",
      "spellduration",
      "spellathigherlevels",
      "spellattackid",
      "spellcastingtime",
      "spellconcentration",
      "spellhldie",
      "spellhldietype",
      "spelllevel",
      "spellname",
      "spelloutput",
      "spellrange",
      "spellritual",
      "spellschool",
      "spellsave",
      "spellsavesuccess",
      "spelltarget"
    ],
    "spell-7": [
      "details-flag",
      "innate",
      "options-flag",
      "rollcontent",
      "spelldamage",
      "spelldamage2",
      "spelldamagetype",
      "spelldamagetype2",
      "spelldescription",
      "spellduration",
      "spellathigherlevels",
      "spellattack",
      "spellattackid",
      "spellcastingtime",
      "spellconcentration",
      "spellhldie",
      "spellhldietype",
      "spelllevel",
      "spellname",
      "spelloutput",
      "spellrange",
      "spellschool",
      "spellsave",
      "spellsavesuccess",
      "spelltarget"
    ],
    "spell-8": [
      "details-flag",
      "innate",
      "options-flag",
      "rollcontent",
      "spelldamage",
      "spelldamage2",
      "spelldamagetype",
      "spelldamagetype2",
      "spelldescription",
      "spellduration",
      "spellattackid",
      "spellcastingtime",
      "spellconcentration",
      "spelllevel",
      "spellname",
      "spelloutput",
      "spellrange",
      "spellschool",
      "spellsave",
      "spellsavesuccess",
      "spelltarget"
    ],
    "spell-9": [
      "details-flag",
      "innate",
      "options-flag",
      "spelldescription",
      "spellduration",
      "spellcastingtime",
      "spelllevel",
      "spellname",
      "spellrange",
      "spellschool",
      "spelltarget"
    ],
    "spell-cantrip": [
      "details-flag",
      "innate",
      "options-flag",
      "rollcontent",
      "spelldamage",
      "spelldamage2",
      "spelldamagetype",
      "spelldamagetype2",
      "spelldescription",
      "spellduration",
      "spellattack",
      "spellattackid",
      "spellcastingtime",
      "spellconcentration",
      "spelllevel",
      "spellname",
      "spelloutput",
      "spellrange",
      "spellritual",
      "spellschool",
      "spellsave",
      "spellsavesuccess",
      "spelltarget"
    ]
  }
}
*/
