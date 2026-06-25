import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

const TARGET_DATE = new Date("2026-06-27T00:00:00+02:00").getTime();

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return useMemo(() => {
    const diff = Math.max(0, target - now);
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { days, hours, minutes, seconds };
  }, [now, target]);
}
import heroAsset from "@/assets/mante-hero.png";
import flashAsset from "@/assets/mante-flash.png";
import imperiaLogo from "@/assets/imperia-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MANTE" },
      { name: "description", content: "MANTE — official site." },
      { property: "og:title", content: "MANTE" },
      { property: "og:description", content: "MANTE — official site." },
      { property: "og:image", content: heroAsset },
    ],
  }),
  component: Index,
});

type Phase = "black" | "reveal" | `burst${number}` | `flash${number}` | `gap${number}`;

const schedule: { phase: Phase; at: number }[] = (() => {
  const out: { phase: Phase; at: number }[] = [];
  let t = 700;
  const push = (p: Phase, dt: number) => {
    out.push({ phase: p, at: t });
    t += dt;
  };

  push("burst1", 80);
  push("flash1", 120);
  push("gap1", 357);

  for (let i = 2; i <= 6; i++) {
    push(`burst${i}` as Phase, 25);
    push(`flash${i}` as Phase, 40);
    if (i < 6) push(`gap${i}` as Phase, 90);
  }

  out.push({ phase: "reveal", at: t });
  return out;
})();

function PlayButton({ isPlaying, onClick, className }: { isPlaying: boolean; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPlaying ? "Pauziraj glazbu" : "Pusti glazbu"}
      className={`flex items-center gap-3 rounded-full border border-white/25 bg-black/40 backdrop-blur-md transition-all duration-700 hover:bg-white/10 hover:text-white text-white/80 uppercase tracking-[0.4em] ${className}`}
    >
      <span className="relative flex h-3 w-3 items-center justify-center">
        {isPlaying ? (
          <span className="flex h-3 w-3 items-end justify-between">
            <span className="w-[3px] bg-current animate-pulse" style={{ height: "100%" }} />
            <span className="w-[3px] bg-current animate-pulse" style={{ height: "60%", animationDelay: "150ms" }} />
            <span className="w-[3px] bg-current animate-pulse" style={{ height: "80%", animationDelay: "300ms" }} />
          </span>
        ) : (
          <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current">
            <polygon points="2,1 11,6 2,11" />
          </svg>
        )}
      </span>
      <span>{isPlaying ? "Pauza" : "Pusti"}</span>
    </button>
  );
}

function Index() {
  const [phase, setPhase] = useState<Phase>("black");
  const [showCountdown, setShowCountdown] = useState(false);
  const [compact, setCompact] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { days, hours, minutes, seconds } = useCountdown(TARGET_DATE);

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try {
        a.muted = false;
        a.volume = 1;
        await a.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else {
      a.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const timers = schedule.map(({ phase: p, at }) =>
      setTimeout(() => setPhase(p), at),
    );
    const revealAt = schedule.find((s) => s.phase === "reveal")?.at ?? 0;
    const compactTimer = setTimeout(
      () => {
        setCompact(true);
        setShowCountdown(true);
      },
      revealAt + 500 + 1000,
    );
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(compactTimer);
    };
  }, []);

  const revealed = phase === "reveal";
  const isFlash = phase.startsWith("flash");
  const isBurst = phase.startsWith("burst");
  const isFirstHit = phase === "burst1" || phase === "flash1";
  const flashVisible = isFlash;
  const showWhiteBurst = isBurst;

  const softMask =
    "radial-gradient(ellipse 60% 75% at 50% 50%, rgba(0,0,0,1) 35%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0) 92%)";

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <audio
        ref={audioRef}
        src="/wants-and-needs.mp3"
        loop
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Play button — mobile only (fixed bottom-right) */}
      <PlayButton
        isPlaying={isPlaying}
        onClick={togglePlay}
        className={`md:hidden fixed bottom-6 right-6 z-50 px-4 py-2.5 text-[10px] ${
          revealed ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <img
        src={heroAsset}
        alt="Mante"
        className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[2200ms] ease-out ${
          revealed ? "opacity-90" : "opacity-0"
        }`}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 transition-opacity duration-[2200ms] ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          opacity: revealed ? 0 : flashVisible ? 1 : 0,
          transition: revealed
            ? "opacity 2200ms ease-out"
            : isFirstHit
              ? "opacity 80ms ease-out"
              : "opacity 50ms linear",
        }}
        aria-hidden
      >
        <img
          src={flashAsset}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          style={{
            filter: "contrast(1.05) brightness(0.95)",
            opacity: 0.92,
            maskImage: softMask,
            WebkitMaskImage: softMask,
          }}
        />
      </div>

      <div
        className={`pointer-events-none absolute inset-0 z-25 transition-opacity ${
          showWhiteBurst
            ? "opacity-100 duration-[30ms]"
            : "opacity-0 duration-[220ms]"
        }`}
        style={{
          backgroundImage: `url(${flashAsset})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "blur(28px) brightness(2.2) saturate(0)",
          mixBlendMode: "screen",
        }}
        aria-hidden
      />

      <div
        className={`pointer-events-none absolute inset-0 z-30 bg-white transition-opacity ${
          showWhiteBurst
            ? "opacity-100 duration-[30ms]"
            : "opacity-0 duration-[180ms]"
        }`}
        style={{
          maskImage: `url(${flashAsset})`,
          WebkitMaskImage: `url(${flashAsset})`,
          maskSize: "cover",
          WebkitMaskSize: "cover",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          filter:
            "drop-shadow(0 0 10px rgba(255,255,255,1)) drop-shadow(0 0 28px rgba(255,255,255,0.85)) drop-shadow(0 0 60px rgba(255,255,255,0.6)) drop-shadow(0 0 110px rgba(255,255,255,0.35))",
        }}
        aria-hidden
      />

      <div
        className={`relative z-10 min-h-screen p-6 md:p-10 transition-opacity duration-[1800ms] delay-500 ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
      >
        <header className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-white/70">
          <span>MMXXVI</span>
          <span>HR</span>
        </header>

        <h1
          className="absolute left-6 md:left-10 bottom-16 md:bottom-20 font-light leading-[0.85] tracking-[-0.04em] text-white origin-bottom-left will-change-transform"
          style={{
            fontSize: "clamp(72px, 18vw, 360px)",
            transform: compact ? "scale(0.45)" : "scale(1)",
            transition: "transform 1400ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          MANTE
        </h1>

        {/* Countdown */}
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-all duration-[2200ms] ease-out ${
            showCountdown ? "opacity-100 translate-y-0 delay-[1100ms]" : "opacity-0 translate-y-16"
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] md:text-[11.5px] uppercase tracking-[0.5em] text-white/50">
              27 · 06 · MMXXVI
            </span>
            <div className="flex items-end gap-5 md:gap-8 text-white">
              {[
                { v: days, l: "dana" },
                { v: hours, l: "sati" },
                { v: minutes, l: "min" },
                { v: seconds, l: "sek" },
              ].map((u, i) => (
                <div key={u.l} className="flex items-end gap-5 md:gap-8">
                  <div className="flex flex-col items-center">
                    <span className="font-light tabular-nums leading-none text-[10vw] md:text-[3.5vw] tracking-[-0.04em]">
                      {showCountdown ? String(u.v).padStart(2, "0") : "00"}
                    </span>
                    <span className="mt-2 text-[9px] uppercase tracking-[0.4em] text-white/50">
                      {u.l}
                    </span>
                  </div>
                  {i < 3 && (
                    <span className="pb-[1.2vw] md:pb-[0.9vw] text-[6vw] md:text-[2vw] font-light text-white/25">
                      ·
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Play button — desktop only, below timer */}
            <div className="hidden md:flex mt-6 pointer-events-auto">
              <PlayButton
                isPlaying={isPlaying}
                onClick={togglePlay}
                className="px-[1.3rem] py-[0.85rem] text-[13px]"
              />
            </div>
          </div>
        </div>

        <footer className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:right-10 flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-white/60">
          <span>— soon</span>
          <span>001</span>
        </footer>

        <img
          src={imperiaLogo}
          alt="Imperia"
          style={{ position: "absolute", bottom: "-27px", right: "-40px", height: "162px", width: "auto" }}
        />
      </div>

      <style>{`
        @keyframes mante-bolt-flicker {
          0%   { opacity: 0; }
          15%  { opacity: 1; }
          25%  { opacity: 0.2; }
          40%  { opacity: 1; }
          60%  { opacity: 0.5; }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
        .mante-bolt {
          stroke-linecap: round;
          stroke-linejoin: round;
          opacity: 0;
          animation: mante-bolt-flicker 380ms steps(8, end) both;
        }
      `}</style>
    </main>
  );
}
