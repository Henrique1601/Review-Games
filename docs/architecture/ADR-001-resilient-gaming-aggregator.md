---
title: ADR-001 - Arquitetura Resiliente de Agregação de Games e UI de Alto Desempenho
status: Aceito
date: 2026-09-24
tags:
  - adr
  - backend
  - frontend
  - performance
  - resilience
---

# ADR-001: Arquitetura Resiliente de Agregação de Games e UI de Alto Desempenho

## Contexto e Problema
O Review Games integra dados da API da RAWG, análise de sentimentos com HuggingFace e trailers via YouTube API.
Anteriormente:
1. Uma falha de rede ou esgotamento de quota na API do YouTube (100 unidades/busca) causava erro 500 em toda a requisição, impedindo a exibição dos dados já obtidos da RAWG.
2. No frontend, até 20 `<iframe>` do YouTube eram montados síncronamente na página, causando degradação severa de performance no navegador.
3. As pesquisas dos usuários não estavam sendo gravadas no MongoDB, inviabilizando auditoria e histórico.

## Decisões Tomadas

### 1. Degradação Graciosa no Backend (`Graceful Degradation`)
- O serviço RAWG permanece como a fonte da verdade primária.
- As chamadas para HuggingFace e YouTube são envolvidas em blocos de proteção independentes com timeouts estritos (7 a 10 segundos).
- Em caso de falha ou quota estourada no YouTube, a API retorna `videos: []` e prossegue com a entrega dos dados completos do jogo.

### 2. UI Baseada em Bento Grid e Modais sob Demanda
- Substituição da renderização massiva de iframes por cards leves com thumbnails estáticas (`hqdefault.jpg`) e botão Play.
- O `<iframe>` do YouTube é injetado dinamicamente apenas quando o usuário clica para assistir a um trailer específico, em modal acessível.
- Aplicação das diretrizes de Emil Kowalski (`:active scale(0.97)` e curvas `cubic-bezier(0.23, 1, 0.32, 1)`).

### 3. Persistência de Auditoria no MongoDB
- O modelo `GameLog` registra assincronamente o termo pesquisado, o título resolvido e a estampa de tempo, sem bloquear o response ao cliente.

## Consequências
- **Positivas:**
  - Disponibilidade da plataforma significativamente superior contra instabilidades de APIs terceiras.
  - Redução drástica no consumo de memória e tempo de renderização do cliente.
  - Conformidade com SEO (Schema.org JSON-LD injetado dinamicamente) e WCAG 2.1 AA.
- **Negativas / Atenção:**
  - Necessidade de monitoramento das cotas da chave do YouTube caso o volume de acessos cresça consideravelmente.
