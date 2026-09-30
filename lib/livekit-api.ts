import { RoomServiceClient } from "livekit-server-sdk";

const livekitUrl = process.env.LIVEKIT_URL ?? "";
// RoomServiceClient precisa de https://, não wss://
const httpUrl = livekitUrl.replace("wss://", "https://").replace("ws://", "http://");

export const roomService = new RoomServiceClient(
  httpUrl,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);
