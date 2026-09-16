import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const WelcomeScreen = () => {
  const navigation = useNavigation();

  // Bemor bo'lib ro'yxatdan o'tish tugmasi bosilganda
  const handlePatientRegister = () => {
    navigation.navigate('Register');
  };

  // Klinika bo'lib ro'yxatdan o'tish tugmasi bosilganda
  const handleClinicRegister = () => {
    Alert.alert('Tez orada', 'Bu funksiya hali ishlab chiqilmoqda');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Ekran markazidagi Sarlavha / Logotip */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>TishYor</Text>
        <Text style={styles.subtitle}>
          Sogʻlom tabassum sari birinchi qadam
        </Text>
      </View>

      {/* Tugmalar konteyneri */}
      <View style={styles.buttonContainer}>
        {/* Asosiy (Bemor) tugmasi */}
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handlePatientRegister}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            Bemor bo'lib ro'yxatdan o'tish
          </Text>
        </TouchableOpacity>

        {/* Konturli (Klinika) tugmasi */}
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleClinicRegister}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>
            Klinika bo'lib ro'yxatdan o'tish
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#0284C7', // Tibbiyot va tish davolash uchun mos ko'k rang
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16, // Ustma-ust tugmalar orasidagi masofa
    marginBottom: 20,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2, // Android soyasi
    shadowColor: '#000', // iOS soyasi
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#0284C7',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0284C7',
  },
  secondaryButtonText: {
    color: '#0284C7',
    fontSize: 16,
    fontWeight: '700',
  },
});