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
   *
   * @param {WHQActor} targetActor
   */
  async _rollDamage(targetActor) {
    console.log("Roll Damage")
    const rollData = this.getRollData();
    const parts = ["1d6"];
    if(rollData.str) parts.push("+ @str");
    
    const targetRollData = targetActor.getRollData();
    if (targetRollData.toughness) {
      console.log(targetRollData.toughness)
      parts.push(`- ${targetRollData.toughness}`);
    }
    const rollDamage = await Roll.create(parts.join(" "), rollData).evaluate();
    await rollDamage.toMessage();
  }

  /**
   * Handle for weapons melee attacks
   */
  async _rollMeleeAttack() {
    const targets = game.user.targets.map((t) => t.document);
    const combatTable = this.actor.getCombatTable();

    if(targets.size === 0){
      console.warn("Must select one o more targets")
    }
    for (const token of targets) {
      const r = await Roll.create("1d6").evaluate();
      await r.toMessage();
      const targetWS = token.actor.system.attributes.weaponSkill.total;
      if (r.total >= combatTable[targetWS - 1]) {
        this._rollDamage(token.actor)
      } 
    }
  }

  /**
   * Handle for range ranged attacks
   */
  async _rollRangedAttack() {
    const targets = game.user.targets.map((t) => t.document);
    const rollData = this.getRollData();
    for (const token of targets) {
      const r = await Roll.create("1d6").evaluate();
      await r.toMessage();
      if (r.total >= rollData.actor.ballisticSkill) {
        this._rollDamage(token.actor)
      }
    }
  }
}
