// Prints a ready-to-paste Meshy prompt for one model key, built from tools/meshy/prompts.json.
//   node tools/meshy/prompt.mjs                 lists every key
//   node tools/meshy/prompt.mjs paladin_m       the 3D prompt (subject line + style block)
//   node tools/meshy/prompt.mjs paladin_f image the picture prompt, for the text-to-image step
//   node tools/meshy/prompt.mjs paladin_m 3     with tier-3 armour appended (classes only)
//   node tools/meshy/prompt.mjs well            a scenery piece (one block; there is no separate picture prompt)
//   node tools/meshy/prompt.mjs osric sent      what was really sent, for the 17 models in sent.json
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const P = JSON.parse(readFileSync(fileURLToPath(new URL('./prompts.json', import.meta.url)), 'utf8'));

// A class key is <class>_m or <class>_f; the subject lines describe one sex, so swap the word for the other.
function classSubject(cls, g) {
  let s = P.classes[cls];
  // each line names one sex ("a tall man", "an old woman"); swap the word, and the pronouns that follow it
  const want = g === 'f' ? 'woman' : 'man';
  if (/\b(man|woman)\b/.test(s)) s = s.replace(/\b(man|woman)\b/, want);
  else s = s.replace(/^(An? [^,;]+)/, `$1, a ${want}`);
  if (g === 'f') s = s.replace('bearded ', '').replace(/\bking\b/, 'queen').replace(/\bhis\b/g, 'her').replace(/\bhandsome\b/, 'striking');
  else s = s.replace(/\bher\b/g, 'his').replace(/\bhuntress\b/g, 'hunter');
  return s + `; the ${g === 'f' ? 'female' : 'male'} cut of this class costume, same colours`;
}

const TREES = ['pine', 'oak', 'snowpine', 'dead_tree', 'char_tree', 'palm'];
// ruins, standing stones and the crypt's pieces: out in the wild or underground, nothing of the village about them
const WILD = ['ruin_waste', 'ruin_badlands', 'ruin_fen', 'ruin_ash', 'spire_ice', 'spire_hoodoo', 'spire_basalt', 'sarcophagus', 'crypt_gate'];
// the figures listed in `fitted` (a class there covers both its cuts) wear nothing long: no capes, no robes, nothing
// below the knee but boots and plate, so every clip reads cleanly and no cloth trails through the legs
const dress = (key) => ((P.fitted || []).includes(key) ? 'fitted' : 'character');

export function subject(key, tier) {
  const m = /^(.+)_([mf])$/.exec(key);
  if (m && P.classes[m[1]]) {
    let s = classSubject(m[1], m[2]);
    if (tier) { const w = Object.keys(P.armour.wears).find((k) => P.armour.wears[k].includes(m[1])); s += ', wearing ' + P.armour[w][tier - 1]; }
    return { text: s, style: dress(m[1]) };
  }
  if (P.named[key]) return { text: P.named[key], style: dress(key) };
  if (P.zombies[key]) return { text: P.zombies[key], style: 'monster' };
  if (P.summons[key]) return { text: P.summons[key], style: key === 'squire' ? 'character' : ['skeleton', 'ghoul'].includes(key) ? 'monster' : 'creature' };
  if (P.weapons[key]) return { text: P.weapons[key], style: 'weapon' };
  // a tree takes the plainer style: the village block puts ironwork and stone round its foot
  if (P.scenery[key]) return { text: P.scenery[key], style: TREES.includes(key) ? 'tree' : WILD.includes(key) ? 'wild' : 'scenery' };
  return null;
}

export function prompt(key, { image = false, tier = 0 } = {}) {
  const s = subject(key, tier);
  if (!s) return null;
  // weapons and scenery are one block with the subject inside it, and already say how they're seen
  if (['weapon', 'scenery', 'tree', 'wild'].includes(s.style)) return P.style[s.style].replace('{subject}', s.text);
  const body = `${s.text}. ${P.style[s.style]}`;
  // a creature isn't asked for an A-pose: it stands square on its own legs
  return image ? `${body} ${s.style === 'creature' ? P.style.creature_image : P.style.image}` : body;
}

export const keys = () => [
  ...Object.keys(P.named), ...Object.keys(P.classes).flatMap((c) => [c + '_m', c + '_f']),
  ...Object.keys(P.zombies), ...Object.keys(P.summons), ...Object.keys(P.weapons), ...Object.keys(P.scenery),
];

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [key, ...rest] = process.argv.slice(2);
  if (!key) { console.log(keys().join('\n')); process.exit(0); }
  // sent.json: the 17 models made from prompts this file no longer gives word for word, step by step
  if (rest.includes('sent')) {
    const m = JSON.parse(readFileSync(fileURLToPath(new URL('./sent.json', import.meta.url)), 'utf8')).models[key];
    if (!m) { console.error(`${key} isn't in sent.json: its prompt is this file's (node tools/meshy/prompt.mjs ${key} image)`); process.exit(1); }
    console.log(m.why + '\n');
    m.steps.forEach((s, n) => console.log(`${n + 1}. ${s.step}: ${s.tool}${s.ai_model ? ' ' + s.ai_model : ''}, task ${s.task}${s.from ? ', from ' + s.from : ''}` + (s.prompt ? '\n' + s.prompt : '') + '\n'));
    process.exit(0);
  }
  const out = prompt(key, { image: rest.includes('image'), tier: +rest.find((r) => /^[1-5]$/.test(r)) || 0 });
  if (!out) { console.error('no such key: ' + key); process.exit(1); }
  console.log(out + '\n\nNegative: ' + P.negative);
}
