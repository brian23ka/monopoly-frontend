import React, { useState } from "react";

// Unicode dice faces: ⚀ ⚁ ⚂ ⚃ ⚄ ⚅
const diceFaces = ["\u2680", "\u2681", "\u2682", "\u2683", "\u2684", "\u2685"];

const Dice = () => {
  const [dice, setDice] = useState([1, 1]);
  const [rolling, setRolling] = useState(false);

  const rollDice = () => {
    setRolling(true);
    setTimeout(() => {
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      setDice([die1, die2]);
      setRolling(false);
    }, 500);
  };

  return (
    <div>
      <div style={{ fontSize: "4rem", margin: "1rem" }}>
        <span>{diceFaces[dice[0] - 1]}</span>
        <span style={{ marginLeft: "1rem" }}>{diceFaces[dice[1] - 1]}</span>
      </div>
      <button onClick={rollDice} disabled={rolling}>
        {rolling ? "Rolling..." : "Roll Dice"}
      </button>
    </div>
  );
};

export default Dice;