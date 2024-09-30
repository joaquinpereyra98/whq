import * as dataModels from "./data/_module.mjs";
import * as docs from "./documents/_module.mjs";
import * as sheets from "./sheets/_module.mjs";
import WHQ from "./config.mjs";
import { createWHQMacro } from './documents/macro.mjs';
import WHQSocket from './socket.mjs';

Hooks.on("init", () => {
  CONFIG.WHQ = WHQ;

  CONFIG.Actor.documentClass = docs.WHQActor;
  CONFIG.Item.documentClass = docs.WHQItem;
  CONFIG.ActiveEffect.documentClass = docs.WHQEffect;
  CONFIG.ActiveEffect.legacyTransferral = false;

  CONFIG.Actor.dataModels = {
    elf: dataModels.characterModel,
    barbarian: dataModels.characterModel,
    dwarf: dataModels.characterModel,
  };
  CONFIG.Item.dataModels = {
    weapon: dataModels.weaponModel,
    armor: dataModels.armorModel,
    equipment: dataModels.equipmentModel,
    consumable: dataModels.consumableMode,
  };

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("whq", sheets.WHQActorSheet, {
    makeDefault: true,
    label: "WHQ.SheetLabels.Actor",
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("whq", sheets.WHQItemSheet, {
    makeDefault: true,
    label: "WHQ.SheetLabels.Item",
  });

  game.system.socket = new WHQSocket();
});

Hooks.on("hotbarDrop", (bar, data, slot) => {
  if ( ["Item"].includes(data.type) ) {
    createWHQMacro(data, slot)
    return false;
  }
});

Hooks.on("renderChatMessage", (message, $html, messageData) => {
  CONFIG.Item.documentClass.addChatListener(message, $html, messageData);
});