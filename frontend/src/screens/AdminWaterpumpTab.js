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

export default function AdminWaterpumpTab() {
	const { user } = useApp();
	const { width } = useWindowDimensions();
	const isWide = Platform.OS === 'web' && width >= 768;

	const [actuators, setActuators] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [search, setSearch] = useState('');
	const [sortBy, setSortBy] = useState('id');
	const [showSortMenu, setShowSortMenu] = useState(false);
	const [activeOnly, setActiveOnly] = useState(false);

	const authHeader = { Authorization: `Bearer ${user?.token}` };

	const fetchActuators = useCallback(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/actuators`, { headers: authHeader });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Failed to fetch actuators');
			const mapped = data.actuators.map((a) => ({
				id: a.actuator_id,
				roomId: a.room_id,
				roomName: a.room_name,
				waterpumpEnabled: a.waterpump_enabled === 1 || a.waterpump_enabled === true,
				isActive: a.activated_status === 1 || a.activated_status === true,
				lastUpdated: formatDate(a.last_updated),
			}));
			setActuators(mapped);
		} catch (err) {
			Alert.alert('Error', err.message);
		}
	}, [user?.token]);

	useEffect(() => {
		fetchActuators().finally(() => setLoading(false));
	}, [fetchActuators]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await fetchActuators();
		setRefreshing(false);
	}, [fetchActuators]);

	const total = actuators.length;
	const waterpumpOnCount = actuators.filter((a) => a.waterpumpEnabled).length;
	const activeCount = actuators.filter((a) => a.isActive).length;

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		const res = actuators.filter((a) => {
			const matchSearch = String(a.id).includes(q) || String(a.roomId).includes(q) || a.roomName.toLowerCase().includes(q);
			const matchActive = activeOnly ? a.isActive : true;
			return matchSearch && matchActive;
		});
		return [...res].sort((a, b) => {
			if (sortBy === 'room') return a.roomId - b.roomId;
			return a.id - b.id;
		});
	}, [actuators, search, sortBy, activeOnly]);

	const sortLabel = sortBy === 'room' ? 'Sort by Room' : 'Sort by ID';

	const renderItem = ({ item, index }) => {
		const isEven = index % 2 === 0;
		return (
			<View style={[styles.row, isEven && styles.rowEven]}>
				<View style={styles.colId}>
					<View style={styles.idBadge}>
						<Text style={styles.idText}>#{item.id}</Text>
					</View>
				</View>

				<View style={styles.colRoom}>
					<Text style={styles.roomName}>{item.roomName}</Text>
					<Text style={styles.roomSub}>Room #{item.roomId}</Text>
				</View>

				<View style={styles.colWaterpump}>
					<View style={[styles.badge, item.waterpumpEnabled ? styles.badgeYes : styles.badgeNo]}>
						<Ionicons
							name={item.waterpumpEnabled ? 'water' : 'water-outline'}
							size={12}
							color={item.waterpumpEnabled ? '#0369a1' : '#9ca3af'}
						/>
						<Text style={[styles.badgeText, item.waterpumpEnabled ? styles.badgeTextYes : styles.badgeTextNo]}>
							{item.waterpumpEnabled ? 'Yes' : 'No'}
						</Text>
					</View>
				</View>

				<View style={styles.colStatus}>
					<View style={[styles.badge, item.isActive ? styles.badgeOn : styles.badgeOff]}>
						<View style={[styles.dot, item.isActive ? styles.dotOn : styles.dotOff]} />
						<Text style={[styles.badgeText, item.isActive ? styles.badgeTextOn : styles.badgeTextOff]}>
							{item.isActive ? 'On' : 'Off'}
						</Text>
					</View>
				</View>

				<View style={styles.colDate}>
					<Text style={styles.dateText}>{item.lastUpdated}</Text>
				</View>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" />

			<View style={[styles.headerTop, isWide && styles.headerTopWeb]}>
				<Text style={styles.headerTitle}>Waterpump Management</Text>
				<Text style={styles.headerSubtitle}>Monitor actuator and waterpump status</Text>
				<View style={styles.statsRow}>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="water-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{total}</Text>
						<Text style={styles.statLabel}>Total</Text>
					</View>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="water" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{waterpumpOnCount}</Text>
						<Text style={styles.statLabel}>Pump Yes</Text>
					</View>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="power-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{activeCount}</Text>
						<Text style={styles.statLabel}>Active</Text>
					</View>
				</View>
			</View>

			<View style={[styles.content, isWide && styles.contentWeb]}>
				<View style={styles.toolbar}>
					<View style={styles.searchBox}>
						<Ionicons name="search" size={16} color="#9ca3af" />
						<TextInput
							placeholder="Search by ID or room..."
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
								style={[styles.filterBtn, activeOnly && styles.filterBtnActive]}
								onPress={() => setActiveOnly((v) => !v)}
							>
								<Text style={[styles.filterText, activeOnly && styles.filterTextActive]}>Active Only</Text>
							</TouchableOpacity>

							{showSortMenu && (
								<View style={styles.sortMenu}>
									{[['id', 'Sort by ID'], ['room', 'Sort by Room']].map(([val, label]) => (
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
						<Text style={[styles.headerCell, styles.hId]}>ID</Text>
						<Text style={[styles.headerCell, styles.hRoom]}>Room</Text>
						<Text style={[styles.headerCell, styles.hWaterpump]}>Waterpump</Text>
						<Text style={[styles.headerCell, styles.hStatus]}>Status</Text>
						<Text style={[styles.headerCell, styles.hDate]}>Last Update</Text>
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
									<Ionicons name="water-outline" size={40} color="#d1d5db" />
									<Text style={styles.empty}>No actuators found.</Text>
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
	filterBtnActive: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
	filterText: { color: '#374151', fontSize: 13, fontWeight: '600' },
	filterTextActive: { color: '#15803d' },
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
	hId: { flex: 0.6, textAlign: 'center' },
	hRoom: { flex: 2.2 },
	hWaterpump: { flex: 1, textAlign: 'center' },
	hStatus: { flex: 1, textAlign: 'center' },
	hDate: { flex: 1.2, textAlign: 'center' },
	row: {
		flexDirection: 'row', alignItems: 'center',
		paddingVertical: 13, paddingHorizontal: 16,
		borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#fff',
	},
	rowEven: { backgroundColor: '#fafbfc' },
	colId: { flex: 0.6, alignItems: 'center' },
	colRoom: { flex: 2.2, justifyContent: 'center' },
	colWaterpump: { flex: 1, alignItems: 'center' },
	colStatus: { flex: 1, alignItems: 'center' },
	colDate: { flex: 1.2, alignItems: 'center' },
	idBadge: { backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
	idText: { fontSize: 12, fontWeight: '700', color: '#374151' },
	roomName: { fontSize: 14, fontWeight: '600', color: '#111827' },
	roomSub: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
	badge: {
		flexDirection: 'row', alignItems: 'center',
		paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4,
	},
	badgeYes: { backgroundColor: '#e0f2fe' },
	badgeNo: { backgroundColor: '#f3f4f6' },
	badgeOn: { backgroundColor: '#dcfce7' },
	badgeOff: { backgroundColor: '#f3f4f6' },
	dot: { width: 6, height: 6, borderRadius: 3 },
	dotOn: { backgroundColor: '#16a34a' },
	dotOff: { backgroundColor: '#9ca3af' },
	badgeText: { fontSize: 12, fontWeight: '600' },
	badgeTextYes: { color: '#0369a1' },
	badgeTextNo: { color: '#6b7280' },
	badgeTextOn: { color: '#15803d' },
	badgeTextOff: { color: '#6b7280' },
	dateText: { color: '#9ca3af', fontSize: 12, textAlign: 'center' },
	loader: { marginTop: 32 },
	emptyWrap: { alignItems: 'center', marginTop: 40, gap: 10 },
	empty: { textAlign: 'center', color: '#9ca3af', fontSize: 14 },
	headerTopWeb: { paddingHorizontal: 32 },
	contentWeb: { paddingHorizontal: 32, maxWidth: 1200, alignSelf: 'center', width: '100%' },
});
