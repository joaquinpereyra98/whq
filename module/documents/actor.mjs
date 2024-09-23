/**
 * Extend the base Actor.
 * @extends {Actor}
 */
export default class WHQActor extends Actor {
  /* --------------------------------------------- */

  /** @inheritDoc */
  prepareEmbeddedDocuments() {
    super.prepareEmbeddedDocuments();
    Object.entries(this.system.attributes).forEach(([key, attr]) => {
      this.system.attributes[key].value = attr.value + attr.modifier;
    });
  }

  getRollData() {
    const system = this.system;
    const data = {
      ...super.getRollData(),
      ...system.getRollData(),
      name: this.name,
      flags: this.flags,
    };
    return data;
  }

  async rollAttribute(attrKey) {
    const attribute = this.system.attributes[attrKey];
    const r = await Roll.create(`1d6 + ${attribute.total}`).evaluate();
    const flavor = `${game.i18n.localize(
      CONFIG.WHQ.attributes[attrKey].name
    )} Attribute Roll`;
    await r.toMessage({ flavor });
  }

  getCombatTable() {
    return [2, 3, 3, 4, 4, 4, 4, 4, 5, 5];
  }

  /**
   * Handle for apply damage to actor.
   * @param {Number} damage - Amount of damage to be applied to Actor
   * @param {Object} options - Option for the calc of damage
   * @returns
   */
  async applyDamage(damage, options) {
    //Check is damage is a number
    if (typeof damage !== "number") {
      console.error("WHQ Error | damage should be a number");
      return;
    }
    //Make damage a integer positive
    damage = Math.floor(Math.abs(damage));

    const actualWounds = this.system.wounds.value;
    const newWounds = Math.max(0, actualWounds - damage);
    await this.update({ "system.wounds.value": newWounds });
  }

  /**
   *
   * @param {Number | String} heal - Amount of heal to be appliea to actor, or a string for the relative amount
   * @param {Object} options
   */
  async applyHeal(heal, options) {
    const maxWounds = this.system.wounds.max;
    const actualWounds = this.system.wounds.value;

    if (typeof heal === "string") {
      switch (heal) {
        case "all":
          heal = maxWounds;
          break;
        default:
          console.error("heal is not a valid string");
          break;
      }
    } else if (typeof heal === "number") {
      //Make damage a integer positive
      heal = Math.floor(Math.abs(heal));
    }
    const newWounds = Math.min(maxWounds, actualWounds + heal);
    await this.update({ "system.wounds.value": newWounds });
  }
}
