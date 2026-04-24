function parseUserAgent(userAgent) {
  if (!userAgent) {
    return {
      device: 'unknown',
      browser: '',
      os: ''
    };
  }

  const ua = userAgent.toLowerCase();
  
  let device = 'desktop';
  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    if (/ipad|tablet/i.test(ua) || (!/mobile/i.test(ua) && /android/i.test(ua))) {
      device = 'tablet';
    } else {
      device = 'mobile';
    }
  }

  let browser = '';
  if (/edg\/|edge\//i.test(ua)) {
    const match = ua.match(/edg\/([\d.]+)/) || ua.match(/edge\/([\d.]+)/);
    browser = `Edge ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/chrome\/|crios\//i.test(ua)) {
    const match = ua.match(/chrome\/([\d.]+)/) || ua.match(/crios\/([\d.]+)/);
    browser = `Chrome ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/firefox\/|fxios\//i.test(ua)) {
    const match = ua.match(/firefox\/([\d.]+)/) || ua.match(/fxios\/([\d.]+)/);
    browser = `Firefox ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/safari\//i.test(ua) && !/chrome|crios|edg|edge/i.test(ua)) {
    const match = ua.match(/version\/([\d.]+)/);
    browser = `Safari ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/opera\/|opr\//i.test(ua)) {
    const match = ua.match(/opr\/([\d.]+)/) || ua.match(/version\/([\d.]+)/);
    browser = `Opera ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/msie|trident/i.test(ua)) {
    const match = ua.match(/msie ([\d.]+)/) || ua.match(/rv:([\d.]+)/);
    browser = `IE ${match ? match[1].split('.')[0] : ''}`.trim();
  }

  let os = '';
  if (/windows nt/i.test(ua)) {
    const match = ua.match(/windows nt ([\d.]+)/);
    if (match) {
      const version = match[1];
      if (version === '10.0' || version === '11.0') {
        os = 'Windows 10/11';
      } else if (version === '6.3') {
        os = 'Windows 8.1';
      } else if (version === '6.2') {
        os = 'Windows 8';
      } else if (version === '6.1') {
        os = 'Windows 7';
      } else {
        os = 'Windows';
      }
    } else {
      os = 'Windows';
    }
  } else if (/mac os x|macintosh/i.test(ua)) {
    const match = ua.match(/mac os x ([\d_]+)/);
    if (match) {
      const version = match[1].replace(/_/g, '.');
      const parts = version.split('.');
      os = `macOS ${parts[0]}.${parts[1] || '0'}`;
    } else {
      os = 'macOS';
    }
  } else if (/android/i.test(ua)) {
    const match = ua.match(/android ([\d.]+)/);
    os = `Android ${match ? match[1] : ''}`.trim();
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    const match = ua.match(/os ([\d_]+) like mac os/);
    if (match) {
      const version = match[1].replace(/_/g, '.');
      const parts = version.split('.');
      os = `iOS ${parts[0]}.${parts[1] || '0'}`;
    } else {
      os = 'iOS';
    }
  } else if (/linux/i.test(ua) && !/android/i.test(ua)) {
    os = 'Linux';
  }

  return {
    device,
    browser,
    os
  };
}

function getDeviceLabel(device) {
  switch (device) {
    case 'mobile':
      return '手机';
    case 'tablet':
      return '平板';
    case 'desktop':
      return '电脑';
    default:
      return '未知设备';
  }
}

function getDeviceColor(device) {
  switch (device) {
    case 'mobile':
      return '#fa8c16';
    case 'tablet':
      return '#722ed1';
    case 'desktop':
      return '#1890ff';
    default:
      return '#999';
  }
}

module.exports = {
  parseUserAgent,
  getDeviceLabel,
  getDeviceColor
};
