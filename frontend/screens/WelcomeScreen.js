import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import {
  User,
  Search,
  Sparkles,
  Syringe,
  Smile,
  ShieldAlert,
  Star,
  MapPin,
  Hospital,
} from 'lucide-react-native';

// Ranglar palitrasi (Dark Theme)
const COLORS = {
  bg: '#0F172A',
  cardBg: '#1E293B',
  primary: '#2DD4BF',
  headerGradientStart: '#1E1B4B',
  headerGradientEnd: '#0F172A',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  inputBg: '#334155',
  starYellow: '#FACC15',
};

// Kategoriyalar
const CATEGORIES = [
  { id: '1', title: 'Tish tozalash', icon: Sparkles },
  { id: '2', title: 'Implant', icon: Syringe },
  { id: '3', title: 'Ortodontiya', icon: Smile },
  { id: '4', title: 'Favqulodda', icon: ShieldAlert },
];

// Mock klinikalar
const CLINICS = [
  {
    id: '1',
    name: 'Dent Smile',
    rating: '4.9',
    address: 'Chilonzor tumani, Toshkent',
    color: '#0284C7',
  },
  {
    id: '2',
    name: 'Oq Tish Klinikasi',
    rating: '4.8',
    address: 'Yunusobod tumani, Toshkent',
    color: '#0D9488',
  },
  {
    id: '3',
    name: 'MedDent Plus',
    rating: '4.7',
    address: 'Mirzo Ulug‘bek tumani, Toshkent',
    color: '#6366F1',
  },
];

// Klinika Kartochkasi Komponenti (Animatsiyali scaling bilan)
const ClinicCard = ({ item }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, styles.clinicCardContainer]}>
      <Pressable
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: 100 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 150 });
        }}
        style={styles.clinicCard}
      >
        <View style={[styles.clinicPlaceholder, { backgroundColor: item.color }]}>
          <Hospital color={COLORS.textPrimary} size={32} />
        </View>
        <View style={styles.clinicInfo}>
          <Text style={styles.clinicName}>{item.name}</Text>
          <View style={styles.ratingRow}>
            <Star size={16} color={COLORS.starYellow} fill={COLORS.starYellow} />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <View style={styles.addressRow}>
            <MapPin size={14} color={COLORS.textSecondary} />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // AsyncStorage'dan foydalanuvchi ismini o'qish
    const loadUserData = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson !== null) {
          const parsedUser = JSON.parse(userJson);
          if (parsedUser?.ism) {
            setUserName(parsedUser.ism);
            return;
          } else if (parsedUser?.name) {
            setUserName(parsedUser.name);
            return;
          }
        }

        // Agar alohida "ism" kaliti bilan saqlangan bo'lsa
        const singleName = await AsyncStorage.getItem('ism');
        if (singleName) {
          setUserName(singleName);
        }
      } catch (error) {
        // Xatolik yuz bersa, default holatda jim qoladi
      }
    };

    loadUserData();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* YANDEX USLUBIDAGI YUMALOQ HEADER */}
      <LinearGradient
        colors={[COLORS.headerGradientStart, COLORS.headerGradientEnd]}
        style={[
          styles.header,
          {
            paddingTop: insets.top + 15,
          },
        ]}
      >
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
          style={styles.headerContent}
        >
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.subGreetingText}>Sog‘lom tabassum vaqti</Text>
            <Text style={styles.greetingText}>
              {userName ? `Xush kelibsiz, ${userName}!` : 'Xush kelibsiz!'}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton} activeOpacity={0.8}>
            {userName ? (
              <Text style={styles.profileAvatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <User color={COLORS.primary} size={22} />
            )}
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      {/* ASOSIY CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* QIDIRUV MAYDONI */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(600).springify()}
          style={styles.searchContainer}
        >
          <Search color={COLORS.textSecondary} size={20} style={styles.searchIcon} />
          <TextInput
            placeholder="Klinika qidirish..."
            placeholderTextColor={COLORS.textSecondary}
            style={styles.searchInput}
            editable={false} // Statik bo'lgani uchun
          />
        </Animated.View>

        {/* KATEGORIYALAR */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600).springify()}
          style={styles.sectionContainer}
        >
          <Text style={styles.sectionTitle}>Tezkor xizmatlar</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryIconBox}>
                    <IconComp color={COLORS.primary} size={22} />
                  </View>
                  <Text style={styles.categoryTitle}>{cat.title}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* TAVSIYA ETILGAN KLINIKALAR */}
        <Animated.View
          entering={FadeInDown.delay(450).duration(600).springify()}
          style={styles.sectionContainer}
        >
          <Text style={styles.sectionTitle}>Tavsiya etilgan klinikalar</Text>
          {CLINICS.map((clinic) => (
            <ClinicCard key={clinic.id} item={clinic} />
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  subGreetingText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  profileAvatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 52,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  categoriesScroll: {
    paddingRight: 10,
  },
  categoryCard: {
    backgroundColor: COLORS.cardBg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  categoryTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  clinicCardContainer: {
    marginBottom: 14,
  },
  clinicCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  clinicPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
});