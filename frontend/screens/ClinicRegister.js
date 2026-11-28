import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Building2,
  Phone,
  MapPin,
  Users,
  Image as ImageIcon,
  Check,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import { apiFetch } from '../utils/api';
import {
  PHONE_PREFIX,
  formatUzPhone,
  isValidUzPhone,
  parseApiError,
  toApiUzPhone,
} from '../utils/phone';

export default function ClinicRegister({ navigation, onAuthenticated }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const isSubmitting = useRef(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: PHONE_PREFIX,
    addressMode: 'manual',
    address: '',
    patientsServed: '',
    logoUri: null,
    logoFile: null,
    logoName: null,
    logoType: null,
    latitude: null,
    longitude: null,
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [focusedInput, setFocusedInput] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentStep === 1) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [currentStep, pulseAnim]);

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: focusedInput ? 1.01 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [focusedInput, scaleAnim]);

  const isStepValid = (step = currentStep) => {
    switch (step) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return isValidUzPhone(formData.phone);
      case 3:
        return formData.address.trim().length > 0;
      case 4:
        return /^\d+$/.test(formData.patientsServed.trim());
      case 5:
        return true;
      default:
        return false;
    }
  };

  useEffect(() => {
    Animated.timing(checkFadeAnim, {
      toValue: isStepValid() ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [formData, currentStep]);

  const handlePhoneChange = (text) => {
    setFormData((prev) => ({ ...prev, phone: formatUzPhone(text) }));
    if (errorMessage) setErrorMessage('');
  };

  const handleGetLocation = async () => {
    setIsLocating(true);
    setErrorMessage('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Joylashuvni aniqlash uchun ruxsat berilmadi.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;

      setFormData((prev) => ({
        ...prev,
        latitude,
        longitude,
      }));

      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (geocode && geocode.length > 0) {
          const item = geocode[0];
          const fullAddress = [
            item.city || item.region,
            [item.street, item.name].filter(Boolean).join(' '),
          ]
            .filter(Boolean)
            .join(', ')
            .trim();
          if (fullAddress) {
            setFormData((prev) => ({ ...prev, address: fullAddress }));
            return;
          }
        }
      } catch {
        // Web yoki geocoder xizmati ishlamagan holatda koordinatalar saqlanadi
      }

      setFormData((prev) => ({
        ...prev,
        address:
          prev.address.trim() ||
          `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      }));
    } catch {
      setErrorMessage("Joylashuvni aniqlab bo'lmadi. Manzilni qo'lda kiriting.");
    } finally {
      setIsLocating(false);
    }
  };

  const handlePickImage = async () => {
    setErrorMessage('');
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setErrorMessage('Galereyaga kirish uchun ruxsat bering.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setFormData((prev) => ({
        ...prev,
        logoUri: asset.uri,
        logoFile: asset.file || null,
        logoName: asset.fileName || null,
        logoType: asset.mimeType || null,
      }));
    }
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const animateStepTransition = (nextStep, direction = 'next') => {
    const toValue = direction === 'next' ? -30 : 30;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep(nextStep);
      slideAnim.setValue(direction === 'next' ? 30 : -30);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const getStepErrorMessage = (step) => {
    switch (step) {
      case 1:
        return 'Iltimos, klinika nomini kiriting';
      case 2:
        return "Iltimos, telefon raqamni to'liq kiriting";
      case 3:
        return 'Iltimos, klinika manzilini kiriting';
      case 4:
        return 'Iltimos, xizmat ko‘rsatilgan bemorlar sonini kiriting';
      default:
        return "Iltimos, maydonni to'g'ri to'ldiring";
    }
  };

  const handleNext = () => {
    setErrorMessage('');
    if (!isStepValid()) {
      triggerShake();
      setErrorMessage(getStepErrorMessage(currentStep));
      return;
    }

    if (currentStep < 5) {
      animateStepTransition(currentStep + 1, 'next');
    }
  };

  const handleBack = () => {
    setErrorMessage('');
    if (currentStep > 1) {
      animateStepTransition(currentStep - 1, 'back');
    } else if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  const uploadLogoIfNeeded = async () => {
    if (!formData.logoUri) return null;

    const logoForm = new FormData();
    const extension = (formData.logoName || formData.logoUri)
      .split('.')
      .pop()
      ?.split(/[?#]/)[0]
      ?.toLowerCase();
    const imageType =
      formData.logoType ||
      (extension === 'png'
        ? 'image/png'
        : extension === 'webp'
          ? 'image/webp'
          : 'image/jpeg');
    const fileName = formData.logoName || `clinic-logo.${extension || 'jpg'}`;

    if (Platform.OS === 'web') {
      if (formData.logoFile) {
        logoForm.append('file', formData.logoFile, fileName);
      } else {
        const blob = await (await fetch(formData.logoUri)).blob();
        logoForm.append('file', blob, fileName);
      }
    } else {
      logoForm.append('file', {
        uri: formData.logoUri,
        name: fileName,
        type: imageType,
      });
    }

    const uploadResponse = await apiFetch('/clinics/upload-logo', {
      method: 'POST',
      body: logoForm,
    });
    const uploadData = await uploadResponse.json().catch(() => ({}));
    if (!uploadResponse.ok) {
      throw new Error(
        parseApiError(uploadData.detail, "Logotipni yuklab bo'lmadi"),
      );
    }
    return uploadData.logo_url;
  };

  const handleSubmit = async () => {
    if (isSubmitting.current) return;

    const cleanPhone = toApiUzPhone(formData.phone);
    if (!formData.name.trim() || !cleanPhone || !formData.address.trim() || !/^\d+$/.test(formData.patientsServed.trim())) {
      setErrorMessage("Iltimos, barcha majburiy maydonlarni to'g'ri to'ldiring");
      return;
    }

    isSubmitting.current = true;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const logoUrl = await uploadLogoIfNeeded();
      const patientsCount = Number.parseInt(formData.patientsServed.trim(), 10);

      const payload = {
        name: formData.name.trim(),
        telefon: cleanPhone,
        address: formData.address.trim(),
        patients_served: patientsCount,
        description: `${patientsCount} ta bemorga xizmat ko'rsatgan`,
        logo_url: logoUrl,
        license_number: '',
      };
      if (formData.latitude != null && formData.longitude != null) {
        payload.latitude = formData.latitude;
        payload.longitude = formData.longitude;
      }

      const response = await apiFetch('/clinics/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          parseApiError(responseData.detail, "Ro'yxatdan o'tishda xatolik yuz berdi"),
        );
      }

      if (!responseData.access_token || !responseData.clinic) {
        throw new Error("Klinika saqlandi, lekin server kirish ma'lumotlarini qaytarmadi.");
      }

      const role = responseData.role || 'clinic';
      const clinicUser = {
        ...responseData.clinic,
        address: responseData.clinic.address || payload.address,
        telefon: responseData.clinic.telefon || payload.telefon,
        patients_served: responseData.clinic.patients_served ?? payload.patients_served,
        description: payload.description,
        logo_url: responseData.clinic.logo_url ?? payload.logo_url,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        role,
      };
      await AsyncStorage.multiSet([
        ['token', responseData.access_token],
        ['user', JSON.stringify(clinicUser)],
        ['role', role],
      ]);
      onAuthenticated?.({ role, user: clinicUser });
    } catch (error) {
      setErrorMessage(
        parseApiError(error?.message, "Server bilan aloqa bog'lanmadi. Qayta urinib ko'ring."),
      );
    } finally {
      isSubmitting.current = false;
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Animated.View style={[styles.iconCircle, { transform: [{ scale: pulseAnim }] }]}>
              <Building2 color="#0083CA" size={38} />
            </Animated.View>
            <Text style={styles.stepTitle}>Klinika nomi</Text>
            <Text style={styles.stepSubtitle}>Klinikangizning rasmiy nomini kiriting</Text>

            <Animated.View
              style={[
                styles.inputWrapper,
                { transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] },
                focusedInput && styles.inputFocused,
                errorMessage ? styles.inputError : null,
              ]}
            >
              <TextInput
                style={styles.textInput}
                placeholder="Masalan: Stomatologiya Servis"
                placeholderTextColor="#94A3B8"
                value={formData.name}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, name: text }));
                  if (errorMessage) setErrorMessage('');
                }}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                onSubmitEditing={handleNext}
              />
              <Animated.View style={{ opacity: checkFadeAnim }}>
                <Check color="#10B981" size={20} />
              </Animated.View>
            </Animated.View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <Phone color="#0083CA" size={38} />
            </View>
            <Text style={styles.stepTitle}>Telefon raqami</Text>
            <Text style={styles.stepSubtitle}>Klinika bilan bog'lanish uchun telefon raqam</Text>

            <Animated.View
              style={[
                styles.inputWrapper,
                { transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] },
                focusedInput && styles.inputFocused,
                errorMessage ? styles.inputError : null,
              ]}
            >
              <TextInput
                style={styles.textInput}
                placeholder="+998 90 123 45 67"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={handlePhoneChange}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                onSubmitEditing={handleNext}
                maxLength={17}
              />
              <Animated.View style={{ opacity: checkFadeAnim }}>
                <Check color="#10B981" size={20} />
              </Animated.View>
            </Animated.View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <MapPin color="#0083CA" size={38} />
            </View>
            <Text style={styles.stepTitle}>Klinika manzili</Text>
            <Text style={styles.stepSubtitle}>Joylashuvni tanlang yoki qo'lda kiriting</Text>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, formData.addressMode === 'manual' && styles.tabActive]}
                onPress={() => setFormData((prev) => ({ ...prev, addressMode: 'manual' }))}
              >
                <Text style={[styles.tabText, formData.addressMode === 'manual' && styles.tabTextActive]}>
                  Qo'lda kiritish
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, formData.addressMode === 'gps' && styles.tabActive]}
                onPress={() => setFormData((prev) => ({ ...prev, addressMode: 'gps' }))}
              >
                <Text style={[styles.tabText, formData.addressMode === 'gps' && styles.tabTextActive]}>
                  GPS orqali aniqlash
                </Text>
              </TouchableOpacity>
            </View>

            {formData.addressMode === 'gps' && (
              <TouchableOpacity
                style={styles.gpsButton}
                onPress={handleGetLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <View style={styles.row}>
                    <ActivityIndicator color="#0083CA" size="small" />
                    <Text style={[styles.gpsButtonText, { marginLeft: 8 }]}>Aniqlanmoqda...</Text>
                  </View>
                ) : (
                  <Text style={styles.gpsButtonText}>Joylashuvni aniqlash</Text>
                )}
              </TouchableOpacity>
            )}

            <Animated.View
              style={[
                styles.inputWrapper,
                { transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] },
                focusedInput && styles.inputFocused,
                errorMessage ? styles.inputError : null,
              ]}
            >
              <TextInput
                style={styles.textInput}
                placeholder="Toshkent sh., Yunusobod t., 4-mavze..."
                placeholderTextColor="#94A3B8"
                value={formData.address}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, address: text }));
                  if (errorMessage) setErrorMessage('');
                }}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                onSubmitEditing={handleNext}
              />
              <Animated.View style={{ opacity: checkFadeAnim }}>
                <Check color="#10B981" size={20} />
              </Animated.View>
            </Animated.View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <Users color="#0083CA" size={38} />
            </View>
            <Text style={styles.stepTitle}>Xizmat ko'rsatilgan bemorlar</Text>
            <Text style={styles.stepSubtitle}>Necha bemorga xizmat ko'rsatgansiz?</Text>

            <Animated.View
              style={[
                styles.inputWrapper,
                { transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] },
                focusedInput && styles.inputFocused,
                errorMessage ? styles.inputError : null,
              ]}
            >
              <TextInput
                style={styles.textInput}
                placeholder="Masalan: 1500"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                value={formData.patientsServed}
                onChangeText={(text) => {
                  const digitsOnly = text.replace(/\D/g, '');
                  setFormData((prev) => ({ ...prev, patientsServed: digitsOnly }));
                  if (errorMessage) setErrorMessage('');
                }}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                onSubmitEditing={handleNext}
              />
              <Animated.View style={{ opacity: checkFadeAnim }}>
                <Check color="#10B981" size={20} />
              </Animated.View>
            </Animated.View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <ImageIcon color="#0083CA" size={38} />
            </View>
            <Text style={styles.stepTitle}>Klinika logotipi</Text>
            <Text style={styles.stepSubtitle}>Logotip yuklash ixtiyoriy</Text>

            <TouchableOpacity style={styles.logoPickerContainer} onPress={handlePickImage}>
              {formData.logoUri ? (
                <View style={styles.logoPreviewWrapper}>
                  <Image source={{ uri: formData.logoUri }} style={styles.logoImage} />
                  <View style={styles.editBadge}>
                    <Edit2 color="#FFF" size={14} />
                  </View>
                </View>
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Plus color="#0083CA" size={32} />
                  <Text style={styles.logoPlaceholderText}>Logo qo'shish</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {navigation?.canGoBack?.() ? (
            <TouchableOpacity
              style={styles.topBackButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <ArrowLeft color="#334155" size={20} />
              <Text style={styles.topBackButtonText}>Bosh sahifa</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.progressContainer}>
            {[1, 2, 3, 4, 5].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressDot,
                  step <= currentStep ? styles.progressActive : styles.progressInactive,
                ]}
              />
            ))}
          </View>

          <Animated.View
            style={[
              styles.cardContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {renderStepContent()}

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </Animated.View>

          <View style={styles.navigationContainer}>
            {currentStep > 1 ? (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <ChevronLeft color="#0083CA" size={20} />
                <Text style={styles.backButtonText}>Orqaga</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {currentStep < 5 ? (
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>Keyingisi</Text>
                <ChevronRight color="#FFFFFF" size={20} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.nextButton, styles.submitButton, isLoading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.nextButtonText}>Ro'yxatdan o'tish</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login', { role: 'clinic' })}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLinkText}>
              Klinika hisobingiz bormi? <Text style={styles.linkHighlight}>Kirish</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  topBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingRight: 12,
    marginBottom: 16,
  },
  topBackButtonText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    width: '100%',
  },
  progressDot: {
    height: 6,
    flex: 1,
    marginHorizontal: 3,
    borderRadius: 3,
  },
  progressActive: {
    backgroundColor: '#0083CA',
  },
  progressInactive: {
    backgroundColor: '#E2E8F0',
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 28,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 26,
    paddingHorizontal: 20,
    height: 52,
    width: '100%',
  },
  inputFocused: {
    borderColor: '#0083CA',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 4,
    marginBottom: 16,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0083CA',
  },
  gpsButton: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 26,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  gpsButtonText: {
    color: '#0083CA',
    fontWeight: '600',
    fontSize: 14,
  },
  logoPickerContainer: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  logoPlaceholderText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  logoPreviewWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0083CA',
    padding: 6,
    borderRadius: 15,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#0083CA',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0083CA',
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 26,
  },
  submitButton: {
    backgroundColor: '#0083CA',
    paddingHorizontal: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
