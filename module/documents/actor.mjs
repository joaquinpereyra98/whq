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
    damage = Math.max(damage, 0);
    const actualWounds = this.system.wounds.value;
    const newWounds = Math.max(0, actualWounds - damage);
    this._displayScrollingTextOnToken(`-${damage} Wounds`, {
      fill: "#d20000",
    });
    await this.update({ "system.wounds.value": newWounds });
  }

  /**
   *
   * @param {Number | String} heal - Amount of heal to be appliea to actor, or a string for the relative amount
   * @param {Object} options
   */
  async applyHeal(heal, options) {
    const { max, value } = this.system.wounds;
    if (typeof heal === "string") {
      switch (heal) {
        case "all":
          heal = max;
          break;
        default:
          console.error("heal is not a valid string");
          break;
      }
    } else if (typeof heal === "number") {
      heal = Math.max(heal, 0);
    }
    this._displayScrollingTextOnToken(`+${heal} Wounds`, {
      fill: "#009d00",
      direction: CONST.TEXT_ANCHOR_POINTS.TOP,
    });
    const newWounds = Math.min(max, value + heal);
    await this.update({ "system.wounds.value": newWounds });
  }
  /**
   *
   * @param {string} content - The text content to display
   * @param {object} options - Options which customize the text animation
   */
  _displayScrollingTextOnToken(content, options) {
    const tokens = this.getActiveTokens(true);

    const scrollOptions = foundry.utils.mergeObject(
      {
        duration: 2500,
        anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
        direction: CONST.TEXT_ANCHOR_POINTS.BOTTOM,
        jitter: 0.25,
        fill: "#d20000",
        fontSize: 40,
        fontWeight: "bold",
        strokeThickness: 3,
      },
      options
    );

    for (const token of tokens) {
      if (!token.visible || !token.renderable) continue;
      scrollOptions.distance = token.h * 0.6;
      canvas.interface.createScrollingText(
        token.center,
        content,
        scrollOptions
      );
    }
  }
}
