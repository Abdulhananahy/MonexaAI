import React from 'react';
import Svg, { Ellipse, Path, Circle } from 'react-native-svg';

export type MascotMood = 'happy' | 'waving' | 'celebrating' | 'thinking' | 'sleepy' | 'love';

interface MascotProps {
  mood?: MascotMood;
  size?: number;
}

/**
 * Momo — Monexa's mascot. A friendly round indigo owl with gold belly markings.
 */
export function Mascot({ mood = 'happy', size = 120 }: MascotProps) {
  const eyeState = mood === 'sleepy' ? 'sleepy' : mood === 'love' ? 'love' : 'open';

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <Ellipse cx={100} cy={185} rx={55} ry={10} fill="#4A3FB5" opacity={0.12} />

      {mood === 'waving' && (
        <Ellipse cx={158} cy={95} rx={14} ry={20} fill="#6C5CE7" rotation={25} origin="158,95" />
      )}

      <Ellipse cx={100} cy={112} rx={72} ry={68} fill="#6C5CE7" />
      <Ellipse cx={100} cy={130} rx={46} ry={42} fill="#FFC94D" />

      <Path d="M40 60 Q30 20 55 30 Q60 45 50 62 Z" fill="#4A3FB5" />
      <Path d="M160 60 Q170 20 145 30 Q140 45 150 62 Z" fill="#4A3FB5" />

      <Circle cx={76} cy={100} r={26} fill="white" />
      <Circle cx={124} cy={100} r={26} fill="white" />

      {eyeState === 'open' && (
        <>
          <Circle cx={78} cy={102} r={12} fill="#201A2B" />
          <Circle cx={122} cy={102} r={12} fill="#201A2B" />
          <Circle cx={82} cy={98} r={4} fill="white" />
          <Circle cx={126} cy={98} r={4} fill="white" />
        </>
      )}
      {eyeState === 'sleepy' && (
        <>
          <Path d="M66 102 Q78 112 90 102" stroke="#201A2B" strokeWidth={5} strokeLinecap="round" fill="none" />
          <Path d="M110 102 Q122 112 134 102" stroke="#201A2B" strokeWidth={5} strokeLinecap="round" fill="none" />
        </>
      )}
      {eyeState === 'love' && (
        <>
          <Path d="M78 96 L84 108 L90 96 Q84 88 78 96 Z" fill="#FF6B6B" />
          <Path d="M122 96 L128 108 L134 96 Q128 88 122 96 Z" fill="#FF6B6B" />
        </>
      )}

      <Path d="M92 118 L100 132 L108 118 Z" fill="#FF9F45" />

      {(mood === 'happy' || mood === 'waving' || mood === 'love') && (
        <Path d="M84 142 Q100 156 116 142" stroke="#201A2B" strokeWidth={5} strokeLinecap="round" fill="none" />
      )}
      {mood === 'celebrating' && (
        <Path d="M80 140 Q100 162 120 140" stroke="#201A2B" strokeWidth={5} strokeLinecap="round" fill="none" />
      )}
      {mood === 'thinking' && (
        <Path d="M88 146 Q100 144 112 146" stroke="#201A2B" strokeWidth={5} strokeLinecap="round" fill="none" />
      )}

      <Circle cx={60} cy={120} r={8} fill="#FF9F45" opacity={0.5} />
      <Circle cx={140} cy={120} r={8} fill="#FF9F45" opacity={0.5} />

      <Ellipse cx={60} cy={168} rx={14} ry={8} fill="#FF9F45" />
      <Ellipse cx={140} cy={168} rx={14} ry={8} fill="#FF9F45" />
    </Svg>
  );
}
