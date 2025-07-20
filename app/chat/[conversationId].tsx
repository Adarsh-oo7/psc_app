import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    FlatList, 
    StyleSheet, 
    KeyboardAvoidingView, 
    Platform, 
    SafeAreaView, 
    ActivityIndicator, 
    Alert,
    Dimensions
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function ChatScreen() {
    const { user, fetcher, theme } = useAppContext();
    const isDarkMode = theme === 'dark';
    const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const { data: initialMessages, isLoading, error } = useSWR(
        `/messaging/conversations/${conversationId}/messages/`,
        fetcher
    );

    useEffect(() => {
        if (initialMessages) {
            setMessages(initialMessages.slice().reverse());
        }
    }, [initialMessages]);

    const connectWebSocket = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                Alert.alert("Authentication Error", "Please log in again.");
                return;
            }

            console.log("Attempting to connect WebSocket...");
            console.log("Conversation ID:", conversationId);
            console.log("Token available:", !!token);

            // Close existing connection if any
            if (ws.current) {
                console.log("Closing existing WebSocket connection");
                ws.current.close();
            }

            // IMPORTANT: Replace with your computer's local IP address
            const wsUrl = `ws://192.168.1.2:8000/ws/messaging/${conversationId}/?token=${token}`;
            console.log("WebSocket URL:", wsUrl);
            
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log("WebSocket connected successfully");
                setIsConnected(true);
                setIsReconnecting(false);
                reconnectAttempts.current = 0;
            };

            ws.current.onmessage = (e) => {
                try {
                    console.log("Received WebSocket message:", e.data);
                    const data = JSON.parse(e.data);
                    setMessages(prev => [data, ...prev]);
                } catch (error) {
                    console.error("Error parsing message:", error);
                }
            };

            ws.current.onerror = (e) => {
                console.error("WebSocket error:", e);
                setIsConnected(false);
                
                // Show more detailed error information
                Alert.alert(
                    "WebSocket Error",
                    `Connection failed. Please check:\n• Network connection\n• Server is running\n• Correct IP address (192.168.1.2)\n• Port 8000 is accessible\n\nError: ${e.message || 'Unknown error'}`
                );
            };

            ws.current.onclose = (e) => {
                console.log("WebSocket disconnected:", e.code, e.reason);
                setIsConnected(false);
                
                // Attempt to reconnect if not a manual close
                if (e.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
                    setIsReconnecting(true);
                    reconnectAttempts.current++;
                    
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket();
                    }, delay);
                } else if (reconnectAttempts.current >= maxReconnectAttempts) {
                    Alert.alert(
                        "Connection Failed",
                        "Unable to connect to chat server after multiple attempts. Please check your connection and try again."
                    );
                }
            };
        } catch (error) {
            console.error("Failed to connect WebSocket:", error);
            setIsConnected(false);
            Alert.alert("Connection Error", `Failed to initialize WebSocket: ${error.message}`);
        }
    }, [conversationId]);

    useEffect(() => {
        connectWebSocket();
        
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (ws.current) {
                ws.current.close(1000, "Component unmounting");
            }
        };
    }, [connectWebSocket]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        
        // Debug logging
        console.log("Attempting to send message...");
        console.log("WebSocket ready state:", ws.current?.readyState);
        console.log("Is connected:", isConnected);
        console.log("WebSocket states:", {
            CONNECTING: WebSocket.CONNECTING,
            OPEN: WebSocket.OPEN,
            CLOSING: WebSocket.CLOSING,
            CLOSED: WebSocket.CLOSED
        });
        
        if (!ws.current) {
            console.log("WebSocket is null, attempting to reconnect...");
            Alert.alert(
                "Connection Error", 
                "WebSocket not initialized. Trying to reconnect...",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Retry", onPress: connectWebSocket }
                ]
            );
            return;
        }

        if (ws.current.readyState !== WebSocket.OPEN) {
            console.log("WebSocket not open, current state:", ws.current.readyState);
            Alert.alert(
                "Connection Error", 
                `WebSocket not connected (state: ${ws.current.readyState}). Trying to reconnect...`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Retry", onPress: connectWebSocket }
                ]
            );
            return;
        }

        try {
            setIsSending(true);
            const messageToSend = newMessage.trim();
            const messagePayload = { 'message': messageToSend };
            
            console.log("Sending message payload:", messagePayload);
            ws.current.send(JSON.stringify(messagePayload));
            setNewMessage('');
            console.log("Message sent successfully");
        } catch (error) {
            console.error("Failed to send message:", error);
            Alert.alert("Error", `Failed to send message: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const renderMessage = ({ item, index }) => {
        const isMyMessage = item.sender?.username === user?.username;
        const showTimestamp = index === messages.length - 1 || 
            (messages[index + 1] && new Date(item.timestamp).toDateString() !== new Date(messages[index + 1].timestamp).toDateString());

        return (
            <View style={styles.messageWrapper}>
                <View style={[
                    styles.messageContainer, 
                    isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
                ]}>
                    <View style={[
                        styles.messageBubble, 
                        isMyMessage ? styles.myMessage : styles.theirMessage,
                        isDarkMode && (isMyMessage ? styles.myMessageDark : styles.theirMessageDark)
                    ]}>
                        {!isMyMessage && (
                            <Text style={[styles.senderName, isDarkMode && styles.senderNameDark]}>
                                {item.sender?.username || 'Unknown'}
                            </Text>
                        )}
                        <Text style={[
                            isMyMessage ? styles.myMessageText : styles.theirMessageText,
                            isDarkMode && styles.messageTextDark
                        ]}>
                            {item.text}
                        </Text>
                        <Text style={[
                            styles.timestamp,
                            isMyMessage ? styles.myTimestamp : styles.theirTimestamp,
                            isDarkMode && styles.timestampDark
                        ]}>
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
                {showTimestamp && (
                    <Text style={[styles.dateHeader, isDarkMode && styles.dateHeaderDark]}>
                        {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                )}
            </View>
        );
    };

    const ConnectionStatus = () => {
        if (isReconnecting) {
            return (
                <View style={[styles.statusBar, styles.reconnectingBar]}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.statusText}>Reconnecting...</Text>
                </View>
            );
        }
        
        if (!isConnected) {
            return (
                <View style={[styles.statusBar, styles.disconnectedBar]}>
                    <Text style={styles.statusText}>Disconnected</Text>
                    <TouchableOpacity onPress={connectWebSocket} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={testConnection} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Test</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        
        return (
            <View style={[styles.statusBar, styles.connectedBar]}>
                <Text style={styles.statusText}>Connected</Text>
            </View>
        );
    };

    const testConnection = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            console.log("=== CONNECTION TEST ===");
            console.log("Token exists:", !!token);
            console.log("Conversation ID:", conversationId);
            console.log("User:", user);
            
            // Test if the server is reachable
            const testUrl = `http://192.168.1.2:8000/messaging/conversations/${conversationId}/messages/`;
            console.log("Testing HTTP endpoint:", testUrl);
            
            const response = await fetch(testUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log("HTTP Response status:", response.status);
            console.log("HTTP Response ok:", response.ok);
            
            if (response.ok) {
                Alert.alert("Connection Test", "✅ HTTP connection successful!\nWebSocket should work too.");
                // Try WebSocket connection
                connectWebSocket();
            } else {
                Alert.alert("Connection Test", `❌ HTTP connection failed!\nStatus: ${response.status}\nCheck if server is running on 192.168.1.2:8000`);
            }
        } catch (error) {
            console.error("Connection test error:", error);
            Alert.alert("Connection Test", `❌ Connection test failed!\nError: ${error.message}\n\nCheck:\n• Server is running\n• IP address is correct\n• Network connection`);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered, isDarkMode && styles.containerDark]}>
                <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
                <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
                    Loading messages...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.centered, isDarkMode && styles.containerDark]}>
                <Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>
                    Failed to load messages
                </Text>
                <TouchableOpacity onPress={() => window.location.reload()} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen 
                options={{ 
                    title: "Chat", 
                    headerTintColor: isDarkMode ? '#fff' : '#000',
                    headerStyle: { backgroundColor: isDarkMode ? '#1f2937' : '#fff' }
                }} 
            />
            
            <ConnectionStatus />
            
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={renderMessage}
                inverted
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                keyboardVerticalOffset={90}
            >
                <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                    <TextInput
                        value={newMessage}
                        onChangeText={setNewMessage}
                        style={[styles.input, isDarkMode && styles.inputDark]}
                        placeholder="Type a message..."
                        placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                        multiline
                        maxLength={1000}
                        onSubmitEditing={handleSend}
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!newMessage.trim() || isSending || !isConnected) && styles.sendButtonDisabled
                        ]}
                        onPress={handleSend}
                        disabled={!newMessage.trim() || isSending || !isConnected}
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.sendButtonText}>Send</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ... your imports and component code remain unchanged ...

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    containerDark: {
        backgroundColor: '#18181b',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    reconnectingBar: {
        backgroundColor: '#fbbf24',
    },
    disconnectedBar: {
        backgroundColor: '#ef4444',
    },
    connectedBar: {
        backgroundColor: '#22c55e',
    },
    statusText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 8,
    },
    retryButton: {
        marginLeft: 12,
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 6,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    messagesList: {
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    messageWrapper: {
        marginVertical: 2,
    },
    messageContainer: {
        marginVertical: 2,
    },
    myMessageContainer: {
        alignItems: 'flex-end',
    },
    theirMessageContainer: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        paddingVertical: 11,
        paddingHorizontal: 18,
        borderRadius: 22,
        maxWidth: width * 0.78,
        minWidth: 60,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
    },
    myMessage: {
        backgroundColor: '#4a3780',
        borderBottomRightRadius: 7,
        marginBottom: 6,
    },
    myMessageDark: {
        backgroundColor: '#7c3aed',
    },
    theirMessage: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 7,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 6,
    },
    theirMessageDark: {
        backgroundColor: '#23232b',
        borderColor: '#312e81',
    },
    senderName: {
        fontSize: 12,
        color: '#6366f1',
        fontWeight: '600',
        marginBottom: 2,
    },
    senderNameDark: {
        color: '#a5b4fc',
    },
    myMessageText: {
        fontSize: 16,
        color: '#fff',
        lineHeight: 22,
    },
    theirMessageText: {
        fontSize: 16,
        color: '#23232b',
        lineHeight: 22,
    },
    messageTextDark: {
        color: '#fff',
    },
    timestamp: {
        fontSize: 11,
        marginTop: 5,
        alignSelf: 'flex-end',
    },
    myTimestamp: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirTimestamp: {
        color: '#a1a1aa',
    },
    timestampDark: {
        color: '#d1d5db',
    },
    dateHeader: {
        alignSelf: 'center',
        backgroundColor: '#e0e7ff',
        color: '#6366f1',
        paddingHorizontal: 16,
        paddingVertical: 2,
        fontSize: 12,
        borderRadius: 16,
        marginVertical: 10,
        fontWeight: '500',
        overflow: 'hidden',
    },
    dateHeaderDark: {
        backgroundColor: '#3730a3',
        color: '#c7d2fe',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 1,
        elevation: 2,
    },
    inputContainerDark: {
        backgroundColor: '#23232b',
        borderTopColor: '#312e81',
    },
    input: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#c7d2fe',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 10,
        fontSize: 16,
        maxHeight: 100,
        backgroundColor: '#f3f4f6',
        color: '#23232b',
    },
    inputDark: {
        borderColor: '#7c3aed',
        backgroundColor: '#18181b',
        color: '#fff',
    },
    sendButton: {
        backgroundColor: '#4a3780',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.09,
        shadowRadius: 1,
        elevation: 2,
    },
    sendButtonDisabled: {
        backgroundColor: '#a5b4fc',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 1,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
    },
    loadingTextDark: {
        color: '#a5b4fc',
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
        marginBottom: 16,
    },
    errorTextDark: {
        color: '#fca5a5',
    },
});