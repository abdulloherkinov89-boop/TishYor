import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Image,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BriefcaseMedical,
  Check,
  Clock3,
  UserRound,
  X,
  ChevronDown,
  Plus,
  Camera,
  Award,
  Trash2,
  Phone,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiFetch } from '../../utils/api';

// Narxni "550 000 so'm" ko'rinishida chiqarish
const formatSom = (v) =>
  `${String(Math.round(Number(v) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;

// Backend javobini ekrandagi shifokor ko'rinishiga o'tkazish
const mapDoctor = (d) => ({
  id: String(d.id),
  name: d.name,
  phone: d.telefon,
  specialty: d.specialty,
  price: formatSom(d.price),
  experience: d.experience || 'Tajriba ko‘rsatilmagan',
  photo: d.photo_url,
});

const errorText = async (res) => {
  try {
    const p = await res.json();
    if (typeof p.detail === 'string') return p.detail;
  } catch (e) {}
  return 'So‘rovni bajarib bo‘lmadi.';
};

// O'zbekiston raqamlarini avtomatik formatlash funksiyasi
const formatUzbekPhoneNumber = (text) => {
  const cleaned = text.replace(/\D/g, '');

  let formattedNumber = cleaned;
  if (!cleaned.startsWith('998')) {
    if (cleaned.length > 0) {
      formattedNumber = '998' + cleaned;
    }
  }

  const truncated = formattedNumber.slice(0, 12);

  let result = '';
  if (truncated.length > 0) {
    result += '+' + truncated.slice(0, 3);
  }
  if (truncated.length > 3) {
    result += ' ' + truncated.slice(3, 5);
  }
  if (truncated.length > 5) {
    result += ' ' + truncated.slice(5, 8);
  }
  if (truncated.length > 8) {
    result += ' ' + truncated.slice(8, 10);
  }
  if (truncated.length > 10) {
    result += ' ' + truncated.slice(10, 12);
  }

  return result;
};

const AddDoctorScreen = ({ visible = true, onClose, onAddDoctor, navigation }) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width <= 360;

  // navigate('AddDoctor') bilan ochilganda onClose kelmaydi — orqaga qaytamiz
  const close = onClose || (() => navigation?.goBack?.());

  const [viewMode, setViewMode] = useState('empty');

  const [doctors, setDoctors] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSpecialtyObj, setSelectedSpecialtyObj] = useState(null);
  const [experience, setExperience] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoMime, setPhotoMime] = useState('image/jpeg');
  const [saving, setSaving] = useState(false);

  // Dropdown uchun modal holati
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Backenddan keladigan xizmatlar (mutaxassislik + narx)
  const [services, setServices] = useState([]);

  const loadServices = async () => {
    try {
      const res = await apiFetch('/clinics/services/me');
      if (res?.ok) {
        const list = await res.json();
        setServices(list.filter((s) => s.active));
      }
    } catch (e) {}
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/clinics/doctors/me');
        if (res?.ok) {
          const list = (await res.json()).map(mapDoctor);
          setDoctors(list);
          setViewMode(list.length ? 'list' : 'empty');
        }
      } catch (e) {}
    })();
    loadServices();
  }, []);

  const uploadPhoto = async () => {
    const res = await apiFetch('/clinics/doctors/upload-photo', {
      method: 'POST',
      body: JSON.stringify({ image_base64: photoBase64, content_type: photoMime }),
    });
    if (!res.ok) throw new Error(await errorText(res));
    return (await res.json()).photo_url;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatUzbekPhoneNumber(text);
    setPhone(formatted);
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Ruxsat berilmadi", "Rasmlarni tanlash uchun galereyaga kirishga ruxsat berishingiz kerak.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      setPhotoBase64(asset.base64 || null);
      setPhotoMime(asset.mimeType || 'image/jpeg');
    }
  };

  const handleSubmit = async () => {
    if (saving) return;
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !selectedSpecialtyObj || !cleanPhone) {
      Alert.alert('Ma’lumot yetarli emas', 'Shifokor ismi, telefon raqami va mutaxassisligini tanlang.');
      return;
    }

    if (cleanPhone.replace(/\D/g, '').length < 12) {
      Alert.alert('Xato telefon raqam', 'Iltimos, telefon raqamini to‘liq kiriting (+998 XX XXX XX XX).');
      return;
    }

    setSaving(true);
    try {
      const photo_url = photoBase64 ? await uploadPhoto() : null;
      const res = await apiFetch('/clinics/doctors', {
        method: 'POST',
        body: JSON.stringify({
          name: cleanName,
          telefon: cleanPhone.replace(/\s/g, ''),
          service_id: selectedSpecialtyObj.id,
          experience: experience.trim() || null,
          photo_url,
        }),
      });
      if (!res.ok) throw new Error(await errorText(res));

      const saved = mapDoctor(await res.json());
      await onAddDoctor?.(saved);
      setDoctors((prev) => [saved, ...prev]);

      setName('');
      setPhone('');
      setSelectedSpecialtyObj(null);
      setExperience('');
      setPhotoUri(null);
      setPhotoBase64(null);
      setViewMode('list');
    } catch (error) {
      Alert.alert('Saqlanmadi', error?.message || 'Shifokorni saqlashda xatolik yuz berdi. Qayta urinib ko‘ring.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoctor = (id) => {
    Alert.alert(
      "O'chirish",
      "Haqiqatan ham ushbu shifokorni o'chirmoqchimisiz?",
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "O'chirish",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiFetch(`/clinics/doctors/${id}`, { method: 'DELETE' });
              if (!res.ok) throw new Error(await errorText(res));
              const updated = doctors.filter((doc) => doc.id !== id);
              setDoctors(updated);
              if (updated.length === 0) {
                setViewMode('empty');
              }
            } catch (e) {
              Alert.alert('Xatolik', e?.message || 'Shifokorni o‘chirib bo‘lmadi.');
            }
          },
        },
      ]
    );
  };

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      const rawNumber = phoneNumber.replace(/\s+/g, '');
      Linking.openURL(`tel:${rawNumber}`);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ortga"
            onPress={() => {
              if (viewMode === 'form') setViewMode(doctors.length > 0 ? 'list' : 'empty');
              else close();
            }}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color="#12313A" />
          </Pressable>
          <Text style={styles.topTitle}>Klinika shifokorlari</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Yopish" onPress={close} style={styles.closeButton}>
            <X size={19} color="#647780" />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* 1. BO'SH HOLAT */}
          {viewMode === 'empty' && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <BriefcaseMedical size={38} color="#0E7C86" />
              </View>
              <Text style={styles.emptyTitle}>Hali shifokor qo‘shilmagan</Text>
              <Text style={styles.emptySubtitle}>
                Klinika jamoasini shakllantirish uchun pastdagi tugmani bosing va mutaxassis qo‘shing.
              </Text>
            </View>
          )}

          {/* 2. SHIFOKORLAR RO'YXATI */}
          {viewMode === 'list' && (
            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.listHeaderRow}>
                <View>
                  <Text style={styles.sectionHeaderTitle}>Jamoa a'zolari</Text>
                  <Text style={styles.sectionSubtitle}>Mavjud mutaxassislar ro'yxati</Text>
                </View>
                <View style={styles.badgeContainer}>
                  <Text style={styles.listCountBadge}>{doctors.length} nafar</Text>
                </View>
              </View>

              {doctors.map((doc) => (
                <View key={doc.id} style={styles.doctorItemCard}>
                  {/* Yuqori qator: Avatar, Ism, Tel, Tajriba + O'chirish tugmasi */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.docLeftSection}>
                      <View style={styles.avatarWrapper}>
                        {doc.photo ? (
                          <Image source={{ uri: doc.photo }} style={styles.docAvatarImage} />
                        ) : (
                          <View style={styles.docAvatar}>
                            <UserRound size={26} color="#0E7C86" />
                          </View>
                        )}
                      </View>

                      <View style={styles.docInfo}>
                        <Text style={styles.docName} numberOfLines={1} ellipsizeMode="tail">
                          {doc.name}
                        </Text>

                        <TouchableOpacity
                          style={styles.phoneRow}
                          onPress={() => handleCall(doc.phone)}
                          activeOpacity={0.7}
                        >
                          <Phone size={13} color="#0E7C86" />
                          <Text style={styles.docPhone} numberOfLines={1} ellipsizeMode="tail">
                            {doc.phone}
                          </Text>
                        </TouchableOpacity>

                        <View style={styles.experienceRow}>
                          <Clock3 size={13} color="#82949B" />
                          <Text style={styles.docExperience} numberOfLines={1} ellipsizeMode="tail">
                            Tajriba: {doc.experience}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteDoctor(doc.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={18} color="#E53935" />
                    </TouchableOpacity>
                  </View>

                  {/* Pastki qator: Mutaxassislik va Narx */}
                  <View style={styles.cardBottomRow}>
                    <View style={styles.specialtyBadge}>
                      <Award size={13} color="#0E7C86" style={{ marginRight: 4 }} />
                      <Text style={styles.docSpecialty} numberOfLines={2} ellipsizeMode="tail">
                        {doc.specialty}
                      </Text>
                    </View>
                    <View style={styles.priceBadge}>
                      <Text style={styles.docPriceText} numberOfLines={1} ellipsizeMode="tail">
                        {doc.price}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* 3. DOKTOR QO'SHISH FORMASI */}
          {viewMode === 'form' && (
            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.formCard, isSmallScreen && { padding: 12 }]}>
                <Text style={styles.sectionTitle}>Shifokor ma’lumotlari</Text>

                <View style={styles.photoUploadContainer}>
                  <TouchableOpacity style={styles.photoBox} onPress={handlePickImage} activeOpacity={0.8}>
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.uploadedImage} />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Camera size={24} color="#0E7C86" />
                      </View>
                    )}
                    <View style={styles.cameraBadge}>
                      <Plus size={12} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handlePickImage}>
                    <Text style={styles.photoUploadText}>
                      {photoUri ? "Rasmni o'zgartirish" : "Doktor rasmini yuklash"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ISM-FAMILIYA */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Ism-familiya <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputWrap}>
                    <UserRound size={18} color="#82949B" />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Masalan, Aziz Karimov"
                      placeholderTextColor="#9AABB0"
                      style={styles.input}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* TELEFON RAQAM */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Telefon raqami <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputWrap}>
                    <Phone size={18} color="#82949B" />
                    <TextInput
                      value={phone}
                      onChangeText={handlePhoneChange}
                      placeholder="+998 90 123 45 67"
                      placeholderTextColor="#9AABB0"
                      style={styles.input}
                      keyboardType="number-pad"
                      maxLength={17}
                    />
                  </View>
                </View>

                {/* MUTAXASSISLIK SELECTOR */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Mutaxassisligi va narxi <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity
                    style={styles.inputWrap}
                    onPress={() => { loadServices(); setDropdownOpen(true); }}
                    activeOpacity={0.8}
                  >
                    <BriefcaseMedical size={18} color="#82949B" />
                    <Text
                      style={[styles.inputDropdownText, !selectedSpecialtyObj && { color: '#9AABB0' }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {selectedSpecialtyObj ? `${selectedSpecialtyObj.name} (${formatSom(selectedSpecialtyObj.price)})` : 'Mutaxassislikni tanlang'}
                    </Text>
                    <ChevronDown size={18} color="#82949B" />
                  </TouchableOpacity>
                </View>

                {/* TAJRIBA */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Tajriba <Text style={styles.optional}>(ixtiyoriy)</Text></Text>
                  <View style={styles.inputWrap}>
                    <Clock3 size={18} color="#82949B" />
                    <TextInput
                      value={experience}
                      onChangeText={setExperience}
                      placeholder="Masalan, 5 yil"
                      placeholderTextColor="#9AABB0"
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          {/* PASTKI TUGMA */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {viewMode === 'form' ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleSubmit}
                disabled={saving}
                style={({ pressed }) => [styles.submitButton, (pressed || saving) && styles.submitPressed]}
              >
                {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Check size={19} color="#FFFFFF" />}
                <Text style={styles.submitText}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => { loadServices(); setViewMode('form'); }}
                style={({ pressed }) => [styles.submitButton, pressed && styles.submitPressed]}
              >
                <Plus size={19} color="#FFFFFF" />
                <Text style={styles.submitText}>Yangi doktor qo‘shish</Text>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>

        {/* MUTAXASSISLIK VA NARXNI TANLASH UCHUN MODAL POPUP */}
        <Modal
          visible={dropdownOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDropdownOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDropdownOpen(false)}
          >
            <View style={[styles.modalContent, { maxHeight: height * 0.6 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Mutaxassislik va narx</Text>
                <TouchableOpacity onPress={() => setDropdownOpen(false)}>
                  <X size={20} color="#647780" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {services.length === 0 && (
                  <Text style={{ color: '#687C84', fontSize: 13, textAlign: 'center', padding: 18 }}>
                    Hali xizmat qo‘shilmagan. Avval “Xizmatlar va narxlar” bo‘limida xizmat qo‘shing.
                  </Text>
                )}
                {services.map((item) => {
                  const isSelected = selectedSpecialtyObj?.id === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                      onPress={() => {
                        setSelectedSpecialtyObj(item);
                        setDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {item.name}
                      </Text>
                      
                      <View style={styles.modalPriceBadge}>
                        <Text style={styles.modalPriceBadgeText} numberOfLines={1} ellipsizeMode="tail">
                          {formatSom(item.price)}
                        </Text>
                      </View>
                      
                      {isSelected && <Check size={18} color="#0E7C86" style={{ marginLeft: 8, flexShrink: 0 }} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7F8' },
  topBar: {
    minHeight: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7EEF0',
  },
  backButton: { width: 38, height: 38, alignItems: 'flex-start', justifyContent: 'center' },
  closeButton: { width: 38, height: 38, alignItems: 'flex-end', justifyContent: 'center' },
  topTitle: { color: '#12313A', fontSize: 16, fontWeight: '800' },
  content: { flex: 1 },
  scrollContent: { padding: 18 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 28, backgroundColor: '#E2F3F2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { color: '#12313A', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { color: '#687C84', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // List Styles
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderTitle: { color: '#12313A', fontSize: 18, fontWeight: '800' },
  sectionSubtitle: { color: '#7D8E95', fontSize: 12, fontWeight: '500', marginTop: 2 },
  badgeContainer: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  listCountBadge: { color: '#0E7C86', fontSize: 12, fontWeight: '700' },

  doctorItemCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6ECEE',
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F5',
    paddingTop: 10,
    gap: 8,
  },
  docLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
    flexShrink: 0,
  },
  docAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCE7E5',
  },
  docAvatarImage: {
    width: 54,
    height: 54,
    borderRadius: 18,
  },
  docInfo: { flex: 1, minWidth: 0 },
  docName: { color: '#12313A', fontSize: 15, fontWeight: '700', marginBottom: 4 },

  specialtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  docSpecialty: { color: '#0E7C86', fontSize: 12, fontWeight: '700', flexShrink: 1 },
  priceBadge: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  docPriceText: { color: '#0E7C86', fontSize: 12, fontWeight: '800' },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  docPhone: { color: '#0E7C86', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  experienceRow: { flexDirection: 'row', alignItems: 'center' },
  docExperience: { color: '#7D8E95', fontSize: 12, fontWeight: '500', marginLeft: 4 },

  deleteButton: {
    padding: 8,
    backgroundColor: '#FDF2F2',
    borderRadius: 10,
    flexShrink: 0,
  },

  // Form Styles
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E4ECEE',
  },
  sectionTitle: { color: '#18343D', fontSize: 15, fontWeight: '800', marginBottom: 16 },

  photoUploadContainer: { alignItems: 'center', marginBottom: 20 },
  photoBox: { width: 80, height: 80, borderRadius: 28, backgroundColor: '#F2F6F8', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 8, borderWidth: 1, borderColor: '#DCE6E8' },
  photoPlaceholder: { width: 80, height: 80, borderRadius: 28, backgroundColor: '#E6F4F3', justifyContent: 'center', alignItems: 'center' },
  uploadedImage: { width: 80, height: 80, borderRadius: 28 },
  cameraBadge: { position: 'absolute', right: -2, bottom: -2, backgroundColor: '#0E7C86', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  photoUploadText: { color: '#0E7C86', fontSize: 12, fontWeight: '700' },

  fieldGroup: { marginBottom: 16 },
  label: { color: '#334D56', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  required: { color: '#D34D43' },
  optional: { color: '#91A1A6', fontWeight: '500' },
  inputWrap: {
    minHeight: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#DCE6E8',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFDFD',
  },
  input: { flex: 1, paddingVertical: 12, paddingLeft: 10, color: '#17303F', fontSize: 14 },
  inputDropdownText: { flex: 1, paddingLeft: 10, color: '#17303F', fontSize: 14, fontWeight: '600' },

  // MODAL OVERLAY STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 49, 58, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F5',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#12313A',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFA',
  },
  modalOptionSelected: {
    backgroundColor: '#E6F4F3',
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#12313A',
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  modalOptionTextSelected: {
    color: '#0E7C86',
  },
  modalPriceBadge: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  modalPriceBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E7C86',
  },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E4ECEE', zIndex: 10 },
  submitButton: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: '#0E7C86',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  submitPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  submitReleased: { opacity: 1 },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});

export default AddDoctorScreen;