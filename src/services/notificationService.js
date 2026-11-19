import * as FileSystem from 'expo-file-system/legacy';

const NOTIFICATIONS_FILE = `${FileSystem.documentDirectory}pinum_notifications.json`;
const SEEN_REPORTS_FILE = `${FileSystem.documentDirectory}pinum_seen_reports.json`;

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'welcome-01',
    title: 'Welcome to PINUM Portal',
    titleUrdu: 'پینم پورٹل میں خوش آمدید',
    message: 'Access your diagnostic lab reports, cancer care guidance, and hospital services anytime.',
    messageUrdu: 'اپنی تشخیصی رپورٹس اور ہسپتال کی سہولیات کسی بھی وقت دیکھیں۔',
    type: 'system',
    timestamp: Date.now() - 3600000 * 24,
    isRead: false,
  },
  {
    id: 'home-sampling-02',
    title: 'Home Lab Sampling Launched',
    titleUrdu: 'گھر بیٹھے لیب ٹیسٹ کی سہولت',
    message: 'Now book blood collection at your doorstep across Faisalabad for Rs. 500 only. Helpline: 0336-1634118',
    messageUrdu: 'فیصل آباد میں اب صرف 500 روپے میں گھر بیٹھے سیمپل کلیکشن کروائیں۔',
    type: 'service',
    timestamp: Date.now() - 3600000 * 12,
    isRead: false,
  },
  {
    id: 'sehat-card-03',
    title: 'Punjab Health Card Free Cancer Care',
    titleUrdu: 'پنجاب صحت کارڈ پر مفت علاج',
    message: 'Free cancer diagnosis, chemo, radiation and medicines up to Rs. 10 Lakh per family annually at PINUM.',
    messageUrdu: 'پینم میں سالانہ 10 لاکھ روپے تک کینسر کا مکمل مفت علاج حاصل کریں۔',
    type: 'card',
    timestamp: Date.now() - 3600000 * 6,
    isRead: false,
  }
];

export const getNotifications = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(NOTIFICATIONS_FILE);
    if (!fileInfo.exists) {
      await FileSystem.writeAsStringAsync(NOTIFICATIONS_FILE, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    const content = await FileSystem.readAsStringAsync(NOTIFICATIONS_FILE);
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : DEFAULT_NOTIFICATIONS;
  } catch (error) {
    return DEFAULT_NOTIFICATIONS;
  }
};

export const saveNotifications = async (notifications) => {
  try {
    await FileSystem.writeAsStringAsync(NOTIFICATIONS_FILE, JSON.stringify(notifications));
    return true;
  } catch (error) {
    return false;
  }
};

export const addNotification = async ({ title, titleUrdu, message, messageUrdu, type = 'report', data = null }) => {
  try {
    const current = await getNotifications();
    const newEntry = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title,
      titleUrdu: titleUrdu || title,
      message,
      messageUrdu: messageUrdu || message,
      type,
      data,
      timestamp: Date.now(),
      isRead: false,
    };
    const updated = [newEntry, ...current];
    await saveNotifications(updated);
    return newEntry;
  } catch (error) {
    return null;
  }
};

export const markAllAsRead = async () => {
  try {
    const current = await getNotifications();
    const updated = current.map(item => ({ ...item, isRead: true }));
    await saveNotifications(updated);
    return updated;
  } catch (error) {
    return [];
  }
};

export const getUnreadCount = async () => {
  try {
    const current = await getNotifications();
    return current.filter(item => !item.isRead).length;
  } catch (_error) {
    return 0;
  }
};

export const checkNewReports = async (user, reports = []) => {
  if (!reports || !Array.isArray(reports) || reports.length === 0) {
    return [];
  }

  try {
    let seenIds = [];
    const fileInfo = await FileSystem.getInfoAsync(SEEN_REPORTS_FILE);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(SEEN_REPORTS_FILE);
      seenIds = JSON.parse(content) || [];
    }

    const newReportsFound = [];
    const updatedSeen = [...seenIds];

    for (const report of reports) {
      const ptid = report?.ptid || report?.PTID || report?.Ptid || '';
      const testDesc = report?.test_Desc || report?.Test_Desc || report?.testDesc || 'Diagnostic Test';
      const reportDate = report?.test_Date || report?.Test_Date || report?.orderDate || '';
      const uniqueReportKey = `${user?.username || 'PRN'}_${ptid}_${testDesc}_${reportDate}`;

      if (!seenIds.includes(uniqueReportKey)) {
        updatedSeen.push(uniqueReportKey);
        newReportsFound.push({
          reportKey: uniqueReportKey,
          report,
          testDesc,
          ptid,
          reportDate,
        });
      }
    }

    if (newReportsFound.length > 0) {
      await FileSystem.writeAsStringAsync(SEEN_REPORTS_FILE, JSON.stringify(updatedSeen));

      const newNotifications = [];
      for (const item of newReportsFound) {
        const notif = await addNotification({
          title: `New Report: ${item.testDesc}`,
          titleUrdu: `نئی رپورٹ تیار ہے: ${item.testDesc}`,
          message: `Your diagnostic report (PTID: ${item.ptid || 'N/A'}) is ready for download & review.`,
          messageUrdu: `آپ کی تشخیصی رپورٹ (PTID: ${item.ptid || 'N/A'}) ڈاؤن لوڈ اور دیکھنے کے لیے تیار ہے۔`,
          type: 'report',
          data: item.report,
        });
        if (notif) newNotifications.push(notif);
      }
      return newNotifications;
    }

    return [];
  } catch (error) {
    return [];
  }
};
