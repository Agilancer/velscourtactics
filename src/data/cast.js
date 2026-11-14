// Everyone in and around Herrington Hollow, and what they say.
// Voice: grim, wry, warm. Nobody delivers lore; they complain, boast, joke and worry, and it leaks out.
// The V and T rule holds here as in bm: no line names both of them, and nothing of the one stands by the other.

// People who can walk with you. `cls` is a key of CLASSES; `g` is the model's build ('m' | 'f').
export const HEROES = {
  lisandra: {
    name: 'Lisandra', title: 'late of a cave up the Long Road', cls: 'doorkeeper', g: 'f', model: 'lisandra',
    ask: 'You want me in the line? I’m three hundred years old and I slept in a hedge. ...Go on, then.',
    join: 'Keep your distance from the dead and your opinions to yourself, and we’ll get on.',
    barks: ['I’ve a few old tricks left.', 'They don’t read prophecies. Hit them.', 'Slow down! Some of us just lost a cave.'],
    win: ['Well. You’ll do. You’ll do very nicely.', 'They stayed down. I do like it when they stay down.'],
  },
  homunculus: {
    name: 'Homunculus the Proud', title: 'Blacksmith · Paladin', cls: 'paladin', g: 'm', model: 'homunculus',
    ask: 'Halt. You seek a Paladin of the Light? You have found the only one in forty roofs. Dusty! Mind Gertrude.',
    join: 'Hammer and faith will see to the rest. Mostly hammer.',
    barks: ['I smote a rat with the Light this morning.', 'Regional variation! Hollow Light is green.', 'Never trust a corpse that smiles.'],
    win: ['Come home. That’s the whole trick.', 'The Light provides. Also I hit it very hard.'],
  },
  lily: {
    name: 'Lily Belle the Veiled', title: 'Enchanter', cls: 'arcane_sorcerer', g: 'f', model: 'lily',
    ask: 'Walk into the pines with you? Magic is merely a negotiation. So, it seems, am I.',
    join: 'Let us renegotiate the dead.',
    barks: ['The stars have an opinion. It is not flattering to them.', 'Hold still. I am charting you.'],
    win: ['A satisfactory constellation.', 'I enchanted a spoon once. This went better.'],
  },
  jamie: {
    name: 'Jamie the Curator', title: 'Jeweler', cls: 'boomerang_knight', g: 'm', model: 'jamie',
    ask: 'A socket is a promise, and so is this. Brother Anselm can mind the bench. He’ll sulk.',
    join: 'Everything I throw comes back. I’m a curator. I keep things.',
    barks: ['Careful with that one, it’s an antique. So is that one. They all are.', 'I’ll want those teeth back for the collection.'],
    win: ['Catalogued.', 'Put it in the ledger: one more, returned to the ground.'],
  },
  stevie: {
    name: 'Stevie the Stronger', title: 'Armorer', cls: 'lancer', g: 'f', model: 'stevie',
    ask: 'The dead hit hard out there. You’ll want something thicker than hope. That’d be me.',
    join: 'Stand behind the shield. No, behind. That’s beside.',
    barks: ['My helmet’s dented. So was its last owner.', 'Behind the shield!'],
    win: ['Not a scratch. On me, I mean.', 'Lifted a cart this morning. This was lighter.'],
  },
  // eight who are waiting around the Hollow for somebody to follow
  wren: { name: 'Wren Ashgrove', title: 'The Last Arrow of Ashgrove', cls: 'ranger', g: 'f',
    ask: 'Ashgrove’s gone. I’ve arrows left and nowhere to be. Tally stands at zero. Enjoy it.', join: 'I’ll take the ones at the back.',
    barks: ['Did anything follow us? Turn round. Look properly.'], win: ['Tally stands at more than zero.'] },
  ismene: { name: 'Ismene Starquill', title: 'Archmage of the Ember Chair', cls: 'wizard', g: 'f',
    ask: 'Nobody has been born with magic in two hundred years. I had to learn mine out of books. I am therefore better at it.', join: 'Stand clear of the bright part.',
    barks: ['Stand clear of the bright part.'], win: ['Cite me.'] },
  mortimer: { name: 'Mortimer Vael', title: 'The Courteous Undertaker', cls: 'necromancer', g: 'm',
    ask: 'The dead of the Hollow are my clients. Somebody has stood them up without asking. I take that personally.', join: 'After you. I insist.',
    barks: ['Do excuse me.', 'Nine coffins in the yard and none of them staying shut.'], win: ['Rest now. Properly, this time.'] },
  brakka: { name: 'Brakka Ironhide', title: 'Breaker of the Northern Gate', cls: 'barbarian', g: 'f',
    ask: 'You talk a lot. Is there fighting at the end of it?', join: 'Good. Point.',
    barks: ['HA!', 'More. MORE.'], win: ['That was a small one.'] },
  kestrel: { name: 'Kestrel Varn', title: 'The Skyhook', cls: 'dragoon', g: 'm',
    ask: 'I can see the whole wood from up there. It’s worse than you think. I’m in.', join: 'I’ll be above you. Don’t look up.',
    barks: ['Coming down!'], win: ['Stuck the landing.'] },
  maudlin: { name: 'Grandmother Maudlin Crowe', title: 'Mother of a Thousand Crows', cls: 'carrion_witch', g: 'f',
    ask: 'The crows sit on the barn in rows now. Rows is for waiting. I’m done waiting, dearie.', join: 'Mind the birds. They’re hungry and they’re not fussy.',
    barks: ['That one was Shiny. That one was Crying. That one was Gone.'], win: ['Supper, my loves.'] },
  jasper: { name: 'Jasper Quillwind', title: 'Chronicler of the Hollow', cls: 'bard', g: 'm',
    ask: 'Every chronicle needs somebody worth writing down. You look tired instead of holy. Perfect.', join: 'I’ll play. You do the heroic part.',
    barks: ['This’ll rhyme later, I promise.'], win: ['And that’s the first verse.'] },
  flint: { name: 'Captain Barnaby Flint', title: 'Master of Powder and Brass', cls: 'gunner', g: 'm',
    ask: 'I’ve a keg of powder, a brass turret, and no war to put them in. Until you walked up.', join: 'Ears, everyone. Mind your ears.',
    barks: ['Fire in the hole!'], win: ['Smell that? Progress.'] },
};
export const NAMED = ['lisandra', 'homunculus', 'lily', 'jamie', 'stevie'];

// Folk standing in the world. `at` is a building id (they stand at its door) or a tile.
// `shop` opens a shop; `hero` offers to join; `sub` is who minds the door once the hero has left with you.
export const FOLK = [
  { id: 'garrick', name: 'Garrick Ironhand', title: 'Weaponsmith', at: 'weapons', shop: 'weapons', look: { cls: 'barbarian', g: 'm', tint: 0x8a5a3a },
    lines: ['Steel for the slaughter. Pick your poison: edges, hafts or bows.', 'Everything on that wall has killed something. The bows twice.', 'Don’t buy the cheap one. I made the cheap one on a bad day.'] },
  { id: 'homunculus', name: 'Homunculus the Proud', title: 'Blacksmith · Paladin', at: 'forge', shop: 'enhance', hero: 'homunculus', look: { cls: 'paladin', g: 'm' },
    sub: { name: 'Dusty Bray', title: 'Apprentice', look: { cls: 'gunner', g: 'm', tint: 0x7a6a5a }, lines: ['‘Halt’ means hello. He says it to horses.', 'He named the anvil Gertrude. I just hit her. Politely.'] },
    lines: ['Homunculus the Proud, smith and Paladin of the Light! Hand it over. Hammer and faith will see to the rest.', 'I named my anvil Gertrude. She’s a good listener.', 'Also I shoe horses. Gently. They are honest beasts.', 'Spiders are crabs that gave up on the sea.'] },
  { id: 'stevie', name: 'Stevie the Stronger', title: 'Armorer', at: 'armor', shop: 'armor', hero: 'stevie', look: { cls: 'lancer', g: 'f' },
    sub: { name: 'Garth Underhill', title: 'Carries things', look: { cls: 'totem_master', g: 'm', tint: 0x6a5a4a }, lines: ['I carry things. ...For Stevie, mostly. Sorry.', 'It’s all marked. I think it’s all marked. ...Sorry.'] },
    lines: ['The dead hit hard out there. Wear something thicker than hope.', 'My helmet’s dented. So was its last owner.', 'Plate for the front, leather for the quick, cloth for whoever stands at the back and points.'] },
  { id: 'orrin', name: 'Orrin Vey', title: 'Scholar · Scrolls', at: 'spells', shop: 'spells', look: { cls: 'wizard', g: 'm', tint: 0x6a6a8a },
    lines: ['I’d a theory someone like you would come, and I’d hoped to be wrong.', 'Nobody’s been born with it since he drank the lot. It has to be read now. Slowly. Out loud.', 'Three scrolls to a head. A fourth and something falls out the other side.'] },
  { id: 'zafir', name: 'Zafir the Lapidary', title: 'Gem Merchant', at: 'gems', shop: 'gems', look: { cls: 'bard', g: 'm', tint: 0x4a7a8a },
    lines: ['Anything you drag out of a hole, bring it to me. I’ll tell you it’s glass, and then I’ll buy it.', 'Ruby for the arm, sapphire for the wits, emerald for staying alive. Topaz if you’re late for things.'] },
  { id: 'fortunato', name: 'Fortunato', title: 'Rings · Charms · Luck', at: 'rings', shop: 'rings', look: { cls: 'boomerang_knight', g: 'm', tint: 0x8a3a5a },
    lines: ['Fortune favours the foolish! You look extremely favoured.', 'Every ring on this tray came off a finger. I don’t say whose. I don’t say how.'] },
  { id: 'tamsin', name: 'Tamsin Reed', title: 'Saddler · Bags', at: 'bags', shop: 'bags', look: { cls: 'ranger', g: 'f', tint: 0x7a5a4a },
    lines: ['Who did that to your pack? No, don’t tell me. I’ll only be angry.', 'I can sew you more room. I can’t sew you more back.'] },
  { id: 'aggie', name: 'Aggie Thorne', title: 'Keeper of The Last Toll', at: 'inn', shop: 'inn', look: { cls: 'carrion_witch', g: 'f', tint: 0x8a6a5a },
    lines: ['Bed’s four copper, paid before. Heroes die owing.', 'Sit. You’ll eat before you tell me.', 'Red for blood, blue for wits. The tonic’s for when you mean it.'] },
  { id: 'lily', name: 'Lily Belle the Veiled', title: 'Enchanter', at: 'enchant', shop: 'enchant', hero: 'lily', look: { cls: 'arcane_sorcerer', g: 'f' },
    sub: { name: 'Wenna Reed', title: 'Minds the kiln', look: { cls: 'wizard', g: 'f', tint: 0x6a8a7a }, lines: ['She left a list. It’s in three languages and one of them is stars.', 'You’re a colour I haven’t got.'] },
    lines: ['Magic is merely a negotiation. Let us renegotiate your equipment.', 'I enchanted a spoon last week. It refuses to touch soup.'] },
  { id: 'jamie', name: 'Jamie the Curator', title: 'Jeweler · Sockets', at: 'socket', shop: 'socket', hero: 'jamie', look: { cls: 'boomerang_knight', g: 'm' },
    sub: { name: 'Brother Anselm', title: 'Minds the bench', look: { cls: 'totem_master', g: 'm', tint: 0x5a5a6a }, lines: ['He took the good drill. I have the other drill.', 'A socket is a promise. I was told to say that.'] },
    lines: ['A socket is a promise. I can drill your gear, or pry those gems back out.', 'The Hollow’s named for my people. Nobody asked us. We’d have said something shorter.'] },
  // the eight
  { id: 'wren', hero: 'wren', at: [130, 140] }, { id: 'ismene', hero: 'ismene', at: [138, 126] }, { id: 'mortimer', hero: 'mortimer', at: [150, 138] },
  { id: 'brakka', hero: 'brakka', at: [125, 131] }, { id: 'kestrel', hero: 'kestrel', at: [126, 118] }, { id: 'maudlin', hero: 'maudlin', at: [111, 139] },
  { id: 'jasper', hero: 'jasper', at: [121, 138] }, { id: 'flint', hero: 'flint', at: [150, 126] },
  // townsfolk with something to say
  { id: 'kit', name: 'Kit', title: 'aged seven', at: [130, 130], small: true, look: { cls: 'bard', g: 'm', tint: 0xa08a6a },
    lines: ['Are you a hero? I’m seven.', 'I found a skeleton finger! ...It’s holding ME.', 'You have to walk funny past the well. It’s the rules.'] },
  { id: 'jory', name: 'Jory Pell', title: 'Night Watchman', at: [126, 140], look: { cls: 'lancer', g: 'm', tint: 0x5a6a7a },
    lines: ['We hold the town. You hold the pines.', 'They come to the tree line and stop. Every night. Like they’re waiting for a bell.', 'Skulls don’t lie. Lanterns do, now and then.'] },
  { id: 'hob', name: 'Hob Fenwick', title: 'Farmer', at: [133, 133], look: { cls: 'totem_master', g: 'm', tint: 0x7a7a4a },
    lines: ['Fine weather for dying. I mean, drying.', 'One of the fast ones took a goat off my line. In daylight. She was a good goat.', 'Everything bad’s out the east road. Or the north. Or the south. It’s a small town.'] },
  { id: 'agnes', name: 'Dowager Agnes', title: 'buried two kings', at: [123, 125], look: { cls: 'carrion_witch', g: 'f', tint: 0x6a4a6a },
    lines: ['I buried two kings and a dragon, child. You’ll keep.', 'Come home whole. That is my only command.', 'The sky’s the colour of a bruise. It has been for forty years.'] },
];

export const OPENING = [
  ['', 'The road comes down out of the pines. Below it: forty roofs, one well, and a ring of trees that nothing dead will cross. Herrington Hollow.'],
  ['Lisandra', 'There. Herrington Hollow. Bells, mud and gossip, and the last town before the trees get serious.'],
  ['Lisandra', 'Forty-three came down this road before you, {name}. I told every one of them a lie. I’m out of lies, so you’d better have the truth: the dead are in the pines, and they don’t read prophecies.'],
  ['Lisandra', 'Two of them are standing in the trees just south of here. Put them down, and by nightfall the whole Hollow will have an opinion of you.'],
  ['Lisandra', 'I’ll come along. I’ve a few old tricks left. And somebody has to see you don’t die owing.'],
  ['', 'Lisandra joins you. She walks one step behind, and complains the whole way.'],
];

export const LISANDRA_CHAT = [
  'Stay on the road through the pines. Or don’t. You’ve a look about you that says don’t.',
  'Morning. I slept in a hedge. Don’t ask how it was. It was a hedge.',
  'He still calls it mercy. Holding the door shut on the dead. Look around you at his mercy.',
  'And if you hear a bell at midnight, stay indoors. Nobody living rings it.',
  'Don’t look at me like that. It’s the dust. I am not crying.',
  'Every one of them asks after you. Not one asks after me. I’d be hurt, if I weren’t delighted.',
  'Four roads out of the Hollow. Snow, sand, bog and ash. I’ve walked all four. I recommend none of them.',
];

export const WELL_LINES = ['Forty roofs, one well. The water is cold and tastes of iron and old bells.', 'Somebody has scratched a tally into the rim. It stops at forty-three.'];
export const ROAD_END = 'The road goes on. You don’t, yet. Whatever is past here has not been given a name, and you are not the one to give it.';
export const CHEST_LINE = 'Somebody buried this up here where the dead don’t climb.';
