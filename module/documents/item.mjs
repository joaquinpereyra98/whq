import CONSTANT from "../constants.mjs";

export default class WHQItem extends Item {
  /**
   * ---------------------------------------
   * 1. GETTERS
   * ---------------------------------------
   */

  get isEquipable() {
    return this.isWeapon || this.isArmor || this.isEquipment;
  }
  get isEquipped() {
    return this.parent?.system?.equipment.ids.has(this._id) ?? false;
  }
  get isWeapon() {
    return this.type === "weapon";
  }
  get isMeleeWeapon() {
    return this.isWeapon && this.system?.type === "melee";
  }

  get isRangedWeapon() {
    return this.isWeapon && this.system?.type === "ranged";
  }

  get isArmor() {
    return this.type === "armor";
  }

  get isEquipment() {
    return this.type === "equipment";
  }

  /**
   * ---------------------------------------
   * 2. STATIC METHODs
   * ---------------------------------------
   */

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
        toughness: system?.attributes?.toughness.value || 0,
        weaponSkill: system?.attributes?.weaponSkill.value || 0,
      };
    });
  }

  /**
   * @override
   */
  static getDefaultArtwork(itemData) {
    return { img: this.DEFAULT_ICON };
  }
  
  /**
   *
   * @param {ChatMessage} message
   * @param {JQuery} $html
   * @param {import("../../foundry/common/types.mjs").ChatMessageData} messageData
   */
  static addChatListener(message, $html, messageData) {
    const button = $html[0].querySelector(".item-action-button");
    if (!button) return;
    button.addEventListener("click", async (event) => {
      const { itemUuid } = event.currentTarget.closest(
        ".chat-card.item-card"
      )?.dataset;
      const item = await fromUuid(itemUuid);
      const { action, targetUuid } = event.currentTarget.dataset;

      if (!action || !item) return;

      switch (action) {
        case "damage":
          const target = await fromUuid(targetUuid);
          if (target) return item._rollDamage(target);

          break;

        default:
          break;
      }
    });
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
      case "consumable":
        return this._onUseConsumable();
      default:
        break;
    }
  }

  /**
   * Rolls damage with optional strength modifier and target's toughness deduction.
   *
   * @param {Actor} target - The actor being targeted in the roll, providing toughness for the deduction.
   * @returns {Promise<void>} - Sends the evaluated roll message to the chat.
   */
  async _rollDamage(target) {
    const rollData = this.getRollData();
    rollData.target = target.getRollData();

    const formula = this.getDamageFormula();

    const rollDamage = await Roll.create(formula, rollData).evaluate();
    this._renderItemChat(rollDamage, `Roll Damage against ${target.name}`, {
      hideDescriptions: true,
    });
    if (game.user.isGM) {
      await target.applyDamage(rollDamage.total);
    } else {
      game.system.socket.emitForGM(CONSTANT.socketTypes.applyDamage, {
        actorUuid: target.uuid,
        damage: rollDamage.total
      })
    }
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
    if (game.user.targets.size === 0) {
      console.warn(
        "No targets selected. Please select one or more targets to attack."
      );
      return;
    }

    const roll = await Roll.create(
      "1d6",
      this.getRollData()
    ).evaluate();
    
    const targets = this.constructor._formatAttackTargets().map((target) => ({
      ...target,
      hit: roll.total >= this.actor?.getToHitValue(this.actor.system?.weaponSkill, target.weaponSkill),
    }));

    return this._renderItemChat(roll, "Roll Melee Attack", {
      isAttack: true,
      targets,
    });
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
    const rollData = this.getRollData();

    if (game.user.targets.size === 0) {
      console.warn(
        "No targets selected. Please select one or more targets to attack."
      );
      return;
    }

    const roll = await Roll.create("1d6", rollData).evaluate();

    const targets = this.constructor._formatAttackTargets().map((target) => ({
      ...target,
      hit: roll.total >= rollData.actor.ballisticSkill,
    }));

    return this._renderItemChat(roll, "Roll Ranged Attack", {
      isAttack: true,
      targets,
    });
  }

  async _onUseConsumable() {
    if (this.type !== "consumable" || !this.actor) return;

    const { uses, autoDestroy, heal, effect } = this.system;

    if (heal.applyHeal) {
      if (heal.healAll) {
        await this.actor.applyHeal("all");
      } else {
        const r = await Roll.create(
          heal.formula,
          this.getRollData()
        ).evaluate();
        await this.actor.applyHeal(r.total);
        r.toMessage({
          label: `${this.actor.name} roll heal from ${this.name}`,
        });
      }
    }
    if (effect.applyEffect) {
      const effects = this.effects.map((ef) => ef.toObject());
      await this.actor.createEmbeddedDocuments("ActiveEffect", effects);
    }
    const newValue = uses.value - 1;
    await this.update({ "system.uses.value": newValue });

    if (autoDestroy && newValue === 0) {
      await this.delete();
    }
  }
  /**
   * Display the chat card for an Item as a Chat Message
   * @param {Roll} roll
   * @param {String} flavor
   * @param {Object} options
   * @param {Boolean} options.isAttack
   * @param {TargetDescriptor[]} options.targets
   * @param {Boolean} options.hideDescriptions
   * @returns {ChatMessage}
   */
  async _renderItemChat(roll = null, flavor = undefined, options = {}) {
    const context = {
      actor: this.actor,
      item: this,
      itemDescription: await TextEditor.enrichHTML(
        this.system.description ?? "",
        {
          rollData: this.getRollData(),
          relativeTo: this.parent,
        }
      ),
      subtitle: `${this.system.type?.capitalize()} ${this.type.capitalize()}`,
      isAttack: options.isAttack,
      roll,
      showDescription: !options.hideDescriptions,
      targets: options.isAttack ? options.targets : null
    };

    const html = await renderTemplate(
      "systems/whq/templates/chat/item-card.hbs",
      context
    );
    const rollContent = await roll.render();

    const msgConfig = {
      content: `${html} ${rollContent}`,
      flags: {
        "whq.item": { id: this.id, uuid: this.uuid, type: this.type },
      },
      speaker: ChatMessage.getSpeaker({
        actor: this.actor,
        token: this.actor.token,
      }),
      rolls: [roll],
      flavor,
    };

    ChatMessage.applyRollMode(msgConfig, game.settings.get("core", "rollMode"));

    return ChatMessage.implementation.create(msgConfig);
  }
}
