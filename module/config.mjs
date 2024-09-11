const WHQ = {}
/**
 * Set initial values of actors
 */
WHQ.actors = {
    elf: {
        woundsRoll: "1d6+7",
        initialValues: {
            skills:{
                weapon: 4,
                ballistic: 4
            },
            stats: {
                move: 4,
                initiative: 6,
                attacks: 1
            },
            attributes: {
                strength: 3,
                toughness: 3,
            }
        }
    }
}
export default WHQ;