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
  ScrollView,
  Image,
} from 'react-native';
import { X, Phone, MapPin, FileText } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Snap nuqtalari
const SNAP_FULL = 0; // To'liq ekran
const SNAP_HALF = SCREEN_HEIGHT * 0.35; // Yarim ekran
const SNAP_CLOSED = SCREEN_HEIGHT; // Yopiq

export default function ClinicDetailModal({ visible, onClose, clinic }) {
  const translateY = useRef(new Animated.Value(SNAP_CLOSED)).current;
  const lastSnap = useRef(SNAP_HALF);
  const [snapState, setSnapState] = useState('HALF'); // 'HALF' | 'FULL'

  useEffect(() => {
    if (visible) {
      setSnapState('HALF');
      lastSnap.current = SNAP_HALF;
      Animated.spring(translateY, {
        toValue: SNAP_HALF,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SNAP_CLOSED,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const snapTo = (toValue, nextState) => {
    lastSnap.current = toValue;
    setSnapState(nextState);
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      bounciness: 4,
    }).start(() => {
      if (nextState === 'CLOSED') {
        onClose();
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Faqat sezirarli harakat bo'lganda ushlab qoladi
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        translateY.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const currentPosition = lastSnap.current + gestureState.dy;
        const velocity = gestureState.vy;

        if (velocity > 0.5) {
          // Tez pastga surilganda
          if (lastSnap.current === SNAP_FULL) {
            snapTo(SNAP_HALF, 'HALF');
          } else {
            snapTo(SNAP_CLOSED, 'CLOSED');
          }
        } else if (velocity < -0.5) {
          // Tez yuqoriga surilganda
          snapTo(SNAP_FULL, 'FULL');
        } else {
          // Eng yaqin snap nuqtasini aniqlash
          const distToFull = Math.abs(currentPosition - SNAP_FULL);
          const distToHalf = Math.abs(currentPosition - SNAP_HALF);
          const distToClosed = Math.abs(currentPosition - SNAP_CLOSED);

          const min = Math.min(distToFull, distToHalf, distToClosed);
          if (min === distToFull) {
            snapTo(SNAP_FULL, 'FULL');
          } else if (min === distToHalf) {
            snapTo(SNAP_HALF, 'HALF');
          } else {
            snapTo(SNAP_CLOSED, 'CLOSED');
          }
        }
      },
    })
  ).current;

  const handleClose = () => {
    snapTo(SNAP_CLOSED, 'CLOSED');
  };

  if (!visible && translateY._value === SNAP_CLOSED) return null;
  if (!clinic) return null;

  // Backdrop shaffofligi animatsiyasi
  const backdropOpacity = translateY.interpolate({
    inputRange: [SNAP_FULL, SNAP_HALF, SNAP_CLOSED],
    outputRange: [0.6, 0.4, 0],
    extrapolate: 'clamp',
  });

  const firstLetter = clinic.name ? clinic.name[0].toUpperCase() : 'K';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop (orqa fon) */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={styles.backdropTouch}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        {/* Modal Konteyneri */}
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY }] },
          ]}
        >
          {/* Drag Handle & Header (PanResponder paneli) */}
          <View {...panResponder.panHandlers} style={styles.dragHeader}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Klinika haqida</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Kontent ScrollView */}
          <ScrollView
            scrollEnabled={snapState === 'FULL'}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
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
  backdropTouch: {
    flex: 1,
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