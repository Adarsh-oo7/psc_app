import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, Linking } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';
import { WebView } from 'react-native-webview';

interface SearchParams {
    pdfUrl: string;
    title: string;
}

export default function PDFViewerScreen() {
    const router = useRouter();
    const { pdfUrl, title } = useLocalSearchParams<SearchParams>();
    const { theme } = useAppContext();
    const isDarkMode = theme === 'dark';
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    // Safe back navigation
    const navigateBack = useCallback(() => {
        try {
            if (router && typeof router.back === 'function') {
                router.back();
            } else if (router && typeof router.push === 'function') {
                router.push('/'); // Fallback to home
            } else {
                console.warn('Router not available for back navigation');
            }
        } catch (error) {
            console.error('Back navigation error:', error);
            Alert.alert('Navigation Error', 'Could not go back. Please use device back button.');
        }
    }, [router]);

    const handleShare = useCallback(async (): Promise<void> => {
        try {
            if (!pdfUrl) {
                Alert.alert('Error', 'No PDF URL available to share');
                return;
            }

            await Share.share({
                message: `Check out this PDF: ${title || 'Document'}`,
                url: pdfUrl as string,
            });
        } catch (error) {
            console.error('Share error:', error);
            Alert.alert('Error', 'Could not share the PDF');
        }
    }, [pdfUrl, title]);

    const handleRefresh = useCallback((): void => {
        setError(false);
        setLoading(true);
    }, []);

    // Open PDF in external browser/app
    const openInBrowser = useCallback(() => {
        if (pdfUrl) {
            Linking.openURL(pdfUrl as string);
        }
    }, [pdfUrl]);

    // Validate PDF URL
    const isValidPdfUrl = useCallback((url: string | string[]): boolean => {
        if (!url || Array.isArray(url)) return false;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }, []);

    // Create PDF viewer URLs for better compatibility
    const getPdfViewerUrl = useCallback((url: string) => {
        // Try different PDF viewer approaches
        const encodedUrl = encodeURIComponent(url);
        
        // Option 1: Google Drive PDF viewer (most reliable)
        const googleViewerUrl = `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodedUrl}`;
        
        // Option 2: Mozilla PDF.js viewer
        const pdfJsUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodedUrl}`;
        
        // Option 3: Direct URL with PDF headers
        return {
            google: googleViewerUrl,
            pdfjs: pdfJsUrl,
            direct: url
        };
    }, []);

    // Handle invalid PDF URL
    if (!isValidPdfUrl(pdfUrl)) {
        return (
            <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
                <Stack.Screen options={{ headerShown: false }} />
                
                <View style={[styles.header, isDarkMode && styles.headerDark]}>
                    <TouchableOpacity onPress={navigateBack} style={styles.headerButton}>
                        <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#1f2937'} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>
                        PDF Viewer
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
                    <Text style={[styles.errorText, isDarkMode && styles.textDark]}>
                        Invalid PDF URL
                    </Text>
                    <Text style={[styles.errorSubtext, isDarkMode && styles.textSecondaryDark]}>
                        The PDF URL is not valid or missing
                    </Text>
                    <TouchableOpacity onPress={navigateBack} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const pdfViewerUrls = getPdfViewerUrl(pdfUrl as string);

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* Header */}
            <View style={[styles.header, isDarkMode && styles.headerDark]}>
                <TouchableOpacity onPress={navigateBack} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#1f2937'} />
                </TouchableOpacity>
                
                <Text style={[styles.headerTitle, isDarkMode && styles.textDark]} numberOfLines={1}>
                    {title || 'PDF Viewer'}
                </Text>
                
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={openInBrowser} style={styles.headerButton}>
                        <Ionicons name="open-outline" size={24} color={isDarkMode ? '#fff' : '#1f2937'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleRefresh} style={styles.headerButton}>
                        <Ionicons name="refresh" size={24} color={isDarkMode ? '#fff' : '#1f2937'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                        <Ionicons name="share" size={24} color={isDarkMode ? '#fff' : '#1f2937'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* PDF Content */}
            <View style={styles.content}>
                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#6b7280" />
                        <Text style={[styles.errorText, isDarkMode && styles.textDark]}>
                            Could not load PDF
                        </Text>
                        <Text style={[styles.errorSubtext, isDarkMode && styles.textSecondaryDark]}>
                            The PDF might not be compatible with the built-in viewer
                        </Text>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity onPress={openInBrowser} style={styles.primaryButton}>
                                <Ionicons name="open-outline" size={20} color="#fff" />
                                <Text style={styles.primaryButtonText}>Open in Browser</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleRefresh} style={styles.secondaryButton}>
                                <Text style={styles.secondaryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <WebView
                        source={{ 
                            uri: pdfViewerUrls.google,
                            headers: {
                                'Accept': 'application/pdf,*/*',
                                'Cache-Control': 'no-cache',
                            }
                        }}
                        style={styles.webview}
                        onLoadStart={() => {
                            console.log('PDF loading started');
                            setLoading(true);
                        }}
                        onLoadEnd={() => {
                            console.log('PDF loading finished');
                            setLoading(false);
                        }}
                        onError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.error('WebView error:', nativeEvent);
                            
                            // Try fallback to PDF.js viewer
                            if (pdfViewerUrls.google !== pdfViewerUrls.pdfjs) {
                                console.log('Trying PDF.js viewer as fallback');
                                // You could implement a state to try different viewers
                            }
                            
                            setError(true);
                            setLoading(false);
                        }}
                        onHttpError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.error('WebView HTTP error:', nativeEvent);
                            setError(true);
                            setLoading(false);
                        }}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={[styles.loadingContainer, isDarkMode && styles.loadingContainerDark]}>
                                <Ionicons name="document-text-outline" size={64} color="#6b7280" />
                                <Text style={[styles.loadingText, isDarkMode && styles.textDark]}>
                                    Loading PDF...
                                </Text>
                                <Text style={[styles.loadingSubtext, isDarkMode && styles.textSecondaryDark]}>
                                    This may take a moment
                                </Text>
                            </View>
                        )}
                        allowsInlineMediaPlayback={true}
                        mediaPlaybackRequiresUserAction={false}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        cacheEnabled={false} // Disable cache for PDF loading issues
                        allowsBackForwardNavigationGestures={false}
                        bounces={false}
                        scrollEnabled={true}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={true}
                        // Additional PDF-specific settings
                        originWhitelist={['*']}
                        mixedContentMode={'always'}
                        allowsProtectedMedia={true}
                        onShouldStartLoadWithRequest={(request) => {
                            console.log('Loading request:', request.url);
                            return true;
                        }}
                        renderError={(errorDomain, errorCode, errorDesc) => (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
                                <Text style={[styles.errorText, isDarkMode && styles.textDark]}>
                                    PDF Load Error
                                </Text>
                                <Text style={[styles.errorSubtext, isDarkMode && styles.textSecondaryDark]}>
                                    {errorDesc || 'Unknown error occurred'}
                                </Text>
                                <TouchableOpacity onPress={openInBrowser} style={styles.retryButton}>
                                    <Text style={styles.retryButtonText}>Open in Browser</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    containerDark: {
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    headerDark: {
        backgroundColor: '#1f2937',
        borderBottomColor: '#374151',
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    headerActions: {
        flexDirection: 'row',
    },
    content: {
        flex: 1,
    },
    webview: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 20,
    },
    loadingContainerDark: {
        backgroundColor: '#121212',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
    },
    loadingSubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    errorSubtext: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    buttonContainer: {
        marginTop: 24,
        width: '100%',
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#4A3780',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4A3780',
    },
    secondaryButtonText: {
        color: '#4A3780',
        fontSize: 16,
        fontWeight: '600',
    },
    retryButton: {
        backgroundColor: '#4A3780',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 24,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    textDark: {
        color: '#fff',
    },
    textSecondaryDark: {
        color: '#9ca3af',
    },
});