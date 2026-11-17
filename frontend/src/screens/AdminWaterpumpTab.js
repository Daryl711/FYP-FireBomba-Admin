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
import { useI18n } from '../i18n';
import { API_BASE_URL } from '../../constants/api';

// Background re-check interval comes from Profile > Settings (default 1 min).

function formatDateTime(dateStr, locale) {
	if (!dateStr) return '';
	return new Date(dateStr).toLocaleString(locale, {
		day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
	});
}

export default function AdminWaterpumpTab() {
	const { user, settings } = useApp();
	const { t, locale } = useI18n();
	const refreshIntervalMs = (settings?.refreshIntervalSec ?? 60) * 1000;
	const { width } = useWindowDimensions();
	const isWide = Platform.OS === 'web' && width >= 768;

	const [actuators, setActuators] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [search, setSearch] = useState('');
	const [sortBy, setSortBy] = useState('room');
	const [showSortMenu, setShowSortMenu] = useState(false);
	const [activeOnly, setActiveOnly] = useState(false);

	const authHeader = { Authorization: `Bearer ${user?.token}` };

	const fetchActuators = useCallback(async ({ silent = false } = {}) => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/actuators`, { headers: authHeader });
			const data = await res.json();
			if (!res.ok) throw new Error(t(data.error || 'Failed to fetch actuators'));
			const mapped = data.actuators.map((a) => ({
				roomId: a.room_id,
				roomName: a.room_name,
				bilikNumber: a.bilik_number,
				isOn: a.waterpump_enabled === true,
				lastUpdated: a.last_updated,
			}));
			setActuators(mapped);
		} catch (err) {
			// A failed background refresh keeps the last good data on screen.
			if (!silent) Alert.alert(t('Error'), err.message);
		}
	}, [user?.token, t]);

	useEffect(() => {
		fetchActuators().finally(() => setLoading(false));
		if (!refreshIntervalMs) return undefined;
		const timer = setInterval(() => fetchActuators({ silent: true }), refreshIntervalMs);
		return () => clearInterval(timer);
	}, [fetchActuators, refreshIntervalMs]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await fetchActuators();
		setRefreshing(false);
	}, [fetchActuators]);

	const total = actuators.length;
	const onCount = actuators.filter((a) => a.isOn).length;
	const offCount = total - onCount;

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		const res = actuators.filter((a) => {
			const matchSearch = `${a.roomId} ${a.roomName} ${a.bilikNumber || ''}`.toLowerCase().includes(q);
			const matchActive = activeOnly ? a.isOn : true;
			return matchSearch && matchActive;
		});
		const changed = (a) => (a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0);
		return [...res].sort((a, b) => {
			if (sortBy === 'status') return Number(b.isOn) - Number(a.isOn) || a.roomId - b.roomId;
			if (sortBy === 'changed') return changed(b) - changed(a);
			return a.roomId - b.roomId;
		});
	}, [actuators, search, sortBy, activeOnly]);

	const SORT_OPTIONS = [['room', t('Sort by Room')], ['status', t('On First')], ['changed', t('Recently Changed')]];
	const sortLabel = SORT_OPTIONS.find(([val]) => val === sortBy)[1];

	const renderItem = ({ item, index }) => {
		const isEven = index % 2 === 0;
		return (
			<View style={[styles.row, isEven && styles.rowEven]}>
				<View style={styles.colRoom}>
					<Text style={styles.roomName} numberOfLines={1}>{item.roomName}</Text>
					<Text style={styles.roomSub} numberOfLines={1}>
						{item.bilikNumber ? `${item.bilikNumber} · ${t('Room #{id}', { id: item.roomId })}` : t('Room #{id}', { id: item.roomId })}
					</Text>
				</View>

				<View style={styles.colStatus}>
					<View style={[styles.badge, item.isOn ? styles.badgeOn : styles.badgeOff]}>
						<Ionicons
							name={item.isOn ? 'water' : 'water-outline'}
							size={12}
							color={item.isOn ? '#0369a1' : '#9ca3af'}
						/>
						<Text style={[styles.badgeText, item.isOn ? styles.badgeTextOn : styles.badgeTextOff]}>
							{item.isOn ? t('On') : t('Off')}
						</Text>
					</View>
				</View>

				<View style={styles.colDate}>
					<Text style={styles.dateText}>
						{item.lastUpdated ? formatDateTime(item.lastUpdated, locale) : t('Never used')}
					</Text>
				</View>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" />

			<View style={[styles.headerTop, isWide && styles.headerTopWeb]}>
				<Text style={styles.headerTitle}>{t('Waterpump Management')}</Text>
				<Text style={styles.headerSubtitle}>{t('Monitor the water pump in every room')}</Text>
				<View style={styles.statsRow}>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="water-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{total}</Text>
						<Text style={styles.statLabel}>{t('Total')}</Text>
					</View>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="water" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{onCount}</Text>
						<Text style={styles.statLabel}>{t('On')}</Text>
					</View>
					<View style={styles.statCard}>
						<View style={styles.statIconWrap}>
							<Ionicons name="power-outline" size={20} color="rgba(255,255,255,0.9)" />
						</View>
						<Text style={styles.statNumber}>{offCount}</Text>
						<Text style={styles.statLabel}>{t('Off')}</Text>
					</View>
				</View>
			</View>

			<View style={[styles.content, isWide && styles.contentWeb]}>
				<View style={styles.toolbar}>
					<View style={styles.searchBox}>
						<Ionicons name="search" size={16} color="#9ca3af" />
						<TextInput
							placeholder={t('Search by room or bilik...')}
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
								<Text style={[styles.filterText, activeOnly && styles.filterTextActive]}>{t('On Only')}</Text>
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
					</View>
				</View>

				<View style={styles.tableCard}>
					<View style={styles.tableHeader}>
						<Text style={[styles.headerCell, styles.hRoom]}>{t('Room')}</Text>
						<Text numberOfLines={1} style={[styles.headerCell, styles.hStatus]}>{t('Pump Status')}</Text>
						<Text numberOfLines={1} style={[styles.headerCell, styles.hDate]}>{t('Last Changed')}</Text>
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
									<Ionicons name="water-outline" size={40} color="#d1d5db" />
									<Text style={styles.empty}>{t('No water pumps found.')}</Text>
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
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
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
	sortBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 130 },
	sortText: { color: '#374151', fontSize: 13, fontWeight: '600', flex: 1 },
	sortMenu: { position: 'absolute', top: 46, left: 0, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', minWidth: 160, zIndex: 20, elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
	sortOption: { paddingVertical: 11, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	sortOptionText: { color: '#374151', fontSize: 14 },
	sortOptionActive: { color: '#e53935', fontWeight: '600' },
	filterBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
	filterBtnActive: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
	filterText: { color: '#374151', fontSize: 13, fontWeight: '600' },
	filterTextActive: { color: '#15803d' },
	tableCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
	tableHeader: { flexDirection: 'row', paddingVertical: 11, paddingHorizontal: 16, backgroundColor: '#f8f9fb', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
	headerCell: { color: '#9ca3af', fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
	hRoom: { flex: 2.2 },
	hStatus: { flex: 1, textAlign: 'center' },
	hDate: { flex: 1.4, textAlign: 'center' },
	row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#fff' },
	rowEven: { backgroundColor: '#fafbfc' },
	colRoom: { flex: 2.2, justifyContent: 'center', paddingRight: 6 },
	colStatus: { flex: 1, alignItems: 'center' },
	colDate: { flex: 1.4, alignItems: 'center' },
	roomName: { fontSize: 14, fontWeight: '600', color: '#111827' },
	roomSub: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
	badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
	badgeOn: { backgroundColor: '#e0f2fe' },
	badgeOff: { backgroundColor: '#f3f4f6' },
	badgeText: { fontSize: 12, fontWeight: '600' },
	badgeTextOn: { color: '#0369a1' },
	badgeTextOff: { color: '#6b7280' },
	dateText: { color: '#9ca3af', fontSize: 12, textAlign: 'center' },
	loader: { marginTop: 32 },
	emptyWrap: { alignItems: 'center', marginTop: 40, gap: 10 },
	empty: { textAlign: 'center', color: '#9ca3af', fontSize: 14 },
	headerTopWeb: { paddingHorizontal: 32 },
	contentWeb: { paddingHorizontal: 32, maxWidth: 1200, alignSelf: 'center', width: '100%' },
});