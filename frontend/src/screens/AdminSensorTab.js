import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../../constants/api';

// Wording for the two sensor states. Change these to rename them everywhere
// on this page (e.g. 'Active' / 'Inactive').
const STATUS_LABELS = { online: 'Online', offline: 'Offline' };

// Re-check every minute so a sensor that stops sending flips to Offline
// without the admin having to refresh.
const REFRESH_INTERVAL_MS = 60 * 1000;

function formatDateTime(dateStr) {
	if (!dateStr) return '';
	return new Date(dateStr).toLocaleString(undefined, {
		day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
	});
}

function formatAgo(dateStr, now) {
	if (!dateStr) return 'No data yet';
	const minutes = Math.floor((now - new Date(dateStr).getTime()) / 60000);
	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} h ago`;
	const days = Math.floor(hours / 24);
	return `${days} day${days === 1 ? '' : 's'} ago`;
}

function formatNumber(value, unit = '') {
	if (value === null || value === undefined) return '—';
	return `${Math.round(value * 10) / 10}${unit}`;
}

export default function AdminSensorTab() {
	const { user } = useApp();
	const { width } = useWindowDimensions();
	const isWide = Platform.OS === 'web' && width >= 768;

	const [sensors, setSensors] = useState([]);
	const [offlineAfter, setOfflineAfter] = useState(60);
	const [checkedAt, setCheckedAt] = useState(Date.now());
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [search, setSearch] = useState('');
	const [sortBy, setSortBy] = useState('room');
	const [showSortMenu, setShowSortMenu] = useState(false);
	const [offlineOnly, setOfflineOnly] = useState(false);

	const authHeader = { Authorization: `Bearer ${user?.token}` };

	const fetchSensors = useCallback(async ({ silent = false } = {}) => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/sensors`, { headers: authHeader });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Failed to fetch sensors');
			setSensors(
				data.sensors.map((s) => ({
					roomId: s.room_id,
					roomName: s.room_name,
					bilikNumber: s.bilik_number,
					isOnline: s.status === 'online',
					lastReadingAt: s.last_reading_at,
					latest: s.latest,
				})),
			);
			setOfflineAfter(data.offline_after_minutes ?? 60);
			setCheckedAt(data.checked_at ? new Date(data.checked_at).getTime() : Date.now());
		} catch (err) {
			// A failed background refresh keeps the last good data on screen.
			if (!silent) Alert.alert('Error', err.message);
		}
	}, [user?.token]);

	useEffect(() => {
		fetchSensors().finally(() => setLoading(false));
		const timer = setInterval(() => fetchSensors({ silent: true }), REFRESH_INTERVAL_MS);
		return () => clearInterval(timer);
	}, [fetchSensors]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await fetchSensors();
		setRefreshing(false);
	}, [fetchSensors]);

	const totalSensors = sensors.length;
	const onlineCount = sensors.filter((s) => s.isOnline).length;
	const offlineCount = totalSensors - onlineCount;

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		const res = sensors.filter((s) => {
			const matchSearch = `${s.roomName} ${s.bilikNumber || ''}`.toLowerCase().includes(q);
			const matchOffline = offlineOnly ? !s.isOnline : true;
			return matchSearch && matchOffline;
		});
		const lastSeen = (s) => (s.lastReadingAt ? new Date(s.lastReadingAt).getTime() : 0);
		return [...res].sort((a, b) => {
			if (sortBy === 'status') return Number(a.isOnline) - Number(b.isOnline) || a.roomId - b.roomId;
			if (sortBy === 'lastSeen') return lastSeen(b) - lastSeen(a);
			return a.roomId - b.roomId;
		});
	}, [sensors, search, sortBy, offlineOnly]);

	const SORT_OPTIONS = [['room', 'Sort by Room'], ['status', 'Offline First'], ['lastSeen', 'Latest Data First']];
	const sortLabel = SORT_OPTIONS.find(([val]) => val === sortBy)[1];

	const renderItem = ({ item, index }) => {
		const isEven = index % 2 === 0;
		const { latest } = item;
		return (
			<View style={[styles.row, isEven && styles.rowEven]}>
				<View style={styles.colLarge}>
					<Text style={styles.sensorType} numberOfLines={1}>{item.roomName}</Text>
					<Text style={styles.sensorRoom} numberOfLines={1}>
						{item.bilikNumber ? `${item.bilikNumber} · Room #${item.roomId}` : `Room #${item.roomId}`}
					</Text>
				</View>

				<View style={styles.colStatus}>
					<View style={[styles.statusBadge, item.isOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline]}>
						<View style={[styles.statusDot, item.isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
						<Text style={[styles.statusText, item.isOnline ? styles.statusTextOnline : styles.statusTextOffline]}>
							{item.isOnline ? STATUS_LABELS.online : STATUS_LABELS.offline}
						</Text>
					</View>
				</View>

				<View style={styles.colReading}>
					{latest ? (
						<>
							<Text style={styles.readingText} numberOfLines={1}>
								{formatNumber(latest.temperature, '°C')} · {formatNumber(latest.humidity, '%')}
							</Text>
							<Text style={styles.readingSubText} numberOfLines={1}>
								Smoke {formatNumber(latest.smoke)} · CO {formatNumber(latest.co)}
								{latest.flame_detected ? ' · 🔥 Flame' : ''}
							</Text>
						</>
					) : (
						<Text style={styles.readingSubText}>—</Text>
					)}
				</View>

				<View style={styles.colDate}>
					<Text style={[styles.agoText, !item.isOnline && item.lastReadingAt && styles.agoTextStale]}>
						{formatAgo(item.lastReadingAt, checkedAt)}
					</Text>
					{item.lastReadingAt ? <Text style={styles.dateText}>{formatDateTime(item.lastReadingAt)}</Text> : null}
				</View>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" />

			<View style={[styles.headerTop, isWide && styles.headerTopWeb]}>
				<Text style={styles.headerTitle}>Sensor Management</Text>
				<Text style={styles.headerSubtitle}>
					A sensor is {STATUS_LABELS.offline} when no data has been received for {offlineAfter} minutes
				</Text>
				<View style={styles.statsRow}>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="hardware-chip-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{totalSensors}</Text>
						<Text style={styles.statLabel}>Total</Text>
					</View>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="checkmark-circle-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{onlineCount}</Text>
						<Text style={styles.statLabel}>{STATUS_LABELS.online}</Text>
					</View>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="close-circle-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{offlineCount}</Text>
						<Text style={styles.statLabel}>{STATUS_LABELS.offline}</Text>
					</View>
				</View>
			</View>

			<View style={[styles.content, isWide && styles.contentWeb]}>
				<View style={styles.toolbar}>
					<View style={styles.searchBox}>
						<Ionicons name="search" size={16} color="#9ca3af" />
						<TextInput
							placeholder="Search by room or bilik..."
							placeholderTextColor="#9ca3af"
							value={search}
							onChangeText={setSearch}
							style={styles.searchInput}
						/>
						{search.length > 0 && (
							<TouchableOpacity onPress={() => setSearch('')}>
								<Ionicons name="close-circle" size={16} color="#9ca3af" />
							</TouchableOpacity>
						)}
					</View>

					<View style={styles.controlsWrap}>
						<View style={styles.leftControls}>
							<TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortMenu((o) => !o)}>
								<Ionicons name="funnel-outline" size={14} color="#374151" />
								<Text numberOfLines={1} style={styles.sortText}>{sortLabel}</Text>
								<Ionicons name={showSortMenu ? 'chevron-up' : 'chevron-down'} size={14} color="#374151" />
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.filterBtn, offlineOnly && styles.filterBtnActive]}
								onPress={() => setOfflineOnly((v) => !v)}
							>
								<Text style={[styles.filterText, offlineOnly && styles.filterTextActive]}>
									{STATUS_LABELS.offline} Only
								</Text>
							</TouchableOpacity>

							{showSortMenu && (
								<View style={styles.sortMenu}>
									{SORT_OPTIONS.map(([val, label]) => (
										<TouchableOpacity
											key={val}
											style={styles.sortOption}
											onPress={() => { setSortBy(val); setShowSortMenu(false); }}
										>
											<Text style={[styles.sortOptionText, sortBy === val && styles.sortOptionActive]}>{label}</Text>
											{sortBy === val && <Ionicons name="checkmark" size={16} color="#e53935" />}
										</TouchableOpacity>
									))}
								</View>
							)}
						</View>

						<Text style={styles.checkedText} numberOfLines={1}>
							Checked {new Date(checkedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
						</Text>
					</View>
				</View>

				<View style={styles.tableCard}>
					<View style={styles.tableHeader}>
						<Text style={[styles.headerCell, styles.nameCell]}>Room Sensor</Text>
						<Text style={[styles.headerCell, styles.statusCell]}>Status</Text>
						<Text numberOfLines={1} style={[styles.headerCell, styles.readingCell]}>Latest Reading</Text>
						<Text numberOfLines={1} style={[styles.headerCell, styles.dateCell]}>Last Data Received</Text>
					</View>

					{loading ? (
						<ActivityIndicator size="large" color="#e53935" style={styles.loader} />
					) : (
						<FlatList
							data={filtered}
							keyExtractor={(i) => String(i.roomId)}
							renderItem={renderItem}
							refreshing={refreshing}
							onRefresh={onRefresh}
							showsVerticalScrollIndicator={false}
							ListEmptyComponent={
								<View style={styles.emptyWrap}>
									<Ionicons name="hardware-chip-outline" size={40} color="#d1d5db" />
									<Text style={styles.empty}>No sensors found.</Text>
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
	container: { flex: 1, backgroundColor: '#f9fafb' },
	headerTop: { backgroundColor: '#e53935', paddingVertical: 20, paddingHorizontal: 16 },
	headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: 0.3 },
	headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2, marginBottom: 16 },
	statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
	statCard: {
		flex: 1, marginHorizontal: 4,
		backgroundColor: 'rgba(255,255,255,0.15)',
		padding: 12, borderRadius: 10, alignItems: 'center',
		borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
	},
	statIconWrap: { marginBottom: 4 },
	statNumber: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 28 },
	statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2, fontWeight: '500' },
	content: { flex: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 16 },
	toolbar: { marginBottom: 14, zIndex: 10 },
	searchBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		paddingHorizontal: 16,
		paddingVertical: 11,
		borderRadius: 14,
		borderWidth: 1.5,
		borderColor: '#e5e7eb',
		marginBottom: 12,
		gap: 10,
		shadowColor: '#000',
		shadowOpacity: 0.03,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	searchInput: { flex: 1, color: '#111827', fontSize: 14, outlineWidth: 0, outlineStyle: 'none' },
	controlsWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10 },
	leftControls: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'relative' },
	sortBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 150 },
	sortText: { color: '#374151', fontSize: 13, fontWeight: '600', flex: 1 },
	sortMenu: { position: 'absolute', top: 46, left: 0, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', minWidth: 180, zIndex: 20, elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
	sortOption: { paddingVertical: 11, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	sortOptionText: { color: '#374151', fontSize: 14 },
	sortOptionActive: { color: '#e53935', fontWeight: '600' },
	filterBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
	filterBtnActive: { backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
	filterText: { color: '#374151', fontSize: 13, fontWeight: '600' },
	filterTextActive: { color: '#92400e' },
	checkedText: { color: '#9ca3af', fontSize: 12, marginLeft: 8, flexShrink: 1 },
	tableCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
	tableHeader: { flexDirection: 'row', paddingVertical: 11, paddingHorizontal: 16, backgroundColor: '#f8f9fb', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
	headerCell: { color: '#9ca3af', fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
	nameCell: { flex: 1.6 },
	statusCell: { flex: 0.9, textAlign: 'center' },
	readingCell: { flex: 1.4 },
	dateCell: { flex: 1.2, textAlign: 'center' },
	row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#fff' },
	rowEven: { backgroundColor: '#fafbfc' },
	colLarge: { flex: 1.6, paddingRight: 6 },
	colStatus: { flex: 0.9, alignItems: 'center' },
	colReading: { flex: 1.4, paddingHorizontal: 6 },
	colDate: { flex: 1.2, alignItems: 'center' },
	sensorType: { fontSize: 14, fontWeight: '600', color: '#111827' },
	sensorRoom: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
	readingText: { fontSize: 13, fontWeight: '600', color: '#111827' },
	readingSubText: { fontSize: 12, color: '#6b7280', marginTop: 1 },
	statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
	statusBadgeOnline: { backgroundColor: '#d1fae5' },
	statusBadgeOffline: { backgroundColor: '#fee2e2' },
	statusDot: { width: 6, height: 6, borderRadius: 3 },
	statusDotOnline: { backgroundColor: '#10b981' },
	statusDotOffline: { backgroundColor: '#ef4444' },
	statusText: { fontSize: 12, fontWeight: '600' },
	statusTextOnline: { color: '#047857' },
	statusTextOffline: { color: '#b91c1c' },
	agoText: { color: '#374151', fontSize: 12, fontWeight: '600', textAlign: 'center' },
	agoTextStale: { color: '#b91c1c' },
	dateText: { color: '#9ca3af', fontSize: 11, textAlign: 'center', marginTop: 1 },
	loader: { marginTop: 32 },
	emptyWrap: { alignItems: 'center', marginTop: 40, gap: 10 },
	empty: { textAlign: 'center', color: '#9ca3af', fontSize: 14 },
	headerTopWeb: { paddingHorizontal: 32 },
	contentWeb: { paddingHorizontal: 32, maxWidth: 1200, alignSelf: 'center', width: '100%' },
});
