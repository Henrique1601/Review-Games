import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [gameName, SetGameName] = useState("");
  const [result, setResult] = useState(null);

  const handleSearch = async () => {
    const baseUrl = import.meta.env.PROD
      ? "https://review-games-backend.vercel.app"
      : "http://localhost:3000";
    const res = await axios.get(`${baseUrl}/api/game?query=${gameName}`);
    setResult(res.data);
  };

  return (
    <>
      <h1>Game Search</h1>
      <input
        value={gameName}
        onChange={(e) => SetGameName(e.target.value)}
        placeholder="Busque um jogo aqui..."
      />
      <button onClick={handleSearch}>Buscar</button>
      {result && (
        <div>
          <h2>{result.game.title}</h2>
          <p>Nota RAWG: {result.game.rating || "N/A"}</p>
          <p>Analise da IA: {result.aiVerdict}</p>
          <p>Analise da Metacritic: {result.MetaText}</p>
          {/* <img src={result.game.background_image} alt={result.game.name} />
          <p>Plataformas: {result.game.platforms.map(platform => platform.platform.name).join(', ')}</p>
          <p>Gêneros: {result.game.genres.map(genre => genre.name).join(', ')}</p>
          <p>Desenvolvedora: {result.game.developers.map(developer => developer.name).join(', ')}</p>
          <p>Editora: {result.game.publishers.map(publisher => publisher.name).join(', ')}</p>
          <p>Data de Lançamento: {result.game.released}</p>
          <p>Descrição: {result.game.description_raw}</p>  */}
          {result.videos.map((video) => (
            <iframe
              key={video.id}
              src={`https://www.youtube.com/embed/${video.id}`}
              title={video.title}></iframe>
          ))}
        </div>
      )}
    </>
  );
}

export default App;
