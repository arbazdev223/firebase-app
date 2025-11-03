import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation, route }) {
  const email = route?.params?.email ?? 'User';
  const [token, setToken] = useState(null);

  useEffect(() => { (async () => { try { const t = await AsyncStorage.getItem('auth_token'); setToken(t); } catch (err) { console.error('Error reading token', err); } })(); }, []);

  const onLogout = () => { (async () => { await AsyncStorage.removeItem('auth_token'); navigation.replace('Login'); })(); };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.welcome}>Hello, {email} 👋</Text>
      <Text style={styles.info}>This is a simple Home screen.</Text>
      {token ? <Text style={styles.token}>Token: {token.substring(0, 40)}...</Text> : null}
      <TouchableOpacity style={styles.button} onPress={onLogout}><Text style={styles.buttonText}>Logout</Text></TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }, welcome: { fontSize: 22, fontWeight: '600', marginBottom: 8 }, info: { color: '#666', marginBottom: 20 }, token: { fontSize: 10, color: '#999', marginBottom: 12 }, button: { backgroundColor: '#dc3545', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }, buttonText: { color: '#fff', fontWeight: '600' } });
