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
// 3) MAIN CINEMATIC LOGIC – SINGLE moodskin VIDEO
// ---------------------------------------------------------
async function init() {
  try {
    const data = await loadData();

    const scene    = document.getElementById("scene");
    const introEl  = document.getElementById("overlay-intro");
    const mainEl   = document.getElementById("overlay-main-text");
    const outroEl  = document.getElementById("overlay-outro");
    const jingle   = document.getElementById("yyo-jingle");

    if (!data) {
      console.error("No data returned from yyovvoGet");
      return;
    }

    console.log("Playing yyovvo with data:", data);

    // -----------------------------------------------------
    // TIMELINE (ms) – your chosen sequence:
    // 0–3s   = mood only
    // 3–6s   = intro text
    // 6–14s  = main message
    // 14s+   = outro overlay + jingle
    // -----------------------------------------------------
    const INTRO_START_MS   = 3000;
    const INTRO_END_MS     = 6000;
    const MAIN_START_MS    = 6000;
    const MAIN_END_MS      = 14000;
    const OUTRO_START_MS   = 14000;

    // -----------------------------------------------------
    // 3.1) SINGLE VIDEO: mood + skin combined
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
    // 3.2) INTRO TEXT (3s–6s)
    // -----------------------------------------------------
    setTimeout(() => {
      const introText =
        data.intro_text ||
        data.intro ||
        "";

      console.log("INTRO TEXT:", introText);

      if (introText && introText.trim()) {
        introEl.textContent = introText;
        introEl.classList.add("show");
      }
    }, INTRO_START_MS);

    setTimeout(() => {
      introEl.classList.remove("show");
    }, INTRO_END_MS);

    // -----------------------------------------------------
    // 3.3) MAIN MESSAGE (6s–14s) – TEXT
    // -----------------------------------------------------
    setTimeout(() => {
      const mainText =
        data.content_text ||
        data.content ||
        data.message ||
        "";

      console.log("MAIN TEXT:", mainText);

      if (mainText && mainText.trim()) {
        mainEl.textContent = mainText;
        mainEl.classList.add("show");
      }
    }, MAIN_START_MS);

    setTimeout(() => {
      mainEl.classList.remove("show");
    }, MAIN_END_MS);

    // -----------------------------------------------------
    // 3.4) OUTRO (14s+) – LOGO + TAGLINE + JINGLE
    // -----------------------------------------------------
    setTimeout(() => {
      console.log("OUTRO START");

      // remove main text overlay, show outro block
      mainEl.classList.remove("show");
      outroEl.classList.remove("hidden");
      outroEl.classList.add("show");

      // play jingle
      jingle.currentTime = 0;
      jingle.play().catch((err) => {
        console.warn("Autoplay jingle failed:", err);
      });
    }, OUTRO_START_MS);

  } catch (e) {
    console.error("yyovvo player init error:", e);
  }
}

init();
