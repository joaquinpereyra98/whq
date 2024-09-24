import {defineBarField, FormulaField } from '../common.mjs';

export default class WHQConsumable extends foundry.abstract.TypeDataModel {
  /**
   * @override
   * @returns { import("../../../foundry/common/abstract/data.mjs").DataSchema }
   */
  static defineSchema() {
    const { NumberField, BooleanField, HTMLField, SchemaField } =
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

      uses: defineBarField(1,1),
      autoDestroy: new BooleanField({required: true}),

      heal: new SchemaField({
        applyHeal: new BooleanField(),
        healAll: new BooleanField(),
        formula: new FormulaField({
          required: false,
          initial: "",
          trim: true,
          deterministic: false
        })
      }),

      effect: new SchemaField({
        applyEffect: new BooleanField(),
        duration: new FormulaField({
          required: false,
          initial: "",
          trim: true,
          deterministic: false
        })
      })

    };
  }
}
