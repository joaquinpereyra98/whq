const { SchemaField, NumberField } = foundry.data.fields;
/**
 * Create a new instance of Number Field integer and required
 * @param {Number} initial - initial value, default 0
 * @param {Boolean} nullable - is this field nulleable? default false
 *
 * @returns { import("../../foundry/common/data/fields.mjs").NumberField }
 */
export function defineIntegerField(initial = 0, nullable = false) {
  return new NumberField({
    required: true,
    integer: true,
    nullable,
    initial,
  });
}
/**
 * Create a new instance of SchemaField with a NumberField of max and value.
 * @returns { import ("../../foundry/common/data/fields.mjs").SchemaField}
 */
export function defineBarField(val = 0, max = null) {
  return new SchemaField({
    max: new NumberField({
      required: true,
      integer: true,
      nullable: true,
      min: 0,
      initial: max,
    }),
    value: new NumberField({
      required: true,
      integer: true,
      nullable: true,
      min: 0,
      initial: val,
    }),
  });
}
