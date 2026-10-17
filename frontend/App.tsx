import React from 'react';
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

const getCurrentRouteName = () => {
  const currentRoute = navigationRef.getCurrentRoute() as
    | { name?: string }
    | undefined;
  return currentRoute?.name;
};

export default function App() {
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
          <Stack.Screen name="ClinicHome" component={ClinicHome} />
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
                onAddDoctor={() => {}}
                clinic={undefined}
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