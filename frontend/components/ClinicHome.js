import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  LogOut,
  MapPin,
  MessageSquareText,
  Phone,
  Settings,
  ShieldCheck,
  Star,
  Stethoscope,
  UserPlus,
  Users,
} from 'lucide-react-native';
import { apiFetch } from '../utils/api';
import ClinicDetailModal from './ClinicDetailModal';
import DoctorsModal from './DoctorsModal';

const COLORS = {
  background: '#F4F7FB',
  ink: '#13243A',
  muted: '#73839A',
  blue: '#087FC1',
  line: '#E9EEF5',
};

function StatusBadge({ status }) {
  const approved = status === 'approved';
  const rejected = status === 'rejected';
  const label = approved ? 'Tasdiqlangan' : rejected ? 'Rad etilgan' : 'Tekshiruvda';

  return (
    <View style={[styles.statusBadge, approved ? styles.approvedBadge : rejected ? styles.rejectedBadge : styles.pendingBadge]}>
      <View style={[styles.statusDot, approved ? styles.approvedDot : rejected ? styles.rejectedDot : styles.pendingDot]} />
      <Text style={[styles.statusText, approved ? styles.approvedText : rejected ? styles.rejectedText : styles.pendingText]}>
        {label}
      </Text>
    </View>
  );
}

function MetricCard({ icon: Icon, value, label, tone }) {
  return (
    <View style={[styles.metricCard, tone === 'mint' ? styles.metricMint : styles.metricGold]}>
      <View style={[styles.metricIcon, tone === 'mint' ? styles.metricIconMint : styles.metricIconGold]}>
        <Icon size={19} color={tone === 'mint' ? '#07966D' : '#D99010'} strokeWidth={2.2} />
      </View>
      <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Icon
        size={74}
        color={tone === 'mint' ? 'rgba(7, 150, 109, 0.09)' : 'rgba(217, 144, 16, 0.10)'}
        style={styles.metricWatermark}
      />
    </View>
  );
}

function FeaturedActionCard({ icon: Icon, title, subtitle, color, backgroundColor, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.featuredCard,
        { backgroundColor },
        pressed && styles.actionCardPressed,
      ]}
    >
      <View style={styles.featuredIconContainer}>
        <Icon size={22} color={color} strokeWidth={2.2} />
      </View>
      <View style={styles.featuredCopy}>
        <Text style={styles.featuredTitle}>{title}</Text>
        <Text style={styles.featuredSubtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <View style={[styles.featuredArrow, { backgroundColor: color }]}>
        <ChevronRight size={16} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

function ActionCard({ icon: Icon, title, subtitle, color, backgroundColor, onPress, loading }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
    >
      <View style={[styles.actionIcon, { backgroundColor }]}>
        {loading ? <ActivityIndicator size="small" color={color} /> : <Icon size={20} color={color} strokeWidth={2.2} />}
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <ChevronRight size={16} color="#A4B1C2" />
    </Pressable>
  );
}

function HorizontalActionCard({ icon: Icon, title, subtitle, color, backgroundColor, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.horizontalActionCard, pressed && styles.actionCardPressed]}
    >
      <View style={[styles.horizontalActionIcon, { backgroundColor }]}>
        <Icon size={19} color={color} strokeWidth={2.2} />
      </View>
      <View style={styles.horizontalActionCopy}>
        <Text style={styles.horizontalActionTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.horizontalActionSubtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

export default function ClinicHome({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const [clinic, setClinic] = useState(route?.params?.clinic || null);
  const [loading, setLoading] = useState(!route?.params?.clinic);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [doctorsVisible, setDoctorsVisible] = useState(false);

  const fetchClinicData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const savedClinic = JSON.parse(storedUser);
        if (savedClinic?.role === 'clinic' || savedClinic?.status) {
          setClinic((current) => ({ ...savedClinic, ...current }));
        }
      }

      const response = await apiFetch('/clinics/me');
      if (response?.ok) {
        setClinic(await response.json());
      }
    } catch (error) {
      // Tarmoq bo'lmasa ham saqlangan klinika ma'lumotlari ekranda qoladi.
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
      Alert.alert('Xatolik', 'Hisobdan chiqishda muammo yuz berdi. Qayta urinib ko\'ring.');
    }
  };

  const openPhone = async () => {
    const phone = clinic?.telefon?.replace(/[^+\d]/g, '');
    if (!phone) {
      Alert.alert('Telefon raqami yo\'q', 'Klinika telefon raqami hali kiritilmagan.');
      return;
    }
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch (error) {
      Alert.alert('Amal bajarilmadi', 'Telefon ilovasini ochib bo\'lmadi.');
    }
  };

  const openMap = async () => {
    const query = clinic?.latitude != null && clinic?.longitude != null
      ? `${clinic.latitude},${clinic.longitude}`
      : clinic?.address;
    if (!query) {
      Alert.alert('Manzil yo\'q', 'Klinika manzili hali kiritilmagan.');
      return;
    }
    try {
      await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
    } catch (error) {
      Alert.alert('Amal bajarilmadi', 'Xarita ilovasini ochib bo\'lmadi.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingMark}><Building2 size={26} color={COLORS.blue} /></View>
        <ActivityIndicator size="small" color={COLORS.blue} />
        <Text style={styles.loadingText}>Klinika ma'lumotlari yuklanmoqda</Text>
      </View>
    );
  }

  const status = clinic?.status || 'pending';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';
  const rating = clinic?.rating && clinic.rating !== 'Yangi' ? clinic.rating : 'Yangi';
  const patientCount = Number(clinic?.patients_served || 0).toLocaleString('uz-UZ');

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#086DA8" />

      <LinearGradient
        colors={['#087FC1', '#086DA8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 14 }]}
      >
        <View style={[styles.headerInner, { maxWidth: isWide ? 1180 : 680 }]}>
          <View style={styles.brandRow}>
            <Pressable
              onPress={() => setDetailsVisible(true)}
              style={styles.logoFrame}
              accessibilityRole="button"
              accessibilityLabel="Klinika ma'lumotlarini ko'rish"
            >
              {clinic?.logo_url ? (
                <Image source={{ uri: clinic.logo_url }} style={styles.logoImage} />
              ) : (
                <Building2 size={24} color={COLORS.blue} strokeWidth={2.2} />
              )}
            </Pressable>
            <View style={styles.brandCopy}>
              <Text style={styles.brandEyebrow}>TISHYOR · KLINIKA</Text>
              <Text style={styles.clinicName} numberOfLines={1}>{clinic?.name || 'Klinikangiz'}</Text>
              <StatusBadge status={status} />
            </View>
          </View>
          <Pressable onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Hisobdan chiqish" style={styles.logoutButton}>
            <LogOut size={19} color="#FFFFFF" />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { maxWidth: isWide ? 1180 : 680, paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchClinicData(true)} tintColor={COLORS.blue} colors={[COLORS.blue]} />
        }
      >
        <View style={styles.introRow}>
          <View style={styles.introCopy}>
            <Text style={styles.eyebrow}>KLINIKA UCHUN SHAXSIY PANEL</Text>
            <Text style={styles.pageTitle}>Boshqaruv paneli</Text>
            <Text style={styles.pageSubtitle}>Asosiy ko'rsatkichlar va klinika ma'lumotlari bir joyda.</Text>
          </View>
          <View style={styles.secureMark}><ShieldCheck size={22} color="#078B70" /></View>
        </View>

        {isPending && (
          <View style={styles.noticeCard}>
            <View style={[styles.noticeIcon, styles.noticePendingIcon]}><AlertCircle size={19} color="#B77908" /></View>
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>Ro'yxatdan o'tish tekshiruvda</Text>
              <Text style={styles.noticeText}>Tasdiqlash yakunlangach, klinika profilingiz to'liq ko'rinadi.</Text>
            </View>
          </View>
        )}

        {isRejected && (
          <View style={[styles.noticeCard, styles.noticeRejected]}>
            <View style={[styles.noticeIcon, styles.noticeRejectedIcon]}><AlertCircle size={19} color="#C43F48" /></View>
            <View style={styles.noticeCopy}>
              <Text style={[styles.noticeTitle, { color: '#A52C36' }]}>Ariza tasdiqlanmadi</Text>
              <Text style={[styles.noticeText, { color: '#9D5960' }]}>Profil holatini aniqlashtirish uchun yordam xizmatiga murojaat qiling.</Text>
            </View>
          </View>
        )}

        <View style={styles.metricsRow}>
          <MetricCard icon={Users} value={patientCount} label="Xizmat ko'rsatilgan bemorlar" tone="mint" />
          <MetricCard icon={Star} value={rating} label="Klinika reytingi" tone="gold" />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('AddDoctor')}
          style={({ pressed }) => [styles.addDoctorButton, pressed && styles.addDoctorButtonPressed]}
        >
          <LinearGradient
            colors={['#0A8BCB', '#086DA8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addDoctorGradient}
          >
            <View style={styles.addDoctorIcon}><UserPlus size={23} color="#FFFFFF" strokeWidth={2.2} /></View>
            <View style={styles.addDoctorCopy}>
              <Text style={styles.addDoctorTitle}>Klinikaga doktor qo'shish</Text>
              <Text style={styles.addDoctorSubtitle}>Jamoangizga yangi mutaxassis qo'shing</Text>
            </View>
            <ChevronRight size={21} color="rgba(255,255,255,0.9)" />
          </LinearGradient>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
          style={styles.horizontalScrollRow}
        >
          <HorizontalActionCard
            icon={Phone}
            title="Klinikaga qo'ng'iroq"
            subtitle={clinic?.telefon || 'Raqam kiritilmagan'}
            color="#07966D"
            backgroundColor="#E8F8F1"
            onPress={openPhone}
          />
          <HorizontalActionCard
            icon={MapPin}
            title="Manzilni ochish"
            subtitle={clinic?.address || 'Manzil kiritilmagan'}
            color="#DB7C21"
            backgroundColor="#FFF3E8"
            onPress={openMap}
          />
        </ScrollView>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Tezkor amallar</Text>
            <Text style={styles.sectionHint}>Asosiy va kundalik bo'limlar</Text>
          </View>
          <View style={styles.sectionAccent} />
        </View>

        {/* ASOSIY MUHIM TUGMALAR (Katta formatda) */}
        <View style={styles.featuredGrid}>
          <FeaturedActionCard
            icon={Briefcase}
            title="Xizmatlar va narxlar"
            subtitle="Preyskurant va narxlarni tahrirlash"
            color="#7C3AED"
            backgroundColor="#F5F0FF"
            onPress={() => navigation.navigate('XizmatQosh')}
          />
          <FeaturedActionCard
            icon={Stethoscope}
            title="Shifokorlar jamoasi"
            subtitle="Doktorlar ro'yxati va sozlamalari"
            color="#0083CA"
            backgroundColor="#EFF8FF"
            onPress={() => setDoctorsVisible(true)}
          />
        </View>

        {/* QO'SHIMCHA BO'LIMLAR (2 talik qatorda) */}
        <View style={styles.actionsGrid}>
          <ActionCard
            icon={CalendarCheck}
            title="Qabullar"
            subtitle="So'rovlarni ko'rish"
            color="#16A34A"
            backgroundColor="#DCFCE7"
            onPress={() => Alert.alert('Tez orada', 'Qabullarni boshqarish bo\'limi tayyorlanmoqda.')}
          />
          <ActionCard
            icon={Clock}
            title="Ish vaqti"
            subtitle="Grafikni sozlash"
            color="#DB7C21"
            backgroundColor="#FFF3E8"
            onPress={() => Alert.alert('Tez orada', 'Ish vaqtini sozlash bo\'limi tayyorlanmoqda.')}
          />
          <ActionCard
            icon={MessageSquareText}
            title="Sharhlar"
            subtitle="Bemorlar fikri"
            color="#DB2777"
            backgroundColor="#FCE7F3"
            onPress={() => Alert.alert('Tez orada', 'Sharhlarni ko\'rish bo\'limi tayyorlanmoqda.')}
          />
          <ActionCard
            icon={Settings}
            title="Sozlamalar"
            subtitle="Profilni tahrirlash"
            color="#475569"
            backgroundColor="#F1F5F9"
            onPress={() => Alert.alert('Tez orada', 'Sozlamalar bo\'limi tayyorlanmoqda.')}
          />
        </View>

        <View style={styles.footerNote}>
          <ShieldCheck size={15} color="#8A9AAF" />
          <Text style={styles.footerText}>Klinika ma'lumotlari xavfsiz saqlanadi</Text>
        </View>
      </ScrollView>

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
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  loadingMark: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#E5F4FB', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  loadingText: { marginTop: 12, color: COLORS.muted, fontSize: 13, fontWeight: '600' },
  header: { paddingHorizontal: 22, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerInner: { width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  logoFrame: { width: 54, height: 54, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImage: { width: '100%', height: '100%' },
  brandCopy: { flex: 1, marginLeft: 13 },
  brandEyebrow: { color: 'rgba(255,255,255,0.72)', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 3 },
  clinicName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  approvedBadge: { backgroundColor: 'rgba(255,255,255,0.18)' },
  pendingBadge: { backgroundColor: 'rgba(255,244,214,0.22)' },
  rejectedBadge: { backgroundColor: 'rgba(255,229,230,0.22)' },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  approvedDot: { backgroundColor: '#61E3B5' },
  pendingDot: { backgroundColor: '#F6C45A' },
  rejectedDot: { backgroundColor: '#FFA0A5' },
  statusText: { fontSize: 10, fontWeight: '700' },
  approvedText: { color: '#FFFFFF' },
  pendingText: { color: '#FFF1C9' },
  rejectedText: { color: '#FFE1E2' },
  logoutButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.17)', marginLeft: 12 },
  scrollView: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: 22, paddingTop: 26 },
  introRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  introCopy: { flex: 1, paddingRight: 12 },
  eyebrow: { color: '#7D8DA3', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 7 },
  pageTitle: { color: COLORS.ink, fontSize: 25, lineHeight: 31, fontWeight: '800', letterSpacing: -0.5 },
  pageSubtitle: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  secureMark: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5F7F0' },
  noticeCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 15, borderRadius: 17, backgroundColor: '#FFF8E6', borderWidth: 1, borderColor: '#F5E8C6', marginBottom: 18 },
  noticeRejected: { backgroundColor: '#FFF0F0', borderColor: '#F5DADA' },
  noticeIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  noticePendingIcon: { backgroundColor: '#FFEDBF' },
  noticeRejectedIcon: { backgroundColor: '#FFE0E1' },
  noticeCopy: { flex: 1, paddingTop: 1 },
  noticeTitle: { color: '#8D640F', fontSize: 12, fontWeight: '800', marginBottom: 3 },
  noticeText: { color: '#94763D', fontSize: 11, lineHeight: 16 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  metricCard: { flex: 1, minHeight: 155, borderRadius: 22, padding: 17, justifyContent: 'flex-end', overflow: 'hidden', position: 'relative' },
  metricMint: { backgroundColor: '#E5F8F0', marginRight: 8 },
  metricGold: { backgroundColor: '#FFF5DC', marginLeft: 8 },
  metricIcon: { position: 'absolute', top: 16, left: 16, width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metricIconMint: { backgroundColor: '#C9F1E1' },
  metricIconGold: { backgroundColor: '#FFE8B0' },
  metricValue: { color: COLORS.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginTop: 31 },
  metricLabel: { color: '#6F8095', fontSize: 11, fontWeight: '600', marginTop: 3 },
  metricWatermark: { position: 'absolute', right: -11, bottom: -14 },
  addDoctorButton: { borderRadius: 19, overflow: 'hidden', marginBottom: 20, shadowColor: '#087FC1', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 4 },
  addDoctorButtonPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  addDoctorGradient: { minHeight: 76, paddingHorizontal: 15, paddingVertical: 13, flexDirection: 'row', alignItems: 'center' },
  addDoctorIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)', marginRight: 13 },
  addDoctorCopy: { flex: 1 },
  addDoctorTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  addDoctorSubtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 10, marginTop: 4 },
  horizontalScrollRow: { marginBottom: 24, marginHorizontal: -22 },
  horizontalScrollContent: { paddingHorizontal: 22, gap: 12 },
  horizontalActionCard: { width: 155, minHeight: 74, backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: '#EEF2F7', padding: 12, shadowColor: '#17324F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.035, shadowRadius: 10, elevation: 2, justifyContent: 'space-between' },
  horizontalActionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  horizontalActionCopy: { flex: 1 },
  horizontalActionTitle: { color: COLORS.ink, fontSize: 11, fontWeight: '800' },
  horizontalActionSubtitle: { color: '#8796A9', fontSize: 9, marginTop: 2 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '800' },
  sectionHint: { color: '#8998AA', fontSize: 11, marginTop: 3 },
  sectionAccent: { width: 35, height: 4, borderRadius: 2, backgroundColor: '#B9E7F8' },
  featuredGrid: { gap: 12, marginBottom: 16 },
  featuredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8EEF5',
    shadowColor: '#17324F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  featuredIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featuredCopy: { flex: 1 },
  featuredTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  featuredSubtitle: { color: '#7E8E9F', fontSize: 11, marginTop: 2 },
  featuredArrow: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  actionCard: { width: '48.5%', minHeight: 74, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: '#EEF2F7', paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12, shadowColor: '#17324F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.035, shadowRadius: 10, elevation: 2 },
  actionCardPressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  actionIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  actionCopy: { flex: 1, minWidth: 0 },
  actionTitle: { color: COLORS.ink, fontSize: 11, lineHeight: 15, fontWeight: '800' },
  actionSubtitle: { color: '#8796A9', fontSize: 9, marginTop: 2 },
  footerNote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 13 },
  footerText: { color: '#91A0B2', fontSize: 10, marginLeft: 6 },
});