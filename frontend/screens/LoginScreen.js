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
import { resetRoot } from '../RootNavigation';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [telefon, setTelefon] = useState('+998 ');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Telefon raqamini O'zbekiston formati boyicha shakllantirish (+998 (XX) XXX-XX-XX)
  const formatPhoneNumber = (text) => {
    // Faqat raqamlarni ajratib olamiz
    const cleaned = text.replace(/\D/g, '');

    // Agar foydalanuvchi barchasini o'chirib tashlasa ham +998 saqlanadi
    if (cleaned.length <= 3) {
      return '+998 ';
    }

    // 998 dan keyingi raqamlar
    const number = cleaned.startsWith('998') ? cleaned.slice(3) : cleaned;
    const limitedNumber = number.slice(0, 9); // Maksimal 9 ta raqam (kodsiz)

    let formatted = '+998 ';

    if (limitedNumber.length > 0) {
      formatted += `(${limitedNumber.slice(0, 2)}`;
    }
    if (limitedNumber.length >= 2) {
      formatted += `) `;
    }
    if (limitedNumber.length > 2) {
      formatted += `${limitedNumber.slice(2, 5)}`;
    }
    if (limitedNumber.length >= 5) {
      formatted += `-${limitedNumber.slice(5, 7)}`;
    }
    if (limitedNumber.length >= 7) {
      formatted += `-${limitedNumber.slice(7, 9)}`;
    }

    return formatted;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setTelefon(formatted);
    if (errorMessage) setErrorMessage('');
  };

  const handleLogin = async () => {
    // Serverga yuborish uchun toza raqam formatini olamiz: +998901234567
    const rawDigits = telefon.replace(/\D/g, '');
    
    if (rawDigits.length < 12) {
      setErrorMessage('Iltimos, telefon raqamingizni to\'liq kiriting');
      return;
    }

    const cleanPhone = `+${rawDigits}`;

    setLoading(true);
    setErrorMessage('');

    try {
      console.log('LOGIN: so‘rov yuborilmoqda...');
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefon: cleanPhone }),
      });
      console.log('LOGIN: javob keldi, status:', response.status);
      const data = await response.json().catch(() => ({}));
      console.log('LOGIN: javob o‘qildi; token/user:', Boolean(data.access_token), Boolean(data.user));

      if (response.ok) {
        if (!data.access_token || !data.user) {
          throw new Error('Server javobida token yoki foydalanuvchi ma\'lumoti yo\'q');
        }

        const role = data.user.role || 'patient';
        console.log('LOGIN: sessiya saqlanmoqda...');
        await AsyncStorage.multiSet([
          ['token', data.access_token],
          ['user', JSON.stringify({ ...data.user, role })],
          ['role', role],
        ]);
        console.log('LOGIN: sessiya saqlandi, sahifaga o‘tilmoqda...');
        const nextScreen = role === 'clinic' ? 'ClinicHome' : 'Welcome';
        console.log('LOGIN: root sahifaga o‘tish:', nextScreen);
        resetRoot(nextScreen);
      } else {
        setErrorMessage(data.detail || 'Kirishda xatolik yuz berdi');
      }
    } catch (error) {
      console.log('LOGIN ERROR:', error);
      console.log('LOGIN ERROR MESSAGE:', error.message);
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
                placeholder="+998 (90) 123-45-67"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={telefon}
                onChangeText={handlePhoneChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoComplete="tel"
                textContentType="telephoneNumber"
                maxLength={19} // Noto'g'ri ortiqcha belgi kiritishni cheklash
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