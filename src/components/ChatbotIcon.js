import React from 'react';
import { Image } from 'react-native';
import { CHATBOT_ROBOT_BASE64 } from '../assets/chatbot_robot_base64';

export default function ChatbotIcon({ size = 48, style, resizeMode = 'contain' }) {
  return (
    <Image
      source={{ uri: CHATBOT_ROBOT_BASE64 }}
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
