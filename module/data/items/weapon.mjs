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

      attributes: new SchemaField({
        strength: new NumberField({ integer: true, required: false }),
      }),

      onBackpack: new BooleanField({ required: true }),

      type: new StringField({
        choices: CONFIG.WHQ.weaponTypes,
      }),

      rollOptions: new SchemaField({
        ignoreArmor: new BooleanField({ required: true, initial: false }),
        extraDices: new NumberField({ required: true, integer: true, min: 0 }),
        damageModifier: new FormulaField({
          required: false,
          initial: "",
          trim: true,
          deterministic: false,
        }),
      }),

      origin: new StringField({
        choices: CONFIG.WHQ.originOption,
      }),
    };
  }
}
