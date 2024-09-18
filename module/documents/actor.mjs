/**
 * Extend the base Actor.
 * @extends {Actor}
 */
export default class WHQActor extends Actor {
  getRollData() {
    const system = this.system;
    const data = {
      ...super.getRollData(),
      ...system.getRollData(),
      name: this.name,
      flags: this.flags,
    };
    return data;
  }

  async rollAttribute(attrKey){
    const attribute = this.system.attributes[attrKey];
    const r = await Roll.create(`1d6 + ${attribute}`).evaluate()
    const flavor =`${game.i18n.localize(CONFIG.WHQ.attributes[attrKey].name)} Attribute Roll`
    await r.toMessage({flavor});
  }
  getCombatTable(){
    return [2,3,3,4,4,4,4,4,5,5];
  }
}
