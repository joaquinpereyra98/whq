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
  barbarian: {
    woundsRoll: "1d6 + 9",
    initialValues: {
      initiative: 3,
      attributes: {
        weaponSkill:{value: 3} ,
        ballisticSkill:{value: 5} ,
        strength:{value: 4} ,
        toughness:{value: 3} ,
        willpower:{value: 3} ,
        pin:{value: 6} ,
      },
    }
  },
  dwarf: {
    woundsRoll: "1d6 + 8",
    initialValues: {
      initiative: 2,
      attributes: {
        weaponSkill:{value: 4} ,
        ballisticSkill:{value: 5} ,
        strength:{value: 3} ,
        toughness:{value: 4} ,
        willpower:{value: 4} ,
        pin:{value: 5} ,
      },
    }
  }
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

WHQ.originOption = {
  initial: "Initial",
  treasure: "Treasure",
  settlement: "Settlement"
}

export default WHQ;
