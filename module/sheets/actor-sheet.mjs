import CONSTANT from '../constants.mjs';
const { api, sheets } = foundry.applications;

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheetV2}
 */
export class WHQActorSheet extends api.HandlebarsApplicationMixin(
  sheets.ActorSheetV2
) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['whq', 'wqh-sheet', 'actor'],
    position: {
      width: 600,
      height: 600,
    },
    actions: {
    },
    form: {
      submitOnChange: true,
    },
  };

  static PARTS = {
    headers: { 
      template: 'systems/whq/templates/actor-sheet/header-part.hbs'
    }
  }
  async _prepareContext(options) {
    const context = {
      editable: this.isEditable,
      owner: this.document.isOwner,
      limited: this.document.limited,

      actor: this.actor,
      system: this.actor.system,
      flags: this.actor.flags,

      config: CONFIG.WHQ,
    };

    return context;
  }
}
