import CONSTANT from "../constants.mjs";
const { api, sheets } = foundry.applications;

/**
 * Extend ActorSheet with modifications for WHQ.
 * @extends {ActorSheetV2}
 */
export default class WHQActorSheet extends api.HandlebarsApplicationMixin(
  sheets.ActorSheetV2
) {
  /**
   * ---------------------------------------
   * 1. Constructor & Static Defaults
   * ---------------------------------------
   */

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ["whq", "whq-sheet", "actor"],
    position: { width: 800, height: 600 },
    actions: {
      onEditImage: this._onEditImage,
      roll: this._onRoll,
      createDoc: this._onCreateDoc,
      deleteDoc: this._onDeleteDoc,
      useDoc: this._onUseDoc,
      editDoc: this._onEditDoc,
    },
    form: { submitOnChange: true },
    window: {
      resizable: true,
      icon: "fa-solid fa-user",
    },
  };

  /** @override */
  static PARTS = {
    //Header
    header: {
      template: CONSTANT.actorParts("header-part.hbs"),
    },
    //Attributes Fields
    attributes: {
      template: CONSTANT.actorParts("attributes-part.hbs"),
    },
    //Equipament Section
    equipament: {
      template: CONSTANT.actorParts("equipament-part.hbs"),
    },
    //Nav Bar
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
      classes: ["body-part"],
    },
    //Summary Tab
    weapons: {
      template: CONSTANT.actorParts("weapons-part.hbs"),
      classes: ["body-part"],
    },
  };

  /**
   * Available tabs for the sheet.
   * @type {Array<{id: string, group: string, icon: string, label: string}>}
   */
  static TABS = [
    {
      id: "weapons",
      group: "primary",
      icon: "fa-solid fa-sword",
      label: "WHQ.TABS.ACTORS.Weapons",
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
    primary: "weapons",
  };

  /**
   * ---------------------------------------
   * 3. Rendering & Context Preparation
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
      editable: this.isEditable,
      owner: this.document.isOwner,
      limited: this.document.limited,
      actor: this.actor,
      system: this.actor.system,
      flags: this.actor.flags,
      config: CONFIG.WHQ,
      tabs: this._getTabs(),
    };

    this._prepareAttributes(context);
    context.isWoundInit = this.actor.system.wounds.max !== null;
    return context;
  }
  /**
   * @param {import("../../foundry/client-esm/applications/_types.mjs").ApplicationRenderContext} context - Shared context provided by _prepareContext.
   */

  _prepareAttributes(context) {
    context.attributes = foundry.utils.duplicate(this.actor.system.attributes);
    for (const attribute in context.attributes) {
      context.attributes[attribute].label =
        CONFIG.WHQ.attributes[attribute].label;
    }
  }

  /**
   * Prepare context that is specific to only a single rendered part.
   *
   * @param {string} partId - The part being rendered
   * @param {import("../../foundry/client-esm/applications/_types.mjs").ApplicationRenderContext} context - Shared context provided by _prepareContext
   * @returns
   */
  async _preparePartContext(partId, context) {
    switch (partId) {
      case "weapons":
        context.tab = context.tabs.weapons;
        context.items = this.actor.itemTypes.weapon;
        break;
      case "equipament":
        context.slh = CONFIG.WHQ.silhouette;
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
   *
   * @param {import("../../foundry/client-esm/applications/_types.mjs").ApplicationRenderContext} context
   * @param {import("../../foundry/client-esm/applications/_types.mjs").ApplicationRenderOptions} options
   */
  _onFirstRender(context, options) {
    super._onFirstRender(context, options);
  
    // Helper function to create and insert a container with elements
    const createAndInsertContainer = (classList, selector, insertAfterSelector) => {
      const container = document.createElement("div");
      container.classList.add(...classList);
      container.replaceChildren(...this.element.querySelectorAll(selector));
      this.element.querySelector(insertAfterSelector).insertAdjacentElement("afterend", container);
    };
  
    // Create and insert sheet container for equipament cards
    createAndInsertContainer(
      ["sheet-container", "flex-row"], 
      '.equipament-card[data-application-part="equipament"]', 
      ".sheet-attributes"
    );
  
    // Create and insert sheet body for body parts
    createAndInsertContainer(
      ["sheet-body", "flex-col"], 
      ".body-part", 
      ".equipament-card"
    );
  }
  

  /**
   * ---------------------------------------
   * 4. Event Handling & Actions
   * ---------------------------------------
   */

  /**
   * Handle changing a Document's image.
   *
   * @this DrawSteelActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise}
   * @protected
   */
  static async _onEditImage(event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } =
      this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ??
      {};
    const fp = new FilePicker({
      current,
      type: "image",
      redirectToRoot: img ? [img] : [],
      callback: (path) => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10,
    });
    return fp.browse();
  }
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
   * Handle for create a new emebbeded document
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - The capturing HTML element which defined a [data-action= "createDoc"]
   */
  static async _onCreateDoc(event, target) {
    event.preventDefault()
    const { itemType } = target.dataset;

    let embeddedName;
    switch (itemType) {
      case "weapon":
        embeddedName = "Item"
        break;
    
      default:
        return;
    }
    await this.actor.createEmbeddedDocuments(embeddedName, [{
      name: `New ${itemType.capitalize()}`,
      type: itemType
    }])
  }
  /**
   * Handle for execute Item#use
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - The capturing HTML element which defined a [data-action= "useDoc"]
   */
  static async _onUseDoc(event, target) {
    event.preventDefault();
    const uuid = target.closest('.button-panel')?.dataset.doc;
    const doc = await fromUuid(uuid);

    await doc?.use();
  }

  /**
   * Handle for delete Documents
   * @param {PointerEvent} event 
   * @param {HTMLElement} target 
   */
  static async _onDeleteDoc(event, target) {
    event.preventDefault();
    const uuid = target.closest('.button-panel')?.dataset.doc;
    const doc = await fromUuid(uuid);

    await doc.delete()
  }

  /**
   * Handle for render app edit
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - The capturing HTML element which defined a [data-action= "editDoc"]
   */
  static async _onEditDoc(event, target) {
    event.preventDefault();
    const uuid = target.closest('.button-panel')?.dataset.doc;
    const doc = await fromUuid(uuid);
    doc.sheet.render(true)
  }
}
