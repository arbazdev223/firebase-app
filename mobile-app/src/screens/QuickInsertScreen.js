import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import {
  STUDENT_RESPONSES,
  SOURCE_OPTIONS,
  COURSE_OPTIONS,
  LEAD_STATUS_OPTIONS,
} from '../constants/studentResponses';
import { io } from 'socket.io-client'; // use destructured import for v4.5.4
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Image } from 'react-native';
import { Video } from 'expo-av';
import { Modal as RNModal } from 'react-native'; // Alias to avoid clash

const PAGE_SIZE = 20;
const IS_FABRIC = Boolean(global?.nativeFabricUIManager);
const SOCKET_URL = 'https://test.ifda.in'; // Change to your backend socket URL

export default function QuickInsertScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [composerHeight, setComposerHeight] = useState(60);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(true);
  const highlightTimer = useRef(null);
  const flatListRef = useRef(null);
  const prevMessageCountRef = useRef(0);
  const initialScrollDoneRef = useRef(false);
  const pendingScrollAdjustRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const contentHeightRef = useRef(0);
  const listHeightRef = useRef(0);
  const [user, setUser] = useState(null);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showResponsePicker, setShowResponsePicker] = useState(false);
  const [showLeadStatusPicker, setShowLeadStatusPicker] = useState(false);
  const [formData, setFormData] = useState({
    source: '',
    studentMobile: '',
    alternateMobile: '',
    studentName: '',
    location: '',
    courses: [],
    totalFees: '',
    response: '',
    remarks: '',
    leadStatus: '',
  });
  const [courseSearch, setCourseSearch] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showEnquiryOnly, setShowEnquiryOnly] = useState(false);
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [sendDisabled, setSendDisabled] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [audioRecording, setAudioRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [preview, setPreview] = useState({ visible: false, type: null, uri: null });
  const filteredCourses = useMemo(() => {
    const query = courseSearch.trim().toLowerCase();
    if (!query) return COURSE_OPTIONS;
    return COURSE_OPTIONS.filter((course) => course.toLowerCase().includes(query));
  }, [courseSearch]);

  const insets = useSafeAreaInsets();
  const bottomInset = useMemo(() => Math.max(insets.bottom, 4), [insets.bottom]);
  const listBottomPadding = useMemo(
    () => composerHeight + (isKeyboardVisible ? keyboardHeight : 0) + 2,
    [composerHeight, isKeyboardVisible, keyboardHeight]
  );
  const scrollOffset = useMemo(
    () => composerHeight + (isKeyboardVisible ? keyboardHeight : 0),
    [composerHeight, isKeyboardVisible, keyboardHeight]
  );

  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      UIManager?.setLayoutAnimationEnabledExperimental &&
      !IS_FABRIC
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (!loadingOlder) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [messages.length, loadingOlder]);

  // Filtered and searched messages
  const filteredMessages = useMemo(() => {
    let filtered = messages;
    if (showEnquiryOnly) {
      filtered = filtered.filter((msg) => {
        // Check if message itself is an enquiry
        const isEnquiry = msg.text?.toLowerCase().includes('source:') || 
                         msg.text?.toLowerCase().includes('mobile:');
        
        // Check if message is a reply to an enquiry
        const isReplyToEnquiry = msg.replyTo && (
          msg.replyTo.text?.toLowerCase().includes('source:') ||
          msg.replyTo.text?.toLowerCase().includes('mobile:')
        );
        
        return isEnquiry || isReplyToEnquiry;
      });
    }
    if (showMineOnly && user?._id) {
      filtered = filtered.filter(
        (msg) => msg.sender === 'user'
      );
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      filtered = filtered.filter(
        (msg) =>
          (msg.text && msg.text.toLowerCase().includes(q)) ||
          (msg.authorName && msg.authorName.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [messages, showEnquiryOnly, showMineOnly, searchText, user?._id]);

  const messagesWithSeparators = useMemo(() => {
    if (!filteredMessages.length) return [];
    const sections = [];
    let lastLabel = '';
    filteredMessages.forEach((msg) => {
      const date = msg.createdAt ? new Date(msg.createdAt) : null;
      const label = date
        ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(date)
        : '';
      if (label && label !== lastLabel) {
        sections.push({ id: `separator-${label}`, type: 'separator', label });
        lastLabel = label;
      }
      sections.push({ ...msg, type: 'message' });
    });
    return sections;
  }, [filteredMessages]);

  const dedupeMessages = useCallback((records) => {
    const map = new Map();
    const getTimestamp = (value) => (value ? new Date(value).getTime() : 0);
    records.forEach((item) => {
      if (!item) return;
      const key = item.id ? String(item.id) : `${getTimestamp(item.createdAt)}-${Math.random()}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { ...item, id: key });
        return;
      }
      const existingTime = getTimestamp(existing.createdAt);
      const incomingTime = getTimestamp(item.createdAt);
      map.set(key, incomingTime >= existingTime ? { ...existing, ...item, id: key } : existing);
    });
    return Array.from(map.values()).sort(
      (a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt)
    );
  }, []);

  const fetchOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasOlderMessages || !messages.length) return;
    setLoadingOlder(true);
    const oldest = messages[0];
    let queuedAdjust = false;
    try {
      const prevContentHeight = contentHeightRef.current;
      const prevScrollOffset = scrollOffsetRef.current;
      const olderEntries = await api.fetchQuickInsertFeed({
        before: oldest.createdAt,
        limit: PAGE_SIZE,
      });
      // Reverse to chronological order (oldest first)
      const orderedEntries = olderEntries.slice().reverse();
      if (!orderedEntries?.length) {
        setHasOlderMessages(false);
        return;
      }
      const normalizedOlder = orderedEntries.map((entry) => buildMessage(entry, user));
      const prevIds = new Set(messages.map((msg) => msg.id));
      const uniqueOlder = normalizedOlder.filter((item) => !prevIds.has(item.id));
      if (uniqueOlder.length) {
        // Save scroll position before adding new messages
        setMessages((prev) => dedupeMessages([...uniqueOlder, ...prev]));
        // Wait for next render to adjust scroll position
        setTimeout(() => {
          if (flatListRef.current && prevContentHeight) {
            const newContentHeight = contentHeightRef.current;
            const heightDiff = newContentHeight - prevContentHeight;
            if (heightDiff > 0) {
              flatListRef.current.scrollToOffset({
                offset: prevScrollOffset + heightDiff,
                animated: false,
              });
            }
          }
        }, 0);
        queuedAdjust = true;
      }
      const canLoadMore = orderedEntries.length === PAGE_SIZE && uniqueOlder.length > 0;
      setHasOlderMessages(canLoadMore);
    } catch (error) {
      console.error('Failed to load older quick notes', error);
    } finally {
      if (!queuedAdjust) {
        pendingScrollAdjustRef.current = null;
      }
      setLoadingOlder(false);
    }
  }, [dedupeMessages, hasOlderMessages, loadingOlder, messages, user]);

  const handleScroll = useCallback(
    ({ nativeEvent }) => {
      const offsetY = nativeEvent?.contentOffset?.y ?? 0;
      scrollOffsetRef.current = offsetY;
      if (offsetY <= 40 && hasOlderMessages && !loadingOlder) {
        fetchOlderMessages();
      }
    },
    [fetchOlderMessages, hasOlderMessages, loadingOlder]
  );

  const adjustAfterContentChange = useCallback(
    (newHeight) => {
      const pending = pendingScrollAdjustRef.current;
      if (!pending) return;
      const { previousHeight = 0, previousOffset = 0 } = pending;
      const heightDiff = newHeight - previousHeight;
      if (heightDiff > 0) {
        flatListRef.current?.scrollToOffset({
          offset: Math.max(previousOffset + heightDiff, 0),
          animated: false,
        });
      }
      pendingScrollAdjustRef.current = null;
    },
    []
  );

  const scrollToBottom = useCallback(
    (animated = true) => {
      if (!flatListRef.current || !messagesWithSeparators.length) return;
      requestAnimationFrame(() => {
        try {
          flatListRef.current.scrollToIndex({
            index: messagesWithSeparators.length - 1,
            animated,
            viewPosition: 1,
            viewOffset: scrollOffset,
          });
        } catch {
          flatListRef.current.scrollToEnd({ animated });
        }
      });
    },
    [messagesWithSeparators.length, scrollOffset]
  );

  useFocusEffect(
    useCallback(() => {
      if (!messages.length) return;
      const timer = setTimeout(() => scrollToBottom(false), 120);
      return () => clearTimeout(timer);
    }, [messages.length, scrollToBottom])
  );

  useEffect(() => {
    if (!messagesWithSeparators.length) return;
    const timer = setTimeout(() => scrollToBottom(true), 80);
    return () => clearTimeout(timer);
  }, [scrollOffset, messagesWithSeparators.length, scrollToBottom]);

  const buildMessage = (entry, currentUser = user) => {
    const counsellorId = entry.counsellorId || entry.userId;
    const sameCounsellor = currentUser && counsellorId === currentUser._id;
    const replySource = entry.replyTo;
    const resolvedId = entry._id || entry.id;
    const messageId = resolvedId ? String(resolvedId) : `${Date.now()}-${Math.random()}`;
    // Use backend's edited flag if present, else fallback to updatedAt logic
    const isEdited = !!entry.edited;
    let updatedAt = undefined;
    if (isEdited) {
      updatedAt = entry.updatedAt;
    }

    // --- FIX: Use metadata for media/audio ---
    let mediaUrl = entry.mediaUrl || (entry.metadata && entry.metadata.mediaUrl) || null;
    let mediaType = entry.mediaType;
    let audioUrl = entry.audioUrl || null;

    // Detect type from mimeType if not present
    if (entry.metadata && entry.metadata.mimeType) {
      if (entry.metadata.mimeType.startsWith('image/')) {
        mediaType = 'image';
      } else if (entry.metadata.mimeType.startsWith('video/')) {
        mediaType = 'video';
      } else if (entry.metadata.mimeType.startsWith('audio/')) {
        audioUrl = entry.metadata.mediaUrl;
      }
    }

    // If entryType is audio, set audioUrl
    if (entry.entryType === 'audio' && entry.metadata && entry.metadata.mediaUrl) {
      audioUrl = entry.metadata.mediaUrl;
      mediaUrl = null;
      mediaType = null;
    }

    // If entryType is image, set mediaType/image
    if (entry.entryType === 'image' && entry.metadata && entry.metadata.mediaUrl) {
      mediaUrl = entry.metadata.mediaUrl;
      mediaType = 'image';
      audioUrl = null;
    }

    return {
      id: messageId,
      sender: sameCounsellor ? 'user' : 'system',
      text: entry.summary || entry.message || entry.text || '',
      authorName:
        entry.authorName ||
        entry.counsellorName ||
        (sameCounsellor ? currentUser?.name : entry.actorRole || 'Admin'),
      replyTo: replySource
        ? {
            id: String(replySource._id || replySource.id || `reply-${messageId}`),
            text: replySource.summary || replySource.message || '',
            authorName: replySource.counsellorName || 'Message',
          }
        : null,
      createdAt: entry.createdAt,
      updatedAt, // only set if actually edited
      seen: entry.seen || false,
      seenBy: entry.seenBy || [],
      edited: isEdited, // keep for UI logic
      mediaUrl,
      mediaType,
      audioUrl,
    };
  };

  const formatTimestamp = (value) =>
    value
      ? new Date(value).toLocaleString('en-GB', {
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '';

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        const parsed = stored ? JSON.parse(stored) : null;
        setUser(parsed);
        const feed = await api.fetchQuickInsertFeed();
        // Reverse to chronological order (oldest first)
        const orderedFeed = feed.slice().reverse();
        const initialMessages = dedupeMessages(orderedFeed.map((entry) => buildMessage(entry, parsed)));
        setMessages(initialMessages);
        setHasOlderMessages(feed?.length === PAGE_SIZE);
        // Scroll to bottom after messages are set
        setTimeout(() => {
          if (flatListRef.current && initialMessages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }, 100);
      } catch (error) {
        console.error('Failed to load quick insert feed', error);
      } finally {
        setLoadingFeed(false);
      }
    };
    init();

    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      const height = event.endCoordinates?.height ?? 0;
      console.log('Keyboard Height:', height);
      setIsKeyboardVisible(true);
      setKeyboardHeight(height);
      scrollToBottom(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    // --- SOCKET.IO SETUP ---
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      path: '/socket.io',
    });

    socket.on('connect', () => {
      if (user?._id) {
        socket.emit('join', { userId: user._id });
      }
    });

    socket.on('quick-insert:new', (entry) => {
      setMessages((prev) => dedupeMessages([...prev, buildMessage(entry, user)]));
    });

    socket.on('quick-insert:edit', (entry) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === String(entry._id || entry.id) ? buildMessage(entry, user) : m
        )
      );
    });

    socket.on('quick-insert:delete', (id) => {
      setMessages((prev) => prev.filter((m) => m.id !== String(id)));
    });

    socket.on('quick-insert:seen', ({ id, userId, userName }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === String(id)
            ? {
                ...m,
                seenBy: m.seenBy && !m.seenBy.some(u => String(u._id) === String(userId))
                  ? [...m.seenBy, { _id: userId, name: userName }]
                  : m.seenBy,
              }
            : m
        )
      );
    });

    return () => {
      if (highlightTimer.current) {
        clearTimeout(highlightTimer.current);
      }
      showSub.remove();
      hideSub.remove();
      socket.disconnect();
    };
  }, [dedupeMessages, user?._id]);

  useEffect(() => {
    if (!messages.length || !user?._id) return;

    // Mark all visible messages as seen if not already
    messages.forEach((msg) => {
      if (
        msg.id &&
        Array.isArray(msg.seenBy) &&
        !msg.seenBy.some(u => String(u._id) === String(user._id))
      ) {
        markQuickInsertSeen(msg.id, user._id, user.name)
          .then(updated => {
            setMessages(prev =>
              prev.map(m =>
                m.id === msg.id ? { ...m, seenBy: updated.seenBy || [] } : m
              )
            );
          })
          .catch(() => {});
      }
    });
  }, [messages, user?._id]);

  useEffect(() => {
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];
    const isInitial = !initialScrollDoneRef.current;
    const hasNewMessage = prevMessageCountRef.current !== messages.length;
    const addedByUser = lastMessage?.sender === 'user';

    if (isInitial || (hasNewMessage && addedByUser)) {
      scrollToBottom(!isInitial);
      initialScrollDoneRef.current = true;
    }

    prevMessageCountRef.current = messages.length;
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (!user?._id) {
      Alert.alert('Error', 'User info missing. Please login again.');
      return;
    }
    setSendDisabled(true);
    try {
      const saved = await api.createQuickInsertNote({
        counsellorId: user._id,
        message: trimmed,
        replyTo: replyTarget?.id || null,
      });
      const normalized = [saved].flat().filter(Boolean).map((entry) => buildMessage(entry, user));
      setMessages((prev) => dedupeMessages([...prev, ...normalized]));
      setDraft('');
      setReplyTarget(null);
      setTimeout(() => scrollToBottom(true), 60);
    } catch (error) {
      console.error('Failed to save quick note', error);
      Alert.alert('Error', error.message || 'Unable to save note.');
    } finally {
      setSendDisabled(false);
    }
  };

  const toggleCourse = (course) => {
    setFormData((prev) => {
      const exists = prev.courses.includes(course);
      return {
        ...prev,
        courses: exists
          ? prev.courses.filter((item) => item !== course)
          : [...prev.courses, course],
      };
    });
  };

  const handleFormSubmit = async () => {
    const requiredFields = ['source', 'studentMobile', 'studentName'];
    const missing = requiredFields.filter((field) => !formData[field]?.trim());
    if (missing.length) {
      Alert.alert('Missing Info', 'Please complete all required fields.');
      return;
    }
    if (!user?._id) {
      Alert.alert('Error', 'User info missing. Please login again.');
      return;
    }

    try {
      const enquiryData = {
        source: formData.source,
        studentMobile: formData.studentMobile,
        studentName: formData.studentName,
        location: formData.location,
        courses: formData.courses,
        totalFees: formData.totalFees,
        response: formData.response,
        remarks: formData.remarks,
        leadStatus: formData.leadStatus,
      };
      
      // Only add alternateMobile if it has a value
      if (formData.alternateMobile && formData.alternateMobile.trim()) {
        enquiryData.alternateMobile = formData.alternateMobile;
      }
      
      const payload = {
        counsellorId: user._id,
        enquiry: enquiryData,
        replyTo: replyTarget?.id || null,
      };
      console.log('Sending enquiry payload:', JSON.stringify(payload, null, 2));
      const saved = await api.createQuickInsertEnquiry(payload);
      const normalized = [saved].flat().filter(Boolean).map((entry) => buildMessage(entry, user));
      setMessages((prev) => dedupeMessages([...prev, ...normalized]));
      setFormData({
        source: '',
        studentMobile: '',
        alternateMobile: '',
        studentName: '',
        location: '',
        courses: [],
        totalFees: '',
        response: '',
        remarks: '',
        leadStatus: '',
      });
      setCourseSearch('');
      setShowSourcePicker(false);
      setShowResponsePicker(false);
      setShowLeadStatusPicker(false);
      setReplyTarget(null);
      setFormVisible(false);
      setTimeout(() => scrollToBottom(true), 60);
    } catch (error) {
      console.error('Failed to save quick enquiry', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      const errorMsg = error.response?.data?.message || error.message || 'Unable to save enquiry.';
      Alert.alert('Error', errorMsg);
    }
  };

  const handleJumpToMessage = (targetId) => {
    if (!targetId) return;
    const index = messages.findIndex((msg) => msg.id === targetId);
    if (index === -1) return;

    try {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    } catch (error) {
      flatListRef.current?.scrollToEnd({ animated: true });
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      }, 80);
    }

    setHighlightedId(targetId);
    if (highlightTimer.current) {
      clearTimeout(highlightTimer.current);
    }
    highlightTimer.current = setTimeout(() => setHighlightedId(null), 1600);
  };

  // Add state for editing and deleting messages
  const [editTarget, setEditTarget] = useState(null);
  // Add state for info modal
  const [infoTarget, setInfoTarget] = useState(null);

  // Handler for editing a message
  const handleEditMessage = async (msg) => {
    setEditTarget(msg);
    setDraft(msg.text);
    setReplyTarget(null);
  };

  // Handler for saving edited message
  const handleSaveEdit = async () => {
    if (!editTarget || !draft.trim()) return;
    setSendDisabled(true);
    try {
      const updated = await api.updateQuickInsertNote({
        id: editTarget.id,
        message: draft.trim(),
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editTarget.id
            ? buildMessage(updated, user)
            : m
        )
      );
      setEditTarget(null);
      setDraft('');
    } catch (error) {
      Alert.alert('Error', error.message || 'Unable to edit message.');
    } finally {
      setSendDisabled(false);
    }
  };

  // Handler for deleting a message
  const handleDeleteMessage = async (msg) => {
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteQuickInsertNote({ id: msg.id });
            setMessages((prev) => prev.filter((m) => m.id !== msg.id));
          } catch (error) {
            Alert.alert('Error', error.message || 'Unable to delete message.');
          }
        },
      },
    ]);
  };

    const handleStartRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow microphone access.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await recording.startAsync();
      setAudioRecording(recording);
    } catch (err) {
      Alert.alert('Error', 'Could not start recording.');
    }
  };

  // Stop audio recording and upload
  const handleStopRecording = async () => {
    try {
      if (!audioRecording) return;
      await audioRecording.stopAndUnloadAsync();
      const uri = audioRecording.getURI();
      setAudioRecording(null);
      setAudioUri(uri);

      // Upload audio to backend
      if (uri && user?._id) {
        setMediaUploading(true);
        const formData = new FormData();
        formData.append('file', {
          uri,
          name: `audio-message.m4a`,
          type: 'audio/m4a',
        });
        formData.append('counsellorId', user._id);

        const res = await fetch('https://test.ifda.in/api/quick-insert/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });
        if (!res.ok) throw new Error('Failed to upload audio');
        const saved = await res.json();
        const normalized = [saved].flat().filter(Boolean).map((entry) => buildMessage(entry, user));
        setMessages((prev) => dedupeMessages([...prev, ...normalized]));
        setTimeout(() => scrollToBottom(true), 60);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not stop or upload recording.');
    } finally {
      setAudioRecording(null);
      setMediaUploading(false);
    }
  };

  // Swipeable row for WhatsApp-style reply, edit, delete, info
  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    const isHighlighted = highlightedId === item.id;
    const highlightStyle = isHighlighted
      ? isUser
        ? styles.highlightUser
        : styles.highlightSystem
      : undefined;

    // Show "edited" mark only if edited flag is true
    const isEdited = !!item.edited;

    return (
      <View>
        <TouchableOpacity
          activeOpacity={0.85}
          onLongPress={() => {
            setActionSheet({
              visible: true,
              item,
              isUser,
            });
          }}
        >
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.systemBubble,
              highlightStyle,
            ]}
          >
            {/* Video Preview with Fullscreen */}
            {item.mediaUrl && item.mediaType === 'video' && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setPreview({ visible: true, type: 'video', uri: item.mediaUrl })}
              >
                <Video
                  source={{ uri: item.mediaUrl }}
                  style={{ width: 180, height: 120, borderRadius: 10, marginBottom: 6 }}
                  useNativeControls
                  resizeMode="cover"
                  isMuted
                />
              </TouchableOpacity>
            )}
            {/* Image Preview with Fullscreen */}
            {item.mediaUrl && item.mediaType !== 'video' && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setPreview({ visible: true, type: 'image', uri: item.mediaUrl })}
              >
                <Image
                  source={{ uri: item.mediaUrl }}
                  style={{ width: 180, height: 120, borderRadius: 10, marginBottom: 6 }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
            {/* Audio Preview */}
            {item.audioUrl && (
              <TouchableOpacity
                style={{ marginBottom: 6 }}
                onPress={() => playAudio(item.audioUrl)}
              >
                <Text style={{ color: '#0f172a', fontWeight: 'bold' }}>▶️ Voice Message</Text>
              </TouchableOpacity>
            )}
            {item.replyTo && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleJumpToMessage(item.replyTo.id)}
                style={[
                  styles.replyPreview,
                  isUser ? styles.replyPreviewUser : styles.replyPreviewSystem,
                ]}
              >
                <Text
                  style={[
                    styles.replyPreviewAuthor,
                    isUser ? styles.replyPreviewAuthorUser : styles.replyPreviewAuthorSystem,
                  ]}
                >
                  {item.replyTo.authorName || 'Message'}
                </Text>
                <Text
                  style={[
                    styles.replyPreviewText,
                    isUser ? styles.replyPreviewTextUser : styles.replyPreviewTextSystem,
                  ]}
                  numberOfLines={1}
                >
                  {item.replyTo.text || 'Quoted message'}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={styles.messageText}>
              {item.text}
              {isEdited ? <Text style={styles.editedMark}> (edited)</Text> : null}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              {item.authorName && (
                <Text style={styles.messageMeta}>
                  {item.authorName}
                  {item.createdAt
                    ? ` • ${formatTimestamp(item.createdAt)}`
                    : ''}
                </Text>
              )}
              {isUser && (
                <Text style={{ marginLeft: 6, fontSize: 15 }}>
                  {item.seen ? '✅✅' : '✅'}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const playAudio = async (uri) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
      // Unload after playback finishes
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      Alert.alert('Audio Error', 'Could not play audio.');
    }
  };

  const handlePickMedia = async () => {
  if (!user?._id) {
    Alert.alert('Error', 'User info missing. Please login again.');
    return;
  }
  try {
    setMediaUploading(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.7,
    });
    if (result.canceled || !result.assets || !result.assets.length) {
      setMediaUploading(false);
      return;
    }
    const asset = result.assets[0];
    // Prepare form data for upload
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: asset.fileName || `media.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
      type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
    });
    formData.append('counsellorId', user._id);

    // Upload to backend (adjust endpoint as per your backend)
    const res = await fetch('https://test.ifda.in/api/quick-insert/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload media');
    const saved = await res.json();
    // Add the new message to the chat
    const normalized = [saved].flat().filter(Boolean).map((entry) => buildMessage(entry, user));
    setMessages((prev) => dedupeMessages([...prev, ...normalized]));
    setTimeout(() => scrollToBottom(true), 60);
  } catch (error) {
    Alert.alert('Error', error.message || 'Unable to upload media.');
  } finally {
    setMediaUploading(false);
  }
};



  const renderItem = useCallback(
    ({ item }) =>
      item.type === 'separator' ? (
        <View style={styles.separatorWrapper}>
          <Text style={styles.separatorText}>{item.label}</Text>
        </View>
      ) : (
        renderMessage({ item })
      ),
    [renderMessage]
  );

  const keyExtractor = useCallback(
    (item) =>
      item.type === 'separator'
        ? item.id
        : `message-${item.id}-${item.createdAt || 'na'}`,
    []
  );

  // Add state for custom action sheet/modal
  const [actionSheet, setActionSheet] = useState({ visible: false, item: null, isUser: false });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quick Insert</Text>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => setFormVisible(true)}
          >
            <Text style={styles.headerActionText}>Insert Enquiry</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Search and Filter Bar */}
        <View style={styles.searchFilterBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            value={searchText}
            onChangeText={setSearchText}
            clearButtonMode="while-editing"
          />
          <TouchableOpacity
            style={[
              styles.filterBtn,
              showEnquiryOnly && styles.filterBtnActive,
            ]}
            onPress={() => setShowEnquiryOnly((v) => !v)}
          >
            <Text style={[styles.filterBtnText, showEnquiryOnly && styles.filterBtnTextActive]}>
              Enquiry Only
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              showMineOnly && styles.filterBtnActive,
            ]}
            onPress={() => setShowMineOnly((v) => !v)}
          >
            <Text style={[styles.filterBtnText, showMineOnly && styles.filterBtnTextActive]}>
              My Msgs
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messagesWithSeparators}
          style={styles.chatList}
          contentContainerStyle={[styles.chatContainer, { paddingBottom: listBottomPadding }]}
          keyboardShouldPersistTaps="handled"
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 100 }}
          onContentSizeChange={(w, h) => {
            contentHeightRef.current = h;
            if (pendingScrollAdjustRef.current) {
              adjustAfterContentChange(h);
              // Optionally, scroll to top after loading older messages:
              // flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
            }
          }}
          onLayout={({ nativeEvent: { layout } }) => {
            listHeightRef.current = layout.height;
          }}
          ListHeaderComponent={
            <View>
              {loadingOlder ? <ActivityIndicator style={styles.olderLoader} color="#10b981" /> : null}
              {loadingFeed ? <ActivityIndicator style={styles.feedLoader} color="#10b981" /> : null}
            </View>
          }
        />
      </View>

      <KeyboardAvoidingView
        style={styles.composerAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
        keyboardVerticalOffset={0}
        enabled
      >
        <View
          style={[
            styles.composerWrapper,
            { 
              paddingBottom: 0,
              transform: [{ translateY: isKeyboardVisible ? 0 : 0 }]
            },
          ]}
        >
          {replyTarget && (
            <View style={styles.replyBanner}>
              <View style={styles.replyBannerContent}>
                <Text style={styles.replyBannerLabel}>
                  Replying to {replyTarget.authorName || 'message'}
                </Text>
                <Text style={styles.replyBannerText} numberOfLines={1}>
                  {replyTarget.text}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyTarget(null)}>
                <Text style={styles.replyBannerClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {editTarget && (
            <View style={styles.replyBanner}>
              <View style={styles.replyBannerContent}>
                <Text style={styles.replyBannerLabel}>
                  Editing your message
                </Text>
                <Text style={styles.replyBannerText} numberOfLines={1}>
                  {editTarget.text}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditTarget(null)}>
                <Text style={styles.replyBannerClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View
            style={styles.composer}
            onLayout={({ nativeEvent: { layout } }) =>
              setComposerHeight((prev) =>
                Math.abs(prev - layout.height) > 0.5 ? layout.height : prev
              )
            }
          >
            {/* Media and Audio Buttons */}
            <TouchableOpacity
              style={styles.mediaBtn}
              onPress={handlePickMedia}
              disabled={mediaUploading}
            >
              <Text style={{ fontSize: 22 }}>📎</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mediaBtn}
              onPress={audioRecording ? handleStopRecording : handleStartRecording}
              disabled={mediaUploading}
            >
              <Text style={{ fontSize: 22 }}>{audioRecording ? '⏹️' : '🎤'}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={
                editTarget
                  ? 'Edit your message...'
                  : 'Type details to insert...'
              }
              value={draft}
              onChangeText={setDraft}
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={editTarget ? handleSaveEdit : handleSend}
              disabled={sendDisabled || !draft.trim()}
            >
              <Text style={styles.sendText}>{editTarget ? '💾' : '➤'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={formVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFormVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Insert Enquiry</Text>
              <TouchableOpacity onPress={() => setFormVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.formBody}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Source *</Text>
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  onPress={() => setShowSourcePicker((prev) => !prev)}
                >
                  <Text style={styles.pickerText}>
                    {formData.source || 'Select source'}
                  </Text>
                </TouchableOpacity>
                {showSourcePicker && (
                  <ScrollView style={styles.pickerList} nestedScrollEnabled>
                    {SOURCE_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.pickerItem}
                        onPress={() => {
                          setFormData((prev) => ({ ...prev, source: option }));
                          setShowSourcePicker(false);
                        }}
                      >
                        <Text style={styles.pickerItemText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Student Mobile *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.studentMobile}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, studentMobile: text }))
                  }
                  keyboardType="phone-pad"
                  placeholder="Enter 10-digit mobile"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Alternate Mobile</Text>
                <TextInput
                  style={styles.input}
                  value={formData.alternateMobile}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, alternateMobile: text }))
                  }
                  keyboardType="phone-pad"
                  placeholder="Enter alternate mobile (optional)"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Student Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.studentName}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, studentName: text }))
                  }
                  placeholder="Enter student name"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, location: text }))
                  }
                  placeholder="Neighbourhood, city"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Courses</Text>
                <TextInput
                  style={styles.input}
                  value={courseSearch}
                  onChangeText={setCourseSearch}
                  placeholder="Search course..."
                />
                {formData.courses.length > 0 && (
                  <View style={styles.selectedChipRow}>
                    {formData.courses.map(course => (
                      <TouchableOpacity
                        key={course}
                        style={styles.selectedChip}
                        onPress={() => toggleCourse(course)}
                      >
                        <Text style={styles.selectedChipText}>{course} ✕</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <ScrollView style={styles.courseList} nestedScrollEnabled>
                  {filteredCourses.length === 0 ? (
                    <Text style={styles.noResultText}>No courses found.</Text>
                  ) : (
                    filteredCourses.map((course, index) => {
                      const active = formData.courses.includes(course);
                      return (
                        <TouchableOpacity
                          key={`${course}-${index}`}
                          style={[styles.courseItem, active && styles.courseItemActive]}
                          onPress={() => toggleCourse(course)}
                        >
                          <Text style={[styles.courseItemText, active && styles.courseItemTextActive]}>
                            {course}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Total Fees</Text>
                <TextInput
                  style={styles.input}
                  value={formData.totalFees}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, totalFees: text }))
                  }
                  keyboardType="numeric"
                  placeholder="₹ Amount"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Lead Status</Text>
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  onPress={() => setShowLeadStatusPicker((prev) => !prev)}
                >
                  <Text style={styles.pickerText}>
                    {formData.leadStatus || 'Select lead status'}
                  </Text>
                </TouchableOpacity>
                {showLeadStatusPicker && (
                  <ScrollView style={styles.pickerList} nestedScrollEnabled>
                    {LEAD_STATUS_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.pickerItem}
                        onPress={() => {
                          setFormData((prev) => ({ ...prev, leadStatus: option }));
                          setShowLeadStatusPicker(false);
                        }}
                      >
                        <Text style={styles.pickerItemText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Response</Text>
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  onPress={() => setShowResponsePicker((prev) => !prev)}
                >
                  <Text style={styles.pickerText}>
                    {formData.response || 'Select response'}
                  </Text>
                </TouchableOpacity>
                {showResponsePicker && (
                  <ScrollView style={styles.pickerList} nestedScrollEnabled>
                    {STUDENT_RESPONSES.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.pickerItem}
                        onPress={() => {
                          setFormData((prev) => ({ ...prev, response: option }));
                          setShowResponsePicker(false);
                        }}
                      >
                        <Text style={styles.pickerItemText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View> */}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Remarks</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={
                    typeof formData.remarks === 'string'
                      ? formData.remarks
                      : Array.isArray(formData.remarks)
                      ? formData.remarks.map(r =>
                          typeof r === 'string'
                            ? r
                            : r && typeof r === 'object' && r.remarks
                            ? r.remarks
                            : JSON.stringify(r)
                        ).join(', ')
                      : formData.remarks && typeof formData.remarks === 'object' && formData.remarks.remarks
                      ? formData.remarks.remarks
                      : ''
                  }
                  onChangeText={text =>
                    setFormData(prev => ({
                      ...prev,
                      remarks: text,
                    }))
                  }
                  placeholder="Notes, follow-up plan…"
                  multiline
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.submitButton} onPress={handleFormSubmit}>
              <Text style={styles.submitText}>Save Enquiry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!infoTarget}
        animationType="slide"
        transparent
        onRequestClose={() => setInfoTarget(null)}
      >
        <View style={styles.infoModalBackdrop}>
          <View style={styles.infoModalContent}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>Message Info</Text>
              <TouchableOpacity onPress={() => setInfoTarget(null)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: 10 }}>
              <Text style={{ color: '#0f172a', fontWeight: '600', marginBottom: 6 }}>
                {infoTarget?.text || ''}
              </Text>
            </View>
            <ScrollView style={styles.infoModalBody}>
              {/* READ BY */}
              <Text style={styles.infoSeenHeading}>READ BY</Text>
              {infoTarget?.seenBy && infoTarget.seenBy.length > 0 ? (
                infoTarget.seenBy.map((user, idx) => (
                  <View key={user._id || idx} style={styles.infoSeenRow}>
                    <View style={styles.infoSeenAvatar}>
                      <Text style={styles.infoSeenAvatarText}>
                        {user.name
                          ? user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                          : (user._id || '?').toString().slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.infoSeenName}>{user.name || user._id}</Text>
                    <Text style={styles.infoSeenTime}>
                      {/* If you have seen time, show it here. Otherwise, just show "✓✓" */}
                      ✓✓ {/* Replace with time if available */}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.infoNoSeenBox}>
                  <Text style={styles.infoNoSeenIcon}>🙈</Text>
                  <Text style={styles.infoNoSeenText}>No one has seen this message yet.</Text>
                </View>
              )}
              {/* DELIVERED TO (not implemented, so just show placeholder) */}
              <Text style={[styles.infoSeenHeading, { marginTop: 18 }]}>DELIVERED TO</Text>
              <View style={styles.infoNoSeenBox}>
                <Text style={styles.infoNoSeenIcon}>📬</Text>
                <Text style={styles.infoNoSeenText}>Delivered info not available.</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom ActionSheet Modal */}
      <Modal
        visible={actionSheet.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionSheet({ visible: false, item: null, isUser: false })}
      >
        <TouchableOpacity
          style={styles.actionSheetBackdrop}
          activeOpacity={1}
          onPress={() => setActionSheet({ visible: false, item: null, isUser: false })}
        >
          <View style={styles.actionSheetContainer}>
            <View style={styles.actionSheetBox}>
              <TouchableOpacity
                style={styles.actionSheetBtn}
                onPress={() => {
                  setReplyTarget({
                    id: actionSheet.item.id,
                    authorName: actionSheet.item.authorName || 'Message',
                    text: actionSheet.item.text,
                  });
                  setActionSheet({ visible: false, item: null, isUser: false });
                }}
              >
                <Text style={styles.actionSheetText}>Reply</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionSheetBtn}
                onPress={() => {
                  setInfoTarget(actionSheet.item);
                  setActionSheet({ visible: false, item: null, isUser: false });
                }}
              >
                <Text style={styles.actionSheetText}>Info</Text>
              </TouchableOpacity>
              {actionSheet.isUser && (
                <>
                  <TouchableOpacity
                    style={styles.actionSheetBtn}
                    onPress={() => {
                      setEditTarget(actionSheet.item);
                      setDraft(actionSheet.item.text);
                      setReplyTarget(null);
                      setActionSheet({ visible: false, item: null, isUser: false });
                    }}
                  >
                    <Text style={styles.actionSheetText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionSheetBtn, styles.actionSheetBtnDelete]}
                    onPress={() => {
                      setActionSheet({ visible: false, item: null, isUser: false });
                      setTimeout(() => handleDeleteMessage(actionSheet.item), 200);
                    }}
                  >
                    <Text style={styles.actionSheetTextDelete}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={styles.actionSheetBtn}
                onPress={() => setActionSheet({ visible: false, item: null, isUser: false })}
              >
                <Text style={styles.actionSheetTextCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Fullscreen Image/Video Preview Modal */}
      <RNModal
        visible={preview.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview({ visible: false, type: null, uri: null })}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.95)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setPreview({ visible: false, type: null, uri: null })}
        >
          {preview.type === 'image' && (
            <Image
              source={{ uri: preview.uri }}
              style={{ width: '96%', height: '70%', borderRadius: 12, resizeMode: 'contain' }}
            />
          )}
          {preview.type === 'video' && (
            <Video
              source={{ uri: preview.uri }}
              style={{ width: '96%', height: '40%', borderRadius: 12 }}
              useNativeControls
              resizeMode="contain"
              shouldPlay
            />
          )}
          <Text style={{ color: '#fff', fontSize: 22, marginTop: 18 }}>✕</Text>
        </TouchableOpacity>
      </RNModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  flex: { flex: 1 },
  content: { flex: 1 },
  chatList: { flex: 1 },
  composerAvoider: { alignSelf: 'stretch' },
  composerWrapper: { paddingHorizontal: 0, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
  },
  backButton: { padding: 6 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerActionButton: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  headerActionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  placeholder: { width: 50 },
  chatContainer: { padding: 12, gap: 4 },
  messageBubble: {
    maxWidth: '80%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginVertical: 2,
  },
  systemBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#10b981',
    borderTopRightRadius: 4,
  },
  highlightUser: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  highlightSystem: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#34d399',
    shadowColor: '#34d399',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 3,
  },
  messageText: { color: '#0f172a', fontSize: 14, lineHeight: 20 },
  messageMeta: { marginTop: 4, fontSize: 11, color: '#000000ff' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sendText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  closeText: { fontSize: 20, color: '#94a3b8' },
  formBody: { paddingHorizontal: 20, paddingVertical: 16, gap: 16 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569' },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  pickerTrigger: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  pickerText: { fontSize: 14, color: '#0f172a' },
  pickerList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    maxHeight: 160,
  },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 10 },
  pickerItemText: { fontSize: 14, color: '#1e293b' },
  selectedChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  selectedChip: {
    backgroundColor: '#10b981',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedChipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  courseList: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    maxHeight: 180,
  },
  courseItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    marginHorizontal: 20,
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#10b981',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  feedLoader: { marginVertical: 12 },
  olderLoader: { marginBottom: 12 },
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 6,
    marginBottom: 6,
    borderRadius: 8,
  },
  replyPreviewUser: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderLeftColor: 'rgba(255,255,255,0.65)',
  },
  replyPreviewSystem: {
    backgroundColor: '#f1f5f9',
    borderLeftColor: '#10b981',
  },
  replyPreviewAuthor: {
    fontSize: 12,
    fontWeight: '700',
  },
  replyPreviewAuthorUser: { color: '#fff' },
  replyPreviewAuthorSystem: { color: '#0f172a' },
  replyPreviewText: {
    fontSize: 12,
    marginTop: 2,
  },
  replyPreviewTextUser: { color: '#e2e8f0' },
  replyPreviewTextSystem: { color: '#475569' },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  replyBannerContent: { flex: 1 },
  replyBannerLabel: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
  replyBannerText: { fontSize: 12, color: '#334155', marginTop: 2 },
  replyBannerClose: { fontSize: 16, color: '#0f172a', paddingHorizontal: 6 },
  separatorWrapper: {
    alignSelf: 'center',
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 6,
  },
  separatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  infoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoModalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    width: '80%',
    padding: 20,
    alignItems: 'stretch',
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoModalTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  infoModalBody: { marginTop: 8, minHeight: 60 },
  infoSeenHeading: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    color: '#0f172a',
    textAlign: 'left',
  },
  infoSeenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  infoSeenAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoSeenAvatarText: {
    color: '#0284c7',
    fontWeight: 'bold',
    fontSize: 15,
  },
  infoSeenName: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
  },
  infoSeenTime: {
    fontSize: 13,
    color: '#64748b',
    minWidth: 60,
    textAlign: 'right',
  },
  infoNoSeenBox: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  infoNoSeenIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  infoNoSeenText: {
    color: '#64748b',
    fontSize: 15,
    textAlign: 'center',
  },
  actionSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.22)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 24,
  },
  actionSheetBox: {
    width: '94%',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 0,
    alignItems: 'stretch',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  actionSheetBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  actionSheetBtnDelete: {
    backgroundColor: '#fff0f0',
  },
  actionSheetText: {
    fontSize: 17,
    color: '#0f172a',
    fontWeight: '600',
  },
  actionSheetTextDelete: {
    fontSize: 17,
    color: '#dc2626',
    fontWeight: '700',
  },
  actionSheetTextCancel: {
    fontSize: 17,
    color: '#64748b',
    fontWeight: '600',
  },
  searchFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0fdf4',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 15,
    marginRight: 6,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#e0f2f1',
    borderWidth: 1,
    borderColor: '#10b981',
    marginLeft: 2,
  },
  filterBtnActive: {
    backgroundColor: '#10b981',
  },
  filterBtnText: {
    color: '#047857',
    fontWeight: '600',
    fontSize: 13,
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  editedMark: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  mediaBtn: {
    marginRight: 4,
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#e0f2f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Fallback for markQuickInsertSeen if not present in api.js
const markQuickInsertSeen = api.markQuickInsertSeen
  ? api.markQuickInsertSeen
  : async (id, userId, userName) => {
      // fallback: just return the same id and user info as seenBy
      return { id, seenBy: [{ _id: userId, name: userName }] };
    };
