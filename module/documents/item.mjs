import WHQActor from "./actor.mjs";
/**
 *
 */
export default class WHQItem extends Item {
  get isWeapon() {
    return this.type === "weapon";
  }
  get isMeleeWeapon() {
    return this.isWeapon && this.system?.type === "melee";
  }

  get isRangedWeapon() {
    return this.isWeapon && this.system?.type === "ranged";
  }

  /**
   * @override
   */
  static getDefaultArtwork(itemData) {
    switch (itemData.type) {
      case "weapon":
        return {
          img: "icons/weapons/swords/greatsword-crossguard-barbed.webp",
        };
      default:
        return { img: this.DEFAULT_ICON };
    }
  }

  /**
   * @override
   */
  getRollData() {
    const data = {
      ...super.getRollData(),
      actor: this.parent?.getRollData(),
    };
    if (this.isWeapon && this.parent)
      data.str = this.isMeleeWeapon
        ? data.actor.strength
        : this.system.strength;

    return data;
  }
  use() {
    if (!this.actor) return;
    switch (this.type) {
      case "weapon":
        if (this.isMeleeWeapon) return this._rollMeleeAttack();
        if (this.isRangedWeapon) return this._rollRangedAttack();
      default:
        break;
    }
  }
  /**
   * Rolls damage with optional strength modifier and target's toughness deduction.
   *
   * @param {Actor} targetActor - The actor being targeted in the roll, providing toughness for the deduction.
   * @returns {Promise<void>} - Sends the evaluated roll message to the chat.
   */
  async _rollDamage(targetActor) {
    const rollData = this.getRollData();
    const parts = ["1d6", rollData.str ? "+ @str" : ""];
    const targetToughness = targetActor.getRollData().toughness || 0;

    parts.push(`- ${targetToughness}`);

    const rollDamage = await Roll.create(parts.join(" "), rollData).evaluate();
    await rollDamage.toMessage();
  }

  /**
   * Handle melee attack rolls for weapons.
   *
   * Rolls a melee attack against selected targets, compares the roll with the target's weapon skill,
   * and triggers a damage roll if successful.
   *
   * @returns {Promise<void>} - Resolves after rolling attacks and possibly applying damage.
   */
  async _rollMeleeAttack() {
    const targets = game.user.targets.map((t) => t.document);
    const combatTable = this.actor.getCombatTable();

    if (targets.length === 0) {
      console.warn(
        "No targets selected. Please select one or more targets to attack."
      );
      return;
    }

    for (const token of targets) {
      const roll = await Roll.create("1d6").evaluate();
      await roll.toMessage();

      const targetWS = token.actor.system.attributes.weaponSkill.total;
      if (roll.total >= combatTable[targetWS - 1]) {
        this._rollDamage(token.actor);
      }
    }
  }

  /**
   * Handle ranged attack rolls.
   *
   * Rolls a ranged attack against selected targets, compares the roll with the actor's ballistic skill,
   * and triggers a damage roll if the attack succeeds.
   *
   * @returns {Promise<void>} - Resolves after rolling attacks and possibly applying damage.
   */
  async _rollRangedAttack() {
    const targets = game.user.targets.map((t) => t.document);
    const { ballisticSkill } = this.getRollData().actor;

    if (targets.length === 0) {
      console.warn(
        "No targets selected. Please select one or more targets to attack."
      );
      return;
    }

    for (const token of targets) {
      const roll = await Roll.create("1d6").evaluate();
      await roll.toMessage();

      if (roll.total >= ballisticSkill) {
        this._rollDamage(token.actor);
      }
    }
  }
}
