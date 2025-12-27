/**
 * 🎯 نظام إدارة الإعلانات الذكي
 * يعمل مع ads.json بشكل كامل
 * جميع الإعلانات من الشركة الإعلانية مدمجة
 */

class AdsManager {
  constructor() {
    this.config = null;
    this.rotationTimers = {};
    this.sessionData = this.getSessionData();
    this.isAdBlockDetected = false;
  }

  // === 1. تحميل الإعدادات ===
  async init() {
    try {
      const response = await fetch('ads.json');
      if (!response.ok) throw new Error('Failed to load ads.json');
      
      this.config = await response.json();
      console.log('✅ تم تحميل إعدادات الإعلانات');
      
      // بدء تحميل الإعلانات فوراً (بدون تأخير أو تأخير قصير جداً)
      const initialDelay = this.config.config?.smartDelay?.delayBeforeFirstAd || 0;
      
      if (initialDelay > 0) {
        await this.delay(initialDelay);
      }
      
      // تشغيل جميع الإعلانات بشكل متوازي (أسرع)
      Promise.all([
        this.detectAdBlock(),
        this.loadPopunder(),
        this.loadBanners(),
        this.loadNativeBanner(),
        this.loadSidebarAds(),
        this.loadSmartlink(),
        this.loadSocialBar(),
        this.loadInterstitial()
      ]);
      
      console.log('🎯 تم تفعيل جميع الإعلانات بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تحميل الإعلانات:', error);
    }
  }

  // === 2. كشف AdBlock ===
  detectAdBlock() {
    if (!this.config.config?.antiAdblock?.enabled) return;
    
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox';
    document.body.appendChild(testAd);
    
    setTimeout(() => {
      if (testAd.offsetHeight === 0) {
        this.isAdBlockDetected = true;
        if (this.config.config.antiAdblock.message) {
          this.showAdBlockMessage();
        }
      }
      document.body.removeChild(testAd);
    }, 100);
  }

  showAdBlockMessage() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:999999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
      <div style="background:white;padding:40px;border-radius:15px;text-align:center;max-width:500px;">
        <h2 style="color:#e74c3c;margin-bottom:20px;">⚠️ AdBlock Detected</h2>
        <p style="color:#333;margin-bottom:20px;">${this.config.config.antiAdblock.message}</p>
        <button onclick="location.reload()" style="background:#3498db;color:white;border:none;padding:12px 30px;border-radius:5px;cursor:pointer;font-size:16px;">Refresh Page</button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // === 3. تحميل Popunder ===
  loadPopunder() {
    if (!this.config.popunder?.enabled) return;
    
    const frequency = this.config.popunder.frequency;
    if (frequency === 'once_per_session' && this.sessionData.popunderShown) {
      return;
    }
    
    const delay = this.config.popunder.delay || 1000;
    
    setTimeout(() => {
      this.config.popunder.scripts.forEach(scriptUrl => {
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        document.body.appendChild(script);
      });
      
      this.sessionData.popunderShown = true;
      this.saveSessionData();
      console.log('✅ Popunder loaded');
    }, delay);
  }

  // === 4. تحميل البانرات مع التدوير ===
  loadBanners() {
    // فوق iframe
    if (this.config.banners?.aboveIframe?.enabled) {
      this.loadBannerAd('ad-above-iframe', this.config.banners.aboveIframe);
    }
    
    // تحت iframe
    if (this.config.banners?.belowIframe?.enabled) {
      this.loadBannerAd('ad-below-iframe', this.config.banners.belowIframe);
    }
    
    // أسفل الصفحة
    if (this.config.banners?.pageBottom?.enabled) {
      this.loadBannerAd('ad-page-bottom', this.config.banners.pageBottom);
    }
  }

  loadBannerAd(containerId, bannerConfig) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const ads = bannerConfig.ads;
    let currentIndex = 0;
    
    const loadAd = (index) => {
      const ad = ads[index];
      const adContainer = document.createElement('div');
      adContainer.className = 'ad-banner';
      adContainer.innerHTML = `
        <div class="ad-label">Advertisement</div>
        <div id="banner-${ad.id}" style="text-align:center;min-height:${ad.config.height}px;"></div>
      `;
      
      container.innerHTML = '';
      container.appendChild(adContainer);
      
      // تحميل سكريبت الإعلان فوراً (بدون setTimeout)
      window.atOptions = ad.config;
      const script = document.createElement('script');
      script.src = ad.script;
      script.async = true;
      document.getElementById(`banner-${ad.id}`).appendChild(script);
    };
    
    // تحميل أول إعلان فوراً
    loadAd(currentIndex);
    
    // التدوير إذا كان مفعل
    if (bannerConfig.rotation && ads.length > 1) {
      const interval = bannerConfig.rotationInterval || 30000;
      this.rotationTimers[containerId] = setInterval(() => {
        currentIndex = (currentIndex + 1) % ads.length;
        loadAd(currentIndex);
        console.log(`🔄 تدوير إعلان ${containerId} -> ${ads[currentIndex].id}`);
      }, interval);
    }
  }

  // === 5. تحميل Native Banner ===
  loadNativeBanner() {
    if (!this.config.nativeBanner?.enabled) return;
    
    const sidebar = document.querySelector('.sidebar') || document.getElementById('ad-sidebar');
    if (!sidebar) return;
    
    const container = document.createElement('div');
    container.className = 'ad-banner';
    container.style.cssText = 'margin:20px 0;background:rgba(0,0,0,0.7);border-radius:8px;padding:15px;';
    container.innerHTML = `
      <div class="ad-label">Sponsored</div>
      ${this.config.nativeBanner.html}
    `;
    
    sidebar.insertBefore(container, sidebar.firstChild);
    
    // تحميل السكريبت فوراً
    const script = document.createElement('script');
    script.src = this.config.nativeBanner.script;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    container.appendChild(script);
    console.log('✅ Native Banner loaded');
  }

  // === 6. تحميل إعلانات Sidebar ===
  loadSidebarAds() {
    if (!this.config.sidebarAd?.enabled) return;
    
    const container = document.getElementById('ad-sidebar');
    if (!container) return;
    
    const ads = this.config.sidebarAd.ads;
    let currentIndex = 0;
    
    const loadAd = (index) => {
      const ad = ads[index];
      const adDiv = document.createElement('div');
      adDiv.className = 'ad-banner ad-sidebar';
      adDiv.style.cssText = 'background:rgba(0,0,0,0.7);border-radius:8px;padding:15px;margin:20px 0;position:sticky;top:100px;';
      adDiv.innerHTML = `
        <div class="ad-label">Advertisement</div>
        <div id="sidebar-${ad.id}" style="text-align:center;min-height:${ad.config.height}px;"></div>
      `;
      
      container.innerHTML = '';
      container.appendChild(adDiv);
      
      // تحميل فوراً
      window.atOptions = ad.config;
      const script = document.createElement('script');
      script.src = ad.script;
      script.async = true;
      document.getElementById(`sidebar-${ad.id}`).appendChild(script);
    };
    
    loadAd(currentIndex);
    
    // التدوير
    if (this.config.sidebarAd.rotation && ads.length > 1) {
      const interval = this.config.sidebarAd.rotationInterval || 35000;
      this.rotationTimers['sidebar'] = setInterval(() => {
        currentIndex = (currentIndex + 1) % ads.length;
        loadAd(currentIndex);
        console.log(`🔄 تدوير Sidebar -> ${ads[currentIndex].id}`);
      }, interval);
    }
  }

  // === 7. تحميل Smartlink ===
  loadSmartlink() {
    if (!this.config.smartlink?.enabled) return;
    
    const frequency = this.config.smartlink.frequency;
    if (frequency === 'once_per_session' && this.sessionData.smartlinkOpened) {
      return;
    }
    
    // انتظار تحميل اللعبة
    const iframe = document.getElementById('game-iframe');
    if (iframe) {
      iframe.addEventListener('load', () => {
        setTimeout(() => {
          if (this.config.smartlink.openInNewTab) {
            window.open(this.config.smartlink.url, '_blank', 'noopener,noreferrer');
          } else {
            window.location.href = this.config.smartlink.url;
          }
          
          this.sessionData.smartlinkOpened = true;
          this.saveSessionData();
          console.log('✅ Smartlink opened');
        }, 2000);
      }, { once: true });
    }
  }

  // === 8. تحميل Social Bar ===
  loadSocialBar() {
    if (!this.config.socialBar?.enabled) return;
    
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;z-index:999;';
    if (this.config.socialBar.sticky) {
      bar.style.position = 'sticky';
    }
    
    bar.innerHTML = this.config.socialBar.html;
    document.body.appendChild(bar);
    console.log('✅ Social Bar loaded');
  }

  // === 9. تحميل Interstitial ===
  loadInterstitial() {
    if (!this.config.interstitialAd?.enabled) return;
    
    const frequency = this.config.interstitialAd.frequency;
    const pageViews = this.sessionData.pageViews || 0;
    
    if (frequency === 'every_3_pages' && pageViews % 3 !== 0) {
      return;
    }
    
    setTimeout(() => {
      const overlay = document.createElement('div');
      overlay.id = 'interstitial-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:999999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s;';
      
      overlay.innerHTML = `
        <div style="background:white;padding:30px;border-radius:15px;max-width:700px;max-height:90vh;overflow-y:auto;">
          ${this.config.interstitialAd.html}
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // العد التنازلي
      let countdown = this.config.interstitialAd.closeDelay / 1000;
      const countdownEl = document.getElementById('countdown');
      
      const timer = setInterval(() => {
        countdown--;
        if (countdownEl) countdownEl.textContent = countdown;
        
        if (countdown <= 0) {
          clearInterval(timer);
          if (this.config.interstitialAd.closeable) {
            overlay.remove();
          }
        }
      }, 1000);
      
      // زر الإغلاق
      overlay.addEventListener('click', (e) => {
        if (e.target.closest('button') || countdown <= 0) {
          overlay.remove();
        }
      });
      
      console.log('✅ Interstitial shown');
    }, this.config.interstitialAd.delay || 10000);
  }

  // === 10. إدارة الجلسة ===
  getSessionData() {
    const data = sessionStorage.getItem('adsSessionData');
    const defaultData = {
      popunderShown: false,
      smartlinkOpened: false,
      pageViews: 0
    };
    
    if (!data) {
      return defaultData;
    }
    
    try {
      return { ...defaultData, ...JSON.parse(data) };
    } catch {
      return defaultData;
    }
  }

  saveSessionData() {
    this.sessionData.pageViews = (this.sessionData.pageViews || 0) + 1;
    sessionStorage.setItem('adsSessionData', JSON.stringify(this.sessionData));
  }

  // === 11. دالة مساعدة للتأخير ===
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // === 12. تنظيف الموارد ===
  destroy() {
    Object.values(this.rotationTimers).forEach(timer => clearInterval(timer));
    this.rotationTimers = {};
  }
}

// === تشغيل تلقائي ===
document.addEventListener('DOMContentLoaded', () => {
  const adsManager = new AdsManager();
  adsManager.init();
  
  // حفظ المدير عالمياً للتحكم
  window.adsManager = adsManager;
});

console.log('🚀 نظام إدارة الإعلانات جاهز للعمل');
