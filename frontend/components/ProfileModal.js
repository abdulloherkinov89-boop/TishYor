import React from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, LogOut, Phone, ShieldCheck, UserRound, X } from 'lucide-react-native';

const BLUE = '#0083CA';

function formatJoinDate(dateValue) {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'T';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function ProfileModal({
  visible,
  onClose,
  user,
  userName,
  userInitials,
  userPhone,
  userJoinDate,
  onLogout,
}) {
  const insets = useSafeAreaInsets();

  const resolvedName =
    user?.name ||
    [user?.ism, user?.familiya].filter(Boolean).join(' ').trim() ||
    userName ||
    'Foydalanuvchi';
  const resolvedInitials = userInitials || getInitials(resolvedName);
  const resolvedRole =
    user?.role === 'clinic' || user?.role === 'Klinika' ? 'Klinika' : 'Bemor';
  const resolvedPhone = userPhone || user?.telefon || 'Ko‘rsatilmagan';
  const resolvedJoinDate = formatJoinDate(userJoinDate || user?.created_at);

  const handleLogoutPress = () => {
    if (!onLogout) return;

    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm('Hisobdan chiqmoqchimisiz?')
          : true;
      if (confirmed) {
        onClose?.();
        onLogout();
      }
      return;
    }

    Alert.alert('Hisobdan chiqish', 'Haqiqatan ham hisobdan chiqmoqchimisiz?', [
      { text: 'Bekor qilish', style: 'cancel' },
      {
        text: 'Chiqish',
        style: 'destructive',
        onPress: () => {
          onClose?.();
          onLogout();
        },
      },
    ]);
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={Boolean(visible)}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profil oynasini yopish"
          onPress={onClose}
          style={styles.backdrop}
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profil</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Yopish"
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.75}
            >
              <X size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          <View style={styles.identityCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{resolvedInitials}</Text>
            </View>
            <View style={styles.identityCopy}>
              <Text style={styles.nameText} numberOfLines={1}>
                {resolvedName}
              </Text>
              <View style={styles.roleBadge}>
                <ShieldCheck size={13} color={BLUE} />
                <Text style={styles.roleText}>{resolvedRole}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <UserRound size={17} color={BLUE} />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Hisob turi</Text>
                <Text style={styles.infoValue}>{resolvedRole}</Text>
              </View>
            </View>

            <View style={[styles.infoRow, resolvedJoinDate ? styles.infoRowBorder : null]}>
              <View style={styles.infoIcon}>
                <Phone size={17} color={BLUE} />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Telefon raqam</Text>
                <Text style={styles.infoValue}>{resolvedPhone}</Text>
              </View>
            </View>

            {resolvedJoinDate ? (
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <View style={styles.infoIcon}>
                  <Calendar size={17} color={BLUE} />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Qo‘shilgan sana</Text>
                  <Text style={styles.infoValue}>{resolvedJoinDate}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {onLogout ? (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogoutPress}
              activeOpacity={0.8}
            >
              <LogOut size={18} color="#DC2626" />
              <Text style={styles.logoutText}>Hisobdan chiqish</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  identityCopy: {
    flex: 1,
  },
  nameText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '700',
  },
  infoList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  logoutButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
});
