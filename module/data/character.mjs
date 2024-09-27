import {
  defineAttributeField,
  defineBarField,
  defineEquipmentField,
  defineRingsFields,
} from "./common.mjs";

export default class WHQCharacter extends foundry.abstract.TypeDataModel {
  /* -------------------------------------------- */
  /**
   * @override
   * @returns { import("../../foundry/common/abstract/data.mjs").DataSchema }
   */
  static defineSchema() {
    const { SchemaField, NumberField } = foundry.data.fields;

    return {
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
          initial: 1,
          min: 1,
          max: 10,
        }),
      }),

      equipment: new SchemaField({
        bodyParts: new SchemaField({
          head: defineEquipmentField(),
          helmet: defineEquipmentField(),
          body: defineEquipmentField(),
          cloak: defineEquipmentField(),
          belt: defineEquipmentField(),
          hands: defineEquipmentField(),
          sword: defineEquipmentField(),
          shield: defineEquipmentField(),
          boots: defineEquipmentField(),
        }),
        ringsParts: defineRingsFields(),
        otherParts: new SchemaField({
          bracelets0: defineEquipmentField(),
          bracelets1: defineEquipmentField(),
          amulet: defineEquipmentField(),
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

    const equipmentIds = new Set();

    Object.values(this.equipment).forEach(part => {
        Object.values(part).map(obj => obj.item?._id).forEach(id => {
          if(id){
            equipmentIds.add(id)
          }
        })

    })

    Object.defineProperty(this.equipment, "ids", {
      value: equipmentIds,
      enumerable: false,
      writable: false,
    });
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Actor.
   * @returns {object}
   */
  getRollData() {
    const data = foundry.utils.deepClone(this);
    Object.keys(this.attributes).forEach((attrKey) => {
      data[attrKey] = this.attributes[attrKey].value;
    });
    return data;
  }
}
