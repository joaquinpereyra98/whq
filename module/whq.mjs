import * as dataModels from "./data/_module.mjs";

import { WHQActor } from "./documents/actor.mjs";

import { WHQActorSheet } from "./sheets/actor-sheet.mjs";

import WHQ from "./config.mjs";

Hooks.on("init", () => {
    CONFIG.WHQ = WHQ;

    CONFIG.Actor.documentClass = WHQActor;
    CONFIG.Actor.dataModels = {
        elf: dataModels.characterModel
    }

    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('whq', WHQActorSheet, {
      makeDefault: true,
      label: 'WHQ.SheetLabels.Actor',
    });

});