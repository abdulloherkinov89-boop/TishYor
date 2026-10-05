import React, { useRef, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  X,
  User,
  CalendarCheck,
  Settings,
  LogOut,
  Phone,
  Calendar,
  ChevronRight,
  Moon,
  Bell,
} from 'lucide-react-native';
import { resetRoot } from '../RootNavigation';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SNAP_HALF = SCREEN_HEIGHT * 0.45;
const SNAP_FULL = 0;
const SNAP_CLOSED = SCREEN_HEIGHT;

const ProfileModal = ({ visible, onClose, user, userPhone, userJoinDate }) => {
  const translateY = useRef(new Animated.Value(SNAP_CLOSED)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [snapState, setSnapState] = useState('HALF');
  const [scrollOffset, setScrollOffset] = useState(0);

  // === 1. HAQIQIY MA'LUMOTLARNI SAQLASH UCHUN STATE VA FUNKSIYALAR ===
  const [profileData, setProfileData] = useState({
    name: '',
    role: 'patient',
    phone: '',
    joinDate: '',
  });

  // === 2 va 3. SOZLAMALAR UCHUN STATELAR ===
  // Hozircha faqat local state; haqiqiy tema/bildirishnoma o'zgarishi keyinroq butun ilova context/store'iga ulanadi.
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (visible) {
      loadUserData();
      setSnapState('HALF');
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: SNAP_HALF,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.4,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateY.setValue(SNAP_CLOSED);
      backdropOpacity.setValue(0);
    }
  }, [visible]);

  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const firstName = parsed.ism || parsed.firstName || parsed.name || '';
        const lastName = parsed.familiya || parsed.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        setProfileData({
          name: fullName || 'Foydalanuvchi',
          role: parsed.role || 'patient',
          phone: parsed.telefon || parsed.phone || 'Kiritilmagan',
          joinDate: parsed.created_at
            ? new Date(parsed.created_at).toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: 'long',
              })
            : "Noma'lum",
        });
      }
    } catch (e) {
      console.log("Profil ma'lumotini o'qishda xato:", e);
    }
  };

  // Ma'lumotlarni prop yoki AsyncStorage dan olingan state orqali ustunlik bo'yicha aniqlash
  const displayName = user?.name || profileData.name || 'Foydalanuvchi';
  const displayRole = user?.role || profileData.role;
  const displayPhone = userPhone || profileData.phone || 'Kiritilmagan';
  const displayJoinDate = userJoinDate || profileData.joinDate || "Noma'lum";

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SNAP_CLOSED,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const currentSnapState = useRef(snapState);
  currentSnapState.current = snapState;

  const scrollOffsetRef = useRef(scrollOffset);
  scrollOffsetRef.current = scrollOffset;

  // Bitta bosishdayoq birnoiz tutib olish uchun PanResponder
  const panResponder = useRef(
    PanResponder.create({
      // Birinchi bosilgandayoq harakatni darhol qabul qilish
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,

      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dy } = gestureState;
        const isHalf = currentSnapState.current === 'HALF';

        if (isHalf) return true;
        if (!isHalf && scrollOffsetRef.current <= 0 && dy > 0) return true;

        return false;
      },

      onPanResponderGrant: () => {
        translateY.extractOffset();
      },

      onPanResponderMove: (_, gestureState) => {
        translateY.setValue(gestureState.dy);
      },

      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const { dy, vy } = gestureState;
        const isHalf = currentSnapState.current === 'HALF';

        if (isHalf) {
          if (dy < -40 || vy < -0.2) {
            setSnapState('FULL');
            Animated.spring(translateY, {
              toValue: SNAP_FULL,
              tension: 65,
              friction: 11,
              useNativeDriver: true,
            }).start();
          } else if (dy > 60 || vy > 0.3) {
            handleClose();
          } else {
            Animated.spring(translateY, {
              toValue: SNAP_HALF,
              tension: 65,
              friction: 11,
              useNativeDriver: true,
            }).start();
          }
        } else {
          if (dy > 60 || vy > 0.3) {
            setSnapState('HALF');
            Animated.spring(translateY, {
              toValue: SNAP_HALF,
              tension: 65,
              friction: 11,
              useNativeDriver: true,
            }).start();
          } else {
            Animated.spring(translateY, {
              toValue: SNAP_FULL,
              tension: 65,
              friction: 11,
              useNativeDriver: true,
            }).start();
          }
        }
      },
    })
  ).current;

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user', 'role']);
      handleClose();
      resetRoot('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlayContainer}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY }] },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Tepadagi kichik tutqich */}
          <View style={styles.dragHandleZone}>
            <View style={styles.dragHandle} />
          </View>

          {/* Sarlavha (Header) */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profil</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            scrollEnabled={snapState === 'FULL'}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onScroll={(e) => setScrollOffset(e.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
          >
            {/* Profil karta */}
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{displayName}</Text>
                <Text style={styles.userRole}>
                  {displayRole === 'doctor' ? 'Shifokor' : 'Bemor'}
                </Text>
              </View>
            </View>

            {/* Statistika */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Qabullar</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Klinikalar</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>4.8</Text>
                <Text style={styles.statLabel}>Reyting</Text>
              </View>
            </View>

            {/* Shaxsiy Ma'lumotlar */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeaderTitle}>SHAXSIY MA'LUMOTLAR</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.iconCircle}>
                    <Phone size={18} color="#0083CA" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Telefon raqam</Text>
                    <Text style={styles.infoValue}>{displayPhone}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.iconCircle}>
                    <Calendar size={18} color="#0083CA" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>A'zo bo'lgan sana</Text>
                    <Text style={styles.infoValue}>{displayJoinDate}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Sozlamalar */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeaderTitle}>SOZLAMALAR</Text>
              <View style={styles.infoCard}>
                <View style={styles.switchRow}>
                  <View style={styles.switchLeft}>
                    <View style={styles.iconCircle}>
                      <Moon size={18} color="#0083CA" />
                    </View>
                    <Text style={styles.switchLabel}>Qorong'i rejim</Text>
                  </View>
                  <Switch
                    value={darkMode}
                    onValueChange={setDarkMode}
                    trackColor={{ false: '#E2E8F0', true: '#0083CA' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.switchRow}>
                  <View style={styles.switchLeft}>
                    <View style={styles.iconCircle}>
                      <Bell size={18} color="#0083CA" />
                    </View>
                    <Text style={styles.switchLabel}>Bildirishnomalar</Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: '#E2E8F0', true: '#0083CA' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </View>

            {/* Menyu */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeaderTitle}>HISOB</Text>
              <View style={styles.menuCard}>
                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuLeft}>
                    <User size={20} color="#0083CA" />
                    <Text style={styles.menuItemText}>Profilni tahrirlash</Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuLeft}>
                    <CalendarCheck size={20} color="#0083CA" />
                    <Text style={styles.menuItemText}>Mening qabullarim</Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuLeft}>
                    <Settings size={20} color="#0083CA" />
                    <Text style={styles.menuItemText}>Sozlamalar</Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Chiqish tugmasi */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Chiqish</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justify: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 20,
    // Webda matnlarni belgilash va sichqoncha ikkilanib qolishining oldini oladi:
    userSelect: 'none',
  },
  dragHandleZone: {
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0083CA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  userRole: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0083CA',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: {
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
});

export default ProfileModal;