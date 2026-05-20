import React, { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { api } from "../../src/api";
import { useTheme } from "../../src/ThemeContext";
import { radius, shadows, spacing } from "../../src/theme";

export default function NewShipment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pickupName, setPickupName] = useState("Nordic Bowl");
  const [pickupAddr, setPickupAddr] = useState("12 Hamngatan, Stockholm");
  const [dropAddr, setDropAddr] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [apt, setApt] = useState("");
  const [notes, setNotes] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [priority, setPriority] = useState<"standard" | "express">("standard");
  const [submitting, setSubmitting] = useState(false);

  const canStep1 = !!pickupName && !!pickupAddr && !!dropAddr;
  const canStep2 = !!customerName && !!customerPhone;
  const canStep3 = !!itemName && Number(itemQty) > 0;

  const submit = async () => {
    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      // Use Stockholm-area coords with small jitter for demo
      const pickup_lat = 59.3326 + (Math.random() - 0.5) * 0.005;
      const pickup_lng = 18.0649 + (Math.random() - 0.5) * 0.01;
      const dropoff_lat = 59.3360 + (Math.random() - 0.5) * 0.01;
      const dropoff_lng = 18.0710 + (Math.random() - 0.5) * 0.015;
      const created = await api.createShipment({
        pickup_name: pickupName, pickup_address: pickupAddr, pickup_lat, pickup_lng,
        dropoff_name: customerName, dropoff_address: dropAddr, dropoff_lat, dropoff_lng,
        customer_name: customerName, customer_phone: customerPhone,
        customer_apartment: apt, customer_notes: notes,
        items: [{ name: itemName, quantity: Number(itemQty) }],
        priority,
      });
      router.replace({ pathname: "/business/track", params: { id: created.id } });
    } catch (e) {
      console.warn("create shipment failed", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]} testID="new-shipment-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surface }]} testID="new-shipment-back">
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>New shipment</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.steps}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.stepDot, { backgroundColor: n <= step ? colors.primary : colors.border }]} />
        ))}
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + 100 }}>
        {step === 1 && (
          <Animated.View entering={FadeInUp} style={{ gap: spacing.lg }} testID="step-1">
            <SectionTitle text="Pickup" colors={colors} />
            <Field label="Pickup name" value={pickupName} onChangeText={setPickupName} icon="storefront-outline" colors={colors} testID="pickup-name" />
            <Field label="Pickup address" value={pickupAddr} onChangeText={setPickupAddr} icon="location-outline" colors={colors} testID="pickup-address" />
            <SectionTitle text="Dropoff" colors={colors} />
            <Field label="Dropoff address" value={dropAddr} onChangeText={setDropAddr} icon="navigate-outline" colors={colors} testID="dropoff-address" placeholder="e.g. 15 Birger Jarlsgatan" />
          </Animated.View>
        )}
        {step === 2 && (
          <Animated.View entering={FadeInUp} style={{ gap: spacing.lg }} testID="step-2">
            <SectionTitle text="Customer" colors={colors} />
            <Field label="Customer name" value={customerName} onChangeText={setCustomerName} icon="person-outline" colors={colors} testID="customer-name" />
            <Field label="Customer phone" value={customerPhone} onChangeText={setCustomerPhone} icon="call-outline" colors={colors} keyboardType="phone-pad" testID="customer-phone" />
            <Field label="Apartment / floor (optional)" value={apt} onChangeText={setApt} icon="business-outline" colors={colors} testID="customer-apt" />
            <Field label="Notes for driver (optional)" value={notes} onChangeText={setNotes} icon="chatbubble-outline" colors={colors} multiline testID="customer-notes" />
          </Animated.View>
        )}
        {step === 3 && (
          <Animated.View entering={FadeInUp} style={{ gap: spacing.lg }} testID="step-3">
            <SectionTitle text="Package" colors={colors} />
            <Field label="Item description" value={itemName} onChangeText={setItemName} icon="cube-outline" colors={colors} testID="item-name" placeholder="e.g. Documents envelope" />
            <Field label="Quantity" value={itemQty} onChangeText={setItemQty} icon="add-outline" colors={colors} keyboardType="number-pad" testID="item-qty" />
            <SectionTitle text="Priority" colors={colors} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              {(["standard", "express"] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[styles.priorityTile, { backgroundColor: priority === p ? colors.primary : colors.surface, borderColor: priority === p ? colors.primary : colors.border }]}
                  testID={`priority-${p}`}
                >
                  <Ionicons name={p === "express" ? "flash" : "time-outline"} size={20} color={priority === p ? "#fff" : colors.textPrimary} />
                  <Text style={[styles.priorityText, { color: priority === p ? "#fff" : colors.textPrimary }]}>{p === "express" ? "Express (1.5x)" : "Standard"}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <Animated.View entering={FadeInDown} style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
        {step > 1 && (
          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={() => setStep((step - 1) as 1 | 2)} testID="step-back">
            <Text style={[styles.secondaryText, { color: colors.textPrimary }]}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: ((step === 1 && !canStep1) || (step === 2 && !canStep2) || (step === 3 && !canStep3) || submitting) ? 0.5 : 1 }]}
          disabled={(step === 1 && !canStep1) || (step === 2 && !canStep2) || (step === 3 && !canStep3) || submitting}
          onPress={() => {
            Keyboard.dismiss();
            if (step === 3) submit();
            else setStep((step + 1) as 2 | 3);
          }}
          testID="step-next"
        >
          <Text style={styles.primaryText}>{step === 3 ? (submitting ? "Creating..." : "Create shipment") : "Continue"}</Text>
          {step < 3 && <Ionicons name="arrow-forward" size={18} color="#fff" />}
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

function SectionTitle({ text, colors }: { text: string; colors: any }) {
  return <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1, color: colors.textSecondary, marginBottom: -8 }}>{text.toUpperCase()}</Text>;
}

function Field(props: { label: string; value: string; onChangeText: (v: string) => void; icon: keyof typeof Ionicons.glyphMap; colors: any; placeholder?: string; keyboardType?: "default" | "phone-pad" | "number-pad"; multiline?: boolean; testID?: string }) {
  return (
    <View style={[styles.field, { backgroundColor: props.colors.surface, borderColor: props.colors.border }]}>
      <Ionicons name={props.icon} size={20} color={props.colors.textSecondary} style={{ marginTop: 14 }} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: 11, color: props.colors.textSecondary, fontWeight: "700", letterSpacing: 0.5, marginTop: 8, textTransform: "uppercase" }}>{props.label}</Text>
        <TextInput
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder={props.placeholder}
          placeholderTextColor={props.colors.textSecondary}
          keyboardType={props.keyboardType}
          multiline={props.multiline}
          style={{ fontSize: 15, color: props.colors.textPrimary, fontWeight: "600", paddingVertical: 6, marginTop: 2 }}
          testID={props.testID}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", ...shadows.sm },
  heading: { fontSize: 18, fontWeight: "800" },
  steps: { flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 6 },
  stepDot: { width: 36, height: 4, borderRadius: 2 },
  field: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 8, borderRadius: radius.lg, borderWidth: 1 },
  priorityTile: { flex: 1, paddingVertical: 18, borderRadius: radius.lg, borderWidth: 1, alignItems: "center", gap: 6 },
  priorityText: { fontSize: 14, fontWeight: "700" },
  footer: { flexDirection: "row", gap: 10, padding: spacing.xl, borderTopWidth: 1 },
  primaryBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 56, borderRadius: radius.lg },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  secondaryBtn: { flex: 1, alignItems: "center", justifyContent: "center", height: 56, borderRadius: radius.lg, borderWidth: 1 },
  secondaryText: { fontWeight: "700", fontSize: 16 },
});
