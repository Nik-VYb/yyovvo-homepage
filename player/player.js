// Read ?id= from the URL, e.g. /v/?id=UUID
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  console.error("No yyovvo id provided in URL (?id=...)");
}

// Base44 yyovvoGet endpoint (keep this domain as-is)
const YYOVVO_GET_URL = "https://moment-cf83ed32.base44.app/api/apps/69023ddd9333e12fcf83ed32/functions/yyovvoGet";

// Local mood + skin pools
const MOOD_POOL = [
  "/videos/mood-snow.mp4",
  "/videos/mood-night.mp4",
  "/videos/mood-warm-glow.mp4",
  "/videos/mood-pink-haze.mp4",
  "/videos/mood-ice-pulse.mp4",
  "/videos/mood-aurora-drift.mp4",
  "/videos/mood-gold-dust.mp4",
  "/videos/mood-midnight-fog.mp4"
];

const SKIN_POOL = [
  "/skins/frosted-glass.png",
  "/skins/midnight-pink-pulse.png",
  "/skins/snow-glow.png",
  "/skins/christmas-lights-warm.png",
  "/skins/ice-shatter.png",
  "/skins/neon-green-aurora.png",
  "/skins/metallic-gold-glow.png",
  "/skins/blue-electric-snow.png"
];

function choice(arr) {
  if (!arr || arr.length === 0) return null;
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

async function loadData() {
  const url = `${YYOVVO_GET_URL}?id=${encodeURIComponent(id)}`;
  console.log("Fetching yyovvo from:", url);

  const res = await fetch(url);

  console.log("Response status:", res.status);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Failed to load yyovvo data. Body:", text);
    throw new Error("Failed to load yyovvo data");
  }

  let raw;
  try {
    raw = await res.json();
  } catch (e) {
    console.error("JSON parse error:", e);
    throw e;
  }

  console.log("Raw yyovvo response:", raw);

  let data = raw;
  if (raw.data && (raw.data.fields || raw.data.record)) {
    data = raw.data.fields || raw.data.record;
  } else if (raw.data) {
    data = raw.data;
  } else if (raw.record) {
    data = raw.record;
  } else if (raw.fields) {
    data = raw.fields;
  }

  console.log("Unwrapped yyovvo data:", data);
  return data || {};
}

async function init() {
  if (!id) return;

  const scene = document.getElementById("scene");
  const skinOverlay = document.getElementById("skin-overlay");
  const introEl = document.getElementById("overlay-intro");
  const mainTextEl = document.getElementById("overlay-main-text");
  const outroEl = document.getElementById("overlay-outro");
  const jingle = document.getElementById("yyo-jingle");
  const soundHint = document.getElementById("sound-hint");
  const replyCta = document.getElementById("reply-cta");

  try {
    const data = await loadData();
    if (!data) {
      console.error("No data returned from yyovvoGet");
      return;
    }

    console.log("Playing yyovvo with data:", data);

    // --- TIMING (ms) ---
    const INTRO_START_MS = 900;
    const MAIN_START_MS = 3200;
    const MAIN_DURATION_MS = (Number(data.content_duration) || 10) * 1000;
    const OUTRO_START_MS = MAIN_START_MS + MAIN_DURATION_MS;

    // --- CHOOSE MOOD + SKIN ---

    const fallbackMood = "/videos/yyovvo-hero.mp4";
    const moodUrl = data.mood_video_url || choice(MOOD_POOL) || fallbackMood;

    const skinUrl = choice(SKIN_POOL);

    if (skinUrl) {
      skinOverlay.style.backgroundImage = `url('${skinUrl}')`;
    }

    // Start with mood immediately
    scene.loop = false;
    scene.src = moodUrl;
    scene.play().catch((err) => {
      console.warn("Scene autoplay failed initially (likely mobile policy):", err);
      // We leave it; user tap will start it.
    });

    // --- INTRO TEXT ANIMATION ---
    setTimeout(() => {
      if (data.intro_text) {
        introEl.textContent = data.intro_text;
        introEl.classList.add("show-intro");
      }
    }, INTRO_START_MS);

    // --- MAIN MOMENT ---
    if (data.content_type === "text") {
      const text = data.content_text || "";

      setTimeout(() => {
        animateMainText(mainTextEl, text);
      }, MAIN_START_MS);
    } else if (data.content_type === "audio") {
      const audioUrl = data.content_url;
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        setTimeout(() => {
          audio.play().catch((err) => {
            console.warn("Main audio play blocked:", err);
          });
        }, MAIN_START_MS);
      }
    } else if (data.content_type === "video") {
      const videoUrl = data.content_url;
      setTimeout(() => {
        if (videoUrl) {
          scene.src = videoUrl;
          scene.loop = false;
          scene.play().catch((err) => {
            console.warn("Main video play blocked:", err);
          });
        } else {
          console.warn("content_type=video but no content_url");
        }
      }, MAIN_START_MS);
    } else {
      console.warn("Unknown content_type:", data.content_type);
    }

    // --- OUTRO (snow + logo + jingle) ---
    setTimeout(() => {
      // Hide main text so it doesn’t overlap logo
      mainTextEl.classList.remove("show-main");

      // Switch to snow outro loop
      const outroUrl = data.outro_video_url || "/videos/outro-snow.mp4";
      scene.src = outroUrl;
      scene.loop = true;
      scene.play().catch((err) => {
        console.warn("Outro video play blocked:", err);
      });

      // Show outro
      outroEl.classList.remove("hidden");
      outroEl.classList.add("show-outro");

      // Show reply CTA
      replyCta.classList.remove("hidden");
      replyCta.classList.add("show-reply");

      // Try to play jingle
      jingle.play().catch((err) => {
        console.warn("Jingle autoplay blocked:", err);
        // Show hint so they can tap to trigger
        soundHint.classList.remove("hidden");
        soundHint.classList.add("show-sound-hint");
      });
    }, OUTRO_START_MS);

    // When user taps sound hint, play jingle
    soundHint.addEventListener("click", () => {
      jingle
        .play()
        .then(() => {
          soundHint.classList.remove("show-sound-hint");
          soundHint.classList.add("hidden");
        })
        .catch((err) => {
          console.warn("Failed to play jingle even after tap:", err);
        });
    });

    // Reply CTA: for now just scroll to homepage or open studio (can refine later)
    replyCta.addEventListener("click", () => {
      window.location.href = "https://studio.yyovvo.com/CreateYyovvo";
    });
  } catch (e) {
    console.error("yyovvo player init error:", e);
  }
}

// Main text animation: more "materialise" than "typewriter"
function animateMainText(el, text) {
  el.textContent = "";
  el.classList.add("show-main");

  const chars = Array.from(text);
  let idx = 0;

  function step() {
    // Reveal in small clusters to avoid pure typewriter feel
    const clusterSize = Math.floor(Math.random() * 3) + 1; // 1–3 chars
    const slice = chars.slice(idx, idx + clusterSize).join("");
    el.textContent += slice;
    idx += clusterSize;

    if (idx < chars.length) {
      const delay = 30 + Math.random() * 60; // 30–90ms between bursts
      setTimeout(step, delay);
    }
  }

  step();
}

init();
