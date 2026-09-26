// Chaque niveau est un pixel art : une lettre = une couleur, "." = case vide.
// La ligne du haut est la première du tableau ; les castors construisent de bas en haut.

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

export const LEVELS = [
  {
    name: 'Cœur',
    crewSize: 6,
    queues: 2,
    slots: 4,
    art: [
      '.RR...RR.',
      'RPRR.RRRR',
      'RPRRRRRRR',
      'RRRRRRRRR',
      '.RRRRRRR.',
      '..RRRRR..',
      '...RRR...',
      '....R....',
    ],
  },
  {
    name: 'Champignon',
    crewSize: 6,
    queues: 3,
    slots: 5,
    art: [
      '...RRRR...',
      '.RRWWRRRR.',
      'RRRWWRRWWR',
      'RRRRRRRWWR',
      'RWWRRRRRRR',
      'RWWRRRRRRR',
      '..WWWWWW..',
      '..WKWWKW..',
      '..WWWWWW..',
      '...WWWW...',
    ],
  },
  {
    name: 'Sapin',
    crewSize: 5,
    queues: 3,
    slots: 5,
    art: [
      '....Y....',
      '....G....',
      '...GGG...',
      '..GGRGG..',
      '...GGG...',
      '..GGGGG..',
      '.GGYGGRG.',
      '..GGGGG..',
      '.GGGGGGG.',
      'GRGGGGYGG',
      '....N....',
      '....N....',
    ],
  },
  {
    name: 'Maison',
    crewSize: 6,
    queues: 3,
    slots: 5,
    art: [
      '.....R.....',
      '....RRR....',
      '...RRRRR...',
      '..RRRRRRR..',
      '.RRRRRRRRR.',
      'RRRRRRRRRRR',
      '.WWWWWWWWW.',
      '.WBBWWWBBW.',
      '.WBBWWWBBW.',
      '.WWWWNNWWW.',
      '.WWWWNNWWW.',
      'GGGGGGGGGGG',
    ],
  },
  {
    name: 'Castor',
    crewSize: 7,
    queues: 3,
    slots: 5,
    art: [
      '..NN....NN..',
      '.NNNNNNNNNN.',
      'NNNNNNNNNNNN',
      'NNWKNNNNWKNN',
      'NNKKNNNNKKNN',
      'NNNNNNNNNNNN',
      'NNNNTTTTNNNN',
      'NNNTTKKTTNNN',
      '.NNTTTTTTNN.',
      '..NNNWWNNN..',
      '...NNWWNN...',
      '....NNNN....',
    ],
  },
  {
    name: 'Arc-en-ciel',
    crewSize: 5,
    queues: 4,
    slots: 5,
    art: [
      '....RRRRRR....',
      '..RROOOOOORR..',
      '.ROOYYYYYYOOR.',
      'ROYYGGGGGGYYOR',
      'OYGGBBBBBBGGYO',
      'YGBB......BBGY',
      'GB..........BG',
      'B............B',
    ],
  },
]
