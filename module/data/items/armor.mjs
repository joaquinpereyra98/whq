import { FormulaField } from "../common.mjs";

export default class WHQWeapon extends foundry.abstract.TypeDataModel {
  /**
   * @override
   * @returns { import("../../../foundry/common/abstract/data.mjs").DataSchema }
   */
  static defineSchema() {
    const { SchemaField, NumberField, StringField, HTMLField, BooleanField } =
      foundry.data.fields;

    return {
      //Details
      description: new HTMLField({
        required: true,
        nullable: true,
        label: "WHQ.Description",
      }),
      price: new NumberField({
        required: true,
        nullable: false,
        initial: 0,
        min: 0,
      }),

      //Combat
      type: new StringField({
        choices: CONFIG.WHQ.armorTypes,
      }),

      
    };
  }
}
