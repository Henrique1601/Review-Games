# 🎮 Review Games — Plataforma Full-Stack de Reviews de Jogos

[![Deploy Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://review-games-fronend.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

Plataforma full-stack moderna para descoberta, busca e reviews de videogames, integrando a **API da RAWG**, backend em Node.js/Express com persistência de logs no MongoDB e ambiente conteinerizado via Docker.

🔗 **Aplicação no Ar:** [https://review-games-fronend.vercel.app](https://review-games-fronend.vercel.app)

---

## 🌟 Funcionalidades

* **🔍 Busca e Catálogo Global de Jogos:** Integração em tempo real com a API pública da RAWG para consulta de sinopses, avaliações, gêneros e datas de lançamento.
* **📊 Armazenamento e Logs no MongoDB:** Persistência no MongoDB via Mongoose para auditoria e histórico de pesquisas realizadas.
* **🐳 Arquitetura Conteinerizada:** Dockerfiles otimizados para frontend e backend, orquestrados via \docker-compose.yml\.
* **⚡ Frontend Ultra Rápido:** Construído com React 19, Vite 7 e o novo Tailwind CSS v4.
* **🔄 CI/CD Automatizado:** Pipeline no GitHub Actions (\.github/workflows/node.yml\) para validação contínua de integridade.

---

## 🛠️ Tecnologias

### Frontend (\/frontend\)
* [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
* [Tailwind CSS v4](https://tailwindcss.com/)
* [Axios](https://axios-http.com/) & [React Router v7](https://reactrouter.com/)

### Backend (\/backend\)
* [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
* [MongoDB](https://www.mongodb.com/) com [Mongoose](https://mongoosejs.com/)
* [RAWG Video Games Database API](https://rawg.io/apidocs)

---

## 🚀 Como Executar

### Opção 1: Via Docker Compose (Recomendado)
\\\ash
git clone https://github.com/Henrique1601/Review-Games.git
cd Review-Games
docker-compose up --build
\\\

### Opção 2: Manualmente
\\\ash
# Backend
cd backend
npm install
npm start

# Frontend
cd ../frontend
npm install
npm run dev
\\\

---

## 📄 Licença

Distribuído sob a licença [MIT](LICENSE). Desenvolvido por [Henrique Bezerra](https://github.com/Henrique1601).