// client/src/utils/fingerprintService.js
import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise;

export const initFingerprint = async () => {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  const fp = await fpPromise;
  const result = await fp.get();
  return result.visitorId;
};

export const getExtendedDeviceInfo = async () => {
  const fpInstance = await fpPromise;
  const result = await fpInstance.get({
    extendedResult: true
  });

  const navigator = window.navigator;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  return {
    visitorId: result.visitorId,
    hardware: {
      cpu: {
        cores: navigator.hardwareConcurrency,
        architecture: result.components.platform.value
      },
      gpu: await getGPUInfo(),
      ram: navigator.deviceMemory,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelDepth: window.screen.pixelDepth,
        orientation: window.screen.orientation?.type
      }
    },
    network: {
      connection: connection ? {
        type: connection.type,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      } : null,
      ip: result.ip,
      hostname: window.location.hostname
    },
    browser: {
      name: result.components.userAgent.browser.name,
      version: result.components.userAgent.browser.version,
      engine: result.components.userAgent.engine.name,
      languages: navigator.languages,
      plugins: Array.from(navigator.plugins).map(p => ({
        name: p.name,
        description: p.description
      }))
    },
    os: {
      name: result.components.userAgent.os.name,
      version: result.components.userAgent.os.version,
      platform: navigator.platform
    },
    fingerprints: {
      canvas: result.components.canvas.value,
      audio: await getAudioFingerprint(),
      webgl: await getWebGLFingerprint(),
      fonts: result.components.fonts.value
    }
  };
};

async function getGPUInfo() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    return { vendor: 'unknown', renderer: 'unknown' };
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (!debugInfo) {
    return { vendor: 'unknown', renderer: 'unknown' };
  }

  return {
    vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
    renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
  };
}

async function getAudioFingerprint() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const oscillator = audioContext.createOscillator();
    const dynamicsCompressor = audioContext.createDynamicsCompressor();

    analyser.maxDecibels = -25;
    analyser.minDecibels = -60;
    analyser.fftSize = 1024;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

    oscillator.connect(dynamicsCompressor);
    dynamicsCompressor.connect(analyser);
    analyser.connect(audioContext.destination);

    oscillator.start(0);

    const fingerprint = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(fingerprint);

    oscillator.stop();
    audioContext.close();

    return Array.from(fingerprint).join(',');
  } catch (e) {
    return null;
  }
}

async function getWebGLFingerprint() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  
  if (!gl) return null;

  const vertices = new Float32Array([
    -0.5, 0.5, 0.0,
    -0.5, -0.5, 0.0,
    0.5, -0.5, 0.0,
  ]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  return canvas.toDataURL();
}

export default getExtendedDeviceInfo;
