// Example: src/components/AppLogo.js
import React from 'react';
import { Image, StyleSheet } from 'react-native';

const AppLogo = ({ style }) => (
  <Image
    source={require('../../assets/png.png')}
    style={[styles.logo, style]}
    resizeMode="contain"
    accessibilityLabel="IMS App Logo"
  />
);

const styles = StyleSheet.create({
  logo: {
    width: 120,
    height: 120,
  },
});

export default AppLogo;