export default class WHQItem extends Item {
  /**
   * ---------------------------------------
   * 1. GETTERS
   * ---------------------------------------
   */
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
   * Important information on a targeted token.
   *
   * @typedef {object} TargetDescriptor
   * @property {string} uuid - The UUID of the target.
   * @property {string} img - The target's image.
   * @property {string} name - The target's name.
   * @property {number} toughness - The target's toughness, if applicable.
   * @property {number} weaponSkill - The target's Weapon Skill, if applicable.
   */

  /**
   * Extract salient information about targeted Actors.
   * @returns {TargetDescriptor[]}
   * @protected
   */
  static _formatAttackTargets() {
    return Array.from(game.user.targets).map((token) => {
      const { name } = token;
      const { img, system, uuid } = token.actor || {};
      return {
        name,
        img,
        uuid,
        toughness: system?.attributes?.toughness?.total || 0,
        weaponSkill: system?.attributes?.weaponSkill?.total || 0,
      };
    });
  }

  /**
   * ---------------------------------------
   * 2. STATIC METHODs
   * ---------------------------------------
   */

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
   * ---------------------------------------
   * 2. ROLLEABLE METHOD
   * ---------------------------------------
   */

  /**
   * @override
   */
  getRollData() {
    const data = {
      ...super.getRollData(),
      actor: this.parent?.getRollData(),
    };

    if (this.isRangedWeapon) {
      data.strength = this.system.attributes.strength;
    }
    return data;
  }

  /**
   *
   * @returns {String|null} Return de formula for roll damage or null.
   */
  getDamageFormula() {
    if (!this.isWeapon) return null;

    const {
      extraDices = 0,
      damageModifier,
      ignoreArmor,
    } = this.system.rollOptions;
    const baseDice = `${extraDices > 0 ? 1 + extraDices : 1}d6`;

    const parts = [baseDice];

    if (this.isMeleeWeapon) {
      parts.push("+", "@actor.strength");
      if (!ignoreArmor) parts.push("-", "@target.toughness");
    } else if (this.isRangedWeapon) {
      parts.push("+", "@strength");
    }

    if (damageModifier) {
      const operator = damageModifier.startsWith("-") ? "-" : "+";
      const mod = damageModifier.replace(/^[+-]/, "").trim();
      parts.push(operator, mod);
    }

    const formula = parts.join(" ");
    return formula;
  }

  /**
   * Trigger an item usage.
   * @returns
   */
  async use() {
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
   * @param {TargetDescriptor} target - The actor being targeted in the roll, providing toughness for the deduction.
   * @returns {Promise<void>} - Sends the evaluated roll message to the chat.
   */
  async _rollDamage(target) {
    const rollData = this.getRollData();
    rollData.target = target;

    const formula = this.getDamageFormula();

    const rollDamage = await Roll.create(formula, rollData).evaluate();
    await rollDamage.toMessage({flavor: "Roll Damage"});

    const actor = await fromUuid(target.uuid);
    await actor.applyDamage(rollDamage.total)
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
    const combatTable = this.actor.getCombatTable();

    if (game.user.targets.size === 0) {
      console.warn(
        "No targets selected. Please select one or more targets to attack."
      );
      return;
    }

    const roll = await Roll.create(
      "1d6 + @actor.weaponSkill",
      this.getRollData()
    ).evaluate();
    await roll.toMessage({flavor: "Roll Melee Attack"});

    const targets = this.constructor._formatAttackTargets();
    for (const target of targets) {
      if (roll.total >= combatTable[target.weaponSkill - 1]) {
        this._rollDamage(target);
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
    const rollData = this.getRollData()

    if (game.user.targets.size === 0) {
      console.warn(
        "No targets selected. Please select one or more targets to attack."
      );
      return;
    }

    const roll = await Roll.create(
      "1d6",
      rollData
    ).evaluate();
    await roll.toMessage({flavor: "Roll Ranged Attack"});

    const targets = this.constructor._formatAttackTargets();

    for (const target of targets) {
      if (roll.total >= rollData.actor.ballisticSkill) {
        this._rollDamage(target);
      }
    }
  }
}
