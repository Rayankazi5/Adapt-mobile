// Mirrors the SVG ring gauge in Adapt/components/calories/FatigueCard.tsx.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RingGauge({ score, color, trackColor }: { score: number; color: string; trackColor: string }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: score / 100,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [score, progress]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <Svg width={96} height={96} viewBox="0 0 96 96" style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={48} cy={48} r={RADIUS} fill="none" strokeWidth={10} stroke={trackColor} />
      <AnimatedCircle
        cx={48}
        cy={48}
        r={RADIUS}
        fill="none"
        strokeWidth={10}
        strokeLinecap="round"
        stroke={color}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={strokeDashoffset}
      />
    </Svg>
  );
}
