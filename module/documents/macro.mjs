/**
 *
 * @param {object} dropData - The dropped data object
 * @param {number} slot - The target hotbar slot
 */
export async function createWHQMacro(dropData, slot) {
  const itemData = await Item.implementation.fromDropData(dropData);
  if (!itemData) {
    ui.notifications.warn("You can only create macro buttons for owned Items");
    return null;
  }

  const macroData = {
    type: "script",
    scope: "actor",
    name: itemData.name,
    img: itemData.img,
    command: `if(!actor || !token) return console.warn("No selected or assigned actor could be found to target with macro.");
const item = actor.items.get("${itemData._id}");
item.use();
    `,
  };

  const macro = game.macros.find(m => {
    return (m.name === macroData.name) && (m.command === macroData.command) && m.isAuthor;
  }) || await Macro.create(macroData);
  game.user.assignHotbarMacro(macro, slot);
}
