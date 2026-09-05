import React, { useEffect, useState } from "react";

// Unicode dice faces: ⚀ ⚁ ⚂ ⚃ ⚄ ⚅
const diceFaces = ["\u2680", "\u2681", "\u2682", "\u2683", "\u2684", "\u2685"];

const Dice = ({ dice, rolling, onRoll, disabled }) => {
  const [displayDice, setDisplayDice] = useState(dice);

  useEffect(() => {
    if (!rolling) {
      setDisplayDice(dice);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setDisplayDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]);
    }, 90);

    return () => window.clearInterval(interval);
  }, [dice, rolling]);

  return (
    <div className={`dice-panel ${rolling ? "is-rolling" : ""}`}>
      <div className="dice-label">Your roll</div>
      <div className="dice-display" aria-live="polite" aria-label={`Dice show ${displayDice[0]} and ${displayDice[1]}`}>
        <span className="die die-one">{diceFaces[displayDice[0] - 1]}</span>
        <span className="die die-two">{diceFaces[displayDice[1] - 1]}</span>
      </div>
      <button className="primary-button roll-button" onClick={onRoll} disabled={disabled || rolling}>
        {rolling ? "Rolling..." : "Roll dice"}
      </button>
    </div>
  );
};

export default Dice;