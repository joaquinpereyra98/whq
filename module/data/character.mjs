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
    const requiredInteger = (initial = 0) => ({
      required: true,
      nullable: false,
      integer: true,
      initial,
    });
    return {
      // Skills
      skills: new SchemaField({
        ballistic: new NumberField({
          ...requiredInteger(),
        }),
        weapon: new NumberField({
          ...requiredInteger(),
        }),
      }),

      // Wounds
      wounds: new SchemaField({
        max: new NumberField({
          ...requiredInteger(null),
          nullable: true,
          min: 0,
        }),
        value: new NumberField({
          ...requiredInteger(),
          min: 0,
        }),
      }),

      // Movement
      move: new NumberField({
        ...requiredInteger(),
        min: 0,
      }),

      // Luck
      luck: new SchemaField({
        max: new NumberField({
          ...requiredInteger(0),
          nullable: true,
          min: 0,
        }),
        value: new NumberField({
          ...requiredInteger(0),
          min: 0,
        }),
      }),

      // Initiative
      initiative: new NumberField({
        ...requiredInteger(),
      }),

      // Attributes
      attributes: new SchemaField({
        attacks: new NumberField({
          ...requiredInteger(),
        }),
        pin: new NumberField({
          ...requiredInteger(),
      }),
      }),
      attributes: new SchemaField({
        }),
      attributes: new SchemaField({
        strength: new NumberField({
          ...requiredInteger(),
        }),
        toughness: new NumberField({
          ...requiredInteger(),
        }),
        willpower: new NumberField({
          ...requiredInteger(),
        }),
      }),

      // Details
      details: new SchemaField({
        golds: new NumberField({
          ...requiredInteger(),
        }),
        level: new NumberField({
          ...requiredInteger(1),
        }),
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
      foundry.utils.mergeObject(system, initialValues, {overwrite: false})
      this.parent.updateSource({ system });
  }

  prepareBaseData(){
    const level = this.details.level;

    function getTitleByLevel(level) {
      if (level === 1) return "novice";
      if (level <= 4) return "champion";
      if (level <= 8) return "hero";
      if (level <= 10) return "lord";
      return undefined;
    }
    
    this.details.title = getTitleByLevel(level)
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
