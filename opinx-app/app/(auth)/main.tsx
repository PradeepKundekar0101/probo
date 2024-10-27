import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { router } from 'expo-router'

const Main = () => {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className='bg-white'>
      <View className='flex-1 justify-end px-4 pb-10'>
        <Text className='text-4xl text-center mb-8'>
          Welcome to OpinX
        </Text>
        
        <TouchableOpacity onPress={()=>{
          router.push("/(auth)/login")
        }} className='bg-black flex items-center justify-center py-3 px-3 rounded-md mb-3'>
          <Text className='text-xl text-white text-center'>
            Sign In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
         onPress={()=>{
          router.push("/(auth)/createAccount")
        }} 
           className='bg-white border border-black flex items-center justify-center py-3 px-3 rounded-md'>
          <Text className='text-xl text-black text-center'>
            Create an Account
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

export default Main
