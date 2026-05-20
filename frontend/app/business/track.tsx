import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { api } from "../../src/api";
import type { Order, RoutePoint } from "../../src/types";
import { useTheme } from "../../src/ThemeContext";
import { radius, shadows, spacing } from "../../src/theme";
import MapView from "../../src/components/MapView";

const STAGES: { key: Order["status"]; label: string }[] = [
  { key: "pending", label: "Searching driver" },
  { key: "accepted", label: "Driver assigned" },
  { key: "enroute_pickup", label: "Heading to pickup" },
  { key: "picked_up", label: "Picked up" },
  { key: "enroute_dropoff", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

export default function TrackShipment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [order, setOrder] = useState<Order | null>(null);
  const [routePts, setRoutePts] = useState<RoutePoint[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const o = await api.getShipment(id);
    setOrder(o);
    try {
      const r = await api.getRoute(id);
      setRoutePts(r.points);
    } catch {}
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Live polling
  useEffect(() => {
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  if (!order) {
    return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  const stageIdx = STAGES.findIndex((s) => s.key === order.status);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="track-shipment-screen">
      <View style={StyleSheet.absoluteFill}>
        <MapView pickup={order.pickup} dropoff={order.dropoff} routePoints={routePts} showRoute />
      </View>

      <Animated.View entering={FadeInDown} style={[styles.topBar, { top: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.replace("/business")} style={[styles.iconBtn, shadows.md, { backgroundColor: colors.surface }]} testID="track-back">
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.numberPill, shadows.md, { backgroundColor: colors.surface }]}>
          <Text style={[styles.numberText, { color: colors.textPrimary }]}>{order.order_number}</Text>
        </View>
        <View style={{ width: 44 }} />
      </Animated.View>

      <Animated.View entering={FadeInUp.springify().damping(18)} style={[styles.sheet, shadows.lg, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <Text style={[styles.stageLabel, { color: colors.primary }]}>{STAGES[Math.max(0, stageIdx)]?.label || order.status}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{order.customer.name}</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>{order.dropoff.address}</Text>

        <View style={[styles.progressBar, { backgroundColor: colors.surfaceMuted }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${((Math.max(0, stageIdx) + 1) / STAGES.length) * 100}%` }]} />
        </View>

        <View style={styles.stages}>
          {STAGES.map((s, i) => (
            <View key={s.key} style={styles.stageRow}>
              <View style={[styles.stageDot, { backgroundColor: i <= stageIdx ? colors.primary : colors.border }]}>
                {i <= stageIdx ? <Ionicons name="checkmark" size={11} color="#fff" /> : null}
              </View>
              <Text style={[styles.stageText, { color: i <= stageIdx ? colors.textPrimary : colors.textSecondary, fontWeight: i === stageIdx ? "800" : "500" }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.meta, { borderTopColor: colors.border }]}>
          <View style={styles.metaCol}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Distance</Text>
            <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{order.distance_km.toFixed(1)} km</Text>
          </View>
          <View style={[styles.metaSep, { backgroundColor: colors.border }]} />
          <View style={styles.metaCol}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>ETA</Text>
            <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{order.eta_minutes} min</Text>
          </View>
          <View style={[styles.metaSep, { backgroundColor: colors.border }]} />
          <View style={styles.metaCol}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Cost</Text>
            <Text style={[styles.metaValue, { color: colors.textPrimary }]}>${order.earnings.toFixed(2)}</Text>
          </View>
        </View>

        {order.proof_photo ? (
          <View style={[styles.proofBox, { borderColor: colors.success, backgroundColor: `${colors.success}11` }]} testID="proof-photo-banner">
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.proofText, { color: colors.textPrimary }]}>Delivery proof captured</Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: { position: "absolute", left: spacing.lg, right: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 5 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  numberPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill },
  numberText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.6 },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  handle: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, marginBottom: spacing.md },
  stageLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { fontSize: 22, fontWeight: "800", marginTop: 4, letterSpacing: -0.5 },
  sub: { fontSize: 13, marginTop: 2 },
  progressBar: { marginTop: spacing.lg, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  stages: { marginTop: spacing.lg, gap: 8 },
  stageRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stageDot: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  stageText: { fontSize: 13 },
  meta: { flexDirection: "row", marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1 },
  metaCol: { flex: 1, alignItems: "center" },
  metaSep: { width: 1, height: 30 },
  metaLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  metaValue: { fontSize: 15, fontWeight: "800", marginTop: 4 },
  proofBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, marginTop: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  proofText: { fontSize: 13, fontWeight: "600" },
});
