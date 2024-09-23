export default class WHQActiveEffect extends ActiveEffect {
/**
   * Is there some system logic that makes this active effect ineligible for application?
   * @type {boolean}
   */
  get isSuppressed() {
    if(this.parent instanceof Item){
        if(this.parent.isEquipable) return !this.parent.isEquipped;
        if(this.parent.isConsumable) return true;
    }
    return false;
  }
}