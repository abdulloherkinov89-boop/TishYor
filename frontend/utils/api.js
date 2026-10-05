import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import { navigate } from '../RootNavigation';

const scriptUrl = NativeModules.SourceCode?.scriptURL || '';
const scriptHost = scriptUrl.match(/^(?:https?|exp):\/\/([^/:]+)/)?.[1];
const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const API_HOST = Platform.OS === 'web' ? 'localhost' : expoHost || scriptHost || 'localhost';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${API_HOST}:8000`;

console.log('API_BASE_URL:', API_BASE_URL);

export async function apiFetch(url, options = {}) {
  const token = await AsyncStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  const isMultipartBody = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!headers.has('Content-Type') && options.body && !isMultipartBody) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  let manualTimeoutId;
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const manualTimeout = new Promise((_, reject) => {
    manualTimeoutId = setTimeout(() => {
      reject(new Error('Server javob bermadi (timeout)'));
    }, 16000);
  });

  let response;
  try {
    response = await Promise.race([
      fetch(fullUrl, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      }),
      manualTimeout,
    ]);
  } catch (error) {
    if (error?.name === 'AbortError' || error?.message?.includes('canceled')) {
      throw new Error('Server javobi kutilgan vaqtda kelmadi. Internetni tekshiring.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    clearTimeout(manualTimeoutId);
  }

  if (response.status === 401) {
    await AsyncStorage.multiRemove(['token', 'user']);
    navigate('Login');
  }

  return response;
}