const { SchemaField, NumberField, ArrayField, StringField } =
  foundry.data.fields;
/**
 * Create a new instance of Number Field integer and required
 * @param {Number} initial - initial value, default 0
 * @param {Boolean} nullable - is this field nulleable? default false
 *
 * @returns { import("../../foundry/common/data/fields.mjs").NumberField }
 */
export function defineAttributeField(initial = 0, nullable = false) {
  return new SchemaField({
    value: new NumberField({
      required: true,
      integer: true,
      nullable,
      initial,
    }),
    mods: new ArrayField(
      new SchemaField({
        value: new NumberField({
          integer: true,
        }),
        label: new StringField({
          trim: true,
          textSearch: false,
        }),
      }),
      {
        initial: [],
        nullable: false,
        required: true,
      }
    ),
    modifier: new NumberField({
      required: false,
      integer: true,
      initial: 0,
    }),
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

/**
 * Special case StringField which represents a formula.
 *
 * @param {FormulaFieldOptions} [options={}]  Options which configure the behavior of the field.
 * @property {boolean} deterministic=false    Is this formula not allowed to have dice values?
 */
export class FormulaField extends foundry.data.fields.StringField {

  /** @inheritDoc */
  static get _defaults() {
    return foundry.utils.mergeObject(super._defaults, {
      deterministic: false
    });
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _validateType(value) {
    Roll.validate(value);
    if ( this.options.deterministic ) {
      const roll = new Roll(value);
      if ( !roll.isDeterministic ) throw new Error("must not contain dice terms");
    }
    super._validateType(value);
  }

  /* -------------------------------------------- */
  /*  Active Effect Integration                   */
  /* -------------------------------------------- */

  /** @override */
  _castChangeDelta(delta) {
    return this._cast(delta).trim();
  }

  /* -------------------------------------------- */

  /** @override */
  _applyChangeAdd(value, delta, model, change) {
    if ( !value ) return delta;
    const operator = delta.startsWith("-") ? "-" : "+";
    delta = delta.replace(/^[+-]/, "").trim();
    return `${value} ${operator} ${delta}`;
  }

  /* -------------------------------------------- */

  /** @override */
  _applyChangeMultiply(value, delta, model, change) {
    if ( !value ) return delta;
    const terms = new Roll(value).terms;
    if ( terms.length > 1 ) return `(${value}) * ${delta}`;
    return `${value} * ${delta}`;
  }

  /* -------------------------------------------- */

  /** @override */
  _applyChangeUpgrade(value, delta, model, change) {
    if ( !value ) return delta;
    const terms = new Roll(value).terms;
    if ( (terms.length === 1) && (terms[0].fn === "max") ) return current.replace(/\)$/, `, ${delta})`);
    return `max(${value}, ${delta})`;
  }

  /* -------------------------------------------- */

  /** @override */
  _applyChangeDowngrade(value, delta, model, change) {
    if ( !value ) return delta;
    const terms = new Roll(value).terms;
    if ( (terms.length === 1) && (terms[0].fn === "min") ) return current.replace(/\)$/, `, ${delta})`);
    return `min(${value}, ${delta})`;
  }
}
