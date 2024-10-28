import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from 'expo-image';
import React, { useState } from "react";
import { router } from "expo-router";
import {  Market } from "../types/data";

const MarketItem = ({ item }: { item: Market }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const imageUrl = decodeURIComponent(item.thumbnail);

  return (
    <TouchableOpacity
      onPress={() => {
        router.push({
          pathname: `(tabs)/singleCategory/${item.id}`,
          params: { title: item.title },
        });
      }}
      className=" bg-white  shadow-sm rounded-lg overflow-hidden"
      style={{
        elevation: 2,
        // width: 100,
        marginBottom: 16, 
        borderRadius: 10
      }}
    >
      <View className="p-3 items-center mx-2">
        <View className=" rounded-full p-2 mb-2">
        <Text 
          className="text-gray-700  font-medium text-xl text-center"
          numberOfLines={2}
          style={{ minHeight: 40 }}
        >
          {item.stockSymbol}
        </Text>
          {/* {isLoading && (
            <View className="absolute w-full h-full items-center justify-center bg-gray-50 z-10 rounded-full">
              <ActivityIndicator color="#4F46E5" />
            </View>
          )} */}
          <Image
            className=" object-cover"
            source={imageUrl}
            style={{
              width: 400,
              height: 200,
              borderRadius:20
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
              <Text className="text-gray-400 text-2xl"></Text>
            </View>
          )}
        </View>
        
      </View>
    </TouchableOpacity>
  );
};

export default MarketItem;