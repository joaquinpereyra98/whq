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

  constructor(options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
  }

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ["whq", "whq-sheet", "actor"],
    position: { width: 800, height: 600 },
    dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
    actions: {
      onEditImage: this._onEditImage,
      roll: this._onRoll,
      createDoc: this._onCreateDoc,
      deleteDoc: this._onDeleteDoc,
      useDoc: this._onUseDoc,
      editDoc: this._onEditDoc,
      initWounds: this._onInitWounds,
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
    //Equipment Section
    equipment: {
      template: CONSTANT.actorParts("equipment-part.hbs"),
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
    armors: {
      template: CONSTANT.actorParts("armors-part.hbs"),
      classes: ["body-part"],
    },
    equipments: {
      template: CONSTANT.actorParts("equipments-part.hbs"),
      classes: ["body-part"],
    },
    consumables: {
      template: CONSTANT.actorParts("consumables-part.hbs"),
      classes: ["body-part"],
    }
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
    {
      id: "armors",
      group: "primary",
      icon: "fa-solid fa-helmet-battle",
      label: "WHQ.TABS.ACTORS.Armors",
    },
    {
      id: "equipments",
      group: "primary",
      icon: "fa-solid fa-backpack",
      label: "WHQ.TABS.ACTORS.Equipments",
    },
    {
      id: "consumables",
      group: "primary",
      icon: "fa-solid fa-flask-round-potion",
      label: "WHQ.TABS.ACTORS.Consumables"
    }
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
    const system = foundry.utils.deepClone(this.actor.system);
    const attributes = system.attributes;
    const _attributes = system._source.attributes;

    context.attributes = {};
    for (const attribute in attributes) {
      context.attributes[attribute] = {
        value: _attributes[attribute].value,
        total: attributes[attribute].value,
        label: CONFIG.WHQ.attributes[attribute].label,
        modifier: attributes[attribute].modifier,
      };
    }
  }

  /**
   * Prepare context that is specific to only a single rendered part.
   *
   * @param {string} partId - The part being rendered
   * @param {import("../../foundry/client-esm/applications/_types.mjs").ApplicationRenderContext} context - Shared context provided by _prepareContext
   * @returns
   */
  _preparePartContext(partId, context) {
    switch (partId) {
      case "weapons":
        context.tab = context.tabs.weapons;
        context.items = this.actor.itemTypes.weapon;
        break;
      case "armors":
        context.tab = context.tabs.armors;
        context.items = this.actor.itemTypes.armor;
        break;
      case "equipments":
        context.tab = context.tabs.equipments;
        context.items = this.actor.itemTypes.equipment;
        break;
      case "consumables":
        context.tab = context.tabs.consumables;
        context.items = this.actor.itemTypes.consumable;
        break;
      case "equipment":
        context.slh = CONFIG.WHQ.silhouette;
        this._prepareEquipament(context);
        break;
      default:
        break;
    }

    return context;
  }

  _prepareEquipament(context) {
    const { bodyParts, ringsParts, otherParts } = this.actor.system.equipment;

    const mapSlots = (parts) =>
      Object.entries(parts).map(([key, slot]) => ({
        key,
        cssClass: `${key}-slot`,
        item: slot.item,
      }));

    const bodyEntries = mapSlots(bodyParts);
    const hands =
      bodyEntries.find((entry) => entry.key === "hands")?.item || null;

    context.bodySlots = bodyEntries.filter((entry) => entry.key !== "hands");
    context.bodySlots.push(
      { item: hands, cssClass: "left-hand-slot", key: "hands" },
      { item: hands, cssClass: "right-hand-slot", key: "hands" }
    );

    context.ringSlots = mapSlots(ringsParts);
    context.otherSlots = mapSlots(otherParts);
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
    const createAndInsertContainer = (
      classList,
      selector,
      insertAfterSelector
    ) => {
      const container = document.createElement("div");
      container.classList.add(...classList);
      container.replaceChildren(...this.element.querySelectorAll(selector));
      this.element
        .querySelector(insertAfterSelector)
        .insertAdjacentElement("afterend", container);
    };

    // Create and insert sheet container for equipment cards
    createAndInsertContainer(
      ["sheet-container", "flex-row"],
      '.equipment-card[data-application-part="equipment"]',
      ".sheet-attributes"
    );

    // Create and insert sheet body for body parts
    createAndInsertContainer(
      ["sheet-body", "flex-col"],
      ".body-part",
      ".equipment-card"
    );
  }

  /**
   * ---------------------------------------
   * 4. Drag n Drop
   * ---------------------------------------
   */

  /**
   * Obtain the embedded document from a Uuid, function for make it sync.
   *
   * @param {string} uuid  -  The uuid of the element
   * @returns {Item | ActiveEffect} The embedded Item or ActiveEffect
   */
  _getEmbeddedDocument(uuid) {
    const { embedded } = foundry.utils.parseUuid(uuid);
    const collectionName = Actor.getCollectionName(embedded[0]);
    return this.document[collectionName].get(embedded[1]);
  }
  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   * @override
   */
  _onRender(context, options) {
    this.#dragDrop.forEach((d) => d.bind(this.element));
  }

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector
   * @param {string} selector       The candidate HTML selector for dragging
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(selector) {
    return this.isEditable;
  }

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(selector) {
    return this.isEditable;
  }

  /**
   * Callback actions which occur at the beginning of a drag start workflow.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragStart(event) {
    const docContainer = event.currentTarget.closest(".item-container");
    const docUuid = docContainer?.dataset.doc;
    const doc = this._getEmbeddedDocument(docUuid);

    const initOnEquip = !!event.currentTarget.closest(".equipment-card");
    const dragData = { ...doc?.toDragData(), initOnEquip };

    if (!dragData) return;
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /**
   * Callback actions which occur when a dragged element is over a drop target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragOver(event) {}

  /**
   * Callback actions which occur when a dragged element is dropped on a target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    const actor = this.actor;
    const allowed = Hooks.call("dropActorSheetData", actor, this, data);
    if (allowed === false) return;

    // Handle different data types
    switch (data.type) {
      case "Actor":
        return this._onDropActor(event, data);
      case "Item":
        return this._onDropItem(event, data);
      case "Folder":
        return this._onDropFolder(event, data);
    }
  }

  /**
   * Handle dropping of an Actor data onto another Actor sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
   *                                     not permitted.
   * @protected
   */
  async _onDropActor(event, data) {
    return false;
  }

  /* -------------------------------------------- */

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
   * @protected
   */
  async _onDropItem(event, data) {
    if (!this.actor.isOwner) return false;
    const item = await Item.implementation.fromDropData(data);

    // Handle item within the same Actor
    if (this.actor.uuid === item.parent?.uuid) {
      const equipCard = event.target.closest(".equipment-card");

      if (equipCard && item.isEquipable) {
        const otherTypes = ["ring", "bracelet", "amulet"];

        if (otherTypes.includes(item.system.type))
          return this._onOtherEquipItem(event, item);

        return this._onBodyEquipItem(event, item);
      } else if (
        this.actor.system.equipment.ids.has(item._id) &&
        data.initOnEquip
      ) {
        return this._onUnequipItem(item);
      }
    } else {
      // Create the owned item
      return this._onDropItemCreate(item, event);
    }
  }

  /**
   * Handle dropping of a Folder on an Actor Sheet.
   * The core sheet currently supports dropping a Folder of Items to create all items as owned items.
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {object} data         The data transfer extracted from the event
   * @returns {Promise<Item[]>}
   * @protected
   */
  async _onDropFolder(event, data) {
    if (!this.actor.isOwner) return [];
    const folder = await Folder.implementation.fromDropData(data);
    if (folder.type !== "Item") return [];
    const droppedItemData = await Promise.all(
      folder.contents.map(async (item) => {
        if (!(document instanceof Item)) item = await fromUuid(item.uuid);
        return item;
      })
    );
    return this._onDropItemCreate(droppedItemData, event);
  }

  /**
   *
   * @param {DragEvent} event
   * @param {Item} item
   * @returns
   */
  async _onBodyEquipItem(event, item) {
    const { equipment } = this.document.system;
    const { bodyParts, ids } = equipment;

    // Identify the slot being interacted with
    let slot = event.target.closest(".equip-slot")?.dataset?.slot;
    const swordSlot = "sword";
    const shieldSlot = "shield";

    // Check if the item is currently equipped
    const isEquipped = ids.has(item._id);

    const shieldItem = bodyParts[shieldSlot]?.item;
    const swordItem = bodyParts[swordSlot]?.item;
    const updateData = {};

    //  Case: If the item is armor, update the item.system.type slot directly
    if (item.type === "armor" || item.type === "equipment") {
      const armorSlot = `system.equipment.bodyParts.${item.system.type}.item`;
      updateData[armorSlot] = item;
      return this.document.update(updateData);
    }

    // Case 1: Weapon is not equipped and dropped in any slot other than sword/shield
    if (!isEquipped && slot !== swordSlot && slot !== shieldSlot) {
      slot = swordSlot;
      updateData[`system.equipment.bodyParts.${slot}.item`] = item;
    }

    //Case 1.5: weapons is equipped and dropped in any slot other than sword/shield
    if (isEquipped && slot !== swordSlot && slot !== shieldSlot) {
      return;
    }

    // Case 2: Weapon equipped in sword slot and dropped in shield slot, shield slot has another weapon
    else if (
      isEquipped &&
      slot === shieldSlot &&
      shieldItem?.type === "weapon"
    ) {
      // Swap sword and shield items
      updateData[`system.equipment.bodyParts.${shieldSlot}.item`] = item;
      updateData[`system.equipment.bodyParts.${swordSlot}.item`] = shieldItem;
    }

    // Case 3: Weapon equipped in shield slot and dropped in sword slot, sword slot has another weapon
    else if (isEquipped && slot === swordSlot && swordItem?.type === "weapon") {
      // Swap sword and shield items
      updateData[`system.equipment.bodyParts.${swordSlot}.item`] = item;
      updateData[`system.equipment.bodyParts.${shieldSlot}.item`] = swordItem;
    }

    // Case 4: Weapon dropped in the shield slot
    else if (slot === shieldSlot) {
      if (isEquipped) {
        // Clear the previous equipped slot
        const previousSlot =
          swordItem?._id === item._id ? swordSlot : shieldSlot;
        updateData[`system.equipment.bodyParts.${previousSlot}.item`] = null;
      }
      updateData[`system.equipment.bodyParts.${shieldSlot}.item`] = item;
    }
    // Default case: Place the weapon in the specified slot
    else {
      updateData[`system.equipment.bodyParts.${slot}.item`] = item;
    }

    return this.document.update(updateData);
  }

  async _onOtherEquipItem(event, item) {
    const { equipment } = this.document.system;
    const { ringsParts, otherParts, ids } = equipment;

    // Identify the slot being interacted with
    let slot = event.target.closest(".equip-slot")?.dataset?.slot;

    if(!slot) {
      if(item.system.type === "ring") {
        slot = Object.keys(ringsParts).find(
          (key) => ringsParts[key].item === null
        );
      } else if(item.system.type === "bracelet") {
        slot = Object.keys(otherParts).find(
          (key) => (key.startsWith("bracelets") && otherParts[key].item === null)
        );
      } else {
        slot = "amulet";
      }
      if(!slot) return;
    }
    const isEquipped = ids.has(item._id);
    const updateData = {};

    if (item.system.type === "ring") {
      //Case 1: Ring not equiped droped on a slot empty or not.
      if (!isEquipped) {
        updateData[`system.equipment.ringsParts.${slot}.item`] = item;
      }
      //Case 2: Ring equipped droppem on other slot
      else {
        const oldSlot = Object.keys(ringsParts).find(
          (key) => ringsParts[key].item?._id === item._id
        );
        const itemOnSlot = ringsParts[slot]?.item;
        updateData[`system.equipment.ringsParts.${slot}.item`] = item;
        updateData[`system.equipment.ringsParts.${oldSlot}.item`] = itemOnSlot;
      }
    } else {
      if (item.system.type === "bracelet" && isEquipped) {
        const oldSlot = Object.keys(otherParts).find(
          (key) => otherParts[key].item?._id === item._id
        );
        const itemOnSlot = otherParts[slot]?.item;
        updateData[`system.equipment.otherParts.${slot}.item`] = item;
        updateData[`system.equipment.otherParts.${oldSlot}.item`] = itemOnSlot;
      } else updateData[`system.equipment.otherParts.${slot}.item`] = item;
    }
    return this.document.update(updateData);
  }

  async _onUnequipItem(item) {
    const { equipment } = this.document.system;
    
    const partsMap = {
      bodyParts: ["armor", "weapon", "head", "cloak", "belt"],
      ringsParts: ["ring"],
      otherParts: ["bracelet", "amulet"] // Assuming other items fall here by default
    };
  
    let part, oldSlot;
    
    // Determine which part the item belongs to
    for (let [key, types] of Object.entries(partsMap)) {
      if (types.includes(item.type) || types.includes(item.system.type)) {
        part = key;
        break;
      }
    }
    
    // Find the slot in the determined part
    const parts = equipment[part] || equipment.otherParts;
    oldSlot = Object.keys(parts).find(
      (slot) => parts[slot].item?._id === item._id
    );
  
    // Update the document to unequip the item
    return this.document.update({
      [`system.equipment.${part}.${oldSlot}.item`]: null,
    });
  }
  

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
   * @param {object[]|object} itemData      The item data requested for creation
   * @param {DragEvent} event               The concluding DragEvent which provided the drop data
   * @returns {Promise<Item[]>}
   * @private
   */
  async _onDropItemCreate(itemData, event) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return this.actor.createEmbeddedDocuments("Item", itemData);
  }

  /** The following pieces set up drag handling and are unlikely to need modification  */

  /**
   * Returns an array of DragDrop instances
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }

  // This is marked as private because there's no real need
  // for subclasses or external hooks to mess with it directly
  #dragDrop;

  /**
   * Create drag-and-drop workflow handlers for this Application
   * @returns {DragDrop[]}     An array of DragDrop handlers
   * @private
   */
  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new DragDrop(d);
    });
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
    switch (rollType) {
      case "attribute":
        const attribute = target.dataset.attribute;
        if (attribute !== "move") {
          await this.actor.rollAttribute(attribute);
        }
        break;
      default:
        break;
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
    event.preventDefault();
    const { itemType } = target.dataset;

    const embeddedName = itemType === "effect" ? "ActiveEffect" : "Item";

    await this.actor.createEmbeddedDocuments(embeddedName, [
      {
        name: `New ${itemType.capitalize()}`,
        type: itemType,
      },
    ]);
  }
  /**
   * Handle for execute Item#use
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - The capturing HTML element which defined a [data-action= "useDoc"]
   */
  static async _onUseDoc(event, target) {
    event.preventDefault();
    const uuid = target.closest(".item-containers")?.dataset.doc;
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
    const uuid = target.closest(".item-container")?.dataset.doc;
    const doc = await fromUuid(uuid);

    await doc.delete();
  }

  /**
   * Handle for render app edit
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - The capturing HTML element which defined a [data-action= "editDoc"]
   */
  static async _onEditDoc(event, target) {
    event.preventDefault();
    const uuid = target.closest(".item-container")?.dataset.doc;
    const doc = await fromUuid(uuid);
    doc.sheet.render(true);
  }
}
