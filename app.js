(() => {
  // ====== CONFIG ======
  // Ton numéro WhatsApp (international, sans + dans wa.me)
  const WHATSAPP_NUMBER = "79200664894";

  // ====== Helpers ======
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = {
    envelopeOpened: false,
    vibe: null, // "cafe" | "walk" | "dessert"
    time: null, // "thisweek" | "weekend"
    reduced: false,
  };

  const vibeMeta = {
    cafe: {
      label: "un café ☕",
      reply:
        "Parfait. Un café, une discussion simple, et on laisse le reste faire son travail.",
    },
    walk: {
      label: "une balade 🌙",
      reply: "J’aime. Une balade tranquille, un peu de nuit, un peu de vibe.",
    },
    dessert: {
      label: "un dessert 🍰",
      reply: "Excellent choix. Le dessert d’abord, les discussions ensuite 😄",
    },
  };

  const timeMeta = {
    thisweek: "cette semaine",
    weekend: "ce week-end",
  };

  function encode(text) {
    return encodeURIComponent(text);
  }

  function buildWhatsAppLink() {
    const vibeLabel = state.vibe
      ? vibeMeta[state.vibe].label
      : "un moment simple";
    const timeLabel = state.time ? timeMeta[state.time] : "quand tu veux";

    const msg =
      `Hey 🙂 j’ai choisi ${vibeLabel}.\n` +
      `Tu préfères ${timeLabel} ?\n` +
      `Si t’es ok, je te laisse choisir l’heure.`;

    // Using wa.me format
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encode(msg)}`;
  }

  function goTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({
      behavior: state.reduced ? "auto" : "smooth",
      block: "start",
    });
  }

  // ====== Section activation (for nice entrance) ======
  const screens = $$(".screen");
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("active");
        }
      }
    },
    { root: $(".wrap"), threshold: 0.45 }
  );
  screens.forEach((s) => io.observe(s));

  // ====== Navigation buttons ======
  $$("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => goTo(btn.getAttribute("data-go")));
  });

  // ====== HERO ======
  $("#openBtn").addEventListener("click", () => goTo("letter"));

  // ====== LETTER / ENVELOPE ======
  const envelopeBtn = $("#envelope");
  const listenBtn = $("#listenBtn");

  envelopeBtn.addEventListener("click", () => {
    if (state.envelopeOpened) return;
    state.envelopeOpened = true;
    envelopeBtn.classList.add("open");
    listenBtn.disabled = false;

    // tiny haptic-like feedback (safe)
    try {
      navigator.vibrate?.(20);
    } catch {}
  });

  listenBtn.addEventListener("click", () => goTo("vibe"));

  // ====== VIBE CHOICES ======
  const vibeReply = $("#vibeReply");
  const chosenBtn = $("#chosenBtn");

  function selectVibe(vibe) {
    state.vibe = vibe;

    $$(".choice").forEach((c) => {
      const isThis = c.getAttribute("data-vibe") === vibe;
      c.classList.toggle("selected", isThis);
      c.setAttribute("aria-pressed", String(isThis));
    });

    vibeReply.innerHTML = `<p class="p">${vibeMeta[vibe].reply}</p>`;
    chosenBtn.disabled = false;

    // Update invite preview
    updateInviteText();
  }

  $$(".choice").forEach((btn) => {
    btn.addEventListener("click", () =>
      selectVibe(btn.getAttribute("data-vibe"))
    );
  });

  chosenBtn.addEventListener("click", () => goTo("invite"));

  // ====== INVITE ======
  const inviteLine1 = $("#inviteLine1");
  const goCtaBtn = $("#goCtaBtn");

  function updateInviteText() {
    const vibeLabel = state.vibe
      ? vibeMeta[state.vibe].label
      : "quelque chose de cool";
    inviteLine1.innerHTML = `Cette semaine, on fait: <strong>${vibeLabel}</strong>.`;
  }

  function selectTime(time) {
    state.time = time;

    $$(".pill").forEach((p) => {
      const isThis = p.getAttribute("data-time") === time;
      p.classList.toggle("selected", isThis);
      p.setAttribute("aria-pressed", String(isThis));
    });

    goCtaBtn.disabled = false;
    updateCta();
  }

  $$(".pill").forEach((p) => {
    p.addEventListener("click", () => selectTime(p.getAttribute("data-time")));
  });

  goCtaBtn.addEventListener("click", () => goTo("cta"));

  // ====== CTA ======
  const whatsBtn = $("#whatsBtn");
  const ctaSummary = $("#ctaSummary");
  const notNowBtn = $("#notNowBtn");
  const thanks = $("#thanks");

  function updateCta() {
    const vibeLabel = state.vibe
      ? vibeMeta[state.vibe].label
      : "un moment simple";
    const timeLabel = state.time ? timeMeta[state.time] : "quand tu veux";

    ctaSummary.textContent = `On part sur ${vibeLabel} — ${timeLabel}. Tu me dis ?`;
    whatsBtn.href = buildWhatsAppLink();
  }

  // Init CTA link in case user jumps
  updateInviteText();
  updateCta();

  notNowBtn.addEventListener("click", () => {
    thanks.hidden = false;
    notNowBtn.disabled = true;
    whatsBtn.classList.add("disabledLike");
    whatsBtn.setAttribute("aria-disabled", "true");
    whatsBtn.addEventListener("click", (e) => e.preventDefault(), {
      once: true,
    });
  });

  // ====== Reduced motion toggle ======
  const muteBtn = $("#muteBtn");
  const root = document.documentElement;

  function setReduced(on) {
    state.reduced = on;
    document.body.classList.toggle("reduced", on);
    muteBtn.querySelector(".chip__text").textContent = on
      ? "Calme"
      : "Animations";
    muteBtn.querySelector(".chip__icon").textContent = on ? "🌙" : "✨";
  }

  muteBtn.addEventListener("click", () => setReduced(!state.reduced));

  // Respect OS preference
  const prefersReduced = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  )?.matches;
  if (prefersReduced) setReduced(true);

  // ====== Hearts particles canvas ======
  const canvas = $("#hearts");
  const ctx = canvas.getContext("2d", { alpha: true });

  let W = 0,
    H = 0,
    DPR = 1;
  function resize() {
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = canvas.clientWidth = window.innerWidth;
    H = canvas.clientHeight = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  const hearts = [];
  const MAX = 18;

  function spawnHeart() {
    const size = rand(10, 20);
    hearts.push({
      x: rand(0, W),
      y: H + rand(10, 120),
      vy: rand(0.25, 0.7),
      vx: rand(-0.12, 0.12),
      rot: rand(-0.8, 0.8),
      vr: rand(-0.006, 0.006),
      a: rand(0.08, 0.18),
      s: size,
      wob: rand(0, Math.PI * 2),
      wv: rand(0.006, 0.018),
      hue: rand(325, 355),
    });
  }

  for (let i = 0; i < MAX; i++) spawnHeart();

  function drawHeart(x, y, s, rot, alpha, hue) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;

    const grad = ctx.createRadialGradient(0, -s * 0.2, s * 0.2, 0, 0, s * 1.2);
    grad.addColorStop(0, `hsla(${hue}, 90%, 70%, ${alpha})`);
    grad.addColorStop(1, `hsla(${hue}, 90%, 50%, ${alpha * 0.25})`);
    ctx.fillStyle = grad;

    ctx.beginPath();
    // Heart shape
    const top = -s * 0.3;
    ctx.moveTo(0, top);
    ctx.bezierCurveTo(
      s * 0.6,
      top - s * 0.8,
      s * 1.4,
      top + s * 0.4,
      0,
      s * 1.2
    );
    ctx.bezierCurveTo(-s * 1.4, top + s * 0.4, -s * 0.6, top - s * 0.8, 0, top);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(32, now - last);
    last = now;

    ctx.clearRect(0, 0, W, H);

    const reduce = state.reduced;
    const speed = reduce ? 0.2 : 1;

    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i];
      h.wob += h.wv * dt * speed;
      h.x += (h.vx + Math.sin(h.wob) * 0.08) * dt * speed;
      h.y -= h.vy * dt * speed;
      h.rot += h.vr * dt * speed;

      drawHeart(h.x, h.y, h.s, h.rot, h.a, h.hue);

      if (h.y < -150 || h.x < -200 || h.x > W + 200) {
        hearts.splice(i, 1);
        if (!reduce) spawnHeart(); // keep density only if not reduced
      }
    }

    // Keep some even in reduced mode
    if (reduce && hearts.length < 8) spawnHeart();

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
