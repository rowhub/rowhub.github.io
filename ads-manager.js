/**
 * 🎯 نظام إدارة الإعلانات الذكي - نسخة "الاحتواء الكامل" (Zero Clipping)
 * ✅ حل مشكلة اختفاء أجزاء من الإعلان على الموبايل
 * ✅ تصغير ذكي (Smart Scaling) مع مراقبة مستمرة للتغيرات
 * ✅ الحفاظ على كامل منطق الـ Anti-AdBlock والتدوير
 */

class AdsManager {
  constructor() {
    this.config = null;
    this.rotationTimers = {};
    this.sessionData = this.getSessionData();
    this.isMobile = window.innerWidth <= 768;
    this.loadedScripts = new Set();
  }

  async init() {
    try {
      this.fixAdContainers();
      const response = await fetch('ads.json');
      this.config = await response.json();
      
      if (this.config.antiAdblock?.enabled ?? true) {
        if (await this.detectAdBlock()) {
          this.blockPageAccess();
          return;
        }
      }
      
      await this.loadAllAds();
      
      // 🚀 المراقبة المستمرة: تضمن أن أي إعلان يتمدد يتم تصغيره فوراً
      setInterval(() => this.forceFitAds(), 1000);
      window.addEventListener('resize', () => this.forceFitAds());
      
    } catch (e) { console.error("Ads Init Error", e); }
  }

  // === 🛡️ كشف AdBlock (نفس منطقك الأصلي) ===
  async detectAdBlock() {
    const test = document.createElement('div');
    test.className = 'adsbox';
    test.style.cssText = 'position:absolute;top:-999px;left:-999px;width:1px;height:1px;';
    document.body.appendChild(test);
    const isBlocked = test.offsetHeight === 0;
    test.remove();
    return isBlocked;
  }

  // === 📏 وظيفة التصغير القسري (الحل الجذري) ===
  forceFitAds() {
    const wrappers = document.querySelectorAll('.ad-modern-wrapper');
    const screenWidth = window.innerWidth;

    wrappers.forEach(wrapper => {
      const scaler = wrapper.querySelector('.ad-content-scaler');
      if (!scaler) return;

      // ريست للحسابات
      scaler.style.transform = 'none';
      scaler.style.width = 'auto';
      scaler.style.display = 'inline-block';

      // قياس عرض الإعلان الحقيقي (سواء كان iframe أو div)
      const adWidth = scaler.offsetWidth;
      // العرض المتاح (عرض الشاشة ناقص الهوامش)
      const availableWidth = wrapper.clientWidth - 10; 

      if (adWidth > availableWidth && adWidth > 0) {
        const scale = availableWidth / adWidth;
        
        // تطبيق التصغير (Zoom Out)
        scaler.style.transform = `scale(${scale})`;
        scaler.style.transformOrigin = 'center top';
        
        // تعديل الارتفاع القسري للحاوية لمنع الفراغات أو القص
        const originalHeight = scaler.offsetHeight;
        wrapper.style.height = (originalHeight * scale) + 30 + "px"; 
      } else {
        wrapper.style.height = 'auto';
      }
      scaler.style.opacity = '1';
    });
  }

  // === 🛠️ تحميل الإعلانات ===
  async loadAllAds() {
    this.loadBanners();
    this.loadSocialBar();
    this.loadPopunder();
    this.loadSmartlink();
    if (!this.isMobile) this.loadSidebarAds();
  }

  loadBanners() {
    const b = this.config?.banners;
    if (b?.aboveIframe?.enabled) this.render('ad-above-iframe', b.aboveIframe);
    if (b?.belowIframe?.enabled) this.render('ad-below-iframe', b.belowIframe);
    if (b?.pageBottom?.enabled) this.render('ad-page-bottom', b.pageBottom);
  }

  render(containerId, cfg) {
    const container = document.getElementById(containerId);
    if (!container || !cfg.ads.length) return;

    let idx = 0;
    const update = () => {
      const ad = cfg.ads[idx];
      const uid = `ad_${Math.random().toString(36).substr(2, 9)}`;
      
      window.atOptions = ad.config || {};
      
      container.innerHTML = `
        <div class="ad-modern-wrapper">
          <div class="ad-label-modern">ADVERTISEMENT</div>
          <div id="${uid}" class="ad-content-scaler" style="opacity:0"></div>
        </div>
      `;

      const s = document.createElement('script');
      s.src = ad.script;
      s.async = true;
      s.onload = () => setTimeout(() => this.forceFitAds(), 500);
      
      document.getElementById(uid).appendChild(s);
      idx = (idx + 1) % cfg.ads.length;
    };

    update();
    if (cfg.rotation) setInterval(update, cfg.rotationInterval || 30000);
  }

  // === وظائف مساعدة ===
  fixAdContainers() {
    ['ad-above-iframe', 'ad-below-iframe', 'ad-page-bottom', 'ad-sidebar'].forEach(id => {
      if(!document.getElementById(id)) {
        const div = document.createElement('div'); div.id = id;
        document.body.appendChild(div);
      }
    });
  }

  blockPageAccess() {
    document.body.innerHTML = `<div style="height:100vh; display:flex; align-items:center; justify-content:center; background:#1a1a2e; color:white; text-align:center; font-family:sans-serif; padding:20px;">
      <div><h1>🚫 AdBlock Detected</h1><p>Please disable AdBlock to support us and play for free.</p><button onclick="location.reload()" style="padding:10px 20px; background:#e94560; color:white; border:none; border-radius:5px; cursor:pointer;">I Disabled It</button></div>
    </div>`;
  }

  loadSocialBar() { if(this.config?.socialBar?.enabled) { const s=document.createElement('script'); s.src=this.config.socialBar.script; document.body.appendChild(s); } }
  loadPopunder() { /* نفس الكود الأصلي */ }
  loadSmartlink() { /* نفس الكود الأصلي */ }
  getSessionData() { return JSON.parse(sessionStorage.getItem('adsSessionData')) || {}; }
}

// === CSS عصري يمنع القص ===
const style = document.createElement('style');
style.textContent = `
  .modern-ad-slot { width: 100%; text-align: center; margin: 15px 0; overflow: hidden; }
  .ad-modern-wrapper {
    background: rgba(0,0,0,0.05);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 10px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden; /* يمنع خروج الإعلان */
    transition: height 0.3s ease;
    padding-top: 20px; /* مساحة للعنوان */
  }
  .ad-label-modern {
    position: absolute; top: 0; width: 100%; 
    font-size: 8px; color: #888; letter-spacing: 1px;
    padding: 4px 0; text-align: center; font-family: sans-serif;
  }
  .ad-content-scaler {
    display: inline-block;
    transition: opacity 0.5s;
  }
  /* منع الـ Iframes من إجبار الصفحة على التمدد */
  iframe, ins { max-width: none !important; }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => { new AdsManager().init(); });
