import * as dataModels from "./data/_module.mjs";

import * as docs from "./documents/_module.mjs"

import * as sheets from "./sheets/_module.mjs";

import WHQ from "./config.mjs";

Hooks.on("init", () => {
    CONFIG.WHQ = WHQ;

    CONFIG.Actor.documentClass = docs.WHQActor;
    CONFIG.Item.documentClass = docs.WHQItem;
    CONFIG.ActiveEffect.documentClass = docs.WHQEffect;
    CONFIG.ActiveEffect.legacyTransferral = false;
    
    CONFIG.Actor.dataModels = {
        elf: dataModels.characterModel
    }
    CONFIG.Item.dataModels = {
      weapon: dataModels.weaponModel,
      armor: dataModels.armorModel,
      equipment: dataModels.equipmentModel,
      consumable: dataModels.consumableMode
    }

    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('whq', sheets.WHQActorSheet, {
      makeDefault: true,
      label: 'WHQ.SheetLabels.Actor',
    });

    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet('whq', sheets.WHQItemSheet, {
      makeDefault: true,
      label: 'WHQ.SheetLabels.Item'
    })

});