import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  caloriesConsumed: number;
  calorieGoal: number;
  proteinConsumed: number;
  proteinGoal: number;
  size?: number;
};

/** SVG concentric progress rings — outer for calories, inner for protein. */
export default function ProgressRings({
  caloriesConsumed,
  calorieGoal,
  proteinConsumed,
  proteinGoal,
  size = 220,
}: Props) {
  const center = size / 2;
  const outerRadius = (size - 24) / 2;
  const innerRadius = outerRadius - 30;

  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;

  const caloriePct = useSharedValue(0);
  const proteinPct = useSharedValue(0);

  useEffect(() => {
    const cp = calorieGoal > 0 ? Math.min(caloriesConsumed / calorieGoal, 1) : 0;
    const pp = proteinGoal > 0 ? Math.min(proteinConsumed / proteinGoal, 1) : 0;
    caloriePct.value = withTiming(cp, { duration: 900, easing: Easing.out(Easing.cubic) });
    proteinPct.value = withTiming(pp, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [caloriesConsumed, calorieGoal, proteinConsumed, proteinGoal]);

  const outerProps = useAnimatedProps(() => ({
    strokeDashoffset: outerCircumference * (1 - caloriePct.value),
  }));

  const innerProps = useAnimatedProps(() => ({
    strokeDashoffset: innerCircumference * (1 - proteinPct.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Calorie track */}
        <Circle
          cx={center} cy={center} r={outerRadius}
          stroke={Colors.ringTrack} strokeWidth={20}
          fill="none" strokeLinecap="round"
        />
        {/* Calorie progress */}
        <AnimatedCircle
          cx={center} cy={center} r={outerRadius}
          stroke={Colors.calorieRing} strokeWidth={20}
          fill="none" strokeLinecap="round"
          strokeDasharray={outerCircumference}
          animatedProps={outerProps}
          transform={`rotate(-90, ${center}, ${center})`}
        />
        {/* Protein track */}
        <Circle
          cx={center} cy={center} r={innerRadius}
          stroke={Colors.ringTrack} strokeWidth={18}
          fill="none" strokeLinecap="round"
        />
        {/* Protein progress */}
        <AnimatedCircle
          cx={center} cy={center} r={innerRadius}
          stroke={Colors.proteinRing} strokeWidth={18}
          fill="none" strokeLinecap="round"
          strokeDasharray={innerCircumference}
          animatedProps={innerProps}
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </Svg>
    </View>
  );
}
