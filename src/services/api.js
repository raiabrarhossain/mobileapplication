import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ======================================================
// PINUM API CONFIGURATION - LOCAL + LIVE FINAL VERSION
// ======================================================
// LOCAL_PROXY: Android emulator/local development through http://10.0.2.2:3000
// LIVE_DIRECT: Final production APK through https://pinum.org.pk/api

const getExpoHostIp = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
  if (!hostUri) return '';
  return hostUri.split(':')[0];
};

const getLocalProxyBaseUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3000';

  // For Android emulator loopback to host
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
};

const API_MODE = 'LOCAL_PROXY';

const API_CONFIG = {
  LOCAL_PROXY: {
    BASE_URL: `${getLocalProxyBaseUrl()}/api`,
    FILE_BASE_URL: getLocalProxyBaseUrl(),
  },
  LIVE_DIRECT: {
    BASE_URL: 'https://www.pinum.org.pk/api',
    FILE_BASE_URL: 'https://www.pinum.org.pk',
  },
};

const ACTIVE_CONFIG = API_CONFIG[API_MODE];

const BASE_URL = ACTIVE_CONFIG.BASE_URL;
const FILE_BASE_URL = ACTIVE_CONFIG.FILE_BASE_URL;

const PUBLIC_HTTPS_TEST_API_URL = 'https://jsonplaceholder.typicode.com/todos/1';
const NETWORK_TIMEOUT_MS = 20000;

console.log('PINUM API_MODE:', API_MODE);
console.log('PINUM ACTIVE BASE_URL:', BASE_URL);
console.log('PINUM ACTIVE FILE_BASE_URL:', FILE_BASE_URL);

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
    console.log('JSON Parse Error:', error);
    console.log('Raw Response:', text);
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

// ======================================================
// MAIN API REQUEST
// ======================================================

const apiRequest = async (url, options = {}, fallbackValue = null) => {
  const startedAt = Date.now();
  const method = String(options?.method || 'GET').toUpperCase();

  const requestHeaders = cleanHeaders({
    ...getMethodDefaultHeaders(method),
    ...(options.headers || {}),
  });

  try {
    console.log('================ API REQUEST START ================');
    console.log('API MODE:', API_MODE);
    console.log('API URL:', url);
    console.log('API METHOD:', method);
    console.log('API HEADERS:', requestHeaders);

    if (options?.body) {
      console.log('API BODY:', options.body);
    }

    const response = await fetchWithTimeout(
      url,
      {
        ...options,
        method,
        headers: requestHeaders,
      },
      NETWORK_TIMEOUT_MS
    );

    const durationMs = Date.now() - startedAt;

    console.log('================ API RESPONSE RECEIVED ================');
    console.log('API URL:', url);
    console.log('API STATUS:', response.status);
    console.log('API OK:', response.ok);
    console.log('API DURATION MS:', durationMs);

    const responseText = await response.text();

    console.log('API RESPONSE LENGTH:', responseText?.length || 0);
    console.log('API RESPONSE START:', responseText?.substring(0, 1000));

    const data = parseJsonSafely(responseText, fallbackValue);

    if (!response.ok) {
      const message =
        data?.message ||
        data?.title ||
        data?.error ||
        responseText ||
        `API Error ${response.status}`;

      throw new Error(message);
    }

    return data;
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    console.log('================ API REQUEST FAILED ================');
    console.log('FAILED API MODE:', API_MODE);
    console.log('FAILED API URL:', url);
    console.log('FAILED API METHOD:', method);
    console.log('FAILED API DURATION MS:', durationMs);
    console.log('FAILED ERROR MESSAGE:', error?.message);

    throw error;
  }
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
    return path;
  }

  path = path.replace('lib/assets/', 'lib/Assets/');
  path = path.replace('Lib/Assets/', 'lib/Assets/');
  path = path.replace('LIB/ASSETS/', 'lib/Assets/');

  if (path.startsWith('/')) {
    return `${FILE_BASE_URL}${path}`;
  }

  return `${FILE_BASE_URL}/${path}`;
};

export const buildNewsAttachmentUrl = (downloadLink) => {
  if (!downloadLink) return null;

  const cleanLink = String(downloadLink).trim();
  if (!cleanLink) return null;

  if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
    return cleanLink;
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
  const data = await apiRequest(
    `${BASE_URL}/Auth/login`,
    {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        username,
        password,
        captchaStr: captcha,
        rememberMe: true,
        remeberMe: true,
      }),
    },
    {}
  );

  return data || {};
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

  console.log('PDF DIRECT DOWNLOAD URL:', url);
  console.log('PDF PTID:', ptid);
  console.log('PDF Department:', dept);
  console.log('PDF TestDesc:', testDesc);
  console.log('PDF PRN:', prn);

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

  console.log('PDF API STATUS:', response.status);
  console.log('PDF CONTENT TYPE:', response.headers.get('content-type'));
  console.log('PDF CONTENT LENGTH:', response.headers.get('content-length'));

  if (!response.ok) {
    const errorText = await response.text();
    console.log('PDF ERROR RESPONSE:', errorText);
    throw new Error(`PDF Download Failed ${response.status}: ${errorText}`);
  }

  return url;
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
    console.log('Departments Error:', error?.message || error);
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
    console.log('Experts Error:', error?.message || error);
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
    console.log('News Error:', error?.message || error);
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
    console.log('Hospital Timing Error:', error?.message || error);
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
    console.log('Popup Error:', error?.message || error);
    return null;
  }
};

// ======================================================
// DIAGNOSTICS
// ======================================================

const diagnosticFetch = async (test) => {
  const startedAt = Date.now();

  try {
    console.log('--------------------------------------------------');
    console.log(`TEST START: ${test.name}`);
    console.log(`TEST URL: ${test.url}`);

    const response = await fetchWithTimeout(
      test.url,
      {
        method: test.method || 'GET',
        headers: cleanHeaders({
          ...defaultHeaders,
          Accept: test.accept || defaultHeaders.Accept,
          ...(test.headers || {}),
        }),
      },
      NETWORK_TIMEOUT_MS
    );

    const text = await response.text();
    const durationMs = Date.now() - startedAt;

    const result = {
      name: test.name,
      url: test.url,
      success: response.ok,
      status: response.status,
      durationMs,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      server: response.headers.get('server'),
      location: response.headers.get('location'),
      responseStart: text.substring(0, 300),
    };

    console.log('TEST RESULT:', result);
    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    const result = {
      name: test.name,
      url: test.url,
      success: false,
      status: null,
      durationMs,
      errorName: error?.name,
      errorMessage: error?.message,
    };

    console.log('TEST FAILED RESULT:', result);
    return result;
  }
};

export const runPinumApiDiagnostics = async () => {
  const tests = [
    {
      name: 'Public HTTPS Test',
      url: PUBLIC_HTTPS_TEST_API_URL,
      method: 'GET',
    },
    {
      name: 'Active BASE_URL Lab Rates',
      url: `${BASE_URL}/services/GetRates`,
      method: 'GET',
    },
    {
      name: 'PINUM Live Lab Rates',
      url: 'https://pinum.org.pk/api/services/GetRates',
      method: 'GET',
    },
    {
      name: 'PINUM Live Departments',
      url: 'https://pinum.org.pk/api/HospitalContent/departments',
      method: 'GET',
    },
  ];

  console.log('================ PINUM API DIAGNOSTICS START ================');
  console.log('DIAGNOSTIC API_MODE:', API_MODE);
  console.log('DIAGNOSTIC BASE_URL:', BASE_URL);
  console.log('DIAGNOSTIC FILE_BASE_URL:', FILE_BASE_URL);

  const results = [];

  for (const test of tests) {
    const result = await diagnosticFetch(test);
    results.push(result);
  }

  console.log('================ PINUM API DIAGNOSTICS FINAL RESULTS ================');
  console.log(JSON.stringify(results, null, 2));

  return results;
};

export const testLiveConnection = async () => {
  const urls = [
    PUBLIC_HTTPS_TEST_API_URL,
    `${FILE_BASE_URL}`,
    `${BASE_URL}/services/GetRates`,
    `${BASE_URL}/HospitalContent/news`,
    `${BASE_URL}/HospitalContent/departments`,
    'https://pinum.org.pk/api/services/GetRates',
  ];

  const results = [];

  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: defaultHeaders,
        },
        NETWORK_TIMEOUT_MS
      );

      const text = await response.text();

      results.push({
        url,
        success: response.ok,
        status: response.status,
        contentType: response.headers.get('content-type'),
        location: response.headers.get('location'),
        responseStart: text.substring(0, 200),
      });
    } catch (error) {
      results.push({
        url,
        success: false,
        status: null,
        errorName: error?.name,
        errorMessage: error?.message,
      });
    }
  }

  console.log('CONNECTION TEST FINAL RESULTS:', JSON.stringify(results, null, 2));

  return results;
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
    console.log('fetchAppSlider Error:', error?.message || error);
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
    console.log('fetchAppGallery Error:', error?.message || error);
    return [];
  }
};