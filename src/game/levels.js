// Chaque niveau est un pixel art : une lettre = une couleur, "." = case vide.
// La ligne du haut est la première du tableau ; les castors construisent de bas en haut.

export const PALETTE = {
  R: 0xe74c3c, // rouge
  P: 0xff8fc0, // rose
  O: 0xf39c12, // orange
  Y: 0xf7d046, // jaune
  G: 0x2ecc71, // vert
  B: 0x3498db, // bleu
  W: 0xf4f1ea, // blanc
  K: 0x2c3e50, // noir
  N: 0x8e5a2b, // brun
  T: 0xd9a066, // beige
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
