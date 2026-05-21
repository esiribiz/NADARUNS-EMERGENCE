import React, { useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../ThemeContext";
import { radius, shadows, spacing } from "../theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCaptured: (base64DataUrl: string) => Promise<void> | void;
}

export default function PhotoProofModal({ visible, onClose, onCaptured }: Props) {
  const { colors } = useTheme();
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResult = (asset?: ImagePicker.ImagePickerAsset) => {
    if (!asset) return;
    const mime = asset.mimeType || "image/jpeg";
    const dataUrl = asset.base64 ? `data:${mime};base64,${asset.base64}` : asset.uri;
    setPreview(dataUrl);
  };

  const pickFromCamera = async () => {
    setError(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        if (!perm.canAskAgain) setError("Camera permission denied — enable it in Settings.");
        else setError("Camera permission is required to capture proof.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6, base64: true, allowsEditing: false,
      });
      if (!res.canceled) handleResult(res.assets[0]);
    } catch (e: any) { setError(e?.message || "Failed to open camera"); }
  };

  const pickFromGallery = async () => {
    setError(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        if (!perm.canAskAgain) setError("Photo library permission denied — enable it in Settings.");
        else setError("Photo library permission is required.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6, base64: true, allowsEditing: false,
      });
      if (!res.canceled) handleResult(res.assets[0]);
    } catch (e: any) { setError(e?.message || "Failed to open gallery"); }
  };

  const confirm = async () => {
    if (!preview) return;
    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      await onCaptured(preview);
      setPreview(null);
    } finally { setSubmitting(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={() => !submitting && onClose()}>
        <Animated.View entering={FadeIn.duration(180)} style={StyleSheet.absoluteFill} />
        <Animated.View entering={SlideInDown.springify().damping(16)} style={[styles.sheet, shadows.lg, { backgroundColor: colors.surface }]} testID="photo-proof-modal">
          <Pressable onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="camera-outline" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Capture delivery proof</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Snap a photo of the package at the customer’s door for safe handoff
            </Text>

            {preview ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: preview }} style={styles.preview} testID="proof-preview" />
                <TouchableOpacity onPress={() => setPreview(null)} style={[styles.retakeBtn, { backgroundColor: colors.surface }]} testID="retake-proof">
                  <Ionicons name="close" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.actionsRow}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={pickFromCamera} testID="proof-camera">
                  <Ionicons name="camera" size={26} color="#fff" />
                  <Text style={styles.actionText}>Take photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surfaceMuted }]} onPress={pickFromGallery} testID="proof-gallery">
                  <Ionicons name="images-outline" size={26} color={colors.textPrimary} />
                  <Text style={[styles.actionText, { color: colors.textPrimary }]}>From gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            {error ? <Text style={[styles.errText, { color: colors.error }]}>{error}</Text> : null}

            {preview ? (
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.success, opacity: submitting ? 0.7 : 1 }]} onPress={confirm} disabled={submitting} testID="proof-confirm">
                {submitting ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={styles.confirmText}>Confirm & complete delivery</Text></>}
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting} testID="proof-cancel">
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Skip for now</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.huge, alignItems: "center" },
  handle: { width: 44, height: 5, borderRadius: 3, marginBottom: spacing.lg },
  iconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4, textAlign: "center" },
  subtitle: { fontSize: 13, marginTop: 6, textAlign: "center", paddingHorizontal: spacing.md },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: spacing.xl, width: "100%" },
  actionBtn: { flex: 1, paddingVertical: 24, borderRadius: radius.lg, alignItems: "center", gap: 8 },
  actionText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  previewWrap: { marginTop: spacing.xl, width: "100%", position: "relative" },
  preview: { width: "100%", height: 220, borderRadius: radius.lg, resizeMode: "cover" },
  retakeBtn: { position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  confirmBtn: { marginTop: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: radius.lg, width: "100%" },
  confirmText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  errText: { marginTop: 10, fontSize: 13, fontWeight: "600", textAlign: "center" },
  cancelBtn: { marginTop: spacing.md, padding: 8 },
  cancelText: { fontSize: 14, fontWeight: "600" },
});
