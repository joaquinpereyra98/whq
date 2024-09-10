const { api, sheets } = foundry.applications;

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheetV2}
 */
export class WHQActorSheet extends api.HandlebarsApplicationMixin(
  sheets.ActorSheetV2
) {}
