// -------------------------------------------------------
//  yyovvo cinematic player – clean mood+skin wiring
//  Single video: /videos/moodskin01.mp4
//  Text + outro driven by Base44
// -------------------------------------------------------

// Read ?id= from URL: /v/?id=UUID
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  console.warn("No yyovvo id in URL – will still play default video.");
}

// -------- Base44 loader --------------------------------

async function loadData() {
  if (!id) return null;

  const url = `https://moment-cf83ed32.base44.app/api/apps/69023ddd9333e12fcf83ed32/functions/yyovvoGet?id=${encodeURIComponent(
    id
  )}`;

  console.log("Fetching yyovvo from:", url);
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Failed to load yyovvo data. Body:", text);
    return null;
  }

  let raw;
  try {
    raw = await res.json();
  } catch (e) {
    console.error("JSON parse error:", e);
    return null;
  }

  // unwrap possible shapes from Base44
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

  console.log("yyovvo data:", data);
  return data;
}

// -------- Main cinematic logic -------------------------

async function init() {
  try {
    const data = await loadData();

    const scene   = document.getElementById("scene");
    const intro   = document.getElementById("overlay-intro");
    const mainTxt = document.getElementById("overlay-main-text");
    const outro   = document.getElementById("overlay-outro");
    const jingle  = document.getElementById("yyo-jingle");

    if (!scene) {
      console.error("No #scene video element found.");
      return;
    }

    // ONE combined file for now
    const MOODSKIN_URL = "/videos/moodskin01.mp4";

    // TIMING (ms)  -> total ~14s
    const MOOD_DURATION_MS  = 3000;                   // 0–3s just visual feel
    const INTRO_START_MS    = 3000;                   // intro starts at 3s
    const INTRO_END_MS      = 6000;                   // intro ends at 6s
    const MAIN_START_MS     = 6000;                   // main text from 6s
    const MAIN_DURATION_MS  =
      (Number(data?.content_duration) || 8000);       // default 8s
    const OUTRO_START_MS    = MAIN_START_MS + MAIN_DURATION_MS; // ~14s
    const OUTRO_FADE_MS     = 3000;                   // visual outro length

    console.log("Cinematic timings:", {
      MOOD_DURATION_MS,
      INTRO_START_MS,
      INTRO_END_MS,
      MAIN_START_MS,
      MAIN_DURATION_MS,
      OUTRO_START_MS,
      OUTRO_FADE_MS
    });

    // 1) Start the combined mood+skin video immediately
    scene.src = MOODSKIN_URL;
    scene.loop = false;
    scene.muted = true;       // autoplay safety
    scene.playsInline = true;

    await scene.play().catch((err) => {
      console.warn("Autoplay blocked, will wait for user tap.", err);
    });

    // 2) INTRO TEXT (3s–6s)
    setTimeout(() => {
      if (data?.intro_text) {
        intro.textContent = data.intro_text;
        intro.classList.add("show");
      }
    }, INTRO_START_MS);

    setTimeout(() => {
      intro.classList.remove("show");
    }, INTRO_END_MS);

    // 3) MAIN MESSAGE (from 6s)
    setTimeout(() => {
      if (data?.content_type === "text" || !data?.content_type) {
        mainTxt.textContent = data?.content_text || "";
        mainTxt.classList.add("show");
      } else if (data?.content_type === "audio" && data?.content_url) {
        const audio = new Audio(data.content_url);
        audio.play().catch(() => {});
      } else if (data?.content_type === "video" && data?.content_url) {
        // If one day we support separate main video, swap source here
        scene.src = data.content_url;
        scene.play().catch(() => {});
      }
    }, MAIN_START_MS);

    // 4) OUTRO (switch to snow + logo + jingle)
    setTimeout(() => {
      // hide main text so it doesn’t overlap the logo
      mainTxt.classList.remove("show");

      // switch to outro snow loop
      scene.src = "/videos/outro-snow.mp4";
      scene.loop = true;
      scene.muted = false;    // snow can have sound if we ever want it
      scene.play().catch(() => {});

      // show yyovvo outro overlay
      outro.classList.remove("hidden");
      outro.classList.add("show");

      // play jingle once
      jingle?.play().catch((err) => {
        console.warn("Jingle autoplay blocked:", err);
      });
    }, OUTRO_START_MS);

  } catch (err) {
    console.error("yyovvo player init error:", err);
  }
}

init();
