import CONSTANT from "./constants.mjs";

const WHQ = {};

WHQ.actors = {
  elf: {
    woundsRoll: "1d6 + 7",
    autopining: true,
    initialValues: {
      initiative: 6,
      attributes: {
        weaponSkill:{value: 4} ,
        ballisticSkill:{value: 4} ,
        strength:{value: 3} ,
        toughness:{value: 3} ,
        willpower:{value: 2} ,
        pin:{value: 0} ,
      },
    },
  },
};

WHQ.attributes = {
    move: {
      name: "Move",
      label: "Move"
    },
    weaponSkill: {
      name: "Weapon Skill",
      label: "WS"
    },
    ballisticSkill: {
      name: "Ballistic Skill",
      label: "BS"
    },
    strength: {
      name: "Strength",
      label: "S"
    },
    toughness: {
      name: "Toughness",
      label: "T"
    },
    attacks: {
      name: "Attacks",
      label: "Atks"
    },
    pin: {
      name: "Pinning",
      label: "Pin"
    },
    willpower: {
      name: "Willpower",
      label: "WP"
    },
    luck: {
      name: "Luck",
      label: "Luck"
    }
  }
  
WHQ.silhouette = `${CONSTANT.systemPath("assets/ui/silhouette_character.svg")}`;

WHQ.weaponTypes = {
  melee: "Melee Weapon",
  ranged: "Ranged Weapon"
}

WHQ.armorTypes = {
  helmet: "Helmet",
  body: "Armour",
  hands: "Gauntlets", 
  shield: "Shield",
  boots: "Boots",
}

WHQ.equipmentTypes = {
  head: "Crown",
  ring: "Ring",
  cloak: "Cloak",
  belt: "Belt",
  bracelet: "Bracelets",
  amulet: "Amulet"
}

export default WHQ;
