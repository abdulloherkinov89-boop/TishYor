import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Animated,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Building2,
  LogOut,
  Clock,
  Users,
  Star,
  Stethoscope,
  Briefcase,
  Settings,
  MessageSquare,
  Home,
  User,
  AlertCircle,
} from 'lucide-react-native';
import { apiFetch } from '../utils/api';

// --- PASTKI NAVBAR TUGMASI (Animatsiyali) ---
function TabButton({ icon: Icon, label, isActive, onPress }) {
  const widthAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: isActive ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const pillWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 100],
  });

  const textOpacity = widthAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.tabItem}>
      {isActive ? (
        <Animated.View style={[styles.pill, { width: pillWidth }]}>
          <Icon size={20} color="#0083CA" />
          <Animated.Text numberOfLines={1} style={[styles.tabLabel, { opacity: textOpacity }]}>
            {label}
          </Animated.Text>
        </Animated.View>
      ) : (
        <View style={styles.inactiveTabContent}>
          <Icon size={20} color="#94A3B8" />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ClinicHome({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const [clinic, setClinic] = useState(route?.params?.clinic || null);
  const [loading, setLoading] = useState(!route?.params?.clinic);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Bosh sahifa');

  // Animatsiyalar uchun
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Ma'lumotlarni serverdan yuklash
  const fetchClinicData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (!clinic) {
      setLoading(true);
    }

    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const storedClinic = JSON.parse(storedUser);
        if (storedClinic?.role === 'clinic') {
          setClinic((current) => ({ ...storedClinic, ...current }));
        }
      }

      const response = await apiFetch('/clinics/me');
      if (response && response.ok) {
        const data = await response.json();
        setClinic(data);
      }
    } catch (error) {
      // Saqlangan klinika ma'lumotlarini ko'rsatishda davom etamiz.
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
        // Animatsiyani boshlash
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };

  useEffect(() => {
    fetchClinicData();
  }, []);

  // Tizimdan chiqish (Logout)
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#0083CA" />
        <Text style={styles.loadingText}>Klinika ma'lumotlari yuklanmoqda...</Text>
      </View>
    );
  }

  const isPending = clinic?.status === 'pending';
  const isRejected = clinic?.status === 'rejected';
  const isActionsDisabled = isPending || isRejected;

  // Status badge komponenti
  const renderStatusBadge = () => {
    if (clinic?.status === 'approved') {
      return (
        <View style={[styles.badge, styles.badgeApproved]}>
          <Text style={styles.badgeTextApproved}>Tasdiqlangan</Text>
        </View>
      );
    }
    if (clinic?.status === 'rejected') {
      return (
        <View style={[styles.badge, styles.badgeRejected]}>
          <Text style={styles.badgeTextRejected}>Rad etildi</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgePending]}>
        <Text style={styles.badgeTextPending}>Tasdiqlanish kutilmoqda</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* 1. HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoWrapper}>
            {clinic?.logo_url ? (
              <Image source={{ uri: clinic.logo_url }} style={styles.logoImage} />
            ) : (
              <Building2 color="#0083CA" size={24} />
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.clinicName} numberOfLines={1}>
              {clinic?.name || 'Klinika nomi'}
            </Text>
            {renderStatusBadge()}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut color="#EF4444" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchClinicData(true)}
            tintColor="#0083CA"
            colors={['#0083CA']}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* 2. PENDING / REJECTED BANNER */}
          {isPending && (
            <View style={styles.warningBanner}>
              <AlertCircle color="#D97706" size={22} style={styles.bannerIcon} />
              <View style={styles.bannerTextGroup}>
                <Text style={styles.bannerTitle}>Admin ko'rib chiqmoqda</Text>
                <Text style={styles.bannerSubtitle}>
                  Arizangiz ko'rib chiqilmoqda. Tasdiqlangandan so'ng barcha imkoniyatlar ochiladi.
                </Text>
              </View>
            </View>
          )}

          {isRejected && (
            <View style={[styles.warningBanner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
              <AlertCircle color="#DC2626" size={22} style={styles.bannerIcon} />
              <View style={styles.bannerTextGroup}>
                <Text style={[styles.bannerTitle, { color: '#991B1B' }]}>Arizangiz rad etildi</Text>
                <Text style={[styles.bannerSubtitle, { color: '#B91C1C' }]}>
                  Qo'shimcha ma'lumot olish uchun qo'llab-quvvatlash xizmati bilan bog'laning.
                </Text>
              </View>
            </View>
          )}

          {/* 3. STATS ROW (3 ta Card) */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Users color="#16A34A" size={18} />
              </View>
              <Text style={styles.statValue}>{clinic?.patients_served || 0}</Text>
              <Text style={styles.statLabel}>Jami bemorlar</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Star color="#D97706" size={18} />
              </View>
              <Text style={styles.statValue}>4.9</Text>
              <Text style={styles.statLabel}>Reyting</Text>
            </View>
          </View>

          {/* 4. QUICK ACTIONS GRID (2x3) */}
          <Text style={styles.sectionTitle}>Tezkor bo'limlar</Text>
          <View style={[styles.gridContainer, isActionsDisabled && styles.disabledContainer]}>
            <TouchableOpacity
              style={styles.gridCard}
              activeOpacity={0.7}
              disabled={isActionsDisabled}
              onPress={() => navigation.navigate('Doctors')}
            >
              <View style={styles.gridIconWrapper}>
                <Stethoscope color="#0083CA" size={22} />
              </View>
              <Text style={styles.gridTitle}>Shifokorlar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridCard}
              activeOpacity={0.7}
              disabled={isActionsDisabled}
              onPress={() => navigation.navigate('Services')}
            >
              <View style={styles.gridIconWrapper}>
                <Briefcase color="#0083CA" size={22} />
              </View>
              <Text style={styles.gridTitle}>Xizmatlar & narxlar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridCard}
              activeOpacity={0.7}
              disabled={isActionsDisabled}
              onPress={() => navigation.navigate('WorkingHours')}
            >
              <View style={styles.gridIconWrapper}>
                <Clock color="#0083CA" size={22} />
              </View>
              <Text style={styles.gridTitle}>Ish vaqti</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridCard}
              activeOpacity={0.7}
              disabled={isActionsDisabled}
              onPress={() => navigation.navigate('ClinicProfile')}
            >
              <View style={styles.gridIconWrapper}>
                <Settings color="#0083CA" size={22} />
              </View>
              <Text style={styles.gridTitle}>Klinika profili</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridCard}
              activeOpacity={0.7}
              disabled={isActionsDisabled}
              onPress={() => navigation.navigate('Messages')}
            >
              <View style={styles.gridIconWrapper}>
                <MessageSquare color="#0083CA" size={22} />
              </View>
              <Text style={styles.gridTitle}>Xabarlar</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {/* 6. BOTTOM NAVBAR */}
      <View style={[styles.navbar, { paddingBottom: Math.max(insets.bottom, 12), paddingTop: 12 }]}>
        <TabButton
          icon={Home}
          label="Bosh"
          isActive={activeTab === 'Bosh sahifa'}
          onPress={() => setActiveTab('Bosh sahifa')}
        />
        <TabButton
          icon={MessageSquare}
          label="Xabarlar"
          isActive={activeTab === 'Xabarlar'}
          onPress={() => setActiveTab('Xabarlar')}
        />
        <TabButton
          icon={User}
          label="Profil"
          isActive={activeTab === 'Profil'}
          onPress={() => setActiveTab('Profil')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#BAE6FD',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  clinicName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeApproved: {
    backgroundColor: '#DCFCE7',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  badgeTextApproved: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextPending: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextRejected: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '600',
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  warningBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  bannerIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  bannerTextGroup: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  statIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  gridIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#BAE6FD',
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveTabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 26,
    overflow: 'hidden',
  },
  tabLabel: {
    color: '#0083CA',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
});