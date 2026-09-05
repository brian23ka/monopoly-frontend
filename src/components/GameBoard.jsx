import React, { useEffect, useState } from "react";
import Dice from "./Dice";

const squares = [
  // Bottom row (left to right)
  "GO", "Mediterranean Ave", "Community Chest", "Baltic Ave", "Income Tax",
  "Reading RR", "Oriental Ave", "Chance", "Vermont Ave", "Connecticut Ave", "Jail",
  // Right column (bottom to top, skip corners)
  "St. Charles Place", "Electric Company", "States Ave", "Virginia Ave",
  "Pennsylvania RR", "St. James Place", "Community Chest", "Tennessee Ave", "New York Ave",
  // Top row (right to left)
  "Free Parking", "Kentucky Ave", "Chance", "Indiana Ave", "Illinois Ave",
  "B&O RR", "Atlantic Ave", "Ventnor Ave", "Water Works", "Marvin Gardens", "Go To Jail",
  // Left column (top to bottom, skip corners)
  "Pacific Ave", "North Carolina Ave", "Community Chest", "Pennsylvania Ave",
  "Short Line RR", "Chance", "Park Place", "Luxury Tax", "Boardwalk"
];

// Color map for squares
const colorMap = {
  "GO": "#43a047",
  "Jail": "#e53935",
  "Free Parking": "#fbc02d",
  "Go To Jail": "#e53935",
  "Income Tax": "#bdbdbd",
  "Luxury Tax": "#bdbdbd",
  "Community Chest": "#2196f3",
  "Chance": "#ff9800",
  "Reading RR": "#6d4c41",
  "Pennsylvania RR": "#6d4c41",
  "B&O RR": "#6d4c41",
  "Short Line RR": "#6d4c41",
  "Electric Company": "#ffd600",
  "Water Works": "#00bcd4",
  "Mediterranean Ave": "#795548",
  "Baltic Ave": "#795548",
  "Oriental Ave": "#90caf9",
  "Vermont Ave": "#90caf9",
  "Connecticut Ave": "#90caf9",
  "St. Charles Place": "#ce93d8",
  "States Ave": "#ce93d8",
  "Virginia Ave": "#ce93d8",
  "St. James Place": "#ffb74d",
  "Tennessee Ave": "#ffb74d",
  "New York Ave": "#ffb74d",
  "Kentucky Ave": "#81c784",
  "Indiana Ave": "#81c784",
  "Illinois Ave": "#81c784",
  "Atlantic Ave": "#fff176",
  "Ventnor Ave": "#fff176",
  "Marvin Gardens": "#fff176",
  "Pacific Ave": "#4dd0e1",
  "North Carolina Ave": "#4dd0e1",
  "Pennsylvania Ave": "#4dd0e1",
  "Park Place": "#1976d2",
  "Boardwalk": "#1976d2"
};

const chanceIndices = squares
  .map((sq, idx) => sq === "Chance" ? idx : null)
  .filter(idx => idx !== null);

const communityIndices = squares
  .map((sq, idx) => sq === "Community Chest" ? idx : null)
  .filter(idx => idx !== null);

const properties = {
  "Mediterranean Ave": { price: 60, rent: 10 }, "Baltic Ave": { price: 60, rent: 12 },
  "Reading RR": { price: 200, rent: 25 }, "Oriental Ave": { price: 100, rent: 18 },
  "Vermont Ave": { price: 100, rent: 20 }, "Connecticut Ave": { price: 120, rent: 24 },
  "St. Charles Place": { price: 140, rent: 26 }, "Electric Company": { price: 150, rent: 28 },
  "States Ave": { price: 140, rent: 26 }, "Virginia Ave": { price: 160, rent: 30 },
  "Pennsylvania RR": { price: 200, rent: 25 }, "St. James Place": { price: 180, rent: 34 },
  "Tennessee Ave": { price: 180, rent: 36 }, "New York Ave": { price: 200, rent: 40 },
  "B&O RR": { price: 200, rent: 25 }, "Kentucky Ave": { price: 220, rent: 44 },
  "Indiana Ave": { price: 220, rent: 46 }, "Illinois Ave": { price: 240, rent: 50 },
  "Atlantic Ave": { price: 260, rent: 52 }, "Ventnor Ave": { price: 260, rent: 54 },
  "Water Works": { price: 150, rent: 28 }, "Marvin Gardens": { price: 280, rent: 58 },
  "Pacific Ave": { price: 300, rent: 62 }, "North Carolina Ave": { price: 300, rent: 64 },
  "Pennsylvania Ave": { price: 320, rent: 68 }, "Short Line RR": { price: 200, rent: 25 },
  "Park Place": { price: 350, rent: 70 }, "Boardwalk": { price: 400, rent: 80 }
};

const cardDeck = [
  { type: "Chance", text: "Bank error in your favor. Collect $100.", amount: 100 },
  { type: "Chance", text: "Advance to GO. Collect $200.", move: 0 },
  { type: "Community Chest", text: "You inherit $150.", amount: 150 },
  { type: "Community Chest", text: "Pay school fees of $50.", amount: -50 }
];

function getSquarePosition(idx) {
  if (idx < 11) return { gridColumn: idx + 1, gridRow: 11 };
  if (idx < 20) return { gridColumn: 11, gridRow: 21 - idx };
  if (idx < 31) return { gridColumn: 31 - idx, gridRow: 1 };
  return { gridColumn: 1, gridRow: idx - 29 };
}

function GameBoard() {
  const [players, setPlayers] = useState([
    { name: "You", money: 1500, position: 0, color: "#e4572e", properties: [] },
    { name: "Cleo", money: 1500, position: 0, color: "#167c80", properties: [] }
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [dice, setDice] = useState([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [rolledThisTurn, setRolledThisTurn] = useState(false);
  const [message, setMessage] = useState("Roll the dice to start your turn.");
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [drawnCard, setDrawnCard] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  const activePlayer = players[currentPlayer];
  const currentSquare = squares[activePlayer.position];
  const ownedBy = (square) => players.findIndex((player) => player.properties.includes(square));

  useEffect(() => {
    if (players.some((player) => player.money < 0)) {
      setGameOver(true);
      setMessage(`${players.find((player) => player.money < 0)?.name} went bankrupt. ${players.find((player) => player.money >= 0)?.name} wins!`);
    }
  }, [players]);

  const finishTurn = () => {
    setCurrentPlayer((player) => (player + 1) % players.length);
    setRolledThisTurn(false);
    setPendingPurchase(null);
    setDrawnCard(null);
    setMessage(`${currentPlayer === 0 ? "Cleo" : "You"}'s turn. Roll when you're ready.`);
  };

  const resolveLanding = (position) => {
    const square = squares[position];
    if (position < activePlayer.position && position !== 0) {
      setPlayers((current) => current.map((player, index) => index === currentPlayer ? { ...player, money: player.money + 200 } : player));
      setMessage(`${activePlayer.name} passed GO and collected $200.`);
    }
    if (square === "Go To Jail") {
      setPlayers((current) => current.map((player, index) => index === currentPlayer ? { ...player, position: 10 } : player));
      setMessage(`${activePlayer.name} was sent to jail.`);
      return;
    }
    if (square === "Income Tax" || square === "Luxury Tax") {
      const tax = square === "Income Tax" ? 200 : 100;
      setPlayers((current) => current.map((player, index) => index === currentPlayer ? { ...player, money: player.money - tax } : player));
      setMessage(`${activePlayer.name} paid $${tax} ${square.toLowerCase()}.`);
      return;
    }
    if (chanceIndices.includes(position) || communityIndices.includes(position)) {
      const card = cardDeck[Math.floor(Math.random() * cardDeck.length)];
      setDrawnCard(card);
      setPlayers((current) => current.map((player, index) => index === currentPlayer ? { ...player, money: player.money + (card.amount || 0), position: card.move === 0 ? 0 : player.position } : player));
      setMessage(`${activePlayer.name} drew a card.`);
      return;
    }
    if (properties[square] && ownedBy(square) === -1) {
      setPendingPurchase(square);
      setMessage(`${square} is available for $${properties[square].price}.`);
      return;
    }
    if (properties[square] && ownedBy(square) !== currentPlayer) {
      const owner = ownedBy(square);
      const rent = properties[square].rent;
      setPlayers((current) => current.map((player, index) => index === currentPlayer ? { ...player, money: player.money - rent } : index === owner ? { ...player, money: player.money + rent } : player));
      setMessage(`${activePlayer.name} paid $${rent} rent to ${players[owner].name}.`);
      return;
    }
    setMessage(`${activePlayer.name} landed on ${square}.`);
  };

  const rollDice = () => {
    if (rolling || rolledThisTurn || gameOver || pendingPurchase) return;
    setRolledThisTurn(true);
    setRolling(true);
    window.setTimeout(() => {
      const nextDice = [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
      const nextPosition = (activePlayer.position + nextDice[0] + nextDice[1]) % squares.length;
      setDice(nextDice);
      setPlayers((current) => current.map((player, index) => index === currentPlayer ? { ...player, position: nextPosition } : player));
      setRolling(false);
      resolveLanding(nextPosition);
    }, 650);
  };

  const buyProperty = () => {
    const property = properties[pendingPurchase];
    if (!property || activePlayer.money < property.price) return;
    setPlayers((current) => current.map((player, index) => index === currentPlayer ? { ...player, money: player.money - property.price, properties: [...player.properties, pendingPurchase] } : player));
    setMessage(`${activePlayer.name} bought ${pendingPurchase}.`);
    setPendingPurchase(null);
  };

  const resetGame = () => window.location.reload();

  return (
    <main className="game-shell">
      <header className="topbar"><div><p className="eyebrow">PASS & PLAY · 2 PLAYERS</p><h1>Monopoly <span>After Hours</span></h1></div><button className="quiet-button" onClick={resetGame}>New game</button></header>
      <section className="game-layout">
        <aside className="side-panel left-panel"><div className="panel-heading"><span>Players</span><span className="turn-chip">Turn {currentPlayer + 1}</span></div>
          {players.map((player, index) => <div className={`player-card ${currentPlayer === index ? "active-player" : ""}`} key={player.name}><span className="player-token" style={{ background: player.color }}>{index + 1}</span><div><strong>{player.name}</strong><small>{player.properties.length} properties</small></div><b>${player.money}</b></div>)}
          <div className="objective"><span>WIN CONDITION</span><strong>Bankrupt your rival</strong><p>Buy streets, charge rent, and be the last player standing.</p></div>
        </aside>
        <div className="board-container">
        <div className="monopoly-board" style={{ position: "relative" }}>
          {squares.map((square, idx) => {
            let badge = null;
            if (chanceIndices.includes(idx)) {
              badge = (
                <span
                  className="cell-badge chance-badge"
                  style={{
                    background: "#ff9800",
                    color: "#fff",
                    fontSize: "0.7em",
                    padding: "2px 6px",
                    borderRadius: "6px",
                    marginLeft: "4px"
                  }}
                >
                  ?
                </span>
              );
            }
            if (communityIndices.includes(idx)) {
              badge = (
                <span
                  className="cell-badge chest-badge"
                  style={{
                    background: "#2196f3",
                    color: "#fff",
                    fontSize: "0.7em",
                    padding: "2px 6px",
                    borderRadius: "6px",
                    marginLeft: "4px"
                  }}
                >
                  🃏
                </span>
              );
            }
            return (
              <div
                key={idx}
                className={`board-square ${activePlayer.position === idx ? "current-square" : ""} ${properties[square] ? "property-cell" : ""} ${["Chance", "Community Chest"].includes(square) ? "card-cell" : ""} ${square.includes("RR") ? "railroad-cell" : ""} ${["Electric Company", "Water Works"].includes(square) ? "utility-cell" : ""} ${["GO", "Jail", "Free Parking", "Go To Jail"].includes(square) ? "corner-cell" : ""}`}
                style={{
                  position: "absolute",
                  ...getSquarePosition(idx),
                  background: colorMap[square] || "#fff",
                  color: ["GO", "Jail", "Free Parking", "Go To Jail"].includes(square) ? "#fff" : "#222",
                  fontWeight: ["GO", "Jail", "Free Parking", "Go To Jail"].includes(square) ? "bold" : "normal",
                  border: "2px solid #333"
                }}
              >
                <span className="square-name">{square}</span> {badge}
                {players.map((player, playerIndex) => player.position === idx && <span className="board-token" key={player.name} style={{ background: player.color, transform: `translateX(${playerIndex * 13}px)` }}>{playerIndex + 1}</span>)}
                {ownedBy(square) !== -1 && <span className="owner-mark" style={{ background: players[ownedBy(square)].color }} />}
              </div>
            );
          })}
          <div className="monopoly-center">
            <p className="center-kicker">THE CITY IS YOURS</p><div className="monopoly-title">MONOPOLY</div><div className="center-divider" /><p className="center-status">{message}</p>
            {drawnCard && <div className="drawn-card"><span>{drawnCard.type}</span>{drawnCard.text}</div>}
          </div>
        </div>
        </div>
        <aside className="side-panel right-panel"><div className="panel-heading"><span>{activePlayer.name}'s move</span><span className="location-dot" /></div>
          <div className="location-card"><small>YOU ARE HERE</small><strong>{currentSquare}</strong><span>{properties[currentSquare] ? `$${properties[currentSquare].price} · $${properties[currentSquare].rent} rent` : "Action space"}</span></div>
          <Dice dice={dice} rolling={rolling} onRoll={rollDice} disabled={gameOver || rolledThisTurn || Boolean(pendingPurchase)} />
          {pendingPurchase && <div className="purchase-card"><small>AVAILABLE TO BUY</small><strong>{pendingPurchase}</strong><span>${properties[pendingPurchase].price}</span><button className="primary-button" onClick={buyProperty} disabled={activePlayer.money < properties[pendingPurchase].price}>Buy property</button><button className="text-button" onClick={finishTurn}>Pass</button></div>}
          {!pendingPurchase && !gameOver && <button className="text-button end-turn" onClick={finishTurn}>End turn</button>}
          {gameOver && <div className="game-over"><span>GAME OVER</span><strong>{message}</strong><button className="primary-button" onClick={resetGame}>Play again</button></div>}
        </aside>
      </section>
    </main>
  );
}

export default GameBoard;