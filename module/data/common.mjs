const {
  SchemaField,
  NumberField,
  ArrayField,
  StringField,
  ForeignDocumentField,
} = foundry.data.fields;
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
 * @param {Number} val
 * @param {Number|Null} max
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
 * Create anew instance of ForeignDocumentField for Items model
 * @returns {import (../../foundry/common/data/fields.mjs).ForeignDocumentField}
 */
export function defineEquipmentField() {
  return new SchemaField({
    item: new LocalDocumentField(foundry.documents.BaseItem, {
      required: true,
      fallback: true,
      idOnly: false
    })
  });
}

export function defineRingsFields() {
  const fields = {};
  for (let index = 0; index < 8; index++) {
    fields[`ring${index}`] = defineEquipmentField();
  };
  return new SchemaField(fields);
}
/**
 * Special case StringField which represents a formula.
 * copy form DnD5e
 *
 * @param {FormulaFieldOptions} [options={}]  Options which configure the behavior of the field.
 * @property {boolean} deterministic=false    Is this formula not allowed to have dice values?
 */
export class FormulaField extends foundry.data.fields.StringField {
  /** @inheritDoc */
  static get _defaults() {
    return foundry.utils.mergeObject(super._defaults, {
      deterministic: false,
    });
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _validateType(value) {
    Roll.validate(value);
    if (this.options.deterministic) {
      const roll = new Roll(value);
      if (!roll.isDeterministic) throw new Error("must not contain dice terms");
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
    if (!value) return delta;
    const operator = delta.startsWith("-") ? "-" : "+";
    delta = delta.replace(/^[+-]/, "").trim();
    return `${value} ${operator} ${delta}`;
  }

  /* -------------------------------------------- */

  /** @override */
  _applyChangeMultiply(value, delta, model, change) {
    if (!value) return delta;
    const terms = new Roll(value).terms;
    if (terms.length > 1) return `(${value}) * ${delta}`;
    return `${value} * ${delta}`;
  }

  /* -------------------------------------------- */

  /** @override */
  _applyChangeUpgrade(value, delta, model, change) {
    if (!value) return delta;
    const terms = new Roll(value).terms;
    if (terms.length === 1 && terms[0].fn === "max")
      return current.replace(/\)$/, `, ${delta})`);
    return `max(${value}, ${delta})`;
  }

  /* -------------------------------------------- */

  /** @override */
  _applyChangeDowngrade(value, delta, model, change) {
    if (!value) return delta;
    const terms = new Roll(value).terms;
    if (terms.length === 1 && terms[0].fn === "min")
      return current.replace(/\)$/, `, ${delta})`);
    return `min(${value}, ${delta})`;
  }
}

/**
 * @typedef {StringFieldOptions} LocalDocumentFieldOptions
 * @property {boolean} [fallback=false]  Display the string value if no matching item is found.
 */

/**
 * A mirror of ForeignDocumentField that references a Document embedded within this Document.
 *
 * @param {typeof Document} model              The local DataModel class definition which this field should link to.
 * @param {LocalDocumentFieldOptions} options  Options which configure the behavior of the field.
 */
export class LocalDocumentField extends foundry.data.fields.DocumentIdField {
  constructor(model, options={}) {
    if ( !foundry.utils.isSubclass(model, foundry.abstract.DataModel) ) {
      throw new Error("A ForeignDocumentField must specify a DataModel subclass as its type");
    }

    super(options);
    this.model = model;
  }

  /* -------------------------------------------- */

  /**
   * A reference to the model class which is stored in this field.
   * @type {typeof Document}
   */
  model;

  /* -------------------------------------------- */

  /** @inheritDoc */
  static get _defaults() {
    return foundry.utils.mergeObject(super._defaults, {
      nullable: true,
      readonly: false,
      idOnly: false,
      fallback: false
    });
  }

  /* -------------------------------------------- */

  /** @override */
  _cast(value) {
    if ( typeof value === "string" ) return value;
    if ( (value instanceof this.model) ) return value._id;
    throw new Error(`The value provided to a LocalDocumentField must be a ${this.model.name} instance.`);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _validateType(value) {
    if ( !this.options.fallback ) super._validateType(value);
  }

  /* -------------------------------------------- */

  /** @override */
  initialize(value, model, options={}) {
    if ( this.idOnly ) return this.options.fallback || foundry.data.validators.isValidId(value) ? value : null;
    const collection = model.parent?.[this.model.metadata.collection];
    return () => {
      const document = collection?.get(value);
      if ( !document ) return this.options.fallback ? value : null;
      if ( this.options.fallback ) Object.defineProperty(document, "toString", {
        value: () => document.name,
        configurable: true,
        enumerable: false
      });
      return document;
    };
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  toObject(value) {
    return value?._id ?? value;
  }
}