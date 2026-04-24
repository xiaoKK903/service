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

export {
  getDeviceLabel,
  getDeviceColor
};
