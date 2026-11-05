import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  ChevronRight,
  Home,
  MessageCircle,
  User,
  Star,
  MapPin,
  Clock,
} from 'lucide-react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { apiFetch } from '../utils/api';
import ProfileModal from '../components/ProfileModal';
import ClinicDetailModal from '../components/ClinicDetailModal';

const BLUE = '#0083CA';

const FILTERS = [
  'Yaqin klinikalar',
  "Reyting bo'yicha",
  'Arzon narx',
  'Ochiq hozir',
];

// ======================================
// TAB BUTTON
// ======================================

function TabButton({ icon: Icon, label, isActive, onPress, onLayout }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onLayout={onLayout}
      style={styles.tabItem}
    >
      {isActive ? (
        <View style={styles.activeTab}>
          <Icon size={20} color={BLUE} />
          <Text style={styles.activeTabText}>{label}</Text>
        </View>
      ) : (
        <Icon size={21} color="#94A3B8" />
      )}
    </TouchableOpacity>
  );
}

// ======================================
// CLINIC CARD
// ======================================

function ClinicCard({ clinic, onPress }) {
  const gradientStart = clinic.gradient_start || '#43BCEB';
  const gradientEnd = clinic.gradient_end || '#0083CA';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.clinicCard}
      onPress={onPress}
    >
      <View style={styles.logoContainer}>
        {clinic.logo_url ? (
          <Image
            source={{ uri: clinic.logo_url }}
            style={styles.clinicLogo}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={[gradientStart, gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.clinicLogo}
          >
            <Text style={styles.logoText}>
              {clinic.name?.[0]?.toUpperCase() || 'K'}
            </Text>
          </LinearGradient>
        )}

        <View style={styles.onlineBadge} />
      </View>

      <View style={styles.clinicInfo}>
        <View style={styles.clinicTopRow}>
          <Text numberOfLines={1} style={styles.clinicName}>
            {clinic.name}
          </Text>

          {clinic.rating != null && (
            <View style={styles.ratingContainer}>
              <Star size={14} color={BLUE} fill="none" />
              <Text style={styles.ratingText}>
                {Number(clinic.rating).toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        <Text numberOfLines={1} style={styles.clinicAddress}>
          {clinic.address || 'Manzil mavjud emas'}
        </Text>

        {clinic.patients_served != null && (
          <Text numberOfLines={1} style={styles.patientsText}>
            {clinic.patients_served} ta bemor xizmat oldi
          </Text>
        )}

        <View style={styles.clinicBottomRow}>
          <Text style={styles.distanceText}>
            {clinic.distance != null
              ? `${clinic.distance} km`
              : 'Masofa mavjud emas'}
          </Text>

          <View style={styles.dot} />

          <View style={styles.openStatus}>
            <Text style={styles.openStatusText}>
              {clinic.is_open === false ? 'Yopiq' : 'Ochiq'}
            </Text>
          </View>

          <Text style={styles.workingHours}>
            {clinic.working_hours || '09:00–20:00'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ======================================
// HOME SCREEN
// ======================================

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [userName, setUserName] = useState('Mehmon');
  const [userInitials, setUserInitials] = useState('M');

  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [activeTab, setActiveTab] = useState('Bosh sahifa');
  const [selectedTab, setSelectedTab] = useState('Bosh sahifa');

  const [profileVisible, setProfileVisible] = useState(false);

  const previousTab = useRef('Bosh sahifa');

  const [selectedClinic, setSelectedClinic] = useState(null);
  const [clinicDetailVisible, setClinicDetailVisible] = useState(false);

  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [refreshingClinics, setRefreshingClinics] = useState(false);
  const [clinicsError, setClinicsError] = useState(null);

  // ======================================
  // CLINICS API
  // ======================================

  const fetchClinics = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshingClinics(true);
    } else {
      setLoadingClinics(true);
    }

    setClinicsError(null);

    try {
      const response = await apiFetch('/clinics/');

      if (!response.ok) {
        throw new Error(
          `Klinikalarni yuklashda xatolik (${response.status})`
        );
      }

      const data = await response.json();

      setClinics(Array.isArray(data) ? data : []);
    } catch (error) {
      setClinicsError(
        error.message || 'Ulanishda xatolik yuz berdi'
      );
    } finally {
      setLoadingClinics(false);
      setRefreshingClinics(false);
    }
  };

  // ======================================
  // USER DATA
  // ======================================

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      console.log('Token error:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);

        const firstName =
          parsedUser.ism ||
          parsedUser.firstName ||
          parsedUser.name ||
          '';

        const lastName =
          parsedUser.familiya ||
          parsedUser.lastName ||
          '';

        if (firstName || lastName) {
          setUserName(`${firstName} ${lastName}`.trim());

          const firstLetter = firstName
            ? firstName[0].toUpperCase()
            : '';

          const lastLetter = lastName
            ? lastName[0].toUpperCase()
            : '';

          setUserInitials(`${firstLetter}${lastLetter}` || 'M');
        }
      }
    } catch (error) {
      console.log('User data error:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkToken();
      loadUserData();
      fetchClinics();
    }, [navigation])
  );

  // ======================================
  // FILTERS
  // ======================================

  const filteredClinics = [...clinics].sort((a, b) => {
    if (activeFilter === "Reyting bo'yicha") {
      return Number(b.rating || 0) - Number(a.rating || 0);
    }

    if (activeFilter === 'Yaqin klinikalar') {
      return Number(a.distance || 999999) -
        Number(b.distance || 999999);
    }

    if (activeFilter === 'Ochiq hozir') {
      return Number(b.is_open === true) -
        Number(a.is_open === true);
    }

    return 0;
  });

  // ======================================
  // NAVIGATION
  // ======================================

  const handleTabPress = (tabName) => {
    setSelectedTab(tabName);

    if (tabName === 'Profil') {
      previousTab.current = activeTab;
      setProfileVisible(true);
      return;
    }

    setActiveTab(tabName);
  };

  const handleProfileClose = () => {
    setProfileVisible(false);
    setSelectedTab(previousTab.current);
  };

  // ======================================
  // RENDER
  // ======================================

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {/* HEADER */}

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12 },
        ]}
      >
        <View style={styles.profileSection}>
          <View>
            <Text style={styles.greetingText}>
              Xayrli kun
            </Text>

            <Text style={styles.userNameText}>
              {userName}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.avatar}
            onPress={() => handleTabPress('Profil')}
          >
            <Text style={styles.avatarText}>
              {userInitials}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH */}

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.searchContainer}
        >
          <Search
            color="#94A3B8"
            size={19}
          />

          <Text style={styles.searchPlaceholder}>
            Klinika yoki xizmat qidirish
          </Text>
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT */}

      {activeTab === 'Bosh sahifa' ? (
        <ScrollView
          style={styles.contentArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 25,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshingClinics}
              onRefresh={() => fetchClinics(true)}
              tintColor={BLUE}
              colors={[BLUE]}
            />
          }
        >

          {/* FILTERS */}

          <View style={styles.filtersSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContent}
            >
              {FILTERS.map((filter) => {
                const isActive = activeFilter === filter;

                return (
                  <TouchableOpacity
                    key={filter}
                    activeOpacity={0.75}
                    onPress={() => setActiveFilter(filter)}
                    style={[
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        isActive && styles.filterTextActive,
                      ]}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* CLINICS SECTION */}

          <View style={styles.clinicsSection}>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Klinikalar
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.seeAllButton}
                onPress={() => navigation.navigate('Clinics')}
              >
                <Text style={styles.seeAllText}>
                  Barchasi
                </Text>

                <ChevronRight
                  color={BLUE}
                  size={17}
                />
              </TouchableOpacity>
            </View>

            {/* LOADING */}

            {loadingClinics ? (
              <View style={styles.statusContainer}>
                <ActivityIndicator
                  size="large"
                  color={BLUE}
                />

                <Text style={styles.statusText}>
                  Klinikalar yuklanmoqda...
                </Text>
              </View>
            ) : clinicsError ? (

              /* ERROR */

              <View style={styles.statusContainer}>
                <Text style={styles.errorText}>
                  {clinicsError}
                </Text>

                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => fetchClinics()}
                >
                  <Text style={styles.retryButtonText}>
                    Qayta urinish
                  </Text>
                </TouchableOpacity>
              </View>

            ) : filteredClinics.length === 0 ? (

              /* EMPTY */

              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                  Hozircha klinikalar mavjud emas
                </Text>
              </View>

            ) : (

              /* CLINIC LIST */

              <View style={styles.cardsList}>
                {filteredClinics.map((clinic) => (
                  <ClinicCard
                    key={clinic.id || clinic.name}
                    clinic={clinic}
                    onPress={() => {
                      setSelectedClinic(clinic);
                      setClinicDetailVisible(true);
                    }}
                  />
                ))}
              </View>
            )}

          </View>
        </ScrollView>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            Tez orada
          </Text>
        </View>
      )}

      {/* BOTTOM NAVBAR */}

      <View
        style={[
          styles.navbar,
          {
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <TabButton
          icon={Home}
          label="Bosh"
          isActive={selectedTab === 'Bosh sahifa'}
          onPress={() => handleTabPress('Bosh sahifa')}
        />

        <TabButton
          icon={MessageCircle}
          label="Xabarlar"
          isActive={selectedTab === 'Xabarlar'}
          onPress={() => handleTabPress('Xabarlar')}
        />

        <TabButton
          icon={User}
          label="Profil"
          isActive={selectedTab === 'Profil'}
          onPress={() => handleTabPress('Profil')}
        />
      </View>

      {/* PROFILE MODAL */}

      <ProfileModal
        visible={profileVisible}
        onClose={handleProfileClose}
        userName={userName}
        userInitials={userInitials}
      />

      {/* CLINIC DETAIL MODAL */}

      <ClinicDetailModal
        visible={clinicDetailVisible}
        onClose={() => setClinicDetailVisible(false)}
        clinic={selectedClinic}
      />

    </View>
  );
}

// ======================================
// STYLES
// ======================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // HEADER

  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  greetingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '400',
  },

  userNameText: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '700',
    marginTop: 3,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BLUE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // SEARCH

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },

  searchPlaceholder: {
    color: '#94A3B8',
    fontSize: 13,
  },

  // CONTENT

  contentArea: {
    flex: 1,
  },

  // FILTERS

  filtersSection: {
    marginTop: 18,
  },

  filtersContent: {
    paddingHorizontal: 16,
    gap: 7,
  },

  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  filterChipActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },

  filterText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },

  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // CLINICS

  clinicsSection: {
    marginTop: 23,
    paddingHorizontal: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  sectionTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },

  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  seeAllText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '600',
  },

  cardsList: {
    flexDirection: 'column',
  },

  // CLINIC CARD

  clinicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E9EFF5',
    padding: 10,
    marginBottom: 10,
    gap: 11,

    shadowColor: '#64748B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.035,
    shadowRadius: 5,
    elevation: 1,
  },

  logoContainer: {
    position: 'relative',
    width: 53,
    height: 53,
  },

  clinicLogo: {
    width: 53,
    height: 53,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },

  onlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  clinicInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  clinicTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },

  clinicName: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 5,
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  ratingText: {
    color: BLUE,
    fontSize: 11,
    fontWeight: '700',
  },

  clinicAddress: {
    color: '#64748B',
    fontSize: 10,
    marginBottom: 3,
  },

  patientsText: {
    color: '#94A3B8',
    fontSize: 9,
    marginBottom: 4,
  },

  clinicBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  distanceText: {
    color: '#64748B',
    fontSize: 9,
  },

  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
  },

  openStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  openStatusText: {
    color: '#16A34A',
    fontSize: 9,
    fontWeight: '600',
  },

  workingHours: {
    color: '#16A34A',
    fontSize: 9,
  },

  // STATUS

  statusContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },

  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },

  retryButton: {
    backgroundColor: BLUE,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // PLACEHOLDER

  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholderText: {
    color: '#94A3B8',
    fontSize: 15,
  },

  // BOTTOM NAVBAR

  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },

  activeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },

  activeTabText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '700',
  },

});