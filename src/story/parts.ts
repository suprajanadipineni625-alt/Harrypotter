/**
 * The story, as data. Eight parts, each a sequence of scenes.
 *
 * A scene is one illustrated composition + one paragraph of prose + one scroll
 * beat. Content and reasoning: docs/STORY.md
 *
 * `art` names the procedural composition that draws the scene today. When a
 * painted illustration exists, set `image` instead — the engine reads one or
 * the other and nothing else changes. See story/Layer.tsx.
 */

export type ArtKind =
  | 'letters'
  | 'platform'
  | 'greathall'
  | 'chess'
  | 'mirror'
  | 'castle'
  | 'corridor'
  | 'chamber'
  | 'train'
  | 'lake'
  | 'graveyard'
  | 'prophecy'
  | 'cave'
  | 'tower'
  | 'tent'
  | 'ice'
  | 'brothers'
  | 'gringotts'
  | 'fiendfyre'
  | 'battle'
  | 'forest'
  | 'kingscross'
  | 'dawn'

export interface Scene {
  id: string
  /** Display heading. Short. */
  title: string
  /** One paragraph. This is the narrative, not a caption. */
  prose: string
  /** Which procedural composition draws this scene. */
  art: ArtKind
  /**
   * Painted illustration, when one exists. Takes precedence over `art`.
   * Three layers back-to-front, so the parallax survives the swap.
   */
  image?: { back: string; mid: string; fore: string }
  /** Set when this scene destroys a Horcrux. 1-7, in destruction order. */
  horcrux?: number
  /**
   * True for scenes drawn on a LIGHT ground — King's Cross, the parchment of
   * the Three Brothers. The reading layer is cream on dark everywhere else, so
   * without this the text and the Horcrux counter vanish completely on exactly
   * the two scenes that invert.
   */
  light?: boolean
}

export interface Part {
  n: number
  title: string
  subtitle: string
  /** The part's dominant palette. Drives fog, light and grade. */
  background: string
  ink: string
  accent: string
  scenes: Scene[]
}

export const PARTS: Part[] = [
  {
    n: 1,
    title: 'The Philosopher’s Stone',
    subtitle: 'Wonder. Everything is new.',
    background: '#0b1a2a',
    ink: '#e8dfc8',
    accent: '#e8a33d',
    scenes: [
      {
        id: 'castle',
        title: 'The castle',
        prose:
          'It stands on a crag above a black loch, and it has stood there for a thousand years. Every window you can see belongs to somebody. The story that follows takes seven years, and it begins with a boy who does not know the place exists.',
        art: 'castle',
        image: { back: 'scenes/castle.webp', mid: '', fore: '' },
      },
      {
        id: 'letters',
        title: 'The letters',
        prose:
          'They came one at a time, and then in dozens, and then in a flood — through the letterbox, down the chimney, under the door, until the room was a storm of paper and every envelope carried the same name. Somebody, somewhere, had been keeping count of him after all.',
        art: 'letters',
        image: { back: 'scenes/letters.webp', mid: '', fore: '' },
      },
      {
        id: 'platform',
        title: 'Platform nine and three quarters',
        prose:
          'The barrier looked like brick and behaved like water. On the other side a scarlet engine breathed steam over a crowd of trunks and owls, and the ordinary world closed quietly behind him.',
        art: 'platform',
        image: { back: 'scenes/platform.webp', mid: '', fore: '' },
      },
      {
        id: 'sorting',
        title: 'The Sorting',
        prose:
          'Candles hung in the air without strings. Four tables ran the length of the hall in four colours, and an old hat considered him for rather longer than it had considered anybody else before it decided where he belonged.',
        art: 'greathall',
        image: { back: 'scenes/sorting.webp', mid: '', fore: '' },
      },
      {
        id: 'chess',
        title: 'The chess game',
        prose:
          'The board was the size of the room and the pieces did not pretend to be gentle. Winning required somebody to be taken, and the boy who had been afraid of everything all year worked out the move and then made it himself.',
        art: 'chess',
        image: { back: 'scenes/chess.webp', mid: '', fore: '' },
      },
      {
        id: 'mirror',
        title: 'The mirror',
        prose:
          'It showed him a family he had never met, standing behind him with their hands on his shoulders. The trap was not the glass. The trap was how long a person could stand there.',
        art: 'mirror',
        image: { back: 'scenes/mirror.webp', mid: '', fore: '' },
      },
    ],
  },
  {
    n: 2,
    title: 'The Chamber of Secrets',
    subtitle: 'The first Horcrux, though nobody knows the word yet.',
    background: '#0a1410',
    ink: '#dfe6d8',
    accent: '#4f9e6a',
    scenes: [
      {
        id: 'car',
        title: 'The flying car',
        prose:
          'They went north above the clouds in a car that had no business leaving the ground, and for a few hours the rules of the world were negotiable.',
        art: 'castle',
        image: { back: 'scenes/car.webp', mid: '', fore: '' },
      },
      {
        id: 'writing',
        title: 'The writing on the wall',
        prose:
          'Torchlight, wet stone, and a sentence written high enough that somebody had to have been lifted to write it. The water on the floor had not been there that morning.',
        art: 'corridor',
        image: { back: 'scenes/writing.webp', mid: '', fore: '' },
      },
      {
        id: 'diary',
        title: 'The diary',
        prose:
          'The page drank the ink and gave it back as an answer. It was polite. It was patient. It had been waiting fifty years for somebody to write in it.',
        art: 'corridor',
        image: { back: 'scenes/diary.webp', mid: '', fore: '' },
      },
      {
        id: 'chamber',
        title: 'The Chamber',
        prose:
          'Stone serpents the height of houses, green water, and something enormous moving just outside the reach of the light.',
        art: 'chamber',
        image: { back: 'scenes/chamber.webp', mid: '', fore: '' },
      },
      {
        id: 'fang',
        title: 'The fang',
        prose:
          'He drove the tooth through the cover and the book screamed, and ink came out of it like blood, and the boy in the memory came apart mid-sentence. Nobody understood yet that this was the first of seven.',
        art: 'chamber',
        image: { back: 'scenes/fang.webp', mid: '', fore: '' },
        horcrux: 1,
      },
    ],
  },
  {
    n: 3,
    title: 'The Prisoner of Azkaban',
    subtitle: 'The first time light is something you cast.',
    background: '#0a0f1c',
    ink: '#dce8f5',
    accent: '#8fb6e0',
    scenes: [
      {
        id: 'dementors',
        title: 'Dementors on the train',
        prose:
          'The lamps went out one by one and frost crawled up the inside of the window. Cold is not the absence of heat. Cold is a thing that arrives, and leans in, and takes.',
        art: 'train',
      },
      {
        id: 'map',
        title: 'The map',
        prose:
          'Ink footprints crossed the parchment in real time, each pair labelled, none of them lying — including one pair that had been dead for twelve years.',
        art: 'corridor',
      },
      {
        id: 'buckbeak',
        title: 'Over the lake',
        prose:
          'The ground dropped away and the lake turned into a sheet of hammered metal, and for ninety seconds nothing in his life was chasing him.',
        art: 'lake',
      },
      {
        id: 'patronus',
        title: 'The Patronus',
        prose:
          'You need a memory, and it has to be a real one, and it has to be strong enough to spend. What comes out is not a shield. It is the opposite of what is coming for you, given shape.',
        art: 'lake',
        image: { back: 'scenes/patronus.webp', mid: '', fore: '' },
      },
      {
        id: 'timeturner',
        title: 'The Time-Turner',
        prose:
          'They lived the same three hours twice and learned the worst lesson available at thirteen: it had already happened this way, and they had already been the reason.',
        art: 'lake',
      },
    ],
  },
  {
    n: 4,
    title: 'The Goblet of Fire',
    subtitle: 'It stops being school.',
    background: '#1a0e06',
    ink: '#f0e0c8',
    accent: '#e07a2f',
    scenes: [
      {
        id: 'goblet',
        title: 'The Goblet',
        prose:
          'Blue flame, three names, and then a fourth that nobody had put in and everybody blamed him for.',
        art: 'greathall',
      },
      {
        id: 'dragon',
        title: 'The dragon',
        prose:
          'It came off its chain and over the roofs and the whole castle went past underneath at a speed he had no plan for.',
        art: 'castle',
      },
      {
        id: 'lake4',
        title: 'The second task',
        prose:
          'Down where the surface light gave out, everything was the same colour and every shape was a guess. An hour to find what he had lost, and no way to breathe while looking.',
        art: 'lake',
      },
      {
        id: 'maze',
        title: 'The maze',
        prose:
          'The hedges moved when nobody watched them and the cup was at the centre, and both of them reached it, and both of them took it.',
        art: 'forest',
      },
      {
        id: 'graveyard',
        title: 'The graveyard',
        prose:
          'Bone, flesh, blood. A thin man stepped out of a cauldron into a circle of people who had been pretending for fourteen years, and the war restarted in a field full of graves.',
        art: 'graveyard',
      },
    ],
  },
  {
    n: 5,
    title: 'The Order of the Phoenix',
    subtitle: 'The enemy is inside, and it has a clipboard.',
    background: '#140b14',
    ink: '#eadfe8',
    accent: '#c25b8e',
    scenes: [
      {
        id: 'quill',
        title: 'The quill',
        prose:
          'No ink. It took what it needed from the hand that held it, and the words stayed there afterwards, and everyone in authority found reasons not to look.',
        art: 'corridor',
      },
      {
        id: 'da',
        title: "Dumbledore's Army",
        prose:
          'A room that only appears when you need it badly enough, filled with people learning the things they had been forbidden to learn.',
        art: 'greathall',
      },
      {
        id: 'prophecy',
        title: 'The Hall of Prophecy',
        prose:
          'Shelves running away into the dark in every direction, each one holding a small glass sphere, each sphere holding somebody’s whole life said out loud once.',
        art: 'prophecy',
        image: { back: 'scenes/prophecy.webp', mid: '', fore: '' },
      },
      {
        id: 'shatter',
        title: 'The shatter',
        prose:
          'They went down together — thousands of them — and every voice spoke at once and none of them could be heard.',
        art: 'prophecy',
        image: { back: 'scenes/shatter.webp', mid: '', fore: '' },
      },
      {
        id: 'veil',
        title: 'The veil',
        prose:
          'He was laughing, and then he was falling, and then there was only a curtain moving in a room with no wind in it.',
        art: 'prophecy',
      },
    ],
  },
  {
    n: 6,
    title: 'The Half-Blood Prince',
    subtitle: 'The hunt begins in earnest.',
    background: '#0a1512',
    ink: '#d8e4dd',
    accent: '#3f8f74',
    scenes: [
      {
        id: 'book',
        title: "The Prince's book",
        prose:
          'Somebody had been here before him, correcting the text in a cramped hand, and the corrections were better than the book. The name in the front meant nothing to him yet.',
        art: 'corridor',
      },
      {
        id: 'memory',
        title: 'The memory',
        prose:
          'Silver, drawn out of a temple on a wand-tip, unwinding into a basin — a conversation an old man had spent fifty years wishing he had refused to have.',
        art: 'cave',
      },
      {
        id: 'cave',
        title: 'The cave',
        prose:
          'Black water, a ring of green fire, and a basin that had to be emptied by somebody willing to keep drinking. Hands came out of the lake when the light went down.',
        art: 'cave',
        image: { back: 'scenes/cave.webp', mid: '', fore: '' },
      },
      {
        id: 'towerfall',
        title: 'The tower',
        prose:
          'Green light, and the oldest and safest thing in his world went over the parapet, and the school below did not yet know that the year had ended.',
        art: 'tower',
      },
      {
        id: 'ring',
        title: 'The ring',
        prose:
          'The blackened hand had been an answer all along. One had been destroyed before any of them knew there was a list. Two of seven.',
        art: 'tower',
        horcrux: 2,
      },
    ],
  },
  {
    n: 7,
    title: 'The Deathly Hallows: Part One',
    subtitle: 'Nowhere to go home to.',
    background: '#101216',
    ink: '#dcdcd6',
    accent: '#9aa6a0',
    scenes: [
      {
        id: 'grimmauld',
        title: 'The empty house',
        prose:
          'Dust sheets, a stopped clock, and a family tree on the wall with holes burnt through it where the family had disagreed with itself.',
        art: 'corridor',
      },
      {
        id: 'tent',
        title: 'On the run',
        prose:
          'A tent in a different wilderness every night, three people who had run out of plan, and a radio listing the names of the missing.',
        art: 'tent',
      },
      {
        id: 'locket',
        title: 'The locket',
        prose:
          'They took turns wearing it, and it made each of them worse, and it was very good at knowing exactly what each of them was most afraid of being true.',
        art: 'tent',
      },
      {
        id: 'ice',
        title: 'The frozen lake',
        prose:
          'Silver light under a foot of ice, in a wood in the middle of nowhere, put there by somebody who had never once been thanked.',
        art: 'ice',
      },
      {
        id: 'sword',
        title: 'The sword',
        prose:
          'It fought back. It showed him every fear he had and made them speak, and he brought the blade down anyway. Three of seven.',
        art: 'ice',
        horcrux: 3,
      },
      {
        id: 'brothers',
        title: 'The Tale of the Three Brothers',
        prose:
          'Three men, a river, and a bargain with something that does not bargain. Only one of them understood what he had been given, and he was the one who gave it back.',
        art: 'brothers',
        light: true,
      },
      {
        id: 'dobby',
        title: 'Shell Cottage',
        prose:
          'A grave dug by hand, above a bright cold beach, for someone who had come when called and had not been anybody’s to command.',
        art: 'dawn',
      },
    ],
  },
  {
    n: 8,
    title: 'The Deathly Hallows: Part Two',
    subtitle: 'Everything at once, and then everything gone.',
    background: '#120a10',
    ink: '#f2e9dc',
    accent: '#e8a33d',
    scenes: [
      {
        id: 'gringotts',
        title: 'Gringotts',
        prose:
          'Down, and further down, into a vault where everything multiplied when touched — and out through the roof on the back of something that had been chained in the dark so long it had gone white. Four of seven.',
        art: 'gringotts',
        horcrux: 4,
      },
      {
        id: 'diadem',
        title: 'The Room of Requirement',
        prose:
          'Cursed fire took the shape of animals and ate the room and everything hidden in it, including a crown nobody had seen for a thousand years. Five of seven.',
        art: 'fiendfyre',
        horcrux: 5,
      },
      {
        id: 'shield',
        title: 'The shield',
        prose:
          'Every teacher in the school put their wand up at once and a dome of light closed over the castle, and for one minute it looked like it might be enough.',
        art: 'battle',
      },
      {
        id: 'battle',
        title: 'Everything gone',
        prose:
          'The hall where he had been sorted had no roof. The courtyard was full of pieces of the people who had been standing in it. Seven years of a place he had called home, taken apart in a night.',
        art: 'battle',
      },
      {
        id: 'memories',
        title: "Snape's memories",
        prose:
          'Silver again, and in four minutes the entire story rearranged itself behind him: every cruelty a cover, every year of it deliberate, and a doe made of light that had always been somebody else’s.',
        art: 'cave',
      },
      {
        id: 'forest',
        title: 'The forest',
        prose:
          'He walked to it on purpose, with the dead beside him and the stone falling out of his hand, and let it happen — because the last piece of the thing he was hunting had been living behind his own eyes since he was one year old. Seven of seven.',
        art: 'forest',
        horcrux: 7,
      },
      {
        id: 'kingscross',
        title: "King's Cross",
        prose:
          'White, in every direction, and a choice about whether to get back on the train.',
        art: 'kingscross',
        image: { back: 'scenes/kingscross.webp', mid: '', fore: '' },
        light: true,
      },
      {
        id: 'lastmove',
        title: 'The last move',
        prose:
          'The boy nobody had picked for anything pulled a sword out of a hat and took the snake’s head off in one stroke — out of order, last but numbered sixth, which is exactly how the important things arrive. Six of seven.',
        art: 'battle',
        horcrux: 6,
      },
      {
        id: 'dawn',
        title: 'Dawn',
        prose:
          'First light on a broken castle, and a wand that had never really been his, and the extraordinary ordinary business of a morning that was allowed to happen.',
        art: 'dawn',
        image: { back: 'scenes/dawn.webp', mid: '', fore: '' },
      },
    ],
  },
]

/** Flat list of every scene, with its part, in reading order. */
export const SCENES = PARTS.flatMap((part) =>
  part.scenes.map((scene) => ({ part, scene })),
)

export const SCENE_COUNT = SCENES.length
export const HORCRUX_TOTAL = 7
