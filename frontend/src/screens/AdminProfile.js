import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useApp } from "../context/AppContext";
import { useI18n, LANGUAGES } from "../i18n";
import { supabase } from "../config/supabase";
import { API_BASE_URL } from "../../constants/api";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ACTIVE_TAB_KEY = "firebomba_active_tab";

// Step-by-step guide shown in the Tutorial section, in the order an admin
// would normally set things up.
const TUTORIAL_STEPS = [
  {
    icon: "business-outline",
    title: "1. Create a Bilik",
    body: "Open the Bilik page and tap Add Bilik to create a building or block. Every room belongs to a bilik, so start here.",
  },
  {
    icon: "home-outline",
    title: "2. Add rooms",
    body: "On the Rooms page, tap Add Room to create each room under its bilik and record the camera, sensor and water pump installed in it. Use the pencil icon to edit a room later.",
  },
  {
    icon: "people-outline",
    title: "3. Assign users",
    body: "On the Users page, tap Add User for each resident, then use the house icon to assign them to a bilik and room. Users without a room are flagged No room.",
  },
  {
    icon: "pulse-outline",
    title: "4. Monitor sensors",
    body: "The Sensors page shows each sensor's latest temperature, smoke, CO and flame readings. A sensor that stops reporting is marked Offline.",
  },
  {
    icon: "notifications-outline",
    title: "5. Review alerts",
    body: "The Alerts page lists fire and smoke notifications. Search, sort by date, or show unread alerts only to find what needs attention.",
  },
  {
    icon: "water-outline",
    title: "6. Check water pumps",
    body: "The Pump page shows whether each room's water pump is on or off and when it last changed.",
  },
  {
    icon: "refresh-outline",
    title: "Tip: refreshing data",
    body: "Pull down on any list to refresh it. Sensors and pumps also refresh on their own; change how often under Settings below.",
  },
];

const REFRESH_OPTIONS = [
  { value: 30, label: "30 sec" },
  { value: 60, label: "1 min" },
  { value: 300, label: "5 min" },
  { value: 0, label: "Off" },
];

const START_PAGE_OPTIONS = [
  { value: "AdminUsers", label: "Users" },
  { value: "AdminBilik", label: "Bilik" },
  { value: "AdminRooms", label: "Rooms" },
  { value: "AdminSensors", label: "Sensors" },
  { value: "AdminAlerts", label: "Alerts" },
  { value: "AdminWaterpump", label: "Pump" },
];

function getInitials(name) {
  if (!name) return "A";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color="#6b7280" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "—"}</Text>
      </View>
    </View>
  );
}

function TutorialStep({ step, expanded, onToggle }) {
  const { t } = useI18n();
  return (
    <TouchableOpacity
      style={styles.infoRow}
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
    >
      <View style={styles.infoIconWrap}>
        <Ionicons name={step.icon} size={18} color="#6b7280" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.stepTitle}>{t(step.title)}</Text>
        {expanded && <Text style={styles.stepBody}>{t(step.body)}</Text>}
      </View>
      <Ionicons
        name={expanded ? "chevron-up" : "chevron-down"}
        size={18}
        color="#9ca3af"
      />
    </TouchableOpacity>
  );
}

function OptionChips({ options, value, onChange }) {
  const { t } = useI18n();
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {t(opt.label)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SettingRow({ icon, label, hint, children }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingHeader}>
        <View style={styles.infoIconWrap}>
          <Ionicons name={icon} size={18} color="#6b7280" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.stepTitle}>{label}</Text>
          {hint ? <Text style={styles.settingHint}>{hint}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function Field({ label, ...inputProps }) {
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        placeholderTextColor="#9ca3af"
        {...inputProps}
      />
    </>
  );
}

function CredentialsForm({ user, onSaved, onCancel }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    newPassword: "",
    confirmPassword: "",
    currentPassword: "",
  });
  const { t } = useI18n();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));

  const handleSave = async () => {
    setError("");
    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();

    if (!fullName && user?.fullName) {
      return setError(t("Full name cannot be empty."));
    }
    if (!EMAIL_PATTERN.test(email)) return setError(t("Enter a valid email address."));
    if (form.newPassword) {
      if (form.newPassword.length < MIN_PASSWORD_LENGTH) {
        return setError(
          t("New password must be at least {n} characters.", {
            n: MIN_PASSWORD_LENGTH,
          }),
        );
      }
      if (form.newPassword !== form.confirmPassword) {
        return setError(t("New passwords do not match."));
      }
    }
    if (
      fullName === (user?.fullName || "") &&
      email === (user?.email || "").toLowerCase() &&
      !form.newPassword
    ) {
      return setError(t("No changes to save."));
    }
    if (!form.currentPassword) {
      return setError(t("Enter your current password to confirm the changes."));
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/credentials`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          fullName,
          email,
          newPassword: form.newPassword || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(t(data.error || "Could not update credentials."));
        return;
      }
      onSaved(data.user, Boolean(form.newPassword));
    } catch {
      setError(
        t("Unable to connect to the server. Please check your connection."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.credForm}>
      <Field
        label={t("Full Name")}
        value={form.fullName}
        onChangeText={set("fullName")}
        placeholder={t("Your name")}
      />
      <Field
        label={t("Email Address")}
        value={form.email}
        onChangeText={set("email")}
        placeholder="admin@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Field
        label={t("New Password")}
        value={form.newPassword}
        onChangeText={set("newPassword")}
        placeholder={t("Leave blank to keep current password")}
        secureTextEntry
        autoComplete="new-password"
      />
      {form.newPassword ? (
        <Field
          label={t("Confirm New Password")}
          value={form.confirmPassword}
          onChangeText={set("confirmPassword")}
          placeholder={t("Re-enter new password")}
          secureTextEntry
          autoComplete="new-password"
        />
      ) : null}

      <View style={styles.credDivider} />
      <Field
        label={t("Current Password")}
        value={form.currentPassword}
        onChangeText={set("currentPassword")}
        placeholder={t("Required to save changes")}
        secureTextEntry
        autoComplete="current-password"
        onSubmitEditing={handleSave}
      />

      {error ? (
        <View style={styles.formErrorWrap}>
          <Ionicons name="alert-circle-outline" size={14} color="#dc2626" />
          <Text style={styles.formErrorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.credActions}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>{t("Cancel")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>{t("Save Changes")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminProfile() {
  const { user, setUser, settings, updateSettings } = useApp();
  const { t } = useI18n();
  const [expandedStep, setExpandedStep] = useState(0);
  const [editingCreds, setEditingCreds] = useState(false);
  const [credsMessage, setCredsMessage] = useState("");

  const handleCredsSaved = (updated, passwordChanged) => {
    setUser({
      ...user,
      email: updated?.email ?? user?.email,
      fullName: updated?.fullName ?? user?.fullName,
    });
    setEditingCreds(false);
    setCredsMessage(
      passwordChanged
        ? "Credentials updated. Use your new password next time you sign in."
        : "Credentials updated.",
    );
  };
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= 768;

  const displayName = user?.fullName || user?.name || "Admin";
  const displayEmail = user?.email || "—";
  const displayRole = user?.role || "Admin";
  const initials = getInitials(displayName);

  const handleLogout = () => {
    Alert.alert(t("Log Out"), t("Are you sure you want to log out?"), [
      {
        text: t("Cancel"),
        style: "cancel",
      },
      {
        text: t("Log Out"),
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();

          if (error) {
            console.error("Logout error:", error.message);

            Alert.alert(t("Logout Failed"), error.message);

            return;
          }

          setUser(null);

          if (Platform.OS === "web") {
            try {
              localStorage.removeItem(ACTIVE_TAB_KEY);
            } catch {}
          }

          navigation.replace("AdminLogin");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.headerTop, isWide && styles.headerTopWeb]}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{displayEmail}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#fca5a5" />
            <Text style={styles.roleText}>{t(displayRole)}</Text>
          </View>
        </View>

        <View style={[styles.body, isWide && styles.bodyWeb]}>
          <Text style={styles.sectionLabel}>{t("Account Information")}</Text>
          <View style={styles.card}>
            <InfoRow
              icon="person-outline"
              label={t("Full Name")}
              value={displayName}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="mail-outline"
              label={t("Email Address")}
              value={displayEmail}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="shield-checkmark-outline"
              label={t("Role")}
              value={t(displayRole)}
            />
          </View>

          <Text style={styles.sectionLabel}>{t("Tutorial")}</Text>
          <View style={styles.card}>
            {TUTORIAL_STEPS.map((step, i) => (
              <React.Fragment key={step.title}>
                {i > 0 && <View style={styles.divider} />}
                <TutorialStep
                  step={step}
                  expanded={expandedStep === i}
                  onToggle={() =>
                    setExpandedStep((cur) => (cur === i ? null : i))
                  }
                />
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.sectionLabel}>{t("Settings")}</Text>
          <View style={styles.card}>
            <SettingRow
              icon="language-outline"
              label={t("Language")}
              hint={t("Language used throughout the admin app.")}
            >
              <OptionChips
                options={LANGUAGES}
                value={settings.language}
                onChange={(v) => updateSettings({ language: v })}
              />
            </SettingRow>
            <View style={styles.divider} />
            <SettingRow
              icon="timer-outline"
              label={t("Auto-refresh")}
              hint={t("How often the Sensors and Pump pages update on their own.")}
            >
              <OptionChips
                options={REFRESH_OPTIONS}
                value={settings.refreshIntervalSec}
                onChange={(v) => updateSettings({ refreshIntervalSec: v })}
              />
            </SettingRow>
            <View style={styles.divider} />
            <SettingRow
              icon="open-outline"
              label={t("Start page")}
              hint={t("The page that opens first after you sign in.")}
            >
              <OptionChips
                options={START_PAGE_OPTIONS}
                value={settings.defaultTab}
                onChange={(v) => updateSettings({ defaultTab: v })}
              />
            </SettingRow>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => {
                setCredsMessage("");
                setEditingCreds((v) => !v);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ expanded: editingCreds }}
            >
              <View style={styles.infoIconWrap}>
                <Ionicons name="key-outline" size={18} color="#6b7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.stepTitle}>{t("Login credentials")}</Text>
                <Text style={styles.settingHint}>
                  {t("Change your name, email or password.")}
                </Text>
              </View>
              <Ionicons
                name={editingCreds ? "chevron-up" : "chevron-down"}
                size={18}
                color="#9ca3af"
              />
            </TouchableOpacity>
            {editingCreds ? (
              <CredentialsForm
                user={user}
                onSaved={handleCredsSaved}
                onCancel={() => setEditingCreds(false)}
              />
            ) : credsMessage ? (
              <View style={styles.successWrap}>
                <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
                <Text style={styles.successText}>{t(credsMessage)}</Text>
              </View>
            ) : null}
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => updateSettings(null)}
              activeOpacity={0.7}
            >
              <View style={styles.infoIconWrap}>
                <Ionicons
                  name="refresh-circle-outline"
                  size={18}
                  color="#6b7280"
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.stepTitle}>{t("Reset to defaults")}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>{t("About")}</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconWrap, styles.fireIconWrap]}>
                <Ionicons name="flame" size={18} color="#e53935" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoValue}>FireBomba Admin</Text>
                <Text style={styles.infoLabel}>
                  {t("Version {version}", { version: "1.0.0" })}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={18} color="#e53935" />
            <Text style={styles.logoutText}>{t("Sign Out")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollContent: { paddingBottom: 40 },
  headerTop: {
    backgroundColor: "#e53935",
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  headerTopWeb: { paddingHorizontal: 48 },
  avatarWrap: { marginBottom: 14 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  profileName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  profileEmail: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  roleText: { color: "#fecaca", fontSize: 12, fontWeight: "600" },
  body: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  bodyWeb: {
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fireIconWrap: { backgroundColor: "#fff1f2" },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
  },
  divider: { height: 1, backgroundColor: "#f3f4f6", marginLeft: 66 },
  stepTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  stepBody: { fontSize: 13, color: "#4b5563", lineHeight: 19, marginTop: 6 },
  settingRow: { paddingVertical: 14, paddingHorizontal: 16 },
  settingHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  settingHint: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginLeft: 50,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  chipActive: { backgroundColor: "#fff1f2", borderColor: "#e53935" },
  chipText: { fontSize: 13, color: "#4b5563", fontWeight: "500" },
  chipTextActive: { color: "#e53935", fontWeight: "700" },
  credForm: { paddingHorizontal: 16, paddingBottom: 16, marginLeft: 50 },
  credDivider: { height: 1, backgroundColor: "#f3f4f6", marginTop: 18 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 14,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  formErrorWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  formErrorText: { color: "#dc2626", fontSize: 13, flex: 1 },
  credActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  cancelBtnText: { color: "#374151", fontSize: 14, fontWeight: "600" },
  saveBtn: {
    flex: 2,
    backgroundColor: "#e53935",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  saveBtnDisabled: { backgroundColor: "#f87171" },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  successWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 14,
    marginLeft: 50,
  },
  successText: { color: "#15803d", fontSize: 13, flex: 1 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff1f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 14,
    marginTop: 4,
  },
  logoutText: { color: "#e53935", fontSize: 15, fontWeight: "700" },
});
