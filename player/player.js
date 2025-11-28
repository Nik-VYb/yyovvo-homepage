// ---------------------------------------------------------------
// yyovvo Cinematic Player (fresh build)
// Single mood+skin video (moodskin01.mp4) + intro + main + outro
// ---------------------------------------------------------------

// Read ?id= from the URL, e.g. /v/?id=UUID
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  console.error("No yyovvo id provided in URL (?id=...)");
}

// Fetch yyovvo data from Base44 (intro_text, content_text, etc.)
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

  // Unwrap Base44 response
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

async function init() {
  try {
    const data = await loadData();

    const introVideo = document.getElementById("intro-video");
    const intro      = document.getElementById("intro-text");
    const mainText   = document.getElementById("message-text");
    const outro      = document.getElementById("outro-overlay");
    const jingle     = document.getElementById("yyo-jingle");

    if (!data) {
      console.error("No data returned from yyovvoGet");
      return;
    }

    console.log("Playing yyovvo with data:", data);

    // -----------------------------------------------------------
    // TIMING (ms)   3 mood  + 3 intro + 8 main + 3 outro trigger
    // -----------------------------------------------------------
    const MOOD_DURATION_MS  = 3000;   // 0–3s (pure mood)
    const INTRO_START_MS    = 3000;   // 3s intro appears
    const INTRO_END_MS      = 6000;   // 6s intro fades
    const MAIN_START_MS     = 6000;   // 6s main line in
    const MAIN_DURATION_MS  = 8000;   // 8s main message
    const OUTRO_START_MS    = MAIN_START_MS + MAIN_DURATION_MS; // 14000ms

    // -----------------------------------------------------------
    // 1) SINGLE VIDEO: mood + skin combined (HARD-WIRED)
    // -----------------------------------------------------------
    const moodSkinUrl = "/videos/moodskin01.mp4";

    introVideo.loop = false;
    introVideo.muted = true;
    introVideo.playsInline = true;
    introVideo.src = moodSkinUrl;

    try {
      await introVideo.play();
      console.log("Autoplay started moodskin01.mp4");
    } catch (err) {
      console.warn("Autoplay failed, waiting for user interaction.", err);
    }

    // -----------------------------------------------------------
    // 2) INTRO TEXT (3s → 6s)
    // -----------------------------------------------------------
    setTimeout(() => {
      if (data.intro_text) {
        intro.textContent = data.intro_text || "";
        intro.classList.add("show");
      } else {
        console.warn("No intro_text in data");
      }
    }, INTRO_START_MS);

    setTimeout(() => {
      intro.classList.remove("show");
    }, INTRO_END_MS);

    // -----------------------------------------------------------
    // 3) MAIN MESSAGE (from 6s)
    // -----------------------------------------------------------
    setTimeout(() => {
      if (!data.content_type || data.content_type === "text") {
        // Default: text message
        mainText.textContent = data.content_text || "";
        mainText.classList.add("show");
      } else if (data.content_type === "audio") {
        const audio = new Audio(data.content_url);
        audio.play().catch(() => {});
      } else if (data.content_type === "video") {
        // future: swap to a specific content video
        console.log("content_type=video not yet implemented; keeping moodskin01.mp4");
      } else {
        console.warn("Unknown content_type:", data.content_type);
      }
    }, MAIN_START_MS);

    // -----------------------------------------------------------
    // 4) OUTRO (snow loop + logo + jingle)  (from ~14s)
    // -----------------------------------------------------------
    setTimeout(() => {
      // hide main text so it doesn’t overlap outro
      mainText.classList.remove("show");

      // swap underlying video to snow loop
      introVideo.src = "/videos/outro-snow.mp4";
      introVideo.loop = true;
      introVideo.muted = true;
      introVideo.playsInline = true;
      introVideo
        .play()
        .then(() => console.log("Playing outro snow"))
        .catch(() => {});

      // show outro overlay
      outro.classList.remove("hidden");
      outro.classList.add("show");

      // play jingle with outro
      if (jingle) {
        jingle.play().catch(() => {});
      }
    }, OUTRO_START_MS);
  } catch (e) {
    console.error("yyovvo player init error:", e);
  }
}

init();
