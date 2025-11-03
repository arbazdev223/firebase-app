import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { LEAD_STATUS_OPTIONS, SOURCE_OPTIONS, COURSE_OPTIONS } from '../constants/studentResponses';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

export default function FilteredEnquiriesScreen({ navigation, route }) {
  const {
    title = 'Filtered Enquiries',
    filters = {},
    emptyMessage = 'No enquiries found for this filter.',
    includeCaller = true,
    identityParam = null,
    applyNullDefaults = true,
    showCallStatus = true,
    showFilterControls = false,
    enquiryTypeFilter = false, // <-- add this flag for enabling enquiryType filter
  } = route?.params || {};

  // Add ENQUIRY_TYPE_OPTIONS for filter dropdown
  const ENQUIRY_TYPE_OPTIONS = ['Admission', 'Drop', 'Registration', 'WIP'];

  const normalizedFilters = useMemo(() => {
    if (!applyNullDefaults) {
      return { ...filters };
    }
    const result = { ...filters };
    if (!Object.prototype.hasOwnProperty.call(result, 'nextFollowUpDate')) {
      result.nextFollowUpDate = 'null';
    }
    if (!Object.prototype.hasOwnProperty.call(result, 'enquiryType')) {
      result.enquiryType = 'null';
    }
    if (!Object.prototype.hasOwnProperty.call(result, 'assign')) {
      result.assign = 'null';
    }
    return result;
  }, [filters, applyNullDefaults]);

  const [enquiries, setEnquiries] = useState([]);
  // Add a state to always keep the full data fetched from API
  const [allEnquiries, setAllEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [formFilters, setFormFilters] = useState({ source: '', dateFrom: '', dateTo: '', lead: '', enquiryType: '' });
  const [activeFilters, setActiveFilters] = useState({ source: '', dateFrom: '', dateTo: '', lead: '', enquiryType: '' });
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [datePickerMeta, setDatePickerMeta] = useState({
    visible: false,
    target: 'dateFrom',
    value: new Date(),
  });
  const [showTotalModal, setShowTotalModal] = useState(false);
  const [totalModalFilters, setTotalModalFilters] = useState({
    enquiryType: '',
    dateFrom: '',
    dateTo: '',
    nextFollowUpDateFrom: '',
    nextFollowUpDateTo: '',
    source: [], // <-- initialize as array for multi-select
  });

  // Helper for date formatting in filter modal
  const formatDateInput = (value) => value || '';

  const userIdRef = useRef(null);
  const isMountedRef = useRef(true); // <-- add this line here, before useEffect

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );
  const resolveUserId = useCallback(async () => {
    if (userIdRef.current) return userIdRef.current;
    const stored = await AsyncStorage.getItem('user');
    const parsed = stored ? JSON.parse(stored) : null;
    if (!parsed?._id) throw new Error('User information missing. Please log in again.');
    userIdRef.current = parsed._id;
    return parsed._id;
  }, []);

  const fetchData = useCallback(
    async ({ silent = false, overrides } = {}) => {
      try {
        if (!silent) setLoading(true);
        setError(null);

        let payload = { ...normalizedFilters };

        if (identityParam) {
          const userId = await resolveUserId();
          payload = { ...payload, [identityParam]: userId };
        } else if (includeCaller) {
          const userId = await resolveUserId();
          payload = { caller: userId, ...payload };
        }

        const filtersToApply = overrides ?? activeFilters;
        if (filtersToApply.source) {
          payload.source = filtersToApply.source;
        }
        if (filtersToApply.lead) {
          payload.leadStatus = filtersToApply.lead;
        }
        if (filtersToApply.enquiryType) {
          payload.enquiryType = filtersToApply.enquiryType;
        }
        if (filtersToApply.dateFrom || filtersToApply.dateTo) {
          delete payload.nextFollowUpDate;
        }
        if (filtersToApply.dateFrom && filtersToApply.dateTo) {
          payload.nextFollowUpBetween = `${filtersToApply.dateFrom},${filtersToApply.dateTo}`;
        } else if (filtersToApply.dateFrom) {
          payload['nextFollowUpDate>='] = filtersToApply.dateFrom;
        } else if (filtersToApply.dateTo) {
          payload['nextFollowUpDate<='] = filtersToApply.dateTo;
        }

        const items = await api.fetchEnquiries(payload);

        if (isMountedRef.current) {
          setAllEnquiries(Array.isArray(items) ? items : []);
          setEnquiries(Array.isArray(items) ? items : []);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setAllEnquiries([]);
          setEnquiries([]);
          setError(err.message || 'Unable to load enquiries.');
        }
      } finally {
        if (isMountedRef.current) {
          if (!silent) setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [normalizedFilters, resolveUserId, includeCaller, identityParam, activeFilters, enquiryTypeFilter]
  );

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData({ silent: true });
  }, [fetchData]);

  const handleManualReload = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const keyExtractor = useCallback(
    (item, index) => String(item?._id || item?.id || `enquiry-${index}`),
    []
  );

  const extractTextFromValue = (value, fallback = '') => {
    const visited = new WeakSet();
    const helper = (input) => {
      if (input === null || input === undefined) return '';
      if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
        return String(input);
      }
      if (Array.isArray(input)) {
        return input.map(helper).filter(Boolean).join(' • ');
      }
      if (typeof input === 'object') {
        if (visited.has(input)) return '';
        visited.add(input);
        const prioritizedKeys = ['remarks', 'note', 'response', 'value', 'label', 'name', 'title', 'text', 'message'];
        for (const key of prioritizedKeys) {
          if (Object.prototype.hasOwnProperty.call(input, key)) {
            const resolved = helper(input[key]);
            if (resolved) return resolved;
          }
        }
      }
      return '';
    };
    const result = helper(value);
    return result || fallback;
  };

  const computeCallStatus = (createdAt) => {
    if (!createdAt) {
      return { label: 'Already Late', style: styles.statusLate };
    }

    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) {
      return { label: 'Already Late', style: styles.statusLate };
    }

    const now = new Date();

    const startOfWorkingHours = new Date(now);
    startOfWorkingHours.setHours(9, 30, 0, 0);

    const endOfWorkingHours = new Date(now);
    endOfWorkingHours.setHours(18, 30, 0, 0);

    let label = 'Already Late';
    let style = styles.statusLate;

    if (created >= startOfWorkingHours && created <= endOfWorkingHours) {
      const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
      if (diffInMinutes <= 15) {
        label = 'Time Remain';
        style = styles.statusOntime;
      }
    } else {
      const yesterdayEvening = new Date(now);
      yesterdayEvening.setDate(now.getDate() - 1);
      yesterdayEvening.setHours(18, 30, 0, 0);

      const todayMorning = new Date(now);
      todayMorning.setHours(10, 0, 0, 0);

      if (created > yesterdayEvening && created <= todayMorning && now <= todayMorning) {
        label = 'Time Remain';
        style = styles.statusOntime;
      }
    }

    return { label, style };
  };

  const sanitizeNumber = (value) => {
    const text = extractTextFromValue(value);
    return text ? String(text).trim() : '';
  };

  // Add state for form modal and forms
  const [showFormModal, setShowFormModal] = useState(false);
  const [availableForms, setAvailableForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formInputs, setFormInputs] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formValues, setFormValues] = useState({});
  const [formCardItem, setFormCardItem] = useState(null);

  // Add state for course search in the form modal (for multi-select course field)
  const [courseSearch, setCourseSearch] = useState('');

  // Helper to fetch forms from API
  const fetchFormsForPage = useCallback(async () => {
    setFormLoading(true);
    setFormError('');
    try {
      const res = await fetch('https://test.ifda.in/api/forms');
      const data = await res.json();
      let formTypes = [];
      if (title === 'Enquiry Taken') {
        formTypes = ['EnquiryForm', 'admissionForm'];
      } else {
        // If you want to show all forms for other pages, set formTypes = [] and skip filter
        // formTypes = [];
      }
      let forms;
      if (formTypes.length > 0) {
        forms = data.filter(f => formTypes.includes(f.form_type));
      } else {
        forms = data; // Show all forms if no filter
      }
      setAvailableForms(forms);
    } catch (e) {
      setFormError('Unable to load forms');
      setAvailableForms([]);
    } finally {
      setFormLoading(false);
    }
  }, [title]);

  // Fetch forms when modal opens
  useEffect(() => {
    if (showFormModal) {
      fetchFormsForPage();
      setSelectedForm(null);
      setFormInputs([]);
      setFormValues({});
      // Do not reset formCardItem here
      // setFormCardItem(null);
    }
  }, [showFormModal, fetchFormsForPage]);

  // Show form modal and force form selection if requested (for CounsellorDashboard "Adm Enq Form" tab)
  useEffect(() => {
    if (route?.params?.showFormModal && route?.params?.forceFormSelection) {
      setShowFormModal(true);
      setFormCardItem(null); // No card context, open form selection
      setSelectedForm(null); // Always show form selection first
    }
  }, [route?.params?.showFormModal, route?.params?.forceFormSelection]);

  // --- Hide the main list UI if forceFormSelection is true and showFormModal is open ---
  const hideMainList =
    route?.params?.forceFormSelection && showFormModal && !selectedForm;

  // When a form is selected, set its inputs and prefill values from card
  useEffect(() => {
    if (selectedForm) {
      let fields = [];
      if (Array.isArray(selectedForm.inputs) && selectedForm.inputs.length > 0) {
        fields = selectedForm.inputs;
      } else if (selectedForm.fields && Array.isArray(selectedForm.fields) && selectedForm.fields.length > 0) {
        fields = selectedForm.fields;
      }
      setFormInputs(fields);

      // Prefill values from card if available
      if (fields.length && formCardItem) {
        const prefill = {};
        fields.forEach(f => {
          // Try to prefill from formCardItem, fallback to empty string
          if (formCardItem[f.name] !== undefined && formCardItem[f.name] !== null) {
            if (f.type === 'multi-select' && Array.isArray(formCardItem[f.name])) {
              prefill[f.name] = formCardItem[f.name];
            } else {
              prefill[f.name] = String(formCardItem[f.name]);
            }
          } else {
            prefill[f.name] = '';
          }
        });
        setFormValues(prefill);
      } else {
        setFormValues({});
      }
    }
  }, [selectedForm, formCardItem]);

  // Card click handler
  const handleCardPress = useCallback((item) => {
    setFormCardItem(item);
    setShowFormModal(true);
  }, []);

  // Form input change handler
  const handleFormInputChange = (name, value) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Form submit handler (dummy, replace with your API logic)
  const handleFormSubmit = async () => {
    // You can POST formValues to your backend here
    setShowFormModal(false);
    setSelectedForm(null);
    setFormInputs([]);
    setFormValues({});
    setFormCardItem(null);
    Alert.alert('Submitted', 'Form submitted successfully!');
  };

  // Helper for rendering form fields (NO hooks inside this function)
  const renderFormField = (input) => {
    const value = formValues[input.name] ?? '';
    const setValue = (v) => handleFormInputChange(input.name, v);

    // Text, Number
    if (input.type === 'text' || input.type === 'number') {
      return (
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#cbd5e1',
            borderRadius: 10,
            padding: 10,
            backgroundColor: '#f8fafc',
          }}
          value={value}
          onChangeText={setValue}
          placeholder={input.placeholder || ''}
          keyboardType={input.type === 'number' ? 'numeric' : 'default'}
          editable={!input.readonly}
          maxLength={input.max || undefined}
        />
      );
    }

    // Date
    if (input.type === 'date') {
      return (
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: '#cbd5e1',
            borderRadius: 10,
            padding: 10,
            backgroundColor: '#f8fafc',
          }}
          onPress={() => {
            if (Platform.OS === 'android') {
              DateTimePickerAndroid.open({
                value: value ? new Date(value) : new Date(),
                mode: 'date',
                onChange: (_, selectedDate) => {
                  if (selectedDate) setValue(selectedDate.toISOString().split('T')[0]);
                },
              });
            } else {
              setDatePickerMeta({
                visible: true,
                target: input.name,
                value: value ? new Date(value) : new Date(),
                onSelect: (selectedDate) => setValue(selectedDate.toISOString().split('T')[0]),
              });
            }
          }}
          disabled={input.readonly}
        >
          <Text style={{ color: value ? '#1F2937' : '#94a3b8' }}>
            {value ? formatDate(value) : (input.placeholder || 'Select Date')}
          </Text>
        </TouchableOpacity>
      );
    }

    // Select (single)
    if (input.type === 'select') {
      return (
        <View style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#f8fafc' }}>
          {input.options && input.options.length > 0 ? (
            <ScrollView horizontal contentContainerStyle={{ flexDirection: 'row', padding: 6 }}>
              {input.options.map((opt, idx) => (
                <TouchableOpacity
                  key={String(opt) + '-' + idx}
                  style={{
                    backgroundColor: value === opt ? '#4F46E5' : '#E0F2FE',
                    borderRadius: 999,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    marginRight: 8,
                  }}
                  onPress={() => setValue(opt)}
                  disabled={input.readonly}
                >
                  <Text style={{ color: value === opt ? '#fff' : '#1F2937', fontWeight: '700' }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={{ color: '#94a3b8', padding: 10 }}>No options</Text>
          )}
        </View>
      );
    }

    // Enhanced multi-select for "course" field with search and suggestion
    if (input.type === 'multi-select' && input.name === 'course') {
      const arrValue = Array.isArray(value) ? value : [];
      const filteredCourses = !courseSearch.trim()
        ? COURSE_OPTIONS
        : COURSE_OPTIONS.filter((course) =>
            course.toLowerCase().includes(courseSearch.trim().toLowerCase())
          );

      return (
        <View style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#f8fafc', paddingBottom: 8 }}>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderRadius: 8,
              padding: 8,
              margin: 8,
              backgroundColor: '#fff',
            }}
            value={courseSearch}
            onChangeText={(text) => setCourseSearch(text)}
            placeholder="Search course..."
          />
          {/* Make the suggestions list scrollable */}
          <ScrollView style={{ maxHeight: 180 }}>
            {filteredCourses.length === 0 ? (
              <Text style={{ color: '#94a3b8', padding: 10 }}>No courses found.</Text>
            ) : (
              filteredCourses.map((course, idx) => {
                const selected = arrValue.includes(course);
                return (
                  <TouchableOpacity
                    key={course + '-' + idx}
                    style={{
                      backgroundColor: selected ? '#4F46E5' : '#E0F2FE',
                      borderRadius: 999,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      margin: 6,
                    }}
                    onPress={() => {
                      if (selected) {
                        setValue(arrValue.filter((v) => v !== course));
                      } else {
                        setValue([...arrValue, course]);
                      }
                    }}
                    disabled={input.readonly}
                  >
                    <Text style={{ color: selected ? '#fff' : '#1F2937', fontWeight: '700' }}>{course}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
          {/* Show selected chips below search */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginLeft: 8 }}>
            {arrValue.map((course) => (
              <TouchableOpacity
                key={'chip-' + course}
                style={{
                  backgroundColor: '#0ea5e9',
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  marginRight: 6,
                  marginBottom: 6,
                }}
                onPress={() => setValue(arrValue.filter((v) => v !== course))}
                disabled={input.readonly}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>{course} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    // Multi-select
    if (input.type === 'multi-select') {
      const arrValue = Array.isArray(value) ? value : [];
      return (
        <View style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#f8fafc' }}>
          {input.options && input.options.length > 0 ? (
            <ScrollView horizontal contentContainerStyle={{ flexDirection: 'row', padding: 6 }}>
              {input.options.map((opt, idx) => {
                const selected = arrValue.includes(opt);
                return (
                  <TouchableOpacity
                    key={String(opt) + '-' + idx}
                    style={{
                      backgroundColor: selected ? '#4F46E5' : '#E0F2FE',
                      borderRadius: 999,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      marginRight: 8,
                    }}
                    onPress={() => {
                      if (selected) {
                        setValue(arrValue.filter(v => v !== opt));
                      } else {
                        setValue([...arrValue, opt]);
                      }
                    }}
                    disabled={input.readonly}
                  >
                    <Text style={{ color: selected ? '#fff' : '#1F2937', fontWeight: '700' }}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={{ color: '#94a3b8', padding: 10 }}>No options</Text>
          )}
        </View>
      );
    }

    // Default fallback
    return (
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#cbd5e1',
          borderRadius: 10,
          padding: 10,
          backgroundColor: '#f8fafc',
        }}
        value={value}
        onChangeText={setValue}
        placeholder={input.placeholder || ''}
        editable={!input.readonly}
      />
    );
  };

  const renderItem = useCallback(
    ({ item }) => {
      const primaryNumber = sanitizeNumber(
        item?.studentMobile ||
          item?.parentMobile ||
          item?.mobile ||
          item?.contactNumber ||
          item?.phoneNumber
      );
      const alternateNumber = sanitizeNumber(
        item?.studentAltNumber ||
          item?.parentAltNumber ||
          item?.altMobile ||
          item?.alternatePhone ||
          item?.altPhone
      );
      const leadDateValue = item?.leadDate || item?.createdAt;
      const leadTimeValue = item?.leadTime || item?.createdAt;
      const sourceText = extractTextFromValue(item?.source);
      const sourceTypeText = extractTextFromValue(item?.source_type);
      const enquiryTypeText = extractTextFromValue(item?.enquiryType);
      const locationText = extractTextFromValue(item?.location, 'N/A');
      const remarksText = extractTextFromValue(item?.remarks);
      const statusMeta = showCallStatus ? computeCallStatus(item?.createdAt) : null;

      const handleCallPress = () => {
        const hasPrimary = Boolean(primaryNumber);
        const hasAlternate = Boolean(alternateNumber);

        if (hasPrimary && hasAlternate && primaryNumber !== alternateNumber) {
          Alert.alert('Select Number', 'Which number would you like to call?', [
            { text: `Primary: ${primaryNumber}`, onPress: () => Linking.openURL(`tel:${primaryNumber}`) },
            { text: `Alternate: ${alternateNumber}`, onPress: () => Linking.openURL(`tel:${alternateNumber}`) },
            { text: 'Cancel', style: 'cancel' },
          ]);
          return;
        }

        const targetNumber = primaryNumber || alternateNumber;
        if (targetNumber) {
          Linking.openURL(`tel:${targetNumber}`);
        } else {
          Alert.alert('Unavailable', 'No phone number found for this enquiry.');
        }
      };

      const handleWhatsAppPress = () => {
        const targetNumber = primaryNumber || alternateNumber;
        if (targetNumber) {
          let num = targetNumber.replace(/\D/g, '');
          if (num.length === 10) num = '91' + num;
          // Try to open WhatsApp app first, fallback to browser if not installed
          Linking.openURL(`whatsapp://send?phone=${num}`).catch(() => {
            Linking.openURL(`https://wa.me/${num}`);
          });
        } else {
          Alert.alert('Unavailable', 'No phone number found for this enquiry.');
        }
      };

      return (
        <TouchableOpacity
          onPress={() => handleCardPress(item)}
          activeOpacity={0.92}
          style={{ marginBottom: 0 }} // ensure touch area is not blocked
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item?.studentName || item?.parentName || 'Unnamed Enquiry'}</Text>
              {showCallStatus && statusMeta ? (
                <View style={[styles.statusPill, statusMeta.style]}>
                  <Text style={styles.statusPillText}>{statusMeta.label}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.cardBody}>
              {primaryNumber ? (
                <Text style={styles.label}>
                  Mobile: <Text style={styles.value}>{primaryNumber}</Text>
                </Text>
              ) : null}
              {alternateNumber ? (
                <Text style={styles.label}>
                  Alt: <Text style={styles.value}>{alternateNumber}</Text>
                </Text>
              ) : null}
              {sourceText ? (
                <Text style={styles.label}>
                  Source: <Text style={styles.value}>{sourceText}</Text>
                </Text>
              ) : null}
              {sourceTypeText ? (
                <Text style={styles.label}>
                  Source Type: <Text style={styles.value}>{sourceTypeText}</Text>
                </Text>
              ) : null}
              {enquiryTypeText ? (
                <Text style={styles.label}>
                  Type: <Text style={styles.value}>{enquiryTypeText}</Text>
                </Text>
              ) : null}
              {leadDateValue ? (
                <Text style={styles.label}>
                  Lead Date: <Text style={styles.valueHighlight}>{formatDate(leadDateValue)}</Text>
                </Text>
              ) : null}
              {leadTimeValue ? (
                <Text style={styles.label}>
                  Lead Time: <Text style={styles.value}>{formatTime(leadTimeValue)}</Text>
                </Text>
              ) : null}
              {item?.nextFollowUpDate ? (
                <Text style={styles.label}>
                  Next Follow-up:{' '}
                  <Text style={styles.valueHighlight}>{formatDate(item.nextFollowUpDate)}</Text>
                </Text>
              ) : null}
              {locationText && locationText !== 'N/A' ? (
                <Text style={styles.label}>
                  Location: <Text style={styles.value}>{locationText}</Text>
                </Text>
              ) : null}
              {remarksText ? (
                <Text style={styles.label}>
                  Remarks: <Text style={styles.value}>{remarksText}</Text>
                </Text>
              ) : null}
            </View>

            {(primaryNumber || alternateNumber) ? (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.callButton} onPress={handleCallPress}>
                  <Text style={styles.callButtonText}>📞 Call Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsAppPress}>
                  <Text style={styles.whatsappButtonText}>🟢 WhatsApp</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [showCallStatus, handleCardPress]
  );

  const listEmptyComponent = useCallback(() => {
    if (loading) return null;
    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptyMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleManualReload}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No enquiries</Text>
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      </View>
    );
  }, [emptyMessage, error, handleManualReload, loading]);

  const handleFilterChange = useCallback((key, value) => {
    setFormFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const commitDateValue = useCallback((target, date) => {
    const iso = date.toISOString().split('T')[0];
    setFormFilters((prev) => ({ ...prev, [target]: iso }));
  }, []);

  const parseDateString = useCallback((value) => {
    if (!value) return new Date();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, []);

  const openDatePicker = useCallback(
    (target) => {
      const initialDate = parseDateString(formFilters[target]);
      if (Platform.OS === 'android') {
        DateTimePickerAndroid.open({
          value: initialDate,
          mode: 'date',
          onChange: (_, selectedDate) => {
            if (selectedDate) commitDateValue(target, selectedDate);
          },
        });
      } else {
        setDatePickerMeta({ visible: true, target, value: initialDate });
      }
    },
    [commitDateValue, formFilters, parseDateString]
  );

  const handleApplyFilters = useCallback(() => {
    const sanitized = {
      source: formFilters.source.trim(),
      dateFrom: formFilters.dateFrom.trim(),
      dateTo: formFilters.dateTo.trim(),
      lead: formFilters.lead.trim(),
      enquiryType: formFilters.enquiryType.trim(),
    };
    setActiveFilters(sanitized);
    setFilterModalVisible(false);
    fetchData({ overrides: sanitized });
  }, [formFilters, fetchData]);

  const handleClearFilters = useCallback(() => {
    const cleared = { source: '', dateFrom: '', dateTo: '', lead: '', enquiryType: '' };
    setFormFilters(cleared);
    setActiveFilters(cleared);
    setFilterModalVisible(false);
    fetchData({ overrides: cleared });
  }, [fetchData]);

  // Filtered count for modal
  // const filteredCount = useMemo(() => {
  //   return enquiries.filter((item) => {
  //     let match = true;
  //     if (totalModalFilters.enquiryType) {
  //       match = match && item.enquiryType === totalModalFilters.enquiryType;
  //     }
  //     if (totalModalFilters.dateFrom) {
  //       const d = new Date(item.enquiryDate || item.createdAt);
  //       match = match && d >= new Date(totalModalFilters.dateFrom);
  //     }
  //     if (totalModalFilters.dateTo) {
  //       const d = new Date(item.enquiryDate || item.createdAt);
  //       match = match && d <= new Date(totalModalFilters.dateTo);
  //     }
  //     return match;
  //   }).length;
  // }, [enquiries, totalModalFilters]);

  const handleApplyTotalModalFilters = useCallback(() => {
    // Always filter from allEnquiries, not from current filtered list
    let filtered = allEnquiries;

    // Multi-select source filter
    if (Array.isArray(totalModalFilters.source) && totalModalFilters.source.length > 0) {
      filtered = filtered.filter(
        (item) => totalModalFilters.source.includes(item.source)
      );
    }

    // Apply enquiryType filter if set
    if (totalModalFilters.enquiryType) {
      filtered = filtered.filter(
        (item) => item.enquiryType === totalModalFilters.enquiryType
      );
    }

    // Apply enquiry date range filter if set
    if (totalModalFilters.dateFrom) {
      filtered = filtered.filter((item) => {
        const d = new Date(item.enquiryDate || item.createdAt);
        return d >= new Date(totalModalFilters.dateFrom);
      });
    }
    if (totalModalFilters.dateTo) {
      filtered = filtered.filter((item) => {
        const d = new Date(item.enquiryDate || item.createdAt);
        return d <= new Date(totalModalFilters.dateTo);
      });
    }

    // Next Follow-up Date Range
    if (totalModalFilters.nextFollowUpDateFrom) {
      filtered = filtered.filter((item) => {
        const d = item.nextFollowUpDate ? new Date(item.nextFollowUpDate) : null;
        if (!d) return false;
        return d >= new Date(totalModalFilters.nextFollowUpDateFrom);
      });
    }
    if (totalModalFilters.nextFollowUpDateTo) {
      filtered = filtered.filter((item) => {
        const d = item.nextFollowUpDate ? new Date(item.nextFollowUpDate) : null;
        if (!d) return false;
        return d <= new Date(totalModalFilters.nextFollowUpDateTo);
      });
    }

    setShowTotalModal(false);

    if (
      (Array.isArray(totalModalFilters.source) && totalModalFilters.source.length > 0) ||
      totalModalFilters.enquiryType ||
      totalModalFilters.dateFrom ||
      totalModalFilters.dateTo ||
      totalModalFilters.nextFollowUpDateFrom ||
      totalModalFilters.nextFollowUpDateTo
    ) {
      setEnquiries(filtered);
    } else {
      // If no filter, show all data
      setEnquiries(allEnquiries);
    }
  }, [totalModalFilters, allEnquiries, activeFilters, fetchData]);

  // Reset courseSearch when form modal opens/closes or form changes
  useEffect(() => {
    if (showFormModal) setCourseSearch('');
  }, [showFormModal, selectedForm]);

  return (
    <SafeAreaView style={styles.container}>
      {!hideMainList && (
        <View style={styles.content}>
          <LinearGradient
            colors={['#0ea5e9', '#22d3ee']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity style={styles.backButton} onPress={navigation.goBack}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleManualReload}>
              <Text style={styles.headerActionText}>Refresh</Text>
            </TouchableOpacity>
          </LinearGradient>

          {showFilterControls ? (
            <View style={styles.toolbar}>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => setFilterModalVisible(true)}
              >
                <Text style={styles.toolbarButtonText}>Filters</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {loading && !refreshing ? (
            <View style={styles.loaderWrapper}>
              <ActivityIndicator color="#0ea5e9" size="small" />
            </View>
          ) : null}

          <FlatList
            data={enquiries}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#0ea5e9']}
                tintColor="#0ea5e9"
              />
            }
            ListEmptyComponent={listEmptyComponent}
            contentContainerStyle={[
              styles.listContent,
              enquiries.length === 0 ? styles.listEmptyPadding : null,
            ]}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {showFilterControls ? (
        <Modal
          visible={isFilterModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Enquiries</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={styles.filterLabel}>Source</Text>
                <View style={styles.filterChips}>
                  {SOURCE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.filterChip,
                        formFilters.source === option && styles.filterChipActive,
                      ]}
                      onPress={() =>
                        handleFilterChange('source', formFilters.source === option ? '' : option)
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          formFilters.source === option && styles.filterChipTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.filterLabel}>Next Follow-up Range</Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => openDatePicker('dateFrom')}
                  >
                    <Text
                      style={
                        formFilters.dateFrom ? styles.dateValueText : styles.datePlaceholderText
                      }
                    >
                      {formFilters.dateFrom || 'Start Date'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.dateSeparator}>to</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => openDatePicker('dateTo')}
                  >
                    <Text
                      style={
                        formFilters.dateTo ? styles.dateValueText : styles.datePlaceholderText
                      }
                    >
                      {formFilters.dateTo || 'End Date'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.filterLabel}>Lead Status</Text>
                <View style={styles.filterChips}>
                  {LEAD_STATUS_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.filterChip,
                        formFilters.lead === option && styles.filterChipActive,
                      ]}
                      onPress={() =>
                        handleFilterChange('lead', formFilters.lead === option ? '' : option)
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          formFilters.lead === option && styles.filterChipTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {enquiryTypeFilter ? (
                  <>
                    <Text style={styles.filterLabel}>Enquiry Type</Text>
                    <View style={styles.filterChips}>
                      {ENQUIRY_TYPE_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.filterChip,
                            formFilters.enquiryType === option && styles.filterChipActive,
                          ]}
                          onPress={() =>
                            setFormFilters((prev) => ({
                              ...prev,
                              enquiryType: prev.enquiryType === option ? '' : option,
                            }))
                          }
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              formFilters.enquiryType === option && styles.filterChipTextActive,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                ) : null}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.filterButtonSecondary} onPress={handleClearFilters}>
                  <Text style={styles.filterButtonSecondaryText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButtonPrimary} onPress={handleApplyFilters}>
                  <Text style={styles.filterButtonPrimaryText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setShowTotalModal(true)}>
          <Text style={styles.footerText}>Total: {enquiries.length} records</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showTotalModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTotalModal(false)}
      >
        {/* Remove TouchableOpacity below, use only View for modal backdrop */}
        <View style={styles.modalBackdrop}>
          <View style={styles.totalModalCard}>
            <View style={styles.totalModalHeader}>
              <Text style={styles.totalModalTitle}>Total Records</Text>
              <TouchableOpacity onPress={() => setShowTotalModal(false)}>
                <Text style={styles.totalModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.totalModalBody}>
              {/* Source filter with multi-select chips, no clear button */}
              <Text style={styles.totalModalFilterLabel}>Source</Text>
              <View style={styles.filterChips}>
                {SOURCE_OPTIONS.map((option) => {
                  const isSelected = Array.isArray(totalModalFilters.source) && totalModalFilters.source.includes(option);
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.filterChip,
                        isSelected && styles.filterChipActive,
                      ]}
                      onPress={() => {
                        setTotalModalFilters((prev) => {
                          let selected = Array.isArray(prev.source) ? [...prev.source] : [];
                          if (selected.includes(option)) {
                            selected = selected.filter((v) => v !== option);
                          } else {
                            selected.push(option);
                          }
                          return { ...prev, source: selected };
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isSelected && styles.filterChipTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.totalModalFilterLabel}>Enquiry Type</Text>
              <View style={styles.filterChips}>
                {ENQUIRY_TYPE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterChip,
                      totalModalFilters.enquiryType === option && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setTotalModalFilters((prev) => ({
                        ...prev,
                        enquiryType: prev.enquiryType === option ? '' : option,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        totalModalFilters.enquiryType === option && styles.filterChipTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.totalModalFilterLabel}>Enquiry Date Range</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => {
                    if (Platform.OS === 'android') {
                      DateTimePickerAndroid.open({
                        value: totalModalFilters.dateFrom
                          ? new Date(totalModalFilters.dateFrom)
                          : new Date(),
                        mode: 'date',
                        onChange: (_, selectedDate) => {
                          if (selectedDate) {
                            setTotalModalFilters((prev) => ({
                              ...prev,
                              dateFrom: selectedDate.toISOString().split('T')[0],
                            }));
                          }
                        },
                      });
                    } else {
                      setDatePickerMeta({
                        visible: true,
                        target: 'totalModalDateFrom',
                        value: totalModalFilters.dateFrom
                          ? new Date(totalModalFilters.dateFrom)
                          : new Date(),
                      });
                    }
                  }}
                >
                  <Text
                    style={
                      totalModalFilters.dateFrom
                        ? styles.dateValueText
                        : styles.datePlaceholderText
                    }
                  >
                    {formatDateInput(totalModalFilters.dateFrom) || 'Start Date'}
                  </Text>
                </TouchableOpacity>
                {/* Add clear button for Enquiry Date Start */}
                {totalModalFilters.dateFrom ? (
                  <TouchableOpacity
                    onPress={() =>
                      setTotalModalFilters((prev) => ({
                        ...prev,
                        dateFrom: '',
                      }))
                    }
                    style={{ marginLeft: 4, marginRight: 4, justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 18, color: '#64748b' }}>✕</Text>
                  </TouchableOpacity>
                ) : null}
                <Text style={styles.dateSeparator}>to</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => {
                    if (Platform.OS === 'android') {
                      DateTimePickerAndroid.open({
                        value: totalModalFilters.dateTo
                          ? new Date(totalModalFilters.dateTo)
                          : new Date(),
                        mode: 'date',
                        onChange: (_, selectedDate) => {
                          if (selectedDate) {
                            setTotalModalFilters((prev) => ({
                              ...prev,
                              dateTo: selectedDate.toISOString().split('T')[0],
                            }));
                          }
                        },
                      });
                    } else {
                      setDatePickerMeta({
                        visible: true,
                        target: 'totalModalDateTo',
                        value: totalModalFilters.dateTo
                          ? new Date(totalModalFilters.dateTo)
                          : new Date(),
                      });
                    }
                  }}
                >
                  <Text
                    style={
                      totalModalFilters.dateTo
                        ? styles.dateValueText
                        : styles.datePlaceholderText
                    }
                  >
                    {formatDateInput(totalModalFilters.dateTo) || 'End Date'}
                  </Text>
                </TouchableOpacity>
                {/* Add clear button for Enquiry Date End */}
                {totalModalFilters.dateTo ? (
                  <TouchableOpacity
                    onPress={() =>
                      setTotalModalFilters((prev) => ({
                        ...prev,
                        dateTo: '',
                      }))
                    }
                    style={{ marginLeft: 4, justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 18, color: '#64748b' }}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Add nextFollowUpDate filter */}
              <Text style={styles.totalModalFilterLabel}>Next Follow-up Date Range</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => {
                    if (Platform.OS === 'android') {
                      DateTimePickerAndroid.open({
                        value: totalModalFilters.nextFollowUpDateFrom
                          ? new Date(totalModalFilters.nextFollowUpDateFrom)
                          : new Date(),
                        mode: 'date',
                        onChange: (_, selectedDate) => {
                          if (selectedDate) {
                            setTotalModalFilters((prev) => ({
                              ...prev,
                              nextFollowUpDateFrom: selectedDate.toISOString().split('T')[0],
                            }));
                          }
                        },
                      });
                    } else {
                      setDatePickerMeta({
                        visible: true,
                        target: 'totalModalNextFollowUpDateFrom',
                        value: totalModalFilters.nextFollowUpDateFrom
                          ? new Date(totalModalFilters.nextFollowUpDateFrom)
                          : new Date(),
                      });
                    }
                  }}
                >
                  <Text
                    style={
                      totalModalFilters.nextFollowUpDateFrom
                        ? styles.dateValueText
                        : styles.datePlaceholderText
                    }
                  >
                    {formatDateInput(totalModalFilters.nextFollowUpDateFrom) || 'Start Date'}
                  </Text>
                </TouchableOpacity>
                {/* Add clear button for Start Date */}
                {totalModalFilters.nextFollowUpDateFrom ? (
                  <TouchableOpacity
                    onPress={() =>
                      setTotalModalFilters((prev) => ({
                        ...prev,
                        nextFollowUpDateFrom: '',
                      }))
                    }
                    style={{ marginLeft: 4, marginRight: 4, justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 18, color: '#64748b' }}>✕</Text>
                  </TouchableOpacity>
                ) : null}
                <Text style={styles.dateSeparator}>to</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => {
                    if (Platform.OS === 'android') {
                      DateTimePickerAndroid.open({
                        value: totalModalFilters.nextFollowUpDateTo
                          ? new Date(totalModalFilters.nextFollowUpDateTo)
                          : new Date(),
                        mode: 'date',
                        onChange: (_, selectedDate) => {
                          if (selectedDate) {
                            setTotalModalFilters((prev) => ({
                              ...prev,
                              nextFollowUpDateTo: selectedDate.toISOString().split('T')[0],
                            }));
                          }
                        },
                      });
                    } else {
                      setDatePickerMeta({
                        visible: true,
                        target: 'totalModalNextFollowUpDateTo',
                        value: totalModalFilters.nextFollowUpDateTo
                          ? new Date(totalModalFilters.nextFollowUpDateTo)
                          : new Date(),
                      });
                    }
                  }}
                >
                  <Text
                    style={
                      totalModalFilters.nextFollowUpDateTo
                        ? styles.dateValueText
                        : styles.datePlaceholderText
                    }
                  >
                    {formatDateInput(totalModalFilters.nextFollowUpDateTo) || 'End Date'}
                  </Text>
                </TouchableOpacity>
                {/* Add clear button for End Date */}
                {totalModalFilters.nextFollowUpDateTo ? (
                  <TouchableOpacity
                    onPress={() =>
                      setTotalModalFilters((prev) => ({
                        ...prev,
                        nextFollowUpDateTo: '',
                      }))
                    }
                    style={{ marginLeft: 4, justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 18, color: '#64748b' }}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {/* No count display */}
            </ScrollView>
            <TouchableOpacity
              style={styles.totalModalCloseBtn}
              onPress={handleApplyTotalModalFilters}
            >
              <Text style={styles.totalModalCloseBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {Platform.OS === 'ios' && datePickerMeta.visible ? (
        <Modal
          transparent
          animationType="fade"
          visible
          onRequestClose={() => setDatePickerMeta((prev) => ({ ...prev, visible: false }))}
        >
          <View style={styles.iosPickerBackdrop}>
            <View style={styles.iosPickerCard}>
              <DateTimePicker
                value={datePickerMeta.value}
                mode="date"
                display="spinner"
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    if (datePickerMeta.target === 'totalModalDateFrom') {
                      setTotalModalFilters((prev) => ({
                        ...prev,
                        dateFrom: selectedDate.toISOString().split('T')[0],
                      }));
                    } else if (datePickerMeta.target === 'totalModalDateTo') {
                      setTotalModalFilters((prev) => ({
                        ...prev,
                        dateTo: selectedDate.toISOString().split('T')[0],
                      }));
                    } else if (datePickerMeta.target === 'totalModalNextFollowUpDateFrom') {
                      setTotalModalFilters((prev) => ({
                        ...prev,
                        nextFollowUpDateFrom: selectedDate.toISOString().split('T')[0],
                      }));
                    } else if (datePickerMeta.target === 'totalModalNextFollowUpDateTo') {
                      setTotalModalFilters((prev) => ({
                        ...prev,
                        nextFollowUpDateTo: selectedDate.toISOString().split('T')[0],
                      }));
                    } else {
                      setDatePickerMeta((prev) => ({ ...prev, value: selectedDate }));
                    }
                  }
                }}
              />
              <View style={styles.iosPickerActions}>
                <TouchableOpacity
                  onPress={() => setDatePickerMeta((prev) => ({ ...prev, visible: false }))}
                >
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setDatePickerMeta((prev) => ({ ...prev, visible: false }));
                  }}
                >
                  <Text style={styles.toolbarButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* FORM MODAL */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFormModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.formModalCard}>
            <View style={styles.formModalHeader}>
              <Text style={styles.formModalTitle}>Fill Form</Text>
              <TouchableOpacity onPress={() => setShowFormModal(false)}>
                <Text style={styles.formModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {formLoading ? (
              <ActivityIndicator style={{ margin: 24 }} color="#0ea5e9" />
            ) : formError ? (
              <Text style={{ color: 'red', padding: 18 }}>{formError}</Text>
            ) : availableForms.length > 1 && !selectedForm ? (
              // Show buttons to pick which form to fill
              <View style={{ padding: 18 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 18 }}>Select Form</Text>
                {availableForms.map(form => (
                  <TouchableOpacity
                    key={form.form_type}
                    style={styles.formSelectBtn}
                    onPress={() => setSelectedForm(form)}
                  >
                    <Text style={styles.formSelectBtnText}>{form.form_type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : availableForms.length === 1 || selectedForm ? (
              // Show form inputs
              <ScrollView contentContainerStyle={styles.formModalBody}>
                {formInputs.length === 0 ? (
                  <Text style={{ color: '#64748b', marginBottom: 18 }}>No form fields found.</Text>
                ) : (
                  formInputs.map(input => (
                    <View key={input.name} style={{ marginBottom: 16 }}>
                      <Text style={{ fontWeight: '600', marginBottom: 6 }}>{input.label || input.name}</Text>
                      {renderFormField(input)}
                    </View>
                  ))
                )}
                <TouchableOpacity
                  style={styles.formSubmitBtn}
                  onPress={handleFormSubmit}
                >
                  <Text style={styles.formSubmitBtnText}>Submit</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <Text style={{ padding: 18 }}>No forms available.</Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: '#4F46E5', // Primary
  },
  backButton: { paddingVertical: 8, paddingRight: 10 },
  backText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', letterSpacing: 0.2 },
  headerActionButton: {
    backgroundColor: 'rgba(34,211,238,0.18)', // Secondary with opacity
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.18)',
  },
  headerActionText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  loaderWrapper: { paddingVertical: 14, alignItems: 'center' },
  listContent: { paddingHorizontal: 18, paddingBottom: 28, gap: 14 },
  listEmptyPadding: { flexGrow: 1, justifyContent: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#22D3EE', // Secondary
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cardTitle: { fontSize: 19, fontWeight: 'bold', color: '#4F46E5', flex: 1 }, // Primary
  statusBadge: { backgroundColor: '#22D3EE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  statusPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE', // Light cyan
  },
  statusPillText: { color: '#4F46E5', fontSize: 13, fontWeight: '700' }, // Primary
  statusOntime: { color: '#fff', backgroundColor: '#22D3EE' }, // Secondary
  statusLate: { color: '#fff', backgroundColor: '#FBBF24' }, // Accent
  cardBody: { gap: 9, marginBottom: 14 },
  label: { fontSize: 15, color: '#64748b', fontWeight: '600' },
  value: { fontSize: 15, color: '#1F2937', fontWeight: '400' }, // Text
  valueHighlight: { fontSize: 15, color: '#4F46E5', fontWeight: '700' }, // Primary
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    justifyContent: 'flex-start',
  },
  callButton: {
    backgroundColor: '#22D3EE', // Secondary
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  callButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  whatsappButton: {
    backgroundColor: '#25D366', // WhatsApp green
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  whatsappButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingHorizontal: 28 },
  emptyTitle: { fontSize: 19, fontWeight: 'bold', color: '#1F2937' }, // Text
  emptyMessage: { marginTop: 10, fontSize: 15, color: '#475569', textAlign: 'center' },
  retryButton: {
    marginTop: 18,
    backgroundColor: '#FBBF24', // Accent
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryText: { color: '#1F2937', fontSize: 15, fontWeight: '700' }, // Text
  toolbar: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
    alignItems: 'flex-end',
  },
  toolbarButton: {
    backgroundColor: '#4F46E5', // Primary
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  toolbarButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  filterSection: { display: 'none' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(31,41,55,0.45)', // Text color with opacity
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 28,
    gap: 18,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 19, fontWeight: 'bold', color: '#1F2937' }, // Text
  modalCloseText: { fontSize: 20, fontWeight: 'bold', color: '#64748b' },
  modalBody: { gap: 16 },
  filterLabel: { fontSize: 14, fontWeight: '700', color: '#1F2937' }, // Text
  filterInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    fontSize: 15,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E0F2FE', // Light cyan
  },
  filterChipActive: { backgroundColor: '#4F46E5' }, // Primary
  filterChipText: { fontSize: 13, fontWeight: '700', color: '#1F2937' }, // Text
  filterChipTextActive: { color: '#fff' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 14,
    paddingTop: 6,
  },
  filterButtonPrimary: {
    backgroundColor: '#4F46E5', // Primary
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  filterButtonPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  filterButtonSecondary: {
    backgroundColor: '#FBBF24', // Accent
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  filterButtonSecondaryText: { color: '#1F2937', fontSize: 15, fontWeight: '700' }, // Text
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#f8fafc',
  },
  dateValueText: { fontSize: 15, fontWeight: '700', color: '#1F2937' }, // Text
  datePlaceholderText: { fontSize: 15, color: '#94a3b8' },
  dateSeparator: { fontSize: 14, fontWeight: '700', color: '#1F2937' }, // Text
  iosPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(31,41,55,0.45)',
    justifyContent: 'flex-end',
  },
  iosPickerCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingBottom: 14,
  },
  iosPickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 17,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: { fontSize: 15, fontWeight: '700', color: '#1F2937', textAlign: 'center' }, // Text
  recentActivity: { padding: 20, backgroundColor: '#fff', borderRadius: 14, marginTop: 20, marginHorizontal: 10, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  totalModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(31,41,55,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalModalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 16,
    overflow: 'hidden',
  },
  totalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  totalModalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  totalModalCloseText: { fontSize: 20, color: '#94a3b8' },
  totalModalBody: {
    alignItems: 'stretch',
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 18,
  },
  totalModalFilterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  totalModalCountLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4F46E5',
    marginTop: 12,
    textAlign: 'center',
  },
  totalModalCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  totalModalCloseBtn: {
    marginTop: 8,
    marginHorizontal: 20,
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formModalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 16,
    overflow: 'hidden',
  },
  formModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  formModalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  formModalCloseText: { fontSize: 20, color: '#94a3b8' },
  formModalBody: {
    alignItems: 'stretch',
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 8,
  },
  formSelectBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 12,
    alignItems: 'center',
  },
  formSelectBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  formSubmitBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  formSubmitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  iosPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(31,41,55,0.45)',
    justifyContent: 'flex-end',
  },
  iosPickerCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingBottom: 14,
  },
  iosPickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 17,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: { fontSize: 15, fontWeight: '700', color: '#1F2937', textAlign: 'center' }, // Text
  recentActivity: { padding: 20, backgroundColor: '#fff', borderRadius: 14, marginTop: 20, marginHorizontal: 10, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  totalModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(31,41,55,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalModalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 16,
    overflow: 'hidden',
  },
  totalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  totalModalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  totalModalCloseText: { fontSize: 20, color: '#94a3b8' },
  totalModalBody: {
    alignItems: 'stretch',
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 18,
  },
  totalModalFilterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  totalModalCountLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4F46E5',
    marginTop: 12,
    textAlign: 'center',
  },
  totalModalCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  totalModalCloseBtn: {
    marginTop: 8,
    marginHorizontal: 20,
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formModalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    width: '100%',
    alignSelf: 'center',
       paddingBottom: 16,
    overflow: 'hidden',
  },
  formModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  formModalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  formModalCloseText: { fontSize: 20, color: '#94a3b8' },
  formModalBody: {
    alignItems: 'stretch',
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 8,
  },
  formSelectBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 12,
    alignItems: 'center',
  },
  formSelectBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  formSubmitBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  formSubmitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  iosPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(31,41,55,0.45)',
    justifyContent: 'flex-end',
  },
  iosPickerCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingBottom: 14,
  },
  iosPickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 17,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: { fontSize: 15, fontWeight: '700', color: '#1F2937', textAlign: 'center' }, // Text
  recentActivity: { padding: 20, backgroundColor: '#fff', borderRadius: 14, marginTop: 20, marginHorizontal: 10, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  totalModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(31,41,55,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalModalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 16,
    overflow: 'hidden',
  },
  totalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  totalModalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  totalModalCloseText: { fontSize: 20, color: '#94a3b8' },
  totalModalBody: {
    alignItems: 'stretch',
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 18,
  },
  totalModalFilterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  totalModalCountLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4F46E5',
    marginTop: 12,
    textAlign: 'center',
  },
  totalModalCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  totalModalCloseBtn: {
    marginTop: 8,
    marginHorizontal: 20,
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
