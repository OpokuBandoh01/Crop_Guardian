// app/(tabs)/profile.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { StatsRow } from "@/components/profile/StatsRow";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useUserProfile } from "@/hooks/useUserProfile";
import { formatPlanEndDate } from "@/services/subscriptionApi";
import { useAuthStore } from "@/stores/authStore";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { useThemeStore } from "@/stores/themeStore";

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [reputationModalVisible, setReputationModalVisible] = useState(false);

  const logoutUser = useAuthStore((state) => state.logout);

  const themePreference = useThemeStore((state) => state.themePreference);

  const { user, stats, loading, refreshing, refetch } = useUserProfile();
  const { status, fetchStatus } = useSubscriptionStore();

  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [fetchStatus]),
  );

  const isPaid = Boolean(status?.isPaid);
  const planSubtitle = isPaid
    ? `Farmer plan active until ${formatPlanEndDate(status?.endsAt)}`
    : `${status?.remainingFreeScans ?? 0} of 5 free scans left this month`;

  const reputationScore = user?.profile?.reputationScore ?? 0;
  const helpfulAnswersCount = user?.profile?.helpfulAnswersCount ?? 0;
  const solvedAnswersCount = user?.profile?.solvedAnswersCount ?? 0;

  const handlePress = (screen: string) => {
    if (screen === "Log Out") {
      setLogoutModalVisible(true);
    } else if (screen === "Personal Information" || screen === "Edit Profile") {
      router.push("/personal-info");
    } else if (screen === "Farm Information") {
      router.push("/farm-info");
    } else if (screen === "Change Password") {
      router.push("/change-password");
    } else if (screen === "Offline Database") {
      router.push("/offline-database");
    } else if (screen === "Appearance") {
      router.push("/appearance");
    } else if (screen === "Language") {
      router.push("/language");
    } else if (screen === "Notification Settings") {
      router.push("/notification-settings");
    } else if (screen === "Unit Settings") {
      router.push("/unit-settings");
    } else if (screen === "Help & Support") {
      router.push("/help-support");
    } else if (screen === "About Us") {
      router.push("/about-us");
    } else if (screen === "Rate Us") {
      router.push("/rate-us");
    } else if (screen === "Saved Posts") {
      router.push("/saved-posts");
    } else if (screen === "My Posts") {
      router.push("/my-posts");
    } else if (screen === "Subscription") {
      router.push("/subscription");
    }
  };

  const pillText = colorScheme === "light" ? "#094A04" : "#4ADE80";
  const pillBg = colorScheme === "light" ? "#EBF7E9" : "#2E3D30";
  const backdropBgColor =
    colorScheme === "light"
      ? "rgba(255, 255, 255, 0.65)"
      : "rgba(0, 0, 0, 0.75)";

  const getLanguageLabel = (code?: string): string => {
    if (code === "tw") return "Twi";
    return "English";
  };

  const getThemeLabel = (preference: string): string => {
    if (preference === "dark") return "Dark";
    if (preference === "system") return "System";
    return "Light";
  };

  const renderRow = (
    title: string,
    subtitle: string,
    iconConfig?: { name: string; type: "ionicons" | "feather" | "material" },
    rightElement?: React.ReactNode,
    isDestructive?: boolean,
    onPress?: () => void,
  ) => {
    const iconColor = isDestructive
      ? "#EF4444"
      : colorScheme === "light"
        ? "#094A04"
        : "#4ADE80";
    const titleColor = isDestructive ? "#EF4444" : theme.text;
    const subtitleColor = colorScheme === "light" ? "#687076" : "#9BA1A6";

    return (
      <TouchableOpacity
        style={styles.rowContainer}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress || isLoggingOut}
      >
        {iconConfig ? (
          <View style={styles.rowIconContainer}>
            {iconConfig.type === "ionicons" && (
              <Ionicons
                name={iconConfig.name as any}
                size={moderateScale(18)}
                color={iconColor}
              />
            )}
            {iconConfig.type === "feather" && (
              <Feather
                name={iconConfig.name as any}
                size={moderateScale(18)}
                color={iconColor}
              />
            )}
          </View>
        ) : (
          <View style={{ width: moderateScale(26) }} />
        )}

        <View style={styles.rowTextContainer}>
          <Text style={[styles.rowTitle, { color: titleColor }]}>{title}</Text>
          <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>
            {subtitle}
          </Text>
        </View>

        {rightElement ? (
          <View style={styles.rowRightContainer}>{rightElement}</View>
        ) : (
          onPress && (
            <Ionicons
              name="chevron-forward"
              size={moderateScale(16)}
              color={colorScheme === "light" ? "#094A04" : "#4ADE80"}
            />
          )
        )}
      </TouchableOpacity>
    );
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    logoutUser();
    setIsLoggingOut(false);
    setLogoutModalVisible(false);
    setTimeout(() => {
      router.replace("/(auth)/login");
    }, 50);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Profile
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
      >
        <View style={styles.profileCard}>
          <View style={styles.profileTopSection}>
            <View style={{ marginRight: scale(12) }}>
              <AvatarPicker
                avatarUrl={user?.profile?.avatarUrl}
                onUploaded={() => refetch()}
                disabled={loading || isLoggingOut}
              />
            </View>

            <View style={styles.farmerInfo}>
              <Text style={styles.farmerName}>
                {user?.profile?.fullName || "Farmer Name"}
              </Text>

              <TouchableOpacity
                style={styles.reputationChip}
                onPress={() => setReputationModalVisible(true)}
                activeOpacity={0.7}
                disabled={loading || isLoggingOut}
                accessibilityRole="button"
                accessibilityLabel={`Reputation score ${reputationScore}. Tap for details.`}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={moderateScale(12)}
                  color="#A3C89E"
                />
                <Text style={styles.reputationChipText}>{reputationScore}</Text>
              </TouchableOpacity>

              <View style={styles.cropBadge}>
                <Ionicons
                  name="leaf"
                  size={moderateScale(11)}
                  color="#A3C89E"
                />
                <Text style={styles.cropBadgeText}>
                  {user?.profile?.preferredCrops &&
                  user.profile.preferredCrops.length > 0
                    ? `${user.profile.preferredCrops[0].charAt(0).toUpperCase()}${user.profile.preferredCrops[0].slice(1).toLowerCase()} farmer`
                    : "Farmer"}
                </Text>
              </View>

              <View style={styles.locationRow}>
                <Ionicons
                  name="location-sharp"
                  size={moderateScale(12)}
                  color="#A3C89E"
                />
                <Text style={styles.locationText}>
                  {user?.profile?.location?.address || "Location not set"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.editButton,
                { opacity: loading || isLoggingOut ? 0.5 : 1 },
              ]}
              onPress={() => handlePress("Edit Profile")}
              activeOpacity={0.8}
              disabled={loading || isLoggingOut}
            >
              <Feather
                name="edit-3"
                size={moderateScale(12)}
                color="#094A04"
                style={styles.editIcon}
              />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivider} />

          <StatsRow
            stats={stats}
            loading={loading}
            onPressFollowers={() =>
              router.push({
                pathname: "/connections",
                params: { tab: "followers" },
              })
            }
            onPressFollowing={() =>
              router.push({
                pathname: "/connections",
                params: { tab: "following" },
              })
            }
          />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          Account
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
          {renderRow(
            "Personal Information",
            "View and edit your personal details",
            { name: "person-outline", type: "ionicons" },
            undefined,
            false,
            () => handlePress("Personal Information"),
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            "Subscription",
            planSubtitle,
            { name: "card-outline", type: "ionicons" },
            undefined,
            false,
            () => handlePress("Subscription"),
          )}
          <View style={styles.rowDivider} />
          {/* {renderRow(
            "Farm Information",
            "Manage your farm location and size",
            { name: "sprout-outline", type: "material" },
            undefined,
            false,
            () => handlePress("Farm Information"),
          )} */}
          <View style={styles.rowDivider} />
          {renderRow(
            "Change Password",
            "Update your password security",
            { name: "lock-closed-outline", type: "ionicons" },
            undefined,
            false,
            () => handlePress("Change Password"),
          )}
          <View style={styles.rowDivider} />
          {/* {renderRow(
            "Offline Database",
            "Download and update crop diagnostic models",
            { name: "download-outline", type: "ionicons" },
            undefined,
            false,
            () => handlePress("Offline Database"),
          )} */}
          <View style={styles.rowDivider} />
          {renderRow(
            "Saved Posts",
            "Posts you bookmarked from the community",
            { name: "bookmark-outline", type: "ionicons" },
            undefined,
            false,
            () => handlePress("Saved Posts"),
          )}
          {/*My Posts entry under Account, next to Saved Posts */}
          <View style={styles.rowDivider} />
          {renderRow(
            "My Posts",
            "Posts you shared with the community",
            { name: "document-text-outline", type: "ionicons" },
            undefined,
            false,
            () => handlePress("My Posts"),
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          Preferences
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
          {renderRow(
            "Appearance",
            "Choose your theme",
            { name: "moon-outline", type: "ionicons" },
            <View style={[styles.pillBadge, { backgroundColor: pillBg }]}>
              <Ionicons
                name={
                  themePreference === "dark"
                    ? "moon-outline"
                    : themePreference === "system"
                      ? "settings-outline"
                      : "sunny-outline"
                }
                size={moderateScale(11)}
                color={pillText}
              />
              <Text style={[styles.pillBadgeText, { color: pillText }]}>
                {getThemeLabel(themePreference)}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={moderateScale(11)}
                color={pillText}
              />
            </View>,
            false,
            () => handlePress("Appearance"),
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            "Language",
            "Select your preferred language",
            { name: "globe-outline", type: "ionicons" },
            <View style={[styles.pillBadge, { backgroundColor: pillBg }]}>
              <Text style={[styles.pillBadgeText, { color: pillText }]}>
                {getLanguageLabel(user?.language)}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={moderateScale(11)}
                color={pillText}
              />
            </View>,
            false,
            () => handlePress("Language"),
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            "Notification Settings",
            "Manage alert and update preferences",
            { name: "notifications-outline", type: "ionicons" },
            undefined,
            false,
            () => handlePress("Notification Settings"),
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            "Unit Settings",
            "Change measurement units for temperature and area",
            { name: "options-outline", type: "ionicons" },
            <View style={[styles.pillBadge, { backgroundColor: pillBg }]}>
              <Text style={[styles.pillBadgeText, { color: pillText }]}>
                Metric
              </Text>
              <Ionicons
                name="chevron-forward"
                size={moderateScale(11)}
                color={pillText}
              />
            </View>,
            false,
            () => handlePress("Unit Settings"),
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          Support & More
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
          {renderRow(
            "Help & Support",
            "Get help and answers to common questions",
            { name: "help-circle-outline", type: "ionicons" },
            null,
            false,
            () => handlePress("Help & Support"),
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            "About Us",
            "Learn more about the Crop Guardian app",
            { name: "information-circle-outline", type: "ionicons" },
            null,
            false,
            () => handlePress("About Us"),
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            "Rate Us",
            "Support our work on the App Store",
            { name: "star-outline", type: "ionicons" },
            null,
            false,
            () => handlePress("Rate Us"),
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            "Log Out",
            "Sign out of your account",
            { name: "log-out-outline", type: "ionicons" },
            null,
            true,
            () => handlePress("Log Out"),
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => {
          if (!isLoggingOut) setLogoutModalVisible(false);
        }}
      >
        <View
          style={[styles.modalBackdrop, { backgroundColor: backdropBgColor }]}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            intensity={100}
            tint={colorScheme === "light" ? "light" : "dark"}
          />

          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Are you sure you want to logout?
            </Text>
            <Text
              style={[
                styles.modalDescription,
                { color: colorScheme === "light" ? "#4B5563" : "#9BA1A6" },
              ]}
            >
              You will be logged out of your account and returned to the login
              screen. Would you like to proceed?
            </Text>

            <View
              style={[
                styles.modalDivider,
                {
                  backgroundColor:
                    colorScheme === "light" ? "#E5E7EB" : "#374151",
                },
              ]}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
                disabled={isLoggingOut}
              >
                <Text
                  style={[
                    styles.modalCancelButtonText,
                    { color: theme.text, opacity: isLoggingOut ? 0.5 : 1 },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.modalVerticalDivider,
                  {
                    backgroundColor:
                      colorScheme === "light" ? "#E5E7EB" : "#374151",
                  },
                ]}
              />

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmLogout}
                activeOpacity={0.7}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Logout</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={reputationModalVisible}
        onRequestClose={() => setReputationModalVisible(false)}
      >
        <View
          style={[styles.modalBackdrop, { backgroundColor: backdropBgColor }]}
        >
          {/* locks background interaction while open */}
          <BlurView
            style={StyleSheet.absoluteFill}
            intensity={100}
            tint={colorScheme === "light" ? "light" : "dark"}
          />

          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <View style={styles.reputationModalHeader}>
              <Ionicons
                name="shield-checkmark"
                size={moderateScale(28)}
                color={theme.primary}
              />
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Community reputation
              </Text>
            </View>

            <Text
              style={[
                styles.modalDescription,
                { color: colorScheme === "light" ? "#4B5563" : "#9BA1A6" },
              ]}
            >
              Your score grows when other farmers mark your comments as Helpful
              or Solved. Helpful answers add 1 point. Solved answers add 2
              points. Unmarking removes those points (score never goes below
              zero).
            </Text>

            <View style={styles.reputationBreakdown}>
              <View style={styles.reputationBreakdownRow}>
                <Text
                  style={[
                    styles.reputationBreakdownLabel,
                    { color: colorScheme === "light" ? "#687076" : "#9BA1A6" },
                  ]}
                >
                  Helpful answers
                </Text>
                <Text
                  style={[
                    styles.reputationBreakdownValue,
                    { color: theme.text },
                  ]}
                >
                  {helpfulAnswersCount}
                </Text>
              </View>
              <View style={styles.reputationBreakdownRow}>
                <Text
                  style={[
                    styles.reputationBreakdownLabel,
                    { color: colorScheme === "light" ? "#687076" : "#9BA1A6" },
                  ]}
                >
                  Solved answers
                </Text>
                <Text
                  style={[
                    styles.reputationBreakdownValue,
                    { color: theme.text },
                  ]}
                >
                  {solvedAnswersCount}
                </Text>
              </View>
              <View
                style={[
                  styles.reputationBreakdownRow,
                  styles.reputationTotalRow,
                  {
                    borderTopColor:
                      colorScheme === "light" ? "#E5E7EB" : "#374151",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.reputationBreakdownLabel,
                    { color: theme.text, fontWeight: "700" },
                  ]}
                >
                  Total reputation
                </Text>
                <Text
                  style={[
                    styles.reputationBreakdownValue,
                    { color: theme.primary, fontWeight: "700" },
                  ]}
                >
                  {reputationScore}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.modalDivider,
                {
                  backgroundColor:
                    colorScheme === "light" ? "#E5E7EB" : "#374151",
                },
              ]}
            />

            <TouchableOpacity
              style={styles.reputationCloseButton}
              onPress={() => setReputationModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.reputationCloseText, { color: theme.primary }]}
              >
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(10),
  },
  headerTitle: { fontSize: moderateScale(18), fontWeight: "700" },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(100),
  },
  profileCard: {
    backgroundColor: "#094A04",
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  profileTopSection: { flexDirection: "row", alignItems: "center" },
  farmerInfo: { flex: 1, justifyContent: "center" },
  farmerName: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: verticalScale(3),
  },
  cropBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
    marginBottom: verticalScale(4),
  },
  cropBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: scale(4),
  },
  locationRow: { flexDirection: "row", alignItems: "center" },
  locationText: {
    fontSize: moderateScale(11),
    color: "#A3C89E",
    marginLeft: scale(4),
  },
  editButton: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(6),
    alignSelf: "center",
  },
  editIcon: { marginRight: scale(3) },
  editButtonText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#094A04",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginVertical: verticalScale(14),
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    marginBottom: verticalScale(10),
    marginTop: verticalScale(4),
  },
  sectionCard: {
    borderRadius: moderateScale(12),
    borderWidth: 1.2,
    borderColor: "rgba(9, 74, 4, 0.08)",
    marginBottom: verticalScale(20),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(11),
  },
  rowIconContainer: {
    marginRight: scale(10),
    width: moderateScale(22),
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextContainer: { flex: 1 },
  rowTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    marginBottom: verticalScale(2),
  },
  rowSubtitle: { fontSize: moderateScale(10.5), fontWeight: "400" },
  rowRightContainer: { justifyContent: "center", alignItems: "flex-end" },
  rowDivider: {
    height: 1,
    backgroundColor: "rgba(9, 74, 4, 0.06)",
    marginHorizontal: scale(14),
  },
  pillBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(12),
  },
  pillBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    marginHorizontal: scale(4),
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(32),
  },
  modalCard: {
    width: "100%",
    borderRadius: moderateScale(14),
    paddingTop: verticalScale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  modalTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(10),
  },
  modalDescription: {
    fontSize: moderateScale(12),
    textAlign: "center",
    lineHeight: verticalScale(16),
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(20),
  },
  modalDivider: { height: 1, width: "100%" },
  modalActionsRow: {
    flexDirection: "row",
    height: verticalScale(46),
    alignItems: "center",
  },
  modalCancelButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButtonText: { fontSize: moderateScale(14), fontWeight: "600" },
  modalVerticalDivider: { width: 1, height: "100%" },
  modalConfirmButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmButtonText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#EF4444",
  },
  //NEW ADDITION: reputation chip under the name
  reputationChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: scale(4),
    marginTop: verticalScale(4),
    marginBottom: verticalScale(2),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(12),
    backgroundColor: "rgba(163, 200, 158, 0.18)",
  },
  reputationChipText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#A3C89E",
  },
  reputationModalHeader: {
    alignItems: "center",
    gap: verticalScale(8),
    marginBottom: verticalScale(8),
  },
  reputationBreakdown: {
    marginTop: verticalScale(12),
    marginBottom: verticalScale(4),
    gap: verticalScale(10),
  },
  reputationBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reputationTotalRow: {
    borderTopWidth: 1,
    paddingTop: verticalScale(10),
    marginTop: verticalScale(4),
  },
  reputationBreakdownLabel: {
    fontSize: moderateScale(13),
  },
  reputationBreakdownValue: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  reputationCloseButton: {
    paddingVertical: verticalScale(14),
    alignItems: "center",
  },
  reputationCloseText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
});
