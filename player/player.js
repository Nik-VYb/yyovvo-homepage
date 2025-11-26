// Read ?id= from the URL, e.g. /v/?id=UUID
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  console.error("No yyovvo id provided in URL (?id=...)");
}

async function loadData() {
  // Call the REAL Base44 yyovvoGet function
  const url = `https://moment-cf83ed32.base44.app/api/apps/69023ddd9333e12fcf83ed32/functions/yyovvoGet?id=${encodeURIComponent(
    id
  )}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to load yyovvo data");
  }
  return await res.json();
}

async function init() {
  try {
    const data = await loadData();

    const scene = document.getElementById("scene");
    const intro = document.getElementById("overlay-intro");
    const mainText = document.getElementById("overlay-main-text");
    const outro = document.getElementById("overlay-outro");
    const jingle = document.getElementById("yyo-jingle");

    // 1) Play Mood video
    scene.src = data.mood_video_url;
    await scene.play().catch(() => {
      // Autoplay might fail on some browsers if not muted; we already set muted in HTML.
    });

    // Intro appears at 5 seconds
    setTimeout(() => {
      if (data.intro_text) {
        intro.textContent = data.intro_text || "";
        intro.classList.add("show");
      }
    }, 5000);

    // Hide intro after 3 seconds
    setTimeout(() => {
      intro.classList.remove("show");
    }, 8000);

    // 2) Main clip logic
    const mainStartMs = 8000;
    const durationMs = (Number(data.content_duration) || 10) * 1000;

    if (data.content_type === "text") {
      setTimeout(() => {
        mainText.textContent = data.content_text || "";
        mainText.classList.add("show");
      }, mainStartMs);
    } else if (data.content_type === "audio") {
      const audio = new Audio(data.content_url);
      setTimeout(() => {
        audio.play().catch(() => {});
      }, mainStartMs);
    } else if (data.content_type === "video") {
      setTimeout(() => {
        scene.src = data.content_url;
        scene.play().catch(() => {});
      }, mainStartMs);
    }

    // 3) Outro at end of main clip
    const outroStart = mainStartMs + durationMs;

    setTimeout(() => {
      outro.classList.add("show");
      jingle.play().catch(() => {});
    }, outroStart);
  } catch (e) {
    console.error(e);
  }
}

init();
