// ---------------------------------------------------------
// 1) READ ?id= FROM URL ( /v/?id=... )
// ---------------------------------------------------------
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  console.error("No yyovvo id provided in URL (?id=...)");
}

// ---------------------------------------------------------
// 2) LOAD YYOVVO DATA FROM BASE44
// ---------------------------------------------------------
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

  // Unwrap whatever Base44 returns
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

// ---------------------------------------------------------
// 3) MAIN CINEMATIC LOGIC – SINGLE moodsKiN VIDEO
// ---------------------------------------------------------
async function init() {
  try {
    const data = await loadData();

    const scene = document.getElementById("scene");
    const intro = document.getElementById("overlay-intro");
    const mainText = document.getElementById("overlay-main-text");
    const outro = document.getElementById("overlay-outro");
    const jingle = document.getElementById("yyo-jingle");

    if (!data) {
      console.error("No data returned from yyovvoGet");
      return;
    }

    console.log("Playing yyovvo with data:", data);

    // -----------------------------------------------------
    // TIMELINE (ms) – assuming moodskin01.mp4 ≈ 14s total
    // 0–3s   = mood only
    // 3–6s   = intro text
    // 6–14s  = main message text
    // 14s+   = outro overlay + jingle
    // -----------------------------------------------------
    const MOOD_DURATION_MS   = 3000;  // 3s
    const INTRO_START_MS     = 3000;  // from 3s
    const INTRO_END_MS       = 6000;  // to 6s
    const MAIN_START_MS      = 6000;  // from 6s
    const MAIN_END_MS        = 14000; // to 14s
    const OUTRO_START_MS     = 14000; // 14s

    // -----------------------------------------------------
    // 3.1) SINGLE VIDEO: mood + skin combined (hard-wired)
    // -----------------------------------------------------
    const moodSkinUrl = "/videos/moodskin01.mp4";

    scene.src = moodSkinUrl;
    scene.loop = false;
    scene.muted = true;
    scene.playsInline = true;

    await scene.play().catch((err) => {
      console.warn("Autoplay failed, waiting for user interaction.", err);
    });

    // -----------------------------------------------------
    // 3.2) INTRO TEXT (3s → 6s)
    // -----------------------------------------------------
    setTimeout(() => {
      if (data.intro_text) {
        intro.textContent = data.intro_text;
        intro.classList.add("show");
      } else {
        console.warn("No intro_text in data");
      }
    }, INTRO_START_MS);

    setTimeout(() => {
      intro.classList.remove("show");
    }, INTRO_END_MS);

    // -----------------------------------------------------
    // 3.3) MAIN MESSAGE (6s → 14s) – TEXT ONLY FOR NOW
    // -----------------------------------------------------
    setTimeout(() => {
      const text =
        data.content_text ||
        data.content ||
        data.message ||
        "";

      if (text) {
        mainText.textContent = text;
        mainText.classList.add("show");
      } else {
        console.warn("No main text content in data");
      }
    }, MAIN_START_MS);

    setTimeout(() => {
      mainText.classList.remove("show");
    }, MAIN_END_MS);

    // -----------------------------------------------------
    // 3.4) OUTRO (after 14s) – LOGO + TAGLINE + JINGLE
    // -----------------------------------------------------
    setTimeout(() => {
      // show outro overlay
      outro.classList.remove("hidden");
      outro.classList.add("show");

      // play jingle
      jingle.currentTime = 0;
      jingle.play().catch((err) => {
        console.warn("Autoplay jingle failed (user gesture required?):", err);
      });
    }, OUTRO_START_MS);

  } catch (e) {
    console.error("yyovvo player init error:", e);
  }
}

init();
