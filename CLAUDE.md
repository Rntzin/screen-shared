# Projeto: Tela — compartilhamento de tela/voz entre amigos (substituto do Discord)

## Objetivo
App web onde eu e amigos entramos numa sala por código (ex: `8944PE`) e
compartilhamos tela (com áudio), câmera e microfone. Uso diário, grupo pequeno
(5–10 pessoas). Sem IA, sem gravação, sem telefonia.

## Stack decidida
- **Servidor de mídia:** LiveKit (open-source, SFU WebRTC), self-hosted em VPS
  via Docker. Escolhi self-host em vez do LiveKit Cloud porque o plano grátis
  (5.000 participante-minutos e 50 GB egress/mês) não aguenta uso diário.
- **Frontend + backend de token:** Next.js (App Router) com
  `livekit-server-sdk`, `livekit-client`, `@livekit/components-react`,
  `@livekit/components-styles`.
- **TLS/reverse proxy:** Caddy (gerado pelo `livekit/generate`), com TURN.

## Infra
- VPS Ubuntu 24.04 (2 vCPU / 4 GB), datacenter no Brasil.
- DNS: `tela.<meu-dominio>` → LiveKit (wss), `turn.<meu-dominio>` → TURN.
- Config gerada com `docker run --rm -it -v $PWD:/output livekit/generate`
  (sem Redis, single node). Sobe com `docker compose up -d`.
- Portas: 80/443 tcp (Caddy), 7881 tcp, 50000–60000 udp, 3478 udp, 5349 tcp.
- `livekit.yaml`: `room.auto_create: true`.

## Arquitetura do app Next
- Páginas/layout/lobby: server components normais (SSR ok).
- `app/api/token/route.ts`: gera JWT com `AccessToken` + `addGrant`
  ({ roomJoin, room, canPublish, canSubscribe,
  canPublishSources: ['camera','microphone','screen_share','screen_share_audio'] }).
  Retorna `{ token, url }`. Secret NUNCA vai pro browser.
- `app/sala/[codigo]/page.tsx`: busca token e monta componente da sala.
- Componente da sala é `'use client'` e carregado com
  `dynamic(() => import(...), { ssr: false })` — WebRTC não roda no servidor.
  Usa `<LiveKitRoom token serverUrl connect>` + `<VideoConference />`.

## Variáveis de ambiente
LIVEKIT_URL=wss://tela.<meu-dominio>
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

## Requisitos de UX
- Lobby: campo de nome + código da sala (ou botão "criar sala" que gera código
  de 6 chars). Link direto `/sala/CODIGO` já entra.
- Screen share com áudio, boa qualidade pra jogo: `screenShareEncoding`
  com maxBitrate ~3–4 Mbps, maxFramerate 30 (opção 60).
- Layout: quem compartilha tela em destaque, demais em miniaturas.
- Mobile deve funcionar pelo menos como espectador.

## Status
[ ] VPS + LiveKit no ar
[ ] Next app com /api/token e sala funcionando
[ ] Lobby / criação de sala por código
[ ] Ajuste de qualidade do screen share
[ ] Deploy do frontend (Vercel ou mesmo VPS atrás do Caddy)

## Convenções
- TypeScript, App Router, sem Pages Router.
- Responder em português.
