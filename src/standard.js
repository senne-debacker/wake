// The standard boat and the standard world are the ones the player owns and uses from the start: the first of their
// lists (economy.js). A card marks its own with `standard: yes` (boats.json / worlds.json get `standard: true`); this
// moves that entry to the front. Without one the list stays as it is (the game's own boat and world come first).
export function standardFirst(list) {
  const index = list.findIndex((entry) => entry.standard)
  return index > 0 ? [list[index], ...list.slice(0, index), ...list.slice(index + 1)] : list
}
