import { supabase } from './supabaseClient.js';
import { currentRole, initAuth } from './auth.js';

let splashSlides = [];
let homepageBlocks = [];
let globalSeries = [];
let globalArticles = [];

const SIDEBAR_CACHE_KEY = 'vw_sidebar_v1';
const SIDEBAR_CACHE_TTL = 5 * 60 * 1000;

async function fetchSplashSlides() {
  try {
    const { data, error } = await supabase
      .from('splash_slides')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) throw error;
    splashSlides = data || [];
  } catch (e) {
    console.warn('Failed to load splash slides:', e);
    splashSlides = [];
  }
}

async function fetchHomepageBlocks() {
  try {
    const { data, error } = await supabase
      .from('homepage_blocks')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) throw error;
    homepageBlocks = data || [];
  } catch (e) {
    console.warn('Failed to load homepage blocks:', e);
    homepageBlocks = [];
  }
}

async function fetchArticles() {
  try {
    const cached = localStorage.getItem(SIDEBAR_CACHE_KEY);
    if (cached) {
      const { ts, series, articles } = JSON.parse(cached);
      if (Date.now() - ts < SIDEBAR_CACHE_TTL) {
        globalSeries = series;
        globalArticles = articles;
        return;
      }
    }
  } catch (_) {}

  try {
    const [ { data: sData }, { data: aData } ] = await Promise.all([
      supabase.from('series').select('*').order('order_index', { ascending: true }),
      supabase.from('articles').select('*').order('order_index', { ascending: true }),
    ]);

    globalSeries = sData || [];
    globalArticles = aData || [];
    try {
      localStorage.setItem(SIDEBAR_CACHE_KEY, JSON.stringify({
        ts: Date.now(), series: globalSeries, articles: globalArticles
      }));
    } catch (_) {}
  } catch (e) {
    console.error('Failed to load payload:', e);
  }
}

function hexToRgb(hex) {
    if (!hex) return '167,139,250';
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
}

function renderSplashCarouselBlock(block) {
  if (!splashSlides || splashSlides.length === 0) return '';
  
  const trackHtml = splashSlides.map((slide) => {
    const imgHtml = slide.image_url
      ? `<img src="${slide.image_url}" alt="${slide.title}" class="w-full max-h-48 md:max-h-64 object-cover mb-6 border border-[#a78bfa]/20">`
      : '';
    const bodyHtml = slide.body
      ? slide.body.split('\\n').filter(Boolean).map(p => `<p>${p}</p>`).join('')
      : '';
    const linkHtml = slide.link_url
      ? `<a href="${slide.link_url}" target="_blank" class="inline-block mt-6 text-[10px] text-[#a78bfa]/70 hover:text-black hover:bg-[#a78bfa] transition-colors tracking-widest uppercase border border-[#a78bfa]/30 px-6 py-3 font-bold">${slide.link_label || '[ OPEN LINK ]'}</a>`
      : '';
    return `
      <div class="min-w-full p-6 md:p-12 flex flex-col items-center justify-center">
        ${imgHtml}
        <h2 class="text-xl md:text-3xl text-white font-bold tracking-[0.2em] uppercase mb-4 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">${slide.title}</h2>
        <div class="text-[11px] md:text-xs text-white/70 leading-relaxed font-mono text-center space-y-3 max-w-2xl">${bodyHtml}</div>
        ${linkHtml}
      </div>`;
  }).join('');

  const dotsHtml = splashSlides.map((_, i) =>
      `<button class="hp-carousel-dot w-2 h-2 rounded-full transition-all ${i === 0 ? 'bg-[#a78bfa] scale-125' : 'bg-[#a78bfa]/30 hover:bg-[#a78bfa]/60'}" data-index="${i}"></button>`
  ).join('');

  return `
      <div class="w-full relative shadow-[0_0_50px_rgba(167,139,250,0.05)] hp-carousel-container">
        <!-- SOVEREIGN EDIT BUTTON -->
        ${currentRole === 'SOVEREIGN' ? `
        <a href="/admin/splash" class="absolute -top-8 right-0 text-[10px] font-bold tracking-[0.2em] uppercase border border-[#a78bfa]/40 text-[#a78bfa]/60 hover:text-[#a78bfa] hover:border-[#a78bfa] px-4 py-2 transition-colors z-10 bg-[#05010a]/90 backdrop-blur">
          [ EDIT CAROUSEL ]
        </a>` : ''}
        
        <div class="overflow-hidden border border-[#a78bfa]/20 bg-[#05010a]/50 glass-panel">
          <div class="hp-carousel-track flex transition-transform duration-500 ease-in-out" data-count="${splashSlides.length}">
            ${trackHtml}
          </div>
        </div>
        ${splashSlides.length > 1 ? `
        <div class="flex items-center justify-between mt-4 px-2">
          <button class="hp-carousel-prev text-[10px] font-bold text-[#a78bfa]/50 hover:text-[#a78bfa] tracking-widest uppercase border border-transparent hover:border-[#a78bfa]/60 px-4 py-2 transition-colors">
            &lt; PREV
          </button>
          <div class="hp-carousel-dots flex gap-3 items-center">
            ${dotsHtml}
          </div>
          <button class="hp-carousel-next text-[10px] font-bold text-[#a78bfa]/50 hover:text-[#a78bfa] tracking-widest uppercase border border-transparent hover:border-[#a78bfa]/60 px-4 py-2 transition-colors">
            NEXT &gt;
          </button>
        </div>` : ''}
      </div>
  `;
}

function renderFeaturedFolderBlock(block) {
  const targetSeriesId = block.content_id;
  const series = globalSeries.find(s => s.id === targetSeriesId);
  if (!series) return '';
  const isPrivileged = ['OPERATOR', 'SOVEREIGN'].includes(currentRole);
  if (series.hidden && !isPrivileged) return '';

  const articles = globalArticles
      .filter(a => a.series_id === series.id && (isPrivileged || !a.hidden))
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      .slice(0, 4);

  if (articles.length === 0) return '';

  const gridHtml = articles.map(a => {
      const color = a.color_tag || '#a78bfa';
      const thumb = a.thumbnail_url || "https://images.unsplash.com/photo-1544256718-3bcf237f3974?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
      const dateStr = a.post_date ? new Date(a.post_date).toLocaleDateString() : "UNKNOWN";
      
      return `
            <a href="/codex/?series=${series.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}&id=${a.id}" class="group flex flex-col border border-[#a78bfa]/20 bg-[#05010a]/60 hover:bg-[#a78bfa]/5 transition-all overflow-hidden relative">
                <div class="w-full aspect-video border-b border-[#a78bfa]/20 relative overflow-hidden bg-black">
                    <img src="${thumb}" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 font-mono">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#05010a] to-transparent"></div>
                    <div class="absolute top-2 right-2 text-[9px] font-bold px-2 py-1 border bg-black/50 backdrop-blur" style="border-color:${color}; color:${color}">
                        ${dateStr}
                    </div>
                </div>
                <div class="p-4 flex-1 flex flex-col">
                    <h3 class="text-sm md:text-xs lg:text-sm font-bold text-white uppercase tracking-wider mb-2 group-hover:text-[#a78bfa] transition-colors leading-snug">${a.title}</h3>
                    ${a.subtitle ? `<p class="text-[10px] text-white/50 tracking-widest uppercase line-clamp-2 mt-auto leading-relaxed border-t border-[#a78bfa]/20 pt-2">${a.subtitle}</p>` : ""}
                </div>
            </a>
      `;
  }).join('');

  return `
        <div class="w-full relative">
            ${series.hidden ? '<div class="absolute -top-3 -left-3 text-[#f59e0b] border border-[#f59e0b]/50 bg-[#05010a] px-2 py-1 text-[8px] tracking-[0.2em] uppercase font-bold z-10">[ HIDDEN LAYER ]</div>' : ""}
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b border-[#a78bfa]/30 pb-3 mt-12 md:mt-16">
                <div>
                   ${series.category_label ? `<span class="text-[10px] text-[#a78bfa]/60 tracking-[0.2em] font-bold block mb-1">${series.category_label}</span>` : ""}
                   <h2 class="text-2xl text-white font-bold tracking-[0.2em] uppercase drop-shadow-[0_0_15px_rgba(167,139,250,0.3)]">${series.title}</h2>
                </div>
                <a href="/codex/?series=${series.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}" class="mt-4 md:mt-0 text-[10px] font-bold border border-[#a78bfa]/30 text-[#a78bfa]/80 hover:text-black hover:bg-[#a78bfa] px-4 py-2 uppercase tracking-widest transition-colors shrink-0">
                    VIEW FULL ARCHIVE →
                </a>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                ${gridHtml}
            </div>
        </div>
  `;
}

function renderPinnedArticleBlock(block) {
  const targetId = block.content_id;
  const article = globalArticles.find(a => a.id === targetId);
  if (!article) return '';
  const isPrivileged = ['OPERATOR', 'SOVEREIGN'].includes(currentRole);
  if (article.hidden && !isPrivileged) return '';

  const color = article.color_tag || '#a78bfa';
  const rgb = hexToRgb(color);
  const thumb = article.thumbnail_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
  const dateStr = article.post_date ? new Date(article.post_date).toLocaleDateString() : "UNKNOWN";
  const linkLabel = `/codex/?id=${article.id}`;

  return `
        <div class="w-full border border-[${color}]/30 bg-[#05010a]/80 shadow-[0_0_30px_rgba(${rgb},0.05)] hover:shadow-[0_0_40px_rgba(${rgb},0.15)] transition-all group overflow-hidden relative mt-12 md:mt-16" style="border-color: ${color}40;">
            ${article.hidden ? '<div class="absolute top-2 right-2 text-[#f59e0b] border border-[#f59e0b]/50 bg-[#05010a] px-2 py-1 text-[8px] tracking-[0.2em] uppercase font-bold z-10 block">[ HIDDEN TRANSMISSION ]</div>' : ""}
            <div class="flex flex-col lg:flex-row">
                <div class="lg:w-1/2 md:aspect-video lg:aspect-auto min-h-[350px] border-b lg:border-b-0 lg:border-r border-[#a78bfa]/20 relative overflow-hidden bg-black">
                    <img src="${thumb}" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 grayscale group-hover:grayscale-0">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#05010a]/90 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#05010a]"></div>
                </div>
                <div class="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div class="text-[10px] tracking-[0.3em] font-bold mb-4 flex items-center gap-3 drop-shadow-[0_0_5px_rgba(0,0,0,1)]" style="color:${color}">
                        <span>PINNED TRANSMISSION</span>
                        <span class="w-8 h-px bg-current"></span>
                        <span>${dateStr}</span>
                    </div>
                    <h2 class="text-3xl md:text-5xl font-bold text-white uppercase tracking-wider mb-6 leading-tight transition-colors drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" style="text-shadow: 0 0 10px ${color}30;">${article.title}</h2>
                    ${article.subtitle ? `<p class="text-[13px] text-white/50 tracking-widest uppercase leading-relaxed mb-8 max-w-xl border-l-2 pl-4" style="border-color:${color}80">${article.subtitle}</p>` : ""}
                    <div>
                        <a href="${linkLabel}" class="inline-block text-[11px] font-bold tracking-[0.2em] uppercase border text-black hover:bg-transparent hover:text-white px-8 py-4 transition-all shadow-[0_0_20px_rgba(${rgb},0.4)] hover:shadow-none" style="background-color:${color}; border-color:${color}">
                            INITIATE DECRYPTION →
                        </a>
                    </div>
                </div>
            </div>
        </div>
  `;
}

function bindCarouselEvents() {
  document.querySelectorAll(".hp-carousel-container").forEach((container) => {
    let currentIndex = 0;
    const track = container.querySelector(".hp-carousel-track");
    if (!track) return;
    const slideCount = parseInt(track.dataset.count);
    if (slideCount <= 1) return;
    
    const prevBtn = container.querySelector(".hp-carousel-prev");
    const nextBtn = container.querySelector(".hp-carousel-next");
    const dots = container.querySelectorAll(".hp-carousel-dot");
    
    const goToSlide = (idx) => {
        currentIndex = (idx + slideCount) % slideCount;
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        dots.forEach((dot, dotIdx) => {
            if(dotIdx === currentIndex) {
                dot.classList.add("bg-[#a78bfa]", "scale-125");
                dot.classList.remove("bg-[#a78bfa]/30");
            } else {
                dot.classList.remove("bg-[#a78bfa]", "scale-125");
                dot.classList.add("bg-[#a78bfa]/30");
            }
        });
    };
    
    if (prevBtn) prevBtn.addEventListener("click", () => goToSlide(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => goToSlide(currentIndex + 1));
    dots.forEach((dot, idx) => dot.addEventListener("click", () => goToSlide(idx)));
    
    let autoplayInterval = setInterval(() => goToSlide(currentIndex + 1), 6000);
    container.addEventListener("mouseenter", () => clearInterval(autoplayInterval));
    container.addEventListener("mouseleave", () => {
        clearInterval(autoplayInterval);
        autoplayInterval = setInterval(() => goToSlide(currentIndex + 1), 6000);
    });
  });
}

function renderCustomHtmlBlock(block) {
  if (!block.custom_html) return '';
  return `
    <div class="w-full relative mt-12 md:mt-16 sovereign-custom-html">
      ${block.custom_html}
    </div>
  `;
}

function renderCustomLinkBlock(block) {
  if (!block.custom_html) return '';
  try {
      const data = JSON.parse(block.custom_html);
      return `
        <div class="w-full mt-12 md:mt-16 flex justify-center">
            <a href="${data.url}" class="group relative inline-flex items-center justify-center border border-[#e879f9]/40 bg-[#05010a]/80 px-12 py-6 overflow-hidden transition-all hover:border-[#e879f9] shadow-[0_0_30px_rgba(232,121,249,0.05)] hover:shadow-[0_0_40px_rgba(232,121,249,0.2)]">
                <div class="absolute inset-0 bg-[#e879f9]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                <div class="relative z-10 flex flex-col items-center gap-2">
                    <span class="text-[10px] text-[#e879f9]/80 tracking-[0.3em] font-bold uppercase drop-shadow-[0_0_8px_rgba(232,121,249,0.5)] group-hover:text-[#e879f9] transition-colors">
                        EXTERNAL PROTOCOL
                    </span>
                    <span class="text-xl md:text-2xl font-black text-white tracking-[0.1em] uppercase drop-shadow-md group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-all">
                        ${data.title}
                    </span>
                </div>
            </a>
        </div>
      `;
  } catch(e) {
      return '';
  }
}

function renderHomepageCanvas() {
  const canvas = document.getElementById('homepage-canvas');
  if (!canvas) return;

  if (homepageBlocks.length === 0) {
    canvas.innerHTML = `<div class="p-8 text-[#a78bfa]/50 text-xs tracking-widest uppercase text-center border border-[#a78bfa]/20 bg-[#05010a]/50">NO BLOCKS CONFIGURED</div>`;
    return;
  }

  let html = '';
  homepageBlocks.forEach(block => {
    if (block.block_type === 'SPLASH_CAROUSEL') {
      html += renderSplashCarouselBlock(block);
    } else if (block.block_type === 'FEATURED_FOLDER') {
      html += renderFeaturedFolderBlock(block);
    } else if (block.block_type === 'PINNED_ARTICLE') {
      html += renderPinnedArticleBlock(block);
    } else if (block.block_type === 'CUSTOM_HTML') {
      html += renderCustomHtmlBlock(block);
    } else if (block.block_type === 'CUSTOM_LINK') {
      html += renderCustomLinkBlock(block);
    }
  });

  canvas.innerHTML = html;
  bindCarouselEvents();
  
  const loader = document.getElementById('loading-indicator');
  if (loader) {
    loader.classList.add('opacity-0');
    setTimeout(() => loader.classList.add('hidden'), 500); // Wait for fade out
  }
  
  canvas.classList.remove('opacity-0');
}

async function init() {
  await initAuth();
  await Promise.all([fetchSplashSlides(), fetchHomepageBlocks(), fetchArticles()]);
  renderHomepageCanvas();
}

window.addEventListener('DOMContentLoaded', init);
