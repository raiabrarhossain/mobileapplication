import React from 'react';
import { Image } from 'react-native';

const ROBOT_ICON = require('../assets/chatbot_robot.png');

function ChatbotIcon({ size = 48, style, resizeMode = 'contain' }) {
  return (
    <Image
      source={ROBOT_ICON}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
      resizeMode={resizeMode}
    />
  );
}

export default React.memo(ChatbotIcon);
