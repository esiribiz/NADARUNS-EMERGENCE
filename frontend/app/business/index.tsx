import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { api } from "../../src/api";
import { setRole } from "../../src/role";
import type { Business, Order } from "../../src/types";
import { useTheme } from "../../src/ThemeContext";
import { radius, shadows, spacing } from "../../src/theme";

const STATUS_LABEL: Record<string, { label: string; tint: string }> = {
  pending: { label: "Searching driver", tint: "#F59E0B" },
  accepted: { label: "Driver assigned", tint: "#147B6D" },
  enroute_pickup: { label: "To pickup", tint: "#147B6D" },
  arrived_pickup: { label: "At pickup", tint: "#147B6D" },
  picked_up: { label: "Picked up", tint: "#10B981" },
  enroute_dropoff: { label: "Out for delivery", tint: "#10B981" },
  arrived_dropoff: { label: "At customer", tint: "#10B981" },
  delivered: { label: "Delivered", tint: "#10B981" },
  rejected: { label: "Cancelled", tint: "#EF4444" },
};

export default function BusinessHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [biz, setBiz] = useState<Business | null>(null);
  const [shipments, setShipments] = useState<Order[] | null>(null);

  const load = useCallback(async () => {
    const [b, s] = await Promise.all([api.getBusiness(), api.listShipments()]);
    setBiz(b);
    setShipments(s);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!biz || !shipments) {
    return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  const active = shipments.filter((s) => s.status !== "delivered" && s.status !== "rejected");
  const delivered = shipments.filter((s) => s.status === "delivered");

  const switchToDriver = async () => {
    await setRole("driver");
    router.replace("/");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]} testID="business-home">
      <Animated.View entering={FadeInDown.duration(280)} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back</Text>
          <Text style={[styles.bizName, { color: colors.textPrimary }]} numberOfLines={1}>{biz.name}</Text>
        </View>
        <TouchableOpacity onPress={switchToDriver} style={[styles.switchBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} testID="switch-to-driver">
          <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
          <Text style={[styles.switchText, { color: colors.primary }]}>Driver</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(100)} style={[styles.statsCard, shadows.md, { backgroundColor: colors.primary }]}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{biz.total_shipments}</Text>
          <Text style={styles.statLabel}>Total shipments</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{active.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{delivered.length}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(160)} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
        <TouchableOpacity
          style={[styles.newBtn, shadows.md, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/business/new")}
          testID="new-shipment-button"
        >
          <Ionicons name="add-circle" size={22} color="#fff" />
          <Text style={styles.newBtnText}>New shipment</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACTIVE SHIPMENTS</Text>

      <FlatList
        data={[...active, ...delivered.slice(0, 5)]}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No shipments yet — create your first one</Text>
          </View>
        )}
        renderItem={({ item, index }) => {
          const s = STATUS_LABEL[item.status] || { label: item.status, tint: colors.textSecondary };
          return (
            <Animated.View entering={FadeInUp.delay(60 + index * 40)}>
              <TouchableOpacity
                style={[styles.shipmentCard, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: "/business/track", params: { id: item.id } })}
                testID={`shipment-${index}`}
              >
                <View style={styles.shipmentTop}>
                  <Text style={[styles.shipmentNumber, { color: colors.textSecondary }]}>{item.order_number}</Text>
                  <View style={[styles.statusPill, { backgroundColor: `${s.tint}22` }]}>
                    <View style={[styles.statusDot, { backgroundColor: s.tint }]} />
                    <Text style={[styles.statusText, { color: s.tint }]}>{s.label}</Text>
                  </View>
                </View>
                <View style={styles.routeRow}>
                  <View style={[styles.rDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.routeText, { color: colors.textPrimary }]} numberOfLines={1}>{item.pickup.name}</Text>
                </View>
                <View style={[styles.routeLink, { backgroundColor: colors.border }]} />
                <View style={styles.routeRow}>
                  <View style={[styles.rDot, { backgroundColor: colors.secondary }]} />
                  <Text style={[styles.routeText, { color: colors.textPrimary }]} numberOfLines={1}>{item.customer.name} · {item.dropoff.address}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: spacing.xl, paddingBottom: spacing.md },
  greeting: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  bizName: { fontSize: 22, fontWeight: "800", marginTop: 2, letterSpacing: -0.4 },
  switchBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  switchText: { fontSize: 12, fontWeight: "700" },
  statsCard: { flexDirection: "row", marginHorizontal: spacing.xl, padding: spacing.lg, borderRadius: radius.xxl, alignItems: "center" },
  statBlock: { flex: 1, alignItems: "center" },
  statSep: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.18)" },
  statValue: { color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginTop: 3, textTransform: "uppercase" },
  newBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: radius.lg },
  newBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginTop: spacing.xl, marginBottom: spacing.md, paddingHorizontal: spacing.xl },
  shipmentCard: { padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1 },
  shipmentTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  shipmentNumber: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  rDot: { width: 10, height: 10, borderRadius: 5 },
  routeLink: { width: 2, height: 12, marginLeft: 4, marginVertical: 2 },
  routeText: { fontSize: 14, fontWeight: "500", flex: 1 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 14, textAlign: "center" },
});
