// Read ?id= from the URL, e.g. /v/?id=UUID
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  console.error("No yyovvo id provided in URL (?id=...)");
}

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

    // TIMING (ms)
    const INTRO_START_MS = 1000;   // 1s
    const INTRO_END_MS   = 3500;   // 3.5s
    const MAIN_START_MS  = 3500;   // 3.5s
    const MAIN_DURATION_MS = (Number(data.content_duration) || 10) * 1000;
    const OUTRO_START_MS = MAIN_START_MS + MAIN_DURATION_MS;

    // 1) M O O D  (immediately)
    // If Base44 mood_video_url exists, use it, else use our snow-soft mood
    const moodUrl =
      data.mood_video_url || "/videos/snow-soft.mp4";

    console.log("Mood video URL:", moodUrl);

    scene.loop = false;
    scene.src = moodUrl;
    await scene.play().catch((err) => {
      console.warn("Mood autoplay might be blocked:", err);
    });

    // 2) I N T R O  T E X T
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

    // 3) M A I N  M O M E N T
    if (data.content_type === "text") {
      setTimeout(() => {
        mainText.textContent = data.content_text || "";
        mainText.classList.add("show");
      }, MAIN_START_MS);
    } else if (data.content_type === "audio") {
      const audio = new Audio(data.content_url);
      setTimeout(() => {
        audio.play().catch((err) => {
          console.warn("Main audio play blocked:", err);
        });
      }, MAIN_START_MS);
    } else if (data.content_type === "video") {
      setTimeout(() => {
        if (data.content_url) {
          scene.src = data.content_url;
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

    // 4) O U T R O  (snow + logo + jingle)
    setTimeout(() => {
      // hide main text so it doesn’t overlap "yyovvo"
      if (mainText) {
        mainText.classList.remove("show");
      }

      const outroVideoUrl = data.outro_video_url || "/videos/outro-snow.mp4";
      console.log("Starting OUTRO with video:", outroVideoUrl);

      scene.src = outroVideoUrl;
      scene.loop = true;
      scene.play().catch((err) => {
        console.warn("Scene outro play blocked or failed:", err);
      });

      // show outro text
      if (outro) {
        outro.classList.remove("hidden");
        outro.classList.add("show");
      }

      // play jingle exactly with outro
      if (!jingle) {
        console.error("No #yyo-jingle audio element found");
        return;
      }

      jingle.currentTime = 0;
      jingle.play()
        .then(() => {
          console.log("Jingle started");
        })
        .catch((err) => {
          console.warn("Jingle autoplay blocked, waiting for user click:", err);

          const unlock = () => {
            jingle.currentTime = 0;
            jingle.play().catch(() => {});
            window.removeEventListener("click", unlock);
          };

          window.addEventListener("click", unlock, { once: true });
        });
    }, OUTRO_START_MS);
  } catch (e) {
    console.error("yyovvo player init error:", e);
  }
}

init();
