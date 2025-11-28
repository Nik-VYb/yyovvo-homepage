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

    const scene   = document.getElementById("scene");
    const intro   = document.getElementById("overlay-intro");
    const mainTxt = document.getElementById("overlay-main-text");
    const outro   = document.getElementById("overlay-outro");
    const jingle  = document.getElementById("yyo-jingle");

    if (!data) {
      console.error("No data returned from yyovvoGet");
      return;
    }

    console.log("Playing yyovvo with data:", data);

    // ---------- HARD WIRED TIMELINE (ms) -------------
    // 0–3s   = mood only
    // 3–6s   = intro text
    // 6–14s  = main message
    // 14s+   = outro overlay + jingle
    const MOOD_DURATION_MS = 3000;
    const INTRO_START_MS   = 3000;
    const INTRO_END_MS     = 6000;
    const MAIN_START_MS    = 6000;
    const MAIN_END_MS      = 14000;
    const OUTRO_START_MS   = 14000;

    // ---------- FORCE LAYERING + HIDE EVERYTHING ------
    // video
    scene.style.position   = "absolute";
    scene.style.inset      = "0";
    scene.style.width      = "100%";
    scene.style.height     = "100%";
    scene.style.objectFit  = "cover";
    scene.style.zIndex     = "1";

    // intro text
    intro.style.position   = "absolute";
    intro.style.inset      = "0";
    intro.style.display    = "none";
    intro.style.opacity    = "0";
    intro.style.zIndex     = "2";

    // main text
    mainTxt.style.position = "absolute";
    mainTxt.style.inset    = "0";
    mainTxt.style.display  = "none";
    mainTxt.style.opacity  = "0";
    mainTxt.style.zIndex   = "2";

    // outro overlay
    outro.style.position   = "absolute";
    outro.style.inset      = "0";
    outro.style.display    = "none";
    outro.style.opacity    = "0";
    outro.style.zIndex     = "3";

    // make sure jingle is ready
    jingle.volume = 1.0;

    // ---------- 3.1 PLAY SINGLE moodskin VIDEO --------
    const moodSkinUrl = "/videos/moodskin01.mp4";
    scene.src = moodSkinUrl;
    scene.loop = false;
    scene.muted = true;
    scene.playsInline = true;

    await scene.play().catch((err) => {
      console.warn("Autoplay failed, waiting for user interaction.", err);
    });

    // ---------- 3.2 INTRO TEXT (3s–6s) ----------------
    setTimeout(() => {
      const introText = data.intro_text || "";
      console.log("INTRO TEXT:", introText);

      if (introText.trim()) {
        intro.textContent = introText;
        intro.style.display = "flex";
        intro.style.alignItems = "center";
        intro.style.justifyContent = "center";
        intro.style.textAlign = "center";
        intro.style.opacity = "1";
      }
    }, INTRO_START_MS);

    setTimeout(() => {
      intro.style.opacity = "0";
      intro.style.display = "none";
    }, INTRO_END_MS);

    // ---------- 3.3 MAIN MESSAGE (6s–14s) -------------
    setTimeout(() => {
      const text =
        data.content_text ||
        data.content ||
        data.message ||
        "";

      console.log("MAIN TEXT:", text);

      if (text.trim()) {
        mainTxt.textContent = text;
        mainTxt.style.display = "flex";
        mainTxt.style.alignItems = "center";
        mainTxt.style.justifyContent = "center";
        mainTxt.style.textAlign = "center";
        mainTxt.style.opacity = "1";
      }
    }, MAIN_START_MS);

    setTimeout(() => {
      mainTxt.style.opacity = "0";
      mainTxt.style.display = "none";
    }, MAIN_END_MS);

    // ---------- 3.4 OUTRO (14s+) ----------------------
    setTimeout(() => {
      console.log("OUTRO START");

      outro.style.display = "flex";
      outro.style.alignItems = "center";
      outro.style.justifyContent = "center";
      outro.style.textAlign = "center";
      outro.style.opacity = "1";

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
