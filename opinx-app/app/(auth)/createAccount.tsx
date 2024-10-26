import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useCreateAccount } from "../../src/api/auth";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";
import { storeToken, storeUser } from "../../src/utils/storage";
import { UserInterfaceIdiom } from "expo-constants";

const CreateAccount = () => {
  const { setToken, setUser } = useAuthStore();
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phonenumber: "",
  });

  const { mutate, isPending } = useCreateAccount();

  const handleInputChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.username || !formData.phonenumber || !formData.email || !formData.password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    mutate(formData, {
      onSuccess: async (data) => {

        setToken(data?.data?.data?.token);
        setUser(data?.data?.data?.user);
        await storeToken(data?.data?.data?.token);
        await storeUser(data?.data?.data?.user);
        router.replace("(tabs)/home");
      },
      onError: (error) => {
        Alert.alert("Error", "Failed to create an account. Please try again.");
        console.error("Account creation error:", error);
      },
    });
  };

  return (
    <View className="flex-1 justify-center p-4">
      <Text className="text-3xl font-bold mb-6 text-center text-springGreen">
        Create an Account
      </Text>

      <TextInput
        className="border-[1.6px] border-darkStroke text-black  px-3 py-2 text-lg rounded-md mb-2"
        placeholder="Name"
        placeholderTextColor="gray"
        value={formData.username}
        onChangeText={(value) => handleInputChange("username", value)}
      />

      <TextInput
        className="border-[1.6px] border-darkStroke text-black px-3 py-2 text-lg rounded-md mb-2"
        placeholder="Email"
        placeholderTextColor="gray"
        keyboardType="email-address"
        value={formData.email}
        onChangeText={(value) => handleInputChange("email", value)}
      />

      <TextInput
        className="border-[1.6px] border-darkStroke text-black  px-3 py-2 text-lg rounded-md mb-2"
        placeholder="Phone number"
        placeholderTextColor="gray"
        keyboardType="phone-pad"
        value={formData.phonenumber}
        onChangeText={(value) => handleInputChange("phonenumber", value)}
      />

      <TextInput
        className="border-[1.6px] border-darkStroke text-black  px-3 py-2 text-lg rounded-md mb-2"
        placeholder="Password"
        placeholderTextColor="gray"
        secureTextEntry
        value={formData.password}
        onChangeText={(value) => handleInputChange("password", value)}
      />

      {isPending ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <TouchableOpacity
          className="bg-black border text-black bg-opacity-20 py-2 px-8 rounded-md mb-4"
          onPress={handleSubmit}
        >
          <Text className="text-slate-100 text-lg text-center">
            Create Account
          </Text>
        </TouchableOpacity>
      )}

      <Text className="text-center mt-6 text-slate-700">
        Already have an account?{" "}
        <Text
          className="text-blue-700"
          onPress={() => router.replace("(auth)/login")}
        >
          Log In
        </Text>
      </Text>
    </View>
  );
};

export default CreateAccount;
