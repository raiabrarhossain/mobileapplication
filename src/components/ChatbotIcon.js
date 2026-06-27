import React, { useState, useEffect } from 'react';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';

export default function ChatbotIcon({ size = 48, style }) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 150);
    }, 3200); // blink every 3.2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      style={style}
    >
      {/* 1. Body - Dark Blue Silhouette */}
      <Path
        d="M 33 75 L 33 93 C 33 111, 67 111, 67 93 L 67 75 Z"
        fill="#202C84"
      />
      
      {/* 2. Body - White Inner Fill */}
      <Path
        d="M 39 75 L 39 93 C 39 105, 61 105, 61 93 L 61 75 Z"
        fill="#FFFFFF"
      />

      {/* 3. Pendant Stem & Circle */}
      <Line
        x1="50"
        y1="75"
        x2="50"
        y2="92"
        stroke="#202C84"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <Circle cx="50" cy="98" r="9" fill="#202C84" />
      <Circle cx="50" cy="98" r="5.5" fill="#00E5A3" />

      {/* 4. Head & Ears - Dark Blue Silhouette */}
      <Path
        d="M 18 52 C 16 35, 22 12, 33 12 C 40 12, 44 32, 45 48 Z"
        fill="#202C84"
      />
      <Path
        d="M 82 52 C 84 35, 78 12, 67 12 C 60 12, 56 32, 55 48 Z"
        fill="#202C84"
      />
      <Rect
        x="14"
        y="30"
        width="72"
        height="54"
        rx="27"
        fill="#202C84"
      />

      {/* 5. Head & Ears - White Inner Fill */}
      <Path
        d="M 22 48 C 21 37, 24 20, 32 20 C 37 20, 39 34, 40 45 Z"
        fill="#FFFFFF"
      />
      <Path
        d="M 78 48 C 79 37, 76 20, 68 20 C 63 20, 61 34, 60 45 Z"
        fill="#FFFFFF"
      />
      <Rect
        x="20"
        y="36"
        width="60"
        height="42"
        rx="21"
        fill="#FFFFFF"
      />

      {/* 6. Face - Dark Blue Inner */}
      <Rect
        x="25"
        y="41"
        width="50"
        height="32"
        rx="16"
        fill="#202C84"
      />

      {/* 7. Eyes - Smiling Cyan Arches or Blinking Straight Lines */}
      {isBlinking ? (
        <>
          <Line
            x1="33"
            y1="55"
            x2="43"
            y2="55"
            stroke="#00E5A3"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <Line
            x1="57"
            y1="55"
            x2="67"
            y2="55"
            stroke="#00E5A3"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <Path
            d="M 33 57 Q 38 49 43 57"
            fill="none"
            stroke="#00E5A3"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <Path
            d="M 57 57 Q 62 49 67 57"
            fill="none"
            stroke="#00E5A3"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
}
