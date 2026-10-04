import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  FlatList,
  Alert,
  Platform,
  useWindowDimensions,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { API_BASE_URL } from "../../constants/api";

const EMPTY_FORM = { bilikNumber: "", householdName: "" };

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? "—" : date.toISOString().slice(0, 10);
}

export default function AdminBilikTab() {
  const { user } = useApp();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= 768;
  const [bilik, setBilik] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const authHeader = { Authorization: `Bearer ${user?.token}` };

  const fetchBilik = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bilik`, {
        headers: authHeader,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch bilik");
      setBilik(data.bilik);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchBilik().finally(() => setLoading(false));
  }, [fetchBilik]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBilik();
    setRefreshing(false);
  }, [fetchBilik]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bilik.filter((item) =>
      `${item.bilik_number} ${item.household_name || ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [bilik, search]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.bilik_id);
    setForm({
      bilikNumber: item.bilik_number,
      householdName: item.household_name || "",
    });
    setFormError("");
    setModalVisible(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!form.bilikNumber.trim()) {
      setFormError("Bilik number is required.");
      return;
    }
    if (
      form.bilikNumber.trim().length > 50 ||
      form.householdName.trim().length > 100
    ) {
      setFormError(
        "Bilik number must be 50 characters or less and household name 100 or less.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = editingId !== null;
      const url = isEdit
        ? `${API_BASE_URL}/api/bilik/${editingId}`
        : `${API_BASE_URL}/api/bilik`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          bilik_number: form.bilikNumber.trim(),
          household_name: form.householdName.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save bilik");
        return;
      }
      setModalVisible(false);
      await fetchBilik();
    } catch {
      setFormError("Unable to connect to server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    (item) => {
      Alert.alert(
        "Delete Bilik",
        `Delete ${item.bilik_number}? Linked rooms, sensor readings, actuator data, and user profile rows will also be deleted. This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                const res = await fetch(
                  `${API_BASE_URL}/api/bilik/${item.bilik_id}`,
                  {
                    method: "DELETE",
                    headers: authHeader,
                  },
                );
                const data = await res.json();
                if (!res.ok) {
                  Alert.alert("Error", data.error || "Failed to delete bilik");
                  return;
                }
                setBilik((current) =>
                  current.filter((entry) => entry.bilik_id !== item.bilik_id),
                );
              } catch {
                Alert.alert("Error", "Unable to connect to server.");
              }
            },
          },
        ],
      );
    },
    [user?.token],
  );

  const renderItem = ({ item, index }) => (
    <View style={[styles.row, index % 2 === 0 && styles.rowEven]}>
      <View style={styles.colNumber}>
        <View style={styles.bilikInfo}>
          <View style={styles.iconWrap}>
            <Ionicons name="business-outline" size={17} color="#6b7280" />
          </View>
          <Text numberOfLines={1} style={styles.primaryText}>
            {item.bilik_number}
          </Text>
        </View>
      </View>
      <View style={styles.colHousehold}>
        <Text numberOfLines={1} style={styles.householdText}>
          {item.household_name || "—"}
        </Text>
      </View>
      <View style={styles.colDate}>
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>
      <View style={styles.colAction}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => openEditModal(item)}
            accessibilityLabel={`Edit ${item.bilik_number}`}
          >
            <Ionicons name="create-outline" size={16} color="#0369a1" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            accessibilityLabel={`Delete ${item.bilik_number}`}
          >
            <Ionicons name="trash-outline" size={16} color="#e53935" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isWide && styles.modalCardWeb]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId !== null ? "Edit Bilik" : "Add New Bilik"}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                accessibilityLabel="Close form"
              >
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Bilik Number</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Enter bilik number (e.g. BILIK-01)"
                placeholderTextColor="#9ca3af"
                maxLength={50}
                value={form.bilikNumber}
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, bilikNumber: value }))
                }
              />
              <Text style={styles.fieldLabel}>Household Name</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Enter household name (e.g. Household Doe)"
                placeholderTextColor="#9ca3af"
                maxLength={100}
                value={form.householdName}
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, householdName: value }))
                }
              />
              {formError ? (
                <View style={styles.formErrorWrap}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={14}
                    color="#dc2626"
                  />
                  <Text style={styles.formErrorText}>{formError}</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  submitting && styles.submitBtnDisabled,
                ]}
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingId !== null ? "Save Changes" : "Create Bilik"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={[styles.headerTop, isWide && styles.headerTopWeb]}>
        <Text style={styles.headerTitle}>Manage Biliks</Text>
        <Text style={styles.headerSubtitle}>
          Manage bilik numbers and households
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons
              name="business-outline"
              size={20}
              color="rgba(255,255,255,0.9)"
            />
            <Text style={styles.statNumber}>{bilik.length}</Text>
            <Text style={styles.statLabel}>Total Bilik</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="home-outline"
              size={20}
              color="rgba(255,255,255,0.9)"
            />
            <Text style={styles.statNumber}>
              {bilik.filter((item) => item.household_name).length}
            </Text>
            <Text style={styles.statLabel}> Households</Text>
          </View>
        </View>
      </View>

      <View style={[styles.content, isWide && styles.contentWeb]}>
        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color="#9ca3af" />
            <TextInput
              placeholder="Search bilik or household..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            {search.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearch("")}
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={16} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <Ionicons name="add-circle-outline" size={16} color="#fff" />
            <Text style={styles.addText}>Add Bilik</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.numberHeader]}>
              Bilik Number
            </Text>
            <Text style={[styles.headerCell, styles.householdHeader]}>
              Household
            </Text>
            <Text style={[styles.headerCell, styles.dateHeader]}>Created</Text>
            <Text style={[styles.headerCell, styles.actionHeader]}>
              Actions
            </Text>
          </View>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#e53935"
              style={styles.loader}
            />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.bilik_id)}
              renderItem={renderItem}
              refreshing={refreshing}
              onRefresh={onRefresh}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="business-outline" size={40} color="#d1d5db" />
                  <Text style={styles.empty}>No bilik found.</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  headerTop: {
    backgroundColor: "#e53935",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  statNumber: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  statLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: "#111827",
    fontSize: 14,
    outlineWidth: 0,
    outlineStyle: "none",
  },
  addBtn: {
    backgroundColor: "#e53935",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  tableCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: "#f8f9fb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerCell: {
    color: "#9ca3af",
    fontWeight: "700",
    fontSize: 10,
    textTransform: "uppercase",
  },
  numberHeader: { flex: 1.5 },
  householdHeader: { flex: 1.5 },
  dateHeader: { flex: 0.9, textAlign: "center" },
  actionHeader: { flex: 0.8, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  rowEven: { backgroundColor: "#fafbfc" },
  colNumber: { flex: 1.5 },
  colHousehold: { flex: 1.5, paddingHorizontal: 4 },
  colDate: { flex: 0.9, alignItems: "center" },
  colAction: { flex: 0.8, alignItems: "center" },
  bilikInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { flex: 1, fontSize: 13, fontWeight: "600", color: "#111827" },
  householdText: { color: "#4b5563", fontSize: 12 },
  dateText: { color: "#9ca3af", fontSize: 11, textAlign: "center" },
  actionButtons: { flexDirection: "row", alignItems: "center", gap: 5 },
  editBtn: { padding: 7, backgroundColor: "#eff6ff", borderRadius: 8 },
  deleteBtn: { padding: 7, backgroundColor: "#fff1f2", borderRadius: 8 },
  loader: { marginTop: 32 },
  emptyWrap: { alignItems: "center", marginTop: 40, gap: 10 },
  empty: { textAlign: "center", color: "#9ca3af", fontSize: 14 },
  headerTopWeb: { paddingHorizontal: 32 },
  contentWeb: {
    paddingHorizontal: 32,
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxHeight: "90%",
  },
  modalCardWeb: { maxWidth: 440 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
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
  submitBtn: {
    backgroundColor: "#e53935",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    minHeight: 50,
  },
  submitBtnDisabled: { backgroundColor: "#f87171" },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
