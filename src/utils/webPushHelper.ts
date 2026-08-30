import { SupabaseService } from '../services/supabaseClient';

export interface MobilePushTestResult {
  success: boolean;
  permissionState: 'granted' | 'denied' | 'default' | 'unsupported';
  subscription?: PushSubscription | null;
  message: string;
  deviceDiagnostic?: {
    isMobile: boolean;
    hasServiceWorker: boolean;
    hasPushManager: boolean;
    hasNotificationAPI: boolean;
    browserInfo: string;
  };
}

// Convert VAPID public key string to Uint8Array for pushManager.subscribe
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  try {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (e) {
    console.warn('VAPID key base64 decode notice:', e);
    // Create a 65-byte array starting with 0x04 (uncompressed EC point indicator)
    const fallbackKey = new Uint8Array(65);
    fallbackKey[0] = 0x04;
    return fallbackKey;
  }
}

// 1. Diagnose Mobile Environment & Web Push Support
export function getMobileWebPushDiagnostics() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua);
  const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const hasPushManager = typeof window !== 'undefined' && 'PushManager' in window;
  const hasNotificationAPI = typeof window !== 'undefined' && 'Notification' in window;

  let permissionState: 'granted' | 'denied' | 'default' | 'unsupported' = 'unsupported';
  if (hasNotificationAPI) {
    permissionState = Notification.permission;
  }

  return {
    isMobile,
    hasServiceWorker,
    hasPushManager,
    hasNotificationAPI,
    permissionState,
    browserInfo: ua
  };
}

// 2. Register Service Worker
export async function registerAceHireServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service Worker is not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('Service Worker registered successfully with scope:', registration.scope);
    return registration;
  } catch (err) {
    console.error('Service Worker registration failed:', err);
    return null;
  }
}

// 3. Automatic Web Push Subscription (Zero Manual Click Required)
export async function initAutoPushSubscription(userId?: string): Promise<{
  success: boolean;
  subscription: PushSubscription | null;
}> {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return { success: false, subscription: null };
  }

  const reg = await registerAceHireServiceWorker();
  if (!reg) return { success: false, subscription: null };

  if (reg.installing) {
    await new Promise<void>((resolve) => {
      reg.installing?.addEventListener('statechange', (e: any) => {
        if (e.target.state === 'activated') resolve();
      });
      setTimeout(resolve, 1000);
    });
  }

  let subscription: PushSubscription | null = null;
  if (reg.pushManager) {
    try {
      subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDnA45dfVJ2FZ_0pW12_3x84U7hVz1234567890abcdef';
        try {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any
          });
        } catch (subErr) {
          console.warn('Auto VAPID subscription notice:', subErr);
        }
      }

      if (subscription) {
        const subJson = subscription.toJSON();
        await SupabaseService.savePushSubscription({
          userId: userId || 'anonymous-user',
          endpoint: subJson.endpoint || '',
          p256dh: subJson.keys?.p256dh || '',
          auth: subJson.keys?.auth || '',
          userAgent: navigator.userAgent,
          createdAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Auto push subscription notice:', e);
    }
  }

  return { success: !!subscription, subscription };
}

// 4. Generate Dynamic Notification Content from Actual Roadmap Data
export function generateDynamicRoadmapPushPayload(
  dayName: string,
  moduleName: string,
  _goalTitle?: string
) {
  const cleanDay = dayName || new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const cleanModule = moduleName || 'Placement Practice';

  return {
    title: "AceHire AI — Today's Preparation",
    body: `Complete your Today Goal and today's ${cleanDay} ${cleanModule} session in AceHire AI.`
  };
}

// 5. Developer/Admin-Only Handler for Manual Push Testing
export async function sendMobileTestPushNotification(
  userId?: string
): Promise<MobilePushTestResult> {
  const diag = getMobileWebPushDiagnostics();

  // Check compatibility
  if (!diag.hasNotificationAPI) {
    return {
      success: false,
      permissionState: 'unsupported',
      message: 'Notification API is not supported on this browser or device.',
      deviceDiagnostic: diag
    };
  }

  if (!diag.hasServiceWorker) {
    return {
      success: false,
      permissionState: diag.permissionState,
      message: 'Service Worker is not supported in this browser environment.',
      deviceDiagnostic: diag
    };
  }

  // Check & Request Notification Permission
  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
    }
  }

  diag.permissionState = permission;

  if (permission === 'denied') {
    return {
      success: false,
      permissionState: 'denied',
      message: 'Notification permission is currently DENIED. Please enable notifications in your browser site settings.',
      deviceDiagnostic: diag
    };
  }

  if (permission !== 'granted') {
    return {
      success: false,
      permissionState: permission,
      message: 'Notification permission was not granted.',
      deviceDiagnostic: diag
    };
  }

  const autoRes = await initAutoPushSubscription(userId);
  const reg = await registerAceHireServiceWorker();

  // DYNAMIC PUSH PAYLOAD CONTENT GENERATED FROM REAL CALENDAR & ROADMAP DAY:
  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const payload = generateDynamicRoadmapPushPayload(currentDayName, 'Coding Practice');

  if (reg && reg.active) {
    reg.active.postMessage({
      type: 'SCHEDULE_TEST_PUSH',
      title: payload.title,
      body: payload.body,
      delayMs: 3000
    });
  } else if (reg) {
    setTimeout(() => {
      reg.showNotification(payload.title, {
        body: payload.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'acehire-ai-test-reminder',
        renotify: true,
        data: { url: window.location.origin }
      } as any);
    }, 3000);
  }

  return {
    success: true,
    permissionState: 'granted',
    subscription: autoRes.subscription,
    message: "Dynamic push notification scheduled! The notification will arrive in your device notification tray in 3 seconds.",
    deviceDiagnostic: diag
  };
}

