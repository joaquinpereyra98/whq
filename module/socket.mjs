import CONSTANT from "./constants.mjs";

export default class WHQSocket {
  constructor() {
    this.identifier = `system.${CONSTANT.systemID}`;
    this._registerSocket();
  }

  _registerSocket() {
    console.log(this.identifier)
    game.socket.on(this.identifier, ({ type, payload, userTargetID }) => {
      if (userTargetID && game.userId !== userTargetID) return;

      console.log(
        `WHQ | Receive Socket ${this.identifier}.${type} emit by ${game}`
      );

      this._handleEvent(type, payload);
    });
  }

  /**
   * Emits a socket event with the specified type and payload.
   * @param {string} type - The type of socket event.
   * @param {object} payload - The data to send with the event.
   * @param {string} [userTargetID] - The optional ID of the target user.
   */
  emit(type, payload, userTargetID) {
    console.log(`WHQ | Emit Socket ${this.identifier}.${type}`);
    game.socket.emit(this.identifier, { type, payload, userTargetID }, game.userId);
  }

  /**
   * Emits an event for the GM or handles it locally if the current user is the GM.
   * @param {string} type - The type of socket event.
   * @param {object} payload - The data to send with the event.
   */
  emitForGM(type, payload) {
    const gmId = game.users.activeGM?.id;
    if (game.user.isGM) {
      this._handleEvent(type, payload);
    } else if (gmId) {
      this.emit(type, payload, gmId);
    }
  }

  /**
   * Handles the different types of socket events based on the type.
   * @param {string} type - The type of socket event.
   * @param {object} payload - The data associated with the event.
   * @protected
   */
  _handleEvent(type, payload) {
    const { applyDamage } = CONSTANT.socketTypes;
    switch (type) {
      case applyDamage:
        this.applyDamage(payload);
        break;
      default:
        throw new Error("Unknown socket type");
    }
  }

  /**
   *
   * @param {object} data
   * @param {string} data.actorUuid - UUID of the actor who applied the damage
   * @param {number} data.damage - the value of the damage
   * @returns
   */
  async applyDamage(data) {
    const actor = await fromUuid(data.actorUuid)
    await actor.applyDamage(data.damage)
  }
}
