import { s as b } from "./supabaseClient-BwOpdCdS.js";
/* empty css              */ import {
  i as _,
  c as m,
} from "./auth-Cmuchn6L.js";
import "./fx-MZtdpLfd.js";
import "./sidebar-OR1tndCD.js";
let f = [],
  x = [],
  v = [],
  c = [];
const u = document.getElementById("homepage-canvas");
async function k() {
  await _();
  const [t, e, a, r] = await Promise.all([
    b
      .from("homepage_blocks")
      .select("*")
      .order("order_index", { ascending: !0 }),
    b
      .from("articles")
      .select(
        "id, title, subtitle, thumbnail_url, color_tag, post_date, hidden, series_id, order_index",
      ),
    b.from("series").select("*"),
    b.from("splash_slides").select("*").order("order_index", { ascending: !0 }),
  ]);
  (t.error
    ? (t.error.code !== "42P01" && console.error(t.error), (f = []))
    : (f = t.data),
    (x = e.data || []),
    (v = a.data || []),
    (c = r.data || []),
    $(),
    u &&
      setTimeout(() => {
        u.classList.remove("opacity-0");
      }, 100));
}
function y(t) {
  return (
    {
      PURPLE: "#a78bfa",
      ORANGE: "#f59e0b",
      RED: "#ef4444",
      CYAN: "#22d3ee",
      GREEN: "#86efac",
      PINK: "#f472b6",
    }[t] || "#a78bfa"
  );
}
function h(t) {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function $() {
  if (!u) return;
  if (f.length === 0) {
    u.innerHTML = `
            <div class="text-center py-20 text-[#a78bfa]/50 uppercase tracking-[0.3em] font-bold text-xs border-y border-[#a78bfa]/20 bg-[#a78bfa]/5">
                NETWORK EMPTY. NO BLOCKS CONFIGURED.
            </div>`;
    return;
  }
  let t = "";
  (f.forEach((e) => {
    e.block_type === "SPLASH_CAROUSEL"
      ? (t += I())
      : e.block_type === "FEATURED_FOLDER"
        ? (t += N(e.content_id))
        : e.block_type === "PINNED_ARTICLE" && (t += L(e.content_id));
  }),
    (u.innerHTML = t),
    S());
}
function I() {
  if (c.length === 0) return "";
  let t = c
      .map((a) => {
        const r = a.image_url
            ? `<img src="${a.image_url}" alt="${a.title}" class="w-full max-h-48 md:max-h-64 object-cover mb-6 border border-[#a78bfa]/20">`
            : "",
          d = a.body
            ? a.body
                .split(
                  `
`,
                )
                .filter(Boolean)
                .map((l) => `<p>${l}</p>`)
                .join("")
            : "",
          s = a.link_url
            ? `<a href="${a.link_url}" target="_blank"
               class="inline-block mt-6 text-[10px] text-[#a78bfa]/70 hover:text-black hover:bg-[#a78bfa] transition-colors tracking-widest uppercase border border-[#a78bfa]/30 px-6 py-3 font-bold">
               ${a.link_label || "[ OPEN LINK ]"}
             </a>`
            : "";
        return `
          <div class="min-w-full p-6 md:p-12 flex flex-col items-center justify-center">
            ${r}
            <h2 class="text-xl md:text-3xl text-white font-bold tracking-[0.2em] uppercase mb-4 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">${a.title}</h2>
            <div class="text-[11px] md:text-xs text-white/70 leading-relaxed font-mono text-center space-y-3 max-w-2xl">${d}</div>
            ${s}
          </div>`;
      })
      .join(""),
    e = c
      .map(
        (a, r) =>
          `<button class="hp-carousel-dot w-2 h-2 rounded-full transition-all ${r === 0 ? "bg-[#a78bfa] scale-125" : "bg-[#a78bfa]/30 hover:bg-[#a78bfa]/60"}" data-index="${r}"></button>`,
      )
      .join("");
  return `
      <div class="w-full relative shadow-[0_0_50px_rgba(167,139,250,0.05)] hp-carousel-container">
        <!-- SOVEREIGN EDIT BUTTON -->
        ${
          m === "SOVEREIGN"
            ? `
        <a href="/admin/splash" class="absolute -top-8 right-0 text-[9px] font-bold tracking-widest uppercase border border-[#a78bfa]/40 text-[#a78bfa]/60 hover:text-[#a78bfa] hover:border-[#a78bfa] px-3 py-1 transition-colors z-10">
          [ EDIT CAROUSEL CARDS ]
        </a>`
            : ""
        }
        
        <div class="overflow-hidden border border-[#a78bfa]/20 bg-[#05010a]/50 glass-panel">
          <div class="hp-carousel-track flex transition-transform duration-500 ease-in-out" data-count="${c.length}">
            ${t}
          </div>
        </div>
        ${
          c.length > 1
            ? `
        <div class="flex items-center justify-between mt-4 px-2">
          <button class="hp-carousel-prev text-[10px] font-bold text-[#a78bfa]/50 hover:text-[#a78bfa] tracking-widest uppercase border border-transparent hover:border-[#a78bfa]/60 px-4 py-2 transition-colors">
            &lt; PREV
          </button>
          <div class="hp-carousel-dots flex gap-3 items-center">
            ${e}
          </div>
          <button class="hp-carousel-next text-[10px] font-bold text-[#a78bfa]/50 hover:text-[#a78bfa] tracking-widest uppercase border border-transparent hover:border-[#a78bfa]/60 px-4 py-2 transition-colors">
            NEXT &gt;
          </button>
        </div>`
            : ""
        }
      </div>
    `;
}
function N(t) {
  const e = v.find((o) => o.id === t);
  if (!e) return "";
  let a = ["OPERATOR", "SOVEREIGN"].includes(m);
  if (e.hidden && !a) return "";
  let s = x
    .filter((o) => o.series_id === e.id && (a || !o.hidden))
    .sort((o, n) => (o.order_index || 0) - (n.order_index || 0))
    .slice(0, 4);
  if (s.length === 0) return "";
  let l = s
    .map((o) => {
      let n = y(o.color_tag),
        p =
          o.thumbnail_url ||
          "https://images.unsplash.com/photo-1544256718-3bcf237f3974?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        i = o.post_date
          ? new Date(o.post_date).toLocaleDateString()
          : "UNKNOWN";
      return `
            <a href="/codex/?series=${h(e.title)}&id=${o.id}" class="group flex flex-col border border-[#a78bfa]/20 bg-[#05010a]/60 hover:bg-[#a78bfa]/5 transition-all overflow-hidden relative">
                <div class="w-full aspect-video border-b border-[#a78bfa]/20 relative overflow-hidden bg-black">
                    <img src="${p}" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#05010a] to-transparent"></div>
                    <div class="absolute top-2 right-2 text-[9px] font-bold px-2 py-1 border bg-black/50 backdrop-blur" style="border-color:${n}; color:${n}">
                        ${i}
                    </div>
                </div>
                <div class="p-4 flex-1 flex flex-col">
                    <h3 class="text-sm md:text-xs lg:text-sm font-bold text-white uppercase tracking-wider mb-2 group-hover:text-[#a78bfa] transition-colors leading-snug">${o.title}</h3>
                    ${o.subtitle ? `<p class="text-[10px] text-white/50 tracking-widest uppercase line-clamp-2 mt-auto leading-relaxed border-t border-[#a78bfa]/20 pt-2">${o.subtitle}</p>` : ""}
                </div>
            </a>
        `;
    })
    .join("");
  return `
        <div class="w-full relative">
            ${e.hidden ? '<div class="absolute -top-3 -left-3 text-[#f59e0b] border border-[#f59e0b]/50 bg-[#05010a] px-2 py-1 text-[8px] tracking-[0.2em] uppercase font-bold z-10">[ HIDDEN LAYER ]</div>' : ""}
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b border-[#a78bfa]/30 pb-3">
                <div>
                   ${e.category_label ? `<span class="text-[10px] text-[#a78bfa]/60 tracking-[0.2em] font-bold block mb-1">${e.category_label}</span>` : ""}
                   <h2 class="text-2xl text-white font-bold tracking-[0.2em] uppercase drop-shadow-[0_0_15px_rgba(167,139,250,0.3)]">${e.title}</h2>
                </div>
                <a href="/codex/?series=${h(e.title)}" class="mt-4 md:mt-0 text-[10px] font-bold border border-[#a78bfa]/30 text-[#a78bfa]/80 hover:text-black hover:bg-[#a78bfa] px-4 py-2 uppercase tracking-widest transition-colors shrink-0">
                    VIEW FULL ARCHIVE →
                </a>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                ${l}
            </div>
        </div>
    `;
}
function L(t) {
  const e = x.find((o) => o.id === t);
  if (!e) return "";
  let a = ["OPERATOR", "SOVEREIGN"].includes(m);
  if (e.hidden && !a) return "";
  let r = y(e.color_tag),
    d =
      e.thumbnail_url ||
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    s = e.post_date ? new Date(e.post_date).toLocaleDateString() : "UNKNOWN",
    l = `/codex/?id=${e.id}`;
  return `
        <div class="w-full border border-[${r}]/30 bg-[#05010a]/80 shadow-[0_0_30px_rgba(${g(r)},0.05)] hover:shadow-[0_0_40px_rgba(${g(r)},0.15)] transition-all group overflow-hidden relative" style="border-color: ${r}40;">
            ${e.hidden ? '<div class="absolute top-2 right-2 text-[#f59e0b] border border-[#f59e0b]/50 bg-[#05010a] px-2 py-1 text-[8px] tracking-[0.2em] uppercase font-bold z-10 block">[ HIDDEN TRANSMISSION ]</div>' : ""}
            <div class="flex flex-col lg:flex-row">
                <div class="lg:w-1/2 md:aspect-video lg:aspect-auto min-h-[350px] border-b lg:border-b-0 lg:border-r border-[#a78bfa]/20 relative overflow-hidden bg-black">
                    <img src="${d}" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 grayscale group-hover:grayscale-0">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#05010a]/90 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#05010a]"></div>
                </div>
                <div class="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div class="text-[10px] tracking-[0.3em] font-bold mb-4 flex items-center gap-3 drop-shadow-[0_0_5px_rgba(0,0,0,1)]" style="color:${r}">
                        <span>PINNED TRANSMISSION</span>
                        <span class="w-8 h-px bg-current"></span>
                        <span>${s}</span>
                    </div>
                    <h2 class="text-3xl md:text-5xl font-bold text-white uppercase tracking-wider mb-6 leading-tight transition-colors drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" style="text-shadow: 0 0 10px ${r}30;">${e.title}</h2>
                    ${e.subtitle ? `<p class="text-[13px] text-white/50 tracking-widest uppercase leading-relaxed mb-8 max-w-xl border-l-2 pl-4" style="border-color:${r}80">${e.subtitle}</p>` : ""}
                    <div>
                        <a href="${l}" class="inline-block text-[11px] font-bold tracking-[0.2em] uppercase border text-black hover:bg-transparent hover:text-white px-8 py-4 transition-all shadow-[0_0_20px_rgba(${g(r)},0.4)] hover:shadow-none" style="background-color:${r}; border-color:${r}">
                            INITIATE DECRYPTION →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
}
function g(t) {
  const e = parseInt(t.slice(1, 3), 16),
    a = parseInt(t.slice(3, 5), 16),
    r = parseInt(t.slice(5, 7), 16);
  return `${e},${a},${r}`;
}
function S() {
  document.querySelectorAll(".hp-carousel-container").forEach((t) => {
    let e = 0;
    const a = t.querySelector(".hp-carousel-track");
    if (!a) return;
    const r = parseInt(a.dataset.count);
    if (r <= 1) return;
    const d = t.querySelector(".hp-carousel-prev"),
      s = t.querySelector(".hp-carousel-next"),
      l = t.querySelectorAll(".hp-carousel-dot");
    let o = (p) => {
      ((e = (p + r) % r),
        (a.style.transform = `translateX(-${e * 100}%)`),
        l.forEach((i, w) => {
          w === e
            ? (i.classList.add("bg-[#a78bfa]", "scale-125"),
              i.classList.remove("bg-[#a78bfa]/30"))
            : (i.classList.remove("bg-[#a78bfa]", "scale-125"),
              i.classList.add("bg-[#a78bfa]/30"));
        }));
    };
    (d && d.addEventListener("click", () => o(e - 1)),
      s && s.addEventListener("click", () => o(e + 1)),
      l.forEach((p, i) => p.addEventListener("click", () => o(i))));
    let n = setInterval(() => o(e + 1), 6e3);
    (t.addEventListener("mouseenter", () => clearInterval(n)),
      t.addEventListener("mouseleave", () => {
        (clearInterval(n), (n = setInterval(() => o(e + 1), 6e3)));
      }));
  });
}
window.addEventListener("DOMContentLoaded", k);
const E = "vw_guest_dismissed";
function R() {
  const t = document.createElement("div");
  if (
    ((t.id = "guest-nudge"),
    (t.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 499;
    background: rgba(5,1,10,0.95);
    border-top: 1px solid rgba(167,139,250,0.25);
    padding: 0.6rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    font-family: monospace;
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(167,139,250,0.45);
    animation: nudgeUp 0.6s ease forwards;
  `),
    (t.innerHTML = `
    <span>Create a free account to unlock your archive →</span>
    <button id="gg-nudge-join" style="
      background:none;
      border:1px solid rgba(167,139,250,0.35);
      color:rgba(167,139,250,0.7);
      font-family:monospace;
      font-size:9px;
      letter-spacing:0.2em;
      text-transform:uppercase;
      padding:0.3rem 0.75rem;
      cursor:pointer;
      transition:all 0.2s;
    "
      onmouseover="this.style.background='rgba(167,139,250,0.15)';this.style.color='#a78bfa'"
      onmouseout="this.style.background='none';this.style.color='rgba(167,139,250,0.7)'"
    >[ JOIN ]</button>
    <button id="gg-nudge-close" style="
      background:none;
      border:none;
      color:rgba(167,139,250,0.25);
      font-family:monospace;
      font-size:10px;
      cursor:pointer;
      padding:0 0.25rem;
    ">×</button>
  `),
    !document.getElementById("guest-gate-styles"))
  ) {
    const e = document.createElement("style");
    ((e.id = "guest-gate-styles"),
      (e.textContent = `
      @keyframes nudgeUp {
        from { transform: translateY(100%); }
        to   { transform: translateY(0); }
      }
      @keyframes nudgeDown {
        from { transform: translateY(0); opacity: 1; }
        to   { transform: translateY(100%); opacity: 0; }
      }
    `),
      document.head.appendChild(e));
  }
  (document.body.appendChild(t),
    document.getElementById("gg-nudge-join")?.addEventListener("click", () => {
      document.getElementById("btn-nav-register")?.click();
    }),
    document.getElementById("gg-nudge-close")?.addEventListener("click", () => {
      O();
    }));
}
function O() {
  const t = document.getElementById("guest-nudge");
  t &&
    ((t.style.animation = "nudgeDown 0.35s ease forwards"),
    setTimeout(() => t.remove(), 350),
    sessionStorage.setItem(E, "1"));
}
function T() {
  const t = document.getElementById("guest-nudge");
  t &&
    ((t.style.animation = "nudgeDown 0.35s ease forwards"),
    setTimeout(() => t.remove(), 350));
}
async function D() {
  if (sessionStorage.getItem(E)) return;
  const {
    data: { session: t },
  } = await b.auth.getSession();
  t ||
    (R(),
    b.auth.onAuthStateChange((e) => {
      e === "SIGNED_IN" && T();
    }));
}
D();
