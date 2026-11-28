import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';
import { apiFetch } from '../utils/api';
import {
  PHONE_PREFIX,
  formatUzPhone,
  parseApiError,
  toApiUzPhone,
} from '../utils/phone';

const RegisterScreen = ({ onAuthenticated }) => {
  const navigation = useNavigation();

  const [ism, setIsm] = useState('');
  const [familiya, setFamiliya] = useState('');
  const [telefon, setTelefon] = useState(PHONE_PREFIX);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);

  const handlePhoneChange = (text) => {
    setTelefon(formatUzPhone(text));
    if (errorMessage) setErrorMessage('');
  };

  const handlePhoneFocus = () => {
    setFocusedInput('telefon');
    if (!telefon.startsWith('+998')) {
      setTelefon(PHONE_PREFIX);
    }
  };

  const handleRegister = async () => {
    const cleanIsm = ism.trim();
    const cleanFamiliya = familiya.trim();
    const cleanPhone = toApiUzPhone(telefon);

    if (!cleanIsm || !cleanFamiliya) {
      setErrorMessage('Iltimos, ism va familiyangizni kiriting');
      return;
    }

    if (!cleanPhone) {
      setErrorMessage("Iltimos, telefon raqamingizni to'liq kiriting");
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ism: cleanIsm,
          familiya: cleanFamiliya,
          telefon: cleanPhone,
          role: 'patient',
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(
          parseApiError(data.detail, "Ro'yxatdan o'tishda xatolik yuz berdi"),
        );
        return;
      }

      if (!data.access_token || !data.user) {
        throw new Error("Server javobida token yoki foydalanuvchi ma'lumoti yo'q");
      }

      const role = data.user.role || 'patient';
      const user = { ...data.user, role };
      await AsyncStorage.multiSet([
        ['token', data.access_token],
        ['user', JSON.stringify(user)],
        ['role', role],
      ]);
      onAuthenticated?.({ role, user });
    } catch (error) {
      setErrorMessage(error?.message || 'Serverga ulanishda xatolik yuz berdi');
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {navigation.canGoBack() ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <ArrowLeft color="#334155" size={20} />
              <Text style={styles.backButtonText}>Orqaga</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Bemor ro'yxati</Text>
            <Text style={styles.subtitle}>
              Ro'yxatdan o'tish uchun ma'lumotlaringizni kiriting
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ism</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'ism' && styles.inputFocused,
                ]}
                placeholder="Ismingizni kiriting"
                placeholderTextColor="#94A3B8"
                value={ism}
                onChangeText={(value) => {
                  setIsm(value);
                  if (errorMessage) setErrorMessage('');
                }}
                onFocus={() => setFocusedInput('ism')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Familiya</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'familiya' && styles.inputFocused,
                ]}
                placeholder="Familiyangizni kiriting"
                placeholderTextColor="#94A3B8"
                value={familiya}
                onChangeText={(value) => {
                  setFamiliya(value);
                  if (errorMessage) setErrorMessage('');
                }}
                onFocus={() => setFocusedInput('familiya')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon raqam</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'telefon' && styles.inputFocused,
                ]}
                placeholder="+998 90 123 45 67"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={telefon}
                onChangeText={handlePhoneChange}
                onFocus={handlePhoneFocus}
                onBlur={() => setFocusedInput(null)}
                onSubmitEditing={handleRegister}
                maxLength={17}
              />
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.buttonText}>Yuklanmoqda...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Ro'yxatdan o'tish</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login', { role: 'patient' })}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLinkText}>
                Hisobingiz bormi? <Text style={styles.linkHighlight}>Kirish</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

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
    paddingVertical: 24,
    justifyContent: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingRight: 12,
    marginBottom: 16,
  },
  backButtonText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  headerContainer: {
    marginBottom: 28,
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
    borderRadius: 26,
    paddingHorizontal: 20,
    fontSize: 15,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  inputFocused: {
    borderColor: '#0083CA',
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
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginLinkText: {
    color: '#64748B',
    fontSize: 15,
  },
  linkHighlight: {
    color: '#0083CA',
    fontWeight: '700',
  },
});
