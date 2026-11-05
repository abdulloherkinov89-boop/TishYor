import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
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
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  Bell,
  Briefcase,
  Building2,
  CalendarCheck,
  ChevronRight,
  LogOut,
  MapPin,
  Phone,
  Stethoscope,
  User,
  UserPlus,
} from 'lucide-react-native';
import ClinicDetailModal from './ClinicDetailModal';
import DoctorsModal from './DoctorsModal';
import ProfileModal from './ProfileModal';
import { apiFetch } from '../utils/api';

// ---------------------------------------------------------------------------
// Constants & Styling
// ---------------------------------------------------------------------------
const COLORS = {
  background: '#F2F6F8',
  surface: '#FFFFFF',
  ink: '#0C1F2C',
  inkSoft: '#17303F',
  muted: '#5F7280',
  line: '#E1E9EE',
  teal: '#0E7C86',
  tealSoft: '#DDF1EF',
  mint: '#7FD6CC',
  white: '#FFFFFF',
  success: '#0E8F5A',
  successBg: '#E3F5EC',
  warning: '#B4690E',
  warningBg: '#FBEFD5',
  danger: '#C8342B',
  dangerBg: '#FCE7E5',
  skeletonBase: '#D0E3E7',
  skeletonHighlight: '#E8F3F5',
};

const TONES = {
  teal: { bg: '#DDF1EF', fg: '#0E7C86' },
  indigo: { bg: '#E4E8FB', fg: '#4452C8' },
  amber: { bg: '#FBEFD5', fg: '#B4690E' },
  rose: { bg: '#FBE4EA', fg: '#B8325A' },
};

const WEEKDAYS = [
  'Yakshanba',
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
];
const MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
];

function formatToday() {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function getStatusInfo(status) {
  if (status === 'approved')
    return {
      label: 'Tasdiqlangan',
      color: COLORS.success,
      bg: COLORS.successBg,
    };
  if (status === 'rejected')
    return { label: 'Rad etilgan', color: COLORS.danger, bg: COLORS.dangerBg };
  return { label: 'Tekshiruvda', color: COLORS.warning, bg: COLORS.warningBg };
}

function StatusPill({ status }) {
  const info = getStatusInfo(status);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={[styles.statusPill, { backgroundColor: info.bg }]}>
      <Animated.View
        style={[
          styles.statusDot,
          { backgroundColor: info.color, opacity: pulseAnim },
        ]}
      />
      <Text style={[styles.statusText, { color: info.color }]}>
        {info.label}
      </Text>
    </View>
  );
}

function ActionRow({ icon: Icon, tone, title, subtitle, onPress, last }) {
  const palette = TONES[tone] || TONES.teal;
  const scaleVal = useRef(new Animated.Value(1)).current;
  const chevronVal = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleVal, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(chevronVal, {
        toValue: 4,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleVal, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }),
      Animated.timing(chevronVal, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleVal }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.row,
          !last && styles.rowDivider,
          pressed && styles.rowPressed,
        ]}
      >
        <View style={[styles.rowIcon, { backgroundColor: palette.bg }]}>
          <Icon size={20} color={palette.fg} strokeWidth={2.2} />
        </View>
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
        <Animated.View style={{ transform: [{ translateX: chevronVal }] }}>
          <ChevronRight size={18} color={COLORS.muted} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function StatCell({ value, label, first }) {
  return (
    <View style={[styles.statCell, !first && styles.statCellDivider]}>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Loading Component
// ---------------------------------------------------------------------------
function SkeletonScreen({ insets, width }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.teal} />
      {/* Full bleed teal header container */}
      <View style={styles.skeletonHeader}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={[styles.logoFrame, styles.skelBlock]} />
            <View style={styles.brandCopy}>
              <View style={[styles.skelLineSm, { width: 70, marginBottom: 6 }]} />
              <View style={[styles.skelLineMd, { width: 130 }]} />
            </View>
          </View>
          <View style={styles.topActions}>
            <View style={[styles.iconButton, styles.skelBlock]} />
            <View style={[styles.iconButton, styles.skelBlock]} />
          </View>
        </View>

        <View style={[styles.skelLineSm, { width: 110, marginTop: 16, marginBottom: 8 }]} />
        <View style={[styles.skelLineLg, { width: 90, height: 50, marginBottom: 16 }]} />

        {/* Floating white stats card placeholder */}
        <View style={styles.skeletonStatsCard}>
          <View style={styles.skeletonStatItem} />
          <View style={styles.skeletonStatItem} />
          <View style={styles.skeletonStatItem} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 18, marginTop: 44 }}>
        <View style={[styles.skelLineSm, { width: 120, marginBottom: 12 }]} />
        <View style={styles.skeletonListSurface}>
          {[1, 2, 3, 4].map((_, i) => (
            <View key={i} style={styles.skeletonRow}>
              <View style={[styles.skelBlock, { width: 42, height: 42, borderRadius: 13, marginRight: 14 }]} />
              <View style={{ flex: 1 }}>
                <View style={[styles.skelLineMd, { width: '50%', marginBottom: 6 }]} />
                <View style={[styles.skelLineSm, { width: '80%' }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen Component
// ---------------------------------------------------------------------------
export default function ClinicHome({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isWide = width >= 760;
  const contentMaxWidth = isWide ? 820 : 680;

  const [clinic, setClinic] = useState(route?.params?.clinic || null);
  const [loading, setLoading] = useState(!route?.params?.clinic);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [doctorsVisible, setDoctorsVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [doctors, setDoctors] = useState([]);

  // Animated values for Count-up & transitions
  const heroAnim = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const bellWiggle = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Number count-up animated values
  const [displayPatients, setDisplayPatients] = useState('0');
  const [displayRating, setDisplayRating] = useState('0.0');
  const [displayDoctors, setDisplayDoctors] = useState('0');
  const [displayAppointments, setDisplayAppointments] = useState('0');

  const loadDoctors = useCallback(async () => {
    try {
      const res = await apiFetch('/clinics/doctors/me');
      if (res?.ok) {
        const data = await res.json();
        setDoctors(
          data.map((d) => ({
            id: String(d.id),
            name: d.name,
            specialty: d.specialty,
            experience: d.experience,
          }))
        );
      }
    } catch (error) {}
  }, []);

  const runAnimations = useCallback((patientsVal, ratingVal, doctorsVal, apptVal) => {
    AccessibilityInfo.isReduceMotionEnabled?.().then((enabled) => {
      if (enabled) {
        setDisplayPatients(Number(patientsVal || 0).toLocaleString('uz-UZ'));
        setDisplayRating(String(ratingVal || 'Yangi'));
        setDisplayDoctors(String(doctorsVal || '—'));
        setDisplayAppointments(String(apptVal ?? '—'));
        heroAnim.setValue(1);
        fadeAnim.setValue(1);
        return;
      }
    });

    // Fade-in main screen transition from skeleton
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Hero card entrance
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 480,
      useNativeDriver: true,
    }).start();

    // Continuous subtle ring drift loop
    Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Count-up numbers animation over 900ms
    const startTime = Date.now();
    const duration = 900;

    const pTarget = Number(patientsVal || 0);
    const rTarget = parseFloat(ratingVal) || 0;
    const dTarget = Number(doctorsVal) || 0;
    const aTarget = Number(apptVal) || 0;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      setDisplayPatients(Math.round(pTarget * easeProgress).toLocaleString('uz-UZ'));
      if (!isNaN(rTarget) && rTarget > 0) {
        setDisplayRating((rTarget * easeProgress).toFixed(1));
      } else {
        setDisplayRating(ratingVal || 'Yangi');
      }
      setDisplayDoctors(dTarget > 0 ? String(Math.round(dTarget * easeProgress)) : (doctorsVal || '—'));
      setDisplayAppointments(aTarget > 0 ? String(Math.round(aTarget * easeProgress)) : (apptVal ?? '—'));

      if (progress >= 1) {
        clearInterval(interval);
        setDisplayPatients(pTarget.toLocaleString('uz-UZ'));
        setDisplayRating(ratingVal || 'Yangi');
        setDisplayDoctors(String(doctorsVal || '—'));
        setDisplayAppointments(String(apptVal ?? '—'));
      }
    }, 16);
  }, [heroAnim, ringRotate, fadeAnim]);

  const fetchClinicData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await apiFetch('/clinics/me');
      if (response?.ok) {
        const data = await response.json();
        setClinic(data);
        await AsyncStorage.setItem('user', JSON.stringify(data));

        const statsResponse = await apiFetch('/clinics/me/stats');
        const stats = statsResponse?.ok ? await statsResponse.json() : {};
        runAnimations(
          stats?.patients_served ?? data?.patients_served,
          stats?.rating ?? data?.rating,
          stats?.doctors_count ?? 0,
          data?.today_appointments
        );
      }
    } catch (error) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [runAnimations]);

  useFocusEffect(
    useCallback(() => {
      fetchClinicData();
      loadDoctors();
    }, [fetchClinicData, loadDoctors])
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user', 'role']);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert('Xatolik', 'Hisobdan chiqishda muammo yuz berdi.');
    }
  };

  const confirmLogout = () => {
    Alert.alert('Hisobdan chiqish', 'Haqiqatan ham chiqmoqchimisiz?', [
      { text: 'Bekor qilish', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: handleLogout },
    ]);
  };

  const handleBellPress = () => {
    AccessibilityInfo.isReduceMotionEnabled?.().then((enabled) => {
      if (!enabled) {
        Animated.sequence([
          Animated.timing(bellWiggle, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(bellWiggle, { toValue: -1, duration: 80, useNativeDriver: true }),
          Animated.timing(bellWiggle, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(bellWiggle, { toValue: 0, duration: 80, useNativeDriver: true }),
        ]).start();
      }
    });
    Alert.alert('Bildirishnomalar', 'Yangi bildirishnomalar yo‘q.');
  };

  const openSection = (routeName, title) => {
    const names = navigation?.getState?.()?.routeNames ?? [];
    if (names.includes(routeName)) {
      navigation.navigate(routeName);
    } else {
      Alert.alert(title, 'Bu bo‘lim tez orada qo‘shiladi.');
    }
  };

  const openPhone = async () => {
    const phone = clinic?.telefon?.replace(/[^+\d]/g, '');
    if (!phone)
      return Alert.alert("Telefon raqami yo'q", 'Klinika telefon raqami kiritilmagan.');
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
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
      );
    } catch (e) {
      Alert.alert('Xatolik', "Xaritani ochib bo'lmadi.");
    }
  };

  if (loading) {
    return <SkeletonScreen insets={insets} width={width} />;
  }

  const clinicName = clinic?.name || clinic?.clinic_name || 'Klinika nomi ko‘rsatilmagan';
  const status = clinic?.status || 'pending';
  const servicesCountText = clinic?.services_count != null 
    ? `${clinic.services_count} ta xizmat · narxlarni tahrirlash` 
    : 'Klinika xizmatlarini boshqarish';
  const doctorsCountVal = doctors.length;
  const doctorsSubtitle = `${doctorsCountVal} nafar mutaxassis`;
  const apptCountVal = clinic?.today_appointments ?? '—';
  const apptSubtitle = `Bugun ${apptCountVal} ta qabul rejalashtirilgan`;

  const ringSpin = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const bellRotate = bellWiggle.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  const heroStyle = {
    opacity: heroAnim,
    transform: [
      {
        translateY: heroAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.screen, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.teal} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            maxWidth: contentMaxWidth,
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              fetchClinicData(true);
              loadDoctors();
            }}
            tintColor={COLORS.white}
          />
        }
      >
        {/* Full-bleed Teal Header Section with rounded bottom and concentric rings */}
        <View style={[styles.tealHeaderContainer, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <Animated.View
            style={[
              styles.heroRingLarge,
              { transform: [{ rotate: ringSpin }] },
            ]}
          />
          <Animated.View
            style={[
              styles.heroRingSmall,
              { transform: [{ rotate: ringSpin }] },
            ]}
          />

          {/* Top Bar: Logo + Name + Icons */}
          <View style={styles.topBar}>
            <Pressable onPress={() => setDetailsVisible(true)} style={styles.brandRow}>
              <View style={styles.logoFrame}>
                {clinic?.logo_url ? (
                  <Image source={{ uri: clinic.logo_url }} style={styles.logoImage} resizeMode="cover" />
                ) : (
                  <Building2 size={24} color={COLORS.teal} strokeWidth={2.2} />
                )}
              </View>
              <View style={styles.brandCopy}>
                <Text style={styles.greetingHeader}>Xush kelibsiz</Text>
                <Text style={styles.clinicNameHeader} numberOfLines={1}>
                  {clinicName}
                </Text>
              </View>
            </Pressable>

            <View style={styles.topActions}>
              <Pressable onPress={handleBellPress} style={styles.iconButton}>
                <Animated.View style={{ transform: [{ rotate: bellRotate }] }}>
                  <Bell size={18} color={COLORS.ink} />
                </Animated.View>
                <View style={styles.notificationDot} />
              </Pressable>
              <Pressable onPress={() => setProfileVisible(true)} style={styles.iconButton}>
                <User size={18} color={COLORS.ink} />
              </Pressable>
            </View>
          </View>

          {/* Date & Huge Today's Appointments Number */}
          <Text style={styles.heroDate}>{formatToday()}</Text>
          <View style={styles.heroNumberRow}>
            <Text style={styles.heroNumber}>{displayAppointments}</Text>
            <Text style={styles.heroNumberLabel}>bugungi qabul</Text>
          </View>
        </View>

        {/* Overlapping White Stats Card */}
        <Animated.View style={[styles.statsCardOverlap, heroStyle]}>
          <StatCell first value={displayPatients} label="Bemorlar" />
          <StatCell value={displayRating} label="Reyting" />
          <StatCell value={displayDoctors} label="Shifokorlar" />
        </Animated.View>

        {/* Status Pill & Subtitle */}
        <View style={styles.statusSectionRow}>
          <StatusPill status={status} />
          <Text style={styles.managementSubText}>Klinika boshqaruvi</Text>
        </View>

        {/* Notice Card for Pending/Rejected */}
        {(status === 'pending' || status === 'rejected') && (
          <View
            style={[
              styles.notice,
              status === 'rejected' ? styles.noticeRejected : styles.noticePending,
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
                  { color: status === 'rejected' ? COLORS.danger : COLORS.warning },
                ]}
              >
                {status === 'rejected' ? 'Ariza tasdiqlanmadi' : "Ro'yxatdan o'tish tekshiruvda"}
              </Text>
              <Text style={styles.noticeText}>
                {status === 'rejected'
                  ? 'Profil holatini aniqlashtirish uchun yordam xizmatiga murojaat qiling.'
                  : 'Tasdiqlash yakunlangach, klinika profilingiz to‘liq ishlaydi.'}
              </Text>
            </View>
          </View>
        )}

        {/* Boshqaruv Section */}
        <Text style={styles.sectionTitle}>Boshqaruv</Text>
        <View style={styles.listSurface}>
          <ActionRow
            icon={UserPlus}
            tone="teal"
            title="Shifokor qo'shish"
            subtitle="Jamoaga yangi mutaxassis"
            onPress={() => navigation.navigate('AddDoctor')}
          />
          <ActionRow
            icon={Briefcase}
            tone="indigo"
            title="Xizmatlar va narxlar"
            subtitle={servicesCountText}
            onPress={() => navigation.navigate('XizmatQosh')}
          />
          <ActionRow
            icon={Stethoscope}
            tone="amber"
            title="Shifokorlar jamoasi"
            subtitle={doctorsSubtitle}
            onPress={() => setDoctorsVisible(true)}
          />
          <ActionRow
            icon={CalendarCheck}
            tone="rose"
            title="Qabullar"
            subtitle={apptSubtitle}
            onPress={() => openSection('Qabullar', 'Qabullar')}
            last
          />
        </View>

        {/* Aloqa va manzil Section */}
        <Text style={styles.sectionTitle}>Aloqa va manzil</Text>
        <View style={styles.contactRow}>
          <Pressable
            onPress={openPhone}
            style={({ pressed }) => [styles.contactCard, pressed && styles.rowPressed]}
          >
            <View style={[styles.contactIcon, { backgroundColor: TONES.teal.bg }]}>
              <Phone size={18} color={TONES.teal.fg} />
            </View>
            <Text style={styles.contactTitle}>Qo'ng'iroq</Text>
            <Text style={styles.contactValue} numberOfLines={2}>
              {clinic?.telefon || 'Kiritilmagan'}
            </Text>
          </Pressable>

          <Pressable
            onPress={openMap}
            style={({ pressed }) => [styles.contactCard, pressed && styles.rowPressed]}
          >
            <View style={[styles.contactIcon, { backgroundColor: TONES.indigo.bg }]}>
              <MapPin size={18} color={TONES.indigo.fg} />
            </View>
            <Text style={styles.contactTitle}>Manzil</Text>
            <Text style={styles.contactValue} numberOfLines={2}>
              {clinic?.address || 'Kiritilmagan'}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={confirmLogout} style={styles.logoutButton}>
          <LogOut size={16} color={COLORS.danger} />
          <Text style={styles.logoutText}>Hisobdan chiqish</Text>
        </Pressable>
      </ScrollView>

      {/* Modals */}
      <ClinicDetailModal
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        clinic={clinic}
      />
      <DoctorsModal
        visible={doctorsVisible}
        onClose={() => setDoctorsVisible(false)}
        doctors={doctors}
        onAddDoctor={() => {
          setDoctorsVisible(false);
          navigation.navigate('AddDoctor');
        }}
        clinic={clinic}
      />
      <ProfileModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        user={{ name: clinicName, role: 'Klinika' }}
        userPhone={clinic?.telefon}
        userJoinDate={clinic?.created_at}
      />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Stylesheet
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  contentContainer: {
    width: '100%',
    alignSelf: 'center',
  },

  tealHeaderContainer: {
    backgroundColor: COLORS.teal,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 18,
    paddingBottom: 46,
    overflow: 'hidden',
  },
  heroRingLarge: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 26,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroRingSmall: {
    position: 'absolute',
    top: 60,
    right: 44,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  logoFrame: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%' },
  brandCopy: { flex: 1, marginLeft: 12 },
  greetingHeader: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' },
  clinicNameHeader: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.danger,
  },

  heroDate: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  heroNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  heroNumber: {
    color: COLORS.white,
    fontSize: 64,
    lineHeight: 68,
    fontWeight: '800',
    letterSpacing: -2,
  },
  heroNumberLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 10,
    marginBottom: 10,
  },

  statsCardOverlap: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    marginHorizontal: 18,
    marginTop: -28,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 10,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statCellDivider: {
    borderLeftWidth: 1,
    borderLeftColor: COLORS.line,
  },
  statValue: { color: COLORS.ink, fontSize: 20, fontWeight: '700' },
  statLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },

  statusSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 18,
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  managementSubText: { color: COLORS.muted, fontSize: 12, fontWeight: '500' },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 18,
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  noticePending: {
    backgroundColor: COLORS.warningBg,
    borderLeftColor: COLORS.warning,
  },
  noticeRejected: {
    backgroundColor: COLORS.dangerBg,
    borderLeftColor: COLORS.danger,
  },
  noticeCopy: { flex: 1, marginLeft: 10 },
  noticeTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  noticeText: { color: COLORS.inkSoft, fontSize: 12, lineHeight: 17 },

  sectionTitle: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginHorizontal: 18,
    marginBottom: 12,
  },

  listSurface: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    marginHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: 'hidden',
    marginBottom: 26,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.line },
  rowPressed: { backgroundColor: '#EEF3F6' },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowCopy: { flex: 1, marginRight: 8 },
  rowTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '700' },
  rowSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 2 },

  contactRow: { flexDirection: 'row', paddingHorizontal: 18, gap: 12, marginBottom: 28 },
  contactCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 16,
  },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '700' },
  contactValue: { color: COLORS.muted, fontSize: 12, marginTop: 3, lineHeight: 17 },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  logoutText: { color: COLORS.danger, fontSize: 14, fontWeight: '600' },

  // Skeleton Specific Styles
  skeletonHeader: {
    backgroundColor: COLORS.teal,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 18,
    paddingBottom: 46,
  },
  skelBlock: {
    backgroundColor: COLORS.skeletonBase,
  },
  skelLineSm: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.skeletonBase,
  },
  skelLineMd: {
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.skeletonBase,
  },
  skelLineLg: {
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.skeletonBase,
  },
  skeletonStatsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: -30,
    left: 18,
    right: 18,
  },
  skeletonStatItem: {
    width: 70,
    height: 24,
    borderRadius: 6,
    backgroundColor: COLORS.skeletonHighlight,
  },
  skeletonListSurface: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
});