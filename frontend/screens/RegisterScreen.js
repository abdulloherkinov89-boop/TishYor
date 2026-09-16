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

// API manzili — <SERVER_IP> o'rniga o'zingizning IP manzilingizni kiriting
const API_URL = 'http://<SERVER_IP>:8000/auth/register';

const RegisterScreen = () => {
  const navigation = useNavigation();

  // Inputlar uchun state'lar
  const [ism, setIsm] = useState('');
  const [familiya, setFamiliya] = useState('');
  const [telefon, setTelefon] = useState('');

  // Yuklanish va xatolik state'lari
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    // Maydonlar to'ldirilganligini tekshirish
    if (!ism.trim() || !familiya.trim() || !telefon.trim()) {
      setErrorMessage("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ism: ism.trim(),
          familiya: familiya.trim(),
          telefon: telefon.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Status 200 bo'lganda token saqlanadi
        if (data.access_token) {
          await AsyncStorage.setItem('token', data.access_token);
        }
        // Home ekraniga o'tiladi
        navigation.navigate('Home');
      } else {
        // Serverdan kelgan xatolik xabari (masalan status 400)
        setErrorMessage(
          data.detail || "Ro'yxatdan o'tishda xatolik yuz berdi"
        );
      }
    } catch (error) {
      // Tarmoq yoki ulanish xatosi
      setErrorMessage("Serverga ulanishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Sarlavha */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Ro'yxatdan o'tish</Text>

          </View>

          {/* Form qismi */}
          <View style={styles.formContainer}>
            {/* Ism Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ism</Text>
              <TextInput
                style={styles.input}
                placeholder="Ismingizni kiriting"
                placeholderTextColor="#94A3B8"
                value={ism}
                onChangeText={setIsm}
              />
            </View>

            {/* Familiya Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Familiya</Text>
              <TextInput
                style={styles.input}
                placeholder="Familiyangizni kiriting"
                placeholderTextColor="#94A3B8"
                value={familiya}
                onChangeText={setFamiliya}
              />
            </View>

            {/* Telefon Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon raqam</Text>
              <TextInput
                style={styles.input}
                placeholder="+998901234567"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={telefon}
                onChangeText={setTelefon}
              />
            </View>

            {/* Xatolik xabari */}
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {/* Ro'yxatdan o'tish tugmasi */}
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
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
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
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    height: 56,
    backgroundColor: '#0284C7',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});