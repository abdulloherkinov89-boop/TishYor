import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../utils/api';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [telefon, setTelefon] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleLogin = async () => {
    if (!telefon.trim()) {
      setErrorMessage('Iltimos, telefon raqamingizni kiriting');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefon: telefon.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        if (!data.access_token || !data.user) {
          throw new Error('Server javobida token yoki foydalanuvchi ma\'lumoti yo\'q');
        }

        const role = data.user.role || 'patient';
        await AsyncStorage.multiSet([
          ['token', data.access_token],
          ['user', JSON.stringify({ ...data.user, role })],
          ['role', role],
        ]);
        navigation.reset({
          index: 0,
          routes: [{ name: role === 'clinic' ? 'ClinicHome' : 'Welcome' }],
        });
      } else {
        setErrorMessage(data.detail || 'Kirishda xatolik yuz berdi');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Serverga ulanishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Kirish</Text>
            <Text style={styles.subtitle}>
              Telefon raqamingiz orqali hisobingizga kiring
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon raqam</Text>
              <TextInput
                style={[
                  styles.input,
                  isFocused && styles.inputFocused,
                  errorMessage ? styles.inputError : null,
                ]}
                placeholder="+998901234567"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={telefon}
                onChangeText={setTelefon}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.buttonText}>Yuklanmoqda...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Kirish</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register', { role: 'patient' })}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLinkText}>
                Hisobingiz yo'qmi? Yaratish
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 26,
    paddingHorizontal: 20,
    fontSize: 15,
    color: '#0F172A',
  },
  inputFocused: {
    borderColor: '#0083CA',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    height: 52,
    backgroundColor: '#0083CA',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  registerLinkText: {
    color: '#0083CA',
    fontSize: 15,
    fontWeight: '600',
  },
});