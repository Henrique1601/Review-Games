const express = require("express");
const cors = require("cors");
const axios = require("axios");
const nodemon = require("nodemon");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const moongose = require("mongoose");
moongose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.error("Erro ao conectar MongoDB:", err));

const GameLog = moongose.model("GameLog", {
  name: String,
  query: String,
  timestamp: { type: Date, default: Date.now },
});

app.get("/api/game", async (req, res) => {
  const query = req.query.query;
  try {
    // Busca o jogo na RAWG API
    const searchRes = await axios.get(
      `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${query}`,
    );
    if (!searchRes.data.results || searchRes.data.results.length === 0) {
      return res.status(404).json({ error: "Jogo não encontrado" });
    }
    const gameId = searchRes.data.results[0].id;
    const detailsRes = await axios.get(
      `https://api.rawg.io/api/games/${gameId}?key=${process.env.RAWG_API_KEY}`,
    );
    const game = detailsRes.data;

    if (!game) {
      return res.status(404).json({ error: "Jogo não encontrado" });
    }

    let MetaText 
    let aiVerdict = "Sem análise de IA disponível";
    let ratingDisplay = game.rating
      ? `${game.rating.toFixed(1)} / 5 (${game.ratings_count || 0} avaliações)`
      : "Sem nota ainda";

    // Reviews para IA
    let reviews = "";
    try {
      const reviewRes = await axios.get(
        `https://api.rawg.io/api/games/${game.id}/reviews?key=${process.env.RAWG_API_KEY}&page_size=20`,
      ); // 20 já basta, 100 pode ser overkill e lento
      reviews = reviewRes.data.results
        .map((r) => r.text_clean || r.text || "")
        .filter((text) => text.trim().length > 20) // filtra reviews muito curtas/inúteis
        .join(" . ");

      console.log(
        "Reviews encontradas:",
        reviewRes.data.results.length,
        " - Texto exemplo:",
        reviews.substring(0, 200),
      );
    } catch (err) {
      console.warn("Erro ao buscar reviews:", err.message);
    }

    if (reviews.trim().length > 100) {
      // Só chama IA se tiver texto decente
      try {
        const aiRes = await axios.post(
          'https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
          { inputs: reviews.substring(0, 1500) },
          {
            headers: {
              Authorization: `Bearer ${process.env.HF_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 30000, // evita travar muito
          },
        );
      
      console.log("Resposta da IA (raw):", JSON.stringify(aiRes.data));   

      const output = aiRes.data[0]; //[0]
      const top = output.reduce((a, b) => a.score > b.score ? a : b)

      let verdictText;
      let emoji = ''
      
      if (top.label === 'LABEL_2' ) {
      verdictText = `Sim, é bom! `;
      emoji = '👍'
    } else if (top.label === 'LABEL_0'){
      verdictText= `Não, evite... `;
      emoji = '👎'
    } else { 
      verdictText = `Misto, avalie por conta própria`;
      emoji = '🤔'
    }
    
    aiVerdict = `${verdictText} ${emoji} (confianca: ${(top.score * 100).toFixed(0)}%)`;
    
    // Fallback forte com Metacritic se IA não for positiva ou clara
    if (top.label !== 'LABEL_1' || top.score < 0.70 ) {
    if (game.metacritic) {
    const meta = game.metacritic;
    let metaText = meta >= 85 ? 'Ótimo pela crítica! ⭐⭐⭐⭐⭐' 
                  : meta >= 75 ? 'Muito bom 👍' 
                  : meta >= 65 ? 'Bom, vale tentar' 
                  : meta >= 50 ? 'Médio / divisivo 🤔' 
                  : 'Ruim pela crítica 👎';
    aiVerdict = `${aiVerdict}`;
    MetaText = `${metaText} (Metacritic: ${meta}/100)`;

  } else if (game.rating >= 4.0) {
    aiVerdict = `Nota dos jogadores alta: ${ratingDisplay} – Recomendado pela comunidade!`;
  }
}
    console.log('IA Verdict:', aiVerdict, ' - Raw output:', JSON.stringify(aiRes.data));

  } catch (aiErr) {
    console.error('Erro na IA:', aiErr.message);
    aiVerdict = 'Não foi possível analisar  (usando fallback)';
  }
} else {
  aiVerdict = 'Poucas reviews textuais – confie na nota RAWG/Metacritic';
}

    // Vídeos YouTube
    const ytRes = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query + " game trailer")}&key=${process.env.YT_API_KEY}`,
    );
    const videos = ytRes.data.items
      .filter((item) => item.id.kind === "youtube#video")
      .map((item) => ({ id: item.id.videoId, title: item.snippet.title }));

    res.json({
      game: {
        title: game.name,
        rating: ratingDisplay,
        background_image: game.background_image,
        platforms: game.platforms?.map((p) => p.platform.name) || [],
        genres: game.genres?.map((g) => g.name) || [],
        developers: game.developers?.map((d) => d.name) || [],
        publishers: game.publishers?.map((p) => p.name) || [],
        released: game.released,
        description_raw:
        game.description_raw?.substring(0, 500) + "..." || "Sem descrição",
      },
      aiVerdict,
      MetaText,
      videos,
    });
  } catch (error) {
    console.error("Erro geral:", error.message);
    res.status(500).json({ error: "Erro ao buscar informações do jogo" });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000 localmente");
});
