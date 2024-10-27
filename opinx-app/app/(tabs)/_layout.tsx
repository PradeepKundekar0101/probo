import { Tabs } from "expo-router";
import React from "react";
import { View, Image, Text, StatusBar } from "react-native";
import { ICONS } from "../../src/constants/index";
const TabsLayout = () => {
  const TabIconComponent = ({ name, icon, focused, color }) => {
    return (
      <View className=" items-center  justify-center  ">
        <Image
          source={icon}
          tintColor={color}
          resizeMode={"contain"}
          className="w-6 h-6 mb-1"
        />
        <Text style={{ color }}>{name}</Text>
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#4E7AFF",
        tabBarInactiveTintColor: "#CDCDE0",
        tabBarStyle: {
          backgroundColor: "#0F172A",
          borderTopColor: "#0F172A",
          borderTopWidth: 1,
        },
      }}
      backBehavior="history"
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <TabIconComponent
              name={"Home"}
              focused={focused}
              icon={ICONS.bookmark}
              color={color}
            />
          ),
        }}
      />
      
    
      <Tabs.Screen

        name="profile/index"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <TabIconComponent
              name={"Profile"}
              focused={focused}
              icon={ICONS.account}
              color={color}
            />
          ),
        }}
      />
       <Tabs.Screen
        name="history/index"
        options={{
          title: "History",
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <TabIconComponent
              name={"History"}
              focused={focused}
              icon={ICONS.watch}
              color={color}
            />
          ),
        }}
      />
        <Tabs.Screen
        name="account/index"
        options={{
          title: "Account",
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <TabIconComponent
              name={"Account"}
              focused={focused}
              icon={ICONS.account}
              color={color}
            />
          ),
        }}
      />
       
      <Tabs.Screen
        name="course/singleCourse/[courseId]"
        options={{
          title: "Course",
          href: null,
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      />
      <Tabs.Screen
        name="course/singlePlaylist/[playlistId]"
        options={{
          title: "Videos",
          href: null,
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      />
       <Tabs.Screen
        name="course/singleVideo/[videoId]"
        options={{
          title: "Video",
          href: null,
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      />
       <Tabs.Screen
        name="account/editProfile"
        options={{
          title: "Video",
          href: null,
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      />
       <Tabs.Screen
        name="account/changePassword"
        options={{
          title: "Password",
          href: null,
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      />
       
    </Tabs>
  );
};

export default TabsLayout;
