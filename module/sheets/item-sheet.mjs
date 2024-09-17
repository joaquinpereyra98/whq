import CONSTANT from '../constants.mjs';
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
    position: { width: 800, height: 600 },
    actions: {
        onEditImage: this._onEditImage
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
      template: CONSTANT.itemParts("description.hbs")
    },
    //Details Tab:
    details: {
      template: CONSTANT.itemParts("details.hbs")
    },
    //Effects Tab:
    effects: {
      template: CONSTANT.itemParts("effects.hbs")
    }
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
      id: "details",
      group: "primary",
      icon: "fa-solid fa-toolbox",
      label: "WHQ.TABS.ITEMS.Details",
    },
    {
      id: "effects",
      group: "primary",
      icon: "fa-solid fa-stars",
      label: "WHQ.TABS.ITEMS.Effects",
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
    primary: "description",
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

      item: this.item,
      system: this.item.system,
      flags: this.item.flags,
      config: CONFIG.WHQ,

      fields: this.document.schema.fields,
      systemFields: this.document.system.schema.fields,

      tabs: this._getTabs(),
    };

    return context;
  };

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

}
