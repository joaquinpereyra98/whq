export default class WHQWeapon extends foundry.abstract.TypeDataModel {
  /**
   * @override
   * @returns { import("../../../foundry/common/abstract/data.mjs").DataSchema }
   */
  static defineSchema() {
    const {
      SchemaField,
      NumberField,
      StringField,
      HTMLField,
      BooleanField,
    } = foundry.data.fields;

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

      //Equipament
      equipped: new BooleanField({ required: true }),

      //Combat
      type: new StringField({
        choices: CONFIG.WHQ.weaponTypes,
      }),

      rollOptions: new SchemaField({
        ignoreArmor: new BooleanField({required: true, initial: false}),
        extraDices: new NumberField({required: false, integer: true,}),
      })
    };
  }
}
