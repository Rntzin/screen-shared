"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  ParticipantTile,
  VideoTrack,
  AudioTrack,
  TrackToggle,
  DisconnectButton,
  useTracks,
  useParticipants,
  useRoomContext,
  LayoutContextProvider,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import {
  getTrackReferenceId,
  isTrackReference,
} from "@livekit/components-core";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import SalaLoading from "./sala-loading";

type AudioSettings = { muted: boolean; volume: number };

function SortableTile({ trackId, trackRef }: { trackId: string; trackRef: Parameters<typeof ParticipantTile>[0]["trackRef"] }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: trackId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative min-h-0 min-w-0 cursor-grab active:cursor-grabbing"
    >
      <ParticipantTile trackRef={trackRef} className="h-full w-full rounded-lg" />
    </div>
  );
}

function SalaLayout({ codigo }: { codigo: string }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [focusedIds, setFocusedIds] = useState<string[]>([]);
  const [hiddenFromFocus, setHiddenFromFocus] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [audioMap, setAudioMap] = useState<Record<string, AudioSettings>>({});
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [allMuted, setAllMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const room = useRoomContext();

  useEffect(() => {
    const handleUnload = () => { room.disconnect(); };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [room]);

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  const toggleAllMuted = useCallback(() => {
    setAllMuted((prev) => !prev);
  }, []);

  const [popover, setPopover] = useState<{
    identity: string;
    top: number;
    left: number;
  } | null>(null);
  const participants = useParticipants();

  const toggleHide = useCallback((identity: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(identity)) {
        next.delete(identity);
      } else {
        next.add(identity);
      }
      return next;
    });
  }, []);

  const getAudio = useCallback(
    (identity: string): AudioSettings =>
      audioMap[identity] ?? { muted: false, volume: 1 },
    [audioMap]
  );

  const toggleMute = useCallback((identity: string) => {
    setAudioMap((prev) => {
      const cur = prev[identity] ?? { muted: false, volume: 1 };
      return { ...prev, [identity]: { ...cur, muted: !cur.muted } };
    });
  }, []);

  const setVolume = useCallback((identity: string, volume: number) => {
    setAudioMap((prev) => {
      const cur = prev[identity] ?? { muted: false, volume: 1 };
      return { ...prev, [identity]: { ...cur, volume } };
    });
  }, []);

  const videoTracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: true }
  );

  const audioTracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: false }],
    { onlySubscribed: false }
  );

  const activeTracks = videoTracks.filter((t) => {
    if (!isTrackReference(t)) return false;
    if (t.publication?.isMuted) return false;
    return true;
  });

  const visibleTracks = activeTracks.filter(
    (t) => !hidden.has(t.participant.identity)
  );

  const activeIdentities = new Set(
    activeTracks.map((t) => t.participant.identity)
  );

  // Sincroniza focusedIds: remove tracks que sumiram, adiciona novos (se não escondidos pelo user)
  const visibleIdsSet = new Set(visibleTracks.map((t) => getTrackReferenceId(t)));
  const needsSync =
    focusedIds.some((id) => !visibleIdsSet.has(id)) ||
    [...visibleIdsSet].some((id) => !focusedIds.includes(id) && !hiddenFromFocus.has(id));

  if (needsSync) {
    const validIds = focusedIds.filter((id) => visibleIdsSet.has(id));
    const newIds = [...visibleIdsSet].filter(
      (id) => !validIds.includes(id) && !hiddenFromFocus.has(id)
    );
    queueMicrotask(() => setFocusedIds([...validIds, ...newIds]));
  }

  // Limpa hiddenFromFocus de tracks que não existem mais
  const staleHidden = [...hiddenFromFocus].some((id) => !visibleIdsSet.has(id));
  if (staleHidden) {
    queueMicrotask(() =>
      setHiddenFromFocus((prev) => {
        const next = new Set(prev);
        for (const id of next) {
          if (!visibleIdsSet.has(id)) next.delete(id);
        }
        return next;
      })
    );
  }

  // Tracks focados na ordem do drag
  const focusedTracks = focusedIds
    .filter((id) => visibleIdsSet.has(id))
    .map((id) => visibleTracks.find((t) => getTrackReferenceId(t) === id))
    .filter(Boolean);

  // Drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFocusedIds((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  // Toggle individual no carrossel — esconde/mostra do grid principal
  function toggleFocus(trackId: string) {
    const isFocused = focusedIds.includes(trackId);
    if (isFocused) {
      // Esconder: remove do foco e marca como escondido pelo user
      setFocusedIds((prev) => prev.filter((id) => id !== trackId));
      setHiddenFromFocus((prev) => new Set(prev).add(trackId));
    } else {
      // Mostrar: adiciona ao foco e remove do escondido
      setFocusedIds((prev) => [...prev, trackId]);
      setHiddenFromFocus((prev) => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
    }
  }

  // Grid columns baseado na quantidade
  const gridCols =
    focusedTracks.length <= 1
      ? "grid-cols-1"
      : focusedTracks.length === 2
        ? "grid-cols-1 md:grid-cols-2"
        : focusedTracks.length <= 4
          ? "grid-cols-2"
          : focusedTracks.length <= 6
            ? "grid-cols-2 md:grid-cols-3"
            : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="flex h-full">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-56 flex-col border-r border-border bg-background-secondary transition-transform duration-200 md:relative md:translate-x-0 ${
          sidebarOpen ? "flex translate-x-0" : "-translate-x-full md:flex"
        }`}
      >
        <div className="border-b border-border px-3 py-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Na sala — {participants.length}
            </h2>
            <button
              onClick={() => {
                const url = `${window.location.origin}/sala/${codigo}`;
                navigator.clipboard.writeText(url);
                setLinkCopiado(true);
                setTimeout(() => setLinkCopiado(false), 2000);
              }}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/15"
            >
              {linkCopiado ? "Copiado!" : "Copiar link"}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {participants.map((p) => {
            const isSpeaking = p.isSpeaking;
            const isLocal = p.isLocal;
            const audio = getAudio(p.identity);
            const isHidden = hidden.has(p.identity);
            return (
              <div key={p.identity} className="relative">
                <button
                  onClick={(e) => {
                    if (isLocal) return;
                    if (popover?.identity === p.identity) {
                      setPopover(null);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setPopover({
                        identity: p.identity,
                        top: rect.top,
                        left: rect.right + 4,
                      });
                    }
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                    isLocal ? "cursor-default" : "hover:bg-background-tertiary"
                  } ${isHidden ? "opacity-40" : ""} ${
                    audio.muted ? "line-through decoration-destructive/50" : ""
                  }`}
                >
                  <div
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      isSpeaking
                        ? "bg-primary"
                        : audio.muted
                          ? "bg-destructive/40"
                          : "bg-muted-foreground/40"
                    }`}
                  />
                  <span className="truncate text-foreground">
                    {p.name || p.identity}
                    {isLocal ? " (você)" : ""}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popover */}
      {popover &&
        (() => {
          const p = participants.find((x) => x.identity === popover.identity);
          if (!p || p.isLocal) return null;
          const audio = getAudio(p.identity);
          const isHidden = hidden.has(p.identity);
          const hasTrack = activeIdentities.has(p.identity);
          return (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPopover(null)} />
              <div
                className="fixed z-50 w-48 rounded-lg border border-border bg-background-secondary p-3 shadow-lg"
                style={{ top: popover.top, left: popover.left }}
              >
                <p className="mb-3 text-xs font-semibold text-foreground">
                  {p.name || p.identity}
                </p>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Volume
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={audio.muted ? 0 : audio.volume}
                  onChange={(e) => setVolume(p.identity, parseFloat(e.target.value))}
                  className="audio-slider mb-3 h-1 w-full cursor-pointer appearance-none rounded-full bg-muted"
                />
                <button
                  onClick={() => toggleMute(p.identity)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
                    audio.muted
                      ? "bg-destructive/15 text-destructive"
                      : "hover:bg-background-tertiary text-foreground"
                  }`}
                >
                  Silenciar
                  <div
                    className={`h-3 w-3 rounded-sm border ${
                      audio.muted ? "border-destructive bg-destructive" : "border-muted-foreground"
                    }`}
                  />
                </button>
                {hasTrack && (
                  <button
                    onClick={() => toggleHide(p.identity)}
                    className={`mt-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
                      isHidden
                        ? "bg-primary/15 text-primary"
                        : "hover:bg-background-tertiary text-foreground"
                    }`}
                  >
                    Ocultar vídeo
                    <div
                      className={`h-3 w-3 rounded-sm border ${
                        isHidden ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}
                    />
                  </button>
                )}
              </div>
            </>
          );
        })()}

      {/* Área principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Grid de foco — drag and drop */}
        <div data-lk-theme="default" className="flex-1 overflow-hidden p-2">
          {focusedTracks.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={focusedIds} strategy={rectSortingStrategy}>
                <div className={`grid h-full gap-2 ${gridCols}`}>
                  {focusedTracks.map((trackRef) => {
                    const trackId = getTrackReferenceId(trackRef!);
                    return (
                      <SortableTile
                        key={trackId}
                        trackId={trackId}
                        trackRef={trackRef}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Ninguém compartilhando tela ou câmera
              </p>
            </div>
          )}
        </div>

        {/* Carrossel */}
        {visibleTracks.length >= 2 && (
          <div className="flex h-24 shrink-0 items-center gap-2 overflow-x-auto border-t border-border bg-background-secondary px-3 py-2 md:h-28">
            {visibleTracks.map((trackRef) => {
              const trackId = getTrackReferenceId(trackRef);
              const isFocused = focusedIds.includes(trackId);
              return (
                <div
                  key={trackId}
                  className={`group relative h-full shrink-0 aspect-video overflow-hidden rounded-lg border-2 transition-all ${
                    isFocused
                      ? "border-primary ring-1 ring-primary/50"
                      : "border-transparent opacity-50 hover:opacity-80 hover:border-muted-foreground/30"
                  }`}
                >
                  {isTrackReference(trackRef) ? (
                    <VideoTrack trackRef={trackRef} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-background-tertiary">
                      <span className="text-xs text-muted-foreground">sem vídeo</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
                    <span className="text-[10px] leading-none text-white">
                      {trackRef.participant.name || trackRef.participant.identity}
                      {trackRef.source === Track.Source.ScreenShare ? " (tela)" : ""}
                    </span>
                  </div>
                  {/* Botão olho — mostrar/esconder do foco */}
                  <button
                    onClick={() => toggleFocus(trackId)}
                    className={`absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-md transition-all ${
                      isFocused
                        ? "bg-primary/20 text-primary opacity-0 group-hover:opacity-100"
                        : "bg-destructive/20 text-destructive opacity-80"
                    }`}
                    title={isFocused ? "Esconder" : "Mostrar"}
                  >
                    {isFocused ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Controles */}
        <div className="lk-control-bar-custom flex items-center justify-center gap-3 border-t border-border bg-background-secondary px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md bg-background-tertiary px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted md:hidden"
          >
            Na sala ({participants.length})
          </button>
          <TrackToggle source={Track.Source.Microphone} showIcon={true} />
          <TrackToggle source={Track.Source.Camera} showIcon={true} />
          <TrackToggle source={Track.Source.ScreenShare} showIcon={true}>
            Compartilhar
          </TrackToggle>

          {/* Mutar todos */}
          <button
            onClick={toggleAllMuted}
            className={allMuted ? "all-muted-active" : ""}
            title={allMuted ? "Ativar áudio de todos" : "Silenciar todos"}
          >
            {allMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l18 18"/>
                <path d="M3 14h3a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-7.5"/>
                <path d="M21 14h-1.5"/>
                <path d="M15 14h-2"/>
                <path d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v8"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 14h3a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v8a2 2 0 0 0 2 2h3"/>
              </svg>
            )}
          </button>

          {/* Tela cheia */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20"/>
                <polyline points="20 10 14 10 14 4"/>
                <line x1="14" y1="10" x2="21" y2="3"/>
                <line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"/>
                <polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/>
                <line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            )}
          </button>

          <DisconnectButton>Sair</DisconnectButton>
        </div>
      </div>

      {/* Áudio individual */}
      {audioTracks
        .filter((t) => !t.participant.isLocal && isTrackReference(t))
        .map((t) => {
          const ref = t as typeof t & { publication: NonNullable<(typeof t)["publication"]> };
          const audio = getAudio(ref.participant.identity);
          return (
            <AudioTrack
              key={getTrackReferenceId(ref)}
              trackRef={ref}
              volume={allMuted || audio.muted ? 0 : audio.volume}
            />
          );
        })}
    </div>
  );
}

export default function SalaClient({
  codigo,
  nome,
}: {
  codigo: string;
  nome: string;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: codigo, username: nome }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erro ao gerar token");
        }
        return res.json();
      })
      .then((data) => {
        setToken(data.token);
        setUrl(data.url);
      })
      .catch((err) => setErro(err.message));
  }, [codigo, nome]);

  if (erro) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">{erro}</p>
          <Link href="/" className="text-primary hover:underline">
            Voltar ao lobby
          </Link>
        </div>
      </div>
    );
  }

  if (!token || !url) {
    return <SalaLoading />;
  }

  return (
    <div className="h-screen bg-background">
      <LiveKitRoom
        token={token}
        serverUrl={url}
        connect={true}
        options={{
          audioCaptureDefaults: {
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true,
          },
          publishDefaults: {
            screenShareEncoding: {
              maxBitrate: 3_500_000,
              maxFramerate: 30,
            },
            screenShareSimulcastLayers: [],
          },
        }}
        onDisconnected={() => {
          router.push("/");
        }}
        className="h-full"
      >
        <LayoutContextProvider>
          <SalaLayout codigo={codigo} />
        </LayoutContextProvider>
      </LiveKitRoom>
    </div>
  );
}
