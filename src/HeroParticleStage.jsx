import { useCallback, useEffect, useRef, useState } from "react";
import "./heroParticle.css";

/* ── BG gradient palettes — one per watch slot ───────────────────────────── */
const BG_PALETTES = [
  `radial-gradient(circle at 85% 18%, rgba(250,45,29,.48) 0%, rgba(250,45,29,.06) 34%, transparent 60%), linear-gradient(140deg, #1a0402 0%, #0d0201 55%, #060101 100%)`,
  `radial-gradient(circle at 80% 22%, rgba(28,88,210,.42) 0%, rgba(28,88,210,.06) 34%, transparent 60%), linear-gradient(140deg, #020916 0%, #010611 55%, #010206 100%)`,
  `radial-gradient(circle at 78% 20%, rgba(195,148,28,.44) 0%, rgba(195,148,28,.06) 34%, transparent 60%), linear-gradient(140deg, #171202 0%, #121002 55%, #080500 100%)`,
  `radial-gradient(circle at 82% 16%, rgba(200,228,252,.52) 0%, rgba(180,218,248,.08) 34%, transparent 60%), linear-gradient(140deg, #02101a 0%, #010b14 55%, #010508 100%)`,
  `radial-gradient(circle at 80% 20%, rgba(78,56,205,.42) 0%, rgba(78,56,205,.06) 34%, transparent 60%), linear-gradient(140deg, #0a0816 0%, #060512 55%, #030208 100%)`,
  `radial-gradient(circle at 78% 22%, rgba(28,162,78,.38) 0%, rgba(28,162,78,.05) 34%, transparent 60%), linear-gradient(140deg, #021408 0%, #010f06 55%, #010502 100%)`,
];

/* ══════════════════════════════════════════════════════════════════════════
   TECHNIQUE 5 — AMBIENT FLOATING DUST (always-on looping canvas)
══════════════════════════════════════════════════════════════════════════ */
function AmbientDustCanvas() {
  const cvs = useRef(null);
  useEffect(() => {
    const canvas = cvs.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let t = 0;
    let isVisible = true;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const N = isMobile ? 45 : 90;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.14,
      r: Math.random() * 1.5 + 0.3,
      op: Math.random() * 0.12 + 0.03,
      freq: Math.random() * 0.016 + 0.005,
      ph: Math.random() * Math.PI * 2,
      amp: Math.random() * 0.4 + 0.1,
    }));
    const draw = () => {
      if (!isVisible || document.hidden) return;
      t++;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += (p.vx + Math.sin(t * p.freq + p.ph) * p.amp) / W;
        p.y += (p.vy + Math.cos(t * p.freq * 0.7 + p.ph) * p.amp * 0.5) / H;
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.op})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !document.hidden) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(draw);
      }
    }, { threshold: 0.05 });
    io.observe(canvas);

    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (isVisible) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return <canvas ref={cvs} className="hp-dust" aria-hidden="true" />;
}

/* ══════════════════════════════════════════════════════════════════════════
   TECHNIQUE 1 — PARTICLE DISSOLVE → REASSEMBLE ENGINE
══════════════════════════════════════════════════════════════════════════ */
function runParticleTransition(canvas, toSrc, onDone) {
  if (!canvas) { onDone?.(); return; }
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const COUNT = W < 768 ? 580 : 1200;
  const BURST_DUR = 600, SETTLE_DUR = 700;
  let raf;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const off = document.createElement("canvas");
    off.width = 200; off.height = 300;
    const oc = off.getContext("2d");
    oc.drawImage(img, 0, 0, 200, 300);
    const px = oc.getImageData(0, 0, 200, 300).data;

    const valid = [];
    for (let y = 0; y < 300; y += 2)
      for (let x = 0; x < 200; x += 2) {
        const i = (y * 200 + x) * 4;
        if (px[i + 3] > 35) valid.push({ x, y, r: px[i], g: px[i+1], b: px[i+2] });
      }
    if (!valid.length) { onDone?.(); return; }

    const pw = W * 0.56, ph = pw * 1.5;
    const ox = (W - pw) / 2, oy = (H - ph) / 2;

    const particles = Array.from({ length: COUNT }, () => {
      const v = valid[Math.floor(Math.random() * valid.length)];
      return {
        x: W * 0.5 + (Math.random() - 0.5) * 60,
        y: H * 0.07 + Math.random() * 50,
        tx: ox + (v.x / 200) * pw,
        ty: oy + (v.y / 300) * ph,
        size: Math.random() * 2.8 + 0.4,
        op: 0,
        col: `${v.r},${v.g},${v.b}`,
        delay: Math.random() * 0.38,
      };
    });

    const t0 = performance.now();
    const frame = (now) => {
      const elapsed = now - t0;
      ctx.clearRect(0, 0, W, H);

      if (elapsed < BURST_DUR) {
        // Phase A: Burst — warm spark explosion from watch centre
        const p = elapsed / BURST_DUR;
        const N = Math.floor(COUNT * 0.32);
        for (let i = 0; i < N; i++) {
          const angle = (i / N) * Math.PI * 2 + p * 1.1;
          const dist = p * W * 0.42;
          const scatter = 0.3 + Math.random() * 0.7;
          const bx = W * 0.5 + Math.cos(angle) * dist * scatter;
          const by = H * 0.44 + Math.sin(angle) * dist * 0.55 * scatter;
          const op = (1 - p) * (0.35 + Math.random() * 0.4);
          const sz = (1 - p) * (1.5 + Math.random() * 2.5);
          const g = Math.floor(80 + p * 130);
          ctx.beginPath();
          ctx.arc(bx, by, sz, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,${g},10,${op})`;
          ctx.fill();
        }
      } else {
        // Phase B: Settle — particles home in on target pixels
        const p = Math.min(1, (elapsed - BURST_DUR) / SETTLE_DUR);
        for (const pt of particles) {
          const localRaw = (p - pt.delay) / (1 - pt.delay);
          const lp = Math.max(0, Math.min(1, localRaw));
          const eased = 1 - Math.pow(1 - lp, 2.8);
          if (lp > 0) {
            pt.x += (pt.tx - pt.x) * 0.082 * eased;
            pt.y += (pt.ty - pt.y) * 0.082 * eased;
            pt.op = Math.min(1, eased * 1.25);
            const sz = pt.size * Math.min(1, eased * 1.6);
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, sz, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${pt.col},${pt.op * 0.92})`;
            ctx.fill();
          }
        }
        if (p >= 1) { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); onDone?.(); return; }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  };
  img.onerror = () => onDone?.();
  img.src = toSrc;
}

/* ══════════════════════════════════════════════════════════════════════════
   ROOT: HeroParticleStage
══════════════════════════════════════════════════════════════════════════ */
export default function HeroParticleStage({ watches }) {
  const [idx, setIdx]       = useState(0);
  const [phase, setPhase]   = useState("idle");
  const [wipeBg, setWipeBg] = useState(null);
  const [wipeOn, setWipeOn] = useState(false);

  const idxRef   = useRef(0); idxRef.current = idx;
  const phaseRef = useRef("idle"); phaseRef.current = phase;
  const particleRef = useRef(null);

  const go = useCallback((toIdx) => {
    if (phaseRef.current !== "idle") return;
    if (toIdx === idxRef.current) return;
    setPhase("exit");
    setWipeBg(BG_PALETTES[toIdx % BG_PALETTES.length]);
    requestAnimationFrame(() => setWipeOn(true));
    const tid = setTimeout(() => {
      setIdx(toIdx);
      setPhase("enter");
      const canvas = particleRef.current;
      if (canvas) {
        runParticleTransition(canvas, watches[toIdx].image, () => {
          setPhase("idle");
          setWipeOn(false);
          setTimeout(() => setWipeBg(null), 80);
        });
      } else {
        setTimeout(() => { setPhase("idle"); setWipeOn(false); setWipeBg(null); }, 700);
      }
    }, 500);
    return () => clearTimeout(tid);
  }, [watches]);

  const goNext = useCallback(() => go((idxRef.current + 1) % watches.length), [go, watches.length]);
  const goPrev = useCallback(() => go((idxRef.current - 1 + watches.length) % watches.length), [go, watches.length]);

  useEffect(() => {
    const id = setInterval(() => { if (phaseRef.current === "idle") goNext(); }, 6000);
    return () => clearInterval(id);
  }, [goNext]);

  useEffect(() => {
    const canvas = particleRef.current;
    if (!canvas || !canvas.parentElement) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "ArrowLeft") goPrev(); if (e.key === "ArrowRight") goNext(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  const w = watches[idx];

  return (
    <div className="hp-stage" aria-label="Watch showcase carousel">
      {/* TECHNIQUE 3: Diagonal background wipe */}
      <div className="hp-bg-base" style={{ background: BG_PALETTES[idx % BG_PALETTES.length] }} aria-hidden="true" />
      {wipeBg && (
        <div className={`hp-bg-wipe${wipeOn ? " hp-bg-wipe--on" : ""}`} style={{ background: wipeBg }} aria-hidden="true" />
      )}

      {/* TECHNIQUE 5: Ambient dust */}
      <AmbientDustCanvas />

      {/* TECHNIQUE 4 + 2: Cinema panel + coin-flip */}
      <div className="hp-cinema">
        <div className="hp-perspective">
          <div className={`hp-flipcard hp-flipcard--${phase}`}>
            <img src={w.image} alt={w.name} className="hp-img" draggable={false} onDragStart={(e) => e.preventDefault()} />
          </div>
        </div>
        <div className="hp-vignette" aria-hidden="true" />
      </div>

      {/* TECHNIQUE 1: Particle canvas — full-stage overlay */}
      <canvas ref={particleRef} className="hp-particles" aria-hidden="true" />

      {/* Navigation */}
      <button id="hero-watch-prev" className="hp-arrow hp-arrow--l" onClick={goPrev} aria-label="Previous watch" disabled={phase !== "idle"}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      <button id="hero-watch-next" className="hp-arrow hp-arrow--r" onClick={goNext} aria-label="Next watch" disabled={phase !== "idle"}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
      </button>

      {/* Dots */}
      <div className="hp-dots" role="tablist" aria-label="Select watch">
        {watches.map((wt, i) => (
          <button key={wt.id} id={`hero-dot-${wt.id}`} role="tab" aria-selected={i === idx} aria-label={wt.name} className={`hp-dot${i === idx ? " hp-dot--on" : ""}`} onClick={() => go(i)} />
        ))}
      </div>

      {/* Name label */}
      <p className="hp-name" aria-live="polite">{w.name}</p>
    </div>
  );
}
