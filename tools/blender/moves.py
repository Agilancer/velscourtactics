"""Every figure's Mixamo takes: the moves, which class does which, and the run that bakes them into clip banks.

Inside Blender, after retarget.py and mixamo.py (docs/MODELS.md section 13):

    exec(open(r"<repo>/tools/blender/moves.py").read())
    make("paladin_m_v2", "paladin_m", "paladin")      # builds, takes, writes assets/models/clips/mx/paladin_m.*

Then `python tools/mx_manifest.py` puts each bank's states into assets/models/manifest.json.

A move is a stretch of one source clip: (clip, from, to, blow, options) in real seconds, the blow being when it lands
(a list for a combo: every blow after the first is a hit of its own). Options go to Target.take (at: the frame the
first blow lands on; post: how fast what follows the blow plays; travel: how much of the lunge to keep; rise: how much
of a leap's lift; mirror: the clip done left for right; keep: bones left as the idle has them, 'R' or 'L' for an arm;
sides: the hands that hold their gear in the Mixamo fist) or are read here, each turning a hand so what it holds points somewhere of its own:
    up      'R', 'L' or 'RL': held up out of the fist. A staff, a bow or a pistol stands (the pistol's barrel is along the
            knuckles, so it points level at the foe); a blade or an axe stands when the forearm is raised and points
            ahead and down when the arm hangs, so it never lies across the body.
    level   the spear held out level at the foe through the whole take.
    down    the spear driven point down as the blow lands (a leap's landing).
    shield  (the lancer) the shield's face turned to the front as the blow lands.
    lift    (the lancer) degrees the level lance is raised, its point at a foe's chest from a low landing.
    tilt    (forward, sweep) degrees: the spine pitched forward (back, if less than 0: a shot sent up in an arc) through the
            take, and swung from right to left across the blow (a fan of arrows).
The lancer's lance and shield are the manifest's own props, not gear: every take holds the lance up (level at the foe
in a thrust) and the shield's face out, by Target.hold.

Each class names its moves by state. The states are the game's: <basic>_1, _2, _3 (the plain blow, from level 1, 5 and
10: game/party.js basicTier), sk_<skill id> (game/battle.js plays a skill's own move where the figure has one), cheer
(the fight won), taunt (after a kill), and any of the rest (revive, attack...). A cheer or taunt of an armed class holds
its weapon up unless it says otherwise.
"""
import os, math
from mathutils import Vector, Quaternion, Matrix

REPO = globals().get('REPO') or os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(SHOTS))))
BANKS = os.path.join(REPO, 'assets', 'models', 'clips', 'mx')

MOVES = {
    # one-handed blade or mace, a shield on the other arm (the sword and shield pack)
    'slash':      ('sns:sword and shield slash', 0.25, 1.6, 0.73, {}),
    'slash5':     ('sns:sword and shield slash (5)', 0.25, 1.5, 0.70, {}),
    'slash3':     ('sns:sword and shield slash (3)', 0.4, 1.8, 1.0, {'at': 9}),
    'rising':     ('sns:sword and shield slash (4)', 0.8, 2.6, 1.7, {'at': 10, 'travel': 0.3}),
    'lunge':      ('sns:sword and shield attack (2)', 0.15, 1.5, 0.7, {'travel': 0.35}),
    'lunge3':     ('sns:sword and shield attack (3)', 0.25, 2.0, 0.93, {'at': 9, 'travel': 0.35}),
    'leapcut':    ('sns:sword and shield attack', 0.5, 2.6, 1.43, {'at': 11, 'travel': 0.35}),
    'jab2':       ('sns:sword and shield attack (4)', 0.1, 1.1, [0.33, 0.57], {}),
    'snscombo':   ('sns:sword and shield slash (2)', 0.5, 3.6, [0.83, 1.53, 3.07], {'travel': 0.25}),
    'snskick':    ('sns:sword and shield kick', 0.1, 1.4, 0.55, {}),
    'snscast':    ('sns:sword and shield casting', 1.2, 3.3, 2.13, {'at': 12}),
    'snscast2':   ('sns:sword and shield casting (2)', 0.0, 1.25, 0.3, {}),
    'powerup':    ('sns:sword and shield power up', 0.0, 2.9, 0.65, {'at': 12, 'blend_out': 10}),
    'block':      ('sns:sword and shield block', 0.0, 1.0, 0.4, {'at': 10, 'hold': 10}),
    # heavy one-handed blows (the axe pack) and the two-handed great sword
    'chop':       ('axe:standing melee attack downward', 0.35, 2.2, 1.03, {'at': 10}),
    'cleave':     ('axe:standing melee attack horizontal', 0.55, 2.3, 1.23, {'at': 10}),
    'backhand':   ('axe:standing melee attack backhand', 0.6, 2.4, 1.27, {'at': 10}),
    'spinhigh':   ('axe:standing melee attack 360 high', 0.5, 2.5, 1.33, {'at': 12}),
    'spinlow':    ('axe:standing melee attack 360 low', 0.5, 2.2, 1.2, {'at': 11}),
    'combo2':     ('axe:standing melee combo attack ver. 3', 0.6, 3.0, [1.23, 2.2], {'at': 10}),
    'combo3':     ('axe:standing melee combo attack ver. 2', 0.6, 4.0, [1.17, 2.03, 3.3], {'at': 10}),
    'axecombo':   ('axe:standing melee combo attack ver. 1', 1.7, 4.4, [2.5, 3.67], {'at': 10, 'travel': 0.3}),
    'runjump':    ('axe:standing melee run jump attack', 0.9, 3.3, 2.13, {'at': 14, 'travel': 0.3}),
    # the same run jump as a bound in plate: a third of the lift, cut just after it lands, before the squat
    'bound':      ('axe:standing melee run jump attack', 0.9, 2.3, 2.13, {'at': 14, 'travel': 0.3, 'rise': 0.33}),
    'kick':       ('axe:standing melee attack kick ver. 1', 0.2, 1.8, 0.78, {'at': 9}),
    'greatcombo': ('Great Sword Slash', 0.5, 3.9, [0.97, 2.1, 3.2], {'at': 10, 'travel': 0.25}),
    'greatone':   ('Great Sword Slash', 0.3, 1.7, 1.15, {'at': 14, 'travel': 0.2, 'face': 0.7}),     # overhead and down, before it turns
    'jumpslam':   ('Jump Attack', 0.25, 3.1, 2.2, {'at': 22, 'travel': 0.15}),
    'slash2':     ('sns:sword and shield slash (2)', 0.5, 1.4, 0.83, {'at': 8}),
    'gsblock':    ('Great Sword Blocking', 0.0, 0.62, 0.4, {'at': 10, 'hold': 14}),
    # the bow (Shooting Arrow: a hand to the quiver 0.3-1.4, nocked by 2.4, at full draw 3.0-5.0, loosed at 5.1; the
    # long still draw is cut down by skip)
    'shoot':      ('Shooting Arrow', 0.3, 2.3, 1.45, {'at': 14, 'up': 'L', 'sides': 'L'}),
    'sa_nock':    ('Shooting Arrow', 2.6, 5.8, 5.1, {'at': 12, 'skip': (3.1, 4.85)}),
    'sa_full':    ('Shooting Arrow', 1.2, 5.8, 5.1, {'at': 18, 'skip': (3.1, 4.85)}),
    'sa_snap':    ('Shooting Arrow', 4.5, 5.8, 5.1, {'at': 8, 'blend_in': 5, 'post': 1.3}),
    'sa_long':    ('Shooting Arrow', 2.6, 5.8, 5.1, {'at': 26, 'skip': (3.5, 4.7), 'post': 0.8}),
    'sa_sky':     ('Shooting Arrow', 4.4, 5.6, 5.1, {'at': 12, 'blend_in': 6}),
    'overdraw':   ('Standing Aim Overdraw', 0.2, 2.2, 1.0, {'at': 12, 'blend_in': 6}),
    # spells
    'fireball':   ('Fireball', 1.1, 3.2, 2.25, {'at': 12}),
    'fireball_q': ('Fireball', 1.7, 3.0, 2.25, {'at': 8, 'post': 1.3}),
    'thrust2h':   ('Standing 2H Magic Attack 01', 0.4, 2.4, 1.4, {'at': 12}),
    'twohand':    ('Two Hand Spell Casting', 0.3, 2.6, 1.65, {'at': 14}),
    'twohand_a':  ('Two Hand Spell Casting', 0.2, 1.5, 0.8, {'at': 10}),
    'twohand_b':  ('Two Hand Spell Casting', 2.0, 3.6, 2.83, {'at': 12}),
    # fists, knees and feet
    'boxing':     ('Fist Fight A', 1.3, 4.0, [1.75, 2.7, 3.47], {'at': 8}),
    'kneecombo':  ('Flying Knee Punch Combo', 0.2, 1.7, [0.87, 1.5], {'at': 10, 'travel': 0.3}),
    'frontkick':  ('Standing Melee Attack Kick Ver. 2', 0.2, 1.6, 0.8, {'at': 9}),
    # knives
    'stab':       ('Stabbing', 0.3, 1.9, 0.75, {'mirror': True}),
    'twinstab':   ('Double Dagger Stab', 0.9, 2.8, [1.37, 2.23], {}),
    'brutal':     ('Brutal Assassination', 2.7, 4.6, 3.45, {'at': 10}),
    'stealth':    ('Stealth Assassination', 4.7, 6.6, 5.5, {'at': 12}),
    'vault':      ('Jumping Over Into Combat', 2.0, 4.6, 3.45, {'at': 14, 'travel': 0.3}),
    # rejoicing and goading
    'battlecry':  ('Standing Taunt Battlecry', 0.0, 2.6, 0.6, {'at': 8}),
    'chestthump': ('axe:standing taunt chest thump', 0.2, 2.6, 0.83, {'at': 10}),
    'excited':    ('Excited', 0.0, 3.2, 0.5, {'at': 10}),
    'thankful':   ('Thankful', 0.0, 2.9, 0.6, {'at': 12}),
    'kiss':       ('Kiss', 0.3, 4.3, 3.9, {'at': 60}),
    'yell':       ('Yelling While Standing', 0.4, 2.8, 0.8, {'at': 10}),
    'pump':       ('Excited', 0.3, 1.6, 0.9, {'at': 12, 'hold': 6}),
    'jump':       ('Jump', 0.2, 2.2, 1.3, {'at': 16}),
    'sitting':    ('Sitting', 0.0, 2.6, 1.2, {'at': 18, 'blend_in': 10, 'hold': 12, 'blend_out': 12}),
    'catwalk':    ('Catwalk Walk Forward HighKnees', 0.0, 1.5, 0.4, {'at': 9}),
    'entrybow':   ('Entry', 1.0, 5.8, 3.0, {'at': 30, 'post': 1.2}),
    'equip':      ('Unarmed Equip Over Shoulder', 0.2, 2.0, 0.9, {'at': 13}),
    # a blade drawn, flourished and put away (the hand keeps it: it ends at the hip, or point down)
    'drawsword':  ('Draw Sword 1', 0.0, 0.6, 0.45, {'at': 10, 'hold': 12, 'up': ''}),
    'sheathe':    ('Sheathing Sword', 0.0, 2.0, 0.5, {'at': 11, 'up': ''}),
    'sheath1':    ('sns:sheath sword 1', 0.0, 1.55, 0.5, {'at': 11, 'up': ''}),
    'sheath2':    ('sns:sheath sword 2', 0.0, 1.0, 0.4, {'at': 9, 'up': ''}),
    # held poses, a cheer's own or to end one on (a single frame each, held)
    'pose_m':     ('Male Standing Pose', 0.0, 0.02, 0.01, {'at': 10, 'hold': 30}),
    'pose_f':     ('Female Standing Pose', 0.0, 0.02, 0.01, {'at': 10, 'hold': 30}),
    'pose_f2':    ('! Female Standing Pose', 0.0, 0.02, 0.01, {'at': 10, 'hold': 30}),
    'pose_dyn':   ('Female Dynamic Pose', 0.0, 0.02, 0.01, {'at': 10, 'hold': 30}),
    # the dead
    'bite':       ('Zombie Neck Bite', 0.4, 2.6, 1.05, {'at': 10}),
    'rise':       ('Zombie Stand Up', 1.6, 3.85, 3.3, {'at': 40, 'blend_in': 1}),
}

# Per class: state -> move, or (move, extra options).
UP_R, UP_L = {'up': 'R'}, {'up': 'L'}
LV = {'level': 'R'}
DN = {'down': 'R'}
LK = {**LV, 'keep': 'L'}                 # the lancer's: the lance level, the shield arm left as the idle has it
# the lancer's body (its lance a prop held up at the idle): the lance comes down to level over a third of a second and
# goes back up as slowly, never swung through the helm in three frames; the blow lands 5 frames later for it
LKS = {**LK, 'blend_in': 8, 'at': 12, 'blend_out': 10}
RB = {'up': 'L'}                         # the ranger's bow, upright in the left fist
NU = {'up': 'RL'}                        # the ninja's two knives
CLASSES = {
    'paladin': {'swing_1': 'slash', 'swing_2': 'slash3', 'swing_3': 'lunge3', 'attack': 'slash',
                'sk_smite': ('chop', {'keep': 'L'}), 'sk_shield_bash': ('lunge', {'mirror': True, 'travel': 0.35}),
                'sk_holy_bolt': ('fireball', {'keep': 'L', 'face': 0.7}), 'sk_lay_on_hands': 'snscast',
                'sk_blessed_light': ('powerup', UP_R), 'sk_radiant_spark': 'twohand_a', 'sk_consecration': 'jumpslam',
                'sk_judgment_beam': ('greatone', {'face': 0.6}), 'cheer': ('pump', {'keep': 'L'}), 'taunt': ('drawsword', {'keep': 'L'})},
    'dragon_knight': {'swing_1': 'slash5', 'swing_2': ('slash2', {'keep': 'L', 'at': 12}), 'swing_3': 'leapcut', 'attack': 'slash5',
                      'sk_flame_slash': 'cleave', 'sk_tail_swipe': 'spinlow',
                      'sk_fire_breath': ('battlecry', {'tilt': (15, 0), 'keep': 'L', 'up': 'R'}),
                      'sk_dragon_leap': 'jumpslam', 'sk_dragon_scales': 'block', 'sk_primal_roar': ('yell', {'keep': 'L'}),
                      'sk_summon_whelp': 'snscast', 'sk_dragon_form': 'chestthump', 'cheer': 'powerup', 'taunt': 'sheath1'},
    # the slime lord's plain blow is the mace over the crown and down: a smash reads from above
    'slime_lord': {'swing_1': ('chop', {'keep': 'L'}), 'swing_2': ('cleave', {'keep': 'L'}), 'swing_3': ('combo3', {'keep': 'L', 'face': 0.5}),
                   'attack': ('chop', {'keep': 'L'}), 'sk_slime_ball': ('fireball', {'keep': 'L', 'face': 0.7}), 'sk_engulf': 'twohand_b',
                   'sk_slimeling': 'snscast', 'sk_slime_armor': ('powerup', UP_R), 'sk_body_slam': 'runjump', 'sk_bounce': 'jumpslam',
                   'sk_acid_splash': ('backhand', {'face': 0.7, 'keep': 'L'}), 'sk_devour': ('bite', {'keep': 'RL'}),
                   'cheer': 'sitting', 'taunt': ('excited', {'post': 1.2})},
    'barbarian': {'swing_1': 'chop', 'swing_2': 'cleave', 'swing_3': 'axecombo', 'attack': 'chop',
                  'sk_bash': 'backhand', 'sk_taunt': 'chestthump', 'sk_leap': 'runjump', 'sk_hurl': 'kick',
                  'sk_whirlwind': 'spinhigh', 'sk_executioner': 'combo3', 'sk_earthquake': 'jumpslam',
                  'sk_wrath_of_the_berserker': 'powerup', 'cheer': 'battlecry', 'taunt': 'yell'},
    'death_knight': {'swing_1': 'cleave', 'swing_2': ('slash3', {'at': 14, 'travel': 0.3}), 'swing_3': 'greatone', 'attack': 'cleave',
                     'sk_frost_strike': ('backhand', {'face': 0.6}),
                     'sk_death_grip': ('fireball', {'mirror': True, 'keep': 'R', 'face': 1}),
                     'sk_death_coil': ('thrust2h', UP_R), 'sk_icebound_fortitude': ('powerup', UP_R),
                     'sk_raise_ghoul': 'snscast', 'sk_blood_boil': 'spinlow', 'sk_obliterate': ('runjump', {'post': 0.9}),
                     'sk_remorseless_winter': 'spinhigh', 'cheer': 'sheathe', 'taunt': ('sheath2', {'up': 'R', 'aim': 'down'})},
    'dragoon': {'thrust_1': ('stab', LV), 'thrust_2': ('thrust2h', LV), 'thrust_3': ('leapcut', LV), 'attack': ('stab', LV),
                'sk_lance_jab': ('lunge', {**LV, 'travel': 0.5, 'at': 8, 'post': 1.3}), 'sk_twin_thrust': ('jab2', LV),
                'sk_skewer': ('lunge3', LV), 'sk_jump': ('jumpslam', DN), 'sk_dragon_dive': ('runjump', DN),
                'sk_comet_dive': ('vault', {**DN, 'travel': 0.3}), 'sk_dragon_breath': 'battlecry',
                'sk_frost_breath': ('yell', {'keep': 'R'}), 'cheer': ('jump', UP_R), 'taunt': ('spinhigh', LV)},
    'lancer': {'thrust_1': ('stab', {**LKS, 'post': 1.4}), 'thrust_2': ('thrust2h', {**LKS, 'at': 17}),
               'thrust_3': ('leapcut', {**LKS, 'at': 16}), 'attack': ('stab', {**LKS, 'post': 1.4}),
               'sk_lance_thrust': ('lunge', {**LKS, 'post': 1.2}), 'sk_shield_slam': ('lunge', {'mirror': True, 'shield': 1, 'travel': 0.35}),
               'sk_lance_charge': ('bound', {**LKS, 'at': 19, 'blend_out': 12, 'lift': 12}), 'sk_lance_of_light': ('snscast', {'keep': 'L'}),
               'sk_squire_knight': 'yell', 'sk_hold_the_line': ('battlecry', {'shield': 1}),
               'sk_tower_shield': ('block', {'shield': 1}), 'sk_bastion_of_ten': ('powerup', {'shield': 1}),
               'cheer': 'pose_m', 'taunt': ('thankful', {'keep': 'L'})},
    'boomerang_knight': {'throw_1': ('fireball', {'face': 0.7}), 'throw_2': 'cleave', 'throw_3': 'spinlow', 'attack': ('fireball', {'face': 0.7}),
                         'sk_boomerang': 'rising', 'sk_ricochet': ('backhand', {'post': 1.3, 'face': 0.6}), 'sk_twin_rang': 'combo2',
                         'sk_riposte': 'snskick', 'sk_swirling_blades': 'spinhigh', 'sk_gust': 'twohand_a', 'sk_typhoon': 'combo3',
                         'sk_thousand_cuts': 'snscombo', 'cheer': ('equip', UP_R), 'taunt': 'pose_f'},
    'ninja': {'slash_1': ('stab', NU), 'slash_2': ('twinstab', NU), 'slash_3': ('brutal', NU), 'attack': ('stab', NU),
              'sk_throwing_stars': ('boxing', NU), 'sk_shadow_step': 'vault', 'sk_smoke_bomb': ('fireball', {'tilt': (25, 0), 'face': 0.7}),
              'sk_caltrops': 'frontkick', 'sk_venom_edge': ('jab2', NU), 'sk_vanish': 'twohand_a',
              'sk_hundred_cuts': ('snscombo', {**NU, 'post': 1.3}), 'sk_last_cut': 'stealth',
              'cheer': ('sheath2', {'then': ('pose_dyn', 16), 'face': 1}), 'taunt': 'kneecombo'},
    'ranger': {'shoot_1': ('sa_nock', RB), 'shoot_2': ('sa_full', {**RB, 'tilt': (6, 0)}),
               'shoot_3': ('sa_full', {**RB, 'skip': (3.45, 4.85), 'at': 22, 'tilt': (-8, 0)}), 'attack': ('sa_nock', RB),
               'sk_quick_shot': ('sa_snap', {**RB, 'aim': 'cant', 'tilt': (10, 0)}), 'sk_piercing_arrow': ('sa_long', RB),
               'sk_multishot': ('sa_full', {**RB, 'tilt': (0, 32), 'at': 16}),
               'sk_pinning_shot': ('sa_nock', {**RB, 'tilt': (22, 0), 'post': 0.8}),
               'sk_rain_of_arrows': ('sa_nock', {**RB, 'tilt': (-35, 0), 'at': 16}),
               'sk_net_shot': ('fireball', {'face': 1, 'up': 'L'}), 'sk_wolf_pack': ('yell', {'keep': 'L', 'up': 'L'}),
               'sk_spike_trap': ('snscast', UP_L),
               'cheer': ('sa_sky', {**RB, 'tilt': (-45, 0, 'blow'), 'then': 'pump'}), 'taunt': ('overdraw', RB)},
    'gunner': {'shoot_1': ('twohand', {**UP_R, 'at': 12}), 'shoot_2': ('thrust2h', UP_R), 'shoot_3': ('spinlow', {**UP_R, 'at': 14}),
               'attack': ('twohand', {**UP_R, 'at': 12}),
               'sk_pistol_shot': ('overdraw', {**UP_R, 'mirror': True, 'at': 14}), 'sk_buckshot': ('twohand_a', UP_R),
               'sk_grenade': ('fireball', {'mirror': True, 'keep': 'R'}), 'sk_landmine': ('snscast', UP_R),
               'sk_gun_turret': ('snscast2', UP_R), 'sk_rail_gun': ('twohand_b', UP_R), 'sk_bullet_hell': ('boxing', UP_R),
               'sk_orbital_strike': ('pump', UP_R), 'cheer': ('drawsword', {'post': 1.3, 'then': 'pose_f'}), 'taunt': ('kiss', UP_R)},
    'bard': {'strum_1': 'snscast2', 'strum_2': 'twohand', 'strum_3': 'thrust2h', 'attack': 'snscast2',
             'sk_plucked_note': ('fireball_q', {'mirror': True}), 'sk_song_of_swiftness': ('excited', {'post': 1.3}),
             'sk_ballad_of_valor': 'powerup', 'sk_sound_wave': 'twohand_b', 'sk_hymn_of_mending': 'thankful',
             'sk_encore': 'yell', 'sk_lullaby': ('twohand_a', {'post': 0.7}), 'sk_anthem_of_heroes': 'battlecry',
             'cheer': 'entrybow', 'taunt': 'kiss'},
}
ST = lambda m, **k: (m, {'up': 'R', **k})                # a caster's: the staff stands in the fist all through
KICK = ('Standing Melee Attack Kick Ver. 2', 0.2, 0.9, 1.4)   # a stamp, to lead into a blow (first)
CASTERS = {
    'wizard': {'bolt_1': ST('fireball', face=0.7, at=14), 'bolt_2': ST('thrust2h', tilt=(10, 0)),
               'bolt_3': ST('fireball', first=('Two Hand Spell Casting', 0.6, 1.2, 1.2), tilt=(-8, 0), face=0.7),
               'attack': ST('fireball', face=0.7, at=14),
               'sk_fire_bolt': ST('fireball_q', mirror=True), 'sk_ice_lance': ('lunge', {'level': 'R', 'travel': 0.3}),
               'sk_frost_nova': ST('jumpslam'), 'sk_teleport': ST('vault'), 'sk_chain_lightning': ST('twohand'),
               'sk_living_bomb': ST('stab'), 'sk_meteor': ST('snscast'), 'sk_blizzard': ST('spinhigh'),
               'cheer': ST('gsblock'), 'taunt': ST('pose_f')},
    'necromancer': {'bolt_1': ST('fireball_q', mirror=True), 'bolt_2': ST('twohand'), 'bolt_3': ST('twohand_b', first='twohand_a'),
                    'attack': ST('fireball_q', mirror=True),
                    'sk_bone_spike': ST('snscast'), 'sk_blood_drain': ST('fireball', mirror=True, keep='R', face=0.7),
                    'sk_raise_skeleton': ST('thrust2h', tilt=(-20, 0)), 'sk_doom': ST('fireball', face=0.7), 'sk_weaken': ST('yell'),
                    'sk_bone_armor': ST('powerup'), 'sk_corpse_explosion': ST('chop'), 'sk_bone_spear': ('lunge', {'level': 'R'}),
                    'cheer': ST('battlecry', then=('pose_dyn', 12), face=1), 'taunt': ST('thankful', mirror=True, keep='R')},
    'totem_master': {'bolt_1': ST('fireball', mirror=True, face=0.7), 'bolt_2': ST('twohand_a'), 'bolt_3': ST('thrust2h', first=KICK),
                     'attack': ST('fireball', mirror=True, face=0.7),
                     'sk_spirit_strike': ST('fireball_q'), 'sk_spirit_chain': ST('twohand'), 'sk_healing_totem': ST('snscast'),
                     'sk_hex': ST('stab'), 'sk_searing_totem': ST('chop'), 'sk_spirit_walk': ST('vault'), 'sk_earth_shock': ST('jumpslam'),
                     'sk_thunderhead_totem': ST('powerup'), 'cheer': ST('catwalk'), 'taunt': ST('chestthump', mirror=True, keep='R')},
    'arcane_sorcerer': {'bolt_1': ST('twohand_a'), 'bolt_2': ST('fireball', tilt=(-15, 0), face=0.7),
                        'bolt_3': ST('thrust2h', first='twohand_a', tilt=(-12, 0)), 'attack': ST('twohand_a'),
                        'sk_star_missiles': ST('boxing', keep='R'), 'sk_starlight_step': ST('vault'), 'sk_moonbeam': ST('snscast'),
                        'sk_repulse': ST('twohand_b'), 'sk_falling_star': ST('fireball_q', tilt=(-20, 0)), 'sk_gravity_well': ST('powerup'),
                        'sk_black_hole': ST('twohand', tilt=(-15, 0)), 'sk_supernova': ST('jumpslam'),
                        'cheer': ST('pose_f2'), 'taunt': ST('kiss', mirror=True, keep='R')},
    'carrion_witch': {'bolt_1': ST('fireball_q', mirror=True), 'bolt_2': ST('twohand_a', tilt=(10, 0)), 'bolt_3': ST('thrust2h', tilt=(18, 0)),
                      'attack': ST('fireball_q', mirror=True),
                      'sk_rot_bolt': ST('fireball', face=0.7), 'sk_eye_gouge': ST('stab'), 'sk_crow_swarm': ST('twohand_b', tilt=(-20, 0)),
                      'sk_puppeteer': ST('twohand'), 'sk_voodoo_doll': ST('snscast'), 'sk_pandemic': ST('spinlow'),
                      'sk_toxic_rain': ST('powerup'), 'sk_nevermore': ST('jumpslam'),
                      'cheer': ST('yell', keep='R'), 'taunt': ST('excited', post=1.3, keep='R')},
}
CLASSES.update(CASTERS)
HAND = {'ranger': 'L', 'ninja': 'RL', 'bard': '', 'lancer': ''}     # the hands that hold gear, where not the right alone
STANDS = set(CASTERS) | {'ranger', 'gunner'}                       # what these hold stands straight up out of the fist
ZOMBIE = {'revive': 'rise'}
BITERS = {'gnawer', 'husk', 'lurker', 'driftling', 'shambler', 'drowner'}
ARM = {'R': ['mixamorig:Right' + b for b in ('Shoulder', 'Arm', 'ForeArm', 'Hand')],
       'L': ['mixamorig:Left' + b for b in ('Shoulder', 'Arm', 'ForeArm', 'Hand')]}
GRIP_FROM = ('sns:sword and shield slash', 0.73)      # a closed fist on a sword and on a shield's grip


def moves_for(cls):
    if cls.startswith('zombie_'):
        kind = cls[len('zombie_'):]
        return {**ZOMBIE, **({'attack': 'bite', 'sk_bite': 'bite'} if kind in BITERS else {})}
    return CLASSES.get(cls, {})


def _smooth(x):
    x = 0.0 if x <= 0 else 1.0 if x >= 1 else x
    return x * x * (3 - 2 * x)


def _env(T, mode):
    """How far over a hand's turn is at frame f: 'take' all through the take (eased in and out with it), 'blow' only
    about the blow (in over the 8 frames before it, out over the 10 after)."""
    a, b, c = T.ease; at = T.blow
    if mode == 'blow':
        return lambda f: _smooth((f - (at - 8)) / 6) * (1 - _smooth((f - (at + 4)) / 10))
    return lambda f: _smooth(f / max(1, a)) * (1 - _smooth((f - b) / max(1, c - b)))


def _flat(v, up):
    return (v - up * v.dot(up)).normalized()


# How the game places a look in a hand at the idle (gfx/gear.js place), as (long axis, edge-ish) in the holder's frame
# (three's: y up, facing +z), by the class's hold; and the turn from three's axes to Blender's world (y up -> z up).
RX = Quaternion((1, 0, 0), math.radians(90))
HOLDS = {'paladin': 'haft', 'barbarian': 'haft', 'slime_lord': 'haft', 'death_knight': 'blade', 'dragon_knight': 'blade',
         'ranger': 'bow', 'gunner': 'pistol', 'ninja': 'dagger', 'boomerang_knight': 'rang', 'bard': 'lute'}   # else a pole
PLACE = {'pole': ((0, 1, 0.15), (0, 0, 1)), 'bow': ((0, 1, 0.1), (0, 0, -1)), 'haft': ((0, 0.55, 1), (0, 1, 0))}


def _basis(Y, Zh):
    Y = Vector(Y).normalized(); X = Y.cross(Vector(Zh)).normalized(); Z = X.cross(Y)
    return Matrix((X, Y, Z)).transposed().to_quaternion()


def _places(T, side, grip, hold):
    """The look's turn in the hand bone's frame (three's axes for the look: long +Y): at the idle, as the game first puts
    it there, and in the Mixamo fist (gfx/gear.js inFist)."""
    _, ax, kn = grip; h = 'mixamorig:%sHand' % side
    Ha0 = T.fk(T.B0)[0][h]
    Y, Zh = PLACE.get(hold, ((0, -0.36, 1), (0, 1, 0)))
    idle = Ha0.inverted() @ rot_of(T.arm.matrix_world).inverted() @ RX @ _basis(Y, Zh)
    fist = _basis(kn, ax) if hold == 'pistol' else _basis(ax, -kn)
    return idle, fist


def _turn(T, side, grip, aim, w_of, hold='pole'):
    """A hook for take(): the hand turned so what it holds lies with the fist's axis along A and its knuckles toward K
    (aim(p, Q, X) -> (A, K), armature space), w_of(f) of the way. The game moves the look from its idle place to the
    fist as the take's grip weight says (GripW: in with the take, out with it), so the turn is worked on the look itself:
    from where the hand as it is would carry it, at that frame's place in the hand, over to where it is wanted; the
    hand follows. So a staff that stands at the idle stands all through, and nothing swings round on the way back."""
    _, ax, kn = grip; h = 'mixamorig:%sHand' % side
    G = Matrix((ax.cross(kn).normalized(), ax, kn)).transposed().to_quaternion()        # the grip's frame in the hand
    R_idle, R_fist = _places(T, side, grip, hold)
    k_of = _env(T, 'take'); whole = w_of(T.blow) > 0.999 and w_of(0) < 1e-3 and abs(w_of(T.ease[1]) - 1) < 1e-3
    G_idle = T.fk(T.B0)[0][h] @ R_idle                   # the look at the idle, on the tile

    def hook(f, p):
        w = w_of(f); k = k_of(f)
        if w <= 1e-3 and not whole: return p
        Q, X = T.fk(p)
        A, K = aim(p, Q, X); A = A.normalized(); K = K - A * K.dot(A)
        if K.length < 1e-4: return p
        K.normalize()
        want = Matrix((A.cross(K), A, K)).transposed().to_quaternion()
        Rk = R_idle.slerp(R_fist, k)
        Gt = want @ G.inverted() @ R_fist                # the look, wanted
        # held all through the take: from the idle's look over to the wanted as the grip comes over, back as it goes;
        # held about the blow only: from where the hand as it is would carry it
        Gd = G_idle.slerp(Gt, k) if whole else (Q[h] @ Rk).slerp(Gt, w)
        return T.spin(p, h, Gd @ Rk.inverted() @ Q[h].inverted())
    return hook


def _aims(T, side, how):
    """Where the fist's axis and knuckles go: how is 'stand' (straight up, leaning a touch ahead), 'raise' (up when the
    forearm is raised, ahead and down when it hangs), 'level' (level at the foe, whichever way the chest is turned) or
    'down' (point down, a little toward the foe). What stands up by the face leans out, away from the head, so a staff
    or a blade never goes through it. The knuckles follow the forearm as near as they can, so the wrist never wrings."""
    Z = T.Z; S = -T.Lf if side == 'Right' else T.Lf
    hn, fn = 'mixamorig:%sHand' % side, 'mixamorig:%sForeArm' % side
    hd = 'mixamorig:Head'

    def aim(p, Q, X):
        fr = T.frame(p, 'mixamorig:Spine2'); F = _flat(fr[2], Z)            # the chest's forward, kept level
        fa = (X[hn] - X[fn]).normalized()
        if how == 'stand': A = Z + F * 0.2
        elif how in ('bow', 'cant'):                     # square to the bow arm: lifted with it, upright when it hangs
            v = Z - fa * Z.dot(fa); w = _smooth((0.85 - abs(Z.dot(fa))) / 0.3)
            A = Z * (1 - w) + (v.normalized() if v.length > 1e-4 else Z) * w
            if how == 'cant': A = Quaternion(fa, math.radians(35 if side == 'Left' else -35)) @ A   # laid over, a snap shot
        elif how == 'level': A = T.F - Z * 0.12
        elif how == 'down': A = -Z + T.F * 0.35
        else:
            k = _smooth((fa.dot(Z) + 0.35) / 0.7)
            A = (F - Z * 0.36).normalized() * (1 - k) + (Z + F * 0.25).normalized() * k
        A = A.normalized()
        if how in ('stand', 'raise') and hd in X and A.dot(Z) > 0.3:
            sw = max(1e-3, (X['mixamorig:LeftArm'] - X['mixamorig:RightArm']).length)
            off = X[hn] - X[hd]; fl = off - Z * off.dot(Z)
            near = 1 - _smooth((fl.length - 0.5 * sw) / (0.6 * sw))          # the hand within a shoulder of the head's line
            high = _smooth((off.dot(Z) + 1.3 * sw) / (0.8 * sw))             # and up by the chest or higher
            Sc = _flat(fr[1] if side == 'Left' else -fr[1], Z)            # out to the hand's own side of the chest
            out = _flat(Sc + (fl.normalized() * 0.3 if fl.length > 0.1 * sw else Vector()), Z)
            A = (A + out * 1.1 * near * high).normalized()
        perp = lambda v: v - A * v.dot(A)
        R = perp(F) if perp(F).length > 0.5 else perp(S - Z)
        return A, perp(fa) + R.normalized() * 0.35
    return aim


def _tilt(T, fwd, sweep, env):
    """A hook for take(): the spine pitched toward the foe by fwd degrees (in the tile's frame, so an archer standing side
    on lifts or drops the bow arm) and swung by sweep across the blow, eased with env."""
    bones = [n for n in ('mixamorig:Spine', 'mixamorig:Spine1', 'mixamorig:Spine2') if n in T.order]; at = T.blow
    ax = T.U.cross(T.F).normalized()

    def hook(f, p):
        w = env(f)
        if w <= 1e-3: return p
        if fwd:
            q = Quaternion(ax, math.radians(fwd * w / len(bones)))
            for n in bones: p = T.spin(p, n, q)
        if sweep: p = T.tilt(p, bones, 'yaw', sweep * (2 * _smooth((f - (at - 5)) / 12) - 1) * w / len(bones))
        return p
    return hook


def _lancer(T, level, shield, env, lift=0):
    """The lancer's hook: the lance up (174 degrees from straight down, a touch out ahead), or as far over to level at
    the foe as env says (lift: degrees above level, a point at the chest from a low stance); the shield's face out to
    the left, or to the front."""
    fr = (T.U, T.Lf, T.F)

    def hook(f, p):
        w = env(f) if env else 0.0
        lw, sw = (w if level else 0.0), (w if shield else 0.0)
        d = T.dirn(fr, 'Right', 174 + (93 + lift - 174) * lw, 75 + (90 - 75) * lw)
        p = T.hold(p, 'Right', d, T.knuckles(p, 'Right', d))
        return T.hold(p, 'Left', fr[0], -T.dirn(fr, 'Left', 90, 30 + 60 * sw))
    return hook


def make(obj, key, cls, render_to=None, gear=None, only=None):
    """Builds obj (the figure in the work .blend), takes its class's moves and writes its bank as <key>. Returns the
    states it has. render_to: a folder for a picture of each take (with gear: [(side, id, hold kind, scale)]).
    only: the states to take (all of them if None)."""
    T = Target.attach(obj); T.build(cls); T.held = None          # (the lancer's hands are turned here, by _lancer)
    return bake(T, key, cls, render_to, gear, only)


HEROES_BANK = os.path.join(REPO, 'assets', 'models', 'clips', 'heroes')
HERO_REF = os.path.join(REPO, 'assets', 'models', 'heroes', 'paladin_m1.glb')


def make_hero(cls, glb=HERO_REF, render_to=None, gear=None, only=None):
    """The same takes for bm's hero bodies (the armour tiers and the recruits: one rig under them all, which any class
    may wear), made once a class on one of them and written as hero_<cls>: the bones by bm's names, every turn against
    the rig's rest, the pelvis's travel in that body's size (motionScale), which the game scales to each body's own. The
    fingers close on what the hand holds."""
    T = hero_target(glb, HEROES_BANK, key='bm_' + cls)
    T.write('Idle', [(f, T.BI(f)) for f in range(0, 72, 2)])
    return bake(T, 'hero_' + cls, cls, render_to, gear, only, hero=True)


def _fist(T, side, w_of):
    """A hook for take() on a body with fingers: they close round the grip (as GRIP_FROM's fist has them), as far as
    w_of(f) says."""
    if not hasattr(T, 'fistpose'):
        T.fistpose = T.mx_convert(src_pose(GRIP_FROM[0], GRIP_FROM[1]), T.mx_calibrate(GRIP_FROM[0]))
    F = T.fistpose
    bones = [n for n in T.order if n.startswith('mixamorig:%sHand' % side) and n != 'mixamorig:%sHand' % side]

    def hook(f, p):
        w = w_of(f)
        return T.mix(p, F, w, bones) if w > 1e-3 else p
    return hook


def bake(T, key, cls, render_to=None, gear=None, only=None, hero=False):
    grip = {s[0]: T.mx_grip(GRIP_FROM[0], GRIP_FROM[1], s) for s in ('Right', 'Left')}
    table = moves_for(cls); T.takes = {}
    props = cls == 'lancer' and not hero                     # a bm lancer holds gear like the rest, not props
    hand = 'R' if cls == 'lancer' and hero else HAND.get(cls, 'R')
    for state, mv in table.items():
        if only and state not in only: continue
        name, extra = (mv, {}) if isinstance(mv, str) else mv
        clip, t0, t1, blow, opts = MOVES[name]
        o = {**opts, **extra}
        up, lv, dn, sh = o.pop('up', None), o.pop('level', None), o.pop('down', None), o.pop('shield', 0)
        tl, aim, lift = o.pop('tilt', None), o.pop('aim', None), o.pop('lift', 0)
        th = o.get('then')                                     # a move's name: its stretch, at its own pace
        if isinstance(th, str): th = (th,)
        if isinstance(th, tuple) and th[0] in MOVES:           # (move, hold frames, its blow too)
            c2, a2, b2, bl2, o2 = MOVES[th[0]]
            o['then'] = (c2, a2, b2, o2.get('post', 1.0), o2.get('mirror', False), th[1] if len(th) > 1 else o2.get('hold', 0),
                         bl2 if len(th) > 2 and th[2] else None)
        fs = o.get('first')                                    # a lead-in: a move's name or (clip, from, to, speed)
        if isinstance(fs, str): fs = (fs,)
        if isinstance(fs, tuple):
            if fs[0] in MOVES:
                c1, a1, b1, _, o1 = MOVES[fs[0]]
                fs = (c1, a1, b1, fs[1] if len(fs) > 1 else 2.0, o1.get('mirror', False))
            o['first'] = fs
            if 'at' not in extra:                              # the main stretch's wind-up kept: its blow comes later
                o['at'] = o.get('at', 7) + max(2, round((fs[2] - fs[1]) * 24 / (fs[3] if len(fs) > 3 else 1.0)))
        if state in ('cheer', 'taunt') and 'blend_in' not in o:   # a celebration eases in, it doesn't snap
            o['blend_in'] = 6; o['at'] = o.get('at', 7) + 3; o.setdefault('blend_out', 10)
        if up is None and state in ('cheer', 'taunt'):        # held up in triumph (knives as in a fight)
            up = hand; aim = aim or ('bow' if cls == 'ranger' else 'raise' if cls == 'ninja' else 'stand')
        if 'keep' in o and isinstance(o['keep'], str):
            kept = o['keep']; o['keep'] = sum((ARM[s] for s in kept), [])
            o.setdefault('sides', ''.join(s for s in hand if s not in kept))
        o.setdefault('sides', hand)
        hooks = []
        if tl: hooks.append((tl[2] if len(tl) > 2 else 'take', 'tilt', tl, None))   # first, so the hands turn on the leaning body
        if props:
            hooks.append(lambda f, p, lv=lv, sh=sh, lift=lift: _lancer(T, lv, sh, _env(T, 'take' if lv else 'blow') if (lv or sh) else None, lift)(f, p))
        else:
            for s in (up or ''):
                side = 'Right' if s == 'R' else 'Left'
                how = aim or ('bow' if cls == 'ranger' and s == 'L' else 'stand' if cls in STANDS else 'raise')
                hooks.append(('take', _turn, side, how))
            for s in (lv or ''):
                hooks.append(('take', _turn, 'Right' if s == 'R' else 'Left', 'level'))
            for s in (dn or ''):
                hooks.append(('blow', _turn, 'Right' if s == 'R' else 'Left', 'down'))
            if up or lv or dn:                    # what turns a hand holds that hand's gear in the fist
                o['sides'] = ''.join(sorted(set(o['sides']) | set(up or '') | set(lv or '') | set(dn or ''), key='RL'.index))
        if hero:                                  # (the lancer's own hand too: a bm lancer holds gear, not props)
            for s in o['sides']:
                hooks.append(('take', None, 'Right' if s == 'R' else 'Left', None))
        if hooks:
            made = {}

            def after(f, p, hs=hooks):
                if made.get('ease') != T.ease:    # (made once a take: take() has set its ease and blow by now)
                    made['ease'] = T.ease; made['hs'] = []
                    for h in hs:
                        if callable(h): made['hs'].append(h); continue
                        mode, fn, side, how = h
                        if fn == 'tilt': made['hs'].append(_tilt(T, side[0], side[1], _env(T, mode))); continue
                        hold = 'bow' if side == 'Left' and cls == 'ranger' else 'dagger' if side == 'Left' else HOLDS.get(cls, 'pole')
                        made['hs'].append(_fist(T, side, _env(T, mode)) if fn is None else
                                          fn(T, side, grip[side[0]], _aims(T, side, how), _env(T, mode), hold))
                for h in made['hs']: p = h(f, p)
                return p
            o['after'] = after
        T.take('MX_' + state, clip, t0, t1, contact=blow, **o)
    os.makedirs(BANKS, exist_ok=True)
    if hero: T.mx_bank(os.path.join(BANKS, key), T.takes, grip=grip, names=lambda n: UE_BACK.get(n, n), extra={'motionScale': T.motion})
    else: T.mx_bank(os.path.join(BANKS, key), T.takes, grip=grip)
    if render_to:
        kit = Kit(T, gear or [], {'Right': (grip['R']), 'Left': (grip['L'])})
        kit.place_old(); kit.place_grip()
        def picks(nm):                       # the wind-up, the blow itself (the 4th picture), the follow-through
            tk = T.takes[nm]; at = tk['hits'][0]; end = tk['ease'][2]
            return [0, at * 0.4, at * 0.75, at, at + (end - at) * 0.15, at + (end - at) * 0.35, at + (end - at) * 0.6, end]
        render(T, kit, T.takes, ['Idle'] + list(T.takes), render_to, n=8, frames={nm: picks(nm) for nm in T.takes})
    return sorted(table)
