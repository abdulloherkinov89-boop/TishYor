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
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.content}>
        <View style={styles.brandMark}>
          <HeartPulse color="#0284C7" size={34} />
        </View>
        <Text style={styles.title}>TishYor</Text>
        <Text style={styles.subtitle}>Qaysi turdagi hisob yaratmoqchisiz?</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Register', { role: 'patient' })}
          activeOpacity={0.85}
        >
          <UserRound color="#FFFFFF" size={22} />
          <Text style={styles.primaryButtonText}>Bemor bo'yicha ro'yxatdan o'tish</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Register', { role: 'clinic' })}
          activeOpacity={0.85}
        >
          <Building2 color="#0284C7" size={22} />
          <Text style={styles.secondaryButtonText}>Klinika bo'yicha ro'yxatdan o'tish</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <LogIn color="#475569" size={20} />
          <Text style={styles.loginButtonText}>Hisobim bor, kirish</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandMark: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E0F2FE',
    marginBottom: 18,
  },
  title: {
    color: '#0F172A',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 34,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#7DD3FC',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  secondaryButtonText: {
    color: '#0369A1',
    fontSize: 15,
    fontWeight: '700',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    padding: 12,
  },
  loginButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
});
