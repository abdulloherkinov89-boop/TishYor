import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import { navigate } from '../RootNavigation';

const scriptUrl = NativeModules.SourceCode?.scriptURL || '';
const scriptHost = scriptUrl.match(/^(?:https?|exp):\/\/([^/:]+)/)?.[1];
const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const API_HOST = Platform.OS === 'web' ? 'localhost' : expoHost || scriptHost || 'localhost';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${API_HOST}:8000`;

export async function apiFetch(url, options = {}) {
  const token = await AsyncStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(
    url.startsWith('http') ? url : `${API_BASE_URL}${url}`,
    { ...options, headers },
  );

  if (response.status === 401) {
    await AsyncStorage.multiRemove(['token', 'user']);
    navigate('Login');
  }

  return response;
}