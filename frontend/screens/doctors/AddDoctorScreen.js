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
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, UserPlus, Star, Award, Clock } from 'lucide-react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24);

const SNAP_FULL = STATUS_BAR_HEIGHT + 8;
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
    color: '#087FC1',
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
  const [scrollOffset, setScrollOffset] = useState(0);

  const scrollOffsetRef = useRef(scrollOffset);
  scrollOffsetRef.current = scrollOffset;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: SNAP_FULL,
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
  }, [visible, backdropOpacity, translateY]);

  const handleClose = (afterClose) => {
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
      if (typeof afterClose === 'function') {
        afterClose();
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return scrollOffsetRef.current <= 0 && gestureState.dy > 10;
      },
      onPanResponderGrant: () => {
        translateY.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const { dy, vy } = gestureState;

        if (dy > 120 || vy > 0.4) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: SNAP_FULL,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const getInitials = (name) => {
    if (!name) return 'D';
    const parts = name.replace('Dr. ', '').trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const handleAttachDoctor = () => {
    handleClose(onAddDoctor);
  };

  const renderDoctorItem = ({ item: doc }) => {
    const isOff = doc.status === 'off';
    return (
      <View style={styles.doctorCard}>
        <View style={[styles.avatarContainer, { backgroundColor: doc.bg }]}>
          <Text style={[styles.avatarText, { color: doc.color }]}>
            {getInitials(doc.name)}
          </Text>
        </View>

        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doc.name}</Text>
          <View style={[styles.specialtyBadge, { backgroundColor: doc.badgeBg }]}>
            <Text style={[styles.specialtyBadgeText, { color: doc.badgeText }]}>
              {doc.specialty}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.doctorExperience}>{doc.experience}</Text>
            <Text style={styles.dotDivider}>•</Text>
            <Star size={12} color="#EAB308" fill="#EAB308" style={styles.starIcon} />
            <Text style={styles.ratingText}>{doc.rating.toFixed(1)}</Text>
            <Text style={styles.reviewsText}>({doc.reviewsCount})</Text>
          </View>
        </View>

        <View style={styles.rightActionContainer}>
          <View style={[styles.activeBadge, isOff && styles.offBadge]}>
            <View style={[styles.activeDot, isOff && styles.offDot]} />
            <Text style={[styles.activeText, isOff && styles.offText]}>
              {doc.statusLabel}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal animationType="none" transparent={true} visible={visible} onRequestClose={() => handleClose()}>
      <View style={styles.overlayContainer}>
        <TouchableWithoutFeedback onPress={() => handleClose()}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheetContainer, { transform: [{ translateY }] }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandleZone} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Shifokorlar</Text>
              <Text style={styles.headerSubtitle}>
                Klinika jamoasi ({STATIC_DOCTORS.length} ta mutaxassis)
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleClose()} style={styles.closeButton}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Quick Summary Bar */}
          <View style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <Award size={14} color="#087FC1" />
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
              <Text style={styles.summaryText}>4.8 O'rtacha</Text>
            </View>
          </View>

          {/* Doctors List */}
          <FlatList
            data={STATIC_DOCTORS}
            keyExtractor={(item) => item.id}
            renderItem={renderDoctorItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onScroll={(e) => setScrollOffset(e.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
          />

          {/* Fixed Footer Button */}
          <View style={[styles.fixedFooterContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handleAttachDoctor}
              activeOpacity={0.85}
            >
              <UserPlus size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.attachButtonText}>Yangi doktor biriktirish</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
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
    bottom: 0,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
  },
  dragHandleZone: {
    width: '100%',
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#13243A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#73839A',
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  summaryDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0',
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 150, // <-- Oxirgi element tugma tagida qolib ketmasligi uchun oshirildi
    gap: 12,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#17324F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#13243A',
  },
  specialtyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 3,
  },
  specialtyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  doctorExperience: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  dotDivider: {
    fontSize: 11,
    color: '#94A3B8',
    marginHorizontal: 4,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#13243A',
  },
  reviewsText: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 2,
  },
  rightActionContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  activeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  offBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  offDot: {
    backgroundColor: '#94A3B8',
  },
  offText: {
    color: '#64748B',
  },
  fixedFooterContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#087FC1',
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#087FC1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  attachButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default DoctorsModal;