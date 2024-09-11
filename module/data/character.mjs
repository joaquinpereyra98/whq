export default class WHQCharacter extends foundry.abstract.TypeDataModel {
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
      skills: new SchemaField({
        weapon: new NumberField({
          ...requiredInteger(),
        }),
        ballistic: new NumberField({
          ...requiredInteger(),
        }),
      }),
      stats: new SchemaField({
        wounds: new SchemaField({
          value: new NumberField({
            ...requiredInteger(),
            min: 0,
          }),
          max: new NumberField({
            ...requiredInteger(null),
            nullable: true,
            min: 0,
          }),
        }),
        move: new NumberField({
          ...requiredInteger(),
          min: 0,
        }),
        initiative: new NumberField({
          ...requiredInteger(),
        }),
        attacks: new NumberField({
          ...requiredInteger(1),
        }),
      }),
      attributes: new SchemaField({
        strength: new NumberField({
          ...requiredInteger(),
          initial: 0,
        }),
        toughness: new NumberField({
          ...requiredInteger(),
        }),
      }),
      details: new SchemaField({
        golds: new NumberField({
          ...requiredInteger()
        })
      })
    };
  }
  /**
   * @override
   * @param {object} data - The initial data object provided to the document creation request
   * @param {object} options -  Additional options which modify the creation request
   * @param {string} userId - The id of the User requesting the document update
   */
  _preCreate(data, options, userId) {
    if (!data.system) {
      const actorType = this.parent.type;
      const initialValues = CONFIG.WHQ.actors[actorType].initialValues ?? {};
      data.system = initialValues;
      this.parent.updateSource({ system: data.system });
    }
  }
  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Actor.
   * @returns {object}
   */
  getRollData() {
    const data = foundry.utils.deepClone(this);

    data.initiative = data.stats.initiative;

    return data;
  }
}
