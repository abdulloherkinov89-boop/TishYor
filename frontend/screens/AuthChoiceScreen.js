import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HeartPulse, Building2, UserRound, LogIn } from 'lucide-react-native';

export default function AuthChoiceScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.content}>
        {/* Logo va Belgi qismi */}
        <View style={styles.brandMark}>
          <HeartPulse color="#0083CA" size={38} />
        </View>
        <Text style={styles.title}>TishYor</Text>
        <Text style={styles.subtitle}>Qaysi turdagi hisob yaratmoqchisiz?</Text>

        {/* Tugmalar */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Register', { role: 'patient' })}
          activeOpacity={0.85}
        >
          <UserRound color="#FFFFFF" size={20} />
          <Text style={styles.primaryButtonText}>Bemor bo'yicha ro'yxatdan o'tish</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('ClinicRegister')}
          activeOpacity={0.85}
        >
          <Building2 color="#0083CA" size={20} />
          <Text style={styles.secondaryButtonText}>Klinika bo'yicha ro'yxatdan o'tish</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <LogIn color="#334155" size={18} />
          <Text style={styles.loginButtonText}>Hisobim bor, kirish</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  brandMark: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    marginBottom: 20,
  },
  title: {
    color: '#0F172A',
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 36,
  },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0083CA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: '#0083CA',
    fontSize: 15,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    padding: 10,
  },
  loginButtonText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
});