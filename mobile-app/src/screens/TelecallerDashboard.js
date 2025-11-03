import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import api, { getUserId } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TelecallerDashboard() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState({
    totalCalls: 0,
    remainingData: 0,
    todayFollowUp: 0,
    todaySuccessfulVisits: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
      fetchCallerCounts();
    });

    return unsubscribe;
  }, [navigation]);

  // Add debug log to help trace rendering and data
  useEffect(() => {
    console.log('Rendering TelecallerDashboard, recentActivities:', recentActivities);
  }, [recentActivities]);

  // Add this at the top of your component function
  useEffect(() => {
    console.log('TelecallerDashboard mounted');
  }, []);

  const loadUserData = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const fetchCallerCounts = async () => {
    try {
      const currentUserId = await getUserId();
      if (!currentUserId) return;

      const data = await api.fetchCallerCounts(currentUserId);
      const todaySuccessful =
        (data.TodayVisitWithParents || 0) +
        (data.TodayVisitWithoutParents || 0) +
        (data.TodayVisitOnlyParents || 0);

      const recent = await api.fetchRecentActivities(currentUserId, 3);

      setCounts({
        totalCalls: data.TodayCalls || 0,
        remainingData: data.RemainingData || 0,
        todayFollowUp: data.TodayFollowUp || 0,
        todaySuccessfulVisits: todaySuccessful,
      });
      setRecentActivities(recent);
    } catch (error) {
      console.error('Error fetching caller counts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await fetchCallerCounts();
    setRefreshing(false);
  };

  const logout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const formatActivityTime = (value) =>
    value ? new Date(value).toLocaleString('en-GB', { hour12: true }) : 'N/A';

  // Helper to safely render any value as string for Text
  const safeText = (val) => {
    if (val == null) return '';
    if (typeof val === 'string' || typeof val === 'number') return val;
    return JSON.stringify(val);
  };

  // Helper to safely render remarks (array of objects with .remarks)
  const renderRemarks = (remarks) => {
    // Defensive: Only render if remarks is an array and every item is a plain object with a string .remarks
    if (!Array.isArray(remarks) || remarks.length === 0) return null;
    return (
      <View>
        {remarks.map((r, i) => {
          if (
            r &&
            typeof r === 'object' &&
            !Array.isArray(r) &&
            Object.prototype.hasOwnProperty.call(r, 'remarks') &&
            typeof r.remarks === 'string' &&
            r.remarks.trim().length > 0
          ) {
            return <Text key={i}>{r.remarks}</Text>;
          }
          // Do not render anything for other types (including arrays, null, or objects without .remarks)
          return null;
        })}
      </View>
    );
  };

  if (!user) {
    return null; // Or a loading indicator
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello 👋</Text>
            <Text style={styles.userName}>{user?.name || 'Telecaller'}</Text>
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
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#667eea' }]}>
            <Text style={styles.statNumber}>{counts.totalCalls}</Text>
            <Text style={styles.statLabel}>Total Calls</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
            <Text style={styles.statNumber}>{counts.todaySuccessfulVisits}</Text>
            <Text style={styles.statLabel}>Successful Visits (Today)</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.statNumber}>{counts.todayFollowUp}</Text>
            <Text style={styles.statLabel}>Follow-Ups (Today)</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ec4899' }]}>
            <Text style={styles.statNumber}>{counts.remainingData}</Text>
            <Text style={styles.statLabel}>Remaining Data</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('RemainingCalls')}
          >
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionText}>Remaining Calls</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('TodayFollowUp')}
          >
            <Text style={styles.actionIcon}>⏰</Text>
            <Text style={styles.actionText}>Today Follow Up</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('ReassignData')}
          >
            <Text style={styles.actionIcon}>🔄</Text>
            <Text style={styles.actionText}>Reassign Data</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('FollowUpData')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>Follow Up Data</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivities.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyActivityText}>
                Complete calls or follow-ups to see the latest activity here.
              </Text>
            </View>
          ) : (
            recentActivities.map((activity) => (
              <TouchableOpacity
                key={activity._id}
                style={styles.activityCard}
                onPress={() => navigation.navigate('EditEnquiry', { enquiry: activity })}
              >
                <Text style={styles.activityText}>
                  📞 {safeText(activity.studentName) || 'Unknown'} —{' '}
                  {safeText(activity.studentResponse) || 'No response recorded'}
                </Text>
                <Text style={styles.activityTime}>
                  {formatActivityTime(activity.callingDate || activity.updatedAt)}
                </Text>
                {renderRemarks(activity.remarks)}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 5 },
  logoutButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  logoutText: { color: '#fff', fontWeight: '600' },
  scrollView: { flex: 1 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 15, marginTop: 20, gap: 15 },
  statCard: {
    flex: 1, padding: 20, borderRadius: 15, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 5 },
  actionsContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, marginTop: 25, gap: 15 },
  actionButton: {
    width: '47%', backgroundColor: '#fff', padding: 20,
    borderRadius: 15, alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 8, elevation: 3,
  },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 14, fontWeight: '600', color: '#333' },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  emptyActivity: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyActivityText: { fontSize: 14, color: '#666', textAlign: 'center' },
  activityCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityText: { fontSize: 14, color: '#333', marginBottom: 4 },
  activityTime: { fontSize: 12, color: '#999' },
  footer: { backgroundColor: '#FFF', padding: 15, borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  footerText: { fontSize: 14, fontWeight: '600', color: '#666', textAlign: 'center' },
});