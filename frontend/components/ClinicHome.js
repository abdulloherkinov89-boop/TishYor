import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
// Ranglar: "emal" oq fon, chuqur siyoh rang va klinik feruza aksent
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

/** @typedef {{ id: string, name: string, specialty: string, experience?: string, status?: string, statusLabel?: string }} Doctor */

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
  return (
    <View style={[styles.statusPill, { backgroundColor: info.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: info.color }]} />
      <Text style={[styles.statusText, { color: info.color }]}>
        {info.label}
      </Text>
    </View>
  );
}

function ActionRow({ icon: Icon, tone, title, subtitle, onPress, last }) {
  const palette = TONES[tone] || TONES.teal;
  return (
    <Pressable
      onPress={onPress}
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
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={18} color={COLORS.muted} />
    </Pressable>
  );
}

function StatCell({ value, label, first }) {
  return (
    <View style={[styles.statCell, !first && styles.statCellDivider]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** @param {{ navigation: any, route: any, doctors?: Doctor[] }} props */
export default function ClinicHome({ navigation, route, doctors = [] }) {
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

  // Bitta yagona kirish animatsiyasi: asosiy panel yumshoq paydo bo'ladi
  const heroAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, heroAnim]);

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
      // Tarmoq xatosida saqlangan ma'lumot ko'rsatilaveradi
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

  const confirmLogout = () => {
    Alert.alert('Hisobdan chiqish', 'Haqiqatan ham chiqmoqchimisiz?', [
      { text: 'Bekor qilish', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: handleLogout },
    ]);
  };

  // Hali yaratilmagan bo'limlar uchun xavfsiz o'tish:
  // ekran App.tsx da ro'yxatdan o'tgan bo'lsa ochiladi, bo'lmasa xabar chiqadi
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
        <ActivityIndicator size="small" color={COLORS.teal} />
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
  const doctorsCount = doctors.length > 0 ? doctors.length : clinic?.doctors_count ?? '—';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: contentMaxWidth,
            paddingTop: Math.max(insets.top, 12) + 8,
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchClinicData(true)}
            tintColor={COLORS.teal}
          />
        }
      >
        {/* SARLAVHA: logo, klinika nomi, tezkor tugmalar */}
        <View style={styles.topBar}>
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
                <Building2 size={24} color={COLORS.teal} strokeWidth={2.2} />
              )}
            </View>
            <View style={styles.brandCopy}>
              <Text style={styles.greeting}>Xush kelibsiz</Text>
              <Text style={styles.clinicName} numberOfLines={1}>
                {clinicName}
              </Text>
            </View>
          </Pressable>

          <View style={styles.topActions}>
            <Pressable
              onPress={() =>
                Alert.alert('Bildirishnomalar', 'Yangi bildirishnomalar yo‘q.')
              }
              style={styles.iconButton}
            >
              <Bell size={18} color={COLORS.ink} />
            </Pressable>
            <Pressable
              onPress={() => setProfileVisible(true)}
              style={styles.iconButton}
            >
              <User size={18} color={COLORS.ink} />
            </Pressable>
          </View>
        </View>

        <View style={styles.statusRow}>
          <StatusPill status={status} />
        </View>

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

        {/* ASOSIY PANEL: bugungi qabullar va umumiy ko'rsatkichlar */}
        <Animated.View style={[styles.hero, heroStyle]}>
          <View style={styles.heroRingLarge} />
          <View style={styles.heroRingSmall} />

          <Text style={styles.heroDate}>{formatToday()}</Text>
          <View style={styles.heroNumberRow}>
            <Text style={styles.heroNumber}>{todayAppointments}</Text>
            <Text style={styles.heroNumberLabel}>bugungi qabul</Text>
          </View>

          <View style={styles.statsRow}>
            <StatCell first value={patientCount} label="Bemorlar" />
            <StatCell value={rating} label="Reyting" />
            <StatCell value={doctorsCount} label="Shifokorlar" />
          </View>
        </Animated.View>

        {/* BOSHQARUV */}
        <Text style={styles.sectionTitle}>Boshqaruv</Text>
        <View style={styles.listSurface}>
          <ActionRow
            icon={UserPlus}
            tone="teal"
            title="Shifokor qo'shish"
            subtitle="Yangi mutaxassisni jamoaga qo'shing"
            onPress={() => navigation.navigate('AddDoctor')}
          />
          <ActionRow
            icon={Briefcase}
            tone="indigo"
            title="Xizmatlar va narxlar"
            subtitle="Klinika xizmatlarini boshqarish"
            onPress={() => navigation.navigate('XizmatQosh')}
          />
          <ActionRow
            icon={Stethoscope}
            tone="amber"
            title="Shifokorlar jamoasi"
            subtitle="Mutaxassislar ro'yxatini ko'rish"
            onPress={() => setDoctorsVisible(true)}
          />
          <ActionRow
            icon={CalendarCheck}
            tone="rose"
            title="Qabullar"
            subtitle="Bemorlar so'rovlari va jadval"
            onPress={() => openSection('Qabullar', 'Qabullar')}
            last
          />
        </View>

        {/* ALOQA VA MANZIL */}
        <Text style={styles.sectionTitle}>Aloqa va manzil</Text>
        <View style={styles.contactRow}>
          <Pressable
            onPress={openPhone}
            style={({ pressed }) => [
              styles.contactCard,
              pressed && styles.rowPressed,
            ]}
          >
            <View
              style={[styles.contactIcon, { backgroundColor: TONES.teal.bg }]}
            >
              <Phone size={18} color={TONES.teal.fg} />
            </View>
            <Text style={styles.contactTitle}>Qo'ng'iroq</Text>
            <Text style={styles.contactValue} numberOfLines={2}>
              {clinic?.telefon || 'Kiritilmagan'}
            </Text>
          </Pressable>

          <Pressable
            onPress={openMap}
            style={({ pressed }) => [
              styles.contactCard,
              pressed && styles.rowPressed,
            ]}
          >
            <View
              style={[styles.contactIcon, { backgroundColor: TONES.indigo.bg }]}
            >
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

      {/* MODALLAR */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  content: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 18,
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '500',
  },

  // Sarlavha
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  greeting: { color: COLORS.muted, fontSize: 12, fontWeight: '500' },
  clinicName: {
    color: COLORS.ink,
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

  statusRow: { flexDirection: 'row', marginTop: 12, marginBottom: 16 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Ogohlantirish
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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

  // Asosiy panel
  hero: {
    backgroundColor: COLORS.ink,
    borderRadius: 28,
    padding: 22,
    overflow: 'hidden',
    marginBottom: 26,
  },
  heroRingLarge: {
    position: 'absolute',
    top: -70,
    right: -60,
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 26,
    borderColor: 'rgba(127,214,204,0.10)',
  },
  heroRingSmall: {
    position: 'absolute',
    top: 54,
    right: 34,
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 6,
    borderColor: 'rgba(127,214,204,0.18)',
  },
  heroDate: { color: COLORS.mint, fontSize: 13, fontWeight: '600' },
  heroNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 6,
    marginBottom: 22,
  },
  heroNumber: {
    color: COLORS.white,
    fontSize: 64,
    lineHeight: 68,
    fontWeight: '800',
    letterSpacing: -2,
  },
  heroNumberLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 10,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: 16,
  },
  statCell: { flex: 1, paddingLeft: 0 },
  statCellDivider: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.12)',
    paddingLeft: 16,
  },
  statValue: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },

  // Bo'lim sarlavhalari
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 12,
  },

  // Boshqaruv ro'yxati
  listSurface: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
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
  rowCopy: { flex: 1 },
  rowTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '700' },
  rowSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 2 },

  // Aloqa
  contactRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
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

  // Chiqish
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
});