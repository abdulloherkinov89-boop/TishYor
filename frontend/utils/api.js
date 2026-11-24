import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import { navigate } from '../RootNavigation';

/**
 * API Sozlamalari:
 * Telefonda Expo Go ishlatilganda 'localhost' ishlamaydi.
 * Kompyuteringizning LAN IP manzilini shu yerda o'zgartirishingiz mumkin.
 * Shuningdek, .env faylida EXPO_PUBLIC_API_URL orqali ham boshqarish mumkin.
 */
export const DEV_LAN_IP = '192.168.70.132';
export const DEV_PORT = 8000;

export function resolveApiBaseUrl() {
  const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

  // Agar tashqi / production HTTPS domen bo'lsa, har doim uni ishlatamiz
  if (configuredApiUrl && configuredApiUrl.startsWith('https://')) {
    return configuredApiUrl;
  }

  if (Platform.OS === 'web') {
    if (configuredApiUrl) {
      return configuredApiUrl;
    }
    return 'http://localhost:8000';
  }

  // Mobil / Expo Go: Metro server hostini avtomatik aniqlash
  const scriptUrl = NativeModules.SourceCode?.scriptURL || '';
  const scriptHost = scriptUrl.match(/^(?:https?|exp):\/\/([^/:]+)/)?.[1];
  const expoHostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest?.hostUri;
  const expoHost = expoHostUri?.split(':')[0];

  const detectedHost = expoHost || scriptHost;
  const isLoopback = !detectedHost || detectedHost === 'localhost' || detectedHost === '127.0.0.1';

  // Agar Expo Go orqali kompyuter IP manzili aniqlangan bo'lsa, uni avtomatik olamiz
  if (!isLoopback) {
    return `http://${detectedHost}:${DEV_PORT}`;
  }

  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  return `http://${DEV_LAN_IP}:${DEV_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();
const API_TIMEOUT_MS = 15000;

console.log('[API CONFIG] Faol API_BASE_URL:', API_BASE_URL, '| Platform:', Platform.OS);

export async function apiFetch(url, options = {}) {
  const controller = new AbortController();
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('API_TIMEOUT'));
    }, API_TIMEOUT_MS);
  });

  try {
    return await Promise.race([
      (async () => {
        const token = await AsyncStorage.getItem('token');
        const isMultipartBody =
          typeof FormData !== 'undefined' && options.body instanceof FormData;

        // Plain object headers (Web va React Native uchun 100% ishonchli)
        const incomingHeaders = options.headers instanceof Headers
          ? Object.fromEntries(options.headers.entries())
          : (options.headers || {});

        const headers = {
          ...(options.body && !isMultipartBody ? { 'Content-Type': 'application/json' } : {}),
          ...incomingHeaders,
        };

        if (token && !headers['Authorization'] && !headers['authorization']) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const method = (options.method || 'GET').toUpperCase();
        console.log(`[API REQUEST] ${method} ${fullUrl}`, {
          hasToken: Boolean(token),
        });

        const response = await fetch(fullUrl, {
          ...options,
          method,
          headers,
          signal: options.signal || controller.signal,
        });

        console.log(`[API RESPONSE] ${response.status} ${method} ${fullUrl}`);

        if (response.status === 401) {
          console.warn('[API 401] Sessiya muddati tugagan yoki token yaroqsiz:', fullUrl);
          const role = await AsyncStorage.getItem('role');
          await AsyncStorage.multiRemove(['token', 'user', 'role']);
          navigate('Login', { role: role === 'clinic' ? 'clinic' : 'patient' });
        }

        return response;
      })(),
      timeout,
    ]);
  } catch (error) {
    console.error(`[API ERROR] ${fullUrl}:`, error?.message || error);
    if (
      error?.message === 'API_TIMEOUT' ||
      error?.name === 'AbortError' ||
      error?.message?.includes('canceled')
    ) {
      throw new Error('Server javobi kutilgan vaqtda kelmadi. Internetni tekshiring.');
    }
    if (error?.name === 'TypeError' && /fetch|network/i.test(error.message || '')) {
      throw new Error(
        `Serverga ulanib bo‘lmadi (${API_BASE_URL}). Backend ishlayotganini va bir tarmoqda (Wi-Fi) ekanini tekshiring.`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}