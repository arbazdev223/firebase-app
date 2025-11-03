import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import FilteredEnquiriesScreen from './FilteredEnquiriesScreen';
import { LEAD_STATUS_OPTIONS, SOURCE_OPTIONS, COURSE_OPTIONS } from '../constants/studentResponses';

export default function CounsellorDashboard({ navigation }) {
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEnquiry: 0,
    wipCount: 0,
    admissionCount: 0,
    todayFollowUp: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);

  // --- FORM MODAL STATE (same as FilteredEnquiriesScreen) ---
  const [showFormModal, setShowFormModal] = useState(false);
  const [availableForms, setAvailableForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formInputs, setFormInputs] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formValues, setFormValues] = useState({});
  const [courseSearch, setCourseSearch] = useState('');

  // Add state for today's follow-up leads
  const [todayFollowUpLeads, setTodayFollowUpLeads] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user?._id) {
      fetchStats();
      fetchRecent();
    }
  }, [user?._id]); // Only depend on user._id, not the whole user object

  // Fetch today's follow-up leads
  const fetchTodayFollowUpLeads = async () => {
    try {
      const userId = user?._id;
      if (!userId) return;
      // Get today's date in YYYY-MM-DD
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      // Use the same filter as CounsellorTodayFollowUp screen (see App.js)
      const params = {
        nextFollowUpDate: todayStr,
        'enquiryType!': 'Drop,Admission',
        counsellor: userId,
      };
      const leads = await api.fetchEnquiries(params);
      setTodayFollowUpLeads(Array.isArray(leads) ? leads : []);
    } catch (err) {
      setTodayFollowUpLeads([]);
    }
  };

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (err) {
      // Do not logout on error, just show fallback UI
      setUser(null);
    }
  };

  const fetchStats = async () => {
    try {
      const userId = user?._id;
      if (!userId) return;
      const counts = await api.fetchCallerCounts(userId);
      setStats({
        totalEnquiry: counts.TotalEnquiry ?? counts.totalEnquiry ?? counts.totalEntries ?? 0,
        wipCount: counts.CS_TotalFollowUp ?? counts.wipCount ?? 0,
        admissionCount: counts.webLeads ?? 0, // Show webLeads instead of admission
        todayFollowUp: counts.CS_TodayFollowUp ?? counts.todayFollowUp ?? 0,
      });
    } catch (err) {
      setStats({
        totalEnquiry: 0,
        wipCount: 0,
        admissionCount: 0,
        todayFollowUp: 0,
      });
    }
  };

  const fetchRecent = async () => {
    try {
      const userId = user?._id;
      if (!userId) return;
      const activities = await api.fetchRecentActivities(userId, 3);
      setRecentActivities(Array.isArray(activities) ? activities : []);
    } catch (err) {
      setRecentActivities([]);
    }
  };

  // Remove auto-logout from onRefresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  // Only logout on explicit user action
  const logout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const quickInsertTab = useMemo(
    () => ({
      key: 'QuickInsert',
      label: 'Quick Insert',
      icon: '🗂️',
    }),
    []
  );

  const tabSections = useMemo(
    () => [
      {
        title: 'Double Tick',
        items: [
          { key: 'franchise', label: 'Franchise', icon: '🏢', route: 'FranchiseEnquiries' },
          { key: 'broadcast', label: 'Broadcast', icon: '📣', route: 'BroadcastEnquiries' },
          { key: 'chat', label: 'Chat Enquiry', icon: '💬', route: 'ChatEnquiries' },
        ],
      },
      {
        title: 'Web / DM Leads',
        items: [
          { key: 'dmLeads', label: 'DM Leads', icon: '📱', route: 'DMLeadsEnquiries' },
          { key: 'webLeads', label: 'Web Lead', icon: '🌐', route: 'WebLeadsEnquiries' },
        ],
      },
      {
        title: 'Enquiry & Follow-Up',
        items: [
          { key: 'todayFollowUp', label: 'Today Follow Up', icon: '⏰', route: 'CounsellorTodayFollowUp' },
          { key: 'enquiryFollowUp', label: 'Enquiry Follow Up', icon: '📞', route: 'CounsellorEnquiryFollowUp' },
          { key: 'branchEnquiry', label: 'Branch Enquiry', icon: '🏬', route: 'CounsellorBranchEnquiry' },
          { key: 'enquiryTaken', label: 'Enquiry Taken', icon: '📝', route: 'CounsellorEnquiryTaken' },
          { key: 'admissionEnquiry', label: 'Adm Enq Form', icon: '🎯' },
        ],
      },
    ],
    []
  );

  // --- Fetch forms for modal (filter only required forms) ---
  const fetchFormsForPage = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      const res = await fetch('https://test.ifda.in/api/forms');
      const data = await res.json();
      // Only show these forms
      const allowed = ['InstantAdmission', 'EnquiryForm', 'CourseUpgade'];
      setAvailableForms(data.filter(f => allowed.includes(f.form_type)));
    } catch (e) {
      setFormError('Unable to load forms');
      setAvailableForms([]);
    } finally {
      setFormLoading(false);
    }
  };

  const handleTabPress = (item) => {
    if (item.route === 'CounsellorBranchEnquiry') {
      const branchName = user?.branches?.[0]?.branch;
      if (!branchName) {
        Alert.alert('Branch Missing', 'No branch assigned. Please contact admin.');
        return;
      }
      navigation.navigate(item.route, {
        filters: {
          branch: branchName,
          'enquiryType!=': 'Drop,Admission',
          'assign!=': 'ReAssigned',
        },
      });
      return;
    }

    if (item.key === 'admissionEnquiry') {
      setShowFormModal(true);
      fetchFormsForPage();
      setSelectedForm(null);
      setFormInputs([]);
      setFormValues({});
      setCourseSearch('');
      return;
    }

    if (item.route) {
      navigation.navigate(item.route);
      return;
    }
    Alert.alert('Coming Soon', `${item.label} will be available shortly.`);
  };

  // Set form inputs when a form is selected
  useEffect(() => {
    if (selectedForm) {
      let fields = [];
      if (Array.isArray(selectedForm.inputs) && selectedForm.inputs.length > 0) {
        fields = selectedForm.inputs;
      } else if (selectedForm.fields && Array.isArray(selectedForm.fields) && selectedForm.fields.length > 0) {
        fields = selectedForm.fields;
      }
      setFormInputs(fields);
      setFormValues({});
    }
  }, [selectedForm]);

  // Form input change handler
  const handleFormInputChange = (name, value) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Form submit handler (dummy)
  const handleFormSubmit = async () => {
    setShowFormModal(false);
    setSelectedForm(null);
    setFormInputs([]);
    setFormValues({});
    setCourseSearch('');
    Alert.alert('Submitted', 'Form submitted successfully!');
  };

  // Helper for rendering form fields (copy from FilteredEnquiriesScreen)
  const renderFormField = (input) => {
    const value = formValues[input.name] ?? '';
    const setValue = (v) => handleFormInputChange(input.name, v);

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0ea5e9', '#22d3ee']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome Back 🎓</Text>
            <Text style={styles.userName}>{user?.name || <Text style={styles.placeholderText}>Counsellor</Text>}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, styles.statCardShadow, { backgroundColor: '#fff', borderColor: '#0ea5e9', borderWidth: 1 }]}
            onPress={() => navigation.navigate('CounsellorEnquiryTaken')}
            activeOpacity={0.85}
          >
            <Text style={[styles.statIcon, { color: '#0ea5e9' }]}>📋</Text>
            <Text style={[styles.statNumber, { color: '#0ea5e9' }]}>
              {stats.totalEnquiry !== undefined ? stats.totalEnquiry : <Text style={styles.placeholderText}>--</Text>}
            </Text>
            <Text style={[styles.statLabel, { color: '#0ea5e9' }]}>Total Enquiry</Text>
          </TouchableOpacity>
          <View style={[styles.statCard, styles.statCardShadow, { backgroundColor: '#fff', borderColor: '#3b82f6', borderWidth: 1 }]}>
            <Text style={[styles.statIcon, { color: '#3b82f6' }]}>🔄</Text>
            <Text style={[styles.statNumber, { color: '#3b82f6' }]}>
              {stats.wipCount !== undefined ? stats.wipCount : <Text style={styles.placeholderText}>--</Text>}
            </Text>
            <Text style={[styles.statLabel, { color: '#3b82f6' }]}>WIP</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardShadow, { backgroundColor: '#fff', borderColor: '#8b5cf6', borderWidth: 1 }]}>
            <Text style={[styles.statIcon, { color: '#8b5cf6' }]}>🌐</Text>
            <Text style={[styles.statNumber, { color: '#8b5cf6' }]}>
              {stats.admissionCount !== undefined ? stats.admissionCount : <Text style={styles.placeholderText}>--</Text>}
            </Text>
            <Text style={[styles.statLabel, { color: '#8b5cf6' }]}>Web Leads</Text>
          </View>
          <View style={[styles.statCard, styles.statCardShadow, { backgroundColor: '#fff', borderColor: '#f59e0b', borderWidth: 1 }]}>
            <Text style={[styles.statIcon, { color: '#f59e0b' }]}>📅</Text>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
              {stats.todayFollowUp !== undefined ? stats.todayFollowUp : <Text style={styles.placeholderText}>--</Text>}
            </Text>
            <Text style={[styles.statLabel, { color: '#f59e0b' }]}>Today Follow Up</Text>
          </View>
        </View>

        {/* Quick Insert */}
        <View style={styles.tabSection}>
          <TouchableOpacity
            style={styles.quickInsertButton}
            onPress={() => navigation.navigate('QuickInsert')}
          >
            <Text style={styles.quickInsertIcon}>🗂️</Text>
            <Text style={styles.quickInsertLabel}>Quick Insert</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Sections */}
        {tabSections.map((section) => (
          <View key={section.title} style={styles.tabSection}>
            <Text style={styles.tabSectionTitle}>{section.title}</Text>
            <View style={styles.tabRow}>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={styles.tabButton}
                  onPress={() => handleTabPress(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.tabIconCircle}>
                    <Text style={styles.tabIcon}>{item.icon}</Text>
                  </View>
                  <Text style={styles.tabLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        {/* Today's Follow-Up */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Follow-Up</Text>
          {todayFollowUpLeads.length > 0 ? (
            <View>
              {todayFollowUpLeads.map((lead, idx) => (
                <View
                  key={lead._id || idx}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#e0e7ef',
                    shadowColor: '#4F46E5',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.07,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                >
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#4F46E5' }}>
                    {lead.studentName || lead.parentName || 'Unnamed'}
                  </Text>
                  <Text style={{ color: '#64748b', marginTop: 2 }}>
                    Mobile: <Text style={{ color: '#1F2937' }}>{lead.studentMobile || '-'}</Text>
                  </Text>
                  <Text style={{ color: '#64748b', marginTop: 2 }}>
                    Course: <Text style={{ color: '#1F2937' }}>{Array.isArray(lead.course) ? lead.course.join(', ') : (lead.course || '-')}</Text>
                  </Text>
                  <Text style={{ color: '#64748b', marginTop: 2 }}>
                    Next Follow-up: <Text style={{ color: '#1F2937' }}>{lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString('en-GB') : '-'}</Text>
                  </Text>
                  {lead.remarks && lead.remarks.length > 0 && (
                    <Text style={{ color: '#64748b', marginTop: 2 }}>
                      Last Remark: <Text style={{ color: '#1F2937' }}>{lead.remarks[lead.remarks.length - 1]?.remarks || '-'}</Text>
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noFollowUpText}>No follow-ups scheduled for today.</Text>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <Text style={styles.recentActivityTitle}>Recent Activity</Text>
          {recentActivities.length === 0 ? (
            <Text style={styles.noActivityText}>No recent activity found.</Text>
          ) : (
            recentActivities.map((activity, idx) => (
              <View key={activity._id || idx} style={styles.activityItem}>
                <Text style={styles.activityTitle}>
                  {activity.studentName || activity.parentName || <Text style={styles.placeholderText}>Enquiry</Text>}
                </Text>
                <Text style={styles.activityMeta}>
                  {activity.createdAt
                    ? new Date(activity.createdAt).toLocaleString('en-GB', { hour12: true })
                    : <Text style={styles.placeholderText}>--</Text>}
                </Text>
                <Text style={styles.activityDesc} numberOfLines={2}>
                  {/* Only show string remarks, not object */}
                  {Array.isArray(activity.remarks)
                    ? activity.remarks
                        .map(r =>
                          typeof r === 'object' && r !== null && typeof r.remarks === 'string'
                            ? r.remarks
                            : null
                        )
                        .filter(Boolean)
                        .join(' | ')
                    : typeof activity.remarks === 'string'
                    ? activity.remarks
                    : activity.note || activity.response || <Text style={styles.placeholderText}>No details</Text>}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FORM MODAL for Adm Enq Form */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFormModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(31,41,55,0.45)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '85%',
            width: '100%',
            alignSelf: 'center',
            paddingBottom: 16,
            overflow: 'hidden',
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#e2e8f0',
            }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937' }}>Fill Form</Text>
              <TouchableOpacity onPress={() => setShowFormModal(false)}>
                <Text style={{ fontSize: 20, color: '#94a3b8' }}>✕</Text>
              </TouchableOpacity>
            </View>
            {formLoading ? (
              <ActivityIndicator style={{ margin: 24 }} color="#0ea5e9" />
            ) : formError ? (
              <Text style={{ color: 'red', padding: 18 }}>{formError}</Text>
            ) : availableForms.length > 1 && !selectedForm ? (
              <View style={{ padding: 18 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 18 }}>Select Form</Text>
                {availableForms.map(form => (
                  <TouchableOpacity
                    key={form.form_type}
                    style={{
                      backgroundColor: '#4F46E5',
                      borderRadius: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 18,
                      marginBottom: 12,
                      alignItems: 'center',
                    }}
                    onPress={() => setSelectedForm(form)}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{form.form_type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : availableForms.length === 1 || selectedForm ? (
              <ScrollView contentContainerStyle={{ alignItems: 'stretch', paddingVertical: 18, paddingHorizontal: 18, gap: 8 }}>
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
                  style={{
                    backgroundColor: '#0ea5e9',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    marginTop: 10,
                  }}
                  onPress={handleFormSubmit}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Submit</Text>
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
  container: { flex: 1, backgroundColor: '#F9FAFB' }, // Background
  header: {
    paddingTop: 54,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 17, color: 'rgba(255,255,255,0.92)' },
  userName: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginTop: 6, letterSpacing: 0.2 },
  placeholderText: { color: '#cbd5e1' },
  logoutButton: {
    backgroundColor: 'rgba(251,191,36,0.18)', // Accent with opacity
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.18)',
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  scrollView: { flex: 1 },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 22,
    marginTop: 28,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 12,
    marginBottom: 10,
    minWidth: 120,
    minHeight: 120,
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 0,
  },
  statCardShadow: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 6,
  },
  statIcon: { fontSize: 36, marginBottom: 10, color: '#4F46E5', opacity: 0.97 },
  statNumber: { fontSize: 34, fontWeight: 'bold', color: '#4F46E5', marginBottom: 3 },
  statLabel: { fontSize: 16, color: '#4F46E5', marginTop: 3, fontWeight: '700', letterSpacing: 0.1 },
  actionsContainer: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15,
    marginTop: 25, gap: 15,
  },
  actionButton: {
    width: '47%', backgroundColor: '#fff', padding: 20,
    borderRadius: 15, alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 8, elevation: 3,
  },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 14, fontWeight: '600', color: '#1F2937' }, // Text
  section: { padding: 24, paddingTop: 18 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937', // Text
    marginBottom: 18,
    letterSpacing: 0.2,
  },
  scheduleCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 3,
  },
  timeIndicator: {
    width: 5,
    height: 44,
    backgroundColor: '#22D3EE', // Secondary
    borderRadius: 3,
    marginRight: 18,
  },
  scheduleContent: { flex: 1 },
  scheduleTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 7 },
  followUpButton: {
    marginTop: 10,
    backgroundColor: '#4F46E5', // Primary
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  followUpButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  noFollowUpText: { color: '#64748b', fontSize: 15, marginTop: 10 },
  tabSection: { paddingHorizontal: 24, marginTop: 30 },
  tabSectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1F2937', // Text
    marginBottom: 14,
    letterSpacing: 0.1,
  },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  tabButton: {
    minWidth: '30%',
    flexGrow: 1,
    backgroundColor: '#E0F2FE', // Light cyan
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 7,
    elevation: 2,
  },
  tabIconCircle: {
    backgroundColor: '#22D3EE', // Secondary
    borderRadius: 999,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4F46E5', // Primary
  },
  tabIcon: { fontSize: 24, color: '#4F46E5' }, // Primary
  tabLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937', // Text
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.05,
  },
  recentActivity: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 26,
    marginHorizontal: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 7,
    elevation: 2,
  },
  recentActivityTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1F2937', // Text
    marginBottom: 16,
    letterSpacing: 0.1,
  },
  noActivityText: { color: '#64748b', fontSize: 15 },
  activityItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  activityTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' }, // Text
  activityMeta: { fontSize: 13, color: '#64748b', marginBottom: 3 },
  activityDesc: { fontSize: 14, color: '#475569' },
  quickInsertButton: {
    backgroundColor: '#FBBF24', // Accent
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.11,
    shadowRadius: 9,
    elevation: 5,
    marginHorizontal: 22,
    marginTop: 22,
  },
  quickInsertIcon: { fontSize: 30, marginBottom: 8, color: '#4F46E5' }, // Primary
  quickInsertLabel: { fontSize: 16, fontWeight: '700', color: '#1F2937' }, // Text
});