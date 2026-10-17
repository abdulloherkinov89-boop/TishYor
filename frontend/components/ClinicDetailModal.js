import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
} from 'react-native';
import { X, Phone, MapPin, FileText } from 'lucide-react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Snap nuqtalari (qiymatlar o'zgartirilmadi)
const SNAP_FULL = 0;
const SNAP_HALF = SCREEN_HEIGHT * 0.35;
const SNAP_CLOSED = SCREEN_HEIGHT;

export default function ClinicDetailModal({ visible, onClose, clinic }) {
  const translateY = useRef(new Animated.Value(SNAP_CLOSED)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [snapState, setSnapState] = useState('HALF');
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    if (visible) {
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

  const panResponder = useRef(
    PanResponder.create({
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

  if (!visible) return null;
  if (!clinic) return null;

  const firstLetter = clinic.name ? clinic.name[0].toUpperCase() : 'K';

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY }] },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag Handle & Header */}
          <View style={styles.dragHeader}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Klinika haqida</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Kontent ScrollView - o'zgarishsiz */}
          <ScrollView
            scrollEnabled={snapState === 'FULL'}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onScroll={(e) => setScrollOffset(e.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
          >
            {/* 2. LOGO VA NOMI */}
            <View style={styles.clinicHeaderCard}>
              {clinic.logo_url ? (
                <Image
                  source={{ uri: clinic.logo_url }}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.logoFallback}>
                  <Text style={styles.logoFallbackText}>{firstLetter}</Text>
                </View>
              )}
              <Text style={styles.clinicName}>{clinic.name}</Text>
              <Text style={styles.tagText}>{clinic.tag || 'KLINIKA'}</Text>
            </View>

            {/* 3. STATISTIKA QATORI */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{clinic.patients_served ?? 0}</Text>
                <Text style={styles.statLabel}>Bemorlar</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>⭐ {clinic.rating ?? '0.0'}</Text>
                <Text style={styles.statLabel}>Reyting</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>Faol</Text>
                <Text style={styles.statLabel}>Holat</Text>
              </View>
            </View>

            {/* 4. MA'LUMOTLAR BO'LIMI */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>MA'LUMOTLAR</Text>

              <View style={styles.infoRow}>
                <View style={styles.iconWrapper}>
                  <Phone size={18} color="#0083CA" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Telefon</Text>
                  <Text style={styles.infoValue}>{clinic.telefon || 'Mavjud emas'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.iconWrapper}>
                  <MapPin size={18} color="#0083CA" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Manzil</Text>
                  <Text style={styles.infoValue}>{clinic.address || 'Mavjud emas'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.iconWrapper}>
                  <FileText size={18} color="#0083CA" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Litsenziya</Text>
                  <Text style={styles.infoValue}>{clinic.license_number || 'Mavjud emas'}</Text>
                </View>
              </View>
            </View>

            {/* 5. TAVSIF BO'LIMI */}
            {clinic.description ? (
              <View style={styles.infoCard}>
                <Text style={styles.sectionTitle}>TAVSIF</Text>
                <Text style={styles.descriptionText}>{clinic.description}</Text>
              </View>
            ) : null}

            {/* 6. XARITADA KO'RISH TUGMASI */}
            {clinic.latitude && clinic.longitude ? (
              <TouchableOpacity
                style={styles.mapButton}
                activeOpacity={0.8}
                onPress={() => console.log("Xaritada ko'rish bosildi", clinic.latitude, clinic.longitude)}
              >
                <MapPin size={18} color="#0083CA" style={{ marginRight: 8 }} />
                <Text style={styles.mapButtonText}>Xaritada ko'rish</Text>
              </TouchableOpacity>
            ) : null}

            {/* 7. QABULGA YOZILISH TUGMASI */}
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => console.log("Qabulga yozilish bosildi")}
            >
              <Text style={styles.primaryButtonText}>Qabulga yozilish</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  modalContainer: {
    height: SCREEN_HEIGHT,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  dragHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 12,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    padding: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  clinicHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  logoFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0083CA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoFallbackText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  clinicName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  tagText: {
    color: '#0083CA',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  mapButtonText: {
    color: '#0083CA',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#0083CA',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});