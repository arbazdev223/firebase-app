import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import TelecallerDashboard from './src/screens/TelecallerDashboard';
import CounsellorDashboard from './src/screens/CounsellorDashboard';
import RemainingCallsScreen from './src/screens/RemainingCallsScreen';
import TodayFollowUpScreen from './src/screens/TodayFollowUpScreen';
import ReassignDataScreen from './src/screens/ReassignDataScreen';
import FollowUpDataScreen from './src/screens/FollowUpDataScreen';
import EditEnquiryScreen from './src/screens/EditEnquiryScreen';
import QuickInsertScreen from './src/screens/QuickInsertScreen';
import FilteredEnquiriesScreen from './src/screens/FilteredEnquiriesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          // Use department array for dashboard routing
          const dept = Array.isArray(user.department) ? user.department.map(d => d.toLowerCase()) : [];
          if (user._id && dept.includes('counsellor')) {
            setInitialRoute('CounsellorDashboard');
          } else if (user._id && dept.includes('Telecaller Executive')) {
            setInitialRoute('TelecallerDashboard');
          } else {
            setInitialRoute('Login');
          }
        } else {
          setInitialRoute('Login');
        }
      } catch (e) {
        setInitialRoute('Login');
      }
    };
    checkLogin();
  }, []);

  if (!initialRoute) {
    // Optionally show splash/loading here
    return null;
  }

  const todayISO = new Date().toISOString().split('T')[0];
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="TelecallerDashboard" component={TelecallerDashboard} />
          <Stack.Screen name="CounsellorDashboard" component={CounsellorDashboard} />
          <Stack.Screen name="RemainingCalls" component={RemainingCallsScreen} />
          <Stack.Screen name="TodayFollowUp" component={TodayFollowUpScreen} />
          <Stack.Screen name="ReassignData" component={ReassignDataScreen} />
          <Stack.Screen name="FollowUpData" component={FollowUpDataScreen} />
          <Stack.Screen name="EditEnquiry" component={EditEnquiryScreen} />
          <Stack.Screen name="QuickInsert" component={QuickInsertScreen} />
          <Stack.Screen
            name="FranchiseEnquiries"
            component={FilteredEnquiriesScreen}
            initialParams={{
              title: 'Franchise Enquiries',
              filters: {
                source_type: 'franchise',
                nextFollowUpDate: 'null',
                enquiryType: 'null',
                assign: 'null',
              },
              emptyMessage: 'No franchise enquiries to show.',
              includeCaller: false,
            }}
          />
          <Stack.Screen
            name="BroadcastEnquiries"
            component={FilteredEnquiriesScreen}
            initialParams={{
              title: 'Broadcast Enquiries',
              filters: {
                source: 'Double Tick',
                source_type: 'broadcasts',
                nextFollowUpDate: 'null',
                enquiryType: 'null',
                assign: 'null',
              },
              emptyMessage: 'No broadcast enquiries to show.',
              includeCaller: false,
            }}
          />
          <Stack.Screen
            name="ChatEnquiries"
            component={FilteredEnquiriesScreen}
            initialParams={{
              title: 'Chat Enquiries',
              filters: {
                source: 'Double Tick',
                source_type: 'chat',
                nextFollowUpDate: 'null',
                enquiryType: 'null',
                assign: 'null',
              },
              emptyMessage: 'No chat enquiries to show.',
              includeCaller: false,
            }}
          />
          <Stack.Screen
            name="DMLeadsEnquiries"
            component={FilteredEnquiriesScreen}
            initialParams={{
              title: 'DM Leads',
              filters: {
                source: 'DM',
                nextFollowUpDate: 'null',
                enquiryType: 'null',
                assign: 'null',
              },
              emptyMessage: 'No DM leads available right now.',
              includeCaller: false,
            }}
          />
          <Stack.Screen
            name="WebLeadsEnquiries"
            component={FilteredEnquiriesScreen}
            initialParams={{
              title: 'Web Leads',
              filters: {
                source: 'Web Lead',
                nextFollowUpDate: 'null',
                enquiryType: 'null',
                assign: 'null',
              },
              emptyMessage: 'No web leads available right now.',
              includeCaller: false,
            }}
          />
          <Stack.Screen
            name="CounsellorTodayFollowUp"
            component={FilteredEnquiriesScreen}
            initialParams={{
              title: 'Today Follow-Up',
              filters: {
                nextFollowUpDate: todayISO,
                'enquiryType!': 'Drop,Admission',
              },
              emptyMessage: 'No counsellor follow-ups scheduled for today.',
              includeCaller: false,
              identityParam: 'counsellor',
              applyNullDefaults: false,
              showCallStatus: false,
            }}
          />
          <Stack.Screen
            name="CounsellorEnquiryFollowUp"
            component={FilteredEnquiriesScreen}
            initialParams={{
              title: 'Enquiry Follow-Up',
              identityParam: 'counsellor',
              filters: {
                nextFollowUpDate: 'notnull',
                'enquiryType!': 'Drop,Admission',
              },
              emptyMessage: 'No enquiry follow-ups pending.',
              includeCaller: false,
              applyNullDefaults: false,
              showCallStatus: false,
              showFilterControls: true,
            }}
          />
          <Stack.Screen
            name="CounsellorBranchEnquiry"
            component={FilteredEnquiriesScreen}
            initialParams={{
              title: 'Branch Enquiry',
              filters: {},
              emptyMessage: 'No branch enquiries available.',
              includeCaller: false,
              applyNullDefaults: false,
              showCallStatus: false,
            }}
          />
          <Stack.Screen
            name="CounsellorEnquiryTaken"
            component={FilteredEnquiriesScreen}
            initialParams={{
              title: 'Enquiry Taken',
              filters: {
                enquiryDate: 'notnull',
              },
              emptyMessage: 'No taken enquiries found.',
              includeCaller: false,
              identityParam: 'counsellor',
              applyNullDefaults: false,
              showCallStatus: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
