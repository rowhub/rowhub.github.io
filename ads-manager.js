/**
 * 🎯 نظام إدارة الإعلانات الذكية - النسخة المُصلحة نهائياً
 * ✅ إصلاح Popunder ليعمل مرة واحدة فقط أو بتوقيت محدد
 * ✅ منع ظهور Popunder عند rotation البانرات
 */

class AdsManager {
  constructor() {
    this.config = null;
    this.rotationTimers = {};
    this.sessionData = this.getSessionData();
    this.isAdBlockDetected = false;
    this.adElements = new Map();
    this.loadedScripts = new Set();
    this.popunderCount = 0;
    
    // ⭐ إضافة متغيرات التحكم في Popunder
    this.popunderSettings = {
      interval: 15, // الفترة بالدقائق (0 = مرة واحدة فقط)
      lastShown: this.getPopunderLastShown(),
      hasShownInSession: false // تتبع الجلسة الحالية
    };
  }

  // ============================================
  // 🆕 دوال التحكم في Popunder الجديدة
  // ============================================
  
  /**
   * قراءة آخر مرة تم عرض Popunder فيها
   */
  getPopunderLastShown() {
    try {
      const lastShown = localStorage.getItem('popunderLastShown');
      return lastShown ? parseInt(lastShown) : null;
    } catch (error) {
      console.error('خطأ في قراءة popunderLastShown:', error);
      return null;
    }
  }
  
  /**
   * حفظ وقت عرض Popunder
   */
  savePopunderLastShown() {
    try {
      localStorage.setItem('popunderLastShown', Date.now().toString());
      this.popunderSettings.lastShown = Date.now();
      console.log('💾 تم حفظ وقت عرض Popunder');
    } catch (error) {
      console.error('خطأ في حفظ popunderLastShown:', error);
    }
  }
  
  /**
   * تعيين الفترة الزمنية بين عرض Popunder
   * @param {number} minutes - الدقائق (0 = مرة واحدة فقط)
   */
  setPopunderInterval(minutes) {
    this.popunderSettings.interval = minutes;
    try {
      localStorage.setItem('popunderInterval', minutes.toString());
      console.log(`⏰ تم تعيين فترة Popunder: ${minutes} دقيقة`);
    } catch (error) {
      console.error('خطأ في حفظ popunderInterval:', error);
    }
  }
  
  /**
   * التحقق من إمكانية عرض Popunder
   * @returns {boolean}
   */
  canShowPopunder() {
    // إذا تم عرضه في هذه الجلسة، لا نعرضه مرة أخرى
    if (this.popunderSettings.hasShownInSession) {
      console.log('⏸️ Popunder تم عرضه بالفعل في هذه الجلسة');
      return false;
    }
    
    const { interval, lastShown } = this.popunderSettings;
    
    // إذا لم يتم عرضه من قبل، اعرضه
    if (!lastShown) {
      console.log('✅ Popunder لم يظهر من قبل - سيتم عرضه');
      return true;
    }
    
    // إذا الفترة = 0، يعني مرة واحدة فقط للأبد
    if (interval === 0) {
      console.log('⏸️ Popunder معين لمرة واحدة فقط - تم عرضه سابقاً');
      return false;
    }
    
    // حساب الوقت المنقضي
    const now = Date.now();
    const minutesPassed = (now - lastShown) / (1000 * 60);
    
    if (minutesPassed >= interval) {
      console.log(`✅ مر ${Math.floor(minutesPassed)} دقيقة - يمكن عرض Popunder`);
      return true;
    } else {
      const remaining = Math.ceil(interval - minutesPassed);
      console.log(`⏸️ باقي ${remaining} دقيقة لعرض Popunder التالي`);
      return false;
    }
  }
  
  /**
   * دالة تصحيح - عرض معلومات Popunder
   */
  debugPopunder() {
    const { interval, lastShown, hasShownInSession } = this.popunderSettings;
    
    console.log('════════════════════════════════════════');
    console.log('🔍 معلومات Popunder:');
    console.log('────────────────────────────────────────');
    console.log('الفترة المحددة:', interval === 0 ? 'مرة واحدة فقط' : `${interval} دقيقة`);
    console.log('آخر ظهور:', lastShown ? new Date(lastShown).toLocaleString('ar-DZ') : 'لم يظهر بعد');
    console.log('عُرض في هذه الجلسة:', hasShownInSession ? 'نعم' : 'لا');
    
    if (lastShown && interval > 0) {
      const minutesPassed = (Date.now() - lastShown) / (1000 * 60);
      const remaining = Math.max(0, interval - minutesPassed);
      console.log('الوقت المتبقي:', `${Math.ceil(remaining)} دقيقة`);
    }
    
    console.log('يمكن العرض الآن:', this.canShowPopunder() ? '✅ نعم' : '❌ لا');
    console.log('════════════════════════════════════════');
  }
  
  /**
   * إعادة تعيين Popunder (للاختبار)
   */
  resetPopunder() {
    try {
      localStorage.removeItem('popunderLastShown');
      this.popunderSettings.lastShown = null;
      this.popunderSettings.hasShownInSession = false;
      console.log('🔄 تم إعادة تعيين Popunder');
    } catch (error) {
      console.error('خطأ في إعادة تعيين Popunder:', error);
    }
  }

  // ============================================
  // 🔧 الدوال الأساسية (بدون تغيير)
  // ============================================

  async init() {
    try {
      this.filterUnityErrors();
      this.fixAdContainers();
      
      // ⭐ تعيين فترة Popunder (عدّل هذا الرقم حسب رغبتك)
      // 0 = مرة واحدة فقط
      // 15 = كل 15 دقيقة
      // 30 = كل 30 دقيقة
      // 60 = كل ساعة
      this.setPopunderInterval(15); // 👈 غيّر هذا الرقم
      
      const response = await fetch('ads.json');
      if (!response.ok) throw new Error('Failed to load ads.json');
      
      this.config = await response.json();
      console.log('✅ تم تحميل إعدادات الإعلانات');
      
      const antiAdblockEnabled = this.config.antiAdblock?.enabled ?? true;
      
      if (antiAdblockEnabled) {
        console.log('🔍 Anti-AdBlock مُفعّل - بدء الفحص...');
        const adBlockDetected = await this.detectAdBlockEffectively();
        
        if (adBlockDetected) {
          console.log('🚫 AdBlock detected - Blocking page access');
          this.blockPageAccess();
          return;
        }
      } else {
        console.log('⚠️ Anti-AdBlock معطّل - تخطي الفحص');
      }
      
      await this.loadAllAds();
      console.log('🎯 تم تفعيل جميع الإعلانات بنجاح');
      
      // إضافة دوال التصحيح إلى window للاختبار
      window.debugPopunder = () => this.debugPopunder();
      window.resetPopunder = () => this.resetPopunder();
      
    } catch (error) {
      console.error('❌ خطأ في تحميل الإعلانات:', error);
      this.showFallbackAds();
    }
  }

  async detectAdBlockEffectively() {
    console.log('🔍 بدء كشف AdBlock...');
    
    const test1 = await this.testAdElement();
    console.log('📊 Test 1 - Element Test:', test1 ? 'BLOCKED' : 'PASSED');
    
    const test2 = await this.testAdScript();
    console.log('📊 Test 2 - Script Test:', test2 ? 'BLOCKED' : 'PASSED');
    
    const test3 = await this.testAdFetch();
    console.log('📊 Test 3 - Fetch Test:', test3 ? 'BLOCKED' : 'PASSED');
    
    const failures = [test1, test2, test3].filter(Boolean).length;
    const hasAdBlock = failures >= 2;
    
    console.log('📊 النتيجة النهائية:', hasAdBlock ? '🚫 ADBLOCK DETECTED' : '✅ NO ADBLOCK');
    this.isAdBlockDetected = hasAdBlock;
    
    return hasAdBlock;
  }

  async testAdElement() {
    return new Promise(resolve => {
      const adElement = document.createElement('div');
      adElement.id = 'adblock-test-element-' + Date.now();
      
      const adClasses = [
        'ad', 'ads', 'advertisement', 'advert', 
        'ad-banner', 'ad-container', 'ad-wrapper',
        'pub', 'publicite', 'sponsor', 'sponsored'
      ];
      
      adClasses.forEach(className => {
        adElement.classList.add(className);
      });
      
      adElement.innerHTML = `
        <div style="width: 728px; height: 90px; background: #1a2a6c; color: white; 
                    display: flex; align-items: center; justify-content: center;">
          Advertisement
        </div>
      `;
      
      adElement.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 728px;
        height: 90px;
        z-index: -999999;
        visibility: hidden;
      `;
      
      document.body.appendChild(adElement);
      
      setTimeout(() => {
        const computedStyle = window.getComputedStyle(adElement);
        const isBlocked = 
          adElement.offsetHeight === 0 ||
          adElement.offsetWidth === 0 ||
          computedStyle.display === 'none' ||
          computedStyle.visibility === 'hidden' ||
          computedStyle.opacity === '0' ||
          adElement.style.display === 'none' ||
          !document.body.contains(adElement);
        
        if (adElement.parentNode) {
          adElement.parentNode.removeChild(adElement);
        }
        
        resolve(isBlocked);
      }, 500);
    });
  }

  async testAdScript() {
    return new Promise(resolve => {
      const testScript = document.createElement('script');
      testScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      testScript.id = 'adblock-test-script-' + Date.now();
      testScript.async = true;
      
      let scriptLoaded = false;
      let scriptBlocked = false;
      
      testScript.onload = () => {
        scriptLoaded = true;
        resolve(false);
      };
      
      testScript.onerror = () => {
        scriptBlocked = true;
        resolve(true);
      };
      
      document.head.appendChild(testScript);
      
      setTimeout(() => {
        if (!scriptLoaded && !scriptBlocked) {
          if (testScript.parentNode) {
            testScript.parentNode.removeChild(testScript);
          }
          resolve(true);
        }
      }, 2000);
    });
  }

  async testAdFetch() {
    try {
      const response = await fetch('https://google-analytics.com/analytics.js', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      
      return false;
    } catch (error) {
      return true;
    }
  }

  blockPageAccess() {
    console.log('⛔ حجب الوصول إلى الصفحة...');
    
    const blockOverlay = document.createElement('div');
    blockOverlay.id = 'adblock-block-overlay';
    blockOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      z-index: 2147483647;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      padding: 20px;
      text-align: center;
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow: hidden;
    `;
    
    blockOverlay.addEventListener('contextmenu', e => e.preventDefault());
    blockOverlay.addEventListener('keydown', e => {
      if (e.key === 'F12' || e.key === 'F5' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    
    blockOverlay.innerHTML = `
      <div style="
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        padding: 40px;
        max-width: 800px;
        width: 90%;
        border: 2px solid rgba(255, 68, 68, 0.5);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      ">
        <div style="font-size: 80px; color: #ff4444; margin-bottom: 20px;">
          🚫
        </div>
        
        <h1 style="font-size: 2.5rem; color: #ffd700; margin-bottom: 20px;">
          Ad Blocker Detected
        </h1>
        
        <div style="
          background: rgba(0, 0, 0, 0.4);
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 25px;
          line-height: 1.7;
          text-align: left;
        ">
          <p style="font-size: 18px; margin-bottom: 15px;">
            <strong>We have detected that you are using an ad blocker.</strong>
          </p>
          
          <p style="margin-bottom: 15px; font-size: 16px;">
            Our website is <strong>100% free</strong> and relies exclusively on advertisements to operate. 
            By blocking ads, you are preventing us from providing free content.
          </p>
          
          <div style="
            background: rgba(255, 68, 68, 0.2);
            border-left: 4px solid #ff4444;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          ">
            <p style="margin: 0; font-weight: bold; color: #ffd700;">
              ⚠️ <strong>Access Denied:</strong> You cannot access the game with ad blocker enabled.
            </p>
          </div>
          
          <h3 style="color: #3498db; margin: 20px 0 15px 0;">
            📋 To Continue:
          </h3>
          <ol style="margin-left: 20px; font-size: 16px;">
            <li style="margin-bottom: 8px;">Disable your ad blocker for this website</li>
            <li style="margin-bottom: 8px;">Refresh this page</li>
            <li style="margin-bottom: 8px;">Add our site to your whitelist</li>
          </ol>
        </div>
        
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 30px;">
          <button onclick="window.location.reload()" style="
            background: linear-gradient(135deg, #2ecc71, #27ae60);
            color: white;
            border: none;
            padding: 16px 35px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            transition: all 0.3s;
            min-width: 250px;
          ">
            🔄 I've Disabled Ad Blocker - Refresh
          </button>
          
          <button onclick="window.showAdBlockHelp()" style="
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 16px 35px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            transition: all 0.3s;
            min-width: 250px;
          ">
            📖 How to Disable Ad Block
          </button>
        </div>
        
        <p style="margin-top: 25px; color: rgba(255, 255, 255, 0.7); font-size: 14px;">
          This message will appear until ad blocker is disabled.
        </p>
      </div>
    `;
    
    document.body.appendChild(blockOverlay);
    
    this.disableOriginalPage();
    
    window.showAdBlockHelp = () => this.showAdBlockHelp();
  }

  disableOriginalPage() {
    document.body.classList.add('adblock-blocked');
    
    const elements = document.querySelectorAll('a, button, input, select, textarea, iframe, [onclick]');
    elements.forEach(el => {
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.3';
      el.style.filter = 'blur(2px)';
    });
    
    const gameIframe = document.getElementById('game-iframe');
    if (gameIframe) {
      gameIframe.style.pointerEvents = 'none';
      gameIframe.style.opacity = '0.2';
      gameIframe.style.filter = 'blur(5px) grayscale(1)';
    }
    
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  showAdBlockHelp() {
    const helpOverlay = document.createElement('div');
    helpOverlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #1a2a6c, #302b63);
      padding: 40px;
      border-radius: 20px;
      max-width: 900px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 2147483648;
      color: white;
      box-shadow: 0 30px 80px rgba(0,0,0,0.6);
      border: 2px solid #3498db;
    `;
    
    helpOverlay.innerHTML = `
      <div style="position: relative;">
        <button onclick="this.parentElement.parentElement.remove()" style="
          position: absolute;
          top: 15px;
          right: 15px;
          background: #ff4444;
          color: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
        ">✕</button>
        
        <h2 style="text-align: center; margin-bottom: 30px; color: #ffd700;">
          How to Disable Ad Blocker
        </h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
            <h3 style="color: #2ecc71;">AdBlock Plus</h3>
            <ol>
              <li>Click the AdBlock Plus icon</li>
              <li>Click "Don't run on pages on this domain"</li>
              <li>Refresh the page</li>
            </ol>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
            <h3 style="color: #3498db;">uBlock Origin</h3>
            <ol>
              <li>Click the uBlock Origin icon</li>
              <li>Click the big power button</li>
              <li>Refresh the page</li>
            </ol>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
            <h3 style="color: #9b59b6;">AdGuard</h3>
            <ol>
              <li>Click the AdGuard icon</li>
              <li>Disable protection for this site</li>
              <li>Refresh the page</li>
            </ol>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <button onclick="location.reload()" style="
            background: #2ecc71;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
          ">
            Refresh After Disabling
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(helpOverlay);
  }

  async loadAllAds() {
    console.log('📦 بدء تحميل جميع الإعلانات...');
    
    this.loadNativeBanner();
    
    setTimeout(() => {
      this.loadSidebarAds();
    }, 500);
    
    await this.delay(1000);
    this.loadBanners();
    
    await this.delay(1500);
    this.loadSocialBar();
    
    await this.delay(2000);
    this.loadMiddleAd();
    
    await this.delay(2500);
    this.loadExtraSidebarAd();
    
    // ⭐ الجزء المهم: تحميل Popunder بالطريقة الصحيحة
    await this.delay(3000);
    this.loadPopunder();
    this.loadSmartlink();
  }

  async loadBanners() {
    console.log('🖼️ تحميل البانرات...');
    
    if (this.config.banners?.aboveIframe?.enabled) {
      this.loadBannerAd('ad-above-iframe', this.config.banners.aboveIframe);
    }
    
    if (this.config.banners?.belowIframe?.enabled) {
      setTimeout(() => {
        this.loadBannerAd('ad-below-iframe', this.config.banners.belowIframe);
      }, 1000);
    }
    
    if (this.config.banners?.pageBottom?.enabled) {
      setTimeout(() => {
        this.ensureContainerExists('ad-page-bottom');
        this.loadBannerAd('ad-page-bottom', this.config.banners.pageBottom);
      }, 1500);
    }
  }

  loadNativeBanner() {
    if (!this.config.nativeBanner?.enabled) return;
    
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    if (sidebar.querySelector('.native-ad-banner')) return;
    
    const container = document.createElement('div');
    container.className = 'ad-banner native-ad-banner';
    container.innerHTML = this.config.nativeBanner.html || '<div id="native-banner-container"></div>';
    
    sidebar.insertBefore(container, sidebar.firstChild);
    
    if (this.config.nativeBanner.script) {
      setTimeout(() => {
        const script = document.createElement('script');
        script.src = this.config.nativeBanner.script;
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        container.appendChild(script);
        console.log('✅ Native Banner loaded');
      }, 1000);
    }
  }

  loadSidebarAds() {
    if (!this.config.sidebarAd?.enabled) return;
    
    const container = document.getElementById('ad-sidebar');
    if (!container) {
      console.log('⚠️ حاوية Sidebar غير موجودة، إنشاء جديدة...');
      this.ensureContainerExists('ad-sidebar');
      return;
    }
    
    const ads = this.config.sidebarAd.ads;
    if (!ads || ads.length === 0) return;
    
    this.loadSidebarAd(container, ads[0]);
    
    if (this.config.sidebarAd.rotation && ads.length > 1) {
      let currentIndex = 0;
      const interval = this.config.sidebarAd.rotationInterval || 45000;
      
      this.rotationTimers['sidebar'] = setInterval(() => {
        currentIndex = (currentIndex + 1) % ads.length;
        this.loadSidebarAd(container, ads[currentIndex]);
        console.log(`🔄 تدوير إعلان Sidebar: ${ads[currentIndex].id}`);
      }, interval);
    }
  }

  loadSidebarAd(container, ad) {
    const uniqueId = `${ad.id}-${Date.now()}`;
    
    window.atOptions = window.atOptions || {};
    Object.assign(window.atOptions, {
        ...ad.config,
        params: ad.config?.params || {}
    });
    
    const adDiv = document.createElement('div');
    adDiv.className = 'ad-banner ad-sidebar';
    adDiv.innerHTML = `
      <div class="ad-label">Advertisement</div>
      <div id="sidebar-${uniqueId}" style="text-align:center;min-height:${ad.config?.height || 300}px;background:transparent;"></div>
    `;
    
    container.innerHTML = '';
    container.appendChild(adDiv);
    
    setTimeout(() => {
        const script = document.createElement('script');
        script.src = ad.script;
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.id = `sidebar-script-${uniqueId}`;
        
        script.onload = () => {
            console.log(`✅ Sidebar Ad loaded: ${ad.id}`);
        };
        
        script.onerror = () => {
            console.warn(`⚠️ فشل تحميل Sidebar Ad: ${ad.id}`);
            this.showFallbackInContainer(container);
        };
        
        const targetElement = document.getElementById(`sidebar-${uniqueId}`);
        if (targetElement) {
            targetElement.appendChild(script);
        }
    }, 300);
  }

  loadSocialBar() {
    if (!this.config.socialBar?.enabled) return;
    
    const socialBarScript = this.config.socialBar.script;
    if (!socialBarScript) return;
    
    if (this.loadedScripts.has(socialBarScript)) {
      console.log('⚠️ Social Bar already loaded');
      return;
    }
    
    setTimeout(() => {
      const script = document.createElement('script');
      script.src = socialBarScript;
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.id = 'social-bar-script';
      
      document.body.appendChild(script);
      this.loadedScripts.add(socialBarScript);
      
      console.log('✅ Social Bar loaded');
    }, this.config.socialBar.delay || 5000);
  }

  // ============================================
  // ⭐⭐⭐ الإصلاح الرئيسي: Popunder ⭐⭐⭐
  // ============================================
  
  /**
   * تحميل Popunder - النسخة المُصلحة
   * هذه الدالة تُستدعى مرة واحدة فقط عند تحميل الصفحة
   * ولن تُستدعى مرة أخرى عند rotation البانرات
   */
  loadPopunder() {
    if (!this.config.popunder?.enabled) {
      console.log('⚠️ Popunder معطّل في الإعدادات');
      return;
    }
    
    // ⭐ الفحص الأول: هل يمكن عرض Popunder؟
    if (!this.canShowPopunder()) {
      console.log('⏸️ تم تخطي Popunder - لم يحن الوقت بعد');
      return;
    }
    
    // ⭐ الفحص الثاني: التحقق من عدد المرات في الجلسة
    const maxPerSession = this.config.popunder.maxPerSession || 1;
    const sessionCount = this.sessionData.popunderCount || 0;
    
    if (sessionCount >= maxPerSession) {
      console.log(`⏸️ تم الوصول لحد Popunder في الجلسة: ${sessionCount}/${maxPerSession}`);
      return;
    }
    
    console.log('🎯 بدء تحميل Popunder...');
    
    setTimeout(() => {
      this.config.popunder.scripts.forEach((scriptUrl, index) => {
        // التحقق من عدم تحميل السكريبت مسبقاً
        if (this.loadedScripts.has(scriptUrl)) {
          console.log(`⚠️ Popunder script already loaded: ${scriptUrl}`);
          return;
        }
        
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.id = `popunder-script-${index}`;
        
        document.body.appendChild(script);
        this.loadedScripts.add(scriptUrl);
        
        console.log(`✅ Popunder script loaded: ${scriptUrl}`);
      });
      
      // ⭐ تحديث البيانات بعد عرض Popunder
      this.popunderSettings.hasShownInSession = true;
      this.savePopunderLastShown();
      
      this.sessionData.popunderCount = (this.sessionData.popunderCount || 0) + 1;
      this.sessionData.popunderShown = true;
      this.saveSessionData();
      
      console.log(`✅ تم عرض Popunder - العدد: ${this.sessionData.popunderCount}/${maxPerSession}`);
      console.log(`📅 الوقت التالي: ${this.popunderSettings.interval === 0 ? 'لن يظهر مرة أخرى' : `بعد ${this.popunderSettings.interval} دقيقة`}`);
      
    }, this.config.popunder.delay || 8000);
  }

  loadSmartlink() {
    if (!this.config.smartlink?.enabled) return;
    
    const frequency = this.config.smartlink.frequency;
    if (frequency === 'once_per_session' && this.sessionData.smartlinkOpened) {
      console.log('⚠️ Smartlink already opened in this session');
      return;
    }
    
    const openSmartlink = () => {
      setTimeout(() => {
        if (this.config.smartlink.openInNewTab) {
          const newTab = window.open(this.config.smartlink.url, '_blank', 'noopener,noreferrer');
          if (newTab) {
            this.sessionData.smartlinkOpened = true;
            this.saveSessionData();
            console.log('✅ Smartlink opened in new tab');
          }
        } else {
          window.location.href = this.config.smartlink.url;
        }
      }, this.config.smartlink.delay || 3000);
    };
    
    const checkGameLoaded = (attempt = 1) => {
      const iframe = document.getElementById('game-iframe');
      
      if (iframe && iframe.contentWindow) {
        openSmartlink();
      } else if (attempt < 10) {
        setTimeout(() => checkGameLoaded(attempt + 1), 1000);
      } else {
        openSmartlink();
      }
    };
    
    setTimeout(() => checkGameLoaded(), 2000);
  }

  fixAdContainers() {
    console.log('🔧 فحص وإصلاح حاويات الإعلانات...');
    
    const containers = [
      'ad-above-iframe',
      'ad-below-iframe', 
      'ad-page-bottom',
      'ad-sidebar',
      'ad-page-middle'
    ];
    
    containers.forEach(containerId => {
      let container = document.getElementById(containerId);
      
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.cssText = `
          min-height: 50px;
          margin: 20px 0;
          position: relative;
          background: transparent;
        `;
        
        switch(containerId) {
          case 'ad-above-iframe':
          case 'ad-below-iframe':
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
              if (containerId === 'ad-above-iframe') {
                const iframe = gameContainer.querySelector('.game-frame');
                if (iframe) {
                  gameContainer.insertBefore(container, iframe);
                } else {
                  gameContainer.prepend(container);
                }
              } else {
                gameContainer.appendChild(container);
              }
            }
            break;
            
          case 'ad-page-bottom':
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
              const seoContent = mainContent.querySelector('.seo-content');
              if (seoContent) {
                seoContent.parentNode.insertBefore(container, seoContent.nextSibling);
              } else {
                mainContent.appendChild(container);
              }
            }
            break;
            
          case 'ad-sidebar':
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
              sidebar.appendChild(container);
            }
            break;
            
          case 'ad-page-middle':
            const gameInfo = document.querySelector('.game-info');
            if (gameInfo) {
              gameInfo.parentNode.insertBefore(container, gameInfo.nextSibling);
            }
            break;
        }
        
        console.log(`✅ تم إنشاء حاوية: ${containerId}`);
      }
    });
  }

  ensureContainerExists(containerId) {
    let container = document.getElementById(containerId);
    
    if (!container) {
      console.log(`⚠️ حاوية ${containerId} غير موجودة، إنشاء جديدة...`);
      container = document.createElement('div');
      container.id = containerId;
      container.style.cssText = `
        min-height: 50px;
        margin: 20px 0;
        position: relative;
        background: transparent;
      `;
      
      if (containerId.includes('above')) {
        const gameFrame = document.querySelector('.game-frame');
        if (gameFrame && gameFrame.parentNode) {
          gameFrame.parentNode.insertBefore(container, gameFrame);
        }
      } else if (containerId.includes('below')) {
        const gameFrame = document.querySelector('.game-frame');
        if (gameFrame && gameFrame.parentNode) {
          gameFrame.parentNode.insertBefore(container, gameFrame.nextSibling);
        }
      } else if (containerId.includes('sidebar')) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.appendChild(container);
        }
      } else {
        document.body.appendChild(container);
      }
    }
    
    return container;
  }

  showFallbackAds() {
    console.log('🔄 عرض إعلانات احتياطية...');
    
    const fallbackAds = [
      {
        id: 'fallback-1',
        html: `
          <div class="ad-banner" style="text-align:center;padding:20px;">
            <div class="ad-label">Advertisement</div>
            <p style="color:#fff;margin:10px 0;">Support our site by disabling ad blocker</p>
            <a href="#" onclick="window.location.reload()" style="color:#3498db;text-decoration:none;">Refresh after disabling</a>
          </div>
        `
      }
    ];
    
    ['ad-above-iframe', 'ad-below-iframe', 'ad-sidebar'].forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container && fallbackAds[0]) {
        container.innerHTML = fallbackAds[0].html;
      }
    });
  }

  showFallbackInContainer(container) {
    if (!container) return;
    
    container.innerHTML = `
        <div class="ad-banner" style="text-align:center;padding:20px;">
            <div class="ad-label">Advertisement</div>
            <p style="color:#fff;margin:10px 0;">Support our site by allowing ads</p>
            <p style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:10px;">
                Ad failed to load. Please check your ad blocker settings.
            </p>
        </div>
    `;
    
    setTimeout(() => {
        if (container.innerHTML.includes('Ad failed to load')) {
            container.innerHTML = `
                <div class="ad-banner" style="text-align:center;padding:15px;">
                    <div class="ad-label">Sponsored</div>
                    <div style="color:#fff;padding:10px;">
                        <p style="margin:5px 0;">Play more games at FreePlayHub</p>
                        <a href="https://rowhub.github.io" style="color:#3498db;text-decoration:none;">Browse All Games</a>
                    </div>
                </div>
            `;
        }
    }, 15000);
  }

  getSessionData() {
    try {
      const data = sessionStorage.getItem('adsSessionData');
      return data ? JSON.parse(data) : {
        popunderShown: false,
        popunderCount: 0,
        smartlinkOpened: false,
        adsLoaded: 0,
        sessionId: Date.now()
      };
    } catch (error) {
      console.error('خطأ في قراءة بيانات الجلسة:', error);
      return {
        popunderShown: false,
        popunderCount: 0,
        smartlinkOpened: false,
        adsLoaded: 0,
        sessionId: Date.now()
      };
    }
  }

  saveSessionData() {
    try {
      sessionStorage.setItem('adsSessionData', JSON.stringify(this.sessionData));
      console.log('💾 تم حفظ بيانات الجلسة:', this.sessionData);
    } catch (error) {
      console.error('خطأ في حفظ بيانات الجلسة:', error);
    }
  }

  filterUnityErrors() {
    const originalError = console.error;
    console.error = function(...args) {
      if (args[0] && typeof args[0] === 'string') {
        const errorMsg = args[0];
        if (errorMsg.includes('The referenced script') || errorMsg.includes('is missing!')) {
          return;
        }
      }
      originalError.apply(console, args);
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy() {
    Object.values(this.rotationTimers).forEach(timer => clearInterval(timer));
    this.rotationTimers = {};
    this.loadedScripts.clear();
    console.log('🧹 تم تنظيف موارد الإعلانات');
  }
}

// === تشغيل تلقائي ===
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 بدء تشغيل نظام الإعلانات...');
  
  const adsManager = new AdsManager();
  adsManager.init();
  window.adsManager = adsManager;
  
  const style = document.createElement('style');
  style.textContent = `
    .ad-banner {
      background: rgba(0,0,0,0.7);
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      position: relative;
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255,255,255,0.1);
      transition: all 0.3s ease;
      min-height: 50px;
    }
    
    .ad-banner:hover {
      border-color: rgba(255,255,255,0.3);
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }
    
    .ad-label {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.6);
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: bold;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      z-index: 10;
    }
    
    .ad-sidebar {
      position: sticky;
      top: 100px;
      margin-bottom: 20px;
    }
    
    .native-ad-banner {
      background: linear-gradient(135deg, rgba(26,42,108,0.8), rgba(178,31,31,0.8));
    }
    
    #ad-above-iframe {
      margin-bottom: 15px;
    }
    
    #ad-below-iframe {
      margin-top: 15px;
      margin-bottom: 25px;
    }
    
    #ad-page-bottom {
      margin-top: 30px;
      margin-bottom: 20px;
      text-align: center;
    }
    
    #ad-page-middle {
      margin: 25px 0;
      text-align: center;
    }
    
    #ad-sidebar-extra {
      margin-top: 20px;
    }
    
    body.adblock-blocked > *:not(#adblock-block-overlay) {
      pointer-events: none !important;
      opacity: 0.3;
      filter: blur(2px);
    }
    
    #adblock-block-overlay,
    #adblock-block-overlay * {
      filter: none !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }
    
    @media (max-width: 768px) {
      .ad-banner {
        padding: 10px;
        margin: 15px 0;
      }
      
      .ad-sidebar {
        position: static;
      }
    }
    
    @media (max-width: 480px) {
      .ad-banner {
        padding: 8px;
        margin: 10px 0;
      }
    }
  `;
  document.head.appendChild(style);
  
  console.log('🎨 تم تحميل أنماط الإعلانات');
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('📌 للتحكم في Popunder من Console:');
  console.log('───────────────────────────────────────────');
  console.log('debugPopunder()  - عرض معلومات Popunder');
  console.log('resetPopunder()  - إعادة تعيين Popunder');
  console.log('═══════════════════════════════════════════');
});dBannerAd(containerId, bannerConfig) {
    const container = this.ensureContainerExists(containerId);
    if (!container) {
      console.warn(`❌ Container ${containerId} not found`);
      return;
    }
    
    const ads = bannerConfig.ads;
    if (!ads || ads.length === 0) return;
    
    this.loadSingleAd(container, ads[0], containerId);
    
    // ⭐ هنا التدوير - لاحظ أننا لا نستدعي loadPopunder() هنا!
    if (bannerConfig.rotation && ads.length > 1) {
      let currentIndex = 0;
      const interval = bannerConfig.rotationInterval || 30000;
      
      if (this.rotationTimers[containerId]) {
        clearInterval(this.rotationTimers[containerId]);
      }
      
      this.rotationTimers[containerId] = setInterval(() => {
        currentIndex = (currentIndex + 1) % ads.length;
        this.loadSingleAd(container, ads[currentIndex], containerId);
        console.log(`🔄 تدوير إعلان في ${containerId}: ${ads[currentIndex].id}`);
        
        // ⛔ لا تستدعي loadPopunder() هنا أبداً!
        // هذا هو سبب المشكلة!
        
      }, interval);
    }
  }

  loadSingleAd(container, ad, containerId) {
    if (!ad || !ad.script) return;
    
    console.log(`📢 تحميل إعلان: ${ad.id} في ${containerId}`);
    
    const uniqueId = `${ad.id}-${Date.now()}`;
    
    window.atOptions = window.atOptions || {};
    Object.assign(window.atOptions, {
        ...ad.config,
        params: ad.config?.params || {}
    });
    
    const adDiv = document.createElement('div');
    adDiv.className = 'ad-banner';
    adDiv.id = `ad-wrapper-${uniqueId}`;
    adDiv.innerHTML = `
      <div class="ad-label">Advertisement</div>
      <div id="banner-${uniqueId}" style="text-align:center;min-height:${ad.config?.height || 90}px;background:transparent;"></div>
    `;
    
    container.innerHTML = '';
    container.appendChild(adDiv);
    
    setTimeout(() => {
        const script = document.createElement('script');
        script.src = ad.script;
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.id = `script-${uniqueId}`;
        
        script.onload = () => {
            console.log(`✅ تم تحميل إعلان: ${ad.id}`);
        };
        
        script.onerror = () => {
            console.warn(`⚠️ فشل تحميل إعلان: ${ad.id}`);
            this.showFallbackInContainer(container);
        };
        
        const targetElement = document.getElementById(`banner-${uniqueId}`);
        if (targetElement) {
            targetElement.appendChild(script);
        }
    }, 300);
  }

  loadMiddleAd() {
    if (!this.config.banners?.pageMiddle?.enabled) return;
    
    const container = this.ensureContainerExists('ad-page-middle');
    this.loadBannerAd('ad-page-middle', this.config.banners.pageMiddle);
  }

  loadExtraSidebarAd() {
    if (!this.config.sidebarAdExtra?.enabled) return;
    
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    if (sidebar.querySelector('#ad-sidebar-extra')) return;
    
    const extraContainer = document.createElement('div');
    extraContainer.id = 'ad-sidebar-extra';
    extraContainer.style.cssText = `
      min-height: 300px;
      margin: 20px 0;
      background: rgba(0,0,0,0.7);
      border-radius: 8px;
      padding: 15px;
      position: relative;
    `;
    
    const existingAd = sidebar.querySelector('#ad-sidebar');
    if (existingAd && existingAd.nextSibling) {
      sidebar.insertBefore(extraContainer, existingAd.nextSibling);
    } else {
      sidebar.appendChild(extraContainer);
    }
    
    this.loadBannerAd('ad-sidebar-extra', this.config.sidebarAdExtra);
  }

  loa
