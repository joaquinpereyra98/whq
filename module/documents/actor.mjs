/**
 * Extend the base Actor.
 * @extends {Actor}
 */
export class WHQActor extends Actor {
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
}
