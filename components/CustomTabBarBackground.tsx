import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// You can pass theme color as a prop or use context if you want to support dark mode dynamically
const theme = {
  primary: '#4A3780',
};

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 65;

export function CustomTabBarBackground() {
  const { bottom } = useSafeAreaInsets();

  // House shape SVG path for the tab bar background
  const d = `M0,20 Q0,0 20,0 H${width/2 - 45} Q${width/2},45 ${width/2 + 45},0 H${width - 20} Q${width},0 ${width},20 V${TAB_BAR_HEIGHT + bottom} H0 Z`;

  return (
    <View style={[styles.container, { height: TAB_BAR_HEIGHT + bottom }]}>
      <Svg
        width={width}
        height={TAB_BAR_HEIGHT + bottom}
        viewBox={`0 0 ${width} ${TAB_BAR_HEIGHT + bottom}`}
      >
        <Path fill={theme.primary} d={d} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: -1, // ensures the background stays behind tab icons
  },
});