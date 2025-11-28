// ----------------------------------------------------
// yyovvo Cinematic Player – FINAL CLEAN BUILD
// Single mood+skin video (moodskin01.mp4) + intro + main + outro
// ----------------------------------------------------

// Read ?id= from the URL, e.g. /v/?id=UUID
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  console.error("No yyovvo id provided in URL (?id=...)");
}

// Load yyovvo data (intro_text, content_text, etc.) from Base44
async function loadData() {
  const url = `https://moment-cf83ed32.base44.app/api/apps/69023ddd9333e12fcf83ed32/functions/yyovvoGet?id=${encodeURIComponent(
    id
  )}`;

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

  // Unwrap Base44-style envelope
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
  return data;
}

// Main player logic
async function init() {
  try {
    const data = await loadData();

    const scene    = document.getElementById("scene");
    const intro    = document.getElementById("overlay-intro");
    const mainText = document.getElementById("overlay-main-text");
    const outro    = document.getElementById("overlay-outro");
    const jingle   = document.getElementById("yyo-jingle");

    if (!data) {
      console.error("No data returned from yyovvoGet");
      return;
    }

    console.log("Playing yyovvo with data:", data);

    // TIMING (ms) – 3 mood + 2 intro + main + outro
    const INTRO_START_MS    = 3000;  // intro at 3s
    const INTRO_END_MS      = 5000;  // hide intro at 5s
    const MAIN_START_MS     = 5000;  // main text at 5s
    const MAIN_DURATION_MS  = (Number(data.content_duration) || 10) * 1000; // seconds → ms
    const OUTRO_START_MS    = MAIN_START_MS + MAIN_DURATION_MS; // after main

    // 1) Start mood+skin combined video
    const moodSkinUrl = "/videos/moodskin01.mp4";
    scene.loop = false;
    scene.muted = true;
    scene.playsInline = true;
    scene.src = moodSkinUrl;

    scene.play().catch((err) => {
      console.warn("Scene autoplay failed (may need user tap):", err);
    });

    // 2) Intro text (3s → 5s)
    setTimeout(() => {
      if (data.intro_text) {
        intro.textContent = data.intro_text || "";
        intro.classList.add("show");
      }
    }, INTRO_START_MS);

    setTimeout(() => {
      intro.classList.remove("show");
    }, INTRO_END_MS);

    // 3) Main message (from 5s)
    setTimeout(() => {
      if (!data.content_type || data.content_type === "text") {
        mainText.textContent = data.content_text || "";
        mainText.classList.add("show");
      } else if (data.content_type === "audio" && data.content_url) {
        const audio = new Audio(data.content_url);
        audio.play().catch(() => {});
      } else if (data.content_type === "video" && data.content_url) {
        // future: swap to specific main clip
        console.log("content_type=video not implemented yet; keeping moodskin01.mp4");
      }
    }, MAIN_START_MS);

    // 4) Outro (snow + logo + jingle)
    setTimeout(() => {
      // hide main text so it doesn’t overlap outro
      mainText.classList.remove("show");

      // swap to snow outro loop
      scene.src = "/videos/outro-snow.mp4";
      scene.loop = true;
      scene.muted = true;
      scene.playsInline = true;
      scene.play().catch(() => {});

      // show outro overlay
      outro.classList.add("show");

      // play jingle
      jingle.play().catch((err) => {
        console.warn("Jingle autoplay blocked:", err);
      });
    }, OUTRO_START_MS);
  } catch (e) {
    console.error("yyovvo player init error:", e);
  }
}

init();
