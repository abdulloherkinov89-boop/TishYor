import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import { navigate } from '../RootNavigation';

const scriptUrl = NativeModules.SourceCode?.scriptURL || '';
const scriptHost = scriptUrl.match(/^(?:https?|exp):\/\/([^/:]+)/)?.[1];
const expoHostUri =
  Constants.expoConfig?.hostUri ||
  Constants.manifest2?.extra?.expoClient?.hostUri ||
  Constants.manifest?.debuggerHost ||
  Constants.manifest?.hostUri;
const expoHost = expoHostUri?.split(':')[0];
const API_HOST = Platform.OS === 'web' ? 'localhost' : expoHost || scriptHost || 'localhost';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${API_HOST}:8000`;
const API_TIMEOUT_MS = 15000;

console.log('API_BASE_URL:', API_BASE_URL);

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
        const headers = new Headers(options.headers || {});
        const isMultipartBody =
          typeof FormData !== 'undefined' && options.body instanceof FormData;

        if (!headers.has('Content-Type') && options.body && !isMultipartBody) {
          headers.set('Content-Type', 'application/json');
        }
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        const response = await fetch(fullUrl, {
          ...options,
          headers,
          signal: options.signal || controller.signal,
        });

        if (response.status === 401) {
          await AsyncStorage.multiRemove(['token', 'user']);
          navigate('Login');
        }

        return response;
      })(),
      timeout,
    ]);
  } catch (error) {
    if (
      error?.message === 'API_TIMEOUT' ||
      error?.name === 'AbortError' ||
      error?.message?.includes('canceled')
    ) {
      throw new Error('Server javobi kutilgan vaqtda kelmadi. Internetni tekshiring.');
    }
    if (error?.name === 'TypeError' && /fetch|network/i.test(error.message || '')) {
      throw new Error(
        'Serverga ulanib bo‘lmadi. Backend ishlayotganini va telefon bilan kompyuter bir Wi-Fi tarmog‘ida ekanini tekshiring.',
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}