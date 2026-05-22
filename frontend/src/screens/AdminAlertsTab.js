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

function formatDateTime(dateStr) {
	if (!dateStr) return '';
	const d = new Date(dateStr);
	const date = d.toISOString().slice(0, 10);
	const time = d.toTimeString().slice(0, 5);
	return `${date}\n${time}`;
}

export default function AdminAlertsTab() {
	const { user } = useApp();
	const { width } = useWindowDimensions();
	const isWide = Platform.OS === 'web' && width >= 768;

	const [alerts, setAlerts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [search, setSearch] = useState('');
	const [sortBy, setSortBy] = useState('newest');
	const [showSortMenu, setShowSortMenu] = useState(false);
	const [unreadOnly, setUnreadOnly] = useState(false);

	const authHeader = { Authorization: `Bearer ${user?.token}` };

	const fetchAlerts = useCallback(async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/alerts`, {
				headers: authHeader,
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Failed to fetch alerts');
			const mapped = data.alerts.map((a) => ({
				id: a.alert_id,
				roomId: a.room_id,
				time: a.timestamp,
				title: a.warning_title,
				isRead: !!a.is_read,
			}));
			setAlerts(mapped);
		} catch (err) {
			Alert.alert('Error', err.message);
		}
	}, [user?.token]);

	useEffect(() => {
		fetchAlerts().finally(() => setLoading(false));
	}, [fetchAlerts]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await fetchAlerts();
		setRefreshing(false);
	}, [fetchAlerts]);

	const totalAlerts = alerts.length;
	const unreadCount = alerts.filter((a) => !a.isRead).length;
	const readCount = alerts.filter((a) => a.isRead).length;

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		const res = alerts.filter((a) => {
			const matchSearch = (a.title ?? '').toLowerCase().includes(q) || String(a.roomId).includes(q);
			const matchUnread = unreadOnly ? !a.isRead : true;
			return matchSearch && matchUnread;
		});
		return [...res].sort((a, b) => {
			const ta = new Date(a.time).getTime();
			const tb = new Date(b.time).getTime();
			return sortBy === 'oldest' ? ta - tb : tb - ta;
		});
	}, [alerts, search, sortBy, unreadOnly]);

	const sortLabel = sortBy === 'oldest' ? 'Oldest First' : 'Newest First';

	const handleAcknowledge = useCallback(async (alertId) => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/alerts/${alertId}/acknowledge`, {
				method: 'PATCH',
				headers: authHeader,
			});
			if (!res.ok) {
				const data = await res.json();
				Alert.alert('Error', data.error || 'Failed to update alert');
				return;
			}
			setAlerts((cur) => cur.map((a) => a.id === alertId ? { ...a, isRead: !a.isRead } : a));
		} catch {
			Alert.alert('Error', 'Unable to connect to server.');
		}
	}, [user?.token]);

	const handleDelete = useCallback((alertId) => {
		Alert.alert('Delete Alert', 'Remove this alert permanently?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					try {
						const res = await fetch(`${API_BASE_URL}/api/alerts/${alertId}`, {
							method: 'DELETE',
							headers: authHeader,
						});
						if (!res.ok) {
							const data = await res.json();
							Alert.alert('Error', data.error || 'Failed to delete alert');
							return;
						}
						setAlerts((cur) => cur.filter((a) => a.id !== alertId));
					} catch {
						Alert.alert('Error', 'Unable to connect to server.');
					}
				},
			},
		]);
	}, [user?.token]);

	const renderItem = ({ item, index }) => {
		const isEven = index % 2 === 0;
		return (
			<View style={[styles.row, isEven && styles.rowEven]}>
				<View style={styles.colRoomId}>
					<View style={styles.roomIdBadge}>
						<Text style={styles.roomIdText}>#{item.roomId}</Text>
					</View>
				</View>

				<View style={styles.colTime}>
					<Text style={styles.timeText}>{formatDateTime(item.time)}</Text>
				</View>

				<View style={styles.colTitle}>
					<View style={styles.titleRow}>
						<View style={[styles.severityDot, !item.isRead && styles.severityDotActive]} />
						<Text style={styles.titleText} numberOfLines={2}>{item.title}</Text>
					</View>
				</View>

				<View style={styles.colAck}>
					<TouchableOpacity
						style={[styles.ackBadge, item.isRead ? styles.ackBadgeRead : styles.ackBadgeUnread]}
						onPress={() => handleAcknowledge(item.id)}
					>
						<Ionicons
							name={item.isRead ? 'checkmark-circle' : 'ellipse-outline'}
							size={12}
							color={item.isRead ? '#16a34a' : '#ea580c'}
						/>
						<Text style={[styles.ackText, item.isRead ? styles.ackTextRead : styles.ackTextUnread]}>
							{item.isRead ? 'Read' : 'Unread'}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
						<Ionicons name="trash-outline" size={14} color="#e53935" />
					</TouchableOpacity>
				</View>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" />

			<View style={[styles.headerTop, isWide && styles.headerTopWeb]}>
				<Text style={styles.headerTitle}>Alert Notifications</Text>
				<Text style={styles.headerSubtitle}>Monitor and acknowledge system alerts</Text>
				<View style={styles.statsRow}>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{totalAlerts}</Text>
						<Text style={styles.statLabel}>Total</Text>
					</View>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="alert-circle-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{unreadCount}</Text>
						<Text style={styles.statLabel}>Unread</Text>
					</View>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="checkmark-circle-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{readCount}</Text>
						<Text style={styles.statLabel}>Acknowledged</Text>
					</View>
				</View>
			</View>

			<View style={[styles.content, isWide && styles.contentWeb]}>
				<View style={styles.toolbar}>
					<View style={styles.searchBox}>
						<Ionicons name="search" size={16} color="#9ca3af" />
						<TextInput
							placeholder="Search by warning title or room ID..."
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
							<TouchableOpacity
								style={styles.sortBtn}
								onPress={() => setShowSortMenu((o) => !o)}
							>
								<Ionicons name="funnel-outline" size={14} color="#374151" />
								<Text numberOfLines={1} style={styles.sortText}>{sortLabel}</Text>
								<Ionicons name={showSortMenu ? 'chevron-up' : 'chevron-down'} size={14} color="#374151" />
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.filterBtn, unreadOnly && styles.filterBtnActive]}
								onPress={() => setUnreadOnly((v) => !v)}
							>
								<Text style={[styles.filterText, unreadOnly && styles.filterTextActive]}>Unread Only</Text>
							</TouchableOpacity>

							{showSortMenu && (
								<View style={styles.sortMenu}>
									{[['newest', 'Newest First'], ['oldest', 'Oldest First']].map(([val, label]) => (
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
						<Text style={[styles.headerCell, styles.hRoomId]}>Room</Text>
						<Text style={[styles.headerCell, styles.hTime]}>Time</Text>
						<Text style={[styles.headerCell, styles.hTitle]}>Warning Title</Text>
						<Text style={[styles.headerCell, styles.hAck]}>Acknowledge</Text>
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
									<Ionicons name="notifications-off-outline" size={40} color="#d1d5db" />
									<Text style={styles.empty}>No alerts found.</Text>
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
		flex: 1,
		marginHorizontal: 4,
		backgroundColor: 'rgba(255,255,255,0.15)',
		padding: 12,
		borderRadius: 10,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.12)',
	},
	statIconWrap: { marginBottom: 4 },
	statNumber: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 28 },
	statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2, fontWeight: '500' },
	content: {
		flex: 1,
		paddingHorizontal: 14,
		paddingTop: 14,
		paddingBottom: 16,
	},
	toolbar: {
		marginBottom: 14,
		zIndex: 10,
	},
	searchBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		gap: 8,
		marginBottom: 10,
	},
	searchInput: { flex: 1, color: '#111827', fontSize: 14 },
	controlsWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		position: 'relative',
		zIndex: 10,
	},
	leftControls: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'relative' },
	sortBtn: {
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: '#e5e7eb',
		paddingHorizontal: 10,
		paddingVertical: 10,
		borderRadius: 10,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		minWidth: 130,
	},
	sortText: { color: '#374151', fontSize: 13, fontWeight: '600', flex: 1 },
	sortMenu: {
		position: 'absolute',
		top: 46,
		left: 0,
		backgroundColor: '#fff',
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		minWidth: 160,
		zIndex: 20,
		elevation: 6,
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 4 },
	},
	sortOption: {
		paddingVertical: 11,
		paddingHorizontal: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	sortOptionText: { color: '#374151', fontSize: 14 },
	sortOptionActive: { color: '#e53935', fontWeight: '600' },
	filterBtn: {
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: '#e5e7eb',
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 10,
	},
	filterBtnActive: { backgroundColor: '#fff7ed', borderColor: '#fdba74' },
	filterText: { color: '#374151', fontSize: 13, fontWeight: '600' },
	filterTextActive: { color: '#ea580c' },
	tableCard: {
		flex: 1,
		backgroundColor: '#fff',
		borderRadius: 14,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	tableHeader: {
		flexDirection: 'row',
		paddingVertical: 11,
		paddingHorizontal: 16,
		backgroundColor: '#f8f9fb',
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	headerCell: {
		color: '#9ca3af',
		fontWeight: '700',
		fontSize: 11,
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	hRoomId: { flex: 0.7, textAlign: 'center' },
	hTime: { flex: 1.3, textAlign: 'center' },
	hTitle: { flex: 2.8 },
	hAck: { flex: 1.2, textAlign: 'center' },
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 13,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#f3f4f6',
		backgroundColor: '#fff',
	},
	rowEven: { backgroundColor: '#fafbfc' },
	colRoomId: { flex: 0.7, alignItems: 'center' },
	colTime: { flex: 1.3, alignItems: 'center' },
	colTitle: { flex: 2.8 },
	colAck: { flex: 1.2, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
	roomIdBadge: {
		backgroundColor: '#f3f4f6',
		borderRadius: 8,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	roomIdText: { fontSize: 12, fontWeight: '700', color: '#374151' },
	timeText: { fontSize: 11, color: '#9ca3af', textAlign: 'center', lineHeight: 16 },
	titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	severityDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#d1d5db', flexShrink: 0 },
	severityDotActive: { backgroundColor: '#e53935' },
	titleText: { fontSize: 13, fontWeight: '500', color: '#111827', flex: 1 },
	ackBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 20,
	},
	ackBadgeUnread: { backgroundColor: '#fff7ed' },
	ackBadgeRead: { backgroundColor: '#f0fdf4' },
	ackText: { fontSize: 11, fontWeight: '700' },
	ackTextUnread: { color: '#ea580c' },
	ackTextRead: { color: '#16a34a' },
	deleteBtn: { padding: 6, backgroundColor: '#fff1f2', borderRadius: 8 },
	loader: { marginTop: 32 },
	emptyWrap: { alignItems: 'center', marginTop: 40, gap: 10 },
	empty: { textAlign: 'center', color: '#9ca3af', fontSize: 14 },
	headerTopWeb: { paddingHorizontal: 32 },
	contentWeb: { paddingHorizontal: 32, maxWidth: 1200, alignSelf: 'center', width: '100%' },
});
