// app/(onboarding)/crop-selection.tsx
// Fixed: useOnboardingStore hook is now called at the TOP LEVEL of the component.
// Previously setCrops was retrieved inside handleNext (a callback) which violates
// the React Rules of Hooks and throws a runtime error in React Native.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { AuthHeader } from "@/components/AuthHeader";
import { CustomButton } from "@/components/CustomButton";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useOnboardingStore } from "@/stores/onboardingStore";

// Static crop data defined outside the component — prevents recreation on every render.
const CROPS = [
  { id: "maize", name: "Maize", image: require("@/assets/images/maize.png") },
  {
    id: "cassava",
    name: "Cassava",
    image: require("@/assets/images/cassava.png"),
  },
  {
    id: "tomato",
    name: "Tomato",
    image: require("@/assets/images/tomato.png"),
  },
  {
    id: "pepper",
    name: "Pepper",
    image: require("@/assets/images/pepper.png"),
  },
  { id: "rice", name: "Rice", image: require("@/assets/images/maize.png") },
  {
    id: "plantain",
    name: "Plantain",
    image: require("@/assets/images/plantain.png"),
  },
  { id: "yam", name: "Yam", image: require("@/assets/images/cassava.png") },
  { id: "cocoa", name: "Cocoa", image: require("@/assets/images/cocoa.png") },
  {
    id: "groundnut",
    name: "Groundnut",
    image: require("@/assets/images/pepper.png"),
  },
  {
    id: "onion",
    name: "Onion",
    image: require("@/assets/images/tomato.png"),
  },
];

export default function CropSelectionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);

  // ✅ FIXED: hook called at the TOP LEVEL — not inside handleNext.
  // React requires that every hook is called in the same order on every render.
  // Calling it inside a callback would conditionally call the hook, breaking that rule.
  const setCrops = useOnboardingStore((state) => state.setCrops);

  const toggleCrop = (id: string) => {
    setSelectedCrops((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleNext = () => {
    // Convert ids to uppercase to match the backend enum format (e.g. "MAIZE")
    const uppercaseCrops = selectedCrops.map((crop) => crop.toUpperCase());

    // Safe to call the action here — the hook itself was called above
    setCrops(uppercaseCrops);

    router.push("/review-selection");
  };

  const filteredCrops = CROPS.filter((crop) =>
    crop.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={styles.headerWrapper}>
        <AuthHeader showBackButton={false} showLoginLink={true} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: theme.text }]}>
            What are you growing?
          </Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            You can add more later
          </Text>
        </View>

        {/* Search Bar */}
        <View
          style={[styles.searchContainer, { backgroundColor: theme.surface }]}
        >
          <Ionicons
            name="search-outline"
            size={moderateScale(20)}
            color={theme.primary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search crop"
            placeholderTextColor={theme.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Crop Grid */}
        <View style={styles.gridContainer}>
          {filteredCrops.map((crop) => {
            const isSelected = selectedCrops.includes(crop.id);
            return (
              <TouchableOpacity
                key={crop.id}
                style={[
                  styles.cropCard,
                  { backgroundColor: theme.surface },
                  isSelected && { borderColor: theme.primary, borderWidth: 2 },
                ]}
                onPress={() => toggleCrop(crop.id)}
                activeOpacity={0.7}
              >
                <Image source={crop.image} style={styles.cropImage} />
                <Text style={[styles.cropName, { color: theme.text }]}>
                  {crop.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Others Button */}
        <TouchableOpacity
          style={[styles.othersCard, { backgroundColor: theme.surface }]}
          activeOpacity={0.7}
          onPress={() => console.log("Others clicked")}
        >
          <Ionicons
            name="add-outline"
            size={moderateScale(20)}
            color={theme.primary}
          />
          <Text style={[styles.othersText, { color: theme.text }]}>Others</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        {/* Disable Next if no crops selected — prevents empty submission */}
        <CustomButton
          title="Next"
          onPress={handleNext}
          disabled={selectedCrops.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerWrapper: { paddingHorizontal: scale(20) },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
  },
  headerTextContainer: {
    alignItems: "center",
    marginTop: verticalScale(0),
    marginBottom: verticalScale(24),
  },
  title: {
    fontSize: moderateScale(26),
    fontWeight: "700",
    marginBottom: verticalScale(8),
    textAlign: "center",
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontWeight: "400",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(16),
    height: verticalScale(50),
    marginBottom: verticalScale(30),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { marginRight: scale(10) },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: "500",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: scale(10),
    marginBottom: verticalScale(16),
  },
  cropCard: {
    width: "31%",
    aspectRatio: 0.85,
    borderRadius: moderateScale(12),
    padding: scale(6),
    alignItems: "center",
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: verticalScale(10),
    borderWidth: 2,
    borderColor: "transparent",
  },
  cropImage: {
    width: "100%",
    height: "75%",
    borderRadius: moderateScale(8),
    resizeMode: "cover",
    marginBottom: verticalScale(6),
  },
  cropName: {
    fontSize: moderateScale(12),
    fontWeight: "500",
    textAlign: "center",
  },
  othersCard: {
    width: moderateScale(100),
    height: verticalScale(40),
    flexDirection: "row",
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(12),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  othersText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    marginLeft: scale(6),
  },
  footer: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
  },
});
