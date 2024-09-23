import CONSTANT from "../constants.mjs";
import { prepareActiveEffectCategories } from "./common.mjs";
const { api, sheets } = foundry.applications;

export default class WHQItemSheet extends api.HandlebarsApplicationMixin(
  sheets.ItemSheetV2
) {
  /**
   * ---------------------------------------
   * 1. Constructor & Static Defaults
   * ---------------------------------------
   */

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ["whq", "whq-sheet", "item"],
    position: { width: 600, height: 500 },
    actions: {
      onEditImage: this._onEditImage,
      createEffect: this._onCreateEffect,
      editEffect: this._onEditEffect,
      deleteEffect: this._onDeleteEffect,
    },
    form: { submitOnChange: true },
    window: {
      resizable: true,
      icon: "fas fa-suitcase",
    },
  };

  /** @override */
  static PARTS = {
    //Header
    header: {
      template: CONSTANT.itemParts("header-part.hbs"),
    },
    //Nav Bar
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
      classes: ["body-part"],
    },
    //Description Tab:
    description: {
      template: CONSTANT.itemParts("description.hbs"),
    },
    //Details Tab:
    formula: {
      template: CONSTANT.itemParts("formula.hbs"),
    },
    //Effects Tab:
    effects: {
      template: CONSTANT.itemParts("effects.hbs"),
    },
  };
  /**
   * Available tabs for the sheet.
   * @type {Array<{id: string, group: string, icon: string, label: string}>}
   */
  static TABS = [
    {
      id: "description",
      group: "primary",
      icon: "fa-solid fa-book",
      label: "WHQ.TABS.Description",
    },
    {
      id: "formula",
      group: "primary",
      icon: "fa-solid fa-dice",
      label: "WHQ.TABS.ITEMS.Roll",
    },
    /*{
      id: "effects",
      group: "primary",
      icon: "fa-solid fa-stars",
      label: "WHQ.TABS.ITEMS.Effects",
    },*/
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
    primary: "description",
  };

  _tabs;

  /**
   * ---------------------------------------
   * 3. Rendering & Context Preparation
   * ---------------------------------------
   */

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    options.parts = ["header", "tabs", "description"];

    if (this.document.limited) return;

    switch (this.document.type) {
      case "weapon":
        options.parts.push("formula");
        break;
      case "armor":
        break;
    }

    this._tabs = options.parts;
  }

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

      item: this.item,
      system: this.item.system,
      flags: this.item.flags,
      config: CONFIG.WHQ,

      fields: this.document.schema.fields,
      systemFields: this.document.system.schema.fields,

      tabs: this._getTabs(),
    };

    return context;
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
      case "description":
        context.tab = context.tabs.description;
        context.enrichedDescription = await TextEditor.enrichHTML(
          this.document.system.description,
          {
            secrets: this.document.isOwner,
            rollData: this.document.getRollData(),
            relativeTo: this.document,
          }
        );
        break;
      case "formula":
        context.tab = context.tabs.formula;
        context.damageFormula = this.document.getDamageFormula();
        break;
      case "effects":
        context.tab = context.tabs.effects;
        context.effects = prepareActiveEffectCategories(this.document.effects);
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
    const TABS = this.constructor.TABS.filter(({id}) => this._tabs.includes(id));
    const tabs = Object.fromEntries(
      TABS.map((tab) => {
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
   * 4. Event Handling & Actions
   * ---------------------------------------
   */

  /**
   * Handle changing a Document's image.
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
   * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset
   * @this DrawSteelItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _onCreateEffect(event, target) {
    event.preventDefault();
    const aeCls = getDocumentClass("ActiveEffect");
    const { type } = target.dataset;

    const effectData = {
      name: "New Active Effect",
      origin: this.document.uuid,
      disabled: type === "inactive",
      img: "icons/svg/aura.svg",
    };

    await aeCls.create(effectData, { parent: this.item });
  }

  /**
   * Handle for deletec Activee Effects
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async _onDeleteEffect(event, target) {
    event.preventDefault();
    const uuid = target.closest(".button-panel")?.dataset.doc;
    const doc = await fromUuid(uuid);

    await doc.delete();
  }

  /**
   * Handle for render Active Effect app
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async _onEditEffect(event, target) {
    event.preventDefault();
    const uuid = target.closest(".button-panel")?.dataset.doc;
    const doc = await fromUuid(uuid);
    doc.sheet.render(true);
  }
}
