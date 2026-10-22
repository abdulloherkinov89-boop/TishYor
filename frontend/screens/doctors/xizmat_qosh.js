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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '../../utils/api';
import { X, Plus, Search, Check, Trash2, Briefcase, Clock } from 'lucide-react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24);

const SNAP_FULL = STATUS_BAR_HEIGHT + 8;
const SNAP_HALF = SCREEN_HEIGHT * 0.5;
const SNAP_CLOSED = SCREEN_HEIGHT;

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
  const translateY = useRef(new Animated.Value(SNAP_CLOSED)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const currentSnapState = useRef('HALF');
  const scrollOffsetRef = useRef(0);
  const isClosingRef = useRef(false);

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [savingService, setSavingService] = useState(false);
  const [servicesError, setServicesError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentView, setCurrentView] = useState('main');

  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customDuration, setCustomDuration] = useState('');

  const [editingService, setEditingService] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editPriceFrom, setEditPriceFrom] = useState(false);
  const [editDuration, setEditDuration] = useState('');
  const [editDoctorIds, setEditDoctorIds] = useState([]);
  const [editActive, setEditActive] = useState(true);

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
  }, [translateY, backdropOpacity]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

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
    ]).start(({ finished }) => {
      if (finished) navigation.goBack();
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
            handleClose();
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

  const getResponseError = async (response) => {
    let message = 'So‘rovni bajarib bo‘lmadi. Qayta urinib ko‘ring.';
    try {
      const payload = await response.json();
      if (typeof payload.detail === 'string') message = payload.detail;
    } catch (error) {}
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

  const totalCount = services.length;
  const activeCount = services.filter((s) => s.active).length;
  const uniqueCategoriesCount = new Set(services.map((s) => s.category)).size;

  const filteredServices = services.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <Animated.View style={[styles.sheetContainer, { transform: [{ translateY }] }]}>
        <View style={styles.dragHandleZone} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
        </View>

        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconBox}>
              <Briefcase size={18} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Xizmatlar va narxlar</Text>
              <Text style={styles.headerSubtitle}>Klinika narxnomasi boshqaruvi</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
            <X size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {currentView === 'main' && (
            <View style={{ flex: 1 }}>
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

              {services.length > 0 && (
                <View style={styles.searchRow}>
                  <View style={styles.searchBox}>
                    <Search size={16} color="#64748B" style={{ marginRight: 6 }} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Xizmat nomini izlang..."
                      placeholderTextColor="#64748B"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                </View>
              )}

              <ScrollView
                contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 16) + 70 }]}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                nestedScrollEnabled
              >
                {loadingServices ? (
                  <View style={styles.emptyBox}>
                    <ActivityIndicator size="small" color="#0284C7" />
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
                    <Briefcase size={38} color="#CBD5E1" style={{ marginBottom: 8 }} />
                    <Text style={styles.emptyText}>Hali xizmat qo'shilmagan</Text>
                    <Text style={styles.emptySubText}>Pastdagi tugmani bosib xizmat qo'shing</Text>
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
                        const assignedDoctors = DOCTORS.filter((d) => (item.doctorIds || []).includes(d.id));
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[styles.serviceCard, !item.active && styles.inactiveCard]}
                            onPress={() => handleOpenEdit(item)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.serviceInfo}>
                              <Text style={[styles.serviceName, !item.active && styles.inactiveText]}>{item.name}</Text>
                              <View style={styles.serviceMetaRow}>
                                <Text style={[styles.servicePrice, !item.active && styles.inactiveText]}>
                                  {renderDisplayPrice(item.price, item.priceFrom)}
                                </Text>
                                {item.duration ? (
                                  <>
                                    <Text style={styles.metaDot}>·</Text>
                                    <View style={styles.durationRow}>
                                      <Clock size={12} color="#64748B" style={{ marginRight: 2 }} />
                                      <Text style={styles.serviceDuration}>{item.duration} daq</Text>
                                    </View>
                                  </>
                                ) : null}
                              </View>
                              {assignedDoctors.length > 0 && (
                                <View style={styles.doctorsRow}>
                                  <View style={styles.avatarsContainer}>
                                    {assignedDoctors.slice(0, 3).map((doc, idx) => (
                                      <View
                                        key={doc.id}
                                        style={[
                                          styles.avatarBubble,
                                          { backgroundColor: doc.color, marginLeft: idx > 0 ? -8 : 0 },
                                        ]}
                                      >
                                        <Text style={[styles.avatarText, { color: doc.textColor }]}>{doc.initials}</Text>
                                      </View>
                                    ))}
                                    {assignedDoctors.length > 3 && (
                                      <View style={[styles.avatarBubble, styles.extraAvatar, { marginLeft: -8 }]}>
                                        <Text style={styles.extraAvatarText}>+{assignedDoctors.length - 3}</Text>
                                      </View>
                                    )}
                                  </View>
                                  <Text style={styles.doctorCountLabel}>{assignedDoctors.length} ta doktor</Text>
                                </View>
                              )}
                            </View>

                            <View style={styles.serviceRightAction}>
                              <Switch
                                value={item.active}
                                onValueChange={(val) => handleToggleService(item, val)}
                                trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                                thumbColor={item.active ? '#0284C7' : '#F1F5F9'}
                              />
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))
                )}
              </ScrollView>

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
                  <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.catalogButtonText}>Xizmat qo'shish</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {currentView === 'custom_add' && (
            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 20 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onScroll={handleScroll}
              scrollEventThrottle={16}
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
                    placeholderTextColor="#64748B"
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
                    placeholderTextColor="#64748B"
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
                    placeholderTextColor="#64748B"
                    value={customDuration}
                    onChangeText={setCustomDuration}
                  />
                </View>

                <View style={styles.formButtonsRow}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setCurrentView('main')} activeOpacity={0.8}>
                    <Text style={styles.cancelButtonText}>Bekor qilish</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveCustomService} disabled={savingService} activeOpacity={0.85}>
                    {savingService ? <ActivityIndicator size="small" color="#FFFFFF" /> : <>
                      <Check size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.saveButtonText}>Saqlash</Text>
                    </>}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}

          {currentView === 'edit' && editingService && (
            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 20 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onScroll={handleScroll}
              scrollEventThrottle={16}
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
                    placeholderTextColor="#64748B"
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
                    thumbColor={editPriceFrom ? '#0284C7' : '#F1F5F9'}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Davomiyligi (daqiqa)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Masalan: 30"
                    keyboardType="number-pad"
                    placeholderTextColor="#64748B"
                    value={editDuration}
                    onChangeText={setEditDuration}
                  />
                </View>

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
                          <View style={[styles.chipAvatar, { backgroundColor: doc.color }, isSelected && { backgroundColor: '#FFFFFF' }]}>
                            <Text style={[styles.chipAvatarText, { color: doc.textColor }]}>{doc.initials}</Text>
                          </View>
                          <Text style={[styles.doctorChipText, isSelected && styles.doctorChipTextSelected]}>{doc.name}</Text>
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
                    thumbColor={editActive ? '#0284C7' : '#F1F5F9'}
                  />
                </View>

                <View style={styles.formButtonsRow}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setCurrentView('main')} activeOpacity={0.8}>
                    <Text style={styles.cancelButtonText}>Bekor qilish</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.saveButton} onPress={handleUpdateService} disabled={savingService} activeOpacity={0.85}>
                    {savingService ? <ActivityIndicator size="small" color="#FFFFFF" /> : <>
                      <Check size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.saveButtonText}>Saqlash</Text>
                    </>}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteService(editingService.id)} activeOpacity={0.8}>
                  <Trash2 size={16} color="#EF4444" style={{ marginRight: 4 }} />
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
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  headerSubtitle: { fontSize: 11, color: '#64748B', marginTop: 1 },
  closeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderRadius: 10 },
  summaryCard: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 10, alignItems: 'center', justifyContent: 'space-around', marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  summaryLabel: { fontSize: 10, color: '#64748B', marginTop: 1, fontWeight: '600' },
  summaryDivider: { width: 1, height: 20, backgroundColor: '#E2E8F0' },
  searchRow: { flexDirection: 'row', marginBottom: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A', fontWeight: '500' },
  listContent: { gap: 14, paddingTop: 4 },
  categoryGroup: { gap: 8 },
  categoryHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2, marginBottom: 2 },
  categoryHeaderTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  categoryCountBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  categoryCountText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  serviceCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  inactiveCard: { backgroundColor: '#F8FAFC', opacity: 0.75 },
  serviceInfo: { flex: 1, paddingRight: 8 },
  serviceName: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 3 },
  inactiveText: { color: '#64748B' },
  serviceMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  servicePrice: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  metaDot: { marginHorizontal: 4, color: '#64748B' },
  durationRow: { flexDirection: 'row', alignItems: 'center' },
  serviceDuration: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  doctorsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  avatarsContainer: { flexDirection: 'row', alignItems: 'center' },
  avatarBubble: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFFFFF' },
  avatarText: { fontSize: 8, fontWeight: '700' },
  extraAvatar: { backgroundColor: '#E2E8F0' },
  extraAvatarText: { fontSize: 8, fontWeight: '700', color: '#475569' },
  doctorCountLabel: { fontSize: 10, color: '#64748B', fontWeight: '500' },
  serviceRightAction: { alignItems: 'center', justifyContent: 'center' },
  emptyBox: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#0F172A', fontSize: 14, fontWeight: '700', marginTop: 6 },
  emptySubText: { color: '#64748B', fontSize: 12, marginTop: 2, textAlign: 'center' },
  stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', paddingTop: 8, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  catalogButton: { height: 46, borderRadius: 12, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  catalogButtonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  subHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subHeaderTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  textLinkBtn: { padding: 4 },
  textLinkText: { fontSize: 12, fontWeight: '700', color: '#0284C7' },
  scrollContent: { gap: 12 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  editingServiceNameTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  editingCategorySubtitle: { fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: -4 },
  inputGroup: { gap: 4 },
  label: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, height: 44, paddingHorizontal: 12, fontSize: 13, color: '#0F172A', fontWeight: '500' },
  rowSwitchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  doctorsChipsContainer: { gap: 6 },
  doctorChip: { flexDirection: 'row', alignItems: 'center', padding: 6, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  doctorChipSelected: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  chipAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chipAvatarText: { fontSize: 9, fontWeight: '700' },
  doctorChipText: { fontSize: 12, fontWeight: '600', color: '#0F172A' },
  doctorChipTextSelected: { color: '#FFFFFF' },
  formButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cancelButton: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  cancelButtonText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  saveButton: { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  deleteButton: { height: 44, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  deleteButtonText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
});

export default XizmatQoshScreen;