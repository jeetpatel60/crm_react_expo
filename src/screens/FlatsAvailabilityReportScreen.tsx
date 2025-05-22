import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView, Dimensions } from 'react-native';
import { Text, useTheme, Card, Chip, Searchbar, SegmentedButtons, FAB, IconButton, Menu, Divider, Button, Portal, Dialog, TouchableRipple } from 'react-native-paper';
import { UnitFlatWithDetails, getUnitsFlatWithDetails } from '../database/unitsFlatDb';
import { Project, getProjects } from '../database/projectsDb';
import { LoadingIndicator, EmptyState } from '../components';
import { spacing, shadows, animations, borderRadius } from '../constants/theme';
import { formatCurrency } from '../utils/formatters';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { generateAndShareCustomerLedgerPdf } from '../utils/reportUtils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

// Define the status options for filtering
const ALL_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Available', label: 'Available' },
  { value: 'Booked', label: 'Booked' },
  { value: 'Sold', label: 'Sold' },
];

// Building view is the only view mode now

// Building Visualization Component
interface BuildingVisualizationProps {
  units: UnitFlatWithDetails[];
  project: Project | undefined;
  onUnitPress: (unit: UnitFlatWithDetails) => void;
}

const BuildingVisualization: React.FC<BuildingVisualizationProps> = ({
  units,
  project,
  onUnitPress
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedWing, setSelectedWing] = useState<string | null>(null);

  // Extract unique floor numbers and wings from flat_no
  const { floors, wings } = useMemo(() => {
    console.log('BuildingVisualization received units:', units.length);

    const floorSet = new Set<string>();
    const wingSet = new Set<string>();

    // Add default floor and wing if no units match the pattern
    floorSet.add('1');
    wingSet.add('A');

    units.forEach(unit => {
      // Extract floor from flat_no (assuming format like "A-101" where 1 is the floor)
      // Try different patterns to be more flexible
      let floorNumber = null;

      // Try pattern like "A-101"
      const floorMatch1 = unit.flat_no.match(/[A-Za-z]-(\d+)/);
      if (floorMatch1 && floorMatch1[1]) {
        floorNumber = floorMatch1[1].charAt(0);
      }
      // Try pattern like "101" (just numbers)
      else if (/^\d+$/.test(unit.flat_no)) {
        floorNumber = unit.flat_no.charAt(0);
      }
      // Try pattern like "Flat 101"
      else {
        const floorMatch2 = unit.flat_no.match(/(\d+)/);
        if (floorMatch2 && floorMatch2[1]) {
          floorNumber = floorMatch2[1].charAt(0);
        }
      }

      if (floorNumber) {
        floorSet.add(floorNumber);
      }

      // Extract wing from flat_no (assuming format like "A-101" where A is the wing)
      // Try different patterns to be more flexible
      let wing = null;

      // Try pattern like "A-101"
      const wingMatch1 = unit.flat_no.match(/^([A-Za-z])-/);
      if (wingMatch1 && wingMatch1[1]) {
        wing = wingMatch1[1];
      }
      // Try to extract any letter as a wing
      else {
        const wingMatch2 = unit.flat_no.match(/([A-Za-z])/);
        if (wingMatch2 && wingMatch2[1]) {
          wing = wingMatch2[1];
        } else {
          // If no letter found, use 'A' as default wing
          wing = 'A';
        }
      }

      if (wing) {
        wingSet.add(wing);
      }
    });

    const sortedFloors = Array.from(floorSet).sort();
    const sortedWings = Array.from(wingSet).sort();

    console.log('Extracted floors:', sortedFloors);
    console.log('Extracted wings:', sortedWings);

    return {
      floors: sortedFloors,
      wings: sortedWings
    };
  }, [units]);

  // Group units by floor and wing
  const groupedUnits = useMemo(() => {
    const grouped: Record<string, Record<string, UnitFlatWithDetails[]>> = {};

    // Initialize structure
    floors.forEach(floor => {
      grouped[floor] = {};
      wings.forEach(wing => {
        grouped[floor][wing] = [];
      });
    });

    // Group units
    units.forEach(unit => {
      // Extract floor using the same logic as above
      let floorNumber = null;
      let wing = null;

      // Try pattern like "A-101"
      const floorMatch1 = unit.flat_no.match(/[A-Za-z]-(\d+)/);
      if (floorMatch1 && floorMatch1[1]) {
        floorNumber = floorMatch1[1].charAt(0);
      }
      // Try pattern like "101" (just numbers)
      else if (/^\d+$/.test(unit.flat_no)) {
        floorNumber = unit.flat_no.charAt(0);
      }
      // Try pattern like "Flat 101"
      else {
        const floorMatch2 = unit.flat_no.match(/(\d+)/);
        if (floorMatch2 && floorMatch2[1]) {
          floorNumber = floorMatch2[1].charAt(0);
        }
      }

      // If no floor number found, use the first floor
      if (!floorNumber && floors.length > 0) {
        floorNumber = floors[0];
      }

      // Extract wing using the same logic as above
      // Try pattern like "A-101"
      const wingMatch1 = unit.flat_no.match(/^([A-Za-z])-/);
      if (wingMatch1 && wingMatch1[1]) {
        wing = wingMatch1[1];
      }
      // Try to extract any letter as a wing
      else {
        const wingMatch2 = unit.flat_no.match(/([A-Za-z])/);
        if (wingMatch2 && wingMatch2[1]) {
          wing = wingMatch2[1];
        }
      }

      // If no wing found, use the first wing
      if (!wing && wings.length > 0) {
        wing = wings[0];
      }

      // Add unit to the appropriate group if floor and wing are found
      if (floorNumber && wing && grouped[floorNumber] && grouped[floorNumber][wing]) {
        grouped[floorNumber][wing].push(unit);
      } else if (floorNumber && floors.includes(floorNumber) && wings.length > 0) {
        // If wing not found but floor exists, add to the first wing
        const firstWing = wings[0];
        if (grouped[floorNumber][firstWing]) {
          grouped[floorNumber][firstWing].push(unit);
        }
      } else if (wing && wings.includes(wing) && floors.length > 0) {
        // If floor not found but wing exists, add to the first floor
        const firstFloor = floors[0];
        if (grouped[firstFloor][wing]) {
          grouped[firstFloor][wing].push(unit);
        }
      } else if (floors.length > 0 && wings.length > 0) {
        // If neither floor nor wing found, add to the first floor and wing
        const firstFloor = floors[0];
        const firstWing = wings[0];
        if (grouped[firstFloor][firstWing]) {
          grouped[firstFloor][firstWing].push(unit);
        }
      }
    });

    // Sort units within each group
    floors.forEach(floor => {
      wings.forEach(wing => {
        if (grouped[floor][wing]) {
          grouped[floor][wing].sort((a, b) => {
            // Try to extract numbers for sorting
            const aNumMatch = a.flat_no.match(/(\d+)/);
            const bNumMatch = b.flat_no.match(/(\d+)/);

            const aNum = aNumMatch ? parseInt(aNumMatch[0]) : 0;
            const bNum = bNumMatch ? parseInt(bNumMatch[0]) : 0;

            if (aNum !== bNum) {
              return aNum - bNum;
            }

            // If numbers are the same, sort by flat_no
            return a.flat_no.localeCompare(b.flat_no);
          });
        }
      });
    });

    // Log the number of units in each floor and wing
    let totalUnitsGrouped = 0;
    floors.forEach(floor => {
      wings.forEach(wing => {
        if (grouped[floor] && grouped[floor][wing]) {
          totalUnitsGrouped += grouped[floor][wing].length;
          console.log(`Floor ${floor}, Wing ${wing}: ${grouped[floor][wing].length} units`);
        }
      });
    });
    console.log(`Total units grouped: ${totalUnitsGrouped} out of ${units.length}`);

    return grouped;
  }, [units, floors, wings]);

  // Filter units by selected floor and wing
  const filteredUnits = useMemo(() => {
    if (!selectedFloor && !selectedWing) return units;

    return units.filter(unit => {
      // Extract floor using the same logic as above
      let floorNumber = null;
      let wing = null;

      // Try pattern like "A-101"
      const floorMatch1 = unit.flat_no.match(/[A-Za-z]-(\d+)/);
      if (floorMatch1 && floorMatch1[1]) {
        floorNumber = floorMatch1[1].charAt(0);
      }
      // Try pattern like "101" (just numbers)
      else if (/^\d+$/.test(unit.flat_no)) {
        floorNumber = unit.flat_no.charAt(0);
      }
      // Try pattern like "Flat 101"
      else {
        const floorMatch2 = unit.flat_no.match(/(\d+)/);
        if (floorMatch2 && floorMatch2[1]) {
          floorNumber = floorMatch2[1].charAt(0);
        }
      }

      // If no floor number found, use the first floor
      if (!floorNumber && floors.length > 0) {
        floorNumber = floors[0];
      }

      // Extract wing using the same logic as above
      // Try pattern like "A-101"
      const wingMatch1 = unit.flat_no.match(/^([A-Za-z])-/);
      if (wingMatch1 && wingMatch1[1]) {
        wing = wingMatch1[1];
      }
      // Try to extract any letter as a wing
      else {
        const wingMatch2 = unit.flat_no.match(/([A-Za-z])/);
        if (wingMatch2 && wingMatch2[1]) {
          wing = wingMatch2[1];
        }
      }

      // If no wing found, use the first wing
      if (!wing && wings.length > 0) {
        wing = wings[0];
      }

      const floorMatches = !selectedFloor || floorNumber === selectedFloor;
      const wingMatches = !selectedWing || wing === selectedWing;

      return floorMatches && wingMatches;
    });
  }, [units, selectedFloor, selectedWing, floors, wings]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return '#4CAF50'; // Green
      case 'Booked':
        return '#FFC107'; // Amber
      case 'Sold':
        return '#F44336'; // Red
      default:
        return theme.colors.surfaceVariant;
    }
  };

  // Get status text color
  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'Available':
        return '#FFFFFF'; // White
      case 'Booked':
        return '#000000'; // Black
      case 'Sold':
        return '#FFFFFF'; // White
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available':
        return 'check-circle';
      case 'Booked':
        return 'clock-outline';
      case 'Sold':
        return 'lock';
      default:
        return 'home';
    }
  };

  // Get status badge
  const renderStatusBadge = (status: string) => {
    return (
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
        <MaterialCommunityIcons
          name={getStatusIcon(status)}
          size={12}
          color={getStatusTextColor(status)}
        />
      </View>
    );
  };

  // Render a floor section - floor header hidden as requested
  const renderFloor = (floor: string) => {
    return (
      <View key={floor} style={styles.floorSection}>
        {/* Floor header removed as requested */}
        <View style={styles.wingsContainer}>
          {wings.map(wing => renderWing(floor, wing))}
        </View>
      </View>
    );
  };

  // Render a wing section
  const renderWing = (floor: string, wing: string) => {
    const unitsInWing = groupedUnits[floor][wing];

    if (!unitsInWing || unitsInWing.length === 0) return null;

    return (
      <View key={`${floor}-${wing}`} style={styles.wingSection}>
        {/* Wing title hidden as requested */}
        <View style={styles.unitsGrid}>
          {unitsInWing.map((unit, index) => renderUnit(unit, index))}
        </View>
      </View>
    );
  };

  // Render a unit
  const renderUnit = (unit: UnitFlatWithDetails, index: number) => {
    return (
      <Animated.View
        key={unit.id}
        entering={FadeIn.delay(index * 30).duration(300)}
        style={styles.unitContainer}
      >
        <TouchableRipple
          onPress={() => onUnitPress(unit)}
          style={[
            styles.unitCard,
            { borderColor: getStatusColor(unit.status) }
          ]}
          borderless
        >
          <View style={styles.unitCardContent}>
            <View style={styles.unitHeader}>
              <Text style={styles.unitNumber}>{unit.flat_no}</Text>
              {renderStatusBadge(unit.status)}
            </View>

            {unit.type && (
              <Text style={styles.unitTypeText} numberOfLines={1}>
                {unit.type}
              </Text>
            )}

            {unit.area_sqft && (
              <Text style={styles.unitArea}>
                {unit.area_sqft} sqft
              </Text>
            )}

            {unit.client_name && (
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.unitClient}
              >
                {unit.client_name}
              </Text>
            )}
          </View>
        </TouchableRipple>
      </Animated.View>
    );
  };

  // Render legend
  const renderLegend = () => {
    return (
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Status Legend:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            {renderStatusBadge('Available')}
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            {renderStatusBadge('Booked')}
            <Text style={styles.legendText}>Booked</Text>
          </View>
          <View style={styles.legendItem}>
            {renderStatusBadge('Sold')}
            <Text style={styles.legendText}>Sold</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.buildingContainer}>
      {/* Floor and Wing filters hidden as requested */}

      {/* Legend */}
      {renderLegend()}

      {/* Building visualization */}
      <View style={styles.buildingContentContainer}>
        {selectedFloor ? (
          // Show only selected floor
          renderFloor(selectedFloor)
        ) : (
          // Show all floors
          floors.map(floor => renderFloor(floor))
        )}
      </View>
    </View>
  );
};

const FlatsAvailabilityReportScreen = () => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [units, setUnits] = useState<UnitFlatWithDetails[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<UnitFlatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projects, setProjects] = useState<Map<number, Project>>(new Map());
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  // Building view is the only view mode
  const [selectedUnit, setSelectedUnit] = useState<UnitFlatWithDetails | null>(null);
  const [unitDetailsVisible, setUnitDetailsVisible] = useState(false);
  const [exportDialogVisible, setExportDialogVisible] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);

      // Get all units with details
      const unitsData = await getUnitsFlatWithDetails();
      console.log('Loaded units data:', unitsData.length, 'units');

      // Log some sample data to help with debugging
      if (unitsData.length > 0) {
        console.log('Sample unit data:', unitsData[0]);
      }

      setUnits(unitsData);

      // Get all projects for filtering
      const projectsData = await getProjects();
      console.log('Loaded projects data:', projectsData.length, 'projects');

      const projectsMap = new Map<number, Project>();
      projectsData.forEach(project => {
        projectsMap.set(project.id!, project);
      });
      setProjects(projectsMap);

      // Apply initial filters
      applyFilters(unitsData, searchQuery, statusFilter, selectedProjectId);
    } catch (error) {
      console.error('Error loading flats availability data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Apply filters to the units data
  const applyFilters = (
    data: UnitFlatWithDetails[],
    query: string,
    status: string,
    projectId: number | null
  ) => {
    let filtered = [...data];

    // Apply search query filter
    if (query) {
      filtered = filtered.filter(unit =>
        unit.flat_no.toLowerCase().includes(query.toLowerCase()) ||
        unit.project_name?.toLowerCase().includes(query.toLowerCase()) ||
        unit.client_name?.toLowerCase().includes(query.toLowerCase()) ||
        unit.type?.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter(unit => unit.status === status);
    }

    // Apply project filter
    if (projectId !== null) {
      filtered = filtered.filter(unit => unit.project_id === projectId);
    }

    setFilteredUnits(filtered);
  };

  // Handle search query change
  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(units, query, statusFilter, selectedProjectId);
  };

  // Handle status filter change
  const onChangeStatusFilter = (status: string) => {
    setStatusFilter(status);
    applyFilters(units, searchQuery, status, selectedProjectId);
  };

  // Handle project filter change
  const onChangeProjectFilter = (projectId: number | null) => {
    setSelectedProjectId(projectId);
    setMenuVisible(false);
    applyFilters(units, searchQuery, statusFilter, projectId);
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Handle unit press
  const handleUnitPress = (unit: UnitFlatWithDetails) => {
    setSelectedUnit(unit);
    setUnitDetailsVisible(true);
  };

  // No view mode toggle as we only have building view

  // Generate and share PDF report
  const generateAndSharePDF = async (includeLetterhead: boolean = false) => {
    try {
      setExportLoading(true);

      // Get selected project
      const selectedProject = selectedProjectId ? projects.get(selectedProjectId) : undefined;

      // Calculate summary statistics for the filtered units (not all units)
      const filteredSummary = {
        total: filteredUnits.length,
        available: filteredUnits.filter(unit => unit.status === 'Available').length,
        booked: filteredUnits.filter(unit => unit.status === 'Booked').length,
        sold: filteredUnits.filter(unit => unit.status === 'Sold').length
      };

      console.log('Generating PDF with summary:', filteredSummary);

      // Create HTML content
      const htmlContent = generateFlatsAvailabilityHtml({
        units: filteredUnits,
        projectName: selectedProject?.name || 'All Projects',
        summary: filteredSummary, // Use the filtered summary
        generatedAt: Date.now(),
        includeLetterhead
      });

      // Generate PDF file
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      // Create a filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const projectName = selectedProject?.name ? selectedProject.name.replace(/\s+/g, '_') : 'All_Projects';
      const newUri = `${FileSystem.cacheDirectory}FlatsAvailability_${projectName}_${timestamp}.pdf`;

      // Copy the file to the new location with the timestamp in the name
      await FileSystem.copyAsync({
        from: uri,
        to: newUri
      });

      // Delete the original file
      await FileSystem.deleteAsync(uri, { idempotent: true });

      // Share the PDF
      await shareAsync(newUri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
      });

      setExportDialogVisible(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setExportLoading(false);
    }
  };

  // Generate HTML for PDF
  const generateFlatsAvailabilityHtml = ({
    units,
    projectName,
    summary,
    generatedAt,
    includeLetterhead = false
  }: {
    units: UnitFlatWithDetails[];
    projectName: string;
    summary: { total: number; available: number; booked: number; sold: number };
    generatedAt: number;
    includeLetterhead?: boolean;
  }) => {
    // Generate table rows for list view
    const tableRows = units.map(unit => `
      <tr>
        <td>${unit.flat_no}</td>
        <td>${unit.project_name || 'Unknown'}</td>
        <td>${unit.type || '-'}</td>
        <td>${unit.area_sqft ? `${unit.area_sqft} sqft` : '-'}</td>
        <td>${unit.status}</td>
        <td>${unit.client_name || '-'}</td>
        <td>${unit.flat_value ? formatCurrency(unit.flat_value) : '-'}</td>
      </tr>
    `).join('');

    // Generate building visualization for building view
    const generateBuildingHtml = () => {
      // Group units by floor
      const unitsByFloor: Record<string, UnitFlatWithDetails[]> = {};

      units.forEach(unit => {
        // Extract floor using the same logic as in the component
        let floor = 'other';

        // Try pattern like "A-101"
        const floorMatch1 = unit.flat_no.match(/[A-Za-z]-(\d+)/);
        if (floorMatch1 && floorMatch1[1]) {
          floor = floorMatch1[1].charAt(0);
        }
        // Try pattern like "101" (just numbers)
        else if (/^\d+$/.test(unit.flat_no)) {
          floor = unit.flat_no.charAt(0);
        }
        // Try pattern like "Flat 101"
        else {
          const floorMatch2 = unit.flat_no.match(/(\d+)/);
          if (floorMatch2 && floorMatch2[1]) {
            floor = floorMatch2[1].charAt(0);
          }
        }

        if (!unitsByFloor[floor]) {
          unitsByFloor[floor] = [];
        }

        unitsByFloor[floor].push(unit);
      });

      // Sort floors
      const floors = Object.keys(unitsByFloor).sort();

      // Generate HTML for each floor
      return floors.map(floor => {
        const floorUnits = unitsByFloor[floor].sort((a, b) => a.flat_no.localeCompare(b.flat_no));

        const unitHtml = floorUnits.map(unit => {
          let statusColor = '';
          switch (unit.status) {
            case 'Available':
              statusColor = '#E0F2F1'; // Light teal
              break;
            case 'Booked':
              statusColor = '#FFF8E1'; // Light amber
              break;
            case 'Sold':
              statusColor = '#FFEBEE'; // Light red
              break;
            default:
              statusColor = '#F5F5F5'; // Light grey
          }

          return `
            <div class="unit" style="background-color: ${statusColor};">
              <div class="unit-number">${unit.flat_no}</div>
              <div class="unit-status">${unit.status}</div>
              ${unit.client_name ? `<div class="unit-client">${unit.client_name}</div>` : ''}
            </div>
          `;
        }).join('');

        return `
          <div class="floor">
            <h3>Floor ${floor}</h3>
            <div class="units-grid">
              ${unitHtml}
            </div>
          </div>
        `;
      }).join('');
    };

    // Generate summary table
    const summaryTable = `
      <table class="summary-table">
        <tr>
          <th>Total Units</th>
          <th>Available</th>
          <th>Booked</th>
          <th>Sold</th>
        </tr>
        <tr>
          <td>${summary.total}</td>
          <td>${summary.available}</td>
          <td>${summary.booked}</td>
          <td>${summary.sold}</td>
        </tr>
      </table>
    `;

    // Return complete HTML
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Flats Availability Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .subtitle {
              font-size: 16px;
              color: #666;
              margin-bottom: 20px;
            }
            .summary-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .summary-table th, .summary-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: center;
            }
            .summary-table th {
              background-color: #f2f2f2;
            }
            .main-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .main-table th, .main-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .main-table th {
              background-color: #f2f2f2;
            }
            .main-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .units-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-bottom: 20px;
            }
            .unit {
              width: 120px;
              height: 80px;
              border: 1px solid #ddd;
              border-radius: 4px;
              padding: 10px;
              box-sizing: border-box;
            }
            .unit-number {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .unit-status {
              font-size: 14px;
              margin-bottom: 5px;
            }
            .unit-client {
              font-size: 12px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .floor {
              margin-bottom: 30px;
            }
            .floor h3 {
              margin-bottom: 10px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Flats Availability Report</div>
            <div class="subtitle">Project: ${projectName}</div>
          </div>

          ${summaryTable}

          <div class="building-visualization">
            ${generateBuildingHtml()}
          </div>

          <div class="footer">
            <p>This is a computer-generated document. Hence No signature is required.</p>
            <p>Generated on ${new Date(generatedAt).toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = units.length;
    const available = units.filter(unit => unit.status === 'Available').length;
    const booked = units.filter(unit => unit.status === 'Booked').length;
    const sold = units.filter(unit => unit.status === 'Sold').length;

    return { total, available, booked, sold };
  }, [units]);

  // Render a unit card
  const renderUnitCard = ({ item, index }: { item: UnitFlatWithDetails, index: number }) => {
    const project = projects.get(item.project_id);

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).duration(300)}
        style={styles.cardContainer}
      >
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
                  {item.flat_no}
                </Text>
                <Chip
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor:
                        item.status === 'Available' ? theme.colors.primaryContainer :
                        item.status === 'Booked' ? theme.colors.secondaryContainer :
                        theme.colors.tertiaryContainer
                    }
                  ]}
                  textStyle={{
                    color:
                      item.status === 'Available' ? theme.colors.onPrimaryContainer :
                      item.status === 'Booked' ? theme.colors.onSecondaryContainer :
                      theme.colors.onTertiaryContainer
                  }}
                >
                  {item.status}
                </Chip>
              </View>
            </View>

            <View style={styles.cardDetails}>
              <Text style={styles.projectName}>{project?.name || item.project_name || 'Unknown Project'}</Text>
              {item.client_name && (
                <Text style={styles.clientName}>Client: {item.client_name}</Text>
              )}
              {item.type && (
                <Text style={styles.unitType}>Type: {item.type}</Text>
              )}
              {item.area_sqft && (
                <Text style={styles.areaText}>Area: {item.area_sqft} sqft</Text>
              )}
              {item.flat_value && (
                <Text style={styles.valueText}>Value: {formatCurrency(item.flat_value)}</Text>
              )}
            </View>
          </Card.Content>
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Summary Cards removed as requested */}

        {/* Search and Filter */}
        <View style={styles.filterContainer}>
          <Searchbar
            placeholder="Search units/flats..."
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
            iconColor={theme.colors.primary}
          />

          <View style={styles.filterRow}>
            <SegmentedButtons
              value={statusFilter}
              onValueChange={onChangeStatusFilter}
              buttons={ALL_STATUS_OPTIONS.map(option => ({
                value: option.value,
                label: option.label,
              }))}
              style={styles.segmentedButtons}
            />

            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="filter-variant"
                  size={24}
                  onPress={() => setMenuVisible(true)}
                  style={styles.filterButton}
                />
              }
            >
              <Menu.Item
                onPress={() => onChangeProjectFilter(null)}
                title="All Projects"
                trailingIcon={selectedProjectId === null ? 'check' : undefined}
              />
              <Divider />
              {Array.from(projects.values()).map(project => (
                <Menu.Item
                  key={project.id}
                  onPress={() => onChangeProjectFilter(project.id!)}
                  title={project.name}
                  trailingIcon={selectedProjectId === project.id ? 'check' : undefined}
                />
              ))}
            </Menu>
          </View>

          {/* No view mode toggle as we only have building view */}
        </View>

        {/* Building Visualization */}
        <View style={styles.buildingVisualizationContainer}>
          {loading ? (
            <LoadingIndicator />
          ) : filteredUnits.length === 0 ? (
            <EmptyState
              icon="home-city"
              title="No Units/Flats"
              message={searchQuery || statusFilter !== 'all' || selectedProjectId !== null ?
                "No units/flats match your filters" :
                "No units/flats found in the system"}
            />
          ) : (
            <BuildingVisualization
              units={filteredUnits}
              project={selectedProjectId ? projects.get(selectedProjectId) : undefined}
              onUnitPress={handleUnitPress}
            />
          )}
        </View>

        {/* Add padding at the bottom to ensure content isn't hidden behind FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Export FAB */}
      <FAB
        icon="file-export"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => setExportDialogVisible(true)}
      />

      {/* Unit Details Dialog */}
      <Portal>
        <Dialog
          visible={unitDetailsVisible}
          onDismiss={() => setUnitDetailsVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Unit Details</Dialog.Title>
          <Dialog.Content>
            {selectedUnit && (
              <View>
                <View style={styles.dialogRow}>
                  <Text style={styles.dialogLabel}>Flat No:</Text>
                  <Text style={styles.dialogValue}>{selectedUnit.flat_no}</Text>
                </View>

                <View style={styles.dialogRow}>
                  <Text style={styles.dialogLabel}>Project:</Text>
                  <Text style={styles.dialogValue}>
                    {selectedUnit.project_name || 'Unknown Project'}
                  </Text>
                </View>

                <View style={styles.dialogRow}>
                  <Text style={styles.dialogLabel}>Status:</Text>
                  <Chip
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor:
                          selectedUnit.status === 'Available' ? theme.colors.primaryContainer :
                          selectedUnit.status === 'Booked' ? theme.colors.secondaryContainer :
                          theme.colors.tertiaryContainer
                      }
                    ]}
                    textStyle={{
                      color:
                        selectedUnit.status === 'Available' ? theme.colors.onPrimaryContainer :
                        selectedUnit.status === 'Booked' ? theme.colors.onSecondaryContainer :
                        theme.colors.onTertiaryContainer
                    }}
                  >
                    {selectedUnit.status}
                  </Chip>
                </View>

                {selectedUnit.client_name && (
                  <View style={styles.dialogRow}>
                    <Text style={styles.dialogLabel}>Client:</Text>
                    <Text style={styles.dialogValue}>{selectedUnit.client_name}</Text>
                  </View>
                )}

                {selectedUnit.type && (
                  <View style={styles.dialogRow}>
                    <Text style={styles.dialogLabel}>Type:</Text>
                    <Text style={styles.dialogValue}>{selectedUnit.type}</Text>
                  </View>
                )}

                {selectedUnit.area_sqft && (
                  <View style={styles.dialogRow}>
                    <Text style={styles.dialogLabel}>Area:</Text>
                    <Text style={styles.dialogValue}>{selectedUnit.area_sqft} sqft</Text>
                  </View>
                )}

                {selectedUnit.flat_value && (
                  <View style={styles.dialogRow}>
                    <Text style={styles.dialogLabel}>Value:</Text>
                    <Text style={styles.dialogValue}>{formatCurrency(selectedUnit.flat_value)}</Text>
                  </View>
                )}

                {selectedUnit.received_amount !== undefined && (
                  <View style={styles.dialogRow}>
                    <Text style={styles.dialogLabel}>Received:</Text>
                    <Text style={styles.dialogValue}>{formatCurrency(selectedUnit.received_amount)}</Text>
                  </View>
                )}

                {selectedUnit.balance_amount !== undefined && (
                  <View style={styles.dialogRow}>
                    <Text style={styles.dialogLabel}>Balance:</Text>
                    <Text style={styles.dialogValue}>{formatCurrency(selectedUnit.balance_amount)}</Text>
                  </View>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setUnitDetailsVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Export Dialog */}
      <Portal>
        <Dialog
          visible={exportDialogVisible}
          onDismiss={() => setExportDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Export Flats Availability Report</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Generate a PDF report of the flats availability. Choose your export options:
            </Text>

            <View style={styles.exportOptions}>
              <Button
                mode="contained"
                icon="file-pdf-box"
                loading={exportLoading}
                disabled={exportLoading}
                onPress={() => generateAndSharePDF(false)}
                style={styles.exportButton}
              >
                Export Standard PDF
              </Button>

              <Button
                mode="outlined"
                icon="file-document"
                loading={exportLoading}
                disabled={exportLoading}
                onPress={() => generateAndSharePDF(true)}
                style={styles.exportButton}
              >
                With Company Letterhead
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setExportDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  mainScrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  buildingVisualizationContainer: {
    minHeight: 400,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.sm,
    flexWrap: 'wrap',
  },
  summaryCard: {
    width: '23%',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  summaryTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  filterContainer: {
    padding: spacing.sm,
  },
  searchbar: {
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  segmentedButtons: {
    flex: 1,
  },
  viewModeButtons: {
    marginTop: spacing.sm,
  },
  filterButton: {
    marginLeft: spacing.xs,
  },
  cardContainer: {
    padding: spacing.sm,
    paddingTop: 0,
  },
  card: {
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  statusChip: {
    height: 24,
  },
  cardDetails: {
    marginTop: spacing.xs,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  clientName: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  unitType: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  areaText: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: spacing.xl * 2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    ...shadows.md,
  },
  // Building visualization styles
  buildingContainer: {
    padding: spacing.sm,
  },
  buildingContentContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...shadows.sm,
  },
  filtersContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  filterSection: {
    marginBottom: spacing.sm,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
    color: theme.colors.primary,
  },
  filterChipsContainer: {
    paddingVertical: spacing.xs,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  legendContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
    color: theme.colors.primary,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    marginBottom: spacing.xs,
  },
  legendText: {
    marginLeft: spacing.xs,
    fontSize: 12,
  },
  statusBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  floorSection: {
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  floorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  floorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onPrimaryContainer,
  },
  wingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wingSection: {
    width: '50%',
    padding: spacing.xs,
  },
  wingTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  unitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  unitContainer: {
    width: '50%',
    padding: spacing.xs,
  },
  unitCard: {
    borderRadius: borderRadius.md,
    borderWidth: 2,
    backgroundColor: theme.colors.surface,
    ...shadows.sm,
  },
  unitCardContent: {
    padding: spacing.sm,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  unitNumber: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  unitTypeText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  unitArea: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  unitClient: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  // Dialog styles
  dialog: {
    borderRadius: borderRadius.lg,
    backgroundColor: 'white',
  },
  dialogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dialogLabel: {
    fontWeight: '500',
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
  },
  dialogValue: {
    fontSize: 14,
  },
  dialogText: {
    marginBottom: spacing.md,
  },
  exportOptions: {
    marginTop: spacing.md,
  },
  exportButton: {
    marginBottom: spacing.sm,
  },
});

export default FlatsAvailabilityReportScreen;
