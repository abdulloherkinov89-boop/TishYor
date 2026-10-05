import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../utils/api';
import { resetRoot } from '../RootNavigation';

const PHONE_PREFIX = '+998 ';

const RegisterScreen = () => {
  const navigation = useNavigation();

  const [ism, setIsm] = useState('');
  const [familiya, setFamiliya] = useState('');
  const [telefon, setTelefon] = useState(PHONE_PREFIX);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [focusedInput, setFocusedInput] = useState(null);

  // Telefon raqamni formatlash: +998 90 123 45 67
  const formatPhoneNumber = (digits) => {
    let formatted = '+998';
    if (digits.length > 0) {
      formatted += ' ' + digits.slice(0, 2); // 90
    }
    if (digits.length > 2) {
      formatted += ' ' + digits.slice(2, 5); // 123
    }
    if (digits.length > 5) {
      formatted += ' ' + digits.slice(5, 7); // 45
    }
    if (digits.length > 7) {
      formatted += ' ' + digits.slice(7, 9); // 67
    }
    return formatted;
  };

  const handlePhoneChange = (text) => {
    // "998" dan keyingi qismini olamiz (faqat raqamlar)
    let afterPrefix = text.replace(/\D/g, '');
    if (afterPrefix.startsWith('998')) {
      afterPrefix = afterPrefix.slice(3);
    }
    // 9 ta raqamdan (90 123 45 67) ortiq bo'lmasin
    afterPrefix = afterPrefix.slice(0, 9);

    setTelefon(formatPhoneNumber(afterPrefix));
  };

  const handlePhoneFocus = () => {
    setFocusedInput('telefon');
    // Agar foydalanuvchi maydonni to'liq tozalab qo'ygan bo'lsa, prefiksni qaytaramiz
    if (!telefon.startsWith('+998')) {
      setTelefon(PHONE_PREFIX);
    }
  };

  const handleRegister = async () => {
    const digitsOnly = telefon.replace(/\D/g, '');

    if (!ism.trim() || !familiya.trim() || digitsOnly.length < 12) {
      setErrorMessage("Iltimos, barcha maydonlarni to'liq to'ldiring");
      return;
    }

    const cleanPhone = '+' + digitsOnly;

    setLoading(true);
    setErrorMessage('');

    try {
      console.log("So'rov yuborilmoqda...");
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ism: ism.trim(),
          familiya: familiya.trim(),
          telefon: cleanPhone,
          role: 'patient',
        }),
      });
      console.log('Javob keldi, status:', response.status);

      const data = await response.json().catch(() => ({}));
      console.log('REGISTER: javob o‘qildi; token/user:', Boolean(data.access_token), Boolean(data.user));

      if (response.ok) {
        if (!data.access_token || !data.user) {
          throw new Error('Server javobida token yoki foydalanuvchi ma\'lumoti yo\'q');
        }

        const role = data.user.role || 'patient';
        console.log('REGISTER: sessiya saqlanmoqda...');
        await AsyncStorage.multiSet([
          ['token', data.access_token],
          ['user', JSON.stringify({ ...data.user, role })],
          ['role', role],
        ]);
        console.log('REGISTER: sessiya saqlandi, Welcome sahifasiga o‘tilmoqda...');
        const nextScreen = role === 'clinic' ? 'ClinicHome' : 'Welcome';
        console.log('REGISTER: root sahifaga o‘tish:', nextScreen);
        resetRoot(nextScreen);
      } else {
        setErrorMessage(
          data.detail || "Ro'yxatdan o'tishda xatolik yuz berdi"
        );
      }
    } catch (error) {
      console.log('REGISTER ERROR:', error);
      console.log('ERROR MESSAGE:', error.message);
      setErrorMessage('Serverga ulanishda xatolik yuz berdi');
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
                onChangeText={setIsm}
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
                onChangeText={setFamiliya}
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
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={telefon}
                onChangeText={handlePhoneChange}
                onFocus={handlePhoneFocus}
                onBlur={() => setFocusedInput(null)}
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
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLinkText}>
                Akauntingiz bormi? <Text style={styles.linkHighlight}>Kirish</Text>
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
    paddingVertical: 32,
    justifyContent: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
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