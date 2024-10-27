import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from 'expo-image';
import React, { useState } from "react";
import { router } from "expo-router";
import { Category } from "../types/data";

const CategoryItem = ({ item }: { item: Category }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const imageUrl = decodeURIComponent(item.icon);

  return (
    <TouchableOpacity
      onPress={() => {
        router.push({
          pathname: `(tabs)/singleCategory/${item.id}`,
          params: { title: item.categoryName },
        });
      }}
      className="mr-4 bg-white  shadow-sm rounded-lg overflow-hidden"
      style={{
        elevation: 2,
        width: 100,
        marginRight: 16, 
        borderRadius: 10
      }}
    >
      <View className="p-3 items-center mx-2">
        <View className=" rounded-full p-2 mb-2">
          {/* {isLoading && (
            <View className="absolute w-full h-full items-center justify-center bg-gray-50 z-10 rounded-full">
              <ActivityIndicator color="#4F46E5" />
            </View>
          )} */}
          <Image
            source={imageUrl}
            style={{
              width: 50,
              height: 50,
            }}
            contentFit="contain"
            transition={300}
            onLoadStart={() => setIsLoading(true)}
            onLoad={() => setIsLoading(false)}
            onError={(error) => {
              console.error("Image loading error:", error);
              setHasError(true);
              setIsLoading(false);
            }}
          />
          {hasError && (
            <View className="absolute w-full h-full items-center justify-center bg-gray-100 rounded-full">
              <Text className="text-gray-400 text-2xl">!</Text>
            </View>
          )}
        </View>
        <Text 
          className="text-gray-700 text-sm font-medium text-center"
          numberOfLines={2}
          style={{ minHeight: 40 }}
        >
          {item.categoryName}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default CategoryItem;