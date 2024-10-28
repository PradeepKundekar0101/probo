import { Stack } from "expo-router";
import { useAuthStore } from "../src/store/authStore";
import "../global.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {GestureHandlerRootView} from "react-native-gesture-handler"
import { StatusBar } from "react-native";

const queryClient = new QueryClient();

const Layout = () => {
  const { token } = useAuthStore();
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={{ flex: 1 }}>
      <StatusBar hidden />
      <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#000' },

          }}
        >
          {token ? (
            <>
              <Stack.Screen name="(tabs)/home" />
              <Stack.Screen name="(tabs)/profile" />
              <Stack.Screen name="(tabs)/upload" />
            </>
          ) : (
            <>
              <Stack.Screen name="(auth)/login" />
              <Stack.Screen name="(auth)/main" />
              <Stack.Screen name="(auth)/createAccount" />
            </>
          )}
        </Stack>
        </GestureHandlerRootView>
      </SafeAreaView>
    </QueryClientProvider>
  );
};

export default Layout;