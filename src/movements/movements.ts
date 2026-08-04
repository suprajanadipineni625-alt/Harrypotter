/**
 * The eight movements, as parameter states of ONE persistent scene.
 *
 * There are not eight scenes. There is one scene whose parameters interpolate
 * between these states as you scroll. That is simultaneously the performance
 * strategy (nothing mounts or unmounts, nothing reloads) and the structural
 * answer to "connect the parts" — the world never cuts, so the connection is
 * literal rather than decorative.
 *
 * Content and rationale: docs/CONTENT.md
 */

export interface MovementState {
  id: string
  /** Roman numeral + name, as used in the site's own navigation. */
  numeral: string
  title: string
  /** One line of intent — art direction, not copy for the page. */
  intent: string

  /** Background / void colour. */
  background: string
  /** The colour of the light you are carrying through this movement. */
  light: string
  /** Fog / atmosphere colour. */
  fog: string
  /** Fog density. Depth is most of the mood in this site. */
  fogDensity: number

  /** Bloom strength. The whole site is light, so this is the primary dial. */
  bloom: number
  /** 0 = neutral, 1 = heavily graded. */
  grade: number
  /** Vignette strength — used hard in Cold, barely in Dawn. */
  vignette: number

  /** Camera distance from origin. */
  cameraZ: number
  /** Camera height. Descent goes down; Dawn comes back up. */
  cameraY: number
}

export const MOVEMENTS: MovementState[] = [
  {
    id: 'lights',
    numeral: 'I',
    title: 'Lights in the dark',
    intent:
      'Floating candles, the twins’ fireworks, the Deluminator, wands raised at the tower. One image, four films, twelve years apart.',
    background: '#07050a',
    light: '#ffc76b',
    fog: '#120c14',
    fogDensity: 0.035,
    bloom: 0.9,
    grade: 0.25,
    vignette: 0.35,
    cameraZ: 9,
    cameraY: 0,
  },
  {
    id: 'doors',
    numeral: 'II',
    title: 'Doors',
    intent:
      'Platform nine and three quarters, the Vanishing Cabinet, the Room of Hidden Things, King’s Cross. Thresholds that cost more each time.',
    background: '#0d0a08',
    light: '#f2e4cd',
    fog: '#1a1512',
    fogDensity: 0.028,
    bloom: 0.85,
    grade: 0.2,
    vignette: 0.3,
    cameraZ: 11,
    cameraY: 0.5,
  },
  {
    id: 'web',
    numeral: 'III',
    title: 'The web',
    intent:
      'The Marauder’s Map and the Black family tapestry — the same object with opposite intent. One finds people, the other erases them.',
    background: '#0a0908',
    light: '#d9c89a',
    fog: '#141210',
    fogDensity: 0.02,
    bloom: 0.7,
    grade: 0.35,
    vignette: 0.25,
    cameraZ: 13,
    cameraY: 0,
  },
  {
    id: 'descent',
    numeral: 'IV',
    title: 'Descent',
    intent:
      'The Chamber, the second task, the cave. Down, into water, into dark. The bottom of the arc.',
    background: '#04100e',
    light: '#4fd6b0',
    fog: '#062019',
    fogDensity: 0.075,
    bloom: 0.6,
    grade: 0.7,
    vignette: 0.5,
    cameraZ: 8,
    cameraY: -3.5,
  },
  {
    id: 'cold',
    numeral: 'V',
    title: 'Cold',
    intent:
      'Dementors on the train, the Patronus, the sword beneath the ice. The turn — the first time light is something you do rather than watch.',
    background: '#03060d',
    light: '#cfe6ff',
    fog: '#081222',
    fogDensity: 0.055,
    bloom: 0.95,
    grade: 0.6,
    vignette: 0.65,
    cameraZ: 7,
    cameraY: -1,
  },
  {
    id: 'fire',
    numeral: 'VI',
    title: 'Fire',
    intent:
      'The Goblet, the Burrow burning, Fiendfyre taking the shape of animals. The only movement that is loud.',
    background: '#120500',
    light: '#ff7a2f',
    fog: '#2a0d02',
    fogDensity: 0.06,
    bloom: 1.05,
    grade: 0.55,
    vignette: 0.4,
    cameraZ: 9,
    cameraY: 0.5,
  },
  {
    id: 'quiet',
    numeral: 'VII',
    title: 'The quiet',
    intent:
      'The dance, the Tale of the Three Brothers, Shell Cottage. Ink and parchment. Almost no 3D. The breath after the war.',
    background: '#e8e2d6',
    light: '#1a1614',
    fog: '#ddd5c6',
    fogDensity: 0.012,
    bloom: 0.15,
    grade: 0.85,
    vignette: 0.15,
    cameraZ: 12,
    cameraY: 0,
  },
  {
    id: 'dawn',
    numeral: 'VIII',
    title: 'Dawn',
    intent:
      'The shield, the ash, the light returning. The last frame rhymes with the first.',
    background: '#0a0710',
    light: '#ffc76b',
    fog: '#191020',
    fogDensity: 0.03,
    bloom: 0.95,
    grade: 0.2,
    vignette: 0.2,
    cameraZ: 9,
    cameraY: 1.5,
  },
]

export const MOVEMENT_COUNT = MOVEMENTS.length
