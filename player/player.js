// Read ?id= from the URL, e.g. /v/?id=UUID
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  console.error("No yyovvo id provided in URL (?id=...)");
}

// ---------------------- LOAD DATA FROM BASE44 ----------------------

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

// ------------------------- MAIN CINEMATIC --------------------------

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

    // ---- TIMING (ms)  ----
    // 0–3s   = moodskin only
    // 3–6s   = intro text
    // 6–(6+main) = message (text / audio / video)
    // then    = outro
    const MOOD_DURATION_MS  = 3000; // 3s
    const INTRO_START_MS    = 3000; // 3s
    const INTRO_END_MS      = 6000; // 6s
    const MAIN_START_MS     = 6000; // 6s
    const MAIN_DURATION_MS  = (Number(data.content_duration) || 8000); // default 8s
    const OUTRO_START_MS    = MAIN_START_MS + MAIN_DURATION_MS;

    // 1) MOOD + SKIN (single file for now)
    // Later we can switch to personality-based URLs like /videos/moodskins/moodskinXX.mp4
    const moodSkinUrl = data.mood_video_url || "/videos/moodskin01.mp4";

    scene.src = moodSkinUrl;
    scene.loop = false;
    scene.muted = true;           // keep muted so autoplay works
    scene.playsInline = true;

    await scene.play().catch((err) => {
      console.warn("Autoplay failed, will wait for user gesture.", err);
    });

    // 2) INTRO TEXT (3–6s)
    setTimeout(() => {
      const introText = data.intro_text || "";
      if (introText.trim().length > 0) {
        intro.textContent = introText;
        intro.classList.add("show");
      }
    }, INTRO_START_MS);

    setTimeout(() => {
      intro.classList.remove("show");
    }, INTRO_END_MS);

    // 3) MAIN MESSAGE (from 6s)
    const type = (data.content_type || "text").toLowerCase();
    const contentUrl = data.content_url || "";

    if (type === "text" || !contentUrl) {
      // Text-only mode: show the main text overlay
      setTimeout(() => {
        const msg = data.content_text || "";
        mainTxt.textContent = msg;
        mainTxt.classList.add("show");
      }, MAIN_START_MS);
    } else if (type === "audio") {
      // Voice mode: play audio over the moodskin video
      const voice = new Audio(contentUrl);
      voice.preload = "auto";

      setTimeout(() => {
        // Optional: show a small hint in text
        const msg = data.content_text || "";
        if (msg.trim().length > 0) {
          mainTxt.textContent = msg;
          mainTxt.classList.add("show");
        }

        voice.play().catch((err) => {
          console.warn("Voice autoplay failed, needs user tap.", err);
        });
      }, MAIN_START_MS);
    } else if (type === "video") {
      // Selfie video mode:
      // After the intro, cut from moodskin to their video
      setTimeout(() => {
        if (!contentUrl) {
          console.warn("content_type=video but no content_url");
          return;
        }
        scene.src = contentUrl;
        scene.loop = false;
        scene.muted = false; // let their voice play
        scene.playsInline = true;
        scene.play().catch((err) => {
          console.warn("User video autoplay failed, needs tap.", err);
        });
      }, MAIN_START_MS);
    } else {
      console.warn("Unknown content_type:", type);
    }

    // 4) OUTRO (snow + logo + jingle)
    setTimeout(() => {
      // Hide main text overlay if visible
      mainTxt.classList.remove("show");

      // Switch to outro snow loop
      scene.src = data.outro_video_url || "/videos/outro-snow.mp4";
      scene.loop = true;
      scene.muted = false; // keep unmuted for ambience if needed
      scene.play().catch(() => {});

      // Show outro overlay
      outro.classList.add("show");

      // Play jingle
      jingle.currentTime = 0;
      jingle.play().catch((err) => {
        console.warn("Jingle autoplay failed (mobile may need tap).", err);
      });
    }, OUTRO_START_MS);

  } catch (e) {
    console.error("yyovvo player init error:", e);
  }
}

init();
