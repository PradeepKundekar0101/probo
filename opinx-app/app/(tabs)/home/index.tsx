import { View, Text, ScrollView, FlatList, Dimensions, StyleSheet } from "react-native";
import React from "react";
import { useAuthStore } from "../../../src/store/authStore";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../src/api/axiosInstance";
import { Category, Market } from "../../../src/types/data";
import CategoryItem from "../../../src/components/CategoryCard";
import MarketItem from "../../../src/components/MarketCard";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Active from "../home/activeMarkets";
import Past from "../home/pastMarkets";

const Home = () => {
  const Tab = createMaterialTopTabNavigator();
  const { user } = useAuthStore();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      return (await axiosInstance.get("/market/getCategories")).data;
    },
  });
  
  const { data: markets } = useQuery({
    queryKey: ["markets"],
    queryFn: async () => {
      return (await axiosInstance.get("/market/getMarkets")).data;
    },
  });
  
  console.log(markets);

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-800">Welcome back,</Text>
        <Text className="text-lg text-gray-600">{user.username}</Text>
      </View>

      <View className="mb-6">
        <Text className="text-xl font-semibold text-gray-800 mb-4">Categories</Text>
        {categories && categories.data && (
          <FlatList
            className="w-full"
            data={categories.data}
            keyExtractor={(item: Category) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
            renderItem={({ item }: { item: Category }) => (
              <CategoryItem item={item} />
            )}
          />
        )}
      </View>

      <View className="flex-1 h-full bg-bgDark text-white">
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabBarLabel,
            tabBarIndicatorStyle: styles.tabBarIndicator,
          }}
        >
          <Tab.Screen name="Active Markets" component={Active} />
          <Tab.Screen name="Past events" component={Past} />
        </Tab.Navigator>

        {markets && markets.data && (
          <FlatList
            className="w-full"
            data={markets.data}
            keyExtractor={(item: Market) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
            renderItem={({ item }: { item: Market }) => (
              <MarketItem item={item} />
            )}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "transparent",
    marginBottom:20
  },
  tabBarLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#292929",

  },
  tabBarIndicator: {
    backgroundColor: "#000",
    height: 3,
  },
});

export default Home;
