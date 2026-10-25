import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BriefcaseMedical, Star, UserPlus, X } from 'lucide-react-native';

const DoctorsModal = ({ visible, onClose, onAddDoctor, doctors = [] }) => {
  const insets = useSafeAreaInsets();

  const getInitials = (name = '') =>
    name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || 'D';

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Oynani yopish" onPress={onClose} style={styles.backdrop} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <View style={styles.headingCopy}>
              <Text style={styles.eyebrow}>KLINIKA JAMOASI</Text>
              <Text style={styles.title}>Shifokorlar</Text>
              <Text style={styles.subtitle}>{doctors.length} nafar mutaxassis</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Yopish" onPress={onClose} style={styles.closeButton}>
              <X size={19} color="#526870" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {doctors.length ? doctors.map((doctor, index) => (
              <View key={doctor.id || `${doctor.name}-${index}`} style={styles.doctorCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(doctor.name)}</Text>
                </View>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName} numberOfLines={1}>{doctor.name}</Text>
                  <View style={styles.specialtyRow}>
                    <BriefcaseMedical size={13} color="#0E7C86" />
                    <Text style={styles.specialty} numberOfLines={1}>{doctor.specialty}</Text>
                  </View>
                  {!!doctor.experience && <Text style={styles.experience}>{doctor.experience}</Text>}
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{doctor.statusLabel || 'Faol'}</Text>
                </View>
              </View>
            )) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}><Star size={22} color="#0E7C86" /></View>
                <Text style={styles.emptyTitle}>Hozircha shifokor yo‘q</Text>
                <Text style={styles.emptyText}>Birinchi mutaxassisni qo‘shib, klinika jamoasini shakllantiring.</Text>
              </View>
            )}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            onPress={onAddDoctor}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <UserPlus size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Yangi shifokor qo‘shish</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(9, 28, 35, 0.42)' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    maxHeight: '86%',
    minHeight: '48%',
    backgroundColor: '#F6F9FA',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 22,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headingCopy: { flex: 1 },
  eyebrow: { color: '#0E7C86', fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#12313A', fontSize: 23, fontWeight: '800', marginTop: 4 },
  subtitle: { color: '#71848B', fontSize: 12, marginTop: 3 },
  closeButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#E8EFF0', alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 16, flexGrow: 1 },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E5ECEE',
    padding: 13,
    marginBottom: 10,
  },
  avatar: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#DDF1EF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0E7C86', fontSize: 14, fontWeight: '800' },
  doctorInfo: { flex: 1, minWidth: 0, marginHorizontal: 11 },
  doctorName: { color: '#17303F', fontSize: 14, fontWeight: '800' },
  specialtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  specialty: { color: '#577078', fontSize: 11, marginLeft: 5, flexShrink: 1 },
  experience: { color: '#91A1A6', fontSize: 10, marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F6EF', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16865D', marginRight: 5 },
  statusText: { color: '#16865D', fontSize: 9, fontWeight: '700' },
  emptyState: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#DDF1EF', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#17303F', fontSize: 16, fontWeight: '800', marginTop: 14 },
  emptyText: { color: '#71848B', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },
  addButton: { minHeight: 50, borderRadius: 15, backgroundColor: '#0E7C86', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  pressed: { opacity: 0.88 },
  addButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});

export default DoctorsModal;