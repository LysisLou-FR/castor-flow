// Palette, difficultés et niveaux du jeu.
// Les niveaux sont dans levels.json, édités avec le map builder (npm run builder).
// Chaque niveau est un pixel art : une lettre = une couleur, "." = case vide.
// La ligne du haut est la première du tableau ; les castors construisent de bas en haut.
import levels from './levels.json' with { type: 'json' }

export const PALETTE = {
  R: 0xff5d62, // rouge corail
  P: 0xff9fcf, // rose
  O: 0xffa33d, // orange
  Y: 0xffd747, // jaune
  G: 0x5ccf7b, // vert
  B: 0x4ba6ff, // bleu
  W: 0xf6f2ea, // blanc cassé
  K: 0x3d4260, // encre
  N: 0x9d6a43, // brun
  T: 0xe6b988, // beige
}

/**
 * Difficultés. Le mélange des équipes (`shuffle`) rend l'ordre d'arrivée moins favorable :
 * `passes` passages, chaque équipe a `chance` d'être échangée avec une équipe jusqu'à `reach` places plus loin.
 * `reward` multiplie les noisettes gagnées ; `defaults` pré-remplit un nouveau niveau dans l'éditeur.
 */
export const DIFFICULTIES = {
  normal: {
    label: 'Normal',
    reward: 1,
    shuffle: { passes: 1, chance: 0.35, reach: 1 },
    defaults: { crewSize: 6, queues: 3, slots: 5 },
  },
  hard: {
    label: 'Hard',
    reward: 2,
    shuffle: { passes: 2, chance: 0.5, reach: 2 },
    defaults: { crewSize: 5, queues: 3, slots: 5 },
  },
  superhard: {
    label: 'Super hard',
    reward: 3,
    shuffle: { passes: 3, chance: 0.65, reach: 3 },
    defaults: { crewSize: 5, queues: 4, slots: 5 },
  },
}

export const LEVELS = levels
