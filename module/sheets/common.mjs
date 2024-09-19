/**
 * Prepare the data structure for Active Effects which are currently embedded in an Actor or Item.
 * @param {ActiveEffect[]} effects    A collection or generator of Active Effect documents to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects) {
    // Define effect header categories
    const categories = {
      active: {
        type: "active",
        label: "Active Effects",
        effects: []
      },
      inactive: {
        type: "inactive",
        label: "Inactive Effects",
        effects: []
      }
    };
  
    // Iterate over active effects, classifying them into categories
    for (const e of effects) {
      if (e.disabled) categories.inactive.effects.push(e);
      else categories.active.effects.push(e);
    }
  
    // Sort each category
    for (const c of Object.values(categories)) {
      c.effects.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    }
    return categories;
  }