import { defineIntegerField, defineBarField } from "./common.mjs";
/**
 * @typedef {Object} CharacterSchema
 *
 * @property {Object} skills                 - The skills of the character.
 * @property {number} skills.ballistic       - Ballistic skill value.
 * @property {number} skills.weapon          - Weapon skill value.
 *
 * @property {Object} wounds                 - The health (wounds) of the character.
 * @property {number} wounds.max             - Maximum wounds.
 * @property {number} wounds.value           - Current wounds.
 *
 * @property {number} move                   - Movement value of the character.
 *
 * @property {Object} luck                   - The luck attribute of the character.
 * @property {number} luck.max               - Maximum luck value.
 * @property {number} luck.value             - Current luck value.
 *
 * @property {number} initiative             - Initiative value of the character.
 *
 * @property {Object} attributes             - The attributes of the character.
 * @property {number} attributes.attacks     - Number of attacks.
 * @property {number} attributes.pin         - Pin attribute value.
 * @property {number} attributes.strength    - Strength attribute value.
 * @property {number} attributes.toughness   - Toughness attribute value.
 * @property {number} attributes.willpower   - Willpower attribute value.
 *
 * @property {Object} details                - Additional details about the character.
 * @property {number} details.golds          - The amount of gold the character possesses.
 */

export default class WHQCharacter extends foundry.abstract.TypeDataModel {
  /* -------------------------------------------- */
  /**
   * @override
   * @returns { import("../../foundry/common/abstract/data.mjs").DataSchema }
   */
  static defineSchema() {
    const { SchemaField, NumberField } = foundry.data.fields;

    return {
      // Wounds
      wounds: defineBarField(),

      // Luck
      luck: defineBarField(0, 0),

      // Movement
      move: defineIntegerField(),

      // Initiative
      initiative: defineIntegerField(),

      //Attacks
      attacks: defineIntegerField(),

      // Attributes
      attributes: new SchemaField({
        pin: defineIntegerField(),
        strength: defineIntegerField(),
        toughness: defineIntegerField(),
        willpower: defineIntegerField(),
        weaponSkill: defineIntegerField(),
        ballisticSkill: defineIntegerField(),
      }),

      // Details
      details: new SchemaField({
        golds: defineIntegerField(),
        level: defineIntegerField(1),
      }),
    };
  }
  /**
   * @override
   * @param {object} data - The initial data object provided to the document creation request
   * @param {object} options -  Additional options which modify the creation request
   * @param {string} userId - The id of the User requesting the document update
   */
  _preCreate(data, options, userId) {
    const system = data.system ?? {};
    const actorType = this.parent.type;
    const initialValues = CONFIG.WHQ.actors[actorType].initialValues ?? {};
    foundry.utils.mergeObject(system, initialValues, { overwrite: false });
    this.parent.updateSource({ system });
  }

  prepareBaseData() {
    const level = this.details.level;

    function getTitleByLevel(level) {  

      if (level === 1) return "novice";
      else if (level <= 4) return "champion";
      else if (level <= 8) return "hero";
      else if (level <= 10) return "lord";
      else return undefined;
    }

    this.details.title = getTitleByLevel(level);
  }
  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Actor.
   * @returns {object}
   */
  getRollData() {
    const data = foundry.utils.deepClone(this);
    return data;
  }
}
