import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Location, useAuth, useLocations } from '@pulse-map/shared';

interface LocationDetailModalProps {
  location: Location;
  onClose: () => void;
}

export default function LocationDetailModal({ location, onClose }: LocationDetailModalProps) {
  const { user } = useAuth();
  const { likeLocation } = useLocations();

  const handleLike = async () => {
    try {
      await likeLocation(location.id);
    } catch (e) {
      console.error('Like failed', e);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.category}>{location.category}</Text>
              <Text style={styles.name}>{location.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {location.imageUrls && location.imageUrls.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.images}>
                {location.imageUrls.map((url, i) => (
                  <Image key={i} source={{ uri: url }} style={styles.image} />
                ))}
              </ScrollView>
            )}

            {location.description ? (
              <Text style={styles.description}>{location.description}</Text>
            ) : null}

            <View style={styles.meta}>
              <Text style={styles.metaText}>
                By {location.creator.firstName} {location.creator.lastName}
              </Text>
              {location.owner && (
                <Text style={styles.metaText}>
                  Owner: {location.owner.firstName} {location.owner.lastName}
                </Text>
              )}
            </View>

            <TouchableOpacity style={styles.likeBtn} onPress={handleLike}>
              <Text style={styles.likeBtnText}>
                {location.isLikedByCurrentUser ? '❤️' : '🤍'} {location.likesCount}
              </Text>
            </TouchableOpacity>

            {location.messages && location.messages.length > 0 && (
              <View style={styles.comments}>
                <Text style={styles.commentsTitle}>Comments</Text>
                {location.messages.map((msg) => (
                  <View key={msg.id} style={styles.comment}>
                    <Text style={styles.commentAuthor}>
                      {msg.sender.firstName} {msg.sender.lastName}
                    </Text>
                    <Text style={styles.commentText}>{msg.content}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerText: { flex: 1 },
  category: { color: '#FF6B35', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  name: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  closeBtnText: { color: '#8E8E8E', fontSize: 20 },
  images: { marginBottom: 12 },
  image: { width: 200, height: 130, borderRadius: 10, marginRight: 10 },
  description: { color: '#ccc', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  meta: { marginBottom: 16 },
  metaText: { color: '#8E8E8E', fontSize: 13, marginBottom: 2 },
  likeBtn: {
    backgroundColor: '#2D2D44',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  likeBtnText: { color: '#fff', fontSize: 16 },
  comments: {},
  commentsTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  comment: { backgroundColor: '#2D2D44', borderRadius: 10, padding: 12, marginBottom: 8 },
  commentAuthor: { color: '#FF6B35', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  commentText: { color: '#ccc', fontSize: 14 },
});
