import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AddDoctorScreen from './screens/doctors/AddDoctorScreen';
import AuthChoiceScreen from './screens/AuthChoiceScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import RegisterScreen from './screens/RegisterScreen';
import ClinicRegister from './screens/ClinicRegister';
import ClinicHome from './components/ClinicHome';
import LoginScreen from './screens/LoginScreen';
import XizmatQoshScreen from './screens/doctors/xizmat_qosh';
import { navigationRef } from './RootNavigation';
import { Text, View } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import { apiFetch, setUnauthorizedHandler } from './utils/api';

const Stack = createNativeStackNavigator();
const DOCTORS_STORAGE_KEY = 'tishyor_clinic_doctors';

// WelcomeScreen va HomeScreen props tipida onLogout yo'q bo'lgani uchun
type LogoutScreenProps = {
  onLogout: () => void | Promise<void>;
  [key: string]: any;
};
const WelcomeScreenWithLogout =
  WelcomeScreen as unknown as React.ComponentType<LogoutScreenProps>;
const HomeScreenWithLogout =
  HomeScreen as unknown as React.ComponentType<LogoutScreenProps>;

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  status: string;
  statusLabel: string;
};

type AuthSession = {
  role: string;
  user: Record<string, unknown>;
};

function isDoctor(value: unknown): value is Doctor {
  if (typeof value !== 'object' || value === null) return false;
  const doctor = value as Partial<Doctor>;
  return (
    typeof doctor.id === 'string' &&
    typeof doctor.name === 'string' &&
    typeof doctor.specialty === 'string'
  );
}

const getCurrentRouteName = () => {
  const currentRoute = navigationRef.getCurrentRoute() as
    | { name?: string }
    | undefined;
  return currentRoute?.name;
};

type AppErrorBoundaryState = { error: Error | null };

class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('APP RENDER ERROR:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' }}>
          <Text style={{ color: '#b91c1c', fontSize: 20, fontWeight: '700', marginBottom: 12 }}>
            Ilovada xatolik yuz berdi
          </Text>
          <Text selectable style={{ color: '#334155', marginBottom: 12 }}>
            {this.state.error.message}
          </Text>
          <Text selectable style={{ color: '#64748b', fontSize: 12 }}>
            {this.state.error.stack}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const doctorsRef = useRef<Doctor[]>([]);
  const doctorsReadyRef = useRef<Promise<void>>(Promise.resolve());

  console.log('APP RENDER role:', authSession?.role ?? 'guest');

  // Login/Register ekranlari faqat shuni chaqirishi kerak.
  // Ekranga o'tishni navigator o'zi qiladi (navigation.navigate/replace KERAK EMAS).
  const handleAuthenticated = (session: AuthSession) => {
    console.log('AUTH: session received by App:', session?.role);
    setAuthSession(session);
  };

  const handleLoggedOut = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user', 'role']);
    } catch (e) {
      console.warn('Logout xatosi:', e);
    }
    setAuthSession(null);
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthSession(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let isActive = true;

    const restoreSession = async () => {
      try {
        const [token, storedUser, storedRole] = await AsyncStorage.multiGet([
          'token',
          'user',
          'role',
        ]);

        const userJson = storedUser[1];
        const role = storedRole[1];

        if (!token[1] || !userJson || (role !== 'patient' && role !== 'clinic')) {
          await AsyncStorage.multiRemove(['token', 'user', 'role']);
          if (isActive) setAuthSession(null);
          return;
        }

        const parsedUser: unknown = JSON.parse(userJson);
        if (typeof parsedUser !== 'object' || parsedUser === null) {
          await AsyncStorage.multiRemove(['token', 'user', 'role']);
          if (isActive) setAuthSession(null);
          return;
        }

        const user = parsedUser as Record<string, unknown>;
        if (isActive) {
          setAuthSession({ role, user: { ...user, role } });
        }

        // Tokenni fon rejimida backend bilan tekshirish
        try {
          const meRes = await apiFetch('/auth/me');
          if (!isActive) return;
          if (meRes.ok) {
            const freshUser = (await meRes.json()) as Record<string, unknown>;
            const freshRole = freshUser?.role === 'clinic' ? 'clinic' : 'patient';
            await AsyncStorage.multiSet([
              ['user', JSON.stringify({ ...freshUser, role: freshRole })],
              ['role', freshRole],
            ]);
            if (isActive) {
              setAuthSession({ role: freshRole, user: { ...freshUser, role: freshRole } });
            }
          } else if (meRes.status === 401 || meRes.status === 404) {
            await AsyncStorage.multiRemove(['token', 'user', 'role']);
            if (isActive) setAuthSession(null);
          }
        } catch {
          // Tarmoq vaqtincha mavjud bo'lmaganda keshdagi sessiyani saqlab qolamiz
        }
      } catch (error) {
        console.warn('Saqlangan sessiyani tiklab bo‘lmadi:', error);
        await AsyncStorage.multiRemove(['token', 'user', 'role']);
        if (isActive) setAuthSession(null);
      } finally {
        if (isActive) setIsHydrating(false);
      }
    };

    restoreSession();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    doctorsReadyRef.current = AsyncStorage.getItem(DOCTORS_STORAGE_KEY)
      .then((storedDoctors) => {
        if (!storedDoctors) return;
        const parsed: unknown = JSON.parse(storedDoctors);
        if (!Array.isArray(parsed)) return;

        const savedDoctors = parsed.filter(isDoctor);
        if (isActive) {
          doctorsRef.current = savedDoctors;
          setDoctors(savedDoctors);
        }
      })
      .catch((error) => console.warn('Shifokorlar ro‘yxatini yuklab bo‘lmadi:', error));

    return () => {
      isActive = false;
    };
  }, []);

  const handleAddDoctor = async (doctor: Doctor) => {
    await doctorsReadyRef.current;
    const updatedDoctors = [...doctorsRef.current, doctor];
    await AsyncStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(updatedDoctors));
    doctorsRef.current = updatedDoctors;
    setDoctors(updatedDoctors);
  };

  if (isHydrating) {
    return (
      <AppErrorBoundary>
        <SafeAreaProvider>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
            <Text style={{ color: '#64748B', fontSize: 16 }}>Yuklanmoqda...</Text>
          </View>
        </SafeAreaProvider>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            console.log('ROOT NAVIGATION: ready, route:', getCurrentRouteName());
          }}
          onStateChange={() => {
            console.log('ROOT NAVIGATION: active route:', getCurrentRouteName());
          }}
        >
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!authSession ? (
              // Kirmagan foydalanuvchi: birinchi ekran AuthChoice
              <Stack.Group navigationKey="auth">
                <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />
                <Stack.Screen name="Register">
                  {(props) => (
                    <RegisterScreen {...props} onAuthenticated={handleAuthenticated} />
                  )}
                </Stack.Screen>
                <Stack.Screen name="ClinicRegister">
                  {(props) => (
                    <ClinicRegister {...props} onAuthenticated={handleAuthenticated} />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Login">
                  {(props) => (
                    <LoginScreen {...props} onAuthenticated={handleAuthenticated} />
                  )}
                </Stack.Screen>
              </Stack.Group>
            ) : authSession.role === 'clinic' ? (
              // Klinika: birinchi ekran ClinicHome
              <Stack.Group navigationKey="clinic">
                <Stack.Screen name="ClinicHome">
                  {(props) => (
                    <ClinicHome {...props} onLogout={handleLoggedOut} />
                  )}
                </Stack.Screen>
                <Stack.Screen
                  name="XizmatQosh"
                  component={XizmatQoshScreen}
                  options={{ presentation: 'transparentModal', animation: 'fade' }}
                />
                <Stack.Screen name="AddDoctor">
                  {({ navigation }) => (
                    <AddDoctorScreen
                      visible
                      navigation={navigation}
                      onClose={() => navigation.goBack()}
                      onAddDoctor={handleAddDoctor}
                    />
                  )}
                </Stack.Screen>
              </Stack.Group>
            ) : (
              // Bemor: birinchi ekran Welcome
              <Stack.Group navigationKey="patient">
                <Stack.Screen name="Welcome">
                  {(props) => (
                    <WelcomeScreenWithLogout {...props} onLogout={handleLoggedOut} />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Home">
                  {(props) => (
                    <HomeScreenWithLogout {...props} onLogout={handleLoggedOut} />
                  )}
                </Stack.Screen>
              </Stack.Group>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}