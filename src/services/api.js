import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ======================================================
// PINUM SECURE API CONFIGURATION
// ======================================================
// Strictly Production HTTPS Architecture (CWE-319, CWE-489)
const LIVE_DIRECT_ORIGIN = 'https://www.pinum.org.pk';
const LIVE_DIRECT_API = 'https://www.pinum.org.pk/api';

const BASE_URL = LIVE_DIRECT_API;
const FILE_BASE_URL = LIVE_DIRECT_ORIGIN;

const NETWORK_TIMEOUT_MS = 8000;

// ======================================================
// HEADERS
// ======================================================

const browserLikeHeaders = {
  Accept: 'application/json,text/plain,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 13; Pixel 4a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
};

const defaultHeaders = {
  ...browserLikeHeaders,
};

const jsonHeaders = {
  ...browserLikeHeaders,
  'Content-Type': 'application/json',
};

const pdfHeaders = {
  Accept: 'application/pdf',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 13; Pixel 4a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
};

// ======================================================
// HELPERS
// ======================================================

const parseJsonSafely = (text, fallbackValue) => {
  try {
    if (!text || text.trim() === '') {
      return fallbackValue;
    }

    return JSON.parse(text);
  } catch (error) {
    return fallbackValue;
  }
};

const getValue = (item, keys, defaultValue = '') => {
  for (const key of keys) {
    if (item && item[key] !== undefined && item[key] !== null) {
      return item[key];
    }
  }

  if (item?.raw) {
    for (const key of keys) {
      if (item.raw[key] !== undefined && item.raw[key] !== null) {
        return item.raw[key];
      }
    }
  }

  return defaultValue;
};

const buildQueryString = (params) => {
  const query = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  return query ? `?${query}` : '';
};

const cleanHeaders = (headers = {}) => {
  const cleaned = {};

  Object.keys(headers || {}).forEach((key) => {
    const value = headers[key];

    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  });

  return cleaned;
};

const getMethodDefaultHeaders = (method) => {
  const normalizedMethod = String(method || 'GET').toUpperCase();

  if (
    normalizedMethod === 'POST' ||
    normalizedMethod === 'PUT' ||
    normalizedMethod === 'PATCH'
  ) {
    return jsonHeaders;
  }

  return defaultHeaders;
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = NETWORK_TIMEOUT_MS) => {
  if (typeof AbortController === 'undefined') {
    return fetch(url, options);
  }

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs} ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const getCandidateUrls = (targetUrl) => {
  const candidates = [targetUrl];
  if (targetUrl.includes('www.pinum.org.pk')) {
    candidates.push(targetUrl.replace('www.pinum.org.pk', 'pinum.org.pk'));
  }
  return candidates;
};

// ======================================================
// MAIN API REQUEST (SECURE HTTPS ENDPOINTS)
// ======================================================

const apiRequest = async (url, options = {}, fallbackValue = null) => {
  const method = String(options?.method || 'GET').toUpperCase();

  const requestHeaders = cleanHeaders({
    ...getMethodDefaultHeaders(method),
    ...(options.headers || {}),
  });

  const candidates = getCandidateUrls(url);
  let lastError = null;

  for (let i = 0; i < candidates.length; i++) {
    const candidateUrl = candidates[i];

    try {
      const response = await fetchWithTimeout(
        candidateUrl,
        {
          ...options,
          method,
          headers: requestHeaders,
        },
        NETWORK_TIMEOUT_MS
      );

      const responseText = await response.text();
      const data = parseJsonSafely(responseText, fallbackValue);

      if (!response.ok) {
        let message =
          data?.message ||
          data?.title ||
          data?.error ||
          (data?.errors ? Object.values(data.errors).flat().join(', ') : '') ||
          responseText ||
          `API Error ${response.status}`;

        // If client returned validation or auth error (400, 401, 403), throw immediately
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          throw new Error(message);
        }

        if (i < candidates.length - 1) {
          continue;
        }

        throw new Error(message);
      }

      return data;
    } catch (error) {
      lastError = error;

      const errorStr = (error?.message || '').toLowerCase();
      const isNetworkIssue =
        errorStr.includes('timed out') ||
        errorStr.includes('network request failed') ||
        errorStr.includes('failed to fetch') ||
        errorStr.includes('connection refused') ||
        errorStr.includes('econnrefused');

      if (!isNetworkIssue) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Network request failed. Please check your internet connection.');
};

// ======================================================
// FILE URL HELPERS
// ======================================================

export const buildFileUrl = (filePath) => {
  if (!filePath) return null;

  let path = String(filePath).trim();
  if (!path) return null;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${FILE_BASE_URL}${path}`;
  }

  return `${FILE_BASE_URL}/${path}`;
};

export const buildDoctorImageUrl = (imagePath) => {
  if (!imagePath) return null;

  let path = String(imagePath).trim();
  if (!path) return null;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path.replace(/^http:\/\/(www\.)?pinum\.org\.pk/i, 'https://www.pinum.org.pk');
  }

  path = path.replace(/\\/g, '/');
  path = path.replace('lib/assets/', 'lib/Assets/');
  path = path.replace('Lib/Assets/', 'lib/Assets/');
  path = path.replace('LIB/ASSETS/', 'lib/Assets/');

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${FILE_BASE_URL}${encodeURI(cleanPath)}`;
};

export const buildNewsAttachmentUrl = (downloadLink) => {
  if (!downloadLink) return null;

  const cleanLink = String(downloadLink).trim();
  if (!cleanLink) return null;

  if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
    return cleanLink.replace(/^http:\/\/(www\.)?pinum\.org\.pk/i, 'https://www.pinum.org.pk');
  }

  if (cleanLink.startsWith('/NewsDocuments/')) {
    return `${FILE_BASE_URL}${cleanLink}`;
  }

  if (cleanLink.startsWith('NewsDocuments/')) {
    return `${FILE_BASE_URL}/${cleanLink}`;
  }

  return `${FILE_BASE_URL}/NewsDocuments/${cleanLink}`;
};

export const normalizeApiImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  let url = String(imageUrl).trim();
  if (!url) return null;

  // Upgrade pinum http to https
  url = url.replace(/^http:\/\/(www\.)?pinum\.org\.pk/i, 'https://www.pinum.org.pk');

  if (
    url.includes('127.0.0.1:7059') ||
    url.includes('localhost:7059') ||
    url.includes('127.0.0.1:5187') ||
    url.includes('localhost:5187')
  ) {
    url = url
      .replace(/https?:\/\/127\.0\.0\.1:7059/gi, FILE_BASE_URL)
      .replace(/https?:\/\/localhost:7059/gi, FILE_BASE_URL)
      .replace(/https?:\/\/127\.0\.0\.1:5187/gi, FILE_BASE_URL)
      .replace(/https?:\/\/localhost:5187/gi, FILE_BASE_URL);
    return url;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${FILE_BASE_URL}${url}`;
  }

  return `${FILE_BASE_URL}/${url}`;
};

// ======================================================
// NORMALIZERS
// ======================================================

const normalizeRate = (item, index) => {
  const serviceName = getValue(
    item,
    [
      'serviceName',
      'ServiceName',
      'service_Name',
      'Service_Name',
      'service_Desc',
      'Service_Desc',
      'testName',
      'TestName',
      'test_Desc',
      'Test_Desc',
      'TEST_DESC',
      'name',
      'Name',
      'description',
      'Description',
    ],
    'Unnamed Test'
  );

  const department = getValue(
    item,
    [
      'department',
      'Department',
      'dept',
      'Dept',
      'opd',
      'OPD',
      'lab',
      'Lab',
    ],
    'Lab'
  );

  const rate = getValue(
    item,
    [
      'rate',
      'Rate',
      'RATE',
      'amount',
      'Amount',
      'AMOUNT',
      'price',
      'Price',
      'charges',
      'Charges',
      'fee',
      'Fee',
    ],
    0
  );

  const isAppointmentReq = getValue(
    item,
    [
      'isAppointmentReq',
      'IsAppointmentReq',
      'is_AppointmentReq',
      'Is_AppointmentReq',
      'appointmentRequired',
      'AppointmentRequired',
    ],
    false
  );

  return {
    id: getValue(item, ['id', 'Id', 'ID', 'serviceId', 'ServiceId', 'RecID'], index),
    serviceName: String(serviceName),
    department: String(department || 'Lab'),
    rate: Number(rate) || 0,
    isAppointmentReq: Boolean(isAppointmentReq),
    raw: item,
  };
};

const normalizeReport = (item, index) => {
  return {
    id: getValue(item, ['id', 'Id', 'ID'], index),

    ptid: getValue(
      item,
      [
        'ptid',
        'PTID',
        'Ptid',
        'patientTestId',
        'PatientTestId',
        'Patient_Test_ID',
      ],
      ''
    ),

    department: getValue(item, ['department', 'Department', 'dept', 'Dept', 'OPD', 'opd'], 'Lab'),

    test_Desc: getValue(
      item,
      [
        'test_Desc',
        'Test_Desc',
        'TEST_DESC',
        'testDesc',
        'TestDesc',
        'service_Requested',
        'Service_Requested',
        'serviceRequested',
        'ServiceRequested',
        'testName',
        'TestName',
        'description',
        'Description',
      ],
      'Laboratory Test'
    ),

    visit_Date: getValue(
      item,
      [
        'visit_Date',
        'Visit_Date',
        'VISIT_DATE',
        'visitDate',
        'VisitDate',
        'test_Date',
        'Test_Date',
        'date',
        'Date',
      ],
      ''
    ),

    raw: item,
  };
};

const normalizeNews = (item, index) => {
  const hasTitle =
    item &&
    (item.Title !== undefined ||
      item.title !== undefined ||
      item.NewsTitle !== undefined ||
      item.newsTitle !== undefined ||
      item.Heading !== undefined ||
      item.heading !== undefined);

  const title = hasTitle
    ? getValue(item, ['Title', 'title', 'NewsTitle', 'newsTitle', 'Heading', 'heading'], 'PINUM Update')
    : getValue(item, ['Description', 'description'], 'PINUM Update');

  const description = hasTitle
    ? getValue(item, ['Description', 'description', 'Details', 'details', 'Linkdesc', 'linkdesc', 'LinkDesc', 'linkDesc'], '')
    : getValue(item, ['Linkdesc', 'linkdesc', 'LinkDesc', 'linkDesc', 'Details', 'details'], '');

  return {
    id: getValue(item, ['RecID', 'recID', 'id', 'Id', 'ID', 'NewsId', 'newsId'], index),
    title: String(title),
    description: String(description),
    publishDate: getValue(
      item,
      ['PublishDate', 'publishDate', 'Date', 'date', 'CreatedDate', 'createdDate', 'NewsDate', 'newsDate'],
      ''
    ),
    downloadLink: getValue(
      item,
      ['DownloadLink', 'downloadLink', 'FilePath', 'filePath', 'DocumentPath', 'documentPath', 'Attachment', 'attachment'],
      ''
    ),
    isActive: getValue(item, ['IsActive', 'isActive'], true),
    newsArticleType: getValue(item, ['NewsArticleType', 'newsArticleType'], 0),
    raw: item,
  };
};

const normalizeTiming = (item) => {
  if (!item) return null;

  return {
    recID: getValue(item, ['recID', 'RecID', 'id', 'Id'], 0),
    timeDescription: getValue(item, ['timeDescription', 'TimeDescription'], ''),
    normalDaysEnglish: getValue(item, ['normalDaysEnglish', 'NormalDaysEnglish'], ''),
    normalDaysUrdu: getValue(item, ['normalDaysUrdu', 'NormalDaysUrdu'], ''),
    normalTiming: getValue(item, ['normalTiming', 'NormalTiming'], ''),
    fridayEnglish: getValue(item, ['fridayEnglish', 'FridayEnglish'], ''),
    fridayUrdu: getValue(item, ['fridayUrdu', 'FridayUrdu'], ''),
    fridayBreak: getValue(item, ['fridayBreak', 'FridayBreak'], ''),
    holidayNote: getValue(item, ['holidayNote', 'HolidayNote'], ''),
    discountNotice: getValue(item, ['discountNotice', 'DiscountNotice'], ''),
    importantInstructions: getValue(item, ['importantInstructions', 'ImportantInstructions'], ''),
    isActive: getValue(item, ['isActive', 'IsActive'], false),
    raw: item,
  };
};

// ======================================================
// LAB RATES
// ======================================================

export const fetchLabRates = async () => {
  const data = await apiRequest(
    `${BASE_URL}/services/GetRates`,
    {
      method: 'GET',
      headers: defaultHeaders,
    },
    []
  );

  const arrayData = Array.isArray(data) ? data : [];
  return arrayData.map((item, index) => normalizeRate(item, index));
};

// ======================================================
// LOGIN
// ======================================================

export const loginUser = async (username, password, captcha) => {
  const cleanUsername = String(username || '').trim();
  const cleanPassword = String(password || '').trim();

  const data = await apiRequest(
    `${BASE_URL}/Auth/login`,
    {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        username: cleanUsername,
        password: cleanPassword,
        captchaStr: captcha ? String(captcha).trim() : '',
        rememberMe: true,
        remeberMe: true,
      }),
    },
    {}
  );

  return {
    ...data,
    token: data?.token || data?.jwtToken || data?.accessToken || '',
    username: data?.username || data?.prn || data?.PRN || data?.registrationNumber || cleanUsername,
    prn: data?.prn || data?.PRN || data?.username || cleanUsername,
  };
};

// ======================================================
// PATIENT REPORTS
// ======================================================

export const fetchPatientReports = async (token, prn = null) => {
  if (!prn) {
    throw new Error('PRN missing. Please login again.');
  }

  const queryString = buildQueryString({
    PRN: prn,
  });

  const data = await apiRequest(
    `${BASE_URL}/PatientTests${queryString}`,
    {
      method: 'GET',
      headers: cleanHeaders({
        ...defaultHeaders,
        Authorization: token ? `Bearer ${token}` : '',
      }),
    },
    []
  );

  const arrayData = Array.isArray(data) ? data : [];
  return arrayData.map((item, index) => normalizeReport(item, index));
};

// ======================================================
// REPORT DETAILS
// ======================================================

export const fetchReportDetails = async (token, ptid, department, testDesc, prn = null) => {
  const queryString = buildQueryString({
    PTID: ptid,
    Department: department,
    TestDesc: testDesc,
    PRN: prn,
  });

  const data = await apiRequest(
    `${BASE_URL}/PatientTests/testresult${queryString}`,
    {
      method: 'GET',
      headers: cleanHeaders({
        ...defaultHeaders,
        Authorization: token ? `Bearer ${token}` : '',
      }),
    },
    null
  );

  return data;
};

// ======================================================
// DOWNLOAD REPORT PDF
// ======================================================

export const getReportDownloadUrl = (ptid, dept, testDesc, prn = null) => {
  const queryString = buildQueryString({
    PTID: ptid,
    Department: dept,
    TestDesc: testDesc,
    PRN: prn,
    t: Date.now(),
  });

  return `${BASE_URL}/PatientTests/download-report${queryString}`;
};

export const downloadReportPDF = async (token, ptid, dept, testDesc, prn = null) => {
  const url = getReportDownloadUrl(ptid, dept, testDesc, prn);

  const response = await fetchWithTimeout(
    url,
    {
      method: 'GET',
      headers: cleanHeaders({
        ...pdfHeaders,
        Authorization: token ? `Bearer ${token}` : '',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      }),
    },
    NETWORK_TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(`PDF Download Failed (HTTP Status ${response.status})`);
  }

  return url;
};

// ======================================================
// USER LOGOUT & SESSION TERMINATION (M3 · CWE-613)
// ======================================================

export const logoutUser = async (token) => {
  try {
    if (token) {
      await fetchWithTimeout(
        `${BASE_URL}/Auth/logout`,
        {
          method: 'POST',
          headers: cleanHeaders({
            ...defaultHeaders,
            Authorization: `Bearer ${token}`,
          }),
        },
        3000
      ).catch(() => {});
    }
  } catch (e) {
    // Suppress network logout errors on client
  }
  return true;
};

// ======================================================
// DEPARTMENTS
// ======================================================

export const fetchDepartments = async () => {
  try {
    const data = await apiRequest(
      `${BASE_URL}/HospitalContent/departments`,
      {
        method: 'GET',
        headers: defaultHeaders,
      },
      []
    );

    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
};

// ======================================================
// EXPERTS / DOCTORS
// ======================================================

export const fetchExpertsByDepartment = async (departmentId) => {
  try {
    const data = await apiRequest(
      `${BASE_URL}/HospitalContent/departments/${encodeURIComponent(departmentId)}/experts`,
      {
        method: 'GET',
        headers: defaultHeaders,
      },
      []
    );

    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
};

// ======================================================
// NEWS
// ======================================================

export const fetchNews = async () => {
  try {
    const data = await apiRequest(
      `${BASE_URL}/HospitalContent/news`,
      {
        method: 'GET',
        headers: defaultHeaders,
      },
      []
    );

    const arrayData = Array.isArray(data) ? data : [];

    return arrayData
      .map((item, index) => normalizeNews(item, index))
      .filter((item) => item.isActive === true || item.isActive === 'true' || item.isActive === 1);
  } catch (error) {
    return [];
  }
};

// ======================================================
// HOSPITAL TIMING
// ======================================================

export const fetchHospitalTimings = async () => {
  try {
    const data = await apiRequest(
      `${BASE_URL}/HospitalContent/hospital-timing`,
      {
        method: 'GET',
        headers: defaultHeaders,
      },
      null
    );

    return normalizeTiming(data);
  } catch (error) {
    return null;
  }
};

// ======================================================
// POPUP NOTIFICATION
// ======================================================

export const fetchPopupNotification = async () => {
  try {
    const data = await apiRequest(
      `${BASE_URL}/HospitalContent/popup`,
      {
        method: 'GET',
        headers: defaultHeaders,
      },
      null
    );

    return data;
  } catch (error) {
    return null;
  }
};

// ======================================================
// MOBILE APP SLIDER & GALLERY API
// ======================================================

export const fetchAppSlider = async () => {
  try {
    const data = await apiRequest(
      `${BASE_URL}/MobileApp/slider`,
      {
        method: 'GET',
        headers: defaultHeaders,
      },
      []
    );

    const arrayData = Array.isArray(data) ? data : [];

    return arrayData.map((item) => {
      if (item && item.image) {
        return {
          ...item,
          image: normalizeApiImageUrl(item.image),
        };
      }
      return item;
    });
  } catch (error) {
    return [];
  }
};

export const fetchAppGallery = async () => {
  try {
    const data = await apiRequest(
      `${BASE_URL}/MobileApp/gallery`,
      {
        method: 'GET',
        headers: defaultHeaders,
      },
      []
    );

    const arrayData = Array.isArray(data) ? data : [];

    return arrayData.map((item) => {
      if (item && item.uri) {
        return {
          ...item,
          uri: normalizeApiImageUrl(item.uri),
        };
      }
      return item;
    });
  } catch (error) {
    return [];
  }
};