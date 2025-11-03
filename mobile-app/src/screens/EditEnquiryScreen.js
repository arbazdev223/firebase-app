import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { STUDENT_RESPONSES, BRANCH_OPTIONS } from '../constants/studentResponses';

export default function EditEnquiryScreen({ navigation, route }) {
  const enquiry = route?.params?.enquiry;
  const context = route?.params?.context || null;

  const initialValues = useMemo(() => ({
    studentName: enquiry?.studentName ?? '',
    fatherName: enquiry?.fatherName ?? '',
    studentMobile: enquiry?.studentMobile ?? '',
    studentAltNumber: enquiry?.studentAltNumber ?? '',
    location: enquiry?.location ?? '',
    school: enquiry?.school ?? '',
    response: enquiry?.studentResponse ?? '',
    visitDateTime: enquiry?.visitDate ? new Date(enquiry.visitDate).toISOString() : '',
    branch: enquiry?.branch ?? '',
    remarks: enquiry?.remarks?.[0]?.remarks ?? '',
    leadCategory: enquiry?.leadCategory ?? '',
  }), [enquiry]);

  const [formValues, setFormValues] = useState(initialValues);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [iosVisitPickerVisible, setIosVisitPickerVisible] = useState(false);
  const [iosVisitPickerValue, setIosVisitPickerValue] = useState(
    initialValues.visitDateTime ? new Date(initialValues.visitDateTime) : new Date()
  );

  const handleChange = (key, value) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const handleVisitDateTime = (isoString) => {
    setFormValues(prev => ({ ...prev, visitDateTime: isoString }));
  };

  const openVisitPicker = () => {
    if (Platform.OS === 'android') {
      const currentDate = formValues.visitDateTime ? new Date(formValues.visitDateTime) : new Date();
      DateTimePickerAndroid.open({
        value: currentDate,
        mode: 'date',
        onChange: (_, selectedDate) => {
          if (!selectedDate) return;
          DateTimePickerAndroid.open({
            value: selectedDate,
            mode: 'time',
            is24Hour: false,
            onChange: (_, selectedTime) => {
              if (!selectedTime) return;
              const combined = new Date(selectedDate);
              combined.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
              handleVisitDateTime(combined.toISOString());
            },
          });
        },
      });
    } else {
      setIosVisitPickerValue(formValues.visitDateTime ? new Date(formValues.visitDateTime) : new Date());
      setIosVisitPickerVisible(true);
    }
  };

  const formattedVisitDateTime = formValues.visitDateTime
    ? new Date(formValues.visitDateTime).toLocaleString('en-GB', { hour12: true })
    : 'Select Visit Date & Time';

  const handleSave = async () => {
    if (!enquiry?._id) {
      Alert.alert('Error', 'Invalid enquiry.');
      return;
    }

    if (!formValues.studentName || !formValues.studentMobile) {
      Alert.alert('Validation', 'Student name and phone are required.');
      return;
    }

    try {
      const todayIso = new Date().toISOString();

      const updatePayload = {
        studentName: formValues.studentName,
        fatherName: formValues.fatherName,
        studentMobile: formValues.studentMobile,
        studentAltNumber: formValues.studentAltNumber,
        location: formValues.location,
        school: formValues.school,
        studentResponse: formValues.response,
        visitDate: formValues.visitDateTime || null,
        branch: formValues.branch,
        leadCategory: formValues.leadCategory,
        remarks: formValues.remarks
          ? [
              {
                remarks: formValues.remarks,
                response: formValues.response || 'Follow Up',
                formType: context,
              },
            ]
          : enquiry?.remarks ?? [],
      };

      if (context === 'followUpToday' || context === 'followUpData') {
        updatePayload.todayFollowUpDate = todayIso;
      } else if (context === 'remainingCalls') {
        updatePayload.callingDate = todayIso;
      }

      await api.updateEnquiry(enquiry._id, updatePayload);

      Alert.alert('Success', 'Enquiry updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to update enquiry', error);
      Alert.alert('Error', error.message || 'Failed to update enquiry.');
    }
  };

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
        <Text style={styles.headerTitle}>Edit Enquiry</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <FormRow label="Student's Name" required>
          <TextInput
            style={styles.input}
            value={formValues.studentName}
            onChangeText={text => handleChange('studentName', text)}
            placeholder="Enter student's name"
          />
        </FormRow>

        <FormRow label="Father's Name">
          <TextInput
            style={styles.input}
            value={formValues.fatherName}
            onChangeText={text => handleChange('fatherName', text)}
            placeholder="Enter father's name"
          />
        </FormRow>

        <FormRow label="Phone" required>
          <TextInput
            style={styles.input}
            value={formValues.studentMobile}
            onChangeText={text => handleChange('studentMobile', text)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
        </FormRow>

        <FormRow label="Alt Number">
          <TextInput
            style={styles.input}
            value={formValues.studentAltNumber}
            onChangeText={text => handleChange('studentAltNumber', text)}
            placeholder="Enter alternative number"
            keyboardType="phone-pad"
          />
        </FormRow>

        <FormRow label="Location">
          <TextInput
            style={styles.input}
            value={formValues.location}
            onChangeText={text => handleChange('location', text)}
            placeholder="Enter location"
            multiline
          />
        </FormRow>

        <FormRow label="School Name">
          <TextInput
            style={styles.input}
            value={formValues.school}
            onChangeText={text => handleChange('school', text)}
            placeholder="Enter school name"
          />
        </FormRow>

        <FormRow label="Select Response">
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setResponseModalVisible(true)}
          >
            <Text
              style={
                formValues.response
                  ? styles.selectText
                  : styles.selectPlaceholder
              }
            >
              {formValues.response || 'Select Student Response'}
            </Text>
          </TouchableOpacity>
        </FormRow>

        <FormRow label="Visit Date & Time">
          <TouchableOpacity style={styles.selectInput} onPress={openVisitPicker}>
            <Text style={formValues.visitDateTime ? styles.selectText : styles.selectPlaceholder}>
              {formattedVisitDateTime}
            </Text>
          </TouchableOpacity>
        </FormRow>

        <FormRow label="Select Branch">
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setBranchModalVisible(true)}
          >
            <Text
              style={
                formValues.branch
                  ? styles.selectText
                  : styles.selectPlaceholder
              }
            >
              {formValues.branch || 'Select Branch'}
            </Text>
          </TouchableOpacity>
        </FormRow>

        <FormRow label="Remarks">
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formValues.remarks}
            onChangeText={text => handleChange('remarks', text)}
            placeholder="Enter remarks"
            multiline
          />
        </FormRow>

        <FormRow label="Lead Category">
          <TextInput
            style={styles.input}
            value={formValues.leadCategory}
            onChangeText={text => handleChange('leadCategory', text)}
            placeholder="Enter lead category"
          />
        </FormRow>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={responseModalVisible}
        animationType="slide"
        onRequestClose={() => setResponseModalVisible(false)}
        transparent
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Student Response</Text>
            <FlatList
              data={STUDENT_RESPONSES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    handleChange('response', item);
                    setResponseModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setResponseModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={iosVisitPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIosVisitPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.iosPickerContainer}>
            <DateTimePicker
              value={iosVisitPickerValue}
              mode="datetime"
              display="spinner"
              onChange={(_, selected) => {
                if (selected) setIosVisitPickerValue(selected);
              }}
            />
            <View style={styles.iosPickerActions}>
              <TouchableOpacity onPress={() => setIosVisitPickerVisible(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  handleVisitDateTime(iosVisitPickerValue.toISOString());
                  setIosVisitPickerVisible(false);
                }}
              >
                <Text style={styles.selectText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={branchModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBranchModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Branch</Text>
            <FlatList
              data={BRANCH_OPTIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    handleChange('branch', item);
                    setBranchModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setBranchModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const FormRow = ({ label, required, children }) => (
  <View style={styles.formRow}>
    <Text style={styles.labelText}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 20,
  },
  backButton: { padding: 5 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  placeholder: { width: 50 },
  form: { padding: 16, gap: 16 },
  formRow: { gap: 8 },
  labelText: { fontSize: 14, fontWeight: '600', color: '#444' },
  required: { color: '#FF3B30' },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFF',
  },
  saveButton: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  selectInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  selectText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  selectPlaceholder: {
    fontSize: 15,
    color: '#999',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  modalItemText: {
    fontSize: 16,
    color: '#444',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#EEE',
    marginHorizontal: 20,
  },
  modalCloseButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  iosPickerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  iosPickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});
