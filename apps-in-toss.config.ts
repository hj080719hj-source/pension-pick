import {defineConfig} from '@apps-in-toss/web-framework/config';
export default defineConfig({
  appName: 'pension-pick',
  brand: {primaryColor:'#3678f6'},
  permissions: [],
  webBundleDir: 'build',
  webView: {pullToRefreshEnabled:false, allowsBackForwardNavigationGestures:false, overScrollMode:'never'}
});
