import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { AddressSuggestion, getCurrentAddress, searchAddresses } from "../app/service/location";

type AddressPickerModalProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  allowCurrentLocation?: boolean;
  initialQuery?: string;
  onClose: () => void;
  onSelect: (address: AddressSuggestion) => void;
};

export default function AddressPickerModal({
  visible,
  title,
  subtitle,
  allowCurrentLocation = false,
  initialQuery = "",
  onClose,
  onSelect,
}: AddressPickerModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setQuery(initialQuery);
    }
  }, [visible, initialQuery]);

  useEffect(() => {
    let isMounted = true;

    const loadSuggestions = async () => {
      if (!visible) return;

      const trimmed = query.trim();
      if (trimmed.length < 3) {
        setResults([]);
        setSearchError(null);
        return;
      }

      try {
        setLoading(true);
        setSearchError(null);
        const suggestions = await searchAddresses(trimmed, 8);
        if (isMounted) {
          setResults(suggestions);
        }
      } catch (error) {
        if (isMounted) {
          setResults([]);
          const message = error instanceof Error ? error.message : "Unable to fetch address suggestions.";
          setSearchError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(loadSuggestions, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, visible]);

  const helperText = useMemo(() => {
    if (allowCurrentLocation) {
      return "Use your current location or search and select an address.";
    }

    return "Search and select an address from the suggestions.";
  }, [allowCurrentLocation]);

  const emptyStateText = useMemo(() => {
    if (searchError) {
      return searchError;
    }

    if (query.trim().length < 3) {
      return "Type at least 3 characters to search addresses.";
    }

    return "No matching addresses found. Try a nearby landmark or city.";
  }, [query, searchError]);

  const handleUseCurrentLocation = async () => {
    try {
      setCurrentLocationLoading(true);
      const currentAddress = await getCurrentAddress();
      if (currentAddress) {
        onSelect(currentAddress);
        onClose();
      }
    } catch {
      // handled below with a basic alert-like fallback
      setResults([]);
      setSearchError("Unable to use current location right now.");
    } finally {
      setCurrentLocationLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle || helperText}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#2E3A59" />
            </TouchableOpacity>
          </View>

          {allowCurrentLocation && (
            <TouchableOpacity style={styles.currentLocationButton} onPress={handleUseCurrentLocation}>
              {currentLocationLoading ? (
                <ActivityIndicator size="small" color="#005EFF" />
              ) : (
                <>
                  <Ionicons name="locate" size={18} color="#005EFF" />
                  <Text style={styles.currentLocationText}>Use Current Location</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#8E99B3" />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search an address or landmark"
              placeholderTextColor="#8E99B3"
              autoFocus={visible}
            />
          </View>

          <ScrollView style={styles.resultsList} keyboardShouldPersistTaps="handled">
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#005EFF" />
              </View>
            ) : results.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>{emptyStateText}</Text>
              </View>
            ) : (
              results.map((item) => (
                <TouchableOpacity
                  key={item.placeId}
                  style={styles.resultItem}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <View style={styles.resultIcon}>
                    <Ionicons name="location" size={16} color="#005EFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultTitle} numberOfLines={2}>
                      {item.displayName}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "flex-end",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    maxHeight: "80%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2E3A59",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#8E99B3",
    lineHeight: 18,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F7F9FC",
    alignItems: "center",
    justifyContent: "center",
  },
  currentLocationButton: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#005EFF",
    backgroundColor: "#EEF4FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  currentLocationText: {
    color: "#005EFF",
    fontSize: 14,
    fontWeight: "800",
  },
  searchBox: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: "#2E3A59",
  },
  resultsList: {
    maxHeight: 360,
  },
  loadingBox: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#8E99B3",
    fontSize: 13,
    textAlign: "center",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: {
    color: "#2E3A59",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
});
