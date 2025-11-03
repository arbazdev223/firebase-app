import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api, { getUserId } from '../services/api';

export default function FollowUpDataScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  const fetchFollowUpData = async () => {
    try {
      setError(null);
      
      let currentUserId = userId;
      if (!currentUserId) {
        currentUserId = await getUserId();
        if (!currentUserId) {
          Alert.alert('Error', 'User not found. Please login again.');
          navigation.navigate('Login');
          return;
        }
        setUserId(currentUserId);
      }

      console.log('Fetching follow-up data for user:', currentUserId);
      const data = await api.fetchFollowUpData(currentUserId);
      console.log('Follow-up data received:', data);
      setEnquiries(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching follow-up data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFollowUpData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFollowUpData();
  };

  const makeCall = (primaryPhone, altPhone) => {
    // Check if both numbers are valid (not null, undefined, or empty)
    const hasPrimary = primaryPhone && primaryPhone.trim() !== '';
    const hasAlt = altPhone && altPhone.trim() !== '';
    
    // If both numbers exist, ask user which one to call
    if (hasPrimary && hasAlt) {
      Alert.alert(
        'Select Number',
        'Which number would you like to call?',
        [
          {
            text: `Primary: ${primaryPhone}`,
            onPress: () => Linking.openURL(`tel:${primaryPhone}`)
          },
          {
            text: `Alt: ${altPhone}`,
            onPress: () => Linking.openURL(`tel:${altPhone}`)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } else if (hasPrimary) {
      Linking.openURL(`tel:${primaryPhone}`);
    } else if (hasAlt) {
      Linking.openURL(`tel:${altPhone}`);
    } else {
      Alert.alert('Error', 'No phone number available');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const filteredCalls = enquiries.filter(call =>
    call.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.studentMobile?.includes(searchQuery) ||
    call.studentAltNumber?.includes(searchQuery)
  );

  const renderEnquiryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EditEnquiry', { enquiry: item, context: 'followUpData' })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.studentName || 'N/A'}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.assign}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.label}>Mobile: <Text style={styles.value}>{item.studentMobile || 'N/A'}</Text></Text>
        {item.studentAltNumber && (
          <Text style={styles.label}>Alt: <Text style={styles.value}>{item.studentAltNumber}</Text></Text>
        )}
        <Text style={styles.label}>Father: <Text style={styles.value}>{item.fatherName || 'N/A'}</Text></Text>
        <Text style={styles.label}>School: <Text style={styles.value}>{item.school || 'N/A'}</Text></Text>
        <Text style={styles.label}>Class: <Text style={styles.value}>{item.class || 'N/A'}</Text></Text>
        <Text style={styles.label}>Last Called: <Text style={styles.value}>{formatDate(item.callingDate)}</Text></Text>
        <Text style={styles.label}>Visit Date: <Text style={styles.valueHighlight}>{formatDate(item.visitDate)}</Text></Text>
        <Text style={styles.label}>Location: <Text style={styles.value}>{item.location || 'N/A'}</Text></Text>
      </View>
      <TouchableOpacity 
        style={styles.callButton}
        onPress={() => makeCall(item.studentMobile, item.studentAltNumber)}
      >
        <Text style={styles.callButtonText}>📞 Call Now</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4facfe" />
          <Text style={styles.loadingText}>Loading follow-up data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Follow-Up Data</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFollowUpData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCalls}
          renderItem={renderEnquiryItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No follow-up data found</Text>
              <Text style={styles.emptySubText}>All enquiries are up to date</Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Total: {enquiries.length} follow-ups pending</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4facfe',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 15,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    gap: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
  },
  valueHighlight: {
    fontSize: 14,
    color: '#4facfe',
    fontWeight: '600',
  },
  callButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  callButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
});