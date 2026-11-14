/* Extra mini-game styles for the arcade */
.mini-game { width: min(100%, 640px); min-height: 260px; }
.mini-top {
  display: flex; justify-content: space-between; align-items: center; gap: 12px; margin: 10px 0 14px;
  color: #514b43; font-size: 12px; font-weight: 800;
}
.mini-board {
  position: relative; min-height: 220px; padding: 12px; border-radius: 16px; background: linear-gradient(180deg, #f5f0ff, #fff7ec);
  border: 1px solid #e9e1d5; display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 10px; overflow: hidden;
}
.mini-bubble-button {
  position: absolute; width: 40px; height: 40px; border: 0; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #fff, #ffb1c7 55%, #ff7cae 100%);
  color: #fff; font-size: 18px; box-shadow: 0 8px 0 #d96e9e; cursor: pointer;
}
.mini-choice-color, .mini-choice-digit, .mini-shape-choice, .mini-rainbow-gate {
  min-width: 70px; min-height: 52px; border: 0; border-radius: 12px; color: white; font-weight: 800; cursor: pointer; margin: 6px; box-shadow: 0 4px 0 rgba(0,0,0,0.12);
}
.mini-target {
  width: 100%; text-align: center; font-size: 18px; font-weight: 900; letter-spacing: 1px; color: #3d3a49; margin-bottom: 8px;
}
.mini-dice-display {
  font-size: 78px; line-height: 1; margin: 16px auto; text-shadow: 0 10px 0 rgba(0,0,0,0.08);
}
.mini-basket {
  position: absolute; bottom: 12px; left: 200px; width: 92px; height: 18px; border-radius: 12px; background: linear-gradient(180deg, #8f9dff, #6879f2);
  box-shadow: 0 8px 0 #4e58b4; pointer-events: none;
}
.mini-star-fall {
  position: absolute; left: 0; top: 0; font-size: 26px; pointer-events: none;
}
.mini-mole-cell {
  width: 60px; height: 60px; border-radius: 12px; border: 1px solid #e7deff; background: #fff; color: #4f4d5d; font-size: 22px; cursor: pointer;
}
.mini-mole-cell.active { background: #f8d6b5; border-color: #e5ba90; }
.mini-orb {
  position: absolute; left: 160px; top: 80px; width: 42px; height: 42px; border: 0; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #fff, #ffd86a 35%, #ff8a5b 100%);
  box-shadow: 0 0 0 6px rgba(255, 197, 86, 0.18); color: #fff; font-size: 22px; cursor: pointer;
}
.mini-tile {
  width: 62px; height: 62px; border-radius: 12px; border: 1px solid #d9d0ff; background: linear-gradient(180deg, #fff, #f2ebff); font-size: 24px; font-weight: 800; color: #322f43; cursor: pointer;
}
.mini-tile.done { opacity: 0.5; }
.mini-shape-choice { min-width: 80px; min-height: 60px; font-size: 28px; }
.mini-rainbow-gate { min-width: 92px; }
.mini-actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.mini-finish { margin: 0; color: #5a4a3e; font-weight: 800; }
@media (max-width: 560px) {
  .mini-board { min-height: 190px; }
  .mini-mole-cell { width: 48px; height: 48px; }
  .mini-tile { width: 52px; height: 52px; }
}
