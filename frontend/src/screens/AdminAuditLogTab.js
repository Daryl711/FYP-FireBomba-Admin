import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { API_BASE_URL } from "../../constants/api";
import { showAlert } from "../utils/alert";
import { apiFetch } from "../config/api";

const PAGE_SIZE = 50;

const ENTITY_FILTERS = [
  { key: null, label: "All" },
  { key: "bilik", label: "Bilik" },
  { key: "room", label: "Rooms" },
  { key: "user", label: "Users" },
  { key: "alert", label: "Alerts" },
  { key: "sensor", label: "Sensors" },
];

const ACTION_FILTERS = [
  { key: null, label: "Any action" },
  { key: "CREATE", label: "Create" },
  { key: "UPDATE", label: "Update" },
  { key: "DELETE", label: "Delete" },
  { key: "LOGIN", label: "Login" },
];

const ACTION_STYLES = {
  CREATE: { color: "#047857", backgroundColor: "#d1fae5" },
  UPDATE: { color: "#0369a1", backgroundColor: "#e0f2fe" },
  DELETE: { color: "#b91c1c", backgroundColor: "#fee2e2" },
  LOGIN: { color: "#6d28d9", backgroundColor: "#ede9fe" },
};

// Entries written outside the admin panel (e.g. "Camera Disabled") use free-text actions
const OTHER_ACTION_STYLE = { color: "#374151", backgroundColor: "#f3f4f6" };

const ENTITY_ICONS = {
  bilik: "business-outline",
  room: "home-outline",
  user: "person-outline",
  alert: "notifications-outline",
  sensor: "pulse-outline",
  admin: "log-in-outline",
  camera: "videocam-outline",
};

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function describeLog(log) {
  if (log.action === "LOGIN") return "Signed in to admin panel";
  if (!log.entity) return log.details || log.room_name || "—";
  const target = log.entity_id ? `${log.entity} #${log.entity_id}` : log.entity;
  return log.details ? `${target} (${log.details})` : target;
}

function entityIcon(log) {
  const key = log.entity || log.sensor_type?.toLowerCase();
  return ENTITY_ICONS[key] || "document-outline";
}

export default function AdminAuditLogTab() {
  const { user } = useApp();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= 768;
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [entity, setEntity] = useState(null);
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchLogs = useCallback(
    async (offset = 0) => {
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(offset),
        });
        if (entity) params.append("entity", entity);
        if (action) params.append("action", action);

        const res = await apiFetch(`${API_BASE_URL}/api/audit-logs?${params}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch audit logs");
        setLogs((current) =>
          offset === 0 ? data.logs : [...current, ...data.logs],
        );
        setTotal(data.total ?? 0);
      } catch (err) {
        showAlert("Error", err.message);
      }
    },
    [user?.token, entity, action],
  );

  useEffect(() => {
    setLoading(true);
    fetchLogs(0).finally(() => setLoading(false));
  }, [fetchLogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLogs(0);
    setRefreshing(false);
  }, [fetchLogs]);

  const onLoadMore = useCallback(async () => {
    if (loadingMore || logs.length >= total) return;
    setLoadingMore(true);
    await fetchLogs(logs.length);
    setLoadingMore(false);
  }, [fetchLogs, loadingMore, logs.length, total]);

  const renderFilterRow = (filters, selected, onSelect) => (
    <View style={styles.chipRow}>
      {filters.map((filter) => {
        const isActive = selected === filter.key;
        return (
          <TouchableOpacity
            key={filter.label}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(filter.key)}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderItem = ({ item, index }) => (
    <View style={[styles.row, index % 2 === 0 && styles.rowEven]}>
      <View style={styles.colWhen}>
        <Text style={styles.dateText}>{formatDateTime(item.created_at)}</Text>
      </View>
      <View style={styles.colAdmin}>
        <Text numberOfLines={1} style={styles.adminText}>
          {item.performed_by || "Unknown admin"}
        </Text>
      </View>
      <View style={styles.colAction}>
        <View
          style={[
            styles.badge,
            ACTION_STYLES[item.action] || OTHER_ACTION_STYLE,
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.badgeText,
              { color: (ACTION_STYLES[item.action] || OTHER_ACTION_STYLE).color },
            ]}
          >
            {item.action}
          </Text>
        </View>
      </View>
      <View style={styles.colDetails}>
        <View style={styles.detailsInfo}>
          <View style={styles.iconWrap}>
            <Ionicons
              name={entityIcon(item)}
              size={15}
              color="#6b7280"
            />
          </View>
          <Text numberOfLines={2} style={styles.detailsText}>
            {describeLog(item)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.headerTop, isWide && styles.headerTopWeb]}>
        <Text style={styles.headerTitle}>Audit Log</Text>
        <Text style={styles.headerSubtitle}>
          Track every change made by admins
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color="rgba(255,255,255,0.9)"
            />
            <Text style={styles.statNumber}>{total}</Text>
            <Text style={styles.statLabel}>Matching Entries</Text>
          </View>
        </View>
      </View>

      <View style={[styles.content, isWide && styles.contentWeb]}>
        <View style={styles.filterBar}>
          {renderFilterRow(ENTITY_FILTERS, entity, setEntity)}
          {renderFilterRow(ACTION_FILTERS, action, setAction)}
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.whenHeader]}>When</Text>
            <Text style={[styles.headerCell, styles.adminHeader]}>Admin</Text>
            <Text style={[styles.headerCell, styles.actionHeader]}>Action</Text>
            <Text style={[styles.headerCell, styles.detailsHeader]}>
              Details
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
              data={logs}
              keyExtractor={(item) => String(item.log_id)}
              renderItem={renderItem}
              refreshing={refreshing}
              onRefresh={onRefresh}
              onEndReached={onLoadMore}
              onEndReachedThreshold={0.3}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator color="#e53935" style={styles.footer} />
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons
                    name="document-text-outline"
                    size={40}
                    color="#d1d5db"
                  />
                  <Text style={styles.empty}>No audit entries found.</Text>
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
    maxWidth: 200,
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
  filterBar: { gap: 8, marginBottom: 14 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: "#fff1f1", borderColor: "#e53935" },
  chipText: { fontSize: 12, color: "#6b7280", fontWeight: "600" },
  chipTextActive: { color: "#e53935" },
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
  whenHeader: { flex: 1 },
  adminHeader: { flex: 1.3 },
  actionHeader: { flex: 0.8, textAlign: "center" },
  detailsHeader: { flex: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  rowEven: { backgroundColor: "#fafbfc" },
  colWhen: { flex: 1 },
  colAdmin: { flex: 1.3, paddingHorizontal: 4 },
  colAction: { flex: 0.8, alignItems: "center" },
  colDetails: { flex: 2, paddingLeft: 4 },
  dateText: { color: "#6b7280", fontSize: 11 },
  adminText: { color: "#111827", fontSize: 12, fontWeight: "600" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  detailsInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  detailsText: { flex: 1, color: "#4b5563", fontSize: 12 },
  loader: { marginTop: 32 },
  footer: { marginVertical: 16 },
  emptyWrap: { alignItems: "center", marginTop: 40, gap: 10 },
  empty: { textAlign: "center", color: "#9ca3af", fontSize: 14 },
  headerTopWeb: { paddingHorizontal: 32 },
  contentWeb: {
    paddingHorizontal: 32,
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },
});
