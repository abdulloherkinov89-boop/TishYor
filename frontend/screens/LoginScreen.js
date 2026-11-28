import React, { useEffect, useState } from 'react';
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
import { ArrowLeft, Building2, UserRound } from 'lucide-react-native';
import { apiFetch } from '../utils/api';
import {
  PHONE_PREFIX,
  formatUzPhone,
  parseApiError,
  toApiUzPhone,
} from '../utils/phone';

const LoginScreen = ({ onAuthenticated, route }) => {
  const navigation = useNavigation();
  const routeRole =
    route?.params?.role === 'clinic' || route?.params?.role === 'patient'
      ? route.params.role
      : null;

  const [selectedRole, setSelectedRole] = useState(routeRole);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [telefon, setTelefon] = useState(PHONE_PREFIX);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setSelectedRole(routeRole);
    setShowRolePicker(false);
    setErrorMessage('');
  }, [routeRole]);

  const handlePhoneChange = (text) => {
    setTelefon(formatUzPhone(text));
    if (errorMessage) setErrorMessage('');
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    if (errorMessage) setErrorMessage('');
  };

  const handleLogin = async () => {
    const cleanPhone = toApiUzPhone(telefon);
    if (!cleanPhone) {
      setErrorMessage("Iltimos, telefon raqamingizni to'liq kiriting");
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefon: cleanPhone,
          role: selectedRole,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 409) {
          setShowRolePicker(true);
        }
        setErrorMessage(parseApiError(data.detail, 'Kirishda xatolik yuz berdi'));
        return;
      }

      if (!data.access_token || !data.user) {
        throw new Error("Server javobida token yoki foydalanuvchi ma'lumoti yo'q");
      }

      const role = data.user.role;
      if (role !== 'patient' && role !== 'clinic') {
        throw new Error("Hisob turi aniqlanmadi. Iltimos, qayta urinib ko'ring.");
      }

      if (selectedRole && role !== selectedRole) {
        throw new Error(
          selectedRole === 'clinic'
            ? 'Bu raqam klinika hisobiga tegishli emas'
            : 'Bu raqam bemor hisobiga tegishli emas',
        );
      }

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
            <Text style={styles.title}>
              {selectedRole === 'clinic'
                ? 'Klinikaga kirish'
                : selectedRole === 'patient'
                  ? 'Bemor sifatida kirish'
                  : 'Hisobga kirish'}
            </Text>
            <Text style={styles.subtitle}>
              Telefon raqamingiz orqali hisobingizga kiring
            </Text>
          </View>

          {showRolePicker ? (
            <View style={styles.roleSwitch}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'patient' && styles.roleOptionActive,
                ]}
                onPress={() => handleRoleChange('patient')}
                activeOpacity={0.8}
              >
                <UserRound
                  size={16}
                  color={selectedRole === 'patient' ? '#0083CA' : '#64748B'}
                />
                <Text
                  style={[
                    styles.roleOptionText,
                    selectedRole === 'patient' && styles.roleOptionTextActive,
                  ]}
                >
                  Bemor
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'clinic' && styles.roleOptionActive,
                ]}
                onPress={() => handleRoleChange('clinic')}
                activeOpacity={0.8}
              >
                <Building2
                  size={16}
                  color={selectedRole === 'clinic' ? '#0083CA' : '#64748B'}
                />
                <Text
                  style={[
                    styles.roleOptionText,
                    selectedRole === 'clinic' && styles.roleOptionTextActive,
                  ]}
                >
                  Klinika
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon raqam</Text>
              <TextInput
                style={[
                  styles.input,
                  isFocused && styles.inputFocused,
                  errorMessage ? styles.inputError : null,
                ]}
                placeholder="+998 90 123 45 67"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={telefon}
                onChangeText={handlePhoneChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onSubmitEditing={handleLogin}
                autoComplete="tel"
                textContentType="telephoneNumber"
                maxLength={17}
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
              onPress={() => {
                if (selectedRole === 'clinic') {
                  navigation.navigate('ClinicRegister');
                } else if (selectedRole === 'patient') {
                  navigation.navigate('Register', { role: 'patient' });
                } else {
                  navigation.navigate('AuthChoice');
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLinkText}>
                Hisobingiz yo'qmi?{' '}
                <Text style={styles.linkHighlight}>Ro'yxatdan o'tish</Text>
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
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    padding: 4,
    marginBottom: 24,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 18,
  },
  roleOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  roleOptionTextActive: {
    color: '#0083CA',
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
    color: '#64748B',
    fontSize: 15,
  },
  linkHighlight: {
    color: '#0083CA',
    fontWeight: '700',
  },
});
