import {
  defineAttributeField,
  defineBarField,
  defineEquipmentField,
} from "./common.mjs";

import CONSTANT from "../constants.mjs";

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
        head: defineEquipmentField(),
        body: defineEquipmentField(),
        leftHand: defineEquipmentField(),
        rightHand: defineEquipmentField(),
        boots: defineEquipmentField(),
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
    CONSTANT.equipKeys.forEach((slot) => {
      const id = this.equipment[slot]?._id;
      if(equipmentIds.has(id)){
        console.warn(`Item ${id} is alreasy is equiped on Actor ${this.parent?._id}`)
      } else if(id) {
        equipmentIds.add(id)
      }
    });

    Object.defineProperty(this, "equipmentIds", {
      value: equipmentIds,
      enumerable: false,
      writable: false
    });
  }

  prepareDerivedData() {
    Object.values(this.attributes).forEach((attr) => {
      attr.total =
        attr.value +
        attr.modifier +
        attr.mods.reduce(
          (sum, { value, mod }) =>
            typeof value === "number" ? sum + value + mod : sum,
          0
        );
    });
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Actor.
   * @returns {object}
   */
  getRollData() {
    const data = foundry.utils.deepClone(this);
    Object.keys(this.attributes).forEach((attrKey) => {
      data[attrKey] = this.attributes[attrKey].total;
    });
    return data;
  }
}
