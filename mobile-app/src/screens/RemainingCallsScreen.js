import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import api, { getUserId } from '../services/api';

export default function RemainingCallsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  const fetchRemainingCalls = useCallback(async ({ showLoader = true } = {}) => {
    if (showLoader) {
      setLoading(true);
    }

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

      const data = await api.fetchRemainingCalls(currentUserId);
      setEnquiries(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching remaining calls:', err);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, [navigation, userId]);

  useFocusEffect(
    useCallback(() => {
      fetchRemainingCalls({ showLoader: true });
    }, [fetchRemainingCalls])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRemainingCalls({ showLoader: false });
  };

  const makeCall = (primaryPhone, altPhone) => {
    const hasPrimary = primaryPhone && primaryPhone.trim() !== '';
    const hasAlt = altPhone && altPhone.trim() !== '';

    if (hasPrimary && hasAlt) {
      Alert.alert(
        'Select Number',
        'Which number would you like to call?',
        [
          { text: `Primary: ${primaryPhone}`, onPress: () => Linking.openURL(`tel:${primaryPhone}`) },
          { text: `Alt: ${altPhone}`, onPress: () => Linking.openURL(`tel:${altPhone}`) },
          { text: 'Cancel', style: 'cancel' }
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

  const formatVisitDateTime = (value) =>
    value ? new Date(value).toLocaleString('en-GB', { hour12: true }) : 'N/A';

  const filteredCalls = enquiries.filter(call =>
    call.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.studentMobile?.includes(searchQuery) ||
    call.studentAltNumber?.includes(searchQuery)
  );

  const renderEnquiryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EditEnquiry', { enquiry: item, context: 'remainingCalls' })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.studentName || 'N/A'}</Text>
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => makeCall(item.studentMobile, item.studentAltNumber)}
        >
          <Text style={styles.callButtonText}>📞 Call</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.label}>Mobile: <Text style={styles.value}>{item.studentMobile || 'N/A'}</Text></Text>
        {item.studentAltNumber && (
          <Text style={styles.label}>Alt: <Text style={styles.value}>{item.studentAltNumber}</Text></Text>
        )}
        <Text style={styles.label}>Father: <Text style={styles.value}>{item.fatherName || 'N/A'}</Text></Text>
        <Text style={styles.label}>School: <Text style={styles.value}>{item.school || 'N/A'}</Text></Text>
        <Text style={styles.label}>Class: <Text style={styles.value}>{item.class || 'N/A'}</Text></Text>
        <Text style={styles.label}>Location: <Text style={styles.value}>{item.location || 'N/A'}</Text></Text>
        {item.visitDate && (
          <Text style={styles.label}>
            Visit Date:{' '}
            <Text style={styles.value}>{formatVisitDateTime(item.visitDate)}</Text>
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading remaining calls...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Remaining Data</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchRemainingCalls}>
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
              <Text style={styles.emptyText}>No remaining calls found</Text>
              <Text style={styles.emptySubText}>All assigned enquiries have been contacted</Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Total: {enquiries.length} enquiries</Text>
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
    backgroundColor: '#007AFF',
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
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: { padding: 15 },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 12, padding: 15,
    fontSize: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#34C759',
    color: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    gap: 8,
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