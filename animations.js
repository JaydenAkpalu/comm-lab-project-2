/* ==========================================================
   One Flip Away: animations.js
   Uses GSAP + ScrollTrigger (loaded in index.html BEFORE this file).
   Panel numbers match the captions on the page (Panel 1 to 16).

   Two parts:
     A. The opening book (cover opens, pages flip)
     B. The panel animations that play as you scroll
   ========================================================== */

// ----- Settings you can change ---------------------------------
// Which panel gets which special moment. If your team regroups the
// story into fewer panels, just change these numbers.
const MOMENTS = {
  pullIn: [3, 4, 5],  // the brochure pulls him into campus
  doubt: 6,           // the page fades as he doubts he belongs
  layla: 8,           // Layla sits down and introduces herself
  skylight: 12,       // he looks up and takes a breath
  celebrate: 13,      // they finish the problem set together
  closing: 14,        // the page begins to close
  shut: 15            // he closes the brochure
};

// Turns the page background from day to night near the last panels.
// Leave false until you check that your header and footer text are
// still readable on a dark background (see site.css).
const NIGHT_SHIFT = false;
// ---------------------------------------------------------------

// The panel animations must only be set up once
let pageStarted = false;
function startPage() {
  if (pageStarted) return;
  pageStarted = true;
  setupAnimations();
}

/* ==========================================================
   A. THE OPENING BOOK
   The HTML for the book is in index.html (#intro), the look is in
   intro.css. Here we make it move.
   ========================================================== */
function runBookIntro() {
  const intro = document.getElementById("intro");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // No intro on the page, or the visitor wants less motion: go straight to the comic
  if (!intro || reduceMotion) {
    if (intro) intro.remove();
    startPage();
    return;
  }

  intro.style.animation = "none";                       // cancels the CSS failsafe in intro.css
  document.documentElement.classList.add("intro-lock"); // stops scrolling during the intro
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  const book = intro.querySelector(".book");
  const shadow = intro.querySelector(".book-shadow");
  const leaves = gsap.utils.toArray(intro.querySelectorAll(".leaf")); // cover first, then pages
  const cover = leaves[0];
  const openBtn = document.getElementById("introOpen");
  const skipBtn = document.getElementById("introSkip");
  const count = leaves.length;

  let opened = false;
  let finished = false;
  let peek = null;

  // Each leaf turns around its left edge (the spine).
  // "z" stacks the leaves a tiny bit apart so they do not flicker through each other.
  leaves.forEach((leaf, i) => {
    gsap.set(leaf, { transformOrigin: "left center", z: (count - i) * 2 });
  });
  gsap.set(shadow, { transformOrigin: "right center" });

  // The closed book sits at a slight angle and floats gently
  gsap.set(book, { rotationX: 14, rotationY: -20 });
  const bob = gsap.to(book, { y: -8, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1 });

  // Hovering the cover makes it lift open a little, like a peek
  book.addEventListener("mouseenter", () => {
    if (opened) return;
    if (peek) peek.kill();
    peek = gsap.to(cover, { rotationY: -14, duration: 0.35, ease: "power2.out" });
  });
  book.addEventListener("mouseleave", () => {
    if (opened) return;
    if (peek) peek.kill();
    peek = gsap.to(cover, { rotationY: 0, duration: 0.35, ease: "power2.out" });
  });

  // ----- The timeline: cover opens, pages flip, book zooms and fades -----
  const tl = gsap.timeline({ paused: true, onComplete: finish });

  // The whole book slides right so the open spread ends up centred
  tl.to(book, { y: 0, xPercent: 50, rotationX: 6, rotationY: 0, duration: 1.8, ease: "power2.inOut" }, 0)
    .to(shadow, { scaleX: 2, duration: 1.8, ease: "power2.inOut" }, 0);

  leaves.forEach((leaf, i) => {
    const frontShade = leaf.querySelector(".front .shade");
    const backShade = leaf.querySelector(".back .shade");
    const start = i === 0 ? 0 : 1.5 + (i - 1) * 0.45;   // the pages flip one after another
    const dur = i === 0 ? 1.8 : 1.0;

    // Turn the leaf over (rotationY -180) and swap its stacking order (z)
    tl.to(leaf, { rotationY: -180, z: i * 2, duration: dur, ease: "power2.inOut" }, start)
      // Darken the front side as it turns away, then lighten the back side as it settles
      .fromTo(frontShade, { opacity: 0 }, { opacity: 0.7, duration: dur / 2, ease: "sine.in" }, start)
      .fromTo(backShade, { opacity: 0.7 }, { opacity: 0, duration: dur / 2, ease: "sine.out" }, start + dur / 2);
  });

  // Hold on the open book for a moment, then zoom in and fade into the comic.
  // The panel animations are set up here, so the first panels come out as the book fades.
  tl.addLabel("fade", 4.0)
    .call(() => { window.scrollTo(0, 0); startPage(); }, null, "fade")
    .to(book, { scale: 1.6, duration: 1, ease: "power2.in" }, "fade")
    .to(intro, { opacity: 0, duration: 0.8, ease: "power1.in" }, "fade+=0.3");

  // ----- Buttons and keys -----
  function openBook() {
    if (opened || finished) return;
    opened = true;
    bob.kill();
    if (peek) peek.kill();
    book.style.cursor = "default";
    openBtn.disabled = true;
    gsap.to(openBtn, { opacity: 0, duration: 0.3 });
    tl.play();
  }

  function skip() {
    if (finished) return;
    opened = true;
    bob.kill();
    if (peek) peek.kill();
    tl.kill();
    window.scrollTo(0, 0);
    startPage();
    gsap.to(intro, { opacity: 0, duration: 0.4, onComplete: finish });
  }

  function onKey(e) {
    if (e.key === "Escape") skip();
  }

  function finish() {
    if (finished) return;
    finished = true;
    document.removeEventListener("keydown", onKey);
    intro.remove();
    document.documentElement.classList.remove("intro-lock");
    startPage();
    ScrollTrigger.refresh();
  }

  openBtn.addEventListener("click", openBook);
  book.addEventListener("click", openBook);
  skipBtn.addEventListener("click", skip);
  document.addEventListener("keydown", onKey);
  openBtn.focus({ preventScroll: true });
}

/* ==========================================================
   B. THE PANEL ANIMATIONS (play as you scroll)
   ========================================================== */
function setupAnimations() {
  const panels = gsap.utils.toArray(".panel");

  // Runs a function for panel number n (1 to 16), giving it the panel and its image.
  // If that panel does not exist, nothing happens.
  function withPanel(n, fn) {
    const panel = panels[n - 1];
    if (panel) fn(panel, panel.querySelector("img"));
  }

  // Confetti burst inside one panel (used for the celebration)
  function confettiBurst(panel) {
    // Ignore a second trigger while a burst is still running
    if (panel.dataset.bursting) return;
    panel.dataset.bursting = "yes";
    gsap.delayedCall(2.2, () => delete panel.dataset.bursting);

    const colors = ["#d9a900", "#f2ca35", "#191970", "#fffff0", "#e4572e"];
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;

    for (let i = 0; i < 40; i++) {
      const bit = document.createElement("span");
      bit.style.cssText =
        "position:absolute; top:0; left:0; width:10px; height:14px;" +
        "pointer-events:none; z-index:5; background:" + colors[i % colors.length] + ";";
      panel.appendChild(bit);

      gsap.timeline({ onComplete: () => bit.remove() })
        // shoot up and outward from the middle
        .fromTo(bit,
          { x: w / 2, y: h * 0.55, rotation: 0, opacity: 1 },
          {
            x: gsap.utils.random(w * 0.1, w * 0.9),
            y: gsap.utils.random(h * 0.05, h * 0.45),
            rotation: gsap.utils.random(-360, 360),
            duration: 0.7,
            ease: "power2.out"
          })
        // then fall down and fade away
        .to(bit, { y: h + 20, rotation: "+=360", opacity: 0, duration: 1.2, ease: "power1.in" });
    }
  }

  // Only run the animations if the visitor has not asked for less motion
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {

    // 1. PAGE-FLIP REVEAL: every panel flips into view like a page being turned.
    //    "rotationX" tips the panel back, then it falls flat as you scroll to it.
    panels.forEach((panel, i) => {
      const isLast = i === panels.length - 1;
      gsap.from(panel, {
        opacity: 0,
        y: 60,
        rotationX: -25,
        transformPerspective: 800,
        transformOrigin: "top center",
        duration: isLast ? 1.6 : 0.9,   // the last panel (late at night) arrives more slowly
        ease: "power2.out",
        scrollTrigger: {
          trigger: panel,
          start: "top 85%",                 // when the panel's top reaches 85% down the screen
          toggleActions: "play none none reverse"
        }
      });
    });

    // 2. PULLED IN: the brochure scenes zoom from big and blurry to sharp.
    //    "scrub: true" ties the animation to the scrollbar.
    MOMENTS.pullIn.forEach((n) => withPanel(n, (panel, img) => {
      gsap.fromTo(img,
        { scale: 1.3, filter: "blur(6px)" },
        {
          scale: 1,
          filter: "blur(0px)",
          ease: "none",
          scrollTrigger: { trigger: panel, start: "top 90%", end: "top 35%", scrub: true }
        });
    }));

    // 3. DOUBT: the image drains of colour and softens, then recovers.
    withPanel(MOMENTS.doubt, (panel, img) => {
      gsap.timeline({
        scrollTrigger: { trigger: panel, start: "top 85%", end: "bottom 15%", scrub: true }
      })
        .fromTo(img,
          { opacity: 1, filter: "grayscale(0) blur(0px)" },
          { opacity: 0.45, filter: "grayscale(1) blur(2px)", ease: "none" })
        .to(img, { opacity: 1, filter: "grayscale(0) blur(0px)", ease: "none" });
    });

    // 4. LAYLA ARRIVES: the image slides in from the left and brightens, with a small bounce.
    withPanel(MOMENTS.layla, (panel, img) => {
      gsap.fromTo(img,
        { x: -70, filter: "brightness(0.55) saturate(0.4)" },
        {
          x: 0,
          filter: "brightness(1) saturate(1)",
          duration: 1.1,
          ease: "back.out(1.4)",
          scrollTrigger: { trigger: panel, start: "top 70%", toggleActions: "play none none reverse" }
        });
    });

    // 5. SKYLIGHT GLOW: a soft light grows from the top of the panel as you scroll.
    withPanel(MOMENTS.skylight, (panel) => {
      const glow = document.createElement("div");
      glow.style.cssText =
        "position:absolute; top:0; left:0; width:100%; height:100%;" +
        "pointer-events:none; mix-blend-mode:screen; opacity:0;" +
        "background:radial-gradient(ellipse at 50% 0%, rgba(255,244,190,0.95) 0%, rgba(255,244,190,0) 65%);";
      panel.appendChild(glow);

      gsap.to(glow, {
        opacity: 1,
        ease: "none",
        scrollTrigger: { trigger: panel, start: "top 80%", end: "bottom 40%", scrub: true }
      });
    });

    // 6. CELEBRATION: confetti bursts when the panel comes into view.
    withPanel(MOMENTS.celebrate, (panel) => {
      ScrollTrigger.create({
        trigger: panel,
        start: "top 60%",
        onEnter: () => confettiBurst(panel),
        onEnterBack: () => confettiBurst(panel)
      });
    });

    // 7. THE PAGE BEGINS TO CLOSE: the image swings slightly on its left edge, like a cover moving.
    withPanel(MOMENTS.closing, (panel, img) => {
      gsap.set(img, { transformPerspective: 900, transformOrigin: "left center" });
      gsap.timeline({
        scrollTrigger: { trigger: panel, start: "top 85%", end: "bottom 15%", scrub: true }
      })
        .fromTo(img, { rotationY: 0 }, { rotationY: -22, ease: "none" })
        .to(img, { rotationY: 0, ease: "none" });
    });

    // 8. THE BROCHURE SHUTS: the cover swings flat with a little bounce.
    withPanel(MOMENTS.shut, (panel, img) => {
      gsap.set(img, { transformPerspective: 1000, transformOrigin: "left center" });
      gsap.from(img, {
        rotationY: -80,
        duration: 1.1,
        ease: "back.out(1.4)",
        scrollTrigger: { trigger: panel, start: "top 70%", toggleActions: "play none none reverse" }
      });
    });

    // 9. HOVER: panels lift slightly when the mouse is over them.
    panels.forEach((panel) => {
      panel.addEventListener("mouseenter", () => {
        gsap.to(panel, { scale: 1.03, duration: 0.25, ease: "power1.out" });
      });
      panel.addEventListener("mouseleave", () => {
        gsap.to(panel, { scale: 1, duration: 0.25, ease: "power1.out" });
      });
    });

    // 10. DAY TO NIGHT (optional): the page background darkens toward the last panels.
    if (NIGHT_SHIFT && panels.length > 3) {
      gsap.to("body", {
        backgroundColor: "#0b1030",
        ease: "none",
        scrollTrigger: {
          trigger: panels[panels.length - 4],
          start: "top center",
          endTrigger: panels[panels.length - 1],
          end: "bottom bottom",
          scrub: true
        }
      });
    }
  });

  // Images load lazily, so the page gets taller as you scroll.
  // Tell ScrollTrigger to re-measure so the animations fire at the right spots.
  let refreshTimer;
  const refreshSoon = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
  };
  document.querySelectorAll(".panel img").forEach((img) => {
    if (!img.complete) img.addEventListener("load", refreshSoon);
  });
  window.addEventListener("load", refreshSoon);
}

/* ==========================================================
   START
   ========================================================== */
if (!window.gsap || !window.ScrollTrigger) {
  console.error("GSAP or ScrollTrigger did not load. Check the script tags in index.html.");
  const stuckIntro = document.getElementById("intro");
  if (stuckIntro) stuckIntro.remove();   // never leave the intro blocking the comic
} else {
  gsap.registerPlugin(ScrollTrigger);
  runBookIntro();                         // plays the book, then starts the panel animations
}