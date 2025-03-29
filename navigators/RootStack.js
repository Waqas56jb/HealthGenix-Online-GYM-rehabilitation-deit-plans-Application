import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Welcome from '../screen/Welcome';
import LoginLandingPage from '../screen/LoginLandingPage';
import UserSignup from '../screen/UserSignup';
import UserLogin from '../screen/UserLogin';
import profile from '../screen/profile';
import UserPasswordReset from '../screen/UserPasswordReset';
import DietBot from '../screen/DietBot';
import LandingPageChatBot from '../screen/LandingPageChatBot';
import ForgetPasswordOTPReceived from '../screen/ForgetPassword_OTP_Received';
import CameraScreen from '../screen/CameraScreen';
import AdminLogin from '../screen/AdminLogin';
import AdminPasswordReset from '../screen/AdminPasswordReset';
import AdminDashboard from '../screen/AdminDashboard';
import AdminSetting from '../screen/AdminSetting';
import userBoard from '../screen/userBoard';
import main_modules from '../screen/main_modules';
import Admin_Analytics from '../screen/Admin_Analytics';
import Rehabilitation_Chatbot from '../screen/Rehabilitation_Chatbot';

const Stack = createStackNavigator();

const RootStack = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: 'black',
          headerTransparent: true,
          headerTitle: '',
          headerLeftContainerStyle: { paddingLeft: 20 },
        }}
      >
        
        <Stack.Screen name="userBoard" component={userBoard} />
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="LoginLandingPage" component={LoginLandingPage} />
        <Stack.Screen name="UserSignup" component={UserSignup} />
        <Stack.Screen name="UserLogin" component={UserLogin} />
        <Stack.Screen name="profile" component={profile} />
        <Stack.Screen name="UserPasswordReset" component={UserPasswordReset} />
         <Stack.Screen name="DietBot" component={DietBot} />
        <Stack.Screen name="LandingPageChatBot" component={LandingPageChatBot} />
        <Stack.Screen name="ForgetPasswordOTPReceived" component={ForgetPasswordOTPReceived} />
        <Stack.Screen name="CameraScreen" component={CameraScreen} />
        <Stack.Screen name="AdminLogin" component={AdminLogin} />
        <Stack.Screen name="AdminPasswordReset" component={AdminPasswordReset} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="AdminSetting" component={AdminSetting} />
        <Stack.Screen name="main_modules" component={main_modules} />
        <Stack.Screen name="Admin_Analytics" component={Admin_Analytics} />
        <Stack.Screen name="Rehabilitation_Chatbot" component={Rehabilitation_Chatbot} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootStack;