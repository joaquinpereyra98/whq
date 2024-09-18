import { defineAttributeField, defineBarField } from "./common.mjs";

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

      initiative: new NumberField({
        required: true,
        integer: true,
        nullable: false,
        initial: 0,
      }),

      attributes: new SchemaField({
        move: defineAttributeField(4),
        weaponSkill: defineAttributeField(),
        ballisticSkill: defineAttributeField(),
        strength: defineAttributeField(),
        toughness: defineAttributeField(),
        attacks: defineAttributeField(1),
        pin: defineAttributeField(),
        willpower: defineAttributeField(),
        luck: defineAttributeField(),
      }),

      // Details
      details: new SchemaField({
        gold: new NumberField({
          required: true,
          integer: true,
          nullable: false,
          initial: 0,
        }),
        level: new NumberField({
          required: true,
          integer: true,
          nullable: false,
          initial: 0,
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
    foundry.utils.mergeObject(system, initialValues, { overwrite: false });
    this.parent.updateSource({ system });
  }

  prepareBaseData() {
    const level = this.details.level;

    function getTitleByLevel(level) {
      if (level === 1) return "Novice";
      else if (level <= 4) return "Champion";
      else if (level <= 8) return "Hero";
      else if (level <= 10) return "Lord";
      else return undefined;
    }

    this.details.title = getTitleByLevel(level);
  }

  prepareDerivedData() {
    Object.values(this.attributes).forEach(attr => {
      attr.total = attr.value + attr.modifier + attr.mods.reduce((sum, { value, mod }) => 
        typeof value === 'number' ? sum + value + mod : sum, 0);
    });    
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Actor.
   * @returns {object}
   */
  getRollData() {
    const data = foundry.utils.deepClone(this);
    Object.keys(this.attributes).forEach(attrKey => {
      data[attrKey] = this.attributes[attrKey].total;
    })
    return data;
  }
}
