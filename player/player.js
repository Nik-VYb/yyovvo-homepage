// Read ?id= from the URL, e.g. /v/?id=UUID
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  console.error("No yyovvo id provided in URL (?id=...)");
}

// --- 1) LOAD DATA FROM BASE44 -----------------------------------------

async function loadData() {
  // Base44 yyovvoGet endpoint
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

// --- 2) MAIN CINEMATIC LOGIC -----------------------------------------

async function init() {
  try {
    const data = await loadData();

    const scene  = document.getElementById("scene");
    const intro  = document.getElementById("overlay-intro");
    const mainText = document.getElementById("overlay-main-text");
    const outro  = document.getElementById("overlay-outro");
    const jingle = document.getElementById("yyo-jingle");

    if (!data) {
      console.error("No data returned from yyovvoGet");
      return;
    }

    console.log("Playing yyovvo with data:", data);

    // TIMING (ms)  --- ONE 14s VIDEO + OUTRO
    const MOOD_DURATION_MS   = 3000;              // 0–3s
    const INTRO_START_MS     = 3000;              // 3s
    const INTRO_END_MS       = 6000;              // 6s
    const MAIN_START_MS      = 6000;              // 6s
    const MAIN_DURATION_MS   = 8000;              // 8s (6–14s)
    const OUTRO_START_MS     = MAIN_START_MS + MAIN_DURATION_MS; // 14000ms

    // 1) SINGLE VIDEO: mood + skin combined
    // For now we fall back to /videos/moodskin01.mp4
    const moodSkinUrl =
      data.mood_video_url || "/videos/moodskin01.mp4";

    scene.loop = false;
    scene.src = moodSkinUrl;
    scene.muted = true; // keep muted for autoplay
    scene.playsInline = true;

    await scene.play().catch((err) => {
      console.warn("Autoplay failed, waiting for user interaction.", err);
    });

    // 2) INTRO TEXT (3s → 6s)
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

    // 3) MAIN MESSAGE (from 6s)
    if (data.content_type === "text" || !data.content_type) {
      setTimeout(() => {
        mainText.textContent = data.content_text || "";
        mainText.classList.add("show");
      }, MAIN_START_MS);
    } else if (data.content_type === "audio") {
      const audio = new Audio(data.content_url);
      setTimeout(() => {
        audio.play().catch(() => {});
      }, MAIN_START_MS);
    } else if (data.content_type === "video") {
      // If you ever want to swap to a user video instead of moodskin:
      setTimeout(() => {
        if (data.content_url) {
          scene.src = data.content_url;
          scene.play().catch(() => {});
        } else {
          console.warn("content_type=video but no content_url");
        }
      }, MAIN_START_MS);
    } else {
      console.warn("Unknown content_type:", data.content_type);
    }

    // 4) OUTRO (after 14s of main video)
    setTimeout(() => {
      // hide main text so it doesn’t overlap "yyovvo"
      mainText.classList.remove("show");

      // switch to snow outro loop
      scene.src = data.outro_video_url || "/videos/outro-snow.mp4";
      scene.loop = true;
      scene.play().catch(() => {});

      // show outro text
      outro.classList.remove("hidden");
      outro.classList.add("show");

      // try to play jingle (may require user interaction on mobile)
      jingle.play().catch((err) => {
        console.warn("Jingle autoplay blocked by browser:", err);
      });
    }, OUTRO_START_MS);
  } catch (e) {
    console.error("yyovvo player init error:", e);
  }
}

init();
