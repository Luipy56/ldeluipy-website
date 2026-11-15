(function () {
  /* Sparse field atoms — same paint DNA as helio3 /assets/field-bg.js, count 3. */
  var canvas = document.createElement("canvas");
  canvas.className = "field-bg";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var ELEMENT_RGB = [
    [148, 158, 173],
    [242, 209, 89],
    [255, 140, 97],
    [115, 219, 122],
    [199, 140, 235],
    [89, 184, 242],
    [56, 122, 209],
    [235, 82, 71],
    [77, 224, 140],
    [250, 184, 102]
  ];

  var GLOW_SCALE = 2.65;
  var CORONA_SCALE = 1.48;
  var BODY_BASE = 9;
  var BODY_STEP = 1.1;
  var BODY_CAP = 16;
  var COUNT = 7;

  var particles = [];
  var w = 0;
  var h = 0;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var d = max - min;
    var hue = 0;
    var s = max === 0 ? 0 : d / max;
    var v = max;
    if (d !== 0) {
      if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) hue = ((b - r) / d + 2) / 6;
      else hue = ((r - g) / d + 4) / 6;
    }
    return { h: hue, s: s, v: v };
  }

  function hsvToRgb(h, s, v) {
    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);
    var r, g, b;
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = q; break;
      default: r = v; g = p; b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function displayColor(rgb) {
    var hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
    var s = clamp(hsv.s * 1.42, 0.44, 1);
    var v = clamp(hsv.v * 1.12, 0, 1);
    return hsvToRgb(hsv.h, s, v);
  }

  function lerpRgb(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];
  }

  function rgba(rgb, a) {
    return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")";
  }

  function periodFor(el) {
    var z = el + 1;
    if (z <= 2) return 1;
    if (z <= 10) return 2;
    return 3;
  }

  function radiusFor(el) {
    var p = periodFor(el);
    return Math.min(BODY_CAP, BODY_BASE + (p - 1) * BODY_STEP);
  }

  function shellAlpha(el) {
    var p = periodFor(el);
    var step = p <= 2 ? 0 : p - 2;
    return Math.min(0.95, 0.58 + step * 0.08);
  }

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    particles = [];
    /* indices into ELEMENT_RGB: He, O(red), C, Li(orange-red), Be, N, O again */
    var picks = [1, 7, 5, 2, 3, 6, 7];
    for (var i = 0; i < COUNT; i++) {
      var el = picks[i] % ELEMENT_RGB.length;
      var speed = rand(0.08, reduced ? 0.12 : 0.42);
      var angle = rand(0, Math.PI * 2);
      var body = displayColor(ELEMENT_RGB[el]);
      particles.push({
        x: rand(w * 0.08, w * 0.96),
        y: rand(h * 0.08, h * 0.92),
        r: radiusFor(el) * rand(0.95, 1.4),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        el: el,
        body: body,
        shellA: shellAlpha(el),
        density: Math.max(0, periodFor(el) - 2),
        fa: rand(0.78, 0.95)
      });
    }
  }

  function paintGlow(x, y, radius, color, alpha) {
    var grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grd.addColorStop(0, rgba(color, alpha));
    grd.addColorStop(0.22, rgba(color, alpha * 0.92));
    grd.addColorStop(0.42, rgba(color, alpha * 0.58));
    grd.addColorStop(0.62, rgba(color, alpha * 0.28));
    grd.addColorStop(0.82, rgba(color, alpha * 0.08));
    grd.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawAtom(p) {
    var fa = p.fa;
    var body = p.body;
    var r = p.r;
    var dens = p.density / 5;
    var haloA = fa * (0.52 + (0.68 - 0.52) * dens) * 0.55;
    var coronaA = fa * (0.38 + (0.5 - 0.38) * dens) * 0.55;
    var shellA = Math.min(0.88, p.shellA * fa * 0.92);

    paintGlow(p.x, p.y, r * GLOW_SCALE, body, haloA);
    paintGlow(p.x, p.y, r * CORONA_SCALE, lerpRgb(body, [255, 255, 255], 0.22), coronaA);

    ctx.fillStyle = rgba(body, shellA);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();

    var core = lerpRgb([255, 255, 255], body, 0.1);
    ctx.fillStyle = rgba(core, Math.min(1, fa * 0.88 + dens * 0.02));
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = rgba([255, 255, 255], Math.min(1, fa * 0.95));
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.16, 0, Math.PI * 2);
    ctx.fill();

    var rim = lerpRgb(body, [255, 255, 255], 0.18);
    ctx.strokeStyle = rgba(rim, Math.min(1, shellA + 0.35));
    ctx.lineWidth = Math.max(1.1, r * 0.12);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (!reduced) {
        p.x += p.vx;
        p.y += p.vy;
        var pad = p.r * GLOW_SCALE + 8;
        if (p.x < -pad) p.x = w + pad;
        if (p.x > w + pad) p.x = -pad;
        if (p.y < -pad) p.y = h + pad;
        if (p.y > h + pad) p.y = -pad;
      }
      drawAtom(p);
    }
    if (!reduced) requestAnimationFrame(tick);
  }

  resize();
  seed();
  tick();

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      seed();
      if (reduced) tick();
    }, 120);
  });
})();
