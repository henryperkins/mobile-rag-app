export default {
  Value: class Value {},
  event: () => {},
  add: () => {},
  eq: () => {},
  set: () => {},
  cond: () => {},
  interpolate: () => {},
  View: "View",
  Text: "Text",
  Image: "Image",
  ScrollView: "ScrollView",
};

export const call = () => {};
export const useSharedValue = (value: any) => ({ value });
export const useAnimatedStyle = (style: any) => style;
export const withSpring = (value: any, _config?: any) => value;
export const withTiming = (value: any, _config?: any) => value;
export const runOnJS = (fn: Function) => fn;