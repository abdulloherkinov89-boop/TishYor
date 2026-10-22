import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertCircle,
  Briefcase,
  Building2,
  CalendarCheck,
  ChevronRight,
  Clock,
  Home,
  LogOut,
  MapPin,
  MessageSquareText,
  Phone,
  Settings,
  Star,
  Stethoscope,
  UserPlus,
  Users,
  Bell,
  Grid,
  Sparkles,
  Activity,
  Heart,
} from 'lucide-react-native';
import ClinicDetailModal from './ClinicDetailModal';
import DoctorsModal from './DoctorsModal';
import { apiFetch } from '../utils/api';

const COLORS = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  ink: '#0F172A',
  muted: '#64748B',
  primary: '#0F172A',
  primaryLight: '#F1F5F9',
  accent: '#0284C7',
  accentDark: '#0369A1',
  line: '#E2E8F0',
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  white: '#FFFFFF',
};

function getStatusInfo(status) {
  if (status === 'approved') return { label: 'Tasdiqlangan', type: 'approved' };
  if (status === 'rejected') return { label: 'Rad etilgan', type: 'rejected' };
  return { label: 'Tekshiruvda', type: 'pending' };
}

function StatusBadge({ status }) {
  const info = getStatusInfo(status);
  const badgeStyle =
    info.type === 'approved'
      ? styles.approvedBadge
      : info.type === 'rejected'
      ? styles.rejectedBadge
      : styles.pendingBadge;
  const textStyle =
    info.type === 'approved'
      ? styles.approvedText
      : info.type === 'rejected'
      ? styles.rejectedText
      : styles.pendingText;

  return (
    <View style={[styles.statusBadge, badgeStyle]}>
      <View style={[styles.statusDot, textStyle]} />
      <Text style={[styles.statusText, textStyle]}>{info.label}</Text>
    </View>
  );
}

export default function ClinicHome({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isWide = width >= 760;
  const contentMaxWidth = isWide ? 1180 : 680;

  const [clinic, setClinic] = useState(route?.params?.clinic || null);
  const [loading, setLoading] = useState(!route?.params?.clinic);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [doctorsVisible, setDoctorsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // --- HEADER ANIMATSIYALARI ---
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Sekin suzib yuruvchi sharik/pufakcha animatsiyasi
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: -12,
          duration: 2500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Ikkinchi obyekt uchun teskari yo'nalishli animatsiya
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 10,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Pulsatsiyalanuvchi nurlar (Yurak urishi kabi)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Aynaluvchi porlash belgisi
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Klinika ma'lumotlarini olish
  const fetchClinicData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const savedClinic = JSON.parse(storedUser);
        if (savedClinic) {
          setClinic((current) => ({ ...savedClinic, ...current }));
        }
      }

      const response = await apiFetch('/clinics/me');
      if (response?.ok) {
        const data = await response.json();
        setClinic(data);
        await AsyncStorage.setItem('user', JSON.stringify(data));
      }
    } catch (error) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClinicData();
  }, [fetchClinicData]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user', 'role']);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert('Xatolik', 'Hisobdan chiqishda muammo yuz berdi.');
    }
  };

  const openPhone = async () => {
    const phone = clinic?.telefon?.replace(/[^+\d]/g, '');
    if (!phone)
      return Alert.alert(
        "Telefon raqami yo'q",
        'Klinika telefon raqami kiritilmagan.'
      );
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch (e) {
      Alert.alert('Xatolik', "Ochib bo'lmadi.");
    }
  };

  const openMap = async () => {
    const query =
      clinic?.latitude != null && clinic?.longitude != null
        ? `${clinic.latitude},${clinic.longitude}`
        : clinic?.address;
    if (!query)
      return Alert.alert("Manzil yo'q", 'Klinika manzili kiritilmagan.');
    try {
      await Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          query
        )}`
      );
    } catch (e) {
      Alert.alert('Xatolik', "Xaritani ochib bo'lmadi.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="small" color={COLORS.accent} />
        <Text style={styles.loadingText}>
          Klinika ma'lumotlari yuklanmoqda...
        </Text>
      </View>
    );
  }

  const clinicName =
    clinic?.name || clinic?.clinic_name || 'Klinika nomi ko‘rsatilmagan';
  const status = clinic?.status || 'pending';
  const rating = clinic?.rating || 'Yangi';
  const patientCount = Number(clinic?.patients_served || 0).toLocaleString(
    'uz-UZ'
  );
  const todayAppointments = clinic?.today_appointments ?? '—';
  const doctorsCount = clinic?.doctors_count ?? '—';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.accentDark} />

      {/* --- KATTALASHTIRILGAN VA ANIMATSIONALI HEADER NAVBAR --- */}
      <LinearGradient
        colors={[COLORS.accent, COLORS.accentDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.headerNavbar,
          { paddingTop: Math.max(insets.top, 10) + 12 },
        ]}
      >
        {/* ANIMATSION BEZAKLAR (Faqat tish emas, har xil tibbiy/davolash elementlari) */}
        <Animated.View
          style={[
            styles.decorBubble1,
            { transform: [{ translateY: floatAnim1 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.decorBubble2,
            { transform: [{ translateY: floatAnim2 }] },
          ]}
        />

        {/* Pulsatsiyalanuvchi yurak/puls ikonkasi */}
        <Animated.View
          style={[
            styles.decorIconPulse,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Activity size={24} color="rgba(255,255,255,0.25)" />
        </Animated.View>

        {/* Aylanuvchi yorqinlik/tish tozaligi belgisi */}
        <Animated.View
          style={[
            styles.decorIconSpin,
            { transform: [{ rotate: spin }] },
          ]}
        >
          <Sparkles size={28} color="rgba(255,255,255,0.2)" />
        </Animated.View>

        {/* HEADER ICHKI TARKIBI */}
        <View style={[styles.headerNavbarInner, { maxWidth: contentMaxWidth }]}>
          <Pressable
            onPress={() => setDetailsVisible(true)}
            style={styles.brandRow}
          >
            <View style={styles.logoFrame}>
              {clinic?.logo_url ? (
                <Image
                  source={{ uri: clinic.logo_url }}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              ) : (
                <Building2 size={24} color={COLORS.accent} strokeWidth={2.2} />
              )}
            </View>

            <View style={styles.brandCopy}>
              <Text style={styles.headerSubtitleLabel}>
                STOMATOLOGIYA BOSHQARUVI
              </Text>
              <Text style={styles.clinicName} numberOfLines={1}>
                {clinicName}
              </Text>
              <StatusBadge status={status} />
            </View>
          </Pressable>

          <View style={styles.headerRightActions}>
            <Pressable
              onPress={() =>
                Alert.alert('Bildirishnomalar', 'Yangi bildirishnomalar yo‘q.')
              }
              style={styles.navIconButton}
            >
              <Bell size={18} color={COLORS.white} />
            </Pressable>
            <Pressable onPress={handleLogout} style={styles.navIconButton}>
              <LogOut size={18} color="#FF9999" />
            </Pressable>
          </View>
        </View>

        {/* Header tubidagi qo'shimcha statistik tasbor */}
        <View style={styles.headerBottomBar}>
          <View style={styles.headerBottomItem}>
            <Heart size={13} color="#FFFFFF" />
            <Text style={styles.headerBottomText}>Tish Parvarishi</Text>
          </View>
          <View style={styles.headerBottomDot} />
          <View style={styles.headerBottomItem}>
            <Sparkles size={13} color="#FFFFFF" />
            <Text style={styles.headerBottomText}>Professional Xizmat</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ASOSIY SCROLL TARKIBI */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: contentMaxWidth,
            paddingBottom: Math.max(insets.bottom, 24) + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchClinicData(true)}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* ESLATMA */}
        {(status === 'pending' || status === 'rejected') && (
          <View
            style={[
              styles.noticeCard,
              status === 'rejected' && styles.noticeRejected,
            ]}
          >
            <AlertCircle
              size={20}
              color={status === 'rejected' ? COLORS.danger : COLORS.warning}
            />
            <View style={styles.noticeCopy}>
              <Text
                style={[
                  styles.noticeTitle,
                  status === 'rejected' && styles.noticeRejectedTitle,
                ]}
              >
                {status === 'rejected'
                  ? 'Ariza tasdiqlanmadi'
                  : "Ro'yxatdan o'tish tekshiruvda"}
              </Text>
              <Text style={styles.noticeText}>
                {status === 'rejected'
                  ? 'Profil holatini aniqlashtirish uchun yordam xizmatiga murojaat qiling.'
                  : 'Tasdiqlash yakunlangach, klinika profilingiz to‘liq ishlaydi.'}
              </Text>
            </View>
          </View>
        )}

        {/* STATISTIKA */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Ko'rsatkichlar</Text>
          <View style={styles.metricsGrid}>
            <View
              style={[
                styles.metricCard,
                { width: isWide ? '23.5%' : '48%' },
              ]}
            >
              <View style={styles.metricIconBox}>
                <Users size={18} color={COLORS.accent} />
              </View>
              <Text style={styles.metricValue}>{patientCount}</Text>
              <Text style={styles.metricLabel}>Bemorlar</Text>
            </View>
            <View
              style={[
                styles.metricCard,
                { width: isWide ? '23.5%' : '48%' },
              ]}
            >
              <View style={styles.metricIconBox}>
                <Star size={18} color={COLORS.accent} />
              </View>
              <Text style={styles.metricValue}>{rating}</Text>
              <Text style={styles.metricLabel}>Reyting</Text>
            </View>
            <View
              style={[
                styles.metricCard,
                { width: isWide ? '23.5%' : '48%' },
              ]}
            >
              <View style={styles.metricIconBox}>
                <CalendarCheck size={18} color={COLORS.accent} />
              </View>
              <Text style={styles.metricValue}>{todayAppointments}</Text>
              <Text style={styles.metricLabel}>Qabullar</Text>
            </View>
            <View
              style={[
                styles.metricCard,
                { width: isWide ? '23.5%' : '48%' },
              ]}
            >
              <View style={styles.metricIconBox}>
                <Stethoscope size={18} color={COLORS.accent} />
              </View>
              <Text style={styles.metricValue}>{doctorsCount}</Text>
              <Text style={styles.metricLabel}>Shifokorlar</Text>
            </View>
          </View>
        </View>

        {/* QO'SHISH TUGMASI */}
        <View style={styles.sectionBlock}>
          <Pressable
            onPress={() => navigation.navigate('AddDoctor')}
            style={styles.primaryButton}
          >
            <View style={styles.primaryIconBox}>
              <UserPlus size={20} color={COLORS.white} strokeWidth={2.2} />
            </View>
            <View style={styles.primaryButtonCopy}>
              <Text style={styles.primaryButtonTitle}>Shifokor qo'shish</Text>
              <Text style={styles.primaryButtonSubtitle}>
                Yangi mutaxassisni jamoaga qo'shing
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.white} />
          </Pressable>
        </View>

        {/* ALOQA BO'LIMI */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Aloqa va manzil</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            <Pressable onPress={openPhone} style={styles.horizontalActionCard}>
              <View style={styles.horizontalActionTop}>
                <View style={styles.horizontalActionIcon}>
                  <Phone size={18} color={COLORS.accent} />
                </View>
                <ChevronRight size={16} color={COLORS.muted} />
              </View>
              <Text style={styles.horizontalActionTitle}>Qo'ng'iroq</Text>
              <Text style={styles.horizontalActionSubtitle}>
                {clinic?.telefon || 'Kiritilmagan'}
              </Text>
            </Pressable>

            <Pressable onPress={openMap} style={styles.horizontalActionCard}>
              <View style={styles.horizontalActionTop}>
                <View style={styles.horizontalActionIcon}>
                  <MapPin size={18} color={COLORS.accent} />
                </View>
                <ChevronRight size={16} color={COLORS.muted} />
              </View>
              <Text style={styles.horizontalActionTitle}>Manzil</Text>
              <Text style={styles.horizontalActionSubtitle}>
                {clinic?.address || 'Kiritilmagan'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* ASOSIY BO'LIMLAR */}
        <View
          style={[styles.sectionBlock, isWide && styles.featuredGridWide]}
        >
          <Pressable
            onPress={() => navigation.navigate('XizmatQosh')}
            style={[styles.featuredCard, { width: isWide ? '49%' : '100%' }]}
          >
            <View style={styles.featuredIconContainer}>
              <Briefcase size={20} color={COLORS.accent} />
            </View>
            <View style={styles.featuredCopy}>
              <Text style={styles.featuredTitle}>Xizmatlar va narxlar</Text>
              <Text style={styles.featuredSubtitle}>
                Klinika xizmatlarini boshqarish
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.muted} />
          </Pressable>

          <Pressable
            onPress={() => setDoctorsVisible(true)}
            style={[styles.featuredCard, { width: isWide ? '49%' : '100%' }]}
          >
            <View style={styles.featuredIconContainer}>
              <Stethoscope size={20} color={COLORS.accent} />
            </View>
            <View style={styles.featuredCopy}>
              <Text style={styles.featuredTitle}>Shifokorlar jamoasi</Text>
              <Text style={styles.featuredSubtitle}>
                Mutaxassislar ro'yxatini ko'rish
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.muted} />
          </Pressable>
        </View>
      </ScrollView>

      {/* BOTTOM NAVBAR */}
      <View
        style={[
          styles.bottomNavbar,
          { paddingBottom: Math.max(insets.bottom, 10) },
        ]}
      >
        <Pressable
          onPress={() => setActiveTab('home')}
          style={styles.bottomNavItem}
        >
          <Home
            size={20}
            color={activeTab === 'home' ? COLORS.accent : COLORS.muted}
          />
          <Text
            style={[
              styles.bottomNavText,
              activeTab === 'home' && styles.bottomNavTextActive,
            ]}
          >
            Asosiy
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setActiveTab('doctors');
            setDoctorsVisible(true);
          }}
          style={styles.bottomNavItem}
        >
          <Stethoscope
            size={20}
            color={activeTab === 'doctors' ? COLORS.accent : COLORS.muted}
          />
          <Text
            style={[
              styles.bottomNavText,
              activeTab === 'doctors' && styles.bottomNavTextActive,
            ]}
          >
            Shifokorlar
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setActiveTab('services');
            navigation.navigate('XizmatQosh');
          }}
          style={styles.bottomNavItem}
        >
          <Grid
            size={20}
            color={activeTab === 'services' ? COLORS.accent : COLORS.muted}
          />
          <Text
            style={[
              styles.bottomNavText,
              activeTab === 'services' && styles.bottomNavTextActive,
            ]}
          >
            Xizmatlar
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setActiveTab('profile');
            setDetailsVisible(true);
          }}
          style={styles.bottomNavItem}
        >
          <Settings
            size={20}
            color={activeTab === 'profile' ? COLORS.accent : COLORS.muted}
          />
          <Text
            style={[
              styles.bottomNavText,
              activeTab === 'profile' && styles.bottomNavTextActive,
            ]}
          >
            Profil
          </Text>
        </Pressable>
      </View>

      <ClinicDetailModal
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        clinic={clinic}
      />
      <DoctorsModal
        visible={doctorsVisible}
        onClose={() => setDoctorsVisible(false)}
        onAddDoctor={() => {
          setDoctorsVisible(false);
          navigation.navigate('AddDoctor');
        }}
        clinic={clinic}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: { marginTop: 8, color: COLORS.muted, fontSize: 13, fontWeight: '500' },

  // --- KATTALASHTIRILGAN HEADER STYLES ---
  headerNavbar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  decorBubble1: {
    position: 'absolute',
    top: -20,
    right: -10,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  decorBubble2: {
    position: 'absolute',
    bottom: -15,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorIconPulse: {
    position: 'absolute',
    top: 35,
    right: 80,
  },
  decorIconSpin: {
    position: 'absolute',
    bottom: 20,
    right: 35,
  },
  headerNavbarInner: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  logoFrame: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: { width: '100%', height: '100%' },
  brandCopy: { flex: 1, marginLeft: 12 },
  headerSubtitleLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  clinicName: { color: COLORS.white, fontSize: 17, fontWeight: '800', marginBottom: 4 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  headerBottomItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerBottomText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' },
  headerBottomDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 10,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  approvedBadge: { backgroundColor: 'rgba(255,255,255,0.22)' },
  pendingBadge: { backgroundColor: 'rgba(255,243,199,0.3)' },
  rejectedBadge: { backgroundColor: 'rgba(255,226,226,0.3)' },
  statusDot: { width: 5, height: 5, borderRadius: 2.5, marginRight: 4 },
  statusText: { fontSize: 9, fontWeight: '700' },
  approvedText: { color: COLORS.white },
  pendingText: { color: '#FEF3C7' },
  rejectedText: { color: '#FEE2E2' },

  scrollView: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: 16, paddingTop: 16 },

  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    backgroundColor: COLORS.warningBg,
    borderColor: '#FEF3C7',
  },
  noticeRejected: { backgroundColor: COLORS.dangerBg, borderColor: '#FEE2E2' },
  noticeCopy: { flex: 1, marginLeft: 10 },
  noticeTitle: { color: '#B45309', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  noticeRejectedTitle: { color: COLORS.danger },
  noticeText: { color: '#78350F', fontSize: 11, lineHeight: 15 },

  sectionBlock: { marginBottom: 16 },
  sectionTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '700', marginBottom: 10 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 12,
    marginBottom: 10,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: { color: COLORS.ink, fontSize: 18, fontWeight: '700' },
  metricLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '500', marginTop: 1 },

  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  primaryButtonCopy: { flex: 1 },
  primaryButtonTitle: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  primaryButtonSubtitle: { color: '#94A3B8', fontSize: 10, marginTop: 1 },

  horizontalScrollContent: { paddingBottom: 4 },
  horizontalActionCard: {
    width: 150,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 12,
    marginRight: 10,
  },
  horizontalActionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  horizontalActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalActionTitle: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },
  horizontalActionSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 2 },

  featuredGridWide: { flexDirection: 'row', justifyContent: 'space-between' },
  featuredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  featuredIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featuredCopy: { flex: 1 },
  featuredTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '700' },
  featuredSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 1 },

  bottomNavbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
  },
  bottomNavItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  bottomNavText: { color: COLORS.muted, fontSize: 10, fontWeight: '600', marginTop: 4 },
  bottomNavTextActive: { color: COLORS.accent, fontWeight: '700' },
});