/**
 * 🎯 نظام إدارة الإعلانات الذكي - النسخة الاحترافية الكاملة
 * ✅ تم حل مشكلة العرض على الهواتف (Auto-Responsive)
 * ✅ تم حل مشكلة ظهور البوب اندر عند التحديث (LocalStorage Persistence)
 * ✅ نظام Anti-AdBlock متكامل مع حجب المحتوى
 */

class AdsManager {
  constructor() {
    this.config = null;
    this.rotationTimers = {};
    this.sessionData = this.getSessionData();
    this.isAdBlockDetected = false;
    this.loadedScripts = new Set();
  }

  // === 1. إدارة البيانات (حل مشكلة التكرار بعد الـ Refresh) ===
  getSessionData() {
    try {
      const data = localStorage.getItem('ads_manager_data');
      const parsed = data ? JSON.parse(data) : {
        popunderCount: 0,
        lastReset: Date.now()
      };

      // إعادة تعيين العداد إذا مر أكثر من 24 ساعة
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - parsed.lastReset > oneDay) {
        return { popunderCount: 0, lastReset: Date.now() };
      }
      return parsed;
    } catch (e) {
      return { popunderCount: 0, lastReset: Date.now() };
    }
  }

  saveSessionData() {
    try {
      localStorage.setItem('ads_manager_data', JSON.stringify(this.sessionData));
    } catch (e) {
      console.error('Error saving session data:', e);
    }
  }

  // === 2. التشغيل والتهيئة ===
  async init() {
    try {
      this.addGlobalStyles(); // إضافة تنسيقات الحماية والتجاوب
      this.fixAdContainers();
      
      const response = await fetch('ads.json');
      if (!response.ok) throw new Error('Failed to load ads.json');
      this.config = await response.json();
      
      const antiAdblockEnabled = this.config.antiAdblock?.enabled ?? true;
      if (antiAdblockEnabled) {
        const adBlockDetected = await this.detectAdBlockEffectively();
        if (adBlockDetected) {
          this.blockPageAccess();
          return;
        }
      }
      
      await this.loadAllAds();
    } catch (error) {
      console.error('❌ خطأ في تهيئة النظام:', error);
    }
  }

  // === 3. تنسيقات CSS (حل مشكلة عرض الموبايل) ===
  addGlobalStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
      .ad-banner {
        max-width: 100% !important;
        overflow: hidden !important;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 10px auto;
      }
      .ad-banner iframe, .ad-banner div { 
        max-width: 100% !important; 
        height: auto !important;
      }
      .ad-label {
        font-size: 10px;
        color: rgba(255,255,255,0.5);
        text-transform: uppercase;
        margin-bottom: 5px;
        width: 100%;
        text-align: center;
      }
      body.adblock-blocked { overflow: hidden !important; }
    `;
    document.head.appendChild(style);
  }

  // === 4. كشف مانع الإعلانات ===
  async detectAdBlockEffectively() {
    const tests = [
      this.testAdElement(),
      this.testAdScript(),
      this.testAdFetch()
    ];
    const results = await Promise.all(tests);
    const failures = results.filter(Boolean).length;
    return failures >= 2;
  }

  async testAdElement() {
    return new Promise(resolve => {
      const el = document.createElement('div');
      el.className = 'ad ads advertisement pub_300x250';
      el.style.cssText = 'position:absolute; top:-999px; left:-999px; width:1px; height:1px;';
      document.body.appendChild(el);
      setTimeout(() => {
        const isBlocked = el.offsetHeight === 0 || window.getComputedStyle(el).display === 'none';
        el.remove();
        resolve(isBlocked);
      }, 100);
    });
  }

  async testAdScript() {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.onload = () => { script.remove(); resolve(false); };
      script.onerror = () => { resolve(true); };
      document.head.appendChild(script);
    });
  }

  async testAdFetch() {
    try {
      await fetch('https://google-analytics.com/analytics.js', { mode: 'no-cors' });
      return false;
    } catch (e) { return true; }
  }

  // === 5. تحميل الإعلانات مع فلترة المقاس للموبايل ===
  loadBannerAd(containerId, bannerConfig) {
    const container = this.ensureContainerExists(containerId);
    if (!container || !bannerConfig.ads) return;

    const screenWidth = window.innerWidth;
    // 📱 فلترة الإعلانات: لا تحمل إعلاناً أعرض من الشاشة
    let suitableAds = bannerConfig.ads.filter(ad => ad.config.width <= (screenWidth - 20));

    if (suitableAds.length === 0) {
      suitableAds = [bannerConfig.ads.sort((a, b) => a.config.width - b.config.width)[0]];
    }

    let currentIndex = 0;
    this.loadSingleAd(container, suitableAds[currentIndex], containerId);

    if (bannerConfig.rotation && suitableAds.length > 1) {
      if (this.rotationTimers[containerId]) clearInterval(this.rotationTimers[containerId]);
      this.rotationTimers[containerId] = setInterval(() => {
        currentIndex = (currentIndex + 1) % suitableAds.length;
        this.loadSingleAd(container, suitableAds[currentIndex], containerId);
      }, bannerConfig.rotationInterval || 30000);
    }
  }

  loadSingleAd(container, ad, containerId) {
    if (!ad || !ad.script) return;
    const uniqueId = `${ad.id}-${Date.now()}`;
    
    // إعداد متغيرات الناشر
    window.atOptions = window.atOptions || {};
    Object.assign(window.atOptions, { ...ad.config, params: ad.config?.params || {} });

    container.innerHTML = `
      <div class="ad-banner" id="wrapper-${uniqueId}">
        <div class="ad-label">Advertisement</div>
        <div id="target-${uniqueId}"></div>
      </div>
    `;

    const script = document.createElement('script');
    script.src = ad.script;
    script.async = true;
    document.getElementById(`target-${uniqueId}`).appendChild(script);
  }

  // === 6. حل مشكلة البوب اندر (يظهر مرة واحدة فقط) ===
  loadPopunder() {
    if (!this.config.popunder?.enabled) return;

    const max = this.config.popunder.maxPerSession || 1;
    if (this.sessionData.popunderCount >= max) {
      console.log('✅ تم عرض البوب اندر سابقاً لهذا المستخدم');
      return;
    }

    setTimeout(() => {
      this.config.popunder.scripts.forEach(url => {
        if (!this.loadedScripts.has(url)) {
          const s = document.createElement('script');
          s.src = url;
          s.async = true;
          document.body.appendChild(s);
          this.loadedScripts.add(url);
        }
      });
      this.sessionData.popunderCount++;
      this.saveSessionData();
    }, this.config.popunder.delay || 8000);
  }

  // === 7. الدوال المساعدة لتحميل الكل ===
  async loadAllAds() {
    // تحميل البانرات
    if (this.config.banners?.aboveIframe?.enabled) this.loadBannerAd('ad-above-iframe', this.config.banners.aboveIframe);
    if (this.config.banners?.belowIframe?.enabled) this.loadBannerAd('ad-below-iframe', this.config.banners.belowIframe);
    if (this.config.banners?.pageBottom?.enabled) this.loadBannerAd('ad-page-bottom', this.config.banners.pageBottom);
    
    // الميزات الأخرى
    this.loadPopunder();
    this.loadSocialBar();
    this.loadNativeBanner();
    this.loadSidebarAds();
  }

  loadSocialBar() {
    if (!this.config.socialBar?.enabled) return;
    setTimeout(() => {
      const s = document.createElement('script');
      s.src = this.config.socialBar.script;
      s.async = true;
      document.body.appendChild(s);
    }, this.config.socialBar.delay || 5000);
  }

  loadNativeBanner() {
    if (!this.config.nativeBanner?.enabled) return;
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    const div = document.createElement('div');
    div.className = 'ad-banner native-ad-banner';
    div.innerHTML = this.config.nativeBanner.html;
    sidebar.prepend(div);
    const s = document.createElement('script');
    s.src = this.config.nativeBanner.script;
    s.async = true;
    div.appendChild(s);
  }

  loadSidebarAds() {
    if (this.config.sidebarAd?.enabled) this.loadBannerAd('ad-sidebar', this.config.sidebarAd);
    if (this.config.sidebarAdExtra?.enabled) this.loadBannerAd('ad-sidebar-extra', this.config.sidebarAdExtra);
  }

  // === 8. نظام حجب الصفحة (Anti-AdBlock UI) ===
  blockPageAccess() {
    document.body.classList.add('adblock-blocked');
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%; 
      background:rgba(0,0,0,0.95); z-index:999999; color:white;
      display:flex; align-items:center; justify-content:center; flex-direction:column;
      font-family:sans-serif; text-align:center; padding:20px;
    `;
    overlay.innerHTML = `
      <h1 style="color:#ff4444;">Ad Blocker Detected</h1>
      <p>Our website is free because of ads. Please disable AdBlock to continue.</p>
      <button onclick="location.reload()" style="
        padding:15px 30px; background:#2ecc71; color:white; border:none; 
        border-radius:5px; cursor:pointer; font-weight:bold; margin-top:20px;
      ">I've Disabled It - Refresh</button>
    `;
    document.body.appendChild(overlay);
  }

  ensureContainerExists(id) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    }
    return el;
  }

  fixAdContainers() {
    // وظيفة فارغة لضمان عدم حدوث خطأ عند استدعائها
  }
}

// البدء التلقائي
const adsManager = new AdsManager();
window.addEventListener('DOMContentLoaded', () => adsManager.init());
