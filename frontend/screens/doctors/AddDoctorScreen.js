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
import { X, UserPlus, Star, Check } from 'lucide-react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SNAP_HALF = SCREEN_HEIGHT * 0.55;
const SNAP_FULL = 0;
const SNAP_CLOSED = SCREEN_HEIGHT;

const STATIC_DOCTORS = [
  {
    id: '1',
    name: 'Dr. Aziz Karimov',
    specialty: 'Stomatolog-terapevt',
    experience: '12 yillik tajriba',
    rating: 4.9,
    bg: '#E0F2FE',
    color: '#0284C7',
    badgeBg: '#F0F9FF',
    badgeText: '#0369A1',
  },
  {
    id: '2',
    name: 'Dr. Malika Yusupova',
    specialty: 'Ortodont',
    experience: '8 yillik tajriba',
    rating: 4.8,
    bg: '#F3E8FF',
    color: '#7C3AED',
    badgeBg: '#FAF5FF',
    badgeText: '#6D28D9',
  },
  {
    id: '3',
    name: 'Dr. Sardor Rahimov',
    specialty: 'Jarroh-implantolog',
    experience: '15 yillik tajriba',
    rating: 5.0,
    bg: '#FEF3C7',
    color: '#D97706',
    badgeBg: '#FFFBEB',
    badgeText: '#B45309',
  },
  {
    id: '4',
    name: 'Dr. Nigora Alimova',
    specialty: 'Bolalar stomatologi',
    experience: '6 yillik tajriba',
    rating: 4.7,
    bg: '#FFEDD5',
    color: '#EA580C',
    badgeBg: '#FFF7ED',
    badgeText: '#C2410C',
  },
  {
    id: '5',
    name: 'Dr. Jamshid Ergashev',
    specialty: 'Ortoped-protezist',
    experience: '10 yillik tajriba',
    rating: 4.9,
    bg: '#DCFCE7',
    color: '#16A34A',
    badgeBg: '#F0FDF4',
    badgeText: '#15803D',
  },
];

const AddDoctorScreen = ({ visible, onClose, onAddDoctor, clinic }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SNAP_CLOSED)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [snapState, setSnapState] = useState('HALF');
  const snapStateRef = useRef(snapState);
  snapStateRef.current = snapState;

  const [selectedDoctorId, setSelectedDoctorId] = useState(null);

  useEffect(() => {
    if (visible) {
      setSnapState('HALF');
      setSelectedDoctorId(null);
      translateY.setValue(SNAP_CLOSED);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: SNAP_HALF,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.45,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateY.setValue(SNAP_CLOSED);
      backdropOpacity.setValue(0);
    }
  }, [visible, translateY, backdropOpacity]);

  const handleClose = () => {
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
    ]).start(() => {
      onClose?.();
    });
  };

  const animateTo = (toValue, nextState) => {
    if (nextState) setSnapState(nextState);
    Animated.spring(translateY, {
      toValue,
      tension: 70,
      friction: 12,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,

      onPanResponderGrant: () => {
        translateY.extractOffset();
      },

      onPanResponderMove: Animated.event([null, { dy: translateY }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const { dy, vy } = gestureState;
        const current = snapStateRef.current;

        if (current === 'HALF') {
          if (dy < -60 || vy < -0.3) {
            animateTo(SNAP_FULL, 'FULL');
          } else if (dy > 80 || vy > 0.4) {
            handleClose();
          } else {
            animateTo(SNAP_HALF, 'HALF');
          }
        } else {
          if (dy > 100 || vy > 0.4) {
            animateTo(SNAP_HALF, 'HALF');
          } else {
            animateTo(SNAP_FULL, 'FULL');
          }
        }
      },
    })
  ).current;

  const getInitials = (name) => {
    if (!name) return 'D';
    const parts = name.replace(/^Dr\.\s*/i, '').trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0] || 'D').slice(0, 2).toUpperCase();
  };

  const handleAttachDoctor = () => {
    handleClose();
    onAddDoctor?.(selectedDoctorId);
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlayContainer}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [
                {
                  translateY: translateY.interpolate({
                    inputRange: [SNAP_FULL, SNAP_CLOSED],
                    outputRange: [SNAP_FULL, SNAP_CLOSED],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          {/* Silliq surish uchun zona (PanResponder faqat shunga berildi) */}
          <View style={styles.dragZone} {...panResponder.panHandlers}>
            <View style={styles.dragHandleZone}>
              <View style={styles.dragHandle} />
            </View>

            <View style={styles.header}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Shifokor qo'shish</Text>
                <Text style={styles.headerSubtitle}>Klinikaga yangi mutaxassisni biriktiring</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ScrollView ishlashi uchun qulay tarkib */}
          <ScrollView
            scrollEnabled={snapState === 'FULL'}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}
            bounces={false}
            nestedScrollEnabled
          >
            <View style={styles.doctorsList}>
              {STATIC_DOCTORS.map((doc) => {
                const isSelected = selectedDoctorId === doc.id;
                return (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.doctorCard, isSelected && styles.doctorCardSelected]}
                    onPress={() => setSelectedDoctorId(doc.id)}
                    activeOpacity={0.85}
                  >
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
                        <Text style={styles.doctorExperience}>{doc.experience}</Text>
                        <Text style={styles.dotDivider}>•</Text>
                        <Star size={12} color="#EAB308" fill="#EAB308" style={styles.starIcon} />
                        <Text style={styles.ratingText}>{doc.rating.toFixed(1)}</Text>
                      </View>
                    </View>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Pastdagi qat'iy tugma */}
          <View style={[styles.fixedFooterContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={[styles.attachButton, !selectedDoctorId && styles.attachButtonDisabled]}
              onPress={handleAttachDoctor}
              disabled={!selectedDoctorId}
              activeOpacity={0.85}
            >
              <UserPlus size={18} color="#FFFFFF" style={styles.attachIcon} />
              <Text style={styles.attachButtonText}>Shifokorni tasdiqlash</Text>
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
    height: SCREEN_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  dragZone: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  dragHandleZone: { width: '100%', height: 28, alignItems: 'center', justifyContent: 'center' },
  dragHandle: { width: 44, height: 5, borderRadius: 2.5, backgroundColor: '#CBD5E1' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTextContainer: { flex: 1, paddingRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: '500' },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderRadius: 12 },
  listScroll: { flex: 1 },
  scrollContent: { paddingTop: 4 },
  doctorsList: { gap: 12 },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  doctorCardSelected: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  avatarContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  doctorInfo: { flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 },
  doctorName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  specialtyBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  specialtyBadgeText: { fontSize: 10, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  doctorExperience: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  dotDivider: { fontSize: 11, color: '#94A3B8', marginHorizontal: 6 },
  starIcon: { marginRight: 3 },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCircleSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  fixedFooterContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  attachButton: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  attachButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  attachIcon: { marginRight: 8 },
  attachButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

export default AddDoctorScreen;