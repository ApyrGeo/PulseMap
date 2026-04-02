import React, { useState, useEffect, useCallback } from 'react';
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
import {
  useLocations,
  useAuth,
  fetchCategories,
  CategoryDTO,
  Location,
  getApiUrl,
} from '@pulse-map/shared';

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
  location: Location;
  onClose: () => void;
}

export default function EditLocationModal({ visible, location, onClose }: Props) {
  const { updateLocationById } = useLocations();
  const { tokenService } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerHtml, setPickerHtml] = useState('');

  // Sync fields when location changes
  useEffect(() => {
    if (!visible) return;
    setName(location.name);
    setDescription(location.description ?? '');
    setCategory(location.category);
    setImageUrls(location.imageUrls ?? []);
  }, [visible, location]);

  useEffect(() => {
    if (!visible) return;
    fetchCategories(tokenService)
      .then((cats) => {
        setCategories(cats);
      })
      .catch(console.error);
  }, [visible, tokenService]);

  const handlePickImages = useCallback(async () => {
    if (Platform.OS === 'web') return;
    const headers = await tokenService.getAuthHeader();
    const token = (headers['Authorization'] ?? headers['authorization'] ?? '').replace('Bearer ', '');
    setPickerHtml(buildGalleryPickerHTML(getApiUrl(), token));
    setShowPicker(true);
  }, [tokenService]);

  const handlePickerMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.cancelled) { setShowPicker(false); return; }
      if (data.error) {
        Alert.alert('Upload failed', data.error);
        setShowPicker(false);
        return;
      }
      if (data.imageUrls?.length > 0) {
        setImageUrls((prev) => [...prev, ...data.imageUrls]);
        setShowPicker(false);
      }
    } catch {
      setShowPicker(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a location name');
      return;
    }
    setLoading(true);
    try {
      await updateLocationById(location.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        imageUrls,
      });
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update location');
    } finally {
      setLoading(false);
    }
  }, [name, description, category, imageUrls, location.id, updateLocationById, onClose]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

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
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Edit Location</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Name */}
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Location name"
              placeholderTextColor="#6B6B8A"
              value={name}
              onChangeText={setName}
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Optional description"
              placeholderTextColor="#6B6B8A"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {/* Category */}
            <Text style={styles.label}>Category *</Text>
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

            {/* Images */}
            <Text style={styles.label}>Images</Text>
            <TouchableOpacity style={styles.imagePickBtn} onPress={handlePickImages}>
              <Text style={styles.imagePickBtnText}>📷  Add Photos</Text>
            </TouchableOpacity>
            {imageUrls.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewRow}>
                {imageUrls.map((url, i) => (
                  <View key={i} style={styles.imagePreview}>
                    <Image source={{ uri: url }} style={styles.previewImg} />
                    <TouchableOpacity
                      style={styles.removeImgBtn}
                      onPress={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Text style={styles.removeImgText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
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
                <Text style={styles.submitText}>Save Changes</Text>
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
  keyboardView: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    maxHeight: '85%',
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
