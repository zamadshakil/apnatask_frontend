const React = require('react');
const { View } = require('react-native');

// Mock all lucide-react-native icons dynamically as simple react-native View components
module.exports = new Proxy({}, {
  get: (target, prop) => {
    return (props) => React.createElement(View, props);
  }
});
