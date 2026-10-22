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
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, UserPlus, Star, Award, Clock } from 'lucide-react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24);

const SNAP_FULL = STATUS_BAR_HEIGHT + 8;
const SNAP_HALF = SCREEN_HEIGHT * 0.5;
const SNAP_CLOSED = SCREEN_HEIGHT;

const STATIC_DOCTORS = [
  {
    id: '1',
    name: 'Dr. Aziz Karimov',
    specialty: 'Stomatolog-terapevt',
    experience: '12 yillik tajriba',
    rating: 4.9,
    reviewsCount: 128,
    status: 'active',
    statusLabel: 'Navbatchi',
    bg: '#E0F2FE',
    color: '#0284C7',
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
  },
  {
    id: '2',
    name: 'Dr. Malika Yusupova',
    specialty: 'Ortodont',
    experience: '8 yillik tajriba',
    rating: 4.8,
    reviewsCount: 94,
    status: 'active',
    statusLabel: 'Qabulda',
    bg: '#F3E8FF',
    color: '#7C3AED',
    badgeBg: '#F3E8FF',
    badgeText: '#6D28D9',
  },
  {
    id: '3',
    name: 'Dr. Sardor Rahimov',
    specialty: 'Jarroh-implantolog',
    experience: '15 yillik tajriba',
    rating: 5.0,
    reviewsCount: 210,
    status: 'active',
    statusLabel: 'Qabulda',
    bg: '#FEF3C7',
    color: '#D97706',
    badgeBg: '#FEF3C7',
    badgeText: '#B45309',
  },
  {
    id: '4',
    name: 'Dr. Nigora Alimova',
    specialty: 'Bolalar stomatologi',
    experience: '6 yillik tajriba',
    rating: 4.7,
    reviewsCount: 65,
    status: 'active',
    statusLabel: 'Qabulda',
    bg: '#FFEDD5',
    color: '#EA580C',
    badgeBg: '#FFEDD5',
    badgeText: '#C2410C',
  },
  {
    id: '5',
    name: 'Dr. Jamshid Ergashev',
    specialty: 'Ortoped-protezist',
    experience: '10 yillik tajriba',
    rating: 4.9,
    reviewsCount: 112,
    status: 'off',
    statusLabel: 'Dam olishda',
    bg: '#DCFCE7',
    color: '#16A34A',
    badgeBg: '#DCFCE7',
    badgeText: '#15803D',
  },
  {
    id: '6',
    name: 'Dr. Dilnoza Umarova',
    specialty: 'Parodontolog',
    experience: '7 yillik tajriba',
    rating: 4.8,
    reviewsCount: 83,
    status: 'active',
    statusLabel: 'Qabulda',
    bg: '#FCE7F3',
    color: '#DB2777',
    badgeBg: '#FCE7F3',
    badgeText: '#BE185D',
  },
];

const DoctorsModal = ({ visible, onClose, onAddDoctor, clinic }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SNAP_CLOSED)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const currentSnapState = useRef('HALF');
  const scrollOffsetRef = useRef(0);
  const isClosingRef = useRef(false);

  const onCloseRef = useRef(onClose);
  const onAddDoctorRef = useRef(onAddDoctor);

  useEffect(() => {
    onCloseRef.current = onClose;
    onAddDoctorRef.current = onAddDoctor;
  }, [onClose, onAddDoctor]);

  const updateSnapState = (nextState) => {
    currentSnapState.current = nextState;
  };

  const animateTo = (toValue, callback) => {
    Animated.spring(translateY, {
      toValue,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start(callback);
  };

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      updateSnapState('HALF');
      translateY.setValue(SNAP_CLOSED);
      backdropOpacity.setValue(0);

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
      isClosingRef.current = false;
      updateSnapState('HALF');
    }
  }, [visible, translateY, backdropOpacity]);

  const closeModal = (afterClose = null) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SNAP_CLOSED,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) {
        isClosingRef.current = false;
        return;
      }
      onCloseRef.current?.();
      afterClose?.();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        const { dx, dy } = gesture;
        if (Math.abs(dy) < 8 || Math.abs(dy) < Math.abs(dx)) return false;
        if (currentSnapState.current === 'HALF') return true;
        return scrollOffsetRef.current <= 0 && dy > 0;
      },
      onPanResponderGrant: () => {
        translateY.stopAnimation();
        translateY.extractOffset();
      },
      onPanResponderMove: (_, gesture) => {
        const isHalf = currentSnapState.current === 'HALF';
        if (isHalf) {
          const nextY = Math.max(SNAP_FULL, Math.min(SNAP_CLOSED, SNAP_HALF + gesture.dy));
          translateY.setValue(nextY - SNAP_HALF);
        } else if (gesture.dy > 0 && scrollOffsetRef.current <= 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        translateY.flattenOffset();
        const { dy, vy } = gesture;
        const isHalf = currentSnapState.current === 'HALF';

        if (isHalf) {
          if (dy < -60 || vy < -0.35) {
            updateSnapState('FULL');
            animateTo(SNAP_FULL);
          } else if (dy > 100 || vy > 0.5) {
            closeModal();
          } else {
            updateSnapState('HALF');
            animateTo(SNAP_HALF);
          }
        } else {
          if (dy > 100 || vy > 0.5) {
            updateSnapState('HALF');
            animateTo(SNAP_HALF);
          } else {
            updateSnapState('FULL');
            animateTo(SNAP_FULL);
          }
        }
      },
      onPanResponderTerminate: () => {
        translateY.flattenOffset();
        animateTo(currentSnapState.current === 'FULL' ? SNAP_FULL : SNAP_HALF);
      },
    })
  ).current;

  const handleScroll = (event) => {
    scrollOffsetRef.current = Math.max(0, event.nativeEvent.contentOffset.y);
  };

  const getInitials = (name) => {
    if (!name) return 'D';
    const parts = name.replace(/^Dr\.\s*/i, '').trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0] || 'D').slice(0, 2).toUpperCase();
  };

  const handleAttachDoctor = () => {
    closeModal(() => {
      onAddDoctorRef.current?.();
    });
  };

  if (!visible) return null;

  return (
    <Modal animationType="none" transparent visible={visible} statusBarTranslucent onRequestClose={() => closeModal()}>
      <View style={styles.overlayContainer}>
        <TouchableWithoutFeedback onPress={() => closeModal()}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheetContainer, { transform: [{ translateY }] }]}>
          <View style={styles.dragHandleZone} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Shifokorlar</Text>
              <Text style={styles.headerSubtitle}>Klinika jamoasi ({STATIC_DOCTORS.length} ta mutaxassis)</Text>
            </View>
            <TouchableOpacity onPress={() => closeModal()} style={styles.closeButton} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <Award size={14} color="#0284C7" />
              <Text style={styles.summaryText}>Oliy toifa</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Clock size={14} color="#16A34A" />
              <Text style={styles.summaryText}>5 ta faol</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Star size={14} color="#EAB308" fill="#EAB308" />
              <Text style={styles.summaryText}>4.8 o'rtacha</Text>
            </View>
          </View>

          <ScrollView
            style={styles.listScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 70 }]}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            nestedScrollEnabled
          >
            <View style={styles.doctorsList}>
              {STATIC_DOCTORS.map((doc) => {
                const isOff = doc.status === 'off';
                return (
                  <View key={doc.id} style={styles.doctorCard}>
                    <View style={[styles.avatarContainer, { backgroundColor: doc.bg }]}>
                      <Text style={[styles.avatarText, { color: doc.color }]}>{getInitials(doc.name)}</Text>
                    </View>
                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorName} numberOfLines={1}>{doc.name}</Text>
                      <View style={[styles.specialtyBadge, { backgroundColor: doc.badgeBg }]}>
                        <Text style={[styles.specialtyBadgeText, { color: doc.badgeText }]} numberOfLines={1}>
                          {doc.specialty}
                        </Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Text style={styles.doctorExperience} numberOfLines={1}>{doc.experience}</Text>
                        <Text style={styles.dotDivider}>•</Text>
                        <Star size={12} color="#EAB308" fill="#EAB308" style={styles.starIcon} />
                        <Text style={styles.ratingText}>{doc.rating.toFixed(1)}</Text>
                        <Text style={styles.reviewsText}>({doc.reviewsCount})</Text>
                      </View>
                    </View>
                    <View style={styles.rightActionContainer}>
                      <View style={[styles.activeBadge, isOff && styles.offBadge]}>
                        <View style={[styles.activeDot, isOff && styles.offDot]} />
                        <Text style={[styles.activeText, isOff && styles.offText]} numberOfLines={1}>
                          {doc.statusLabel}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={[styles.fixedFooterContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity style={styles.attachButton} onPress={handleAttachDoctor} activeOpacity={0.85}>
              <UserPlus size={18} color="#FFFFFF" style={styles.attachIcon} />
              <Text style={styles.attachButtonText}>Yangi doktor biriktirish</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000' },
  sheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  dragHandleZone: { width: '100%', height: 28, alignItems: 'center', justifyContent: 'center' },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTextContainer: { flex: 1, paddingRight: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  headerSubtitle: { fontSize: 11, color: '#64748B', marginTop: 2 },
  closeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderRadius: 10 },
  summaryBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#F8FAFC', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryText: { fontSize: 11, fontWeight: '600', color: '#334155' },
  summaryDivider: { width: 1, height: 14, backgroundColor: '#E2E8F0' },
  listScroll: { flex: 1 },
  scrollContent: { paddingTop: 4 },
  doctorsList: { gap: 10 },
  doctorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  avatarContainer: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },
  doctorInfo: { flex: 1, minWidth: 0, marginLeft: 10, marginRight: 6 },
  doctorName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  specialtyBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 3 },
  specialtyBadgeText: { fontSize: 9, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  doctorExperience: { fontSize: 10, color: '#64748B' },
  dotDivider: { fontSize: 10, color: '#94A3B8', marginHorizontal: 3 },
  starIcon: { marginRight: 2 },
  ratingText: { fontSize: 10, fontWeight: '700', color: '#0F172A' },
  reviewsText: { fontSize: 9, color: '#94A3B8', marginLeft: 2 },
  rightActionContainer: { alignItems: 'flex-end', justifyContent: 'center' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0' },
  activeDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#10B981', marginRight: 4 },
  activeText: { fontSize: 9, fontWeight: '700', color: '#10B981' },
  offBadge: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  offDot: { backgroundColor: '#94A3B8' },
  offText: { color: '#64748B' },
  fixedFooterContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  attachButton: { height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', borderRadius: 12 },
  attachIcon: { marginRight: 6 },
  attachButtonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});

export default DoctorsModal;