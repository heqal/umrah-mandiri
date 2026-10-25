/* Logika aplikasi. Isi ada di data/content.js, tema di css/theme.css. */
(function () {
  "use strict";
  var D = window.UMRAH_DATA || {};
  var KEY = "umrah:";
  var $ = function (s, r) { return (r || document).querySelector(s); };

  function store(k, v) {
    try {
      if (v === undefined) { var x = localStorage.getItem(KEY + k); return x === null ? null : JSON.parse(x); }
      localStorage.setItem(KEY + k, JSON.stringify(v));
    } catch (e) { return null; }
  }

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") el.className = attrs[k];
      else if (k === "text") el.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] !== null) el.setAttribute(k, attrs[k]);
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return el;
  }

  var bacaanByCode = {};
  (D.bacaan || []).forEach(function (b) { bacaanByCode[b.kode] = b; });

  var state = {
    tab: store("tab") || (D.tabs && D.tabs[0] && D.tabs[0].id) || "itinerary",
    day: store("day") || ((D.hariInfo && D.hariInfo[0] && D.hariInfo[0].hari) || "Hari 1"),
    q: "",
    done: store("done") || {},
    hideLatin: !!store("hideLatin"),
    hideArti: !!store("hideArti")
  };

  /* ---------- teks dengan tombol kode bacaan (B1, B7b, ...) ---------- */
  function linkify(text) {
    var frag = document.createDocumentFragment();
    if (!text) return frag;
    var re = /\bB\d+b?\b/g, last = 0, m;
    while ((m = re.exec(text))) {
      if (!bacaanByCode[m[0]]) continue;
      frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      (function (code) {
        frag.appendChild(h("button", { class: "chip", type: "button", title: bacaanByCode[code].nama, onclick: function () { openBacaan(code); } }, code));
      })(m[0]);
      last = m.index + m[0].length;
    }
    frag.appendChild(document.createTextNode(text.slice(last)));
    return frag;
  }

  function kv(pairs, wideKeys) {
    var dl = h("dl", { class: "kv" });
    pairs.forEach(function (p) {
      if (!p[1]) return;
      var wide = wideKeys && wideKeys.indexOf(p[0]) >= 0;
      dl.appendChild(h("div", { class: wide ? "wide" : "" }, h("dt", { text: p[0] }), h("dd", { class: p[2] || "" }, p[3] ? linkify(p[1]) : p[1])));
    });
    return dl;
  }

  function match(obj) {
    if (!state.q) return true;
    var q = state.q.toLowerCase();
    return Object.keys(obj).some(function (k) { return String(obj[k]).toLowerCase().indexOf(q) >= 0; });
  }

  /* ---------- kartu bacaan ---------- */
  function bacaanCard(b, inDialog) {
    return h("article", { class: "card", id: inDialog ? null : "b-" + b.kode },
      h("h3", null, h("span", { class: "code", text: b.kode }), b.nama),
      h("div", { class: "meta", text: b.kategori }),
      b.arab ? h("div", { class: "arab", lang: "ar", dir: "rtl", text: b.arab }) : null,
      b.latin ? h("div", { class: "latin", text: b.latin }) : null,
      b.arti ? h("p", { class: "arti", text: b.arti }) : null,
      kv([["Dibaca saat", b.saat], ["Sumber / keterangan", b.sumber, "ref"]], ["Sumber / keterangan"])
    );
  }

  function openBacaan(code) {
    var b = bacaanByCode[code]; if (!b) return;
    var dlg = $("#dlg"), box = $("#dlg .inner");
    box.textContent = "";
    box.appendChild(h("button", { class: "close", type: "button", onclick: function () { dlg.close(); } }, "Tutup"));
    box.appendChild(bacaanCard(b, true));
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }

  /* ---------- progres ---------- */
  function progress() {
    var all = D.itinerary || [], n = all.filter(function (s) { return state.done[s.id]; }).length;
    $("#progress").textContent = "Selesai " + n + " / " + all.length + " langkah";
  }
  function dayDone(hari) {
    var s = (D.itinerary || []).filter(function (x) { return x.hari === hari; });
    return s.length && s.every(function (x) { return state.done[x.id]; });
  }

  /* ---------- tampilan per tab ---------- */
  var views = {};

  views.itinerary = function (root) {
    var info = D.hariInfo || [];
    var days = h("div", { class: "days", role: "tablist" });
    info.forEach(function (d) {
      days.appendChild(h("button", {
        class: "day" + (dayDone(d.hari) ? " done" : ""), role: "tab", "aria-selected": String(d.hari === state.day),
        onclick: function () { state.day = d.hari; store("day", d.hari); render(); }
      }, d.hari.replace("Hari ", "H"), h("small", { text: d.kota })));
    });
    if (!state.q) root.appendChild(days);

    var steps = (D.itinerary || []).filter(function (s) { return state.q ? match(s) : s.hari === state.day; });
    if (!state.q) {
      var cur = info.filter(function (d) { return d.hari === state.day; })[0];
      if (cur) root.appendChild(h("div", { class: "dayhead" }, h("h2", { text: cur.hari + " · " + cur.kota }), h("p", { text: cur.judul })));
    }
    if (!steps.length) root.appendChild(h("p", { class: "empty", text: "Tidak ada langkah." }));
    steps.forEach(function (s) {
      var rukun = /rukun/i.test(s.tahap);
      var cb = h("input", { type: "checkbox", "aria-label": "Tandai selesai", onchange: function (e) {
        if (e.target.checked) state.done[s.id] = 1; else delete state.done[s.id];
        store("done", state.done); render();
      } });
      cb.checked = !!state.done[s.id];
      root.appendChild(h("article", { class: "card" + (rukun ? " rukun" : "") + (state.done[s.id] ? " done" : "") },
        h("div", { class: "row" }, cb, h("div", { style: "flex:1;min-width:0" },
          h("div", { class: "meta" }, state.q ? s.hari + " · " : "", s.waktu),
          h("h3", null, h("span", { class: "pill" + (rukun ? " rukun" : ""), text: s.tahap })),
          h("p", { class: "kegiatan", text: s.kegiatan }),
          kv([["Lokasi", s.lokasi], ["Bacaan", s.bacaan, "", true], ["Doa", s.doa], ["Tempat berdoa", s.tempat], ["Catatan", s.catatan, "", false], ["Rujukan buku", s.rujukan, "ref"]], ["Catatan"])
        ))
      ));
    });
    if (!state.q) {
      root.appendChild(h("button", { class: "reset", type: "button", onclick: function () {
        if (!confirm("Hapus semua centang pada " + state.day + "?")) return;
        (D.itinerary || []).forEach(function (s) { if (s.hari === state.day) delete state.done[s.id]; });
        store("done", state.done); render();
      } }, "Reset centang " + state.day));
    }
  };

  views.bacaan = function (root) {
    root.appendChild(h("div", { class: "toggles" },
      h("label", null, (function () { var c = h("input", { type: "checkbox", onchange: function (e) { state.hideLatin = !e.target.checked; store("hideLatin", state.hideLatin); applyBody(); } }); c.checked = !state.hideLatin; return c; })(), "Latin"),
      h("label", null, (function () { var c = h("input", { type: "checkbox", onchange: function (e) { state.hideArti = !e.target.checked; store("hideArti", state.hideArti); applyBody(); } }); c.checked = !state.hideArti; return c; })(), "Arti")
    ));
    var list = (D.bacaan || []).filter(match);
    if (!list.length) root.appendChild(h("p", { class: "empty", text: "Tidak ada hasil." }));
    list.forEach(function (b) { root.appendChild(bacaanCard(b)); });
  };

  views.shalat = function (root) {
    var list = (D.shalat || []).filter(match);
    if (!list.length) root.appendChild(h("p", { class: "empty", text: "Tidak ada hasil." }));
    list.forEach(function (s) {
      var fardhu = /fardhu|wajib/i.test(s.kategori);
      root.appendChild(h("article", { class: "card" + (fardhu ? " rukun" : "") },
        h("h3", null, s.nama), h("div", { class: "meta" }, h("span", { class: "pill" + (fardhu ? " rukun" : ""), text: s.kategori }), s.rakaat ? "Rakaat: " + s.rakaat : ""),
        kv([["Waktu", s.waktu], ["Bacaan", s.bacaan], ["Lokasi", s.lokasi], ["Niat", s.niat, "", false], ["Keterangan", s.keterangan]], ["Keterangan"])
      ));
    });
  };

  views.lokasi = function (root) {
    var list = (D.lokasi || []).filter(match);
    if (!list.length) root.appendChild(h("p", { class: "empty", text: "Tidak ada hasil." }));
    list.forEach(function (l) {
      root.appendChild(h("article", { class: "card" },
        h("h3", { text: l.nama }), h("div", { class: "meta", text: l.waktu }),
        kv([["Letak", l.letak], ["Doa & amalan", l.doa, "", true], ["Keterangan", l.keterangan], ["Status dalil", l.dalil, "ref"], ["Tips", l.tips]], ["Letak"])
      ));
    });
  };

  views.rukun = function (root) {
    var list = (D.rukun || []).filter(match), last = "";
    if (!list.length) root.appendChild(h("p", { class: "empty", text: "Tidak ada hasil." }));
    list.forEach(function (r) {
      var key = /rukun/i.test(r.kelompok);
      root.appendChild(h("article", { class: "card" + (key ? " rukun" : "") },
        h("div", { class: "meta" }, h("span", { class: "pill" + (key ? " rukun" : ""), text: r.kelompok })),
        h("h3", { text: r.item }), h("p", { class: "kegiatan", text: r.penjelasan })
      ));
    });
  };

  views.catatan = function (root) {
    var list = (D.catatan || []).filter(match);
    if (!list.length) root.appendChild(h("p", { class: "empty", text: "Tidak ada hasil." }));
    list.forEach(function (c) { root.appendChild(h("article", { class: "card" }, h("h3", { text: c.topik }), h("p", { class: "kegiatan", text: c.catatan }))); });
  };

  /* ---------- kerangka ---------- */
  function renderTabs() {
    var nav = $("#tabs"); nav.textContent = "";
    (D.tabs || []).forEach(function (t) {
      nav.appendChild(h("button", { class: "tab", role: "tab", "aria-selected": String(t.id === state.tab), onclick: function () {
        state.tab = t.id; state.q = ""; $("#q").value = ""; store("tab", t.id); render(); window.scrollTo(0, 0);
      } }, t.label));
    });
  }

  function render() {
    renderTabs();
    var root = $("#view"); root.textContent = "";
    (views[state.tab] || views.itinerary)(root);
    $("#q").placeholder = state.tab === "itinerary" ? "Cari di seluruh itinerary…" : "Cari…";
    progress();
  }

  function applyBody() {
    document.body.classList.toggle("hide-latin", state.hideLatin);
    document.body.classList.toggle("hide-arti", state.hideArti);
  }

  function applyTheme(t) {
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
    $("#themeBtn").textContent = t === "dark" ? "Tema: gelap" : t === "light" ? "Tema: terang" : "Tema: otomatis";
  }

  function init() {
    var m = D.meta || {};
    document.title = m.judul || "Panduan Umrah";
    $("#judul").textContent = m.judul || "Panduan Umrah";
    $("#subjudul").textContent = m.subjudul || "";
    $("#foot").textContent = m.catatanKaki || "";

    var theme = store("theme") || "auto"; applyTheme(theme);
    $("#themeBtn").addEventListener("click", function () {
      theme = theme === "auto" ? "light" : theme === "light" ? "dark" : "auto"; store("theme", theme); applyTheme(theme);
    });

    var arab = store("arab") || 1.9;
    function setArab(v) { arab = Math.max(1.2, Math.min(3.4, v)); document.documentElement.style.setProperty("--arab-size", arab + "rem"); store("arab", arab); }
    setArab(arab);
    $("#arabPlus").addEventListener("click", function () { setArab(arab + 0.2); });
    $("#arabMinus").addEventListener("click", function () { setArab(arab - 0.2); });

    $("#q").addEventListener("input", function (e) { state.q = e.target.value.trim(); render(); });
    applyBody(); render();

    if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  }
  document.addEventListener("DOMContentLoaded", init);
})();
