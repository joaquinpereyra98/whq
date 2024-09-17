const CONSTANT = {}

CONSTANT.systemID = 'whq';
CONSTANT.systemPath = (path = '')=> `systems/${CONSTANT.systemID}/${path}`;

CONSTANT.actorParts = (file = '') => CONSTANT.systemPath(`templates/actor-sheet/parts/${file}`);
CONSTANT.itemParts = (file = '') => CONSTANT.systemPath(`templates/item-sheet/parts/${file}`);

export default CONSTANT;