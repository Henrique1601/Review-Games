const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com MongoDB com fallback gracioso
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB conectado com sucesso"))
    .catch((err) => console.error("Aviso: Erro ao conectar MongoDB:", err.message));
} else {
  console.warn("Aviso: MONGO_URI não definida no ambiente.");
}

// Model de Logs de Pesquisas
const GameLog = mongoose.model(
  "GameLog",
  new mongoose.Schema({
    name: { type: String, required: true },
    query: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  })
);

// Rota de Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongoConnected: mongoose.connection.readyState === 1,
  });
});

// Rota Principal de Detalhes e Análise do Jogo
app.get("/api/game", async (req, res) => {
  const query = req.query.query;

  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "Parâmetro 'query' é obrigatório e não pode ser vazio." });
  }

  const cleanQuery = query.trim();

  try {
    // 1. Busca inicial do jogo na RAWG API
    const rawgApiKey = process.env.RAWG_API_KEY;
    if (!rawgApiKey) {
      return res.status(500).json({ error: "Chave RAWG_API_KEY não configurada no servidor." });
    }

    const searchRes = await axios.get(
      `https://api.rawg.io/api/games?key=${rawgApiKey}&search=${encodeURIComponent(cleanQuery)}&page_size=1`,
      { timeout: 8000 }
    );

    if (!searchRes.data.results || searchRes.data.results.length === 0) {
      return res.status(404).json({ error: `Nenhum jogo encontrado para a busca "${cleanQuery}".` });
    }

    const gameId = searchRes.data.results[0].id;

    // 2. Detalhes completos do jogo
    const detailsRes = await axios.get(
      `https://api.rawg.io/api/games/${gameId}?key=${rawgApiKey}`,
      { timeout: 8000 }
    );
    const game = detailsRes.data;

    if (!game) {
      return res.status(404).json({ error: "Detalhes do jogo não encontrados." });
    }

    // Persistência ativa de log no MongoDB (Auditoria)
    if (mongoose.connection.readyState === 1) {
      GameLog.create({
        name: game.name || cleanQuery,
        query: cleanQuery,
        timestamp: new Date(),
      }).catch((logErr) => console.warn("Erro ao persistir log:", logErr.message));
    }

    // 3. Formatação da Avaliação da Crítica e Comunidade
    let metaText = "Sem pontuação Metacritic disponível";
    if (game.metacritic) {
      const meta = game.metacritic;
      const evaluation =
        meta >= 85
          ? "Aclamação Universal ⭐⭐⭐⭐⭐"
          : meta >= 75
          ? "Geralmente Favorável 👍"
          : meta >= 60
          ? "Avaliações Médias 🤔"
          : "Avaliações Negativas 👎";
      metaText = `${evaluation} (Metacritic: ${meta}/100)`;
    }

    const ratingDisplay = game.rating
      ? `${game.rating.toFixed(1)} / 5 (${game.ratings_count || 0} avaliações)`
      : "Sem avaliações suficientes";

    // 4. Análise de Sentimento com HuggingFace (com isolamento de falha)
    let aiVerdict = "Poucas reviews textuais – confie na nota da crítica e comunidade.";
    try {
      const reviewRes = await axios.get(
        `https://api.rawg.io/api/games/${gameId}/reviews?key=${rawgApiKey}&page_size=15`,
        { timeout: 6000 }
      );

      const reviews = (reviewRes.data.results || [])
        .map((r) => r.text_clean || r.text || "")
        .filter((text) => text.trim().length > 25)
        .join(" . ");

      if (reviews.trim().length > 80 && process.env.HF_API_KEY) {
        const aiRes = await axios.post(
          "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment-latest",
          { inputs: reviews.substring(0, 1500) },
          {
            headers: {
              Authorization: `Bearer ${process.env.HF_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );

        if (Array.isArray(aiRes.data) && Array.isArray(aiRes.data[0])) {
          const scores = aiRes.data[0];
          const top = scores.reduce((prev, current) => (prev.score > current.score ? prev : current));

          let verdictLabel = "Misto / Divisivo";
          let verdictEmoji = "🤔";

          if (top.label === "LABEL_2" || top.label === "positive") {
            verdictLabel = "Recomendado pela crítica dos jogadores";
            verdictEmoji = "👍";
          } else if (top.label === "LABEL_0" || top.label === "negative") {
            verdictLabel = "Não recomendado / Recepção desfavorável";
            verdictEmoji = "👎";
          }

          aiVerdict = `${verdictLabel} ${verdictEmoji} (Confiança IA: ${(top.score * 100).toFixed(0)}%)`;
        }
      }
    } catch (aiErr) {
      console.warn("Aviso IA (HuggingFace): fallback ativado -", aiErr.message);
      if (game.metacritic >= 75) {
        aiVerdict = `Forte recomendação pela crítica especializada (${game.metacritic}/100 Metacritic).`;
      } else if (game.rating >= 4.0) {
        aiVerdict = `Altamente elogiado pela comunidade (${game.rating.toFixed(1)}/5 na RAWG).`;
      } else {
        aiVerdict = "Análise de IA temporariamente indisponível. Baseie-se nos dados da crítica.";
      }
    }

    // 5. Trailers no YouTube (com isolamento de cota / Graceful Degradation)
    let videos = [];
    try {
      if (process.env.YT_API_KEY) {
        const ytRes = await axios.get(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${encodeURIComponent(
            cleanQuery + " game trailer gameplay"
          )}&key=${process.env.YT_API_KEY}&type=video`,
          { timeout: 7000 }
        );

        videos = (ytRes.data.items || [])
          .filter((item) => item.id && item.id.kind === "youtube#video")
          .map((item) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail:
              item.snippet.thumbnails?.high?.url ||
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.default?.url,
            publishedAt: item.snippet.publishedAt,
          }));
      }
    } catch (ytErr) {
      console.warn("Aviso YouTube API (cota ou erro de rede):", ytErr.message);
      // Retorna array vazio em caso de erro, garantindo que o resto do payload seja entregue
    }

    // 6. Resposta consolidada
    res.json({
      game: {
        id: game.id,
        title: game.name,
        rating: ratingDisplay,
        rawRating: game.rating,
        ratingsCount: game.ratings_count || 0,
        metacritic: game.metacritic || null,
        backgroundImage: game.background_image,
        platforms: (game.platforms || []).map((p) => p.platform?.name).filter(Boolean),
        genres: (game.genres || []).map((g) => g.name).filter(Boolean),
        developers: (game.developers || []).map((d) => d.name).filter(Boolean),
        publishers: (game.publishers || []).map((p) => p.name).filter(Boolean),
        released: game.released || "Não informada",
        website: game.website || null,
        description:
          game.description_raw?.trim() ||
          game.description?.replace(/<[^>]*>/g, "")?.trim() ||
          "Sem descrição disponível.",
      },
      aiVerdict,
      metaText,
      videos,
    });
  } catch (error) {
    console.error("Erro geral na rota /api/game:", error.message);
    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({
      error: "Erro ao buscar informações do jogo.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Inicialização do servidor em ambientes não-serverless
const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🎮 Review Games Backend rodando na porta ${PORT}`);
  });
}

module.exports = app;