import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

// Your custom theme colors
const theme = {
  primary: '#4A3780',
  accent: '#FFFFFF',
  inactive: 'rgba(255, 255, 255, 0.7)',
};

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 70;
const HUMP_HEIGHT = 40;
const HUMP_WIDTH = 80;

// This is a direct mapping from your route names to the icons
const iconMapping = {
  community: 'people',
  index: 'home',
  profile: 'person-circle',
};

export function CustomTabBar({ state, navigation }) {
  const { bottom } = useSafeAreaInsets();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [currentHumpCenter, setCurrentHumpCenter] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Calculate the number of visible tabs
  const visibleRoutes = state.routes.filter((route) => iconMapping[route.name]);
  const tabWidth = width / visibleRoutes.length;
  
  // Find the index of the currently focused visible tab
  const focusedVisibleIndex = visibleRoutes.findIndex((route) => {
    const originalIndex = state.routes.findIndex((r) => r.key === route.key);
    return originalIndex === state.index;
  });

  // Memoize the animation function to prevent unnecessary re-renders
  const animateToTab = useCallback((targetIndex) => {
    if (isAnimating) return; // Prevent multiple animations
    
    const targetCenter = tabWidth * (targetIndex + 0.5);
    
    setIsAnimating(true);
    
    Animated.spring(animatedValue, {
      toValue: targetCenter,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start(() => {
      setIsAnimating(false);
    });
  }, [tabWidth, isAnimating, animatedValue]);

  useEffect(() => {
    // Only animate if we have a valid focused index and we're not already animating
    if (focusedVisibleIndex !== -1 && !isAnimating) {
      animateToTab(focusedVisibleIndex);
    }
  }, [focusedVisibleIndex, animateToTab, isAnimating]);

  useEffect(() => {
    // Set initial position if not set
    if (currentHumpCenter === 0 && focusedVisibleIndex !== -1) {
      const initialCenter = tabWidth * (focusedVisibleIndex + 0.5);
      setCurrentHumpCenter(initialCenter);
      animatedValue.setValue(initialCenter);
    }
  }, [focusedVisibleIndex, tabWidth, currentHumpCenter, animatedValue]);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value }) => {
      setCurrentHumpCenter(value);
    });
    
    return () => {
      animatedValue.removeListener(listener);
    };
  }, [animatedValue]);

  // Prevent hump from resetting when navigating within the same tab
  useFocusEffect(
    useCallback(() => {
      // This ensures the hump position is maintained when returning to the tab bar
      if (focusedVisibleIndex !== -1) {
        const targetCenter = tabWidth * (focusedVisibleIndex + 0.5);
        if (Math.abs(currentHumpCenter - targetCenter) > 5) {
          setCurrentHumpCenter(targetCenter);
          animatedValue.setValue(targetCenter);
        }
      }
    }, [focusedVisibleIndex, tabWidth, currentHumpCenter, animatedValue])
  );

  // Create smooth tab bar path with integrated hump
  const createTabBarPath = (humpCenter) => {
    const humpLeft = humpCenter - HUMP_WIDTH / 2;
    const humpRight = humpCenter + HUMP_WIDTH / 2;
    const cornerRadius = 20;
    const baseY = HUMP_HEIGHT;
    
    // Ensure hump doesn't go outside screen bounds
    const safeHumpLeft = Math.max(cornerRadius + 10, humpLeft);
    const safeHumpRight = Math.min(width - cornerRadius - 10, humpRight);
    const safeHumpCenter = (safeHumpLeft + safeHumpRight) / 2;
    
    return `
      M 0 ${baseY + cornerRadius}
      Q 0 ${baseY} ${cornerRadius} ${baseY}
      L ${safeHumpLeft - 20} ${baseY}
      Q ${safeHumpLeft - 10} ${baseY} ${safeHumpLeft} ${baseY - 5}
      Q ${safeHumpCenter - 20} 5 ${safeHumpCenter} 5
      Q ${safeHumpCenter + 20} 5 ${safeHumpRight} ${baseY - 5}
      Q ${safeHumpRight + 10} ${baseY} ${safeHumpRight + 20} ${baseY}
      L ${width - cornerRadius} ${baseY}
      Q ${width} ${baseY} ${width} ${baseY + cornerRadius}
      L ${width} ${TAB_BAR_HEIGHT + HUMP_HEIGHT + bottom}
      L 0 ${TAB_BAR_HEIGHT + HUMP_HEIGHT + bottom}
      Z
    `;
  };

  return (
    <View style={[styles.tabBarContainer, { height: TAB_BAR_HEIGHT + HUMP_HEIGHT + bottom }]}>
      {/* Tab bar background with animated hump */}
      <View style={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <Svg
          width={width}
          height={TAB_BAR_HEIGHT + HUMP_HEIGHT + bottom}
          viewBox={`0 0 ${width} ${TAB_BAR_HEIGHT + HUMP_HEIGHT + bottom}`}
        >
          <Path
            fill={theme.primary}
            d={createTabBarPath(currentHumpCenter)}
          />
        </Svg>
      </View>

      {/* Container for the buttons */}
      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          // Only render buttons that are in our icon mapping
          if (!iconMapping[route.name]) return null;

          const isFocused = state.index === index;
          const iconName = iconMapping[route.name];

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Calculate if this tab should be elevated (in the hump)
          const visibleIndex = visibleRoutes.findIndex((r) => r.key === route.key);
          const isInHump = visibleIndex === focusedVisibleIndex;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Animated.View style={[
                styles.iconContainer,
                isInHump && {
                  transform: [{ translateY: -HUMP_HEIGHT + 10 }],
                }
              ]}>
                <View style={[
                  styles.iconWrapper,
                ]}>
                  <Ionicons
                    name={isFocused ? iconName : `${iconName}-outline`}
                    size={isInHump ? 32 : 26}
                    color={isFocused ? theme.accent : theme.inactive}
                  />
                  {/* Add small circle indicator for home icon when focused */}
                  {route.name === 'index' && isFocused && (
                    <View style={styles.homeIndicator} />
                  )}
                </View>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  tabBarInner: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT + HUMP_HEIGHT,
    alignItems: 'flex-end',
    paddingBottom: 15,
    zIndex: 2,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    position: 'relative',
  },
  homeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B', // Red color for the indicator
  },
});