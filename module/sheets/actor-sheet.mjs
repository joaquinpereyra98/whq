import CONSTANT from "../constants.mjs";
const { api, sheets } = foundry.applications;

/**
 * Extend ActorSheet with modifications for WHQ.
 * @extends {ActorSheetV2}
 */
export class WHQActorSheet extends api.HandlebarsApplicationMixin(
  sheets.ActorSheetV2
) {
  /**
   * ---------------------------------------
   * 1. Constructor & Static Defaults
   * ---------------------------------------
   */

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ["whq", "wqh-sheet", "actor"],
    position: { width: 600, height: 600 },
    actions: {
      roll: this._onRoll,
      initWounds: this._onInitWounds,
      toggleMode: this._onChangeSheetMode,
    },
    form: { submitOnChange: true },
    windows: {
      resizable: true,
      icon: "fa-solid fa-user",
    },
  };

  /** @override */
  static PARTS = {
    headers: {
      template: `${CONSTANT.systemPath(
        "templates/actor-sheet/header-part.hbs"
      )}`,
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs"
    },
    summary: {
      template: `${CONSTANT.systemPath(
        "templates/actor-sheet/summary-part.hbs"
      )}`
    }
  };

  /**
   * Available sheet modes
   * @enum {number}
   */
  static MODES = {
    PLAY: 1,
    EDIT: 2,
  };

  /**
   * Available tabs for the sheet.
   * @type {Array<{id: string, group: string, icon: string, label: string}>}
   */
  static TABS = [
    {
      id: "summary",
      group: "primary",
      icon: "fa-solid fa-book-user",
      label: "WHQ.TABS.ACTORS.Summary",
    },
  ];

  /**
   * ---------------------------------------
   * 2. State Variables
   * ---------------------------------------
   */
  /**
   * Reports the active tab for each group.
   *  @type {Record<string, string>}
   *  @override
   */
  tabGroups = {
    primary: "summary",
  };

  /**
   * The mode the sheet is currently in.
   * @type {WHQActorSheet.MODES}
   * @protected
   */
  _mode = this.constructor.MODES.PLAY;

  /**
   * ---------------------------------------
   * 3. State & Mode Checking
   * ---------------------------------------
   */

  // Check if the sheet is in Play mode
  get isPlayMode() {
    return this._mode === this.constructor.MODES.PLAY;
  }

  // Check if the sheet is in Edit mode
  get isEditMode() {
    return this._mode === this.constructor.MODES.EDIT;
  }

  /**
   * ---------------------------------------
   * 4. Rendering & Context Preparation
   * ---------------------------------------
   */

  /**
   * Prepare application rendering context data for a given render request.
   * @param {import("../../foundry/client-esm/applications/_types.mjs").ApplicationRenderOptions} options - Options which configure application rendering behavior
   * @returns {Promise<import("../../foundry/client-esm/applications/_types.mjs").ApplicationRenderContext>} - Context data for the render operation
   * @protected
   * @override
   */
  async _prepareContext(options) {
    const context = {
      isPlayMode: this.isPlayMode,
      editable: this.isEditable,
      owner: this.document.isOwner,
      limited: this.document.limited,
      actor: this.actor,
      system: this.actor.system,
      flags: this.actor.flags,
      config: CONFIG.WHQ,
      tabs: this._getTabs()
    };

    this._prepareAttributes(context);
    context.isWoundInit = this.actor.system.wounds.max !== null;
    return context;
  }
  /**
   * @param {import("../../foundry/client-esm/applications/_types.mjs").ApplicationRenderContext} context - Shared context provided by _prepareContext.
   */
  _prepareAttributes(context) {
    const attributes = this.actor.system.attributes;
    context.attributes = Object.keys(attributes).map((key) => ({
      label: CONFIG.WHQ.attributes[key].abrr,
      path: `system.attributes.${key}`,
      key,
      value: attributes[key],
    }));
  }
  /**
   * Prepare context that is specific to only a single rendered part.
   *
   * @param {string} partId - The part being rendered
   * @param {context} context - Shared context provided by _prepareContext
   * @returns
   */
  async _preparePartContext(partId, context) {
    switch (partId) {
      case "summary":
        context.tab = context.tabs.summary
        break;
      default:
        break;
    }
    return context;
  }

  /**
   * Prepare an array of sheet tabs.
   * @this WHQActorSheet
   * @returns {Record<string, Partial<import("../../foundry/client-esm/applications/_types.mjs").ApplicationTab>>}
   */
  _getTabs() {
    const tabs = Object.fromEntries(
      this.constructor.TABS.map((tab) => {
        const active = this.tabGroups[tab.group] === tab.id;
        return [
          tab.id,
          {
            ...tab,
            active,
            cssClass: active ? "active" : "",
          },
        ];
      })
    );
    return tabs;
  }

  /**
   * ---------------------------------------
   * 5. Event Handling & Actions
   * ---------------------------------------
   */

  /**
   *
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async _onRoll(event, target) {
    event.preventDefault();
    const { rollType } = target.dataset;
    if (rollType === "attribute") {
      await this.actor.rollAttribute(target.dataset.attribute);
    }
  }

  /**
   *
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async _onInitWounds(event, target) {
    const formula = CONFIG.WHQ.actors[this.actor.type].woundsRoll;
    const roll = await Roll.create(formula).evaluate();
    await this.actor.update({
      "system.wounds.max": roll.total,
      "system.wounds.value": roll.total,
    });
    return roll.toMessage({ flavor: "Set initial Wounds" });
  }

  /**
   * Handle the user toggling the sheet mode.
   * @param {Event} event - The triggering event.
   * @param {HTMLElement} target -
   * @protected
   */
  static async _onChangeSheetMode(event, target) {
    const { MODES } = this.constructor.MODES;

    if (!this.isEditable) {
      console.error("Cannot switch to Edit mode on an uneditable sheet");
      return;
    }

    this._mode = this.isPlayMode ? MODES.EDIT : MODES.PLAY;

    this.render();
  }
}
