import { View, Text, ScrollView, FlatList } from "react-native";
import React from "react";
import { useAuthStore } from "../../../src/store/authStore";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../src/api/axiosInstance";
import { Category } from "../../../src/types/data";
import CategoryItem from "../../../src/components/CategoryCard";

const Home = () => {
  const { user } = useAuthStore();
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      return (await axiosInstance.get("/market/getCategories")).data;
    },
  });

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >

      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-800">
          Welcome back,
        </Text>
        <Text className="text-lg text-gray-600">
          {user.username}
        </Text>
      </View>


      <View className="mb-6">
        <Text className="text-xl font-semibold text-gray-800 mb-4">
          Categories
        </Text>
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

      <View>
        

      </View>


    </ScrollView>
  );
};

export default Home;