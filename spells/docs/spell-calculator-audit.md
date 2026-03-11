# Spell Calculator Audit

Scope:
- Audit only spells currently shown on the spell calculator page.
- For each spell, confirm:
  - base additive calculator modifiers
  - additive self-cast scaling we actually want to support now
  - special/lore effects that should remain notes only
- Calculator outputs in scope:
  - non_bolt_ds
  - bolt_ds
  - as_physical
  - as_bolt
  - td_spiritual
  - td_elemental
  - td_mental
  - cs_spiritual
  - cs_elemental
  - cs_mental
  - cs_sorcerer
  - cs_bard
  - dodge_ranks
  - uaf
  - strength_bonus

Status legend:
- [ ] not audited
- [x] audited and corrected
- [-] display only / note-only effect; no additive calculator math expected

Recent second-pass corrections:
- 503 Thurfel's Ward
- 507 Elemental Deflection
- 712 Cloak of Shadows
- 905 Prismatic Guard
- 1019 Song of Mirrors
- 1035 Song of Tonis
- 1119 Strength of Will
- 1130 Intensity
- 1601 Mantle of Faith
- 1610 Higher Vision
- 1617 Zealot
- 1619 Faith Shield

## Minor Spiritual
- [x] 101 Spirit Warding I
- [x] 102 Spirit Barrier
- [x] 103 Spirit Defense
- [x] 107 Spirit Warding II
- [-] 115 Fasthr's Reward
- [x] 117 Spirit Strike
- [x] 120 Lesser Shroud
- [x] 140 Wall of Force

## Major Spiritual
- [x] 202 Spirit Shield
- [-] 207 Purify Air
- [-] 209 Untrammel
- [x] 211 Bravery
- [x] 215 Heroism
- [x] 219 Spell Shield

## Cleric
- [x] 303 Prayer of Protection
- [x] 307 Benediction
- [x] 310 Warding Sphere
- [x] 313 Prayer
- [-] 319 Soul Ward

## Minor Elemental
- [x] 401 Elemental Defense I
- [x] 406 Elemental Defense II
- [x] 414 Elemental Defense III
- [x] 425 Elemental Targeting
- [x] 430 Elemental Barrier

## Major Elemental
- [x] 503 Thurfel's Ward
- [x] 507 Elemental Deflection
- [x] 508 Elemental Bias
- [x] 509 Strength
- [x] 513 Elemental Focus
- [-] 520 Stone Skin
- [-] 540 Temporal Reversion

## Ranger
- [x] 601 Natural Colors
- [x] 602 Resist Elements
- [-] 605 Barkskin
- [x] 606 Phoen's Strength
- [x] 608 Camouflage
- [x] 613 Self Control
- [x] 618 Mobility
- [x] 625 Nature's Touch
- [x] 640 Wall of Thorns
- [-] 650 Assume Aspect

## Sorcerer
- [-] 704 Phase
- [x] 712 Cloak of Shadows
- [x] 715 Curse (Star)
- [-] 735 Ensorcell

## Wizard
- [-] 902 Minor Elemental Edge
- [x] 905 Prismatic Guard
- [x] 911 Mass Blur
- [x] 913 Melgorehn's Aura
- [x] 919 Wizard's Shield

## Bard
- [x] 1003 Fortitude Song
- [-] 1006 Song of Luck
- [x] 1007 Kai's Triumph Song
- [x] 1010 Song of Valor
- [x] 1019 Song of Mirrors
- [x] 1035 Song of Tonis

## Empath
- [x] 1109 Empathic Focus
- [x] 1119 Strength of Will
- [-] 1125 Troll's Blood
- [x] 1130 Intensity
- [-] 1150 Regeneration

## Minor Mental
- [-] 1202 Iron Skin
- [x] 1204 Foresight
- [x] 1208 Mindward
- [x] 1209 Dragonclaw
- [-] 1214 Brace
- [-] 1215 Blink
- [x] 1216 Focus Barrier
- [x] 1220 Premonition

## Paladin
- [x] 1601 Mantle of Faith
- [-] 1605 Arm of the Arkati
- [x] 1606 Dauntless
- [-] 1608 Defense of the Faithful
- [x] 1609 Divine Shield
- [x] 1610 Higher Vision
- [-] 1611 Patron's Blessing
- [-] 1612 Faith's Clarity
- [-] 1616 Vigor
- [x] 1617 Zealot
- [x] 1619 Faith Shield

## Arcane
- [-] 1701 Arcane Decoy
- [-] 1705 Martial Prowess
- [-] 1706 Flaming Aura
- [x] 1711 Mystic Focus
- [x] 1712 Spirit Guard
- [-] 1720 Arcane Barrier
