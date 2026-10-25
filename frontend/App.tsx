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

const Stack = createNativeStackNavigator();
const DOCTORS_STORAGE_KEY = 'tishyor_clinic_doctors';

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  status: string;
  statusLabel: string;
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

export default function App() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const doctorsRef = useRef<Doctor[]>([]);
  const doctorsReadyRef = useRef<Promise<void>>(Promise.resolve());

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

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          console.log('ROOT NAVIGATION: initial route:', getCurrentRouteName());
        }}
        onStateChange={() => {
          console.log('ROOT NAVIGATION: active route:', getCurrentRouteName());
        }}
      >
        <Stack.Navigator
          initialRouteName="AuthChoice"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ClinicRegister" component={ClinicRegister} />
          <Stack.Screen name="ClinicHome">
            {(props) => (
              <ClinicHome {...props} doctors={doctors} />
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
                onClose={() => navigation.goBack()}
                onAddDoctor={handleAddDoctor}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}