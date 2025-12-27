/**
 * 🛡️ نظام Anti-Adblock المحسّن
 * يكشف مانع الإعلانات ويعرض رسالة تعيق الزائر
 */

class EnhancedAntiAdblock {
  constructor() {
    this.isBlocked = false;
    this.detectionMethods = 0;
    this.overlay = null;
  }

  // === 1. بدء الكشف ===
  async init() {
    console.log('🔍 بدء فحص مانع الإعلانات...');
    
    // Start detection
    await Promise.all([
      this.detectByElement(),
      this.detectByScript(),
      this.detectByFetch(),
      this.detectByBait(),
      this.detectByIframe()
    ]);

    // If ad blocker detected
    if (this.isBlocked) {
      console.warn('⚠️ Ad blocker detected!');
      this.showBlockingMessage();
    } else {
      console.log('✅ No ad blocker detected');
    }
  }

  // === 2. Element Detection ===
  detectByElement() {
    return new Promise((resolve) => {
      const bait = document.createElement('div');
      bait.className = 'adsbox ad ads adsbygoogle pub_300x250 pub_300x250m pub_728x90 textAd text_ad text_ads text-ads text-ad-links';
      bait.style.cssText = 'width:1px!important;height:1px!important;position:absolute!important;left:-9999px!important;top:-9999px!important;';
      
      document.body.appendChild(bait);
      
      setTimeout(() => {
        const computed = window.getComputedStyle(bait);
        const isHidden = computed.display === 'none' || 
                        computed.visibility === 'hidden' || 
                        bait.offsetHeight === 0 || 
                        bait.offsetWidth === 0;
        
        if (isHidden) {
          this.isBlocked = true;
          this.detectionMethods++;
          console.log('🎯 Method 1: Hidden element');
        }
        
        document.body.removeChild(bait);
        resolve();
      }, 100);
    });
  }

  // === 3. Script Detection ===
  detectByScript() {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.async = true;
      
      script.onerror = () => {
        this.isBlocked = true;
        this.detectionMethods++;
        console.log('🎯 Method 2: Script blocked');
        resolve();
      };
      
      script.onload = () => {
        resolve();
      };
      
      document.head.appendChild(script);
      
      setTimeout(() => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        resolve();
      }, 3000);
    });
  }

  // === 4. Fetch Detection ===
  async detectByFetch() {
    try {
      const response = await fetch('https://googleads.g.doubleclick.net/pagead/id', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      
      // If request fails, ad blocker exists
    } catch (error) {
      this.isBlocked = true;
      this.detectionMethods++;
      console.log('🎯 Method 3: Fetch blocked');
    }
  }

  // === 5. Bait Detection ===
  detectByBait() {
    return new Promise((resolve) => {
      const bait = document.createElement('div');
      bait.setAttribute('class', 'ad-placement ad-placeholder adbadge BannerAd');
      bait.setAttribute('id', 'ad_banner');
      bait.innerHTML = '<ins class="adsbygoogle" data-ad-client="ca-pub-123456789"></ins>';
      bait.style.cssText = 'width:1px!important;height:1px!important;position:absolute!important;left:-9999px!important;';
      
      document.body.appendChild(bait);
      
      setTimeout(() => {
        if (bait.offsetHeight === 0 || window.getComputedStyle(bait).display === 'none') {
          this.isBlocked = true;
          this.detectionMethods++;
          console.log('🎯 Method 4: Bait hidden');
        }
        
        document.body.removeChild(bait);
        resolve();
      }, 100);
    });
  }

  // === 6. Iframe Detection ===
  detectByIframe() {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.googletagservices.com/tag/js/gpt.js';
      iframe.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;';
      
      iframe.onerror = () => {
        this.isBlocked = true;
        this.detectionMethods++;
        console.log('🎯 Method 5: Iframe blocked');
        resolve();
      };
      
      iframe.onload = () => {
        resolve();
      };
      
      document.body.appendChild(iframe);
      
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
        resolve();
      }, 2000);
    });
  }

  // === 7. Show Blocking Message ===
  showBlockingMessage() {
    // Remove old message if exists
    if (this.overlay) {
      this.overlay.remove();
    }

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'adblock-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(0,0,0,0.98), rgba(26,42,108,0.98));
      z-index: 999999999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.5s ease;
      backdrop-filter: blur(10px);
    `;

    this.overlay.innerHTML = `
      <div style="
        background: linear-gradient(145deg, #1a1a2e, #16213e);
        padding: 50px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 100px rgba(255,68,68,0.3);
        max-width: 600px;
        width: 90%;
        text-align: center;
        border: 2px solid rgba(255,68,68,0.3);
        animation: slideIn 0.5s ease;
      ">
        <!-- Warning Icon -->
        <div style="
          width: 100px;
          height: 100px;
          margin: 0 auto 30px;
          background: linear-gradient(135deg, #ff4444, #cc0000);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 50px;
          box-shadow: 0 10px 30px rgba(255,68,68,0.5);
          animation: pulse 2s infinite;
        ">
          ⚠️
        </div>

        <!-- Title -->
        <h2 style="
          color: #ff4444;
          font-size: 32px;
          margin-bottom: 20px;
          font-weight: bold;
          text-shadow: 0 2px 10px rgba(255,68,68,0.5);
        ">
          AdBlock Detected!
        </h2>

        <!-- Main Message -->
        <p style="
          color: rgba(255,255,255,0.9);
          font-size: 18px;
          line-height: 1.8;
          margin-bottom: 30px;
          padding: 25px;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          border-left: 4px solid #ff4444;
        ">
          <strong style="color: #ffd700; font-size: 20px;">Our games are 100% FREE and always will be!</strong><br><br>
          🎮 We don't ask for payments or registration<br>
          💰 Only ads support our free service<br>
          🙏 Please disable your ad blocker to help us continue
        </p>

        <!-- Detection Info -->
        <div style="
          background: rgba(255,68,68,0.1);
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 30px;
          border: 1px solid rgba(255,68,68,0.3);
        ">
          <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin: 0;">
            🔍 Detected using ${this.detectionMethods} different methods
          </p>
        </div>

        <!-- How to Disable Steps -->
        <div style="
          text-align: left;
          background: rgba(255,255,255,0.05);
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 30px;
        ">
          <h3 style="color: #ffd700; margin-bottom: 15px; font-size: 20px;">
            📋 How to Disable AdBlock:
          </h3>
          <ol style="
            color: rgba(255,255,255,0.8);
            font-size: 15px;
            line-height: 2;
            padding-left: 20px;
          ">
            <li>Click on the AdBlock icon in your browser 🛡️</li>
            <li>Select "Disable on this site" or "Pause" ⏸️</li>
            <li>Refresh the page 🔄</li>
          </ol>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
          <button onclick="location.reload()" style="
            background: linear-gradient(135deg, #00d2ff, #3a7bd5);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,210,255,0.4);
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 7px 20px rgba(0,210,255,0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 5px 15px rgba(0,210,255,0.4)'">
            🔄 Reload Page
          </button>
          
          <button onclick="window.open('https://help.getadblock.com/support/solutions/articles/6000055743-how-to-disable-adblock-on-specific-sites', '_blank')" style="
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(102,126,234,0.4);
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 7px 20px rgba(102,126,234,0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 5px 15px rgba(102,126,234,0.4)'">
            ℹ️ Need Help?
          </button>
        </div>

        <!-- Alternative Message -->
        <div style="
          margin-top: 30px;
          padding: 15px;
          background: rgba(255,215,0,0.1);
          border-radius: 10px;
          border: 1px solid rgba(255,215,0,0.3);
        ">
          <p style="color: #ffd700; font-size: 14px; margin: 0;">
            💡 Having trouble? Contact us at support@example.com
          </p>
        </div>
      </div>

      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 10px 30px rgba(255,68,68,0.5);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 15px 40px rgba(255,68,68,0.7);
          }
        }
      </style>
    `;

    document.body.appendChild(this.overlay);

    // Prevent scrolling
    document.body.style.overflow = 'hidden';

    // Protect overlay from removal
    this.protectOverlay();
  }

  // === 8. Protect Overlay ===
  protectOverlay() {
    // Prevent overlay removal via DevTools
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          mutation.removedNodes.forEach((node) => {
            if (node.id === 'adblock-overlay') {
              console.warn('⚠️ محاولة إزالة رسالة مانع الإعلانات!');
              // إعادة إضافة الرسالة
              setTimeout(() => {
                if (!document.getElementById('adblock-overlay')) {
                  this.showBlockingMessage();
                }
              }, 100);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // فحص دوري
    setInterval(() => {
      if (this.isBlocked && !document.getElementById('adblock-overlay')) {
        console.warn('⚠️ إعادة عرض رسالة مانع الإعلانات');
        this.showBlockingMessage();
      }
    }, 5000);
  }

  // === 9. إعادة الفحص ===
  recheck() {
    this.isBlocked = false;
    this.detectionMethods = 0;
    
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      document.body.style.overflow = '';
    }
    
    this.init();
  }
}

// === Auto-start ===
(function() {
  // Wait for page to fully load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAntiAdblock);
  } else {
    startAntiAdblock();
  }

  function startAntiAdblock() {
    // Small delay to allow ad blocker to load
    setTimeout(() => {
      const antiAdblock = new EnhancedAntiAdblock();
      antiAdblock.init();
      
      // Save globally for control
      window.antiAdblock = antiAdblock;
      
      console.log('🛡️ Anti-Adblock system ready');
    }, 1000);
  }
})();

// === Manual recheck function ===
function recheckAdblock() {
  if (window.antiAdblock) {
    window.antiAdblock.recheck();
  }
}

console.log('🚀 Enhanced Anti-Adblock system loaded');
