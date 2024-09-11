const WHQ = {}
/**
 * @typedef {Object} ActorConfig
 * @property {string} woundsRoll             - Wounds roll formula.
 * @property {boolean} autopining            - Auto-pinning setting.
 * @property {CharacterData} initialValues - Initial values of the actor.
 */

/**
 * @type {{ elf: ActorConfig }}
 */

WHQ.actors = {
    elf: {
        woundsRoll: "1d6+7",
        autopining: true,
        initialValues: {
            skills: {
                ballistic: 4,
                weapon: 4,
            },
            move: 4,
            initiative: 6,
            attributes: {
                attacks: 1,
                pin: 0,
                strength: 3,
                toughness: 3,
                willpower: 2
            }
        }
    }
}
export default WHQ;