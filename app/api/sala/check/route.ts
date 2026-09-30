import { NextRequest, NextResponse } from "next/server";
import { checkSalaSchema } from "@/lib/schemas";
import { roomService } from "@/lib/livekit-api";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = checkSalaSchema.safeParse(body);

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dados inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { codigo, modo } = parsed.data;

  try {
    const rooms = await roomService.listRooms([codigo]);
    const existe = rooms.length > 0;

    if (modo === "entrar" && !existe) {
      return NextResponse.json(
        { ok: false, error: "Sala não encontrada. Verifique o código." },
        { status: 404 }
      );
    }

    if (modo === "criar" && existe) {
      return NextResponse.json(
        { ok: false, error: "Esse código já está em uso. Tente outro." },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Não foi possível verificar a sala. Tente novamente." },
      { status: 502 }
    );
  }
}
