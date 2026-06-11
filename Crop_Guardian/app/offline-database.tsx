import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomButton } from '@/components/CustomButton';

interface ModelDb {
  id: string;
  name: string;
  description: string;
  size: string;
  status: 'Downloaded' | 'Update Available' | 'Not Downloaded';
  icon: keyof typeof Ionicons.glyphMap;
}

export default function OfflineDatabaseScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Mock list of database modules
  const [dbModules, setDbModules] = useState<ModelDb[]>([
    {
      id: 'maize',
      name: 'Maize & Grains Model',
      description: 'Covers Leaf Blight, Rust, and Fall Armyworm diagnostics.',
      size: '12 MB',
      status: 'Downloaded',
      icon: 'leaf-outline',
    },
    {
      id: 'cassava',
      name: 'Cassava & Tubers Model',
      description: 'Covers Cassava Mosaic Disease and Brown Streak Disease.',
      size: '15 MB',
      status: 'Downloaded',
      icon: 'grid-outline',
    },
    {
      id: 'vegetables',
      name: 'Tomato & Vegetables Model',
      description: 'Covers Late Blight, Wilt, and Leaf Miner detection.',
      size: '11 MB',
      status: 'Update Available',
      icon: 'nutrition-outline',
    },
    {
      id: 'cocoa',
      name: 'Cocoa & Cash Crops Model',
      description: 'Covers Swollen Shoot Virus and Black Pod Disease.',
      size: '22 MB',
      status: 'Not Downloaded',
      icon: 'rose-outline',
    },
  ]);

  // Download simulation states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null); // null means "all"
  const [showSuccess, setShowSuccess] = useState(false);

  const simulateDownload = (id: string | null) => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    setActiveDownloadId(id);
    setShowSuccess(false);
  };

  useEffect(() => {
    let interval: any;
    if (isDownloading) {
      interval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsDownloading(false);
            setShowSuccess(true);
            
            // Update local status
            setDbModules((prevModules) =>
              prevModules.map((module) => {
                if (activeDownloadId === null || module.id === activeDownloadId) {
                  return { ...module, status: 'Downloaded' };
                }
                return module;
              })
            );

            setTimeout(() => {
              setShowSuccess(false);
            }, 3000);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isDownloading, activeDownloadId]);

  // Overall database status details
  const totalDownloaded = dbModules.filter((m) => m.status === 'Downloaded').length;
  const updatesCount = dbModules.filter((m) => m.status === 'Update Available').length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      
      {/* ================= HEADER SECTION ================= */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={[styles.backButton, { borderColor: theme.primary }]} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={moderateScale(18)} color={theme.primary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.primary }]}>Offline Database</Text>

        <View style={styles.rightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= SUCCESS BANNER ================= */}
        {showSuccess && (
          <View style={styles.successBanner}>
            <View style={styles.successIconWrapper}>
              <Ionicons name="checkmark-sharp" size={moderateScale(15)} color="#FFFFFF" />
            </View>
            <Text style={styles.successText}>
              {activeDownloadId 
                ? 'Model database downloaded successfully!' 
                : 'All database modules updated successfully!'}
            </Text>
          </View>
        )}

        {/* ================= SECURITY LOCK HEADER ================= */}
        <View style={styles.dbHeader}>
          <View style={[styles.iconWrapper, { backgroundColor: colorScheme === 'light' ? '#EBF7E9' : '#1E2C20' }]}>
            <Ionicons name="cloud-download-outline" size={moderateScale(32)} color="#094A04" />
          </View>
          <Text style={[styles.dbTitle, { color: theme.text }]}>Offline AI Diagnostics</Text>
          <Text style={[styles.dbSub, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
            Download local machine learning models to diagnose crop illnesses instantly in fields without cellular networks.
          </Text>
        </View>

        {/* ================= SUMMARY STATS CARD ================= */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
          <View style={styles.summaryTopRow}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>Database Status</Text>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: updatesCount > 0 ? '#FFE0B2' : '#C8E6C9' }
            ]}>
              <Text style={[styles.statusBadgeText, { color: updatesCount > 0 ? '#E65100' : '#094A04' }]}>
                {updatesCount > 0 ? 'Update Available' : 'Up to Date'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{totalDownloaded} / {dbModules.length}</Text>
              <Text style={styles.statLabel}>Active Modules</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statVal}>v2.4.1</Text>
              <Text style={styles.statLabel}>Engine Version</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>38 MB</Text>
              <Text style={styles.statLabel}>Total Local Storage</Text>
            </View>
          </View>

          {/* Download progress bar overlay */}
          {isDownloading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressLabel}>
                  {activeDownloadId 
                    ? `Downloading ${dbModules.find(m => m.id === activeDownloadId)?.name}...` 
                    : 'Updating all offline databases...'}
                </Text>
                <Text style={styles.progressPercent}>{downloadProgress}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${downloadProgress}%` }]} />
              </View>
            </View>
          )}

          {updatesCount > 0 && !isDownloading && (
            <CustomButton
              title="Update All Databases"
              onPress={() => simulateDownload(null)}
              style={styles.updateAllBtn}
            />
          )}
        </View>

        {/* ================= DATABASE MODULES LIST ================= */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>AVAILABLE MODEL DATABASES</Text>
        <View style={styles.moduleList}>
          {dbModules.map((module) => {
            const isIndividualDownloading = isDownloading && activeDownloadId === module.id;
            return (
              <View 
                key={module.id} 
                style={[styles.moduleCard, { backgroundColor: theme.surface }]}
              >
                <View style={styles.moduleHeaderRow}>
                  <View style={[styles.moduleIconBg, { backgroundColor: colorScheme === 'light' ? '#EBF7E9' : '#1E2C20' }]}>
                    <Ionicons name={module.icon} size={moderateScale(20)} color="#094A04" />
                  </View>
                  <View style={styles.moduleInfo}>
                    <View style={styles.moduleNameRow}>
                      <Text style={[styles.moduleName, { color: theme.text }]}>{module.name}</Text>
                      <Text style={[styles.moduleSize, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
                        {module.size}
                      </Text>
                    </View>
                    <Text style={[styles.moduleDesc, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
                      {module.description}
                    </Text>
                  </View>
                </View>

                {/* Actions bottom bar inside module card */}
                <View style={styles.moduleActionsBar}>
                  {/* Status Indicator */}
                  <View style={styles.statusIndicatorRow}>
                    <Ionicons 
                      name={
                        module.status === 'Downloaded' 
                          ? 'checkmark-circle' 
                          : module.status === 'Update Available' 
                            ? 'alert-circle' 
                            : 'cloud-offline-outline'
                      } 
                      size={moderateScale(14)} 
                      color={
                        module.status === 'Downloaded' 
                          ? '#2E7D32' 
                          : module.status === 'Update Available' 
                            ? '#E65100' 
                            : '#9CA3AF'
                      } 
                    />
                    <Text style={[
                      styles.statusIndicatorText,
                      { 
                        color: 
                          module.status === 'Downloaded' 
                            ? '#2E7D32' 
                            : module.status === 'Update Available' 
                              ? '#E65100' 
                              : '#9CA3AF'
                      }
                    ]}>
                      {module.status === 'Downloaded' 
                        ? 'Ready Offline' 
                        : module.status === 'Update Available' 
                          ? 'Update Available' 
                          : 'Not Downloaded'}
                    </Text>
                  </View>

                  {/* Individual Download / Update trigger */}
                  {module.status !== 'Downloaded' && !isDownloading && (
                    <TouchableOpacity
                      style={[styles.downloadPillBtn, { backgroundColor: '#094A04' }]}
                      onPress={() => simulateDownload(module.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name={module.status === 'Update Available' ? 'sync-outline' : 'cloud-download-outline'} 
                        size={moderateScale(12)} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.downloadPillText}>
                        {module.status === 'Update Available' ? 'Update' : 'Download'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {isIndividualDownloading && (
                    <View style={styles.activePillProgress}>
                      <Text style={styles.activePillPercent}>{downloadProgress}%</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
  },
  backButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    textAlign: 'center',
  },
  rightSpacer: {
    width: moderateScale(32),
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(40),
  },

  // Alerts
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  successIconWrapper: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(8),
  },
  successText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '700',
    flex: 1,
  },

  // DB Lock Header
  dbHeader: {
    alignItems: 'center',
    marginVertical: verticalScale(16),
    paddingHorizontal: scale(20),
  },
  iconWrapper: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dbTitle: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    marginBottom: verticalScale(4),
  },
  dbSub: {
    fontSize: moderateScale(11.5),
    textAlign: 'center',
    lineHeight: verticalScale(16),
  },

  // Stats dashboard card
  summaryCard: {
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1.2,
    borderColor: 'rgba(9, 74, 4, 0.06)',
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  summaryTitle: {
    fontSize: moderateScale(14),
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
  },
  statusBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: verticalScale(4),
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: '#094A04',
    marginBottom: verticalScale(2),
  },
  statLabel: {
    fontSize: moderateScale(9),
    fontWeight: '600',
    color: '#687076',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: verticalScale(20),
    backgroundColor: '#E5E7EB',
  },

  // Progress Bar for updates
  progressContainer: {
    marginTop: verticalScale(14),
    backgroundColor: 'rgba(9, 74, 4, 0.02)',
    padding: scale(12),
    borderRadius: moderateScale(10),
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  progressLabel: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#094A04',
    flex: 1,
  },
  progressPercent: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#094A04',
    marginLeft: scale(4),
  },
  progressTrack: {
    height: verticalScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: moderateScale(3),
    backgroundColor: '#094A04',
  },
  updateAllBtn: {
    marginTop: verticalScale(14),
    marginBottom: 0,
  },

  // Available Modules list
  sectionTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#094A04',
    letterSpacing: 1.5,
    marginBottom: verticalScale(12),
  },
  moduleList: {
    gap: verticalScale(12),
  },
  moduleCard: {
    borderRadius: moderateScale(14),
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(14),
    borderWidth: 1.2,
    borderColor: 'rgba(9, 74, 4, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
  },
  moduleIconBg: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  moduleInfo: {
    flex: 1,
  },
  moduleNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(2),
  },
  moduleName: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    flex: 1,
    paddingRight: scale(8),
  },
  moduleSize: {
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  moduleDesc: {
    fontSize: moderateScale(10.5),
    lineHeight: verticalScale(15),
  },
  moduleActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(9, 74, 4, 0.06)',
    paddingVertical: verticalScale(10),
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  statusIndicatorText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  downloadPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(14),
    gap: scale(4),
  },
  downloadPillText: {
    color: '#FFFFFF',
    fontSize: moderateScale(10.5),
    fontWeight: '700',
  },
  activePillProgress: {
    backgroundColor: 'rgba(9, 74, 4, 0.08)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  activePillPercent: {
    fontSize: moderateScale(10.5),
    fontWeight: '800',
    color: '#094A04',
  },
});
