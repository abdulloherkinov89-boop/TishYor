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
import { Search, ChevronRight, Home, Calendar, MessageCircle, User } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { apiFetch } from '../utils/api';
import ProfileModal from '../components/ProfileModal';

const FILTERS = [
  "Yaqin klinikalar",
  "Reyting bo'yicha",
  'Arzon narx',
  'Ochiq hozir',
];

// --- PASTKI NAVBAR TUGMASI (animatsiyali) ---
function TabButton({ icon: Icon, label, isActive, onPress, onLayout, badge }) {
  const widthAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: isActive ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const pillWidth = widthAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 100] });
  const textOpacity = widthAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} onLayout={onLayout} style={styles.tabItem}>
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
          <BadgeIndicator hasBadge={badge} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function BadgeIndicator({ hasBadge }) {
  if (!hasBadge) return null;
  return <View style={styles.badge} />;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState('Mehmon');
  const [userInitials, setUserInitials] = useState('M');
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [activeTab, setActiveTab] = useState('Bosh sahifa');
  const [selectedTab, setSelectedTab] = useState('Bosh sahifa');
  const [profileVisible, setProfileVisible] = useState(false);
  const [tabCenters, setTabCenters] = useState({});
  const previousTab = useRef('Bosh sahifa');
  const indicatorX = useRef(new Animated.Value(0)).current;

  // State'lar
  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [refreshingClinics, setRefreshingClinics] = useState(false);
  const [clinicsError, setClinicsError] = useState(null);

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
        throw new Error(`Klinikalarni yuklashda xatolik yuz berdi (${response.status})`);
      }
      const data = await response.json();
      setClinics(Array.isArray(data) ? data : []);
    } catch (error) {
      setClinicsError(error.message || "Ulanishda xatolik yuz berdi");
    } finally {
      if (isRefresh) {
        setRefreshingClinics(false);
      } else {
        setLoadingClinics(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkToken();
      loadUserData();
      fetchClinics();
    }, [navigation]),
  );

  const checkToken = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const firstName = parsedUser.ism || parsedUser.firstName || parsedUser.name || '';
        const lastName = parsedUser.familiya || parsedUser.lastName || '';
        if (firstName || lastName) {
          setUserName(`${firstName} ${lastName}`.trim());
          const firstLetter = firstName ? firstName[0].toUpperCase() : '';
          const lastLetter = lastName ? lastName[0].toUpperCase() : '';
          setUserInitials(`${firstLetter}${lastLetter}` || 'M');
        }
      }
    } catch (e) {}
  };

  const recordTabLayout = (tabName, event) => {
    const { x, width } = event.nativeEvent.layout;
    setTabCenters((current) => ({ ...current, [tabName]: x + width / 2 }));
  };

  useEffect(() => {
    const center = tabCenters[selectedTab];
    if (center == null) return;
    Animated.spring(indicatorX, {
      toValue: center - 9,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [selectedTab, tabCenters, indicatorX]);

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.profileSection}>
          <View>
            <Text style={styles.greetingText}>Xayrli kun</Text>
            <Text style={styles.userNameText}>{userName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.searchContainer}>
          <Search color="#94A3B8" size={20} style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Klinika yoki xizmat qidirish</Text>
        </TouchableOpacity>
      </View>

      {/* KONTENT MAYDONI */}
      {activeTab === 'Bosh sahifa' ? (
        <ScrollView
          style={styles.contentArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={(
            <RefreshControl
              refreshing={refreshingClinics}
              onRefresh={() => fetchClinics(true)}
              tintColor="#0083CA"
              colors={['#0083CA']}
            />
          )}
        >
          <View style={styles.filtersSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScrollContent}>
              {FILTERS.map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    activeOpacity={0.7}
                    onPress={() => setActiveFilter(filter)}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{filter}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.clinicsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Klinikalar</Text>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>Barchasi</Text>
                <ChevronRight color="#0083CA" size={16} />
              </TouchableOpacity>
            </View>

            <View style={styles.cardsList}>
              {loadingClinics ? (
                <View style={styles.statusContainer}>
                  <ActivityIndicator size="large" color="#0083CA" />
                  <Text style={styles.statusText}>Klinikalar yuklanmoqda...</Text>
                </View>
              ) : clinicsError ? (
                <View style={styles.statusContainer}>
                  <Text style={styles.errorText}>{clinicsError}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={() => fetchClinics()}>
                    <Text style={styles.retryButtonText}>Qayta urinish</Text>
                  </TouchableOpacity>
                </View>
              ) : clinics.length === 0 ? (
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>Hozircha klinikalar mavjud emas</Text>
                </View>
              ) : (
                clinics.map((clinic) => {
                  const bannerUrl = clinic.banner_url || clinic.logo_url;
                  const smallLogoUrl = clinic.logo_url || clinic.avatar_url || clinic.logo_small_url;

                  return (
                    <View key={clinic.id || clinic.name} style={styles.clinicCard}>
                      {/* Banner Rasmi Konteyneri */}
                      <View style={styles.bannerContainer}>
                        {bannerUrl ? (
                          <Image
                            source={{ uri: bannerUrl }}
                            style={styles.cardImagePlaceholder}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.cardImagePlaceholder, { backgroundColor: '#E0F2FE' }]} />
                        )}

                        {/* Kichik Dumaloq Logotip */}
                        <View style={styles.smallLogoWrapper}>
                          {smallLogoUrl ? (
                            <Image
                              source={{ uri: smallLogoUrl }}
                              style={styles.smallLogoImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.smallLogoFallback}>
                              <Text style={styles.smallLogoText}>
                                {clinic.name ? clinic.name[0].toUpperCase() : 'K'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Card Kontenti */}
                      <View style={styles.cardContent}>
                        <Text style={styles.tagText}>{clinic.tag}</Text>
                        <Text style={styles.clinicName}>{clinic.name}</Text>
                        <Text style={styles.descriptionText} numberOfLines={2}>{clinic.description}</Text>
                        <View style={styles.divider} />
                        <View style={styles.cardFooter}>
                          <Text style={styles.footerInfoText}>⭐ {clinic.rating}  ·  {clinic.address}</Text>
                          <TouchableOpacity activeOpacity={0.8} style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>+ Ko'rish</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Tez orada</Text>
        </View>
      )}

      {/* PASTKI NAVBAR */}
      <View style={[styles.navbar, { paddingBottom: Math.max(insets.bottom, 12), paddingTop: 12 }]}>
        <TabButton
          icon={Home}
          label="Bosh"
          isActive={selectedTab === 'Bosh sahifa'}
          onLayout={(event) => recordTabLayout('Bosh sahifa', event)}
          onPress={() => handleTabPress('Bosh sahifa')}
        />
        <TabButton
          icon={Calendar}
          label="Qabullar"
          isActive={selectedTab === 'Qabullar'}
          onLayout={(event) => recordTabLayout('Qabullar', event)}
          onPress={() => handleTabPress('Qabullar')}
          badge
        />
        <TabButton
          icon={MessageCircle}
          label="Xabarlar"
          isActive={selectedTab === 'Xabarlar'}
          onLayout={(event) => recordTabLayout('Xabarlar', event)}
          onPress={() => handleTabPress('Xabarlar')}
        />
        <TabButton
          icon={User}
          label="Profil"
          isActive={selectedTab === 'Profil'}
          onLayout={(event) => recordTabLayout('Profil', event)}
          onPress={() => handleTabPress('Profil')}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeIndicator,
            {
              bottom: Math.max(insets.bottom, 12) - 5,
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />
      </View>

      <ProfileModal
        visible={profileVisible}
        onClose={handleProfileClose}
        userName={userName}
        userInitials={userInitials}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  header: { 
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20, 
    paddingBottom: 20, 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  profileSection: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 18 
  },
  greetingText: { 
    color: '#64748B', 
    fontSize: 13 
  },
  userNameText: { 
    color: '#0F172A', 
    fontSize: 20, 
    fontWeight: '700', 
    marginTop: 2 
  },
  avatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#0083CA', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 14, 
    paddingHorizontal: 14, 
    paddingVertical: 12 
  },
  searchIcon: { 
    marginRight: 10 
  },
  searchPlaceholder: { 
    color: '#94A3B8', 
    fontSize: 14 
  },
  contentArea: { 
    flex: 1 
  },
  filtersSection: { 
    marginTop: 18 
  },
  filtersScrollContent: { 
    paddingHorizontal: 20, 
    gap: 8 
  },
  filterChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 9, 
    borderRadius: 20, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  filterChipActive: { 
    backgroundColor: '#0083CA', 
    borderColor: '#0083CA' 
  },
  filterText: { 
    color: '#64748B', 
    fontSize: 13, 
    fontWeight: '500' 
  },
  filterTextActive: { 
    color: '#FFFFFF', 
    fontWeight: '600' 
  },
  clinicsSection: { 
    marginTop: 24, 
    paddingHorizontal: 20 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  sectionTitle: { 
    color: '#0F172A', 
    fontSize: 18, 
    fontWeight: '700' 
  },
  seeAllButton: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  seeAllText: { 
    color: '#0083CA', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  statusContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0083CA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  cardsList: { 
    flexDirection: 'column' 
  },
  clinicCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    marginBottom: 20, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  bannerContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  cardImagePlaceholder: { 
    width: '100%', 
    height: '100%', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20 
  },
  smallLogoWrapper: {
    position: 'absolute',
    bottom: -24,
    left: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    zIndex: 10,
    elevation: 3,
  },
  smallLogoImage: {
    width: '100%',
    height: '100%',
  },
  smallLogoFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0083CA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallLogoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  cardContent: { 
    padding: 18,
    paddingTop: 32
  },
  tagText: { 
    color: '#0083CA', 
    fontSize: 11, 
    fontWeight: '700', 
    letterSpacing: 1, 
    marginBottom: 6, 
    textTransform: 'uppercase' 
  },
  clinicName: { 
    color: '#0F172A', 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 6 
  },
  descriptionText: { 
    color: '#64748B', 
    fontSize: 13, 
    lineHeight: 18, 
    marginBottom: 14 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#F1F5F9', 
    marginBottom: 14 
  },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  footerInfoText: { 
    color: '#475569', 
    fontSize: 13, 
    fontWeight: '500' 
  },
  actionButton: { 
    backgroundColor: '#E0F2FE', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  actionButtonText: { 
    color: '#0083CA', 
    fontSize: 13, 
    fontWeight: '700' 
  },
  placeholderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  placeholderText: { 
    color: '#94A3B8', 
    fontSize: 16 
  },
  navbar: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveTabContent: {
    position: 'relative',
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
    borderRadius: 20,
    overflow: 'hidden',
  },
  tabLabel: {
    color: '#0083CA',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0083CA',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#EF9F27',
  },
});