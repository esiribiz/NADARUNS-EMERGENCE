import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { setRole, Role } from "../src/role";
import { useTheme } from "../src/ThemeContext";
import { radius, shadows, spacing } from "../src/theme";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [selected, setSelected] = useState<Role | null>(null);

  const choose = async (role: Role) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSelected(role);
    await setRole(role);
    setTimeout(() => router.replace(role === "driver" ? "/" : "/business"), 200);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]} testID="welcome-screen">
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
          <Ionicons name="navigate" size={28} color="#fff" />
        </View>
        <Text style={[styles.brand, { color: colors.textPrimary }]}>NadaRuns</Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>Modern logistics. Less empty runs.</Text>
      </Animated.View>

      <Animated.Text entering={FadeIn.delay(180)} style={[styles.question, { color: colors.textPrimary }]}>
        How will you use NadaRuns?
      </Animated.Text>

      <View style={{ flex: 1, justifyContent: "center", gap: spacing.lg }}>
        <RoleCard
          icon="bicycle"
          title="I'm a Driver"
          subtitle="Accept deliveries and earn on your schedule"
          color={colors.primary}
          textColor={colors.textPrimary}
          subColor={colors.textSecondary}
          surface={colors.surface}
          border={colors.border}
          selected={selected === "driver"}
          delay={260}
          onPress={() => choose("driver")}
          testID="role-driver"
        />
        <RoleCard
          icon="briefcase"
          title="I'm a Shipper / Business"
          subtitle="Send packages and track deliveries in real-time"
          color={colors.secondary}
          textColor={colors.textPrimary}
          subColor={colors.textSecondary}
          surface={colors.surface}
          border={colors.border}
          selected={selected === "business"}
          delay={340}
          onPress={() => choose("business")}
          testID="role-business"
        />
      </View>

      <Animated.Text entering={FadeInUp.delay(440)} style={[styles.footer, { color: colors.textSecondary }]}>
        You can switch role anytime in Settings
      </Animated.Text>
    </View>
  );
}

function RoleCard(props: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  textColor: string;
  subColor: string;
  surface: string;
  border: string;
  selected: boolean;
  delay: number;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Animated.View entering={FadeInUp.delay(props.delay)}>
      <Pressable
        onPress={props.onPress}
        style={({ pressed }) => [
          styles.roleCard,
          shadows.md,
          { backgroundColor: props.surface, borderColor: props.selected ? props.color : props.border, borderWidth: props.selected ? 2 : 1, opacity: pressed ? 0.85 : 1 },
        ]}
        testID={props.testID}
      >
        <View style={[styles.roleIcon, { backgroundColor: props.color }]}>
          <Ionicons name={props.icon} size={26} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.roleTitle, { color: props.textColor }]}>{props.title}</Text>
          <Text style={[styles.roleSub, { color: props.subColor }]}>{props.subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={props.subColor} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl },
  header: { alignItems: "center" },
  logoWrap: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 32, fontWeight: "900", letterSpacing: -1, marginTop: 12 },
  tagline: { fontSize: 14, marginTop: 4 },
  question: { fontSize: 20, fontWeight: "700", textAlign: "center", marginTop: spacing.huge },
  roleCard: { flexDirection: "row", alignItems: "center", padding: spacing.lg, borderRadius: radius.xl, gap: 14 },
  roleIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  roleTitle: { fontSize: 17, fontWeight: "800" },
  roleSub: { fontSize: 13, marginTop: 3 },
  footer: { textAlign: "center", fontSize: 12, marginTop: spacing.lg },
});
