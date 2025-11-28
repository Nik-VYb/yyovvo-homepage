// --------------------------------------------------------
// 1) Read ?id from URL
// --------------------------------------------------------
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  console.error("No yyovvo id provided in URL (?id=...)");
}

// --------------------------------------------------------
// 2) Load yyovvo data from Base44
// --------------------------------------------------------
async function loadData() {
  const url = `https://moment-cf83ed32.base44.app/api/apps/69023ddd9333e12fcf83ed32/functions/yyovvoGet?id=${encodeURIComponent(
    id
  )}`;

  console.log("Fetching yyovvo from:", url);
  const res = await fetch(url);

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

  // Unwrap Base44 shapes
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

// --------------------------------------------------------
// 3) Main cinematic logic
// --------------------------------------------------------
async function init() {
  try {
    const data = await loadData();

    const scene = document.getElementById("scene");
    const introEl = document.getElementById("overlay-intro");
    const mainEl = document.getElementById("overlay-main-text");
    const outroEl = document.getElementById("overlay-outro");
    const jingle = document.getElementById("yyo-jingle");

    if (!data) {
      console.error("No data returned from yyovvoGet");
      return;
    }

    console.log("Playing yyovvo with data:", data);

    // TIMING (ms) – 3s mood, 3s intro, 8s main, 3s outro = 17s total
    const MOOD_DURATION_MS = 3000;  // 0–3s
    const INTRO_START_MS   = 3000;  // 3s
    const INTRO_END_MS     = 6000;  // 6s
    const MAIN_START_MS    = 6000;  // 6s
    const MAIN_DURATION_MS = 8000;  // 8s of message
    const OUTRO_START_MS   = MAIN_START_MS + MAIN_DURATION_MS; // 14s

    // 1) Background cinema: ALWAYS moodskin01.mp4 for now
    const moodSkinUrl = "/videos/moodskin01.mp4";

    scene.loop = false;
    scene.muted = true;
    scene.playsInline = true;
    scene.src = moodSkinUrl;

    await scene.play().catch((err) => {
      console.warn("Autoplay failed, waiting for user interaction.", err);
    });

    // 2) INTRO TEXT (3s–6s)
    setTimeout(() => {
      const text = data.intro_text || data.intro || "";
      if (text) {
        introEl.textContent = `"${text}"`;
        introEl.classList.add("show");
      } else {
        console.warn("No intro_text in data");
      }
    }, INTRO_START_MS);

    setTimeout(() => {
      introEl.classList.remove("show");
    }, INTRO_END_MS);

    // 3) MAIN MESSAGE (6s–14s)
    setTimeout(() => {
      if (data.content_type === "text" || !data.content_type) {
        const msg = data.content_text || data.message || "";
        mainEl.textContent = msg || "";
        mainEl.classList.add("show");
      } else {
        // (Later: audio/video handling)
        console.warn(
          "Non-text content_type detected, text mode only in this build:",
          data.content_type
        );
      }
    }, MAIN_START_MS);

    // 4) OUTRO (from 14s)
    setTimeout(() => {
      mainEl.classList.remove("show");
      outroEl.classList.add("show");
      jingle.play().catch((err) => {
        console.warn("Jingle autoplay blocked, waiting for tap.", err);
      });
    }, OUTRO_START_MS);
  } catch (e) {
    console.error("yyovvo player init error:", e);
  }
}

init();
