// Highlight active nav (optional future use)
document.addEventListener('DOMContentLoaded', () => {

  const mqWide = window.matchMedia('(min-width: 821px)');

  const getContainerPaddingY = () => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--container-padding-y').trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 36;
  };

  // Inline top/maxHeight — more reliable than CSS variables for position:fixed in some browsers.
  const updateFixedSidebar = () => {
    const header = document.querySelector('.page-header');
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    if (!mqWide.matches || !header) {
      sidebar.style.removeProperty('top');
      sidebar.style.removeProperty('max-height');
      return;
    }

    const pad = getContainerPaddingY();
    const bottom = header.getBoundingClientRect().bottom;
    const bannerVisible = Math.max(0, bottom);
    const topPx = bannerVisible + pad;
    sidebar.style.top = `${topPx}px`;
    sidebar.style.maxHeight = `calc(100vh - ${topPx}px - 16px)`;
  };

  updateFixedSidebar();
  window.addEventListener('resize', updateFixedSidebar);
  window.addEventListener('load', updateFixedSidebar);
  if (mqWide.addEventListener) {
    mqWide.addEventListener('change', updateFixedSidebar);
  } else {
    mqWide.addListener(updateFixedSidebar);
  }

  // Add "↑ Back to top" button
  const btn = document.createElement('button');
  btn.textContent = '↑';
  btn.title = 'Back to top';
  btn.style.cssText = `
    position: fixed; bottom: 28px; right: 28px;
    width: 38px; height: 38px;
    background: #2a6099; color: #fff;
    border: none; border-radius: 50%;
    font-size: 16px; font-weight: 700;
    cursor: pointer; opacity: 0;
    transition: opacity 0.3s, background 0.2s;
    box-shadow: 0 2px 10px rgba(30,60,100,0.18);
    z-index: 999;
  `;
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    updateFixedSidebar();
    const y = window.scrollY || document.documentElement.scrollTop;
    btn.style.opacity = y > 300 ? '1' : '0';
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  btn.addEventListener('mouseenter', () => { btn.style.background = '#c0562a'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = '#2a6099'; });

});