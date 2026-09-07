/* ==========================================================================
   Elys.guide — тактильный фронтенд без зависимостей
   ========================================================================== */
(function () {
  "use strict";

  var D = window.ELYS || { chapters: [], modules: [], groups: [], commands: [] };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)");
  var TOUCH = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ---------------------------------------------------------------- haptics */
  function buzz(ms) {
    if (navigator.vibrate && TOUCH) { try { navigator.vibrate(ms || 8); } catch (e) {} }
  }

  /* ------------------------------------------------------------------ toast */
  var toastEl = $("#toast"), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2100);
  }

  /* ------------------------------------------------------------------ theme */
  var THEME_KEY = "elys.theme";
  function setTheme(t, announce) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    var m = $('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "light" ? "#FBFAF9" : "#08090B");
    if (announce) toast(t === "light" ? "Светлая тема" : "Тёмная тема");
  }
  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved) setTheme(saved);
    else if (window.matchMedia("(prefers-color-scheme: light)").matches) setTheme("light");
  })();
  var themeBtn = $("#themeBtn");
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    setTheme(next, true);
    buzz(10);
  });

  /* ------------------------------------------------------------------- boot */
  (function boot() {
    var el = $("#boot"); if (!el) return;
    var log = $("#bootLog");
    var lines = ["initializing elys.guide", "loading core modules", "mounting inline api", "ready"];
    var i = 0;
    var iv = setInterval(function () {
      i++;
      if (log && lines[i]) log.textContent = lines[i];
      if (i >= lines.length - 1) clearInterval(iv);
    }, RM.matches ? 60 : 360);
    var done = function () {
      el.classList.add("is-done");
      el.setAttribute("aria-hidden", "true");
      document.body.classList.add("is-booted");
      setTimeout(function () { el.remove(); }, 700);
      revealAll();
    };
    setTimeout(done, RM.matches ? 260 : 1750);
  })();

  /* --------------------------------------------------------- custom cursor */
  (function cursor() {
    var c = $(".cursor"); if (!c || TOUCH || RM.matches) return;
    var dot = $(".cursor__dot", c), ring = $(".cursor__ring", c);
    var tx = window.innerWidth / 2, ty = window.innerHeight / 2, rx = tx, ry = ty;
    document.body.classList.add("has-cursor");
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = "translate3d(" + tx + "px," + ty + "px,0) translate(-50%,-50%)";
      var t = e.target;
      var hot = t.closest && t.closest("a,button,summary,label,input,.card,.tile,.seg__b,.chip,.nav__a,.road a");
      var txt = t.closest && t.closest("p,h1,h2,h3,pre,code,td,li");
      c.classList.toggle("is-hot", !!hot);
      c.classList.toggle("is-text", !hot && !!txt);
    }, { passive: true });
    window.addEventListener("mousedown", function () { c.classList.add("is-down"); });
    window.addEventListener("mouseup", function () { c.classList.remove("is-down"); });
    document.addEventListener("mouseleave", function () { c.style.opacity = 0; });
    document.addEventListener("mouseenter", function () { c.style.opacity = ""; });
    (function loop() {
      rx += (tx - rx) * 0.17; ry += (ty - ry) * 0.17;
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
  })();

  /* ---------------------------------------------------------------- ripples */
  document.addEventListener("pointerdown", function (e) {
    var t = e.target.closest && e.target.closest(".btn, .copy, .chip, .seg__b, .dock__a, .pill, .footer__top");
    if (!t || RM.matches) return;
    var r = t.getBoundingClientRect();
    var d = Math.max(r.width, r.height) * 2.1;
    var s = document.createElement("span");
    s.className = "ripple";
    s.style.width = s.style.height = d + "px";
    s.style.left = (e.clientX - r.left) + "px";
    s.style.top = (e.clientY - r.top) + "px";
    if (getComputedStyle(t).position === "static") t.style.position = "relative";
    t.appendChild(s);
    setTimeout(function () { s.remove(); }, 640);
    buzz(6);
  }, { passive: true });

  /* ------------------------------------------------------------------- tilt */
  (function tilt() {
    if (TOUCH || RM.matches) return;
    $$("[data-tilt]").forEach(function (el) {
      var max = el.classList.contains("orb") ? 13 : 7;
      var raf = null, cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 }, sc = 1, tsc = 1;
      function run() {
        cur.x += (tgt.x - cur.x) * 0.12; cur.y += (tgt.y - cur.y) * 0.12;
        sc += (tsc - sc) * 0.12;
        el.style.transform = "perspective(900px) rotateX(" + (-cur.y) + "deg) rotateY(" + cur.x + "deg) scale(" + sc + ")";
        if (Math.abs(tgt.x - cur.x) > .01 || Math.abs(tgt.y - cur.y) > .01 || Math.abs(tsc - sc) > .001) raf = requestAnimationFrame(run);
        else { raf = null; if (tsc === 1 && Math.abs(tgt.x) < .01) el.style.transform = ""; }
      }
      function kick() { if (!raf) raf = requestAnimationFrame(run); }
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        tgt.x = (px - .5) * max * 2; tgt.y = (py - .5) * max * 2; tsc = 1.014;
        el.style.setProperty("--mx", (px * 100) + "%");
        el.style.setProperty("--my", (py * 100) + "%");
        kick();
      });
      el.addEventListener("pointerleave", function () { tgt.x = 0; tgt.y = 0; tsc = 1; kick(); });
    });
  })();

  /* ----------------------------------------------------------- reveal + split */
  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  }

  function splitText(el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = "1";
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach(function (w, i) {
      var span = document.createElement("span");
      span.className = "splitword";
      var inner = document.createElement("i");
      inner.textContent = w;
      inner.style.transitionDelay = (i * 55) + "ms";
      span.appendChild(inner);
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  }

  function observeIn(root) {
    $$("[data-split]", root).forEach(function (el) {
      splitText(el);
      $$(".splitword", el).forEach(function (w) {
        if (RM.matches) { w.classList.add("is-in"); return; }
        if (io) io.observe(w); else w.classList.add("is-in");
      });
    });
    $$("[data-reveal]", root).forEach(function (el, i) {
      el.style.transitionDelay = ((i % 6) * 70) + "ms";
      if (io && !RM.matches) io.observe(el); else el.classList.add("is-in");
    });
    $$("[data-count]", root).forEach(function (el) { countUp(el); });
  }

  function revealAll() {
    var active = $(".view.is-active");
    observeIn(active || document);
  }

  function countUp(el) {
    if (el.dataset.counted) return;
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || "";
    var start = null, dur = 1300;
    function step(ts) {
      if (!start) start = ts;
      var p = clamp((ts - start) / dur, 0, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    }
    var trigger = function () {
      if (el.dataset.counted) return;
      el.dataset.counted = "1";
      if (RM.matches) { el.textContent = target + suffix; return; }
      requestAnimationFrame(step);
    };
    if (io) {
      var o = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { trigger(); o.disconnect(); } });
      }, { threshold: .4 });
      o.observe(el);
    } else trigger();
  }

  /* ----------------------------------------------------------------- router */
  var views = {};
  $$("[data-view]").forEach(function (v) { views[v.dataset.view] = v; });
  var order = D.chapters.map(function (c) { return c.route; }).filter(function (r) { return views[r]; });

  function chapterOf(route) {
    for (var i = 0; i < D.chapters.length; i++) if (D.chapters[i].route === route) return D.chapters[i];
    return D.chapters[0];
  }

  function routeFromHash() {
    var h = (location.hash || "").replace(/^#/, "");
    if (!h || h === "/") return "/";
    return views[h] ? h : "/";
  }

  var current = null;
  function go(route, opts) {
    opts = opts || {};
    if (!views[route]) route = "/";
    if (current === route && !opts.force) return;
    var prev = current;
    current = route;

    Object.keys(views).forEach(function (k) {
      views[k].classList.toggle("is-active", k === route);
    });

    var ch = chapterOf(route);
    document.title = (route === "/" ? "Elys — руководство пользователя" : ch.title + " — Elys.guide");

    $$(".nav__a").forEach(function (a) {
      a.classList.toggle("is-on", a.getAttribute("href") === "#" + route);
      if (a.classList.contains("is-on")) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    $$(".topnav__a").forEach(function (a) {
      a.classList.toggle("is-on", a.getAttribute("href") === "#" + route);
    });
    markDock(route);

    if (location.hash.replace(/^#/, "") !== route) {
      if (opts.replace) history.replaceState(null, "", "#" + route);
      else history.pushState(null, "", "#" + route);
    }

    if (prev !== null) window.scrollTo({ top: 0, behavior: RM.matches ? "auto" : "smooth" });
    closeSheet();
    observeIn(views[route]);
    if (route === "/commands") renderCommands();
    if (route === "/") startHero(); else stopHero();
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#/"]');
    if (!a) return;
    var r = a.getAttribute("href").slice(1);
    if (!views[r]) return;
    e.preventDefault();
    buzz(9);
    go(r);
  });

  window.addEventListener("hashchange", function () { go(routeFromHash(), { replace: true }); });

  /* -------------------------------------------------------- swipe between views */
  (function swipe() {
    if (!TOUCH) return;
    var x0 = 0, y0 = 0, t0 = 0, act = false;
    document.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { act = false; return; }
      var t = e.target;
      if (t.closest && t.closest("pre, .table-wrap, .seg, .chips, #sidebar, .palette")) { act = false; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); act = true;
    }, { passive: true });
    document.addEventListener("touchend", function (e) {
      if (!act) return; act = false;
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      if (Date.now() - t0 > 600) return;
      if (Math.abs(dx) < 72 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
      var i = order.indexOf(current);
      if (i < 0) return;
      var next = dx < 0 ? order[i + 1] : order[i - 1];
      if (next) { buzz(14); go(next); }
    }, { passive: true });
  })();

  /* ---------------------------------------------------- topbar / progress / spy */
  var topbar = $("#topbar");
  var pbar = $(".progress i");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      if (topbar) topbar.classList.toggle("is-stuck", y > 8);
      if (pbar) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        pbar.style.width = (h > 0 ? clamp(y / h, 0, 1) * 100 : 0) + "%";
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* -------------------------------------------------------------- mobile sheet */
  var sidebar = $("#sidebar"), scrim = $("#scrim"), menuBtn = $("#menuBtn"), dockMenu = $("#dockMenu");
  var sheetOpen = false;
  function openSheet() {
    if (!sidebar) return;
    sheetOpen = true;
    sidebar.classList.add("is-open");
    if (scrim) { scrim.hidden = false; requestAnimationFrame(function () { scrim.classList.add("is-on"); }); }
    document.body.classList.add("is-locked", "is-menu");
    buzz(12);
  }
  function closeSheet() {
    if (!sidebar || !sheetOpen) return;
    sheetOpen = false;
    sidebar.classList.remove("is-open");
    sidebar.style.transform = "";
    if (scrim) { scrim.classList.remove("is-on"); setTimeout(function () { if (!sheetOpen) scrim.hidden = true; }, 340); }
    document.body.classList.remove("is-locked", "is-menu");
  }
  function toggleSheet() { sheetOpen ? closeSheet() : openSheet(); }
  if (menuBtn) menuBtn.addEventListener("click", toggleSheet);
  if (dockMenu) dockMenu.addEventListener("click", toggleSheet);
  if (scrim) scrim.addEventListener("click", closeSheet);

  (function dragSheet() {
    if (!sidebar || !TOUCH) return;
    var y0 = 0, dy = 0, dragging = false, fromScroll = false;
    var scroller = $(".sidebar__scroll", sidebar);
    sidebar.addEventListener("touchstart", function (e) {
      if (!sheetOpen || e.touches.length !== 1) return;
      var insideScroll = scroller && scroller.contains(e.target) && scroller.scrollTop > 2;
      fromScroll = insideScroll;
      y0 = e.touches[0].clientY; dy = 0; dragging = !insideScroll;
      if (dragging) sidebar.classList.add("is-dragging");
    }, { passive: true });
    sidebar.addEventListener("touchmove", function (e) {
      if (!dragging || fromScroll) return;
      dy = e.touches[0].clientY - y0;
      if (dy < 0) dy = dy * 0.22;
      sidebar.style.transform = "translateY(" + dy + "px)";
    }, { passive: true });
    sidebar.addEventListener("touchend", function () {
      if (!dragging) return;
      dragging = false;
      sidebar.classList.remove("is-dragging");
      if (dy > 96) { closeSheet(); buzz(16); }
      else sidebar.style.transform = "";
    });
  })();

  /* ------------------------------------------------------------------- dock */
  var dock = $("#dock"), dockInk = $(".dock__ink");
  function markDock(route) {
    if (!dock) return;
    var hit = null;
    $$(".dock__a", dock).forEach(function (a) {
      var on = a.dataset.dock === route;
      a.classList.toggle("is-on", on);
      if (on) hit = a;
    });
    if (dockInk) {
      if (hit) {
        dock.classList.add("is-marked");
        dockInk.style.width = hit.offsetWidth + "px";
        dockInk.style.transform = "translateX(" + hit.offsetLeft + "px)";
      } else dock.classList.remove("is-marked");
    }
  }
  window.addEventListener("resize", function () { markDock(current); positionSegPill(); });

  /* ------------------------------------------------------------------ to top */
  var toTop = $("#toTop");
  if (toTop) toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: RM.matches ? "auto" : "smooth" });
    buzz(10);
  });

  /* -------------------------------------------------------------------- copy */
  function copyText(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
    return new Promise(function (res, rej) {
      var ta = document.createElement("textarea");
      ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = 0;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); res(); } catch (e) { rej(e); }
      ta.remove();
    });
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".copy");
    if (!btn) return;
    var sel = btn.dataset.copyTarget;
    var src = sel ? $(sel) : null;
    var txt = src ? src.innerText : "";
    if (!txt) return;
    copyText(txt).then(function () {
      btn.classList.add("is-done");
      var lab = $("span", btn);
      var old = lab ? lab.textContent : null;
      if (lab) lab.textContent = "Скопировано";
      toast("Скопировано в буфер");
      buzz(18);
      setTimeout(function () {
        btn.classList.remove("is-done");
        if (lab && old !== null) lab.textContent = old;
      }, 1700);
    }).catch(function () { toast("Не удалось скопировать"); });
  });

  /* -------------------------------------------------------- install builder */
  var RECIPES = {
    debian: {
      title: "debian / ubuntu — bash",
      pkg: [
        "# 1. системные зависимости",
        "sudo apt update && sudo apt install -y \\",
        "  git python3 python3-pip python3-venv \\",
        "  libcairo2 libcairo2-dev build-essential"
      ]
    },
    fedora: {
      title: "fedora / rhel — bash",
      pkg: [
        "# 1. системные зависимости",
        "sudo dnf install -y git python3 python3-pip \\",
        "  cairo cairo-devel gcc gcc-c++ python3-devel"
      ]
    },
    arch: {
      title: "arch / manjaro — bash",
      pkg: [
        "# 1. системные зависимости",
        "sudo pacman -Syu --needed git python python-pip cairo base-devel"
      ]
    },
    termux: {
      title: "termux (android) — bash",
      pkg: [
        "# 1. пакеты Termux",
        "pkg update -y && pkg upgrade -y",
        "pkg install -y git python cairo libjpeg-turbo clang binutils"
      ],
      noSudoNote: true
    },
    docker: {
      title: "docker — bash",
      docker: true
    }
  };

  function buildScript() {
    var osBtn = $(".seg__b.is-on", $("#builder") || document);
    var os = osBtn ? osBtn.dataset.os : "debian";
    var r = RECIPES[os] || RECIPES.debian;
    var root = $("#optRoot") && $("#optRoot").checked;
    var nogit = $("#optNoGit") && $("#optNoGit").checked;
    var wipe = $("#optWipe") && $("#optWipe").checked;
    var L = [];

    if (r.docker) {
      L.push("# 1. клонируем репозиторий");
      L.push("git clone https://github.com/ZavozDevs/Elys && cd Elys");
      L.push("");
      L.push("# 2. собираем образ и поднимаем контейнер");
      L.push("docker compose up -d --build");
      L.push("");
      L.push("# 3. авторизация — смотрим логи и вводим данные");
      L.push("docker compose logs -f elys");
      if (wipe) {
        L.push("");
        L.push("# снести всё и начать заново");
        L.push("docker compose down -v");
      }
      return { title: r.title, code: L.join("\n") };
    }

    r.pkg.forEach(function (l) { L.push(l); });
    L.push("");
    L.push("# 2. исходный код");
    L.push("git clone https://github.com/ZavozDevs/Elys");
    L.push("cd Elys");
    L.push("");
    L.push("# 3. изолированное окружение Python");
    L.push("python3 -m venv .venv");
    L.push("source .venv/bin/activate");
    L.push("pip install --upgrade pip");
    L.push("pip install -r requirements.txt");
    L.push("");
    L.push("# 4. запуск");

    var flags = [];
    if (root) flags.push("--root");
    if (wipe) flags.push("--wipe");
    var env = nogit ? "ELYS_NO_GIT=1 " : "";
    L.push(env + "python3 -m elys" + (flags.length ? " " + flags.join(" ") : ""));

    if (r.noSudoNote) {
      L.push("");
      L.push("# в Termux нет sudo — это нормально");
      L.push("# если ядро ругается: export NO_SUDO=1");
    }
    if (root) {
      L.push("");
      L.push("# --root разрешает работу от root. Не рекомендуется.");
    }
    if (nogit) {
      L.push("# ELYS_NO_GIT=1 отключает автообновления и .update");
    }
    if (wipe) {
      L.push("# --wipe стирает сессию и базу перед стартом!");
    }
    return { title: r.title, code: L.join("\n") };
  }

  function paintCode(code) {
    return code
      .split("\n")
      .map(function (line) {
        var esc = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (/^\s*#/.test(line)) return '<span class="c">' + esc + "</span>";
        esc = esc.replace(/^(\s*)(sudo|apt|dnf|pacman|pkg|git|cd|python3|python|pip|source|docker|export)\b/,
          '$1<span class="f">$2</span>');
        esc = esc.replace(/(--[a-z-]+|-r\b|-y\b|-d\b|-v\b|-f\b)/g, '<span class="k">$1</span>');
        esc = esc.replace(/(ELYS_NO_GIT=1|NO_SUDO=1)/g, '<span class="n">$1</span>');
        return esc;
      })
      .join("\n");
  }

  var termCode = $("#termCode"), termTitle = $("#termTitle");
  function renderBuilder(animate) {
    if (!termCode) return;
    var out = buildScript();
    if (termTitle) termTitle.textContent = out.title;
    if (animate && !RM.matches) {
      termCode.style.opacity = 0;
      setTimeout(function () {
        termCode.innerHTML = paintCode(out.code);
        termCode.style.transition = "opacity .28s";
        termCode.style.opacity = 1;
      }, 110);
    } else {
      termCode.innerHTML = paintCode(out.code);
    }
  }

  function positionSegPill() {
    var seg = $(".seg"); if (!seg) return;
    var pill = $(".seg__pill", seg), on = $(".seg__b.is-on", seg);
    if (!pill || !on) return;
    pill.style.width = on.offsetWidth + "px";
    pill.style.transform = "translateX(" + on.offsetLeft + "px)";
  }

  $$(".seg__b").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".seg__b").forEach(function (o) { o.classList.remove("is-on"); o.setAttribute("aria-selected", "false"); });
      b.classList.add("is-on");
      b.setAttribute("aria-selected", "true");
      positionSegPill();
      renderBuilder(true);
      buzz(12);
    });
  });
  ["#optRoot", "#optNoGit", "#optWipe"].forEach(function (id) {
    var el = $(id);
    if (el) el.addEventListener("change", function () { renderBuilder(false); buzz(10); });
  });
  renderBuilder(false);
  setTimeout(positionSegPill, 60);

  /* ------------------------------------------------------- commands explorer */
  var cmdList = $("#cmdList"), cmdSearch = $("#cmdSearch"), cmdCount = $("#cmdCount"),
      cmdChips = $("#cmdChips"), cmdEmpty = $("#cmdEmpty");
  var cmdGroup = "Все";

  (function buildChips() {
    if (!cmdChips) return;
    var groups = ["Все"].concat(D.groups);
    cmdChips.innerHTML = groups.map(function (g) {
      return '<button class="chip' + (g === "Все" ? " is-on" : "") + '" data-group="' + g + '">' + g + "</button>";
    }).join("");
    cmdChips.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      cmdGroup = b.dataset.group;
      $$(".chip", cmdChips).forEach(function (c) { c.classList.toggle("is-on", c === b); });
      renderCommands();
      buzz(10);
    });
  })();

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function hl(s, q) {
    if (!q) return esc(s);
    var i = s.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(s);
    return esc(s.slice(0, i)) + '<span class="mark">' + esc(s.slice(i, i + q.length)) + "</span>" + esc(s.slice(i + q.length));
  }

  function renderCommands() {
    if (!cmdList) return;
    var q = (cmdSearch && cmdSearch.value || "").trim().toLowerCase();
    var html = "", total = 0;
    D.modules.forEach(function (mod) {
      if (cmdGroup !== "Все" && mod.g !== cmdGroup) return;
      var rows = mod.cmds.filter(function (c) {
        if (!q) return true;
        var hay = (c.c + " " + (c.a || []).join(" ") + " " + c.d + " " + mod.m + " " + mod.g).toLowerCase();
        return hay.indexOf(q) > -1;
      });
      if (!rows.length) return;
      total += rows.length;
      html += '<div class="cmdmod"><h3 class="cmdmod__h">' + esc(mod.m) + "</h3>";
      rows.forEach(function (c) {
        html += '<article class="cmd">' +
          '<div class="cmd__n">.' + hl(c.c, q) +
          ((c.a && c.a.length) ? ' <em>· .' + c.a.map(function (a) { return esc(a); }).join(" · .") + "</em>" : "") +
          "</div>" +
          '<div class="cmd__d">' + hl(c.d, q) + "</div>" +
          '<div class="cmd__a">' + (c.l ? '<span class="cmd__lock">' + esc(c.l) + "</span>" : "") +
          '<button class="copy" data-copy-text=".' + esc(c.c) + '" title="Скопировать">' +
          '<svg class="ic" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>' +
          "</button></div></article>";
      });
      html += "</div>";
    });
    cmdList.innerHTML = html;
    if (cmdCount) cmdCount.textContent = total + " / " + D.commands.length;
    if (cmdEmpty) cmdEmpty.hidden = total !== 0;
  }

  if (cmdSearch) {
    cmdSearch.addEventListener("input", renderCommands);
    cmdSearch.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { cmdSearch.value = ""; renderCommands(); }
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-copy-text]");
    if (!b) return;
    copyText(b.dataset.copyText).then(function () {
      b.classList.add("is-done");
      toast(b.dataset.copyText + " — скопировано");
      buzz(16);
      setTimeout(function () { b.classList.remove("is-done"); }, 1400);
    });
  });

  /* ----------------------------------------------------------- command palette */
  var palette = $("#palette"), pInput = $("#paletteInput"), pRes = $("#paletteRes");
  var pIndex = [];
  D.chapters.forEach(function (c) {
    pIndex.push({ kind: "Глава", key: c.n, title: c.title, sub: c.hint, route: c.route });
  });
  D.commands.forEach(function (c) {
    pIndex.push({
      kind: c.mod, key: ".", title: "." + c.cmd, sub: c.desc, route: "/commands",
      query: c.cmd, alias: c.aliases.join(" ")
    });
  });

  var pSel = 0, pHits = [];
  function fuzzy(hay, needle) {
    hay = hay.toLowerCase(); needle = needle.toLowerCase();
    if (!needle) return 1;
    var direct = hay.indexOf(needle);
    if (direct === 0) return 1000;
    if (direct > 0) return 700 - direct;
    var hi = 0, score = 0, streak = 0;
    for (var i = 0; i < needle.length; i++) {
      var ch = needle[i], found = -1;
      for (var j = hi; j < hay.length; j++) { if (hay[j] === ch) { found = j; break; } }
      if (found < 0) return 0;
      streak = found === hi ? streak + 1 : 0;
      score += 12 + streak * 6;
      hi = found + 1;
    }
    return score;
  }

  function paintPalette() {
    if (!pRes) return;
    if (!pHits.length) {
      pRes.innerHTML = '<div class="palette__empty">Ничего не нашлось. Попробуйте <code>dlmod</code> или <code>бэкап</code>.</div>';
      return;
    }
    pRes.innerHTML = pHits.map(function (h, i) {
      return '<button class="pres' + (i === pSel ? " is-sel" : "") + '" data-i="' + i + '" role="option">' +
        '<span class="pres__k">' + esc(h.key) + "</span>" +
        '<span class="pres__t"><b>' + esc(h.title) + "</b><span>" + esc(h.sub || "") + "</span></span>" +
        '<span class="pres__c">' + esc(h.kind) + "</span>" +
        "</button>";
    }).join("");
    var sel = $(".pres.is-sel", pRes);
    if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: "nearest" });
  }

  function searchPalette(q) {
    q = (q || "").trim();
    if (!q) {
      pHits = pIndex.filter(function (h) { return h.kind === "Глава"; }).slice(0, 14);
    } else {
      pHits = pIndex.map(function (h) {
        var s = Math.max(
          fuzzy(h.title, q) * 1.4,
          fuzzy(h.sub || "", q) * 0.55,
          fuzzy(h.alias || "", q) * 1.1,
          fuzzy(h.kind, q) * 0.5
        );
        return { h: h, s: s };
      }).filter(function (o) { return o.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, 22)
        .map(function (o) { return o.h; });
    }
    pSel = 0;
    paintPalette();
  }

  function openPalette() {
    if (!palette) return;
    palette.hidden = false;
    document.body.classList.add("is-locked");
    if (pInput) { pInput.value = ""; setTimeout(function () { pInput.focus(); }, 30); }
    searchPalette("");
    buzz(12);
  }
  function closePalette() {
    if (!palette || palette.hidden) return;
    palette.hidden = true;
    document.body.classList.remove("is-locked");
  }
  function runHit(h) {
    if (!h) return;
    closePalette();
    go(h.route);
    if (h.query) {
      setTimeout(function () {
        if (cmdSearch) {
          cmdSearch.value = h.query;
          cmdGroup = "Все";
          if (cmdChips) $$(".chip", cmdChips).forEach(function (c) { c.classList.toggle("is-on", c.dataset.group === "Все"); });
          renderCommands();
        }
      }, 120);
    }
  }

  if ($("#searchBtn")) $("#searchBtn").addEventListener("click", openPalette);
  if ($("#dockSearch")) $("#dockSearch").addEventListener("click", openPalette);
  if (palette) {
    palette.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) { closePalette(); return; }
      var b = e.target.closest(".pres");
      if (b) runHit(pHits[+b.dataset.i]);
    });
  }
  if (pInput) {
    pInput.addEventListener("input", function () { searchPalette(pInput.value); });
    pInput.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); pSel = Math.min(pSel + 1, pHits.length - 1); paintPalette(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); pSel = Math.max(pSel - 1, 0); paintPalette(); }
      else if (e.key === "Enter") { e.preventDefault(); runHit(pHits[pSel]); }
      else if (e.key === "Escape") { closePalette(); }
    });
  }

  document.addEventListener("keydown", function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName || "");
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      palette && palette.hidden ? openPalette() : closePalette();
      return;
    }
    if (e.key === "Escape") { closePalette(); closeSheet(); return; }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "/") { e.preventDefault(); openPalette(); return; }
    if (e.key === "t") { themeBtn && themeBtn.click(); return; }
    var i = order.indexOf(current);
    if (e.key === "j" || e.key === "ArrowRight") { if (order[i + 1]) go(order[i + 1]); }
    if (e.key === "k" || e.key === "ArrowLeft") { if (order[i - 1]) go(order[i - 1]); }
  });

  /* ---------------------------------------------------------- hero canvas art */
  var heroRaf = null;
  function startHero() {
    var cv = $("#heroCanvas");
    if (!cv || RM.matches || heroRaf) return;
    var ctx = cv.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, nodes = [], mouse = { x: -999, y: -999 };
    var N = TOUCH ? 26 : 52;

    function size() {
      var r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      nodes = [];
      for (var i = 0; i < N; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
          r: Math.random() * 1.6 + .7
        });
      }
    }
    size(); seed();
    var onResize = function () { size(); seed(); };
    window.addEventListener("resize", onResize);
    cv.parentElement.addEventListener("pointermove", function (e) {
      var r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    cv.parentElement.addEventListener("pointerleave", function () { mouse.x = mouse.y = -999; });

    function light() { return document.documentElement.getAttribute("data-theme") === "light"; }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      var lt = light();
      var line = lt ? "rgba(18,169,123," : "rgba(140,245,200,";
      var dotc = lt ? "rgba(21,144,184," : "rgba(90,214,240,";
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        var dx = mouse.x - a.x, dy = mouse.y - a.y;
        var md = Math.sqrt(dx * dx + dy * dy);
        if (md < 150 && md > 0) { a.vx -= (dx / md) * .035; a.vy -= (dy / md) * .035; }
        a.vx = clamp(a.vx * .995, -.9, .9); a.vy = clamp(a.vy * .995, -.9, .9);
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
        a.x = clamp(a.x, 0, W); a.y = clamp(a.y, 0, H);

        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var ddx = a.x - b.x, ddy = a.y - b.y;
          var d2 = ddx * ddx + ddy * ddy;
          if (d2 < 15000) {
            var o = (1 - d2 / 15000) * (lt ? .18 : .26);
            ctx.strokeStyle = line + o.toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = dotc + (lt ? .5 : .62) + ")";
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
      }
      heroRaf = requestAnimationFrame(frame);
    }
    heroRaf = requestAnimationFrame(frame);
    startHero._stop = function () {
      cancelAnimationFrame(heroRaf); heroRaf = null;
      window.removeEventListener("resize", onResize);
      ctx.clearRect(0, 0, W, H);
    };
  }
  function stopHero() { if (startHero._stop) { startHero._stop(); startHero._stop = null; } }

  /* ---------------------------------------------------------------- parallax */
  (function parallax() {
    if (TOUCH || RM.matches) return;
    var art = $(".hero__art");
    var chips = $$(".chip-float");
    if (!art) return;
    window.addEventListener("pointermove", function (e) {
      var cx = (e.clientX / window.innerWidth - .5);
      var cy = (e.clientY / window.innerHeight - .5);
      chips.forEach(function (c, i) {
        var k = 12 + i * 7;
        c.style.marginLeft = (cx * k) + "px";
        c.style.marginTop = (cy * k) + "px";
      });
    }, { passive: true });
  })();

  /* ------------------------------------------------------------- faq haptics */
  $$("details.acc").forEach(function (d) {
    d.addEventListener("toggle", function () { if (d.open) buzz(9); });
  });

  /* ------------------------------------------------------------------- start */
  go(routeFromHash(), { replace: true, force: true });
  observeIn(document);
  markDock(current);

  window.addEventListener("load", function () { markDock(current); positionSegPill(); });
})();
