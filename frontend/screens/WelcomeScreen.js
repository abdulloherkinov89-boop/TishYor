import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const FILTERS = [
  "Yaqin klinikalar",
  "Reyting bo'yicha",
  'Arzon narx',
  'Ochiq hozir',
];

const MOCK_CLINICS = [
  {
    id: '1',
    name: 'Stomatologiya Plus',
    tag: 'KLINIKA',
    description: 'Zamonaviy uskunalar, tajribali shifokorlar va kafolatlangan stomatologik xizmatlar.',
    rating: '4.9',
    address: 'Mirobod tumani',
    gradient: ['#EF9F27', '#F0997B'],
  },
  {
    id: '2',
    name: 'Denta Care Clinic',
    tag: 'KLINIKA',
    description: "Og'riqsiz davolash, tishlarni oqartirish va barcha turdagi protezlash xizmatlari.",
    rating: '4.8',
    address: 'Chilonzor tumani',
    gradient: ['#7F77DD', '#5742A9'],
  },
  {
    id: '3',
    name: 'Pearl Dental Center',
    tag: 'KLINIKA',
    description: 'Bolalar va kattalar uchun maxsus stomatologik yondashuv hamda profilaktika.',
    rating: '4.7',
    address: 'Yunusobod tumani',
    gradient: ['#3C3489', '#EF9F27'],
  },
  {
    id: '4',
    name: 'Smile Studio',
    tag: 'KLINIKA',
    description: "Estetik stomatologiya va breket tizimlarini o'rnatish bo'yicha yetakchi markaz.",
    rating: '4.6',
    address: 'Shayxontohur tumani',
    gradient: ['#F0997B', '#7F77DD'],
  },
  {
    id: '5',
    name: 'Grand Medical Care',
    tag: 'KLINIKA',
    description: "Ko'p tarmoqli diagnostika va terapiya markazi. Yuqori aniqlikdagi tahlillar.",
    rating: '4.9',
    address: 'Yakkasaroy tumani',
    gradient: ['#2575FC', '#6A11CB'],
  },
];

export default function HomeScreen({ isProfileModalVisible, onCloseProfileModal }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState('Mehmon');
  const [userInitials, setUserInitials] = useState('M');
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);

  useEffect(() => {
    checkToken();
    loadUserData();
  }, [navigation]);

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

        const firstName =
          parsedUser.ism || parsedUser.firstName || parsedUser.name || '';
        const lastName = parsedUser.familiya || parsedUser.lastName || '';

        if (firstName || lastName) {
          const fullName = `${firstName} ${lastName}`.trim();
          setUserName(fullName);

          const firstLetter = firstName ? firstName[0].toUpperCase() : '';
          const lastLetter = lastName ? lastName[0].toUpperCase() : '';
          setUserInitials(`${firstLetter}${lastLetter}` || 'M');
        }
      }
    } catch (e) {
      // Async storage xatoliklari e'tiborsiz qoldiriladi
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={['#3C3489', '#26215C']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.profileSection}>
          <View>
            <Text style={styles.greetingText}>Xayrli kun</Text>
            <Text style={styles.userNameText}>{userName}</Text>
          </View>
          {/* Avatar faqat vizual ko'rinishda (bosish olib tashlandi) */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.searchContainer}>
          <Search color="#B4B2A9" size={20} style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>
            Klinika yoki xizmat qidirish
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.filtersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  activeOpacity={0.7}
                  onPress={() => setActiveFilter(filter)}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text
                    style={[styles.filterText, isActive && styles.filterTextActive]}
                  >
                    {filter}
                  </Text>
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
              <ChevronRight color="#EF9F27" size={16} />
            </TouchableOpacity>
          </View>

          <View style={styles.cardsList}>
            {MOCK_CLINICS.map((clinic) => (
              <View key={clinic.id} style={styles.clinicCard}>
                <LinearGradient
                  colors={clinic.gradient}
                  style={styles.cardImagePlaceholder}
                />

                <View style={styles.cardContent}>
                  <Text style={styles.tagText}>{clinic.tag}</Text>
                  <Text style={styles.clinicName}>{clinic.name}</Text>
                  <Text style={styles.descriptionText} numberOfLines={2}>
                    {clinic.description}
                  </Text>

                  <View style={styles.divider} />

                  <View style={styles.cardFooter}>
                    <Text style={styles.footerInfoText}>
                      ⭐ {clinic.rating}  ·  {clinic.address}
                    </Text>

                    <TouchableOpacity activeOpacity={0.8} style={styles.actionButton}>
                      <Text style={styles.actionButtonText}>+ Ko'rish</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Profil Bottom Sheet Modali (Tashqaridan keluvchi propslar orqali) */}
      <Modal
        visible={isProfileModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={onCloseProfileModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onCloseProfileModal}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: '100%' }}>
            <View style={styles.bottomSheet}>
              <View style={styles.dragHandle} />

              <View style={styles.sheetAvatar}>
                <Text style={styles.sheetAvatarText}>{userInitials}</Text>
              </View>
              <Text style={styles.sheetUserName}>{userName}</Text>

              <TouchableOpacity style={styles.sheetMenuItem}>
                <Text style={styles.sheetMenuText}>Profilni tahrirlash</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetMenuItem}>
                <Text style={styles.sheetMenuText}>Mening qabullarim</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetMenuItem}>
                <Text style={styles.sheetMenuText}>Sozlamalar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={async () => {
                  await AsyncStorage.removeItem('token');
                  await AsyncStorage.removeItem('user');
                  if (onCloseProfileModal) onCloseProfileModal();
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                }}
              >
                <Text style={styles.logoutButtonText}>Chiqish</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15111F',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    zIndex: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    color: '#B4B2A9',
    fontSize: 14,
  },
  userNameText: {
    color: '#F5F4FB',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF9F27',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#15111F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    color: '#B4B2A9',
    fontSize: 14,
  },
  filtersSection: {
    marginTop: 20,
  },
  filtersScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipActive: {
    backgroundColor: '#3C3489',
    borderColor: '#EF9F27',
  },
  filterText: {
    color: '#B4B2A9',
    fontSize: 13,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#F5F4FB',
    fontWeight: 'bold',
  },
  clinicsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#F5F4FB',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: '#EF9F27',
    fontSize: 14,
    fontWeight: '500',
  },
  cardsList: {
    flexDirection: 'column',
  },
  clinicCard: {
    backgroundColor: '#231D3D',
    borderRadius: 18,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  cardContent: {
    padding: 18,
  },
  tagText: {
    color: '#EF9F27',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  clinicName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descriptionText: {
    color: '#B4B2A9',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerInfoText: {
    color: '#D1CFCE',
    fontSize: 13,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#1E3B2B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    backgroundColor: '#1A1625',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
    minHeight: 320,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF9F27',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetAvatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#15111F',
  },
  sheetUserName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#F5F4FB',
    textAlign: 'center',
    marginBottom: 20,
  },
  sheetMenuItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sheetMenuText: {
    fontSize: 15,
    color: '#D1CFCE',
  },
  logoutButton: {
    marginTop: 16,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: 'bold',
  },
});