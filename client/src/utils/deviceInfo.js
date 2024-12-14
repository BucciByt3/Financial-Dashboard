// client/src/utils/deviceInfo.js
const generateUniqueHardwareId = async () => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency,
    navigator.deviceMemory,
    screen.colorDepth,
    screen.pixelDepth,
    screen.width + 'x' + screen.height,
    gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
    gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
    new Date().getTimezoneOffset()
  ];

  // Get audio context fingerprint
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    oscillator.connect(analyser);
    const timeData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(timeData);
    components.push(timeData.join(''));
    audioContext.close();
  } catch (e) {
    console.log('Audio fingerprinting not available');
  }

  // Get canvas fingerprint
  const canvasFingerprint = document.createElement('canvas');
  const ctx = canvasFingerprint.getContext('2d');
  ctx.textBaseline = "top";
  ctx.font = "14px 'Arial'";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f60";
  ctx.fillRect(125,1,62,20);
  ctx.fillStyle = "#069";
  ctx.fillText("Hello, world!", 2, 15);
  ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
  ctx.fillText("Hello, world!", 4, 17);
  components.push(canvasFingerprint.toDataURL());

  // Create a string from all components and hash it
  const hardwareString = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(hardwareString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

export const getDeviceInfo = async () => {
  const hardwareId = await generateUniqueHardwareId();

  const info = {
    browser: navigator.userAgent,
    os: navigator.platform,
    language: navigator.language,
    vendor: navigator.vendor,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hardwareId: hardwareId,
    hardwareInfo: {
      cores: navigator.hardwareConcurrency || 'unknown',
      memory: navigator.deviceMemory || 'unknown',
      platform: navigator.platform,
      gpu: {
        renderer: getGPUInfo('renderer'),
        vendor: getGPUInfo('vendor')
      },
      plugins: getPlugins(),
      audio: getAudioFingerprint(),
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        orientation: screen.orientation?.type || 'unknown'
      }
    }
  };

  // Try to get network interfaces
  try {
    const networkInterfaces = await navigator.mediaDevices?.enumerateDevices();
    info.networkDevices = networkInterfaces?.map(device => ({
      id: device.deviceId,
      kind: device.kind,
      label: device.label
    }));
  } catch (e) {
    console.log('Network interfaces not available');
    info.networkDevices = [];
  }

  return info;
};

function getGPUInfo(type) {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    return gl.getParameter(
      type === 'renderer' 
        ? debugInfo.UNMASKED_RENDERER_WEBGL 
        : debugInfo.UNMASKED_VENDOR_WEBGL
    );
  } catch (e) {
    return 'unknown';
  }
}

function getPlugins() {
  if (!navigator.plugins) return [];
  
  return Array.from(navigator.plugins).map(plugin => ({
    name: plugin.name,
    description: plugin.description,
    filename: plugin.filename
  }));
}

function getAudioFingerprint() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    oscillator.connect(analyser);
    const timeData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(timeData);
    audioContext.close();
    return Array.from(timeData.slice(0, 10)); // Return first 10 values as fingerprint
  } catch (e) {
    return null;
  }
}

export default getDeviceInfo;

