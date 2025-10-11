import React, { useEffect, useState } from "react";

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

function getSquarePosition(idx) {
  if (idx < 11) return { gridColumn: idx + 1, gridRow: 11 };
  if (idx < 20) return { gridColumn: 11, gridRow: 21 - idx };
  if (idx < 31) return { gridColumn: 31 - idx, gridRow: 1 };
  return { gridColumn: 1, gridRow: idx - 29 };
}

function GameBoard() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState(null);
  const [drawnCard, setDrawnCard] = useState("");

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/test-room");
    socket.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };
    setWs(socket);
    return () => socket.close();
  }, []);

  const sendMessage = () => {
    if (ws && input) {
      ws.send(input);
      setInput("");
    }
  };

  // Dummy card draw logic
  const chanceCards = [
    "Advance to Go", "Bank pays you dividend", "Go to Jail", "Pay poor tax"
  ];
  const communityCards = [
    "Doctor's fees", "From sale of stock you get $50", "Get out of Jail Free", "Go to Jail"
  ];

  const drawChance = () => {
    const card = chanceCards[Math.floor(Math.random() * chanceCards.length)];
    setDrawnCard(`Chance: ${card}`);
  };

  const drawCommunity = () => {
    const card = communityCards[Math.floor(Math.random() * communityCards.length)];
    setDrawnCard(`Community Chest: ${card}`);
  };

  return (
    <div>
      <h2>Game Board</h2>
      <div>
        {messages.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Send a message"
      />
      <button onClick={sendMessage}>Send</button>
      <div className="board-container">
        <div className="monopoly-board" style={{ position: "relative" }}>
          {squares.map((square, idx) => {
            let badge = null;
            if (chanceIndices.includes(idx)) {
              badge = (
                <span
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
                className="board-square"
                style={{
                  position: "absolute",
                  width: "60px",
                  height: "60px",
                  ...getSquarePosition(idx),
                  background: colorMap[square] || "#fff",
                  color: ["GO", "Jail", "Free Parking", "Go To Jail"].includes(square) ? "#fff" : "#222",
                  fontWeight: ["GO", "Jail", "Free Parking", "Go To Jail"].includes(square) ? "bold" : "normal",
                  border: "2px solid #333"
                }}
              >
                {square} {badge}
              </div>
            );
          })}
          {/* Center area for card draw */}
          <div className="monopoly-center">
            <div className="monopoly-title">Monopoly</div>
            <button onClick={drawChance}>
              Draw Chance Card
            </button>
            <button onClick={drawCommunity}>
              Draw Community Chest Card
            </button>
            {drawnCard && (
              <div className="drawn-card">
                {drawnCard}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameBoard;