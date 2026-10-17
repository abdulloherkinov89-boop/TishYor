import React, { useRef, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  useWindowDimensions,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Switch,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '../../utils/api';
import {
  X,
  Plus,
  Search,
  Check,
  Trash2,
  Briefcase,
  Clock,
} from 'lucide-react-native';

const DOCTORS = [
  { id: 'd1', name: 'Dr. Aziz Karimov', initials: 'AK', color: '#E0F2FE', textColor: '#0369A1' },
  { id: 'd2', name: 'Dr. Malika Yusupova', initials: 'MY', color: '#FCE7F3', textColor: '#BE185D' },
  { id: 'd3', name: 'Dr. Sardor Rahimov', initials: 'SR', color: '#FEF3C7', textColor: '#B45309' },
  { id: 'd4', name: 'Dr. Nigora Alimova', initials: 'NA', color: '#DCFCE7', textColor: '#15803D' },
  { id: 'd5', name: 'Dr. Jamshid Ergashev', initials: 'JE', color: '#F3E8FF', textColor: '#6B21A8' },
  { id: 'd6', name: 'Dr. Dilnoza Umarova', initials: 'DU', color: '#FFEDD5', textColor: '#C2410C' },
];

const formatPrice = (value) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const XizmatQoshScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const snapFull = Math.max(
    insets.top,
    Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24),
  ) + 8;

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const isClosingRef = useRef(false);

  // Yangi klinika uchun boshlang'ich holatda xizmatlar ro'yxati BO'SH (bo'lib turishi uchun)
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [savingService, setSavingService] = useState(false);
  const [servicesError, setServicesError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // views: 'main' | 'custom_add' | 'edit'
  const [currentView, setCurrentView] = useState('main');

  // Custom add form state
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customDuration, setCustomDuration] = useState('');

  // Edit service state
  const [editingService, setEditingService] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editPriceFrom, setEditPriceFrom] = useState(false);
  const [editDuration, setEditDuration] = useState('');
  const [editDoctorIds, setEditDoctorIds] = useState([]);
  const [editActive, setEditActive] = useState(true);

  const getResponseError = async (response) => {
    let message = 'So‘rovni bajarib bo‘lmadi. Qayta urinib ko‘ring.';
    try {
      const payload = await response.json();
      if (typeof payload.detail === 'string') message = payload.detail;
    } catch (error) {
      // Javob JSON bo'lmasa, umumiy xabar ishlatiladi.
    }
    return message;
  };

  const loadServices = async (isActive = () => true) => {
    setLoadingServices(true);
    setServicesError('');
    setServices([]);
    try {
      const response = await apiFetch('/clinics/services/me');
      if (!response.ok) throw new Error(await getResponseError(response));
      const data = await response.json();
      if (isActive()) {
        setServices(data.map((service) => ({
          id: String(service.id),
          name: service.name,
          category: service.category || 'Asosiy xizmatlar',
          price: String(Number(service.price)),
          priceFrom: Boolean(service.price_from),
          duration: String(service.duration || '30'),
          doctorIds: [],
          active: Boolean(service.active),
        })));
      }
    } catch (error) {
      if (isActive()) setServicesError(error.message || 'Xizmatlarni yuklab bo‘lmadi.');
    } finally {
      if (isActive()) setLoadingServices(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      loadServices(() => isActive);
      return () => { isActive = false; };
    }, []),
  );

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: snapFull,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0.5,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [snapFull, screenHeight, translateY, backdropOpacity]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) navigation.goBack();
    });
  };

  // PanResponder to handle vertical drag gestures smoothly
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        let newY = snapFull + gestureState.dy;
        if (newY < snapFull) {
          newY = snapFull + (gestureState.dy * 0.2);
        }
        translateY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 0.8) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: snapFull,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Summary statistics
  const totalCount = services.length;
  const activeCount = services.filter((s) => s.active).length;
  const uniqueCategoriesCount = new Set(services.map((s) => s.category)).size;

  // Filtered services for main screen
  const filteredServices = services.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group services by category
  const groupedServices = filteredServices.reduce((acc, item) => {
    const cat = item.category || 'Asosiy xizmatlar';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const handleSaveCustomService = async () => {
    if (!customName.trim() || !customPrice.trim()) {
      Alert.alert('Xatolik', 'Xizmat nomi va narxini kiriting');
      return;
    }

    const price = Number(customPrice.replace(/\s/g, ''));
    if (!Number.isFinite(price) || price < 0) {
      Alert.alert('Xatolik', 'Xizmat narxini to‘g‘ri kiriting');
      return;
    }

    setSavingService(true);
    try {
      const response = await apiFetch('/clinics/services', {
        method: 'POST',
        body: JSON.stringify({
          name: customName.trim(),
          price,
          duration: customDuration.trim() || '30',
        }),
      });
      if (!response.ok) throw new Error(await getResponseError(response));
      const service = await response.json();
      const savedService = {
        id: String(service.id),
        name: service.name,
        category: service.category || 'Asosiy xizmatlar',
        price: String(Number(service.price)),
        priceFrom: Boolean(service.price_from),
        duration: String(service.duration || '30'),
        doctorIds: [],
        active: Boolean(service.active),
      };
      setServices((prev) => [savedService, ...prev]);
      setCustomName('');
      setCustomPrice('');
      setCustomDuration('');
      setCurrentView('main');
    } catch (error) {
      Alert.alert('Xatolik', error.message || 'Xizmatni saqlab bo‘lmadi.');
    } finally {
      setSavingService(false);
    }
  };

  const handleOpenEdit = (service) => {
    setEditingService(service);
    setEditPrice(formatPrice(service.price));
    setEditPriceFrom(service.priceFrom);
    setEditDuration(service.duration);
    setEditDoctorIds(service.doctorIds || []);
    setEditActive(service.active);
    setCurrentView('edit');
  };

  const handleUpdateService = async () => {
    if (!editPrice.trim()) {
      Alert.alert('Xatolik', 'Narx kiritilishi shart');
      return;
    }

    const price = Number(editPrice.replace(/\s/g, ''));
    if (!Number.isFinite(price) || price < 0) {
      Alert.alert('Xatolik', 'Xizmat narxini to‘g‘ri kiriting');
      return;
    }

    setSavingService(true);
    try {
      const response = await apiFetch(`/clinics/services/${editingService.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          price,
          price_from: editPriceFrom,
          duration: editDuration.trim() || '30',
          active: editActive,
        }),
      });
      if (!response.ok) throw new Error(await getResponseError(response));
      const service = await response.json();
      setServices((prev) => prev.map((item) => item.id === String(service.id)
        ? {
            ...item,
            price: String(Number(service.price)),
            priceFrom: Boolean(service.price_from),
            duration: String(service.duration || '30'),
            doctorIds: editDoctorIds,
            active: Boolean(service.active),
          }
        : item));
      setCurrentView('main');
    } catch (error) {
      Alert.alert('Xatolik', error.message || 'Xizmatni yangilab bo‘lmadi.');
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = (id) => {
    Alert.alert('Tasdiqlash', 'Haqiqatan ham bu xizmatni o\'chirmoqchimisiz?', [
      { text: 'Bekor qilish', style: 'cancel' },
      {
        text: 'O\'chirish',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await apiFetch(`/clinics/services/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error(await getResponseError(response));
            setServices((prev) => prev.filter((service) => service.id !== String(id)));
            setCurrentView('main');
          } catch (error) {
            Alert.alert('Xatolik', error.message || 'Xizmatni o‘chirib bo‘lmadi.');
          }
        },
      },
    ]);
  };

  const handleToggleService = async (service, active) => {
    try {
      const response = await apiFetch(`/clinics/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      });
      if (!response.ok) throw new Error(await getResponseError(response));
      const updatedService = await response.json();
      setServices((prev) => prev.map((item) => item.id === String(updatedService.id)
        ? { ...item, active: Boolean(updatedService.active) }
        : item));
    } catch (error) {
      Alert.alert('Xatolik', error.message || 'Xizmat holatini o‘zgartirib bo‘lmadi.');
    }
  };

  const toggleDoctorSelection = (docId) => {
    setEditDoctorIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const renderDisplayPrice = (priceStr, priceFrom) => {
    const formatted = formatPrice(priceStr);
    return `${formatted} so'm${priceFrom ? 'dan' : ''}`;
  };

  return (
    <View style={styles.overlayContainer}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheetContainer,
          { transform: [{ translateY }] },
        ]}
      >
        <View style={styles.dragHandleZone} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconBox}>
              <Briefcase size={20} color="#087FC1" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Xizmatlar va narxlar</Text>
              <Text style={styles.headerSubtitle}>Klinika narxnomasi boshqaruvi</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
            <X size={20} color="#73839A" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {currentView === 'main' && (
            <View style={{ flex: 1 }}>
              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{totalCount} ta</Text>
                  <Text style={styles.summaryLabel}>Xizmatlar</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{uniqueCategoriesCount} ta</Text>
                  <Text style={styles.summaryLabel}>Kategoriyalar</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: '#16A34A' }]}>{activeCount} ta</Text>
                  <Text style={styles.summaryLabel}>Faol</Text>
                </View>
              </View>

              {/* Search Field (agar xizmatlar bo'lsa ko'rinadi yoki doimiy turishi mumkin) */}
              {services.length > 0 && (
                <View style={styles.searchRow}>
                  <View style={styles.searchBox}>
                    <Search size={18} color="#73839A" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Xizmat nomini izlang..."
                      placeholderTextColor="#73839A"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                </View>
              )}

              {/* Grouped Service List / Empty state */}
              <ScrollView
                contentContainerStyle={[
                  styles.listContent,
                  { paddingBottom: Math.max(insets.bottom, 24) + 80 },
                ]}
                showsVerticalScrollIndicator={false}
              >
                {loadingServices ? (
                  <View style={styles.emptyBox}>
                    <ActivityIndicator size="large" color="#087FC1" />
                    <Text style={styles.emptySubText}>Xizmatlar yuklanmoqda...</Text>
                  </View>
                ) : servicesError ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>{servicesError}</Text>
                    <TouchableOpacity onPress={() => loadServices()} style={styles.textLinkBtn}>
                      <Text style={styles.textLinkText}>Qayta urinish</Text>
                    </TouchableOpacity>
                  </View>
                ) : filteredServices.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Briefcase size={44} color="#CBD5E1" style={{ marginBottom: 12 }} />
                    <Text style={styles.emptyText}>Hali xizmat qo'shilmagan</Text>
                    <Text style={styles.emptySubText}>Pastdagi "+" tugmasini bosib xizmat qo'shing</Text>
                  </View>
                ) : (
                  Object.entries(groupedServices).map(([categoryName, items]) => (
                    <View key={categoryName} style={styles.categoryGroup}>
                      <View style={styles.categoryHeaderRow}>
                        <Text style={styles.categoryHeaderTitle}>{categoryName}</Text>
                        <View style={styles.categoryCountBadge}>
                          <Text style={styles.categoryCountText}>{items.length}</Text>
                        </View>
                      </View>

                      {items.map((item) => {
                        const assignedDoctors = DOCTORS.filter((d) =>
                          (item.doctorIds || []).includes(d.id)
                        );
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[styles.serviceCard, !item.active && styles.inactiveCard]}
                            onPress={() => handleOpenEdit(item)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.serviceInfo}>
                              <Text style={[styles.serviceName, !item.active && styles.inactiveText]}>
                                {item.name}
                              </Text>
                              <View style={styles.serviceMetaRow}>
                                <Text style={[styles.servicePrice, !item.active && styles.inactiveText]}>
                                  {renderDisplayPrice(item.price, item.priceFrom)}
                                </Text>
                                {item.duration ? (
                                  <>
                                    <Text style={styles.metaDot}>·</Text>
                                    <View style={styles.durationRow}>
                                      <Clock size={12} color="#73839A" style={{ marginRight: 3 }} />
                                      <Text style={styles.serviceDuration}>{item.duration} daq</Text>
                                    </View>
                                  </>
                                ) : null}
                              </View>

                              {/* Doctors Avatars */}
                              {assignedDoctors.length > 0 && (
                                <View style={styles.doctorsRow}>
                                  <View style={styles.avatarsContainer}>
                                    {assignedDoctors.slice(0, 3).map((doc, idx) => (
                                      <View
                                        key={doc.id}
                                        style={[
                                          styles.avatarBubble,
                                          { backgroundColor: doc.color, marginLeft: idx > 0 ? -10 : 0 },
                                        ]}
                                      >
                                        <Text style={[styles.avatarText, { color: doc.textColor }]}>
                                          {doc.initials}
                                        </Text>
                                      </View>
                                    ))}
                                    {assignedDoctors.length > 3 && (
                                      <View style={[styles.avatarBubble, styles.extraAvatar, { marginLeft: -10 }]}>
                                        <Text style={styles.extraAvatarText}>+{assignedDoctors.length - 3}</Text>
                                      </View>
                                    )}
                                  </View>
                                  <Text style={styles.doctorCountLabel}>
                                    {assignedDoctors.length} ta doktor
                                  </Text>
                                </View>
                              )}
                            </View>

                            <View style={styles.serviceRightAction}>
                              <Switch
                                value={item.active}
                                onValueChange={(val) => handleToggleService(item, val)}
                                trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                                thumbColor={item.active ? '#087FC1' : '#F1F5F9'}
                              />
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Sticky Bottom Button */}
              <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TouchableOpacity
                  style={styles.catalogButton}
                  onPress={() => {
                    setCustomName('');
                    setCustomPrice('');
                    setCustomDuration('');
                    setCurrentView('custom_add');
                  }}
                  activeOpacity={0.85}
                >
                  <Plus size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.catalogButtonText}>Xizmat qo'shish</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {currentView === 'custom_add' && (
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Math.max(insets.bottom, 24) + 20 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.subHeaderRow}>
                <Text style={styles.subHeaderTitle}>Yangi xizmat qo'shish</Text>
                <TouchableOpacity onPress={() => setCurrentView('main')} style={styles.textLinkBtn}>
                  <Text style={styles.textLinkText}>Ortga</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Xizmat nomini kiriting *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Masalan: Konsultatsiya"
                    placeholderTextColor="#73839A"
                    value={customName}
                    onChangeText={setCustomName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Xizmat narxini kiriting (so'm) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Masalan: 150 000"
                    keyboardType="numeric"
                    placeholderTextColor="#73839A"
                    value={customPrice}
                    onChangeText={(val) => setCustomPrice(formatPrice(val))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Necha minut ketadi? (daqiqa)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Masalan: 30"
                    keyboardType="number-pad"
                    placeholderTextColor="#73839A"
                    value={customDuration}
                    onChangeText={setCustomDuration}
                  />
                </View>

                <View style={styles.formButtonsRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setCurrentView('main')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>Bekor qilish</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveCustomService}
                    disabled={savingService}
                    activeOpacity={0.85}
                  >
                    {savingService ? <ActivityIndicator size="small" color="#FFFFFF" /> : <>
                      <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.saveButtonText}>Saqlash</Text>
                    </>}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}

          {currentView === 'edit' && editingService && (
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Math.max(insets.bottom, 24) + 20 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.subHeaderRow}>
                <Text style={styles.subHeaderTitle}>Xizmatni tahrirlash</Text>
                <TouchableOpacity onPress={() => setCurrentView('main')} style={styles.textLinkBtn}>
                  <Text style={styles.textLinkText}>Yopish</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.editingServiceNameTitle}>{editingService.name}</Text>
                <Text style={styles.editingCategorySubtitle}>Kategoriya: {editingService.category}</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Narxi (so'mda) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Masalan: 150 000"
                    keyboardType="numeric"
                    placeholderTextColor="#73839A"
                    value={editPrice}
                    onChangeText={(val) => setEditPrice(formatPrice(val))}
                  />
                </View>

                <View style={styles.rowSwitchContainer}>
                  <Text style={styles.label}>Narx "dan" bilan boshlansinmi?</Text>
                  <Switch
                    value={editPriceFrom}
                    onValueChange={setEditPriceFrom}
                    trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                    thumbColor={editPriceFrom ? '#087FC1' : '#F1F5F9'}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Davomiyligi (daqiqa)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Masalan: 30"
                    keyboardType="number-pad"
                    placeholderTextColor="#73839A"
                    value={editDuration}
                    onChangeText={setEditDuration}
                  />
                </View>

                {/* Kim bajaradi? DOCTORS chips */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kim bajaradi? (Doktorlar)</Text>
                  <View style={styles.doctorsChipsContainer}>
                    {DOCTORS.map((doc) => {
                      const isSelected = editDoctorIds.includes(doc.id);
                      return (
                        <TouchableOpacity
                          key={doc.id}
                          style={[styles.doctorChip, isSelected && styles.doctorChipSelected]}
                          onPress={() => toggleDoctorSelection(doc.id)}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.chipAvatar,
                              { backgroundColor: doc.color },
                              isSelected && { backgroundColor: '#FFFFFF' },
                            ]}
                          >
                            <Text style={[styles.chipAvatarText, { color: doc.textColor }]}>
                              {doc.initials}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.doctorChipText,
                              isSelected && styles.doctorChipTextSelected,
                            ]}
                          >
                            {doc.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.rowSwitchContainer}>
                  <Text style={styles.label}>Faol holatda</Text>
                  <Switch
                    value={editActive}
                    onValueChange={setEditActive}
                    trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                    thumbColor={editActive ? '#087FC1' : '#F1F5F9'}
                  />
                </View>

                <View style={styles.formButtonsRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setCurrentView('main')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>Bekor qilish</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleUpdateService}
                    disabled={savingService}
                    activeOpacity={0.85}
                  >
                    {savingService ? <ActivityIndicator size="small" color="#FFFFFF" /> : <>
                      <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.saveButtonText}>Saqlash</Text>
                    </>}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteService(editingService.id)}
                  activeOpacity={0.8}
                >
                  <Trash2 size={16} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteButtonText}>Xizmatni o'chirish</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: { flex: 1, backgroundColor: 'transparent' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  sheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  dragHandleZone: { width: '100%', height: 28, alignItems: 'center', justifyContent: 'center' },
  dragHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#CBD5E1' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#13243A' },
  headerSubtitle: { fontSize: 12, color: '#73839A', marginTop: 1 },
  closeButton: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 14 },

  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 16, fontWeight: '800', color: '#13243A' },
  summaryLabel: { fontSize: 11, color: '#73839A', marginTop: 2, fontWeight: '600' },
  summaryDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0' },

  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#13243A', fontWeight: '500' },

  listContent: { gap: 16, paddingTop: 4 },
  categoryGroup: { gap: 8 },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  categoryHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#13243A' },
  categoryCountBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryCountText: { fontSize: 11, fontWeight: '700', color: '#475569' },

  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  inactiveCard: { backgroundColor: '#F1F5F9', opacity: 0.75 },
  serviceInfo: { flex: 1, paddingRight: 10 },
  serviceName: { fontSize: 14, fontWeight: '700', color: '#13243A', marginBottom: 4 },
  inactiveText: { color: '#73839A' },
  serviceMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  servicePrice: { fontSize: 13, fontWeight: '800', color: '#16A34A' },
  metaDot: { marginHorizontal: 6, color: '#73839A' },
  durationRow: { flexDirection: 'row', alignItems: 'center' },
  serviceDuration: { fontSize: 12, color: '#73839A', fontWeight: '500' },

  doctorsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  avatarsContainer: { flexDirection: 'row', alignItems: 'center' },
  avatarBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarText: { fontSize: 9, fontWeight: '800' },
  extraAvatar: { backgroundColor: '#E2E8F0' },
  extraAvatarText: { fontSize: 9, fontWeight: '700', color: '#475569' },
  doctorCountLabel: { fontSize: 11, color: '#73839A', fontWeight: '500' },

  serviceRightAction: { alignItems: 'center', justifyContent: 'center' },

  emptyBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#13243A', fontSize: 15, fontWeight: '700', marginTop: 8 },
  emptySubText: { color: '#73839A', fontSize: 13, marginTop: 4, textAlign: 'center' },

  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8FAFC',
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  catalogButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#087FC1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#087FC1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  catalogButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  subHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#13243A' },
  textLinkBtn: { padding: 4 },
  textLinkText: { fontSize: 13, fontWeight: '700', color: '#087FC1' },

  scrollContent: { gap: 14 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  editingServiceNameTitle: { fontSize: 16, fontWeight: '800', color: '#13243A' },
  editingCategorySubtitle: { fontSize: 12, color: '#73839A', fontWeight: '600', marginTop: -6 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#13243A' },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#13243A',
    fontWeight: '500',
  },
  rowSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },

  doctorsChipsContainer: { gap: 8 },
  doctorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  doctorChipSelected: { backgroundColor: '#087FC1', borderColor: '#087FC1' },
  chipAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAvatarText: { fontSize: 10, fontWeight: '800' },
  doctorChipText: { fontSize: 13, fontWeight: '600', color: '#13243A' },
  doctorChipTextSelected: { color: '#FFFFFF' },

  formButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#087FC1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  deleteButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  deleteButtonText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});

export default XizmatQoshScreen;