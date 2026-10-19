(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 打字机 ---------- */
  var typingEl = document.getElementById('typingText');
  var phrases = [
    '热爱编程 / Code Lover',
    '上海交通大学 · 2026 级本科新生',
    '把想法变成能跑起来的项目 _'
  ];
  if (reduceMotion) {
    typingEl.textContent = phrases[0];
  } else {
    var pi = 0, ci = 0, deleting = false;
    (function typeLoop() {
      var full = phrases[pi];
      ci += deleting ? -1 : 1;
      typingEl.textContent = full.slice(0, ci);
      var delay = deleting ? 34 : 78;
      if (!deleting && ci === full.length) { delay = 1900; deleting = true; }
      else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 420; }
      setTimeout(typeLoop, delay);
    })();
  }

  /* ---------- 滚动入场 ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach(function (el, i) {
    el.style.setProperty('--rd', (i % 6) * 0.08 + 's');
  });
  function inViewport(el) {
    var vh = window.innerHeight || document.documentElement.clientHeight || 900;
    return el.getBoundingClientRect().top < vh * 0.92;
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); ro.unobserve(e.target); }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) {
      if (inViewport(el)) el.classList.add('is-visible');
      else ro.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 导航高亮 ---------- */
  var navItems = document.querySelectorAll('.nav-item');
  var sections = document.querySelectorAll('.section');
  function setActive(id) {
    navItems.forEach(function (a) {
      a.classList.toggle('is-active', a.dataset.target === id);
    });
  }
  if ('IntersectionObserver' in window) {
    var no = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-42% 0px -52% 0px' });
    sections.forEach(function (s) { no.observe(s); });
  }

  /* ---------- 复制按钮 ---------- */
  var toast = document.getElementById('toast');
  var toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-show'); }, 1800);
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.dataset.copy;
      var done = function (ok) { showToast(ok ? '已复制 // ' + text : '复制失败，请手动选择'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
      } else {
        done(fallbackCopy(text));
      }
    });
  });

  /* ---------- 卡片光斑跟随 ---------- */
  document.querySelectorAll('.work-card').forEach(function (card) {
    card.addEventListener('mousemove', function (ev) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
      card.style.setProperty('--my', (ev.clientY - r.top) + 'px');
    });
  });

  /* ---------- 护盾视差倾斜 ---------- */
  var shield = document.getElementById('shieldWrap');
  if (shield && !reduceMotion) {
    var hero = document.getElementById('home');
    hero.addEventListener('mousemove', function (ev) {
      var r = hero.getBoundingClientRect();
      var dx = (ev.clientX - r.width / 2) / r.width;
      var dy = (ev.clientY - r.height / 2) / r.height;
      shield.style.transform = 'perspective(900px) rotateY(' + (dx * 9) + 'deg) rotateX(' + (-dy * 9) + 'deg)';
    });
    hero.addEventListener('mouseleave', function () { shield.style.transform = ''; });
  }

  /* ---------- 光标光晕（CSS transition，无 rAF） ---------- */
  var glow = document.getElementById('cursorGlow');
  if (glow && !reduceMotion) {
    glow.style.transition = 'transform 0.35s cubic-bezier(.25,.8,.25,1), opacity 0.3s';
    window.addEventListener('mousemove', function (ev) {
      glow.style.transform = 'translate(' + ev.clientX + 'px,' + ev.clientY + 'px)';
      glow.style.opacity = '1';
    });
  }

  /* ---------- 背景：静态地球（一次性绘制） ---------- */
  var globe = document.getElementById('globe');
  var fx = document.getElementById('fx');
  if (fx) fx.style.display = 'none';

  var W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    globe.width = W * DPR; globe.height = H * DPR;
    globe.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0);
    drawGlobe();
  }

  var N = 800;
  var pts = [];
  (function () {
    var ga = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2;
      var r = Math.sqrt(Math.max(0, 1 - y * y));
      var th = ga * i;
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
  })();

  var arcs = [];
  (function () {
    for (var i = 0; i < 10; i++) {
      var a = pts[(Math.random() * N) | 0];
      var b = pts[(Math.random() * N) | 0];
      arcs.push({ a: a, b: b, phase: Math.random() });
    }
  })();

  var TILT = 0.42;
  var ANG = 0.8;

  function rotate(p) {
    var ca = Math.cos(ANG), sa = Math.sin(ANG);
    var x = p[0] * ca + p[2] * sa;
    var z = -p[0] * sa + p[2] * ca;
    var ct = Math.cos(TILT), st = Math.sin(TILT);
    var y = p[1] * ct - z * st;
    var z2 = p[1] * st + z * ct;
    return [x, y, z2];
  }

  function slerp(a, b, t) {
    var dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    var om = Math.acos(dot);
    if (om < 1e-4) return a;
    var so = Math.sin(om);
    var k1 = Math.sin((1 - t) * om) / so;
    var k2 = Math.sin(t * om) / so;
    return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
  }

  function drawGlobe() {
    var gctx = globe.getContext('2d');
    gctx.clearRect(0, 0, W, H);
    var cx = W * 0.60;
    var cy = H * 0.52;
    var R = Math.min(W, H) * 0.60;

    var halo = gctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.3);
    halo.addColorStop(0, 'rgba(29, 84, 178, 0.40)');
    halo.addColorStop(0.6, 'rgba(16, 52, 122, 0.24)');
    halo.addColorStop(1, 'rgba(4, 7, 15, 0)');
    gctx.fillStyle = halo;
    gctx.beginPath();
    gctx.arc(cx, cy, R * 1.3, 0, Math.PI * 2);
    gctx.fill();

    gctx.lineWidth = 1;
    var lat, lon, s, p, x, y, started;
    for (lat = -60; lat <= 60; lat += 30) {
      var phi = lat * Math.PI / 180;
      var ry = Math.sin(phi), rr = Math.cos(phi);
      gctx.beginPath(); started = false;
      for (s = 0; s <= 48; s++) {
        var th = s / 48 * Math.PI * 2;
        p = rotate([rr * Math.cos(th), ry, rr * Math.sin(th)]);
        if (p[2] < -0.05) { started = false; continue; }
        x = cx + p[0] * R; y = cy + p[1] * R;
        if (!started) { gctx.moveTo(x, y); started = true; } else gctx.lineTo(x, y);
      }
      gctx.strokeStyle = 'rgba(56, 189, 248, 0.13)';
      gctx.stroke();
    }
    for (lon = 0; lon < 180; lon += 30) {
      var l = lon * Math.PI / 180;
      gctx.beginPath(); started = false;
      for (s = 0; s <= 48; s++) {
        var ph = s / 48 * Math.PI * 2;
        p = rotate([Math.cos(ph) * Math.cos(l), Math.sin(ph), Math.cos(ph) * Math.sin(l)]);
        if (p[2] < -0.05) { started = false; continue; }
        x = cx + p[0] * R; y = cy + p[1] * R;
        if (!started) { gctx.moveTo(x, y); started = true; } else gctx.lineTo(x, y);
      }
      gctx.strokeStyle = 'rgba(37, 99, 235, 0.13)';
      gctx.stroke();
    }

    for (var i = 0; i < N; i++) {
      var q = rotate(pts[i]);
      var d = q[2];
      var sx = cx + q[0] * R;
      var sy = cy + q[1] * R;
      var alpha = 0.10 + (d + 1) * 0.36;
      var size = 0.7 + (d + 1) * 0.75;
      gctx.fillStyle = d > 0.15
        ? 'rgba(125, 211, 252,' + alpha.toFixed(3) + ')'
        : 'rgba(59, 130, 246,' + (alpha * 0.75).toFixed(3) + ')';
      gctx.fillRect(sx, sy, size, size);
    }

    var rim = gctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.08);
    rim.addColorStop(0, 'rgba(56, 189, 248, 0)');
    rim.addColorStop(0.72, 'rgba(56, 189, 248, 0.20)');
    rim.addColorStop(1, 'rgba(56, 189, 248, 0)');
    gctx.fillStyle = rim;
    gctx.beginPath();
    gctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
    gctx.fill();

    for (var k = 0; k < arcs.length; k++) {
      var arc = arcs[k];
      gctx.beginPath();
      started = false;
      for (s = 0; s <= 20; s++) {
        var q2 = rotate(slerp(arc.a, arc.b, s / 20));
        if (q2[2] < -0.15) { started = false; continue; }
        var qx = cx + q2[0] * R;
        var qy = cy + q2[1] * R;
        if (!started) { gctx.moveTo(qx, qy); started = true; }
        else gctx.lineTo(qx, qy);
      }
      gctx.strokeStyle = 'rgba(56, 189, 248, 0.20)';
      gctx.lineWidth = 1;
      gctx.stroke();

      var hp = rotate(slerp(arc.a, arc.b, arc.phase));
      if (hp[2] > -0.1) {
        var hx = cx + hp[0] * R;
        var hy = cy + hp[1] * R;
        var pg = gctx.createRadialGradient(hx, hy, 0, hx, hy, 7);
        pg.addColorStop(0, 'rgba(186, 230, 253, 0.95)');
        pg.addColorStop(1, 'rgba(56, 189, 248, 0)');
        gctx.fillStyle = pg;
        gctx.beginPath();
        gctx.arc(hx, hy, 7, 0, Math.PI * 2);
        gctx.fill();
      }
    }
  }

  resize();
  window.addEventListener('resize', resize);
})();
