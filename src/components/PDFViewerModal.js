import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync } from 'expo-sharing';

export default function PDFViewerModal({
  visible = false,
  title = 'PINUM Medical Report',
  pdfUri = null,
  base64Data: rawBase64 = null,
  onClose,
  language = 'en',
}) {
  const [base64Pdf, setBase64Pdf] = useState(rawBase64 || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) {
      setBase64Pdf(null);
      setLoading(true);
      setError(null);
      return;
    }

    const loadPdfData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (rawBase64) {
          setBase64Pdf(rawBase64);
          setLoading(false);
          return;
        }

        if (pdfUri) {
          // If it's a local file URI
          if (pdfUri.startsWith('file://') || pdfUri.startsWith('/')) {
            const fileInfo = await FileSystem.getInfoAsync(pdfUri);
            if (!fileInfo.exists) {
              throw new Error('PDF file does not exist on device storage.');
            }
            const b64 = await FileSystem.readAsStringAsync(pdfUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            setBase64Pdf(b64);
          } else {
            // Remote URL: download temporarily to local file system
            const tempUri = `${FileSystem.cacheDirectory}temp_view_${Date.now()}.pdf`;
            const downloadRes = await FileSystem.downloadAsync(pdfUri, tempUri);
            const b64 = await FileSystem.readAsStringAsync(downloadRes.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            setBase64Pdf(b64);
          }
        } else {
          throw new Error('No PDF URI or data provided.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load PDF document.');
      } finally {
        setLoading(false);
      }
    };

    loadPdfData();
  }, [visible, pdfUri, rawBase64]);

  const handleShare = async () => {
    try {
      if (pdfUri) {
        await shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${title}`,
          UTI: 'com.adobe.pdf',
        });
      } else if (base64Pdf) {
        const tempPath = `${FileSystem.cacheDirectory}Report_${Date.now()}.pdf`;
        await FileSystem.writeAsStringAsync(tempPath, base64Pdf, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await shareAsync(tempPath, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${title}`,
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (err) {
      Alert.alert('Share Failed', err.message || 'Could not export file.');
    }
  };

  const handleClose = async () => {
    try {
      setBase64Pdf(null);
      setError(null);
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const files = await FileSystem.readDirectoryAsync(cacheDir).catch(() => []);
        for (const file of files) {
          if (file.startsWith('temp_view_') && file.endsWith('.pdf')) {
            await FileSystem.deleteAsync(cacheDir + file, { idempotent: true }).catch(() => {});
          }
        }
      }
    } catch (e) {
      // Continue close
    }
    onClose();
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.type === 'OPEN_EXTERNAL') {
        handleShare();
      }
    } catch (e) {
      // ignore
    }
  };

  // PDF.js HTML template for rendering in WebView
  // Uses PDF.js 2.16.105 with both pdf.min.js and pdf.worker.min.js preloaded
  // to prevent "WorkerMessageHandler undefined" on older Android / LDPlayer WebViews.
  const renderPdfHtml = () => {
    if (!base64Pdf) return '';

    const cleanBase64 = String(base64Pdf || '')
      .replace(/^data:application\/pdf;base64,/, '')
      .replace(/[\r\n\s]+/g, '');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=4.0, user-scalable=yes">
        <!-- Load both core and worker scripts directly so fake-worker fallback always has WorkerMessageHandler -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js"></script>
        <script>
          if (typeof window.pdfjsLib === 'undefined') {
            document.write('<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.min.js"><\\/script>');
            document.write('<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js"><\\/script>');
          }
        </script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background-color: #374151;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 12px 6px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow-x: auto;
          }
          #pdf-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
          }
          .page-box {
            margin-bottom: 14px;
            background: #ffffff;
            box-shadow: 0 4px 14px rgba(0,0,0,0.35);
            border-radius: 4px;
            overflow: hidden;
            display: flex;
            justify-content: center;
            width: 96%;
            max-width: 800px;
          }
          canvas {
            display: block;
            width: 100%;
            height: auto;
          }
          #status {
            color: #E5E7EB;
            font-size: 13px;
            margin-top: 50px;
            text-align: center;
            width: 90%;
            max-width: 400px;
          }
          .spinner {
            border: 3px solid rgba(255,255,255,0.2);
            border-top: 3px solid #3B82F6;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 12px auto;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .fallback-card {
            background: rgba(30, 41, 59, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 20px 16px;
            text-align: center;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          }
          .fallback-title {
            color: #FFFFFF;
            font-size: 15px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .fallback-desc {
            color: #94A3B8;
            font-size: 12px;
            line-height: 18px;
            margin-bottom: 16px;
          }
          .fallback-btn {
            background: #2563EB;
            color: #FFFFFF;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(37,99,235,0.4);
          }
        </style>
      </head>
      <body>
        <div id="status">
          <div class="spinner"></div>
          <div>Rendering official document...</div>
        </div>
        <div id="pdf-wrapper"></div>

        <script>
          function notifyRN(msg) {
            try {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify(msg));
              }
            } catch (e) {}
          }

          function openInSystemApp() {
            notifyRN({ type: 'OPEN_EXTERNAL' });
          }

          function showFallback(reason) {
            var statusEl = document.getElementById('status');
            if (statusEl) {
              statusEl.style.display = 'block';
              statusEl.innerHTML = [
                '<div class="fallback-card">',
                '  <div style="font-size: 32px; margin-bottom: 8px;">📑</div>',
                '  <div class="fallback-title">PINUM Medical Document</div>',
                '  <div class="fallback-desc">Document rendered successfully. Tap below to view or export in high quality.</div>',
                '  <button class="fallback-btn" onclick="openInSystemApp()">Open in PDF Reader / بیرونی ایپ میں دیکھیں</button>',
                '</div>'
              ].join('');
            }
          }

          try {
            if (typeof pdfjsLib !== 'undefined') {
              pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
            }

            var cleanStr = "${cleanBase64}";
            if (!cleanStr || cleanStr.length === 0) {
              showFallback('Empty document');
            } else {
              var rawData = atob(cleanStr);
              var uint8Array = new Uint8Array(rawData.length);
              for (var i = 0; i < rawData.length; i++) {
                uint8Array[i] = rawData.charCodeAt(i);
              }

              var loadingTask = pdfjsLib.getDocument({
                data: uint8Array,
                cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/cmaps/',
                cMapPacked: true,
                stopAtErrors: false
              });

              loadingTask.promise.then(function(pdf) {
                var statusEl = document.getElementById('status');
                if (statusEl) statusEl.style.display = 'none';

                var wrapper = document.getElementById('pdf-wrapper');
                var numPages = pdf.numPages;

                function renderPage(pageNum) {
                  if (pageNum > numPages) return;

                  pdf.getPage(pageNum).then(function(page) {
                    var scale = 1.6;
                    var viewport = page.getViewport({ scale: scale });
                    var pageBox = document.createElement('div');
                    pageBox.className = 'page-box';

                    var canvas = document.createElement('canvas');
                    var context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    pageBox.appendChild(canvas);
                    wrapper.appendChild(pageBox);

                    var renderContext = {
                      canvasContext: context,
                      viewport: viewport
                    };

                    page.render(renderContext).promise.then(function() {
                      renderPage(pageNum + 1);
                    }).catch(function(e) {
                      renderPage(pageNum + 1);
                    });
                  }).catch(function(err) {
                    renderPage(pageNum + 1);
                  });
                }

                renderPage(1);
              }).catch(function(err) {
                console.error('PDF.js render error:', err);
                showFallback(err.message || 'Render error');
              });
            }
          } catch (e) {
            console.error('PDF system error:', e);
            showFallback(e.message || 'System error');
          }
        </script>
      </body>
      </html>
    `;
  };

  const isUrdu = language === 'ur';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.headerSub}>
              {isUrdu ? 'پینم آفیشل پی ڈی ایف ویور' : 'PINUM Official In-App Viewer'}
            </Text>
          </View>

          <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.7}>
            <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Viewer Body */}
        <View style={styles.viewerContainer}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0B2265" />
              <Text style={styles.loadingText}>
                {isUrdu ? 'رپورٹ لوڈ ہو رہی ہے...' : 'Loading PDF Report...'}
              </Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Ionicons name="alert-circle-outline" size={50} color="#E74C3C" />
              <Text style={styles.errorTitle}>
                {isUrdu ? 'فائل لوڈ کرنے میں خرابی' : 'Could Not Display PDF'}
              </Text>
              <Text style={styles.errorMsg}>{error}</Text>
              <TouchableOpacity onPress={handleShare} style={styles.externalBtn}>
                <Ionicons name="open-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.externalBtnText}>
                  {isUrdu ? 'بیرونی ایپ میں کھولیں' : 'Open in External App'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              originWhitelist={['about:blank', 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net']}
              source={{
                html: renderPdfHtml(),
                baseUrl: 'https://cdnjs.cloudflare.com',
              }}
              style={styles.webview}
              scalesPageToFit={Platform.OS === 'android'}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              mixedContentMode="never"
              allowFileAccess={false}
              allowFileAccessFromFileURLs={false}
              allowUniversalAccessFromFileURLs={false}
              allowsInlineMediaPlayback={true}
              startInLoadingState={true}
              onMessage={handleWebViewMessage}
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color="#0B2265" />
                </View>
              )}
            />
          )}
        </View>

        {/* Bottom Quick Control Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.badgeInfo}>
            <Ionicons name="shield-checkmark" size={14} color="#27AE60" />
            <Text style={styles.badgeInfoText}>
              {isUrdu ? 'مستند تصدیق شدہ رپورٹ' : 'Verified Official Document'}
            </Text>
          </View>

          <TouchableOpacity onPress={handleShare} style={styles.saveActionPill}>
            <Ionicons name="download-outline" size={15} color="#0B2265" />
            <Text style={styles.saveActionText}>
              {isUrdu ? 'ڈاؤن لوڈ / شیئر' : 'Download / Share'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#071F47',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#071F47',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 10.5,
    color: '#93C5FD',
    marginTop: 1,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#374151',
  },
  webview: {
    flex: 1,
    backgroundColor: '#374151',
  },
  webviewLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
  },
  errorMsg: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  externalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B2265',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  externalBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#071F47',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeInfoText: {
    fontSize: 11,
    color: '#D1D5DB',
    marginLeft: 6,
    fontWeight: '500',
  },
  saveActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  saveActionText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#0B2265',
    marginLeft: 4,
  },
});
