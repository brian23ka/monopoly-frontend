import React, { useEffect, useRef, useState } from "react";
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

function getSquarePosition(idx) {
  if (idx < 11) return { gridColumn: idx + 1, gridRow: 11 };
  if (idx < 20) return { gridColumn: 11, gridRow: 21 - idx };
  if (idx < 31) return { gridColumn: 31 - idx, gridRow: 1 };
  return { gridColumn: 1, gridRow: idx - 29 };
}

function GameBoard() {
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const [connectionState, setConnectionState] = useState("offline");
  const [players, setPlayers] = useState([]);
  const [serverState, setServerState] = useState(null);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const joinTimeoutRef = useRef(null);
  const colors = ["#e4572e", "#167c80", "#d39b2a", "#7654a8", "#b94f83", "#4f78b8"];

  const currentPlayer = Math.max(0, players.findIndex((player) => player.name === serverState?.current_turn));
  const activePlayer = players[currentPlayer] || { name: "Waiting", money: 1500, position: 0, properties: [] };
  const currentSquare = squares[activePlayer.position] || "GO";
  const pendingPurchase = serverState?.pending_purchase == null ? null : squares[serverState.pending_purchase];
  const rolledThisTurn = Boolean(serverState?.turn_rolled);
  const isMyTurn = serverState?.current_turn === playerName;
  const ownedBy = (square) => players.findIndex((player) => player.properties.includes(squares.indexOf(square)));

  const sendAction = (action) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action, player: playerName }));
    }
  };

  const joinRoom = (event) => {
    event.preventDefault();
    const cleanRoom = roomId.trim().toLowerCase();
    const cleanName = playerName.trim();
    if (!cleanRoom || !cleanName) return;
    setError("");
    setConnectionState("connecting");
    setPlayerName(cleanName);
    setRoomId(cleanRoom);
    socketRef.current?.close();
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const configuredBackend = import.meta.env.VITE_BACKEND_URL?.trim();
    if (!configuredBackend && import.meta.env.PROD) {
      setError("The deployed app is missing VITE_BACKEND_URL. Set it to your Render backend URL and redeploy.");
      return;
    }
    const backendUrl = configuredBackend || `${protocol}://${window.location.hostname}:8000`;
    const socketUrl = backendUrl.replace(/\/$/, "").replace(/^http:/, "ws:").replace(/^https:/, "wss:");
    const socket = new WebSocket(`${socketUrl}/ws/${encodeURIComponent(cleanRoom)}`);
    socketRef.current = socket;
    joinTimeoutRef.current = window.setTimeout(() => {
      if (socket.readyState !== WebSocket.OPEN || !joined) {
        socket.close();
        setConnectionState("offline");
        setError("The game server took too long to respond. Check the backend URL and try again.");
      }
    }, 12000);
    socket.onopen = () => {
      setConnectionState("online");
      socket.send(JSON.stringify({ action: "join", player: cleanName }));
    };
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === "error") {
        window.clearTimeout(joinTimeoutRef.current);
        socket.close();
        setConnectionState("offline");
        setJoined(false);
        setError(payload.message);
        return;
      }
      if (payload.type === "state" && payload.state) {
        const joinedPlayer = payload.state.players.some((player) => player.name === cleanName);
        setServerState(payload.state);
        setPlayers(payload.state.players.map((player, index) => ({ ...player, color: colors[index % colors.length] })));
        if (joinedPlayer) {
          window.clearTimeout(joinTimeoutRef.current);
          setJoined(true);
        }
      }
    };
    socket.onclose = () => {
      window.clearTimeout(joinTimeoutRef.current);
      setConnectionState("offline");
      setJoined(false);
    };
    socket.onerror = () => {
      setConnectionState("offline");
      setError(`Could not connect to ${socketUrl}. Check VITE_BACKEND_URL and the Render backend.`);
    };
  };

  useEffect(() => () => {
    window.clearTimeout(joinTimeoutRef.current);
    socketRef.current?.close();
  }, []);

  const resetGame = () => {
    socketRef.current?.close();
    window.clearTimeout(joinTimeoutRef.current);
    setJoined(false);
    setPlayers([]);
    setServerState(null);
    setConnectionState("offline");
  };

  if (!joined) {
    return <main className="lobby-shell"><section className="lobby-card"><p className="eyebrow">ONLINE TABLE · UP TO 6 PLAYERS</p><h1>Monopoly <span>After Hours</span></h1><p className="lobby-copy">Open this page in multiple browser tabs, use the same room code, and take the city together.</p><form onSubmit={joinRoom} className="lobby-form"><label>Room code<input value={roomId} onChange={(event) => setRoomId(event.target.value)} placeholder="friday-night" autoComplete="off" disabled={connectionState === "connecting"} /></label><label>Your name<input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Alex" autoComplete="nickname" disabled={connectionState === "connecting"} /></label><button className="primary-button" type="submit" disabled={connectionState === "connecting"}>{connectionState === "connecting" ? "Connecting..." : "Join table"}</button></form>{error && <p className="connection-error">{error}</p>}<p className="server-hint">{connectionState === "connecting" ? "Waking the game server..." : connectionState === "online" ? "Connected, waiting for room confirmation..." : "Enter a room code to play online."}</p></section></main>;
  }

  const dice = serverState?.dice || [1, 1];
  const rolling = false;
  const gameOver = Boolean(serverState?.game_over);
  const message = serverState?.message || "Waiting for another player to join.";
  const drawnCard = serverState?.card;
  const buyProperty = () => sendAction("buy");
  const finishTurn = () => sendAction(pendingPurchase ? "pass" : "end_turn");
  const rollDice = () => { if (isMyTurn && !rolledThisTurn && !pendingPurchase && !gameOver) sendAction("roll"); };

  return (
    <main className="game-shell">
      <header className="topbar"><div><p className="eyebrow">ONLINE TABLE · {players.length}/6 PLAYERS</p><h1>Monopoly <span>After Hours</span></h1></div><button className="quiet-button" onClick={resetGame}>Leave game</button></header>
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
            {drawnCard && <div className="drawn-card"><span>Card</span>{drawnCard.message}</div>}
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