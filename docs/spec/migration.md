# RBC migration and parity

> **Normative.** Split verbatim from the approved plan (`plan/P1-PLAN.md` §13, approved 2026-10-27). Changing anything here needs a new entry in the [decision log](../decisions.md).

- **Only the prop getters are dropped** (`eventPropGetter`, `dayPropGetter`, `slotPropGetter`, `slotGroupPropGetter`). The codemod **converts each one to an equivalent `wrap` slot automatically**, and flags any it can't convert safely.
- **All other RBC capabilities have a home**, including the wrapper overrides and the less common props (`popupOffset`, `onKeyPressEvent`, `getDrilldownView`, `doShowMoreDrillDown`, `elementProps`, `enableAutoScroll`, `rtl`). The full prop-by-prop matrix is a P5 deliverable. Prop naming policy is O-2, `rtl` semantics O-4, and accessor migration O-3.
- **Localizers are removed.** The migration guide covers moving to `timeZone`, `locale` and `formats`.
- **Codemods and the migration guide** ship in slice S10.
