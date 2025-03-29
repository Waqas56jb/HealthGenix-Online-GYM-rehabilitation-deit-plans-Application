import styled from 'styled-components';
import { TextInput, TouchableOpacity, View, Text, Image } from 'react-native';
import Constants from 'expo-constants';

// Status bar height for consistent padding across devices
const StatusBarHeight = Constants.statusBarHeight;
export const Colors = {
  primary: '#ffffff', // White for main text
  secondary: '#E5E7EB',
  tertiary: '#ffffff', // White for text color
  darkLight: '#9CA3AF',
  brand: '#FFD700', // Yellow for headings
  green: '#10B981',
  red: '#EF4444',
  googleGreen: '#34A853',
};

const { primary, secondary, tertiary, darkLight, brand, green, red, googleGreen } = Colors;

// Styled Components
export const StyledContainer = styled.View`
  flex: 1;
  padding: 25px;
  padding-top: ${StatusBarHeight + 30}px;
  background-color: black;
`;

export const InnerContainer = styled.View`
  flex: 1;
  width: 100%;
  align-items: center;
`;

export const WelcomeContainer = styled(InnerContainer)`
  padding: 25px;
  padding-top: 10px;
  justify-content: center;
`;

export const PageLogo = styled.Image`
  width: 200px;
  height: 150px;
  margin-bottom: 10px;
`;

export const Avatar = styled.Image`
  width: 100px;
  height: 100px;
  margin: auto;
  border-radius: 50px;
  border-width: 2px;
  border-color: ${secondary};
  margin-bottom: 10px;
  margin-top: 10px;
`;

export const WelcomeImage = styled.Image`
  height: 50%;
  min-width: 100px;
`;

export const PageTitle = styled.Text`
  font-size: 30px;
  text-align: center;
  font-weight: bold;
  color: ${primary}; /* White for headings */
  padding: 10px;

  ${(props) =>
    props.welcome &&
    `font-size: 35px;`}
`;

export const SubTitle = styled.Text`
  font-size: 18px;
  margin-bottom: 20px;
  letter-spacing: 1px;
  font-weight: bold;
  color: ${primary}; /* White for subtitle */
`;

export const StyledFormArea = styled.View`
  width: 90%; /* Increased width for the form */
  background-color: black;
  padding: 20px;
  border-radius: 10px;
`;

export const StyledTextInput = styled(TextInput)`
  background-color: ${secondary};
  padding: 15px;
  padding-left: 55px;
  padding-right: 55px;
  border-radius: 5px;
  font-size: 16px;
  height: 50px; /* Reduced height */
  margin-vertical: 3px;
  margin-bottom: 10px;
  color: black; /* Text inside the input fields is black */
  width: 100%; /* Ensure it stretches across */
`;

export const StyledInputLabel = styled.Text`
  color: ${primary}; /* White */
  font-size: 13px;
  text-align: left;
`;

export const LeftIcon = styled.View`
  left: 15px;
  top: 38px;
  position: absolute;
  z-index: 1;
`;

export const RightIcon = styled.TouchableOpacity`
  right: 15px;
  top: 38px;
  position: absolute;
  z-index: 1;
`;

export const StyledButton = styled.TouchableOpacity`
  padding: 15px;
  background-color: ${primary}; /* White for button */
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  margin-vertical: 5px;
  height: 60px;

  ${(props) =>
    props.google &&
    `background-color: ${googleGreen};
      flex-direction: row;
      justify-content: center;
      align-items: center;`}
`;

export const ButtonText = styled.Text`
  color: black; /* Black for button text */
  font-size: 16px;
  text-align: center;

  ${(props) =>
    props.google &&
    `margin-left: 10px;`}
`;

export const MsgBox = styled.Text`
  text-align: center;
  font-size: 13px;
  color: ${red}; /* Default error styling */
`;

export const Line = styled.View`
  height: 1px;
  width: 100%;
  background-color: ${darkLight};
  margin-vertical: 10px;
`;

export const ExtraView = styled.View`
  justify-content: center;
  flex-direction: row;
  align-items: center;
  padding: 10px;
`;

export const ExtraText = styled.Text`
  justify-content: center;
  align-content: center;
  color: ${primary}; /* White for extra text */
  font-size: 15px;
`;

export const TextLink = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
`;

export const TextLinkContent = styled.Text`
  color: ${brand}; /* Yellow for link text */
  font-size: 15px;
`;

export const StyledButtonContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const StyledButtonInner = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

export const PageTitleSecondary = styled.Text`
  font-size: 36px;
  color: white; /* White for secondary title */
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
`;

export const StyledButtonSecondary = styled.TouchableOpacity`
  background-color: ${primary};
  padding: 15px 30px;
  margin: 10px;
  border-radius: 10px;
  width: 45%;
  align-items: center;
`;

export const ButtonTextSecondary = styled.Text`
  color: ${primary}; /* White for secondary button text */
  font-size: 18px;
  font-weight: bold;
`;

export const LineSecondary = styled.View`
  border-bottom-width: 1px;
  border-bottom-color: ${darkLight};
  width: 100%;
  margin: 10px 0;
`;

export const ExtraViewSecondary = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`;

export const ExtraTextSecondary = styled.Text`
  color: ${darkLight}; /* Gray text */
  font-size: 14px;
`;

export const TextLinkSecondary = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
`;

export const TextLinkContentSecondary = styled.Text`
  color: ${brand}; /* Yellow for secondary link */
  font-size: 14px;
  font-weight: bold;
`;
