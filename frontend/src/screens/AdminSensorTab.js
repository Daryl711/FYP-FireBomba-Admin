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

function formatDate(dateStr) {
	if (!dateStr) return '—';
	return new Date(dateStr).toISOString().slice(0, 10);
}


export default function AdminSensorTab() {
	const { user } = useApp();
	const { width } = useWindowDimensions();
	const isWide = Platform.OS === 'web' && width >= 768;

	const [sensors, setSensors] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [search, setSearch] = useState('');
	const [sortBy, setSortBy] = useState('id');
	const [showSortMenu, setShowSortMenu] = useState(false);
	const [offlineOnly, setOfflineOnly] = useState(false);

	const authHeader = { Authorization: `Bearer ${user?.token}` };

	const fetchSensors = useCallback(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/sensors`, { headers: authHeader });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Failed to fetch sensors');
			const mapped = data.sensors.map((s) => ({
				id: s.sensor_id,
				roomId: s.room_id,
				roomName: s.room_name,
				type: s.sensor_type,
				isOnline: s.status === 1 || s.status === true,
				lastUpdated: formatDate(s.last_updated),
			}));
			setSensors(mapped);
		} catch (err) {
			Alert.alert('Error', err.message);
		}
	}, [user?.token]);

	useEffect(() => {
		fetchSensors().finally(() => setLoading(false));
	}, [fetchSensors]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await fetchSensors();
		setRefreshing(false);
	}, [fetchSensors]);

	const totalSensors = sensors.length;
	const onlineCount = sensors.filter((s) => s.isOnline).length;
	const offlineCount = sensors.filter((s) => !s.isOnline).length;

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		const res = sensors.filter((s) => {
			const matchSearch = s.type.toLowerCase().includes(q) || s.roomName.toLowerCase().includes(q);
			const matchOffline = offlineOnly ? !s.isOnline : true;
			return matchSearch && matchOffline;
		});
		return [...res].sort((a, b) => {
			if (sortBy === 'type') return a.type.localeCompare(b.type);
			if (sortBy === 'room') return a.roomId - b.roomId;
			return a.id - b.id;
		});
	}, [sensors, search, sortBy, offlineOnly]);

	const sortLabel = sortBy === 'type' ? 'Sort by Type' : sortBy === 'room' ? 'Sort by Room' : 'Sort by ID';

	const handleToggle = useCallback(async (sensorId) => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/sensors/${sensorId}/toggle`, {
				method: 'PATCH',
				headers: authHeader,
			});
			if (!res.ok) { Alert.alert('Error', 'Failed to update sensor'); return; }
			setSensors((cur) => cur.map((s) => s.id === sensorId ? { ...s, isOnline: !s.isOnline } : s));
		} catch {
			Alert.alert('Error', 'Unable to connect to server.');
		}
	}, [user?.token]);

	const handleDelete = useCallback((sensorId, sensorType) => {
		Alert.alert('Delete Sensor', `Delete ${sensorType} sensor? This cannot be undone.`, [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete', style: 'destructive',
				onPress: async () => {
					try {
						const res = await fetch(`${API_BASE_URL}/api/sensors/${sensorId}`, {
							method: 'DELETE', headers: authHeader,
						});
						if (!res.ok) { Alert.alert('Error', 'Failed to delete sensor'); return; }
						setSensors((cur) => cur.filter((s) => s.id !== sensorId));
					} catch { Alert.alert('Error', 'Unable to connect to server.'); }
				},
			},
		]);
	}, [user?.token]);

	const renderItem = ({ item, index }) => {
		const isEven = index % 2 === 0;
		return (
			<View style={[styles.row, isEven && styles.rowEven]}>
				<View style={styles.colId}>
					<View style={styles.idBadge}>
						<Text style={styles.idText}>#{item.id}</Text>
					</View>
				</View>
				<View style={styles.colLarge}>
					<View style={styles.sensorInfo}>
						<View style={styles.sensorDetails}>
							<Text style={styles.sensorType}>{item.type}</Text>
							<Text style={styles.sensorRoom}>{item.roomName}</Text>
						</View>
					</View>
				</View>

				<View style={styles.colSmall}>
					<View style={styles.roomBadge}>
						<Text style={styles.roomBadgeText}>#{item.roomId}</Text>
					</View>
				</View>

				<View style={styles.colSmall}>
					<View style={[styles.statusBadge, item.isOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline]}>
						<View style={[styles.statusDot, item.isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
						<Text style={[styles.statusText, item.isOnline ? styles.statusTextOnline : styles.statusTextOffline]}>
							{item.isOnline ? 'Online' : 'Offline'}
						</Text>
					</View>
				</View>

				<View style={styles.colMedium}>
					<Text style={styles.dateText}>{item.lastUpdated}</Text>
				</View>

				<View style={styles.colAction}>
					<View style={styles.actionButtons}>
						<TouchableOpacity
							style={[styles.toggleBtn, item.isOnline ? styles.toggleBtnOn : styles.toggleBtnOff]}
							onPress={() => handleToggle(item.id)}
						>
							<Ionicons
								name={item.isOnline ? 'pause-circle-outline' : 'play-circle-outline'}
								size={16}
								color={item.isOnline ? '#b45309' : '#047857'}
							/>
						</TouchableOpacity>
						<TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.type)}>
							<Ionicons name="trash-outline" size={16} color="#e53935" />
						</TouchableOpacity>
					</View>
				</View>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" />

			<View style={[styles.headerTop, isWide && styles.headerTopWeb]}>
				<Text style={styles.headerTitle}>Sensor Management</Text>
				<Text style={styles.headerSubtitle}>Monitor sensor status across all rooms</Text>
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
						<Text style={styles.statLabel}>Online</Text>
					</View>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="close-circle-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{offlineCount}</Text>
						<Text style={styles.statLabel}>Offline</Text>
					</View>
				</View>
			</View>

			<View style={[styles.content, isWide && styles.contentWeb]}>
				<View style={styles.toolbar}>
					<View style={styles.searchBox}>
						<Ionicons name="search" size={16} color="#9ca3af" />
						<TextInput
							placeholder="Search by sensor type or room..."
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
								<Text style={[styles.filterText, offlineOnly && styles.filterTextActive]}>Offline Only</Text>
							</TouchableOpacity>

							{showSortMenu && (
								<View style={styles.sortMenu}>
									{[['id', 'Sort by ID'], ['room', 'Sort by Room'], ['type', 'Sort by Type']].map(([val, label]) => (
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
					</View>
				</View>

				<View style={styles.tableCard}>
					<View style={styles.tableHeader}>
						<Text style={[styles.headerCell, styles.idCell]}>ID</Text>
						<Text style={[styles.headerCell, styles.nameCell]}>Sensor</Text>
						<Text style={[styles.headerCell, styles.roomCell]}>Room</Text>
						<Text style={[styles.headerCell, styles.statusCell]}>Status</Text>
						<Text style={[styles.headerCell, styles.dateCell]}>Last Updated</Text>
						<Text style={[styles.headerCell, styles.actionCell]}>Actions</Text>
					</View>

					{loading ? (
						<ActivityIndicator size="large" color="#e53935" style={styles.loader} />
					) : (
						<FlatList
							data={filtered}
							keyExtractor={(i) => String(i.id)}
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
		flexDirection: 'row', alignItems: 'center',
		backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10,
		borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', gap: 8, marginBottom: 10,
	},
	searchInput: { flex: 1, color: '#111827', fontSize: 14 },
	controlsWrap: {
		flexDirection: 'row', alignItems: 'center',
		justifyContent: 'space-between', position: 'relative', zIndex: 10,
	},
	leftControls: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'relative' },
	sortBtn: {
		backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
		paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10,
		flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 130,
	},
	sortText: { color: '#374151', fontSize: 13, fontWeight: '600', flex: 1 },
	sortMenu: {
		position: 'absolute', top: 46, left: 0,
		backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb',
		minWidth: 160, zIndex: 20, elevation: 6,
		shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
	},
	sortOption: {
		paddingVertical: 11, paddingHorizontal: 14,
		flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
	},
	sortOptionText: { color: '#374151', fontSize: 14 },
	sortOptionActive: { color: '#e53935', fontWeight: '600' },
	filterBtn: {
		backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
		paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
	},
	filterBtnActive: { backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
	filterText: { color: '#374151', fontSize: 13, fontWeight: '600' },
	filterTextActive: { color: '#92400e' },
	tableCard: {
		flex: 1,
		backgroundColor: '#fff', borderRadius: 14,
		borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden',
		shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 }, elevation: 2,
	},
	tableHeader: {
		flexDirection: 'row', paddingVertical: 11, paddingHorizontal: 16,
		backgroundColor: '#f8f9fb', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
	},
	headerCell: { color: '#9ca3af', fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
	idCell: { flex: 0.6, textAlign: 'center' },
	nameCell: { flex: 1.8 },
	roomCell: { flex: 0.7, textAlign: 'center' },
	statusCell: { flex: 0.9, textAlign: 'center' },
	dateCell: { flex: 1.1, textAlign: 'center' },
	actionCell: { flex: 0.8, textAlign: 'center' },
	row: {
		flexDirection: 'row', alignItems: 'center',
		paddingVertical: 13, paddingHorizontal: 16,
		borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#fff',
	},
	rowEven: { backgroundColor: '#fafbfc' },
	colId: { flex: 0.6, alignItems: 'center' },
	colLarge: { flex: 1.8 },
	colSmall: { flex: 0.7, alignItems: 'center' },
	colMedium: { flex: 1.1, alignItems: 'center' },
	colAction: { flex: 0.8, alignItems: 'center' },
	sensorInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	sensorDetails: { flex: 1 },
	sensorType: { fontSize: 14, fontWeight: '600', color: '#111827' },
	sensorRoom: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
	idBadge: {
		backgroundColor: '#f3f4f6', borderRadius: 8,
		paddingHorizontal: 8, paddingVertical: 4,
	},
	idText: { fontSize: 12, fontWeight: '700', color: '#374151' },
	roomBadge: {
		backgroundColor: '#f3f4f6', borderRadius: 8,
		paddingHorizontal: 8, paddingVertical: 4,
	},
	roomBadgeText: { fontSize: 12, fontWeight: '700', color: '#374151' },
	statusBadge: {
		flexDirection: 'row', alignItems: 'center',
		paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4,
	},
	statusBadgeOnline: { backgroundColor: '#d1fae5' },
	statusBadgeOffline: { backgroundColor: '#f3f4f6' },
	statusDot: { width: 6, height: 6, borderRadius: 3 },
	statusDotOnline: { backgroundColor: '#10b981' },
	statusDotOffline: { backgroundColor: '#9ca3af' },
	statusText: { fontSize: 12, fontWeight: '600' },
	statusTextOnline: { color: '#047857' },
	statusTextOffline: { color: '#6b7280' },
	dateText: { color: '#9ca3af', fontSize: 12, textAlign: 'center' },
	actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	toggleBtn: { padding: 7, borderRadius: 8 },
	toggleBtnOn: { backgroundColor: '#fef3c7' },
	toggleBtnOff: { backgroundColor: '#d1fae5' },
	deleteBtn: { padding: 7, backgroundColor: '#fff1f2', borderRadius: 8 },
	loader: { marginTop: 32 },
	emptyWrap: { alignItems: 'center', marginTop: 40, gap: 10 },
	empty: { textAlign: 'center', color: '#9ca3af', fontSize: 14 },
	headerTopWeb: { paddingHorizontal: 32 },
	contentWeb: { paddingHorizontal: 32, maxWidth: 1200, alignSelf: 'center', width: '100%' },
});
