import { View, Text,Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { useAuthStore } from '../../../src/store/authStore'
import { router } from 'expo-router'

const Profile = () => {
  const {user,clearAuth} = useAuthStore()
  return (
    <View>
      <View className=' flex justify-center items-center my-10'>
      <Image className=' w-40 h-40 rounded-full' source={{uri:"https://global.discourse-cdn.com/turtlehead/original/2X/c/c830d1dee245de3c851f0f88b6c57c83c69f3ace.png"}}/>
      <Text className=' text-2xl mt-5 font-semibold'>
        {user.username}
      </Text>
        <View>
          <TouchableOpacity 
            className=' bg-red-600 px-6 py-2 rounded-md mt-2'
          onPress={()=>{
clearAuth();
router.navigate("/(auth)/main")
          }}>
          <Text className=' text-white '>
              Logout
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  )
}

export default Profile