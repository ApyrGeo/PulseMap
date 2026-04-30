import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Image,
  Alert,
  KeyboardAvoidingView,
  Modal,
  SafeAreaView,
} from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import MapView, { Marker } from 'react-native-maps';
import {
  useLocations,
  useAuth,
  fetchCategories,
  CategoryDTO,
  classifyLocation,
  uploadImages,
  ImageUploadInput,
  getApiUrl,
} from '@pulse-map/shared';
import { useDeviceLocation } from '../contexts/LocationContext';

interface ImageItem {
  uri: string;
  name: string;
  type: string;
  webFile?: unknown;
}

// Upload happens inside the WebView — Azure API is a real URL reachable from WebView (unlike localhost).
function buildGalleryPickerHTML(apiUrl: string, token: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0F0F1A;font-family:sans-serif;gap:16px;}
label{background:#FF6B35;color:#fff;padding:16px 36px;font-size:17px;border-radius:12px;cursor:pointer;display:inline-block;}
p{color:#8E8E8E;font-size:13px;}
#status{color:#FF6B35;font-size:13px;margin-top:8px;}
</style>
</head>
<body>
<input id="f" type="file" accept="image/*" multiple style="display:none">
<label for="f">Select from Gallery</label>
<p>Tap to open your gallery</p>
<div id="status"></div>
<script>
var API_URL='${apiUrl}';
var TOKEN='${token}';
document.getElementById('f').addEventListener('change',function(){
  var files=Array.from(this.files);
  if(!files.length){window.ReactNativeWebView.postMessage(JSON.stringify({cancelled:true}));return;}
  document.getElementById('status').textContent='Uploading '+files.length+' image(s)...';
  var formData=new FormData();
  files.forEach(function(file){formData.append('images',file);});
  fetch(API_URL+'/image/upload',{
    method:'POST',
    headers:{Authorization:'Bearer '+TOKEN},
    body:formData
  })
  .then(function(r){
    if(!r.ok)throw new Error('Upload failed: '+r.status);
    return r.json();
  })
  .then(function(filenames){
    var urls=filenames.map(function(f){return API_URL+'/image/'+f;});
    document.getElementById('status').textContent='Done!';
    window.ReactNativeWebView.postMessage(JSON.stringify({imageUrls:urls}));
  })
  .catch(function(err){
    document.getElementById('status').textContent='Error: '+err.message;
    window.ReactNativeWebView.postMessage(JSON.stringify({error:err.message}));
  });
});
</script>
</body>
</html>`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
}

export default function AddLocationModal({ visible, onClose, latitude, longitude }: Props) {
  const { addLocation } = useLocations();
  const { user, tokenService } = useAuth();
  const { userCoords } = useDeviceLocation();

  const descriptionRef = useRef<TextInput>(null);
  const [coords, setCoords] = useState({ latitude, longitude });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isClassifying, setIsClassifying] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [showManualSelect, setShowManualSelect] = useState(false);
  const [showVagueWarning, setShowVagueWarning] = useState(false);
  const [isOwned, setIsOwned] = useState(false);
  const [days, setDays] = useState(1);
  const [hours, setHours] = useState(0);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerHtml, setPickerHtml] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (userCoords) {
      setCoords({ latitude: userCoords.latitude, longitude: userCoords.longitude });
    } else {
      setCoords({ latitude, longitude });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    fetchCategories(tokenService)
      .then((cats) => {
        setCategories(cats);
        setCategory((cur) => cur || cats[0]?.name || '');
      })
      .catch(console.error);
  }, [visible, tokenService]);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setCategory('');
    setSuggestedCategories([]);
    setShowManualSelect(false);
    setShowVagueWarning(false);
    setIsOwned(false);
    setDays(1);
    setHours(0);
    setUploadedImageUrls([]);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleDescriptionBlur = useCallback(async () => {
    if (!description.trim()) return;
    setIsClassifying(true);
    setSuggestedCategories([]);
    setShowManualSelect(false);
    setShowVagueWarning(false);
    try {
      const suggested = await classifyLocation(tokenService, description);
      const valid = suggested.filter(
        (s) =>
          s &&
          s !== 'Uncategorized' &&
          categories.some((c) => c.name.toLowerCase() === s.toLowerCase())
      );
      if (valid.length > 0) {
        setSuggestedCategories(valid);
        setCategory(valid[0]);
      } else {
        setShowVagueWarning(true);
        setShowManualSelect(true);
      }
    } catch (e) {
      console.error('Classification error', e);
    } finally {
      setIsClassifying(false);
    }
  }, [description, categories, tokenService]);

  const handlePickImages = useCallback(async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files) return;
        const toUpload: ImageUploadInput[] = Array.from(files).map((f) => ({
          uri: URL.createObjectURL(f),
          name: f.name,
          type: f.type,
          webFile: f,
        }));
        const urls = await uploadImages(tokenService, toUpload);
        setUploadedImageUrls((prev) => [...prev, ...urls]);
      };
      input.click();
    } else {
      const headers = await tokenService.getAuthHeader();
      const token = (headers['Authorization'] ?? headers['authorization'] ?? '').replace('Bearer ', '');
      setPickerHtml(buildGalleryPickerHTML(getApiUrl(), token));
      setShowPicker(true);
    }
  }, [tokenService]);

  const handlePickerMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.cancelled) {
        setShowPicker(false);
        return;
      }

      if (data.error) {
        console.error('Image upload error from WebView:', data.error);
        Alert.alert('Upload failed', data.error);
        setShowPicker(false);
        return;
      }

      if (data.imageUrls && data.imageUrls.length > 0) {
        setUploadedImageUrls((prev) => [...prev, ...data.imageUrls]);
        setShowPicker(false);
      }
    } catch (e) {
      console.error('Picker message error:', e);
      setShowPicker(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a location name');
      return;
    }
    if (!user) return;
    const totalHours = days * 24 + hours;
    if (isOwned && totalHours === 0) {
      Alert.alert('Error', 'Please set a duration for your owned location');
      return;
    }
    setLoading(true);
    try {
      await addLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        name: name.trim(),
        description: description.trim() || undefined,
        creatorId: user.id,
        category: category || categories[0]?.name || 'Not Set',
        duration: `${days}.${hours}:00:00`,
        ownerId: isOwned ? user.id : undefined,
        imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
      });
      Alert.alert('Succes', 'Locația a fost adăugată!');
      handleClose();
    } catch {
      Alert.alert('Eroare', 'Eroare la adăugarea locației');
    } finally {
      setLoading(false);
    }
  }, [
    name, user, days, hours, isOwned, uploadedImageUrls, coords,
    description, category, categories, addLocation, handleClose,
  ]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

      <Modal visible={showPicker} animationType="slide" transparent={false} onRequestClose={() => setShowPicker(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F1A' }}>
          <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.pickerCancelBtn}>
            <Text style={styles.pickerCancelText}>Cancel</Text>
          </TouchableOpacity>
          <WebView
            source={{ html: pickerHtml, baseUrl: 'http://localhost:4200' }}
            onMessage={handlePickerMessage}
            javaScriptEnabled
            style={{ flex: 1, backgroundColor: '#0F0F1A' }}
          />
        </SafeAreaView>
      </Modal>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Add Location</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {!userCoords && (
            <View style={styles.gpsBanner}>
              <Text style={styles.gpsBannerText}>📍 Activați GPS-ul pentru a plasa corect locația</Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Mini map — tap to adjust pin. key forces re-render on each open */}
            <View style={styles.miniMapWrap}>
              <MapView
                key={`minimap-${visible}`}
                style={styles.miniMap}
                initialRegion={{
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  latitudeDelta: 0.001,
                  longitudeDelta: 0.001,
                }}
                showsUserLocation
                showsMyLocationButton={false}
                onPress={(e) => setCoords(e.nativeEvent.coordinate)}
              >
                <Marker coordinate={coords} />
              </MapView>
              <Text style={styles.miniMapHint}>Tap map to adjust pin position</Text>
              <Text style={styles.coordsText}>
                {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
              </Text>
            </View>

            {/* Owned location toggle */}
            <TouchableOpacity style={styles.ownedRow} onPress={() => setIsOwned(!isOwned)}>
              <View style={[styles.checkbox, isOwned && styles.checkboxActive]}>
                {isOwned && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.ownedLabel}>Owned Location (My Business/Place)</Text>
            </TouchableOpacity>

            {/* Name */}
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter location name"
              placeholderTextColor="#6B6B8A"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              onSubmitEditing={() => descriptionRef.current?.focus()}
              blurOnSubmit={false}
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              ref={descriptionRef}
              style={[styles.input, styles.textArea]}
              placeholder="Descriere opțională (declanșează sugestie categorie AI)"
              placeholderTextColor="#6B6B8A"
              value={description}
              onChangeText={(t) => {
                setDescription(t);
                setSuggestedCategories([]);
                setShowManualSelect(false);
                setShowVagueWarning(false);
              }}
              onBlur={handleDescriptionBlur}
              onSubmitEditing={handleDescriptionBlur}
              multiline
              numberOfLines={3}
              blurOnSubmit={false}
            />

            {/* Category */}
            <Text style={styles.label}>Category *</Text>
            {isClassifying && (
              <Text style={styles.hint}>Se generează potrivirea cea mai bună pentru descriere...</Text>
            )}
            {!isClassifying && suggestedCategories.length > 0 && !showManualSelect && (
              <View>
                <Text style={styles.hint}>Tag-uri sugerate:</Text>
                <View style={styles.chipRow}>
                  {suggestedCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, category === cat && styles.chipActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={() => setShowManualSelect(true)}>
                  <Text style={styles.manualLink}>Selectare manuală</Text>
                </TouchableOpacity>
              </View>
            )}
            {!isClassifying && (showManualSelect || suggestedCategories.length === 0) && (
              <View>
                {showVagueWarning && (
                  <Text style={styles.warning}>
                    Descrierea este prea vagă. Încearcă să adaugi mai multe detalii sau selectează manual.
                  </Text>
                )}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.chip, category === cat.name && styles.chipActive]}
                        onPress={() => setCategory(cat.name)}
                      >
                        <Text style={[styles.chipText, category === cat.name && styles.chipTextActive]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Images */}
            <Text style={styles.label}>Images (optional)</Text>
            <TouchableOpacity style={styles.imagePickBtn} onPress={handlePickImages}>
              <Text style={styles.imagePickBtnText}>📷  Add Photos</Text>
            </TouchableOpacity>
            {uploadedImageUrls.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imagePreviewRow}
              >
                {uploadedImageUrls.map((url, i) => (
                  <View key={i} style={styles.imagePreview}>
                    <Image source={{ uri: url }} style={styles.previewImg} />
                    <TouchableOpacity
                      style={styles.removeImgBtn}
                      onPress={() => setUploadedImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Text style={styles.removeImgText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Duration — only for owned */}
            {isOwned && (
              <View style={styles.durationSection}>
                <Text style={styles.label}>Duration *</Text>
                <View style={styles.durationRow}>
                  <View style={styles.durationCol}>
                    <Text style={styles.durationLabel}>Days</Text>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setDays((d) => Math.max(0, d - 1))}
                      >
                        <Text style={styles.stepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{days}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setDays((d) => Math.min(29, d + 1))}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.durationCol}>
                    <Text style={styles.durationLabel}>Hours</Text>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setHours((h) => Math.max(0, h - 1))}
                      >
                        <Text style={styles.stepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{hours}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => setHours((h) => Math.min(23, h + 1))}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <Text style={styles.hint}>
                  Total:{' '}
                  {days > 0 && hours > 0
                    ? `${days}d ${hours}h`
                    : days > 0
                    ? `${days} day${days !== 1 ? 's' : ''}`
                    : hours > 0
                    ? `${hours} hour${hours !== 1 ? 's' : ''}`
                    : 'No duration set'}
                </Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {uploadedImageUrls.length > 0 ? 'Add Location with Photos' : 'Add Location'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    maxHeight: '92%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2D2D44',
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeBtn: { color: '#8E8E8E', fontSize: 20 },

  gpsBanner: {
    backgroundColor: '#2D1F0A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F59E0B44',
  },
  gpsBannerText: { color: '#F59E0B', fontSize: 13, textAlign: 'center' },

  miniMapWrap: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  miniMap: { height: 180, width: '100%' },
  miniMapHint: {
    color: '#8E8E8E',
    fontSize: 11,
    textAlign: 'center',
    paddingTop: 6,
    paddingHorizontal: 12,
    backgroundColor: '#0F0F1A',
  },
  coordsText: {
    color: '#FF6B35',
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0F0F1A',
  },

  ownedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    backgroundColor: '#0F0F1A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#8E8E8E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { borderColor: '#FF6B35', backgroundColor: '#FF6B35' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  ownedLabel: { color: '#fff', fontSize: 14 },

  label: { color: '#8E8E8E', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#0F0F1A',
    borderWidth: 1,
    borderColor: '#2D2D44',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },

  hint: { color: '#8E8E8E', fontSize: 12, marginBottom: 8 },
  warning: { color: '#EF4444', fontSize: 12, marginBottom: 8 },
  manualLink: {
    color: '#FF6B35',
    fontSize: 13,
    textDecorationLine: 'underline',
    marginTop: 6,
    marginBottom: 4,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    backgroundColor: '#0F0F1A',
    borderWidth: 1,
    borderColor: '#2D2D44',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  chipText: { color: '#8E8E8E', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  imagePickBtn: {
    backgroundColor: '#0F0F1A',
    borderWidth: 1,
    borderColor: '#2D2D44',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  imagePickBtnText: { color: '#FF6B35', fontSize: 15 },
  imagePreviewRow: { marginBottom: 8 },
  imagePreview: { position: 'relative', marginRight: 8 },
  previewImg: { width: 80, height: 80, borderRadius: 8 },
  removeImgBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImgText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  durationSection: { marginTop: 4 },
  durationRow: { flexDirection: 'row', gap: 20, marginBottom: 8 },
  durationCol: { flex: 1, alignItems: 'center' },
  durationLabel: { color: '#8E8E8E', fontSize: 12, marginBottom: 8 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2D2D44',
    overflow: 'hidden',
  },
  stepBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D2D44',
  },
  stepBtnText: { color: '#FF6B35', fontSize: 22, fontWeight: '300' },
  stepValue: { color: '#fff', fontSize: 18, fontWeight: '600', minWidth: 36, textAlign: 'center' },

  submitBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnDisabled: { backgroundColor: '#2D2D44' },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  pickerCancelBtn: { padding: 16 },
  pickerCancelText: { color: '#FF6B35', fontSize: 16 },
});
