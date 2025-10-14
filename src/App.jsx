import GameBoard from "./components/GameBoard";
import Dice from "./components/Dice";

function App() {
  return (
    <div className="App">
      <h1>Monopoly Game</h1>
      <Dice />
      <GameBoard />
    </div>
  );
}

export default App;
