import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const POPULAR_SUGGESTIONS = [
  "Elden Ring",
  "Cyberpunk 2077",
  "Red Dead Redemption 2",
  "The Witcher 3",
  "God of War Ragnarök",
  "Hollow Knight",
];

function App() {
  const [gameName, setGameName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeVideoId, setActiveVideoId] = useState(null);

  // Injeção de Schema.org JSON-LD para SEO dinâmico
  useEffect(() => {
    if (!result?.game) return;

    const scriptId = "jsonld-game-data";
    let scriptTag = document.getElementById(scriptId);

    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.id = scriptId;
      scriptTag.type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "VideoGame",
      name: result.game.title,
      image: result.game.backgroundImage,
      description: result.game.description,
      datePublished: result.game.released,
      publisher: result.game.publishers?.[0]
        ? { "@type": "Organization", name: result.game.publishers[0] }
        : undefined,
      aggregateRating: result.game.rawRating
        ? {
            "@type": "AggregateRating",
            ratingValue: result.game.rawRating.toFixed(1),
            bestRating: "5",
            ratingCount: result.game.ratingsCount || 1,
          }
        : undefined,
    };

    scriptTag.textContent = JSON.stringify(schemaData);

    return () => {
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
    };
  }, [result]);

  const executeSearch = async (searchTerm) => {
    const term = searchTerm || gameName;
    if (!term || !term.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const baseUrl = import.meta.env.PROD
      ? "https://review-games-backend.vercel.app"
      : "http://localhost:3000";

    try {
      const res = await axios.get(`${baseUrl}/api/game?query=${encodeURIComponent(term.trim())}`);
      setResult(res.data);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        "Não foi possível obter os dados do jogo. Verifique sua conexão e tente novamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeSearch();
  };

  const handleSuggestionClick = (suggestion) => {
    setGameName(suggestion);
    executeSearch(suggestion);
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Header com Navegação */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🎮</span>
            <span className="font-bold text-lg tracking-tight text-white">Review Games</span>
            <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full font-mono">
              AI Powered
            </span>
          </div>

          <a
            href="https://github.com/Henrique1601/Review-Games"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1.5 transition-colors"
          >
            <span>GitHub</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Barra de Busca Hero */}
        <section className="max-w-3xl mx-auto text-center mb-10">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            Descubra a verdade sobre o jogo
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Agregação inteligente de notas RAWG, veredito por análise de sentimento de IA e dados oficiais do Metacritic.
          </p>

          <form onSubmit={handleSubmit} className="flex gap-2 p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl shadow-2xl focus-within:border-emerald-500/70 transition-colors">
            <label htmlFor="game-search" className="sr-only">Nome do jogo</label>
            <input
              id="game-search"
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Digite o nome do jogo (ex: Elden Ring)..."
              disabled={loading}
              className="flex-1 bg-transparent px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 text-sm sm:text-base focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !gameName.trim()}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-semibold rounded-lg text-sm sm:text-base cursor-pointer disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </form>

          {/* Sugestões Rápidas */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-zinc-400">
            <span className="text-zinc-500">Sugestões:</span>
            {POPULAR_SUGGESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleSuggestionClick(item)}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1 rounded-md border border-zinc-800/80 transition-colors cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* Estado de Carregamento (Skeleton Bento Grid) */}
        {loading && (
          <section aria-label="Carregando informações do jogo" className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="md:col-span-2 h-72 bg-zinc-900 border border-zinc-800/60 rounded-2xl"></div>
            <div className="h-72 bg-zinc-900 border border-zinc-800/60 rounded-2xl"></div>
            <div className="h-44 bg-zinc-900 border border-zinc-800/60 rounded-2xl"></div>
            <div className="h-44 bg-zinc-900 border border-zinc-800/60 rounded-2xl"></div>
            <div className="h-44 bg-zinc-900 border border-zinc-800/60 rounded-2xl"></div>
          </section>
        )}

        {/* Estado de Erro */}
        {error && (
          <div role="alert" className="max-w-xl mx-auto p-4 bg-red-950/40 border border-red-900/60 rounded-xl text-center text-red-200">
            <p className="font-medium text-sm">{error}</p>
            <button
              onClick={() => executeSearch()}
              className="mt-3 text-xs bg-red-900/50 hover:bg-red-800 px-3 py-1.5 rounded-lg text-white font-medium transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Resultados: Bento Grid */}
        {result && result.game && !loading && (
          <article className="space-y-6">
            {/* Bento Grid Principal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card Hero com Imagem de Fundo e Título */}
              <div className="md:col-span-2 relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 min-h-[300px] flex flex-col justify-end p-6 sm:p-8 group">
                {result.game.backgroundImage && (
                  <img
                    src={result.game.backgroundImage}
                    alt={result.game.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>

                <div className="relative z-10 space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {result.game.genres?.slice(0, 3).map((genre) => (
                      <span key={genre} className="bg-zinc-800/80 text-zinc-300 text-xs px-2.5 py-0.5 rounded-full border border-zinc-700/50 font-medium">
                        {genre}
                      </span>
                    ))}
                    {result.game.released && (
                      <span className="bg-zinc-800/80 text-zinc-300 text-xs px-2.5 py-0.5 rounded-full border border-zinc-700/50 font-medium">
                        Lançamento: {result.game.released}
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {result.game.title}
                  </h2>
                  <p className="text-zinc-300 text-xs sm:text-sm line-clamp-3 max-w-2xl leading-relaxed">
                    {result.game.description}
                  </p>
                </div>
              </div>

              {/* Card Veredito de Inteligência Artificial */}
              <div className="rounded-2xl border border-emerald-900/40 bg-gradient-to-br from-emerald-950/30 to-zinc-900 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-wider text-emerald-400 font-mono font-semibold">
                      Análise IA de Sentimento
                    </span>
                    <span className="text-xs text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-md">
                      RoBERTa NLP
                    </span>
                  </div>
                  <p className="text-lg font-bold text-emerald-200 leading-snug">
                    {result.aiVerdict}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/60 mt-4 space-y-1 text-xs text-zinc-400">
                  <p>Síntese gerada a partir das opiniões públicas de jogadores.</p>
                </div>
              </div>

              {/* Card Metacritic */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-amber-400 font-mono font-semibold">
                    Crítica Especializada
                  </span>
                  <p className="text-sm font-semibold text-zinc-200 mt-2">
                    {result.metaText}
                  </p>
                </div>
                {result.game.metacritic && (
                  <div className="mt-4 flex items-center gap-3">
                    <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${
                      result.game.metacritic >= 75
                        ? "bg-emerald-600 text-white"
                        : result.game.metacritic >= 50
                        ? "bg-yellow-600 text-white"
                        : "bg-red-600 text-white"
                    }`}>
                      {result.game.metacritic}
                    </span>
                    <span className="text-xs text-zinc-400">Pontuação global no Metacritic</span>
                  </div>
                )}
              </div>

              {/* Card Comunidade RAWG */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-blue-400 font-mono font-semibold">
                    Comunidade RAWG
                  </span>
                  <p className="text-2xl font-bold text-white mt-2">
                    {result.game.rating}
                  </p>
                </div>
                <p className="text-xs text-zinc-400 mt-4">
                  Baseado em milhares de votos de jogadores cadastrados no RAWG Video Games Database.
                </p>
              </div>

              {/* Card Ficha Técnica (Plataformas e Desenvolvedores) */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-purple-400 font-mono font-semibold">
                    Ficha Técnica
                  </span>
                  <div className="mt-2 space-y-1.5 text-xs">
                    {result.game.developers?.length > 0 && (
                      <p className="text-zinc-300">
                        <strong className="text-zinc-400">Desenvolvedora:</strong>{" "}
                        {result.game.developers.join(", ")}
                      </p>
                    )}
                    {result.game.publishers?.length > 0 && (
                      <p className="text-zinc-300">
                        <strong className="text-zinc-400">Publicadora:</strong>{" "}
                        {result.game.publishers.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1">
                  {result.game.platforms?.slice(0, 5).map((platform) => (
                    <span key={platform} className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Seção de Vídeos / Trailers (Cards Leves sob Demanda) */}
            {result.videos && result.videos.length > 0 && (
              <section className="mt-12">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>Trailers & Gameplay</span>
                  <span className="text-xs text-zinc-400 font-normal">({result.videos.length} vídeos)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.videos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => setActiveVideoId(video.id)}
                      className="group relative cursor-pointer bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/90 text-zinc-950 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                            ▶
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="text-xs font-semibold text-zinc-200 line-clamp-2 group-hover:text-white">
                          {video.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </main>

      {/* Modal Interativo para Reprodução do Vídeo sob Demanda */}
      {activeVideoId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveVideoId(null)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideoId(null)}
              aria-label="Fechar vídeo"
              className="absolute top-3 right-3 z-10 bg-zinc-950/80 hover:bg-zinc-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
              title="YouTube trailer player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            ></iframe>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 mt-16 py-6 text-center text-xs text-zinc-500">
        <p>Review Games — Desenvolvido com React 19, Tailwind CSS v4 e APIs públicas da RAWG, Hugging Face e YouTube.</p>
      </footer>
    </div>
  );
}

export default App;
