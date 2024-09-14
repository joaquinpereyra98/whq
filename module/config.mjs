const WHQ = {};
/**
 * @typedef {Object} ActorConfig
 * @property {string} woundsRoll             - Wounds roll formula.
 * @property {boolean} autopining            - Auto-pinning setting.
 * @property {CharacterData} initialValues - Initial values of the actor.
 */

/**
 * @type {{ elf: ActorConfig }}
 */

WHQ.actors = {
  elf: {
    woundsRoll: "1d6 + 7",
    autopining: true,
    initialValues: {
      move: 4,
      initiative: 6,
      attacks: 1,
      attributes: {
        pin: 0,
        strength: 3,
        toughness: 3,
        willpower: 2,
        weaponSkill: 4,
        ballisticSkill: 4,
      },
    },
  },
};

WHQ.attributes = Object.fromEntries(
  [
    "pin",
    "strength",
    "toughness",
    "willpower",
    "weaponSkill",
    "ballisticSkill",
  ].map((key) => [
    key,
    {
      name: `WHQ.Attributes.${key.capitalize()}`,
      abrr: `WHQ.Attributes.${key.capitalize()}Abrr`,
    },
  ])
);

export default WHQ;
