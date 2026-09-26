// Textures dessinées par code : le prototype n'a besoin d'aucune image.
// Les formes sont blanches ou grises pour être colorées ensuite avec setTint().

function draw(scene, key, w, h, paint) {
  if (scene.textures.exists(key)) return
  const g = scene.add.graphics()
  paint(g)
  g.generateTexture(key, w, h)
  g.destroy()
}

export function createTextures(scene) {
  // Bloc de bois (64×64) : ombre en bas, reflet en haut, deux veines
  draw(scene, 'block', 64, 64, (g) => {
    g.fillStyle(0xb0b0b0).fillRoundedRect(0, 0, 64, 64, 10)
    g.fillStyle(0xe8e8e8).fillRoundedRect(0, 0, 64, 56, 10)
    g.fillStyle(0xffffff).fillRoundedRect(7, 5, 50, 8, 4)
    g.lineStyle(3, 0xd0d0d0)
    g.lineBetween(12, 26, 40, 26)
    g.lineBetween(24, 40, 52, 40)
  })

  // Carte d'équipe (120×92)
  draw(scene, 'card', 120, 92, (g) => {
    g.fillStyle(0xa8a8a8).fillRoundedRect(0, 4, 120, 88, 18)
    g.fillStyle(0xffffff).fillRoundedRect(0, 0, 120, 84, 18)
  })

  draw(scene, 'disc', 60, 60, (g) => {
    g.fillStyle(0xffffff, 0.9).fillCircle(30, 30, 30)
  })

  // Castor (72×72), vu de face
  draw(scene, 'beaver', 72, 72, (g) => {
    g.fillStyle(0x5b3a1e).fillEllipse(14, 52, 26, 16) // queue
    g.lineStyle(1.5, 0x3f2812)
    g.lineBetween(6, 48, 22, 56)
    g.lineBetween(6, 56, 22, 48)
    g.fillStyle(0x8e5a2b).fillEllipse(38, 46, 38, 34) // corps
    g.fillStyle(0xc9955f).fillEllipse(40, 50, 20, 22) // ventre
    g.fillStyle(0x5b3a1e).fillEllipse(30, 64, 12, 7).fillEllipse(48, 64, 12, 7) // pattes
    g.fillStyle(0x6e4420).fillCircle(29, 10, 6).fillCircle(51, 10, 6) // oreilles
    g.fillStyle(0x9a6532).fillCircle(40, 24, 17) // tête
    g.fillStyle(0xd9a066).fillEllipse(40, 31, 18, 12) // museau
    g.fillStyle(0xffffff).fillCircle(34, 19, 4.5).fillCircle(46, 19, 4.5)
    g.fillStyle(0x1b1b1b).fillCircle(35, 20, 2.5).fillCircle(47, 20, 2.5)
    g.fillStyle(0x2c1a0e).fillEllipse(40, 27, 9, 5) // nez
    g.fillStyle(0xffffff).fillRect(36, 32, 8, 7) // dents
    g.lineStyle(1, 0xbbbbbb).lineBetween(40, 32, 40, 39)
  })
}
